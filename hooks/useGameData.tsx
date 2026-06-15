'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  doc, setDoc, onSnapshot, collection, getDocs, getDoc,
  increment, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DailyLog, UserStats, MoodCheckIn, KeyMoment, CustomSideQuestEntry, CarriedRoutineItem, Pillar, CigaretteEntry, CigaretteContext, SmokingPhase, GhostLogEntryV2, HonestFailureEntry } from '@/types'
import {
  todayKey,
  XP_VALUES,
  getISOWeekKey,
  getLevelFromXP,
  getMonthKey,
  MAX_MOOD_CHECKINS_PER_DAY,
} from '@/lib/gameLogic'
import { MORNING_ROUTINE, MORNING_MINIMUM } from '@/lib/routineData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { DAILY_QUESTS_POOL, SIDE_QUESTS } from '@/lib/questData'
import { APRIL_QUESTS } from '@/lib/seasonal/aprilData'
import { DailyLogSchema, UserStatsSchema, parseSafe } from '@/lib/schemas'
import { useToast } from '@/components/ToastProvider'
import { useAchievementUnlock } from '@/components/AchievementUnlockModal'
import { useLevelUp } from '@/components/LevelUpModal'

const DEFAULT_STATS: UserStats = {
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalDaysLogged: 0,
  totalRoutinesCompleted: 0,
  totalQuestsCompleted: 0,
  totalSideQuestsCompleted: 0,
  totalRulesKept: 0,
  pillarXP: {
    pozycja: 0, cialo: 0, styl: 0,
    kapital: 0, kariera: 0, tozsamosc: 0, milosc: 0,
  },
  unlockedAchievements: [],
  lastStreakDate: null,
  streakFreezeUsedMonths: [],
  reviewedWeeks: [],
  reviewedMonths: [],
  reviewedQuarters: [],
  completedHeartBlocks: [],
  pillarBalanceWeeks: [],
  totalGhostProtocols: 0,
  consecutiveGhostDays: 0,
  lastGhostDate: null,
  highestDayXP: 0,
  consecutiveNormalDays: 0,
  lastNormalDay: null,
  consecutivePerfectMornings: 0,
  lastPerfectMorningDate: null,
  lastReturnCeremonyDate: null,
}

const ALL_PILLARS: Pillar[] = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc']

// ── Zapis statystyk odporny na równoległe zapisy ───────────────────────
// Pola ADYTYWNE (totalXP, pillarXP, liczniki akcji) zapisujemy jako
// FieldValue.increment(delta) zamiast wartości bezwzględnej liczonej ze
// (potencjalnie nieświeżego) snapshotu Reacta. Dzięki temu równoległy zapis
// — drugie urządzenie albo XP z Learning Vault przez /api/external/xp (które
// JUŻ używa increment) — sumuje się, zamiast po cichu się nadpisywać i gubić XP.
// Pola POCHODNE (streak, achievementy, dayMode-zależne liczniki dni, rejestry
// tygodni) zostają bezwzględne: pisze je tylko klient i odbudowuje recoverStats.
// `final` jest liczone z `base` przez czyste dodawanie, więc (final − base) to
// dokładnie delta tej akcji, niezależna od bazy — bezpieczna jako increment.
function buildStatsWrite(base: UserStats, final: UserStats): Record<string, unknown> {
  const out: Record<string, unknown> = { ...final }
  out.totalXP = increment((final.totalXP ?? 0) - (base.totalXP ?? 0))
  const pillarInc: Record<string, unknown> = {}
  for (const p of ALL_PILLARS) {
    pillarInc[p] = increment((final.pillarXP[p] ?? 0) - (base.pillarXP[p] ?? 0))
  }
  out.pillarXP = pillarInc
  out.totalRoutinesCompleted   = increment((final.totalRoutinesCompleted ?? 0)   - (base.totalRoutinesCompleted ?? 0))
  out.totalQuestsCompleted     = increment((final.totalQuestsCompleted ?? 0)     - (base.totalQuestsCompleted ?? 0))
  out.totalSideQuestsCompleted = increment((final.totalSideQuestsCompleted ?? 0) - (base.totalSideQuestsCompleted ?? 0))
  out.totalRulesKept           = increment((final.totalRulesKept ?? 0)           - (base.totalRulesKept ?? 0))
  return out
}

// ── Jednorazowa korekta XP questów ─────────────────────────────────────
// Questy sezonowe były naliczane jako płaskie 50 zamiast realnej wartości q.xp.
// Naprawiamy naliczanie na przyszłość, a dla questów odhaczonych jeszcze starym
// kodem wyrównujemy różnicę (q.xp − 50) — WYŁĄCZNIE w dniu wdrożenia poprawki,
// żeby nie ruszać przeszłości ani nie podwajać questów liczonych już poprawnie.
const QUEST_XP_FIX_DATE = '2026-06-07'
const SEASONAL_QUEST_XP: Record<string, { pillar: Pillar; xp: number }> = {}
for (const q of APRIL_QUESTS) SEASONAL_QUEST_XP[q.id] = { pillar: q.pillar as Pillar, xp: q.xp }

export function useGameData() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { showAchievementUnlock } = useAchievementUnlock()
  const { showLevelUp } = useLevelUp()
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDateKey, setCurrentDateKey] = useState<string>(todayKey())
  const statsLoadedRef = useRef(false)
  const questXpFixDoneRef = useRef<string | null>(null)

  // Refresh currentDateKey when the effective day rolls over (after DAY_START_HOUR).
  useEffect(() => {
    const check = () => {
      const now = todayKey()
      setCurrentDateKey(prev => (prev !== now ? now : prev))
    }
    const interval = setInterval(check, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  const statsRef = user ? doc(db, 'users', user.uid, 'data', 'stats') : null
  const todayRef = user ? doc(db, 'users', user.uid, 'logs', currentDateKey) : null

  useEffect(() => {
    if (!user || !statsRef || !todayRef) { setLoading(false); return }

    let unsub1: () => void
    let unsub2: () => void

    unsub1 = onSnapshot(statsRef,
      (snap) => {
        if (snap.exists()) {
          const raw = snap.data()
          const parsed = parseSafe(UserStatsSchema, { ...DEFAULT_STATS, ...raw }, DEFAULT_STATS, 'UserStats')
          // If the parsed XP differs from the raw one, the value was corrupt and got fixed — write it back.
          const rawXP = (raw as { totalXP?: unknown }).totalXP
          if (!Number.isFinite(rawXP) || (rawXP as number) < 0) {
            setDoc(statsRef!, { totalXP: parsed.totalXP }, { merge: true })
          }
          setStats(parsed)
          statsLoadedRef.current = true
        } else {
          setDoc(statsRef!, DEFAULT_STATS)
        }
      },
      (err) => { addToast({ message: 'Błąd ładowania statystyk. Odśwież stronę.', type: 'error' }); setLoading(false) }
    )

    const emptyDailyLog: DailyLog = {
      date: currentDateKey,
      completedRoutine: [],
      completedDailyQuests: [],
      completedSideQuests: [],
      keptRules: [],
      totalXP: 0,
      dayMode: 'normal',
    }

    unsub2 = onSnapshot(todayRef,
      (snap) => {
        if (snap.exists()) {
          const raw = snap.data()
          // Merge defaults beneath raw so missing fields (legacy docs) get safe values.
          const parsed = parseSafe(
            DailyLogSchema,
            { ...emptyDailyLog, ...raw },
            emptyDailyLog,
            `DailyLog ${currentDateKey}`,
          )
          setTodayLog(parsed)
          // Heal corrupt totalXP in-place so the bad value doesn't come back next read.
          const rawXP = (raw as { totalXP?: unknown }).totalXP
          if (!Number.isFinite(rawXP) || (rawXP as number) < 0) {
            setDoc(doc(db, 'users', user!.uid, 'logs', currentDateKey), { totalXP: parsed.totalXP }, { merge: true })
          }
        } else {
          setTodayLog(emptyDailyLog)
        }
        setLoading(false)
      },
      (err) => { addToast({ message: 'Błąd ładowania danych dnia. Odśwież stronę.', type: 'error' }); setLoading(false) }
    )

    return () => { unsub1?.(); unsub2?.() }
  }, [user?.uid, currentDateKey])

  // ── Jednorazowe wyrównanie XP questów (tylko w dniu wdrożenia) ─────────
  // Dla questów odhaczonych jeszcze starym kodem (płaskie 50) dodaje różnicę
  // do realnego q.xp. Idempotentne: flaga `questXpAdjusted` w logu dnia +
  // ref blokujący ponowne wejście w tej samej sesji. Bramka na datę gwarantuje,
  // że nie ruszy przeszłości ani questów liczonych już poprawnie w przyszłości.
  useEffect(() => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    if (!statsLoadedRef.current) return
    if (currentDateKey !== QUEST_XP_FIX_DATE) return
    if (todayLog.questXpAdjusted) return
    if (questXpFixDoneRef.current === currentDateKey) return
    questXpFixDoneRef.current = currentDateKey

    const mult = todayLog.dayMode === 'minimum' ? 2 : 1
    const pillarDelta: Partial<Record<Pillar, number>> = {}
    let totalDelta = 0
    for (const id of (todayLog.completedDailyQuests ?? [])) {
      const q = SEASONAL_QUEST_XP[id]
      if (!q) continue
      const d = (q.xp - XP_VALUES.dailyQuest) * mult
      if (d === 0) continue
      totalDelta += d
      pillarDelta[q.pillar] = (pillarDelta[q.pillar] ?? 0) + d
    }

    if (totalDelta === 0) {
      // Nic do wyrównania — tylko oznacz dzień, by nie liczyć przy każdym ładowaniu.
      setDoc(todayRef, { questXpAdjusted: true }, { merge: true }).catch(() => {
        questXpFixDoneRef.current = null
      })
      return
    }

    const newPillarXP = { ...stats.pillarXP }
    for (const [p, d] of Object.entries(pillarDelta)) {
      newPillarXP[p as Pillar] = Math.max(0, (newPillarXP[p as Pillar] ?? 0) + (d as number))
    }

    Promise.all([
      setDoc(todayRef, {
        totalXP: Math.max(0, (todayLog.totalXP ?? 0) + totalDelta),
        questXpAdjusted: true,
      }, { merge: true }),
      setDoc(statsRef, {
        totalXP: Math.max(0, (stats.totalXP ?? 0) + totalDelta),
        pillarXP: newPillarXP,
      }, { merge: true }),
    ]).catch(() => {
      // Błąd zapisu — pozwól spróbować ponownie przy następnym ładowaniu.
      questXpFixDoneRef.current = null
    })
  }, [user, statsRef, todayRef, todayLog, stats, currentDateKey])

  const checkLevelUp = useCallback((oldXP: number, newXP: number) => {
    const oldLevel = getLevelFromXP(oldXP).level
    const newLevel = getLevelFromXP(newXP).level
    if (newLevel > oldLevel) {
      for (let l = oldLevel + 1; l <= newLevel; l++) {
        showLevelUp(l)
      }
    }
  }, [showLevelUp])

  const checkAchievements = useCallback(async (newStats: UserStats) => {
    const newlyUnlocked: string[] = []
    for (const ach of ACHIEVEMENTS) {
      if (!newStats.unlockedAchievements.includes(ach.id) && ach.condition(newStats)) {
        newlyUnlocked.push(ach.id)
      }
    }
    if (newlyUnlocked.length > 0) {
      const bonusXP = newlyUnlocked.reduce((acc, id) => {
        const a = ACHIEVEMENTS.find(a => a.id === id)
        return acc + (a?.xpReward ?? 0)
      }, 0)
      showAchievementUnlock(newlyUnlocked)
      return {
        unlockedAchievements: [...newStats.unlockedAchievements, ...newlyUnlocked],
        totalXP: newStats.totalXP + bonusXP,
      }
    }
    return {}
  }, [showAchievementUnlock])

  // Pillar balance bonus: +30 XP once per ISO week when all 7 pillars were touched.
  // Updates currentWeekPillars rolling tracker and pillarBalanceWeeks ledger.
  const applyPillarBalanceIfNeeded = useCallback((baseStats: UserStats, pillarTouched: Pillar): UserStats => {
    const weekKey = getISOWeekKey(new Date())
    const existing = baseStats.currentWeekPillars
    const samePriorWeek = existing?.weekKey === weekKey
    const priorPillars = samePriorWeek ? existing!.pillars : []
    const nextPillars = priorPillars.includes(pillarTouched)
      ? priorPillars
      : [...priorPillars, pillarTouched]

    const updated: UserStats = {
      ...baseStats,
      currentWeekPillars: { weekKey, pillars: nextPillars },
    }

    const alreadyAwarded = (baseStats.pillarBalanceWeeks ?? []).includes(weekKey)
    const allSeven = ALL_PILLARS.every(p => nextPillars.includes(p))

    if (allSeven && !alreadyAwarded) {
      return {
        ...updated,
        totalXP: updated.totalXP + XP_VALUES.pillarBalance,
        pillarBalanceWeeks: [...(baseStats.pillarBalanceWeeks ?? []), weekKey],
      }
    }
    return updated
  }, [])

  // Applies streak bookkeeping if today hasn't been logged yet.
  // Called at the start of every action so the streak is tied to real activity.
  // If exactly 1 day was missed and a streak freeze is available this month,
  // the freeze is auto-applied and the streak is preserved.
  const applyStreakIfNeeded = useCallback(async (baseStats: UserStats): Promise<UserStats> => {
    const today = currentDateKey
    if (baseStats.lastStreakDate === today) return baseStats

    // Compute yesterday and day-before-yesterday from today.
    const [y, m, d] = today.split('-').map(Number)
    const todayDate = new Date(y, m - 1, d)
    const yesterday = new Date(todayDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    const dayBeforeYesterday = new Date(todayDate)
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)
    const dbKey = `${dayBeforeYesterday.getFullYear()}-${String(dayBeforeYesterday.getMonth() + 1).padStart(2, '0')}-${String(dayBeforeYesterday.getDate()).padStart(2, '0')}`

    const continued = baseStats.lastStreakDate === yKey

    // Streak freeze: exactly 1 missed day + streak was active + freeze unused this month
    const missedExactlyOneDay = baseStats.lastStreakDate === dbKey && (baseStats.currentStreak ?? 0) > 0
    const monthKey = getMonthKey(new Date())
    const freezeUsed = (baseStats.streakFreezeUsedMonths ?? []).includes(monthKey)
    const freezeApplied = !continued && missedExactlyOneDay && !freezeUsed

    if (freezeApplied) {
      addToast({ message: '🛡️ Zamrożenie streaku użyte — seria uratowana!', type: 'success', duration: 5000 })
    }

    const newStreak = (continued || freezeApplied) ? baseStats.currentStreak + 1 : 1

    return {
      ...baseStats,
      currentStreak: newStreak,
      longestStreak: Math.max(baseStats.longestStreak, newStreak),
      totalDaysLogged: baseStats.totalDaysLogged + 1,
      lastStreakDate: today,
      streakFreezeUsedMonths: freezeApplied
        ? [...(baseStats.streakFreezeUsedMonths ?? []), monthKey]
        : (baseStats.streakFreezeUsedMonths ?? []),
    }
  }, [currentDateKey, addToast])

  const toggleRoutine = useCallback(async (itemId: string, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog || !statsLoadedRef.current) return
    const current = todayLog.completedRoutine ?? []
    const completed = current.includes(itemId)
    const newCompleted = completed
      ? current.filter(id => id !== itemId)
      : [...current, itemId]
    const effectiveXP = todayLog.dayMode === 'minimum' ? xp * 2 : xp
    const xpDelta = completed ? -effectiveXP : effectiveXP

    const newTodayXP = Math.max(0, (todayLog.totalXP ?? 0) + xpDelta)
    const withStreak = await applyStreakIfNeeded(stats)
    const newTotalXP = Math.max(0, withStreak.totalXP + xpDelta)
    const newRoutinesTotal = withStreak.totalRoutinesCompleted + (completed ? -1 : 1)
    const today = currentDateKey
    const isNewDay = stats.lastStreakDate !== withStreak.lastStreakDate

    // ── Behavioral tracking ──────────────────────────────────────
    // 1. Highest daily XP
    const newHighest = Math.max(withStreak.highestDayXP ?? 0, newTodayXP)

    // 2. Consecutive normal-mode days (tracked once per new day)
    let newConsecNormal = withStreak.consecutiveNormalDays ?? 0
    let newLastNormalDay = withStreak.lastNormalDay ?? null
    if (isNewDay) {
      if (todayLog.dayMode !== 'minimum') {
        newConsecNormal = newConsecNormal + 1
        newLastNormalDay = today
      } else {
        newConsecNormal = 0
        newLastNormalDay = today
      }
    }

    // 3. Perfect morning: all morning items (mode-aware) checked off
    const morningIds = todayLog.dayMode === 'minimum'
      ? MORNING_MINIMUM.map(i => i.id)
      : MORNING_ROUTINE.map(i => i.id)
    const allMorningDone = morningIds.every(id => newCompleted.includes(id))
    const prevAllMorningDone = morningIds.every(id => current.includes(id))
    let newConsecMorning = withStreak.consecutivePerfectMornings ?? 0
    let newLastPerfectMorning = withStreak.lastPerfectMorningDate ?? null
    if (allMorningDone && !prevAllMorningDone) {
      // Just completed the full morning — check if it's a new day from last perfect morning
      const isConsecutive = newLastPerfectMorning !== null && (() => {
        const [y, m, d] = today.split('-').map(Number)
        const todayDate = new Date(y, m - 1, d)
        const prev = new Date(newLastPerfectMorning + 'T12:00:00')
        const diff = Math.round((todayDate.getTime() - prev.getTime()) / 86400000)
        return diff === 1
      })()
      newConsecMorning = isConsecutive ? newConsecMorning + 1 : 1
      newLastPerfectMorning = today
    } else if (!allMorningDone && prevAllMorningDone) {
      // Just un-completed — reset streak if this was today's perfect morning
      if (newLastPerfectMorning === today) {
        newConsecMorning = Math.max(0, newConsecMorning - 1)
        newLastPerfectMorning = null
      }
    }
    // ─────────────────────────────────────────────────────────────

    const newStats: UserStats = {
      ...withStreak,
      totalXP: newTotalXP,
      totalRoutinesCompleted: Math.max(0, newRoutinesTotal),
      highestDayXP: newHighest,
      consecutiveNormalDays: newConsecNormal,
      lastNormalDay: newLastNormalDay,
      consecutivePerfectMornings: newConsecMorning,
      lastPerfectMorningDate: newLastPerfectMorning,
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, {
        completedRoutine: completed ? arrayRemove(itemId) : arrayUnion(itemId),
        totalXP: increment(xpDelta),
        date: currentDateKey,
      }, { merge: true }),
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, currentDateKey, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const toggleDailyQuest = useCallback(async (questId: string, pillar: Pillar, xp: number = XP_VALUES.dailyQuest) => {
    if (!user || !statsRef || !todayRef || !todayLog || !statsLoadedRef.current) return
    const currentDQ = todayLog.completedDailyQuests ?? []
    const completed = currentDQ.includes(questId)
    // Questy płacą tyle, ile pokazują na karcie (q.xp). Domyślne XP_VALUES.dailyQuest
    // tylko jako fallback dla wywołań bez jawnej wartości.
    const baseXP = xp
    const effectiveXP = todayLog.dayMode === 'minimum' ? baseXP * 2 : baseXP
    const xpDelta = completed ? -effectiveXP : effectiveXP

    const withStreak = await applyStreakIfNeeded(stats)
    let newStats: UserStats = {
      ...withStreak,
      totalXP: Math.max(0, withStreak.totalXP + xpDelta),
      totalQuestsCompleted: Math.max(0, withStreak.totalQuestsCompleted + (completed ? -1 : 1)),
      pillarXP: {
        ...withStreak.pillarXP,
        [pillar]: Math.max(0, (withStreak.pillarXP[pillar] ?? 0) + xpDelta),
      },
    }
    if (!completed) newStats = applyPillarBalanceIfNeeded(newStats, pillar)
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, {
        completedDailyQuests: completed ? arrayRemove(questId) : arrayUnion(questId),
        totalXP: increment(xpDelta),
        date: currentDateKey,
      }, { merge: true }),
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkLevelUp])

  const toggleSideQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog || !statsLoadedRef.current) return
    const currentSQ = todayLog.completedSideQuests ?? []
    const completed = currentSQ.includes(questId)
    const xpDelta = completed ? -xp : xp

    const withStreak = await applyStreakIfNeeded(stats)
    let newStats: UserStats = {
      ...withStreak,
      totalXP: Math.max(0, withStreak.totalXP + xpDelta),
      totalSideQuestsCompleted: Math.max(0, withStreak.totalSideQuestsCompleted + (completed ? -1 : 1)),
      pillarXP: {
        ...withStreak.pillarXP,
        [pillar]: Math.max(0, (withStreak.pillarXP[pillar] ?? 0) + xpDelta),
      },
    }
    if (!completed) newStats = applyPillarBalanceIfNeeded(newStats, pillar)
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, {
        completedSideQuests: completed ? arrayRemove(questId) : arrayUnion(questId),
        totalXP: increment(xpDelta),
        date: currentDateKey,
      }, { merge: true }),
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkLevelUp])

  const toggleRule = useCallback(async (ruleId: string) => {
    if (!user || !statsRef || !todayRef || !todayLog || !statsLoadedRef.current) return
    const currentRules = todayLog.keptRules ?? []
    const kept = currentRules.includes(ruleId)
    const baseRule = XP_VALUES.rulekept
    const xpDelta = kept ? -(todayLog.dayMode === 'minimum' ? baseRule * 2 : baseRule) : (todayLog.dayMode === 'minimum' ? baseRule * 2 : baseRule)

    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: Math.max(0, withStreak.totalXP + xpDelta),
      totalRulesKept: Math.max(0, withStreak.totalRulesKept + (kept ? -1 : 1)),
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, {
        keptRules: kept ? arrayRemove(ruleId) : arrayUnion(ruleId),
        totalXP: increment(xpDelta),
        date: currentDateKey,
      }, { merge: true }),
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const submitWeeklyReview = useCallback(async (weekStart: string): Promise<boolean> => {
    if (!user || !statsRef || !statsLoadedRef.current) return false
    const reviewed = stats.reviewedWeeks ?? []
    if (reviewed.includes(weekStart)) return false

    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + XP_VALUES.weeklyReview,
      reviewedWeeks: [...reviewed, weekStart],
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true })
    return true
  }, [user, stats, statsRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const submitMonthlyReview = useCallback(async (monthKey: string): Promise<boolean> => {
    if (!user || !statsRef || !statsLoadedRef.current) return false
    const reviewed = stats.reviewedMonths ?? []
    if (reviewed.includes(monthKey)) return false

    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + XP_VALUES.monthlyReview,
      reviewedMonths: [...reviewed, monthKey],
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true })
    return true
  }, [user, stats, statsRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const submitQuarterlyReview = useCallback(async (quarterKey: string): Promise<boolean> => {
    if (!user || !statsRef || !statsLoadedRef.current) return false
    const reviewed = stats.reviewedQuarters ?? []
    if (reviewed.includes(quarterKey)) return false

    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + XP_VALUES.quarterlyReview,
      reviewedQuarters: [...reviewed, quarterKey],
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true })
    return true
  }, [user, stats, statsRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const completeHeartBlock = useCallback(async (weekKey: string): Promise<{ awarded: boolean; xp: number }> => {
    if (!user || !statsRef || !statsLoadedRef.current) return { awarded: false, xp: 0 }
    const completed = stats.completedHeartBlocks ?? []
    if (completed.includes(weekKey)) return { awarded: false, xp: 0 }

    const withStreak = await applyStreakIfNeeded(stats)
    let newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + XP_VALUES.heartBlock,
      pillarXP: {
        ...withStreak.pillarXP,
        pozycja: (withStreak.pillarXP.pozycja ?? 0) + XP_VALUES.heartBlock,
      },
      completedHeartBlocks: [...completed, weekKey],
    }
    newStats = applyPillarBalanceIfNeeded(newStats, 'pozycja')
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true })
    return { awarded: true, xp: XP_VALUES.heartBlock }
  }, [user, stats, statsRef, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkAchievements, checkLevelUp])

  const setDayMode = useCallback(async (mode: 'normal' | 'minimum', reason?: import('@/types').MinimumDayReason) => {
    if (!user || !todayRef || !todayLog) return
    const update: Partial<import('@/types').DailyLog> = { dayMode: mode }
    if (mode === 'minimum' && reason) update.minimumReason = reason
    if (mode === 'normal') update.minimumReason = undefined
    await setDoc(todayRef, { ...update, date: currentDateKey }, { merge: true })
    if (mode === 'minimum' && statsRef) {
      await setDoc(statsRef, { consecutiveNormalDays: 0, lastNormalDay: currentDateKey }, { merge: true })
    }
  }, [user, todayRef, todayLog, statsRef, currentDateKey])

  const toggleSocialPresence = useCallback(async () => {
    if (!user || !todayRef || !todayLog) return
    await setDoc(todayRef, { socialPresence: !todayLog.socialPresence }, { merge: true })
  }, [user, todayRef, todayLog])

  const togglePhysicalActivity = useCallback(async () => {
    if (!user || !todayRef || !todayLog) return
    await setDoc(todayRef, { physicalActivity: !todayLog.physicalActivity }, { merge: true })
  }, [user, todayRef, todayLog])

  // Odhaczanie pojedynczych kroków w przewodnikach (pielęgnacja, suplementy).
  // Lekkie — bez XP i statystyk; tylko pomocnicze „co już zrobione" na dziś.
  const toggleSubStep = useCallback(async (stepKey: string) => {
    if (!user || !todayRef || !todayLog) return
    const current = todayLog.checkedSubSteps ?? []
    const next = current.includes(stepKey)
      ? current.filter(k => k !== stepKey)
      : [...current, stepKey]
    await setDoc(todayRef, { checkedSubSteps: next }, { merge: true })
  }, [user, todayRef, todayLog])

  // Przeniesienie zadania dnia (rutyna „Dzień", np. książka z hiszpańskiego,
  // ćwiczenia) na jutro. Zapisuje snapshot do loga jutra (carriedRoutine) i
  // chowa pozycję dziś (postponedRoutine). Bez XP — to przesunięcie, nie
  // ukończenie. arrayUnion = bezpieczne pod współbieżnością.
  const postponeRoutineToTomorrow = useCallback(async (item: { id: string; text: string; xp: number }) => {
    if (!user || !todayRef) return
    const [yy, mm, dd] = currentDateKey.split('-').map(Number)
    const t = new Date(yy, mm - 1, dd)
    t.setDate(t.getDate() + 1)
    const tomorrowK = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    const tomorrowLogRef = doc(db, 'users', user.uid, 'logs', tomorrowK)
    const entry: CarriedRoutineItem = { id: item.id, text: item.text, xp: item.xp, fromDate: currentDateKey }
    await Promise.all([
      setDoc(todayRef, { postponedRoutine: arrayUnion(item.id), date: currentDateKey }, { merge: true }),
      setDoc(tomorrowLogRef, { carriedRoutine: arrayUnion(entry), date: tomorrowK }, { merge: true }),
    ])
    addToast({ message: 'Przeniesione na jutro.', type: 'success' })
  }, [user, todayRef, currentDateKey, addToast])

  const saveMoodCheckIn = useCallback(async (checkin: Omit<MoodCheckIn, 'timestamp'>) => {
    if (!user || !statsRef || !todayRef || !todayLog || !statsLoadedRef.current) return
    const existing = todayLog.moodCheckIns ?? []
    if (existing.length >= MAX_MOOD_CHECKINS_PER_DAY) return
    const newCheckIn: MoodCheckIn = { ...checkin, timestamp: Date.now() }

    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + XP_VALUES.moodCheckIn,
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, { moodCheckIns: arrayUnion(newCheckIn) }, { merge: true }),
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
    ])
  }, [user, todayRef, todayLog, stats, statsRef, applyStreakIfNeeded, checkAchievements, checkLevelUp])

  const saveKeyMoment = useCallback(async (data: { title: string; note?: string }) => {
    if (!user || !todayRef) return
    const keyMoment: KeyMoment = {
      title: data.title,
      savedAt: Date.now(),
      ...(data.note ? { note: data.note } : {}),
    }
    await setDoc(todayRef, { keyMoment }, { merge: true })
  }, [user, todayRef])

  const clearKeyMoment = useCallback(async () => {
    if (!user || !todayRef) return
    await setDoc(todayRef, { keyMoment: null }, { merge: true })
  }, [user, todayRef])

  // Papierosy — patrz PLAN_PALENIE.md sekcja 6.
  // Świadomie: brak XP, brak wpływu na streak, brak alertów.
  // Spokojny licznik. Logowanie ZAWSZE może się zdarzyć — to jest cały feedback loop.
  const logCigarette = useCallback(async (context?: CigaretteContext, intensity?: 1 | 2 | 3 | 4 | 5) => {
    if (!user || !todayRef || !todayLog) return
    const now = new Date()
    const entry: CigaretteEntry = {
      timestamp: now.getTime(),
      hour: now.getHours(),
      weekday: (now.getDay() + 6) % 7, // 0=Pon … 6=Nd, zgodnie z resztą aplikacji
      ...(context ? { context } : {}),
      ...(intensity ? { intensity } : {}),
    }
    // arrayUnion zamiast [...existing, entry]: każdy wpis ma unikalny timestamp,
    // więc zawsze się dodaje — a równoległy log z drugiego urządzenia nie nadpisze
    // tablicy (to są dane fazy 1, najważniejsze do ochrony).
    await setDoc(todayRef, { cigarettes: arrayUnion(entry) }, { merge: true })
  }, [user, todayRef, todayLog])

  // Cofnięcie omyłki (np. podwójne tapnięcie). Bez „undo streak", tylko czysta korekta danych.
  const removeLastCigarette = useCallback(async () => {
    if (!user || !todayRef || !todayLog) return
    const existing = todayLog.cigarettes ?? []
    if (existing.length === 0) return
    await setDoc(todayRef, { cigarettes: existing.slice(0, -1) }, { merge: true })
  }, [user, todayRef, todayLog])

  // Przejście do kolejnej fazy planu palenia (PLAN_PALENIE.md sekcja 2).
  // Przy zamknięciu fazy 1 przekazujemy wyliczony baseline — zostaje na zawsze
  // jako punkt odniesienia dla celów miękkich kolejnych faz. Bez XP, bez fanfar.
  const startSmokingPhase = useCallback(async (phase: SmokingPhase, baseline?: number) => {
    if (!user || !statsRef || !statsLoadedRef.current) return
    const updates: Partial<UserStats> = {
      cigarettesPhase: phase,
      cigarettesPhaseStartDate: currentDateKey,
      ...(baseline !== undefined ? { cigarettesBaseline: baseline } : {}),
    }
    await setDoc(statsRef, updates, { merge: true })
  }, [user, statsRef, currentDateKey])

  const completeReturnCeremony = useCallback(async () => {
    if (!user || !statsRef || !statsLoadedRef.current) return
    const newStats: UserStats = {
      ...stats,
      totalXP: stats.totalXP + XP_VALUES.returnCeremony,
      lastReturnCeremonyDate: currentDateKey,
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)
    await setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true })
  }, [user, stats, statsRef, currentDateKey, checkAchievements, checkLevelUp])

  // Ghost Protocol V2: +10 za zalogowanie impulsu, +30 bonus jeśli bez kontaktu
  const recordGhostImpulseV2 = useCallback(async (hadContact: boolean) => {
    if (!user || !statsRef || !statsLoadedRef.current) return
    const xp = hadContact ? 10 : 40
    const today = currentDateKey
    const withStreak = await applyStreakIfNeeded(stats)

    const lastGhost = withStreak.lastGhostDate ?? null
    const isNewImpulseToday = lastGhost !== today
    const newTotal = (withStreak.totalGhostProtocols ?? 0) + (isNewImpulseToday ? 1 : 0)

    let newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + xp,
      pillarXP: {
        ...withStreak.pillarXP,
        pozycja: (withStreak.pillarXP.pozycja ?? 0) + xp,
      },
      totalGhostProtocols: newTotal,
      lastGhostDate: today,
    }
    newStats = applyPillarBalanceIfNeeded(newStats, 'pozycja')
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)
    await Promise.all([
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
      todayRef ? setDoc(todayRef, { ghostProtocolCompleted: true }, { merge: true }) : Promise.resolve(),
    ])
  }, [user, stats, statsRef, todayRef, currentDateKey, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkAchievements, checkLevelUp])

  const logCustomSideQuest = useCallback(async (title: string, pillar: Pillar, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog || !statsLoadedRef.current) return
    const entry: CustomSideQuestEntry = { id: `csq_${Date.now()}`, title, pillar, xp }
    const withStreak = await applyStreakIfNeeded(stats)
    let newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + xp,
      totalSideQuestsCompleted: withStreak.totalSideQuestsCompleted + 1,
      pillarXP: { ...withStreak.pillarXP, [pillar]: (withStreak.pillarXP[pillar] ?? 0) + xp },
    }
    newStats = applyPillarBalanceIfNeeded(newStats, pillar)
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)
    await Promise.all([
      setDoc(todayRef, {
        customSideQuests: arrayUnion(entry),
        totalXP: increment(xp),
        date: currentDateKey,
      }, { merge: true }),
      setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, currentDateKey, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkAchievements, checkLevelUp])

  // Honest Failure Log: +15 XP za uczciwość
  const recordHonestFailure = useCallback(async () => {
    if (!user || !statsRef || !statsLoadedRef.current) return
    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + 15,
      pillarXP: {
        ...withStreak.pillarXP,
        pozycja: (withStreak.pillarXP.pozycja ?? 0) + 15,
      },
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)
    await setDoc(statsRef, buildStatsWrite(stats, finalStats), { merge: true })
  }, [user, stats, statsRef, applyStreakIfNeeded, checkAchievements, checkLevelUp])

  const streakFreezeAvailable = !(stats.streakFreezeUsedMonths ?? []).includes(getMonthKey(new Date()))

  // Full stats reconstruction from Firestore source documents.
  // Reads daily logs, weekly/monthly review docs, Ghost V2 + honest failure logs,
  // re-evaluates achievement conditions. PRESERVES fields rebuild can't reconstruct
  // (heart blocks, pillar balance weeks, streak freeze months — bez tego applyRecoveredStats
  // wymazałoby zarobione XP).
  const recoverStats = useCallback(async () => {
    if (!user || !statsRef) return null

    const [currentStatsSnap, logsSnap, weeklySnap, monthlySnap, ghostV2Snap, failureSnap] = await Promise.all([
      getDoc(statsRef),
      getDocs(collection(db, 'users', user.uid, 'logs')),
      getDocs(collection(db, 'users', user.uid, 'reviews')),
      getDocs(collection(db, 'users', user.uid, 'monthlyReviews')),
      getDoc(doc(db, 'users', user.uid, 'data', 'ghostLogV2')),
      getDoc(doc(db, 'users', user.uid, 'data', 'honestFailureLog')),
    ])

    // Pola których pętla po logach nie odbuduje — czytamy je z aktualnych stats,
    // żeby nie zostały wymazane przez applyRecoveredStats.
    const currentStats: Partial<UserStats> = currentStatsSnap.exists()
      ? (currentStatsSnap.data() as Partial<UserStats>)
      : {}
    const preservedHeartBlocks   = currentStats.completedHeartBlocks ?? []
    const preservedPillarBalance = currentStats.pillarBalanceWeeks ?? []
    const preservedStreakFreezes = currentStats.streakFreezeUsedMonths ?? []

    // ── Reconstruct counters from daily logs ──
    const logEntries = logsSnap.docs
      .map(d => ({ dateKey: d.id, ...(d.data() as DailyLog) }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

    // Build quest lookup maps
    const questPillarMap: Record<string, { pillar: Pillar; xp: number }> = {}
    for (const q of DAILY_QUESTS_POOL) questPillarMap[q.id] = { pillar: q.pillar as Pillar, xp: XP_VALUES.dailyQuest }
    for (const q of SIDE_QUESTS) questPillarMap[q.id] = { pillar: q.pillar as Pillar, xp: q.xp }

    // Fallback: guess pillar from ID prefix for quests not in current list
    const guessPillarFromId = (id: string): { pillar: Pillar; xp: number } | null => {
      if (id.startsWith('sq_poz') || id.startsWith('sq_root') || id.startsWith('dq_1') || id.startsWith('dq_6') || id.startsWith('dq_10')) return { pillar: 'pozycja', xp: 120 }
      if (id.startsWith('sq_ciao') || id.startsWith('sq_life') || id.startsWith('sq_body') || id.startsWith('dq_3')) return { pillar: 'cialo', xp: 120 }
      if (id.startsWith('sq_styl') || id.startsWith('dq_8')) return { pillar: 'styl', xp: 100 }
      if (id.startsWith('sq_kap') || id.startsWith('dq_5')) return { pillar: 'kapital', xp: 120 }
      if (id.startsWith('sq_kar') || id.startsWith('dq_2') || id.startsWith('dq_7')) return { pillar: 'kariera', xp: 120 }
      if (id.startsWith('sq_toz') || id.startsWith('sq_wild') || id.startsWith('sq_trick') || id.startsWith('sq_world') || id.startsWith('dq_4')) return { pillar: 'tozsamosc', xp: 100 }
      if (id.startsWith('sq_mil') || id.startsWith('sq_love') || id.startsWith('dq_9')) return { pillar: 'milosc', xp: 120 }
      if (id.startsWith('rq_')) return { pillar: 'pozycja', xp: 30 }
      return null
    }

    let fromLogs = 0
    let fromExternal = 0           // XP z zewnętrznych apek (Learning Vault), z log.externalXP
    let externalDaysCount = 0      // liczba dni, w których byl jakikolwiek external XP
    let totalMoodCheckIns = 0      // sumujemy w pętli — log.moodCheckIns nie idą do log.totalXP
    let totalRoutinesCompleted = 0
    let totalQuestsCompleted = 0
    let totalSideQuestsCompleted = 0
    let totalRulesKept = 0
    let totalGhostProtocols = 0
    let highestDayXP = 0
    let consecutiveNormalDays = 0
    // Mode-aware morning streak (każdy „pełny poranek" zależy od dayMode danego dnia).
    let consecutivePerfectMornings = 0
    let longestPerfectMornings = 0   // historyczna passa — używana do oceny achievementów
    let lastPerfectMorningDate: string | null = null
    let prevPerfectMorningDate: string | null = null
    // Ghost Protocol — passa dni z aktywacją GP.
    let consecutiveGhostDays = 0
    let longestGhostDays = 0
    let lastGhostDate: string | null = null
    let prevGhostDate: string | null = null
    const pillarXP: UserStats['pillarXP'] = { pozycja: 0, cialo: 0, styl: 0, kapital: 0, kariera: 0, tozsamosc: 0, milosc: 0 }

    // Lookup setów ID dla rutyny porannej (normal vs minimum).
    const MORNING_NORMAL_IDS = MORNING_ROUTINE.map(i => i.id)
    const MORNING_MINIMUM_IDS = MORNING_MINIMUM.map(i => i.id)
    const isConsecutiveDay = (prevDate: string | null, currDate: string): boolean => {
      if (!prevDate) return false
      const diff = Math.round(
        (new Date(currDate).getTime() - new Date(prevDate).getTime()) / 86400000
      )
      return diff === 1
    }

    for (const log of logEntries) {
      const xp = (Number.isFinite(log.totalXP) && log.totalXP > 0) ? log.totalXP : 0
      fromLogs += xp
      highestDayXP = Math.max(highestDayXP, xp)
      totalRoutinesCompleted += log.completedRoutine?.length ?? 0
      totalQuestsCompleted += log.completedDailyQuests?.length ?? 0
      totalSideQuestsCompleted += (log.completedSideQuests?.length ?? 0) + (log.customSideQuests?.length ?? 0)
      totalRulesKept += log.keptRules?.length ?? 0
      totalMoodCheckIns += log.moodCheckIns?.length ?? 0

      // Ghost Protocol — count + day-streak.
      if (log.ghostProtocolCompleted) {
        totalGhostProtocols++
        consecutiveGhostDays = isConsecutiveDay(prevGhostDate, log.dateKey) ? consecutiveGhostDays + 1 : 1
        longestGhostDays = Math.max(longestGhostDays, consecutiveGhostDays)
        lastGhostDate = log.dateKey
        prevGhostDate = log.dateKey
      }
      // Uwaga: brak resetu consecutiveGhostDays w dniach bez GP — pasujemy do semantyki
      // „passa GP" jako kolejnych dni z aktywacją (analogicznie do streaków logowania).

      if (log.dayMode !== 'minimum') consecutiveNormalDays++
      else consecutiveNormalDays = 0

      // Perfect morning — wszystkie itemy porannej rutyny (mode-aware) odhaczone.
      const morningIds = log.dayMode === 'minimum' ? MORNING_MINIMUM_IDS : MORNING_NORMAL_IDS
      const completed = log.completedRoutine ?? []
      const allMorningDone = morningIds.length > 0 && morningIds.every(id => completed.includes(id))
      if (allMorningDone) {
        consecutivePerfectMornings = isConsecutiveDay(prevPerfectMorningDate, log.dateKey)
          ? consecutivePerfectMornings + 1
          : 1
        longestPerfectMornings = Math.max(longestPerfectMornings, consecutivePerfectMornings)
        lastPerfectMorningDate = log.dateKey
        prevPerfectMorningDate = log.dateKey
      } else {
        // Złamana passa porannego rytuału — historyczny rekord zachowany w longest*.
        consecutivePerfectMornings = 0
        prevPerfectMorningDate = null
      }

      const ALL_PILLARS_LIST: Pillar[] = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc']
      // Pillar XP from daily quests.
      // Tryb minimum podwaja XP daily questa — dokładnie to robi toggleDailyQuest
      // na żywo (effectiveXP = baseXP * 2). Bez tego mnożnika rebuild gubił bonus
      // ×2 w pillarXP (totalXP był ok, bo czytamy log.totalXP, które bonus zawiera),
      // przez co suma pillarXP rozjeżdżała się z totalXP po każdej odbudowie.
      const dqMult = log.dayMode === 'minimum' ? 2 : 1
      for (const qid of (log.completedDailyQuests ?? [])) {
        const q = questPillarMap[qid] ?? guessPillarFromId(qid)
        if (q) {
          pillarXP[q.pillar] = (pillarXP[q.pillar] ?? 0) + q.xp * dqMult
        } else {
          const share = Math.round(XP_VALUES.dailyQuest / 7) * dqMult
          for (const p of ALL_PILLARS_LIST) pillarXP[p] = (pillarXP[p] ?? 0) + share
        }
      }
      // Pillar XP from side quests
      for (const qid of (log.completedSideQuests ?? [])) {
        const q = questPillarMap[qid] ?? guessPillarFromId(qid)
        if (q) {
          pillarXP[q.pillar] = (pillarXP[q.pillar] ?? 0) + q.xp
        } else {
          const share = Math.round(120 / 7)
          for (const p of ALL_PILLARS_LIST) pillarXP[p] = (pillarXP[p] ?? 0) + share
        }
      }
      // Pillar XP from custom side quests (pillar + xp stored directly in log)
      for (const csq of (log.customSideQuests ?? [])) {
        if (csq.pillar && pillarXP[csq.pillar as Pillar] !== undefined) {
          pillarXP[csq.pillar as Pillar] = (pillarXP[csq.pillar as Pillar] ?? 0) + (csq.xp ?? 0)
        }
      }
      // Ghost Protocol XP — both V1 (+50 tozsamosc) and V2 (+40 pozycja, no-contact) use same flag.
      // Can't distinguish version so add to both pillars as best-effort approximation.
      if (log.ghostProtocolCompleted) {
        pillarXP.tozsamosc = (pillarXP.tozsamosc ?? 0) + 25
        pillarXP.pozycja = (pillarXP.pozycja ?? 0) + 20
      }
      // External XP (na razie tylko The Learning Vault) — zapisywane przez
      // /api/external/xp do log.externalXP per filar. Recovery musi je
      // uwzględnić, bo pillarXP rebuilduje od zera.
      if (log.externalXP) {
        let dayExternal = 0
        for (const p of ALL_PILLARS_LIST) {
          const v = log.externalXP[p]
          if (typeof v === 'number' && v > 0) {
            pillarXP[p] = (pillarXP[p] ?? 0) + v
            dayExternal += v
          }
        }
        if (dayExternal > 0) externalDaysCount += 1
        fromExternal += dayExternal
      }
    }

    // ── Streak computation ──
    const logDates = logEntries.map(l => l.dateKey)
    let longestStreak = logDates.length > 0 ? 1 : 0
    let tempStreak = 1
    for (let i = 1; i < logDates.length; i++) {
      const diff = Math.round(
        (new Date(logDates[i]).getTime() - new Date(logDates[i - 1]).getTime()) / 86400000
      )
      tempStreak = diff === 1 ? tempStreak + 1 : 1
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Current streak (backwards from last log)
    let currentStreak = logDates.length > 0 ? 1 : 0
    for (let i = logDates.length - 1; i > 0; i--) {
      const diff = Math.round(
        (new Date(logDates[i]).getTime() - new Date(logDates[i - 1]).getTime()) / 86400000
      )
      if (diff === 1) currentStreak++
      else break
    }
    // Zero streak if last log was more than 1 day ago
    if (logDates.length > 0) {
      const [y, m, d] = currentDateKey.split('-').map(Number)
      const todayDate = new Date(y, m - 1, d)
      const yDate = new Date(todayDate); yDate.setDate(yDate.getDate() - 1)
      const yKey = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`
      const last = logDates[logDates.length - 1]
      if (last !== currentDateKey && last !== yKey) currentStreak = 0
    }

    // ── Reviews ──
    const reviewedWeeks = weeklySnap.docs.map(d => d.id)
    const reviewedMonths = monthlySnap.docs.map(d => d.id)
    const fromWeeklyReviews = reviewedWeeks.length * XP_VALUES.weeklyReview
    const fromMonthlyReviews = reviewedMonths.length * XP_VALUES.monthlyReview

    // ── Dodatkowe źródła XP (pisane tylko do stats, nie do log.totalXP) ──
    const fromMoodCheckIns = totalMoodCheckIns * XP_VALUES.moodCheckIn
    const fromHeartBlocks   = preservedHeartBlocks.length * XP_VALUES.heartBlock
    const fromPillarBalance = preservedPillarBalance.length * XP_VALUES.pillarBalance

    // Heart block dorzuca też +200 do filaru pozycja.
    pillarXP.pozycja = (pillarXP.pozycja ?? 0) + fromHeartBlocks

    // ── Ghost Protocol V2 (osobna kolekcja) + Honest Failure ──
    const ghostV2Entries: GhostLogEntryV2[] = ghostV2Snap.exists()
      ? ((ghostV2Snap.data() as { entries?: GhostLogEntryV2[] }).entries ?? [])
      : []
    const failureEntries: HonestFailureEntry[] = failureSnap.exists()
      ? ((failureSnap.data() as { entries?: HonestFailureEntry[] }).entries ?? [])
      : []
    const fromGhostV2       = ghostV2Entries.reduce((sum, e) => sum + (e.xpEarned ?? 0), 0)
    const fromHonestFailure = failureEntries.reduce((sum, e) => sum + (e.xpEarned ?? 0), 0)

    // V2 dorzuca do filaru pozycja całość zarobionego XP (zgodnie z recordGhostImpulseV2/recordHonestFailure).
    pillarXP.pozycja = (pillarXP.pozycja ?? 0) + fromGhostV2 + fromHonestFailure

    // Jeśli V2 ma więcej unikalnych dni z impulsami niż log.ghostProtocolCompleted — użyj większego.
    if (ghostV2Entries.length > 0) {
      const v2DayKeys = new Set(
        ghostV2Entries.map(e => {
          const d = new Date(e.timestamp)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        })
      )
      totalGhostProtocols = Math.max(totalGhostProtocols, v2DayKeys.size)
    }

    // ── Achievement evaluation ──
    // Używamy longestStreak/longestPerfectMornings/longestGhostDays do oceny
    // historycznych passy — żeby achievement złapał się nawet jeśli aktualna passa = 0.
    const baseXP = fromLogs + fromWeeklyReviews + fromMonthlyReviews
                 + fromMoodCheckIns + fromHeartBlocks + fromPillarBalance
                 + fromGhostV2 + fromHonestFailure
    const statsForEval: UserStats = {
      ...DEFAULT_STATS,
      totalXP: baseXP,
      totalDaysLogged: logEntries.length,
      totalRoutinesCompleted,
      totalQuestsCompleted,
      totalSideQuestsCompleted,
      totalRulesKept,
      totalGhostProtocols,
      highestDayXP,
      currentStreak: longestStreak,                       // historyczny peak — dla streak_*
      longestStreak,
      consecutiveNormalDays,
      consecutivePerfectMornings: longestPerfectMornings, // historyczny peak — dla perfect_morning_*
      consecutiveGhostDays: longestGhostDays,             // historyczny peak — dla ghost_streak_7
      reviewedWeeks,
      reviewedMonths,
      pillarXP,
    }

    const unlockedAchievements: string[] = []
    let fromAchievements = 0
    for (const ach of ACHIEVEMENTS) {
      if (ach.condition(statsForEval)) {
        unlockedAchievements.push(ach.id)
        fromAchievements += ach.xpReward ?? 0
      }
    }

    const totalXP = baseXP + fromAchievements

    // Preserved fields — dorzucane tylko gdy DEFINED, bo Firestore rzuca na undefined.
    // (Ten sam bug co kiedyś z saveKeyMoment.note — patrz commit c4cb85a.)
    const preservedOptional: Partial<UserStats> = {}
    if (currentStats.currentWeekPillars     !== undefined) preservedOptional.currentWeekPillars     = currentStats.currentWeekPillars
    if (currentStats.lastReturnCeremonyDate !== undefined) preservedOptional.lastReturnCeremonyDate = currentStats.lastReturnCeremonyDate
    if (currentStats.smokingTrackingEnabled !== undefined) preservedOptional.smokingTrackingEnabled = currentStats.smokingTrackingEnabled
    if (currentStats.cigarettesBaseline     !== undefined) preservedOptional.cigarettesBaseline     = currentStats.cigarettesBaseline
    if (currentStats.cigarettesPhase        !== undefined) preservedOptional.cigarettesPhase        = currentStats.cigarettesPhase
    if (currentStats.cigarettesPhaseStartDate !== undefined) preservedOptional.cigarettesPhaseStartDate = currentStats.cigarettesPhaseStartDate
    if (currentStats.cigarettesAlarmTriggered !== undefined) preservedOptional.cigarettesAlarmTriggered = currentStats.cigarettesAlarmTriggered

    const reconstructedStats: UserStats = {
      ...statsForEval,
      currentStreak,                                       // aktualna passa logowania
      consecutivePerfectMornings,                           // aktualna passa porannego rytuału (nie peak)
      consecutiveGhostDays,                                 // aktualna passa GP (nie peak)
      lastPerfectMorningDate,
      lastGhostDate,
      totalXP,
      unlockedAchievements,
      lastStreakDate: logDates[logDates.length - 1] ?? null,
      // Pola których rebuild nie odbudowuje, ale ZAWSZE są zdefiniowane (array fallback []).
      completedHeartBlocks:   preservedHeartBlocks,
      pillarBalanceWeeks:     preservedPillarBalance,
      streakFreezeUsedMonths: preservedStreakFreezes,
      // Pola opcjonalne — tylko jeśli istniały (inaczej Firestore wywala write).
      ...preservedOptional,
    }

    return {
      reconstructedStats,
      breakdown: {
        fromLogs,
        fromWeeklyReviews,
        fromMonthlyReviews,
        fromAchievements,
        fromMoodCheckIns,
        fromHeartBlocks,
        fromPillarBalance,
        fromGhostV2,
        fromHonestFailure,
        // fromExternal informacyjnie — XP z Learning Vault, JUŻ wliczone
        // w fromLogs (endpoint inkrementuje log.totalXP). Pokazujemy
        // osobno tylko dla rozbicia UI, nie sumujemy ponownie.
        fromExternal,
        externalDaysCount,
        total: totalXP,
        weeklyCount: reviewedWeeks.length,
        monthlyCount: reviewedMonths.length,
        achievementsCount: unlockedAchievements.length,
        moodCheckInsCount:    totalMoodCheckIns,
        heartBlocksCount:     preservedHeartBlocks.length,
        pillarBalanceCount:   preservedPillarBalance.length,
        ghostV2Count:         ghostV2Entries.length,
        honestFailureCount:   failureEntries.length,
      },
    }
  }, [user, statsRef, currentDateKey])

  // applyRecoveredStats — UŻYWAMY { merge: true }. Bez merge setDoc wymazuje
  // wszystkie pola których nie ma w reconstructedStats. Mimo że recovery teraz
  // jawnie przekazuje preserved fields, merge jest tańszą siatką bezpieczeństwa
  // na wypadek przyszłych pól w UserStats które ktoś zapomni dorzucić.
  const applyRecoveredStats = useCallback(async (reconstructedStats: UserStats) => {
    if (!user || !statsRef) return
    await setDoc(statsRef, reconstructedStats, { merge: true })
  }, [user, statsRef])

  return {
    stats, todayLog, loading,
    toggleRoutine, toggleDailyQuest, toggleSideQuest, toggleRule,
    submitWeeklyReview, submitMonthlyReview, submitQuarterlyReview, setDayMode,
    streakFreezeAvailable, toggleSocialPresence, togglePhysicalActivity, toggleSubStep,
    postponeRoutineToTomorrow,
    saveMoodCheckIn, saveKeyMoment, clearKeyMoment, completeReturnCeremony,
    logCigarette, removeLastCigarette, startSmokingPhase,
    completeHeartBlock,
    recordGhostImpulseV2, recordHonestFailure, logCustomSideQuest,
    recoverStats, applyRecoveredStats,
  }
}
