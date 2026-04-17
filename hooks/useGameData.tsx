'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  doc, setDoc, onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DailyLog, UserStats, MoodCheckIn, KeyMoment } from '@/types'
import { todayKey, XP_VALUES, getISOWeekKey, getLevelFromXP, getMonthKey } from '@/lib/gameLogic'
import { MORNING_ROUTINE, MORNING_MINIMUM } from '@/lib/routineData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { Pillar } from '@/types'
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
  pillarBalanceWeeks: [],
  totalGhostProtocols: 0,
  consecutiveGhostDays: 0,
  lastGhostDate: null,
  highestDayXP: 0,
  consecutiveNormalDays: 0,
  lastNormalDay: null,
  consecutivePerfectMornings: 0,
  lastPerfectMorningDate: null,
}

const ALL_PILLARS: Pillar[] = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc']

export function useGameData() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { showAchievementUnlock } = useAchievementUnlock()
  const { showLevelUp } = useLevelUp()
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDateKey, setCurrentDateKey] = useState<string>(todayKey())

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
        if (snap.exists()) setStats({ ...DEFAULT_STATS, ...(snap.data() as UserStats) })
        else setDoc(statsRef, DEFAULT_STATS)
      },
      (err) => { addToast({ message: 'Błąd ładowania statystyk. Odśwież stronę.', type: 'error' }); setLoading(false) }
    )

    unsub2 = onSnapshot(todayRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DailyLog
          const rawXP = data.totalXP
          const fixedXP = (Number.isFinite(rawXP) && rawXP >= 0) ? rawXP : 0
          setTodayLog({
            completedRoutine: [],
            completedDailyQuests: [],
            completedSideQuests: [],
            keptRules: [],
            dayMode: 'normal',
            ...data,
            totalXP: fixedXP,
          })
          // Repair corrupt value in Firestore so it doesn't come back
          if (!Number.isFinite(rawXP) || rawXP < 0) {
            setDoc(doc(db, 'users', user!.uid, 'logs', currentDateKey), { totalXP: fixedXP }, { merge: true })
          }
        } else {
          setTodayLog({ date: currentDateKey, completedRoutine: [], completedDailyQuests: [], completedSideQuests: [], keptRules: [], totalXP: 0, dayMode: 'normal' })
        }
        setLoading(false)
      },
      (err) => { addToast({ message: 'Błąd ładowania danych dnia. Odśwież stronę.', type: 'error' }); setLoading(false) }
    )

    return () => { unsub1?.(); unsub2?.() }
  }, [user?.uid, currentDateKey])

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
    if (!user || !statsRef || !todayRef || !todayLog) return
    const current = todayLog.completedRoutine ?? []
    const completed = current.includes(itemId)
    const newCompleted = completed
      ? current.filter(id => id !== itemId)
      : [...current, itemId]
    const xpDelta = completed ? -xp : xp

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
      setDoc(todayRef, { ...todayLog, completedRoutine: newCompleted, totalXP: newTodayXP }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, currentDateKey, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const toggleDailyQuest = useCallback(async (questId: string, pillar: Pillar) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const currentDQ = todayLog.completedDailyQuests ?? []
    const completed = currentDQ.includes(questId)
    const newCompleted = completed
      ? currentDQ.filter(id => id !== questId)
      : [...currentDQ, questId]
    const xpDelta = completed ? -XP_VALUES.dailyQuest : XP_VALUES.dailyQuest

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
      setDoc(todayRef, { ...todayLog, completedDailyQuests: newCompleted, totalXP: Math.max(0, (todayLog.totalXP ?? 0) + xpDelta) }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkLevelUp])

  const toggleSideQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const currentSQ = todayLog.completedSideQuests ?? []
    const completed = currentSQ.includes(questId)
    const newCompleted = completed
      ? currentSQ.filter(id => id !== questId)
      : [...currentSQ, questId]
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
      setDoc(todayRef, { ...todayLog, completedSideQuests: newCompleted, totalXP: Math.max(0, (todayLog.totalXP ?? 0) + xpDelta) }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkLevelUp])

  const toggleRule = useCallback(async (ruleId: string) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const currentRules = todayLog.keptRules ?? []
    const kept = currentRules.includes(ruleId)
    const newKept = kept
      ? currentRules.filter(id => id !== ruleId)
      : [...currentRules, ruleId]
    const xpDelta = kept ? -XP_VALUES.rulekept : XP_VALUES.rulekept

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
      setDoc(todayRef, { ...todayLog, keptRules: newKept, totalXP: Math.max(0, (todayLog.totalXP ?? 0) + xpDelta) }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const submitWeeklyReview = useCallback(async (weekStart: string): Promise<boolean> => {
    if (!user || !statsRef) return false
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

    await setDoc(statsRef, finalStats, { merge: true })
    return true
  }, [user, stats, statsRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const submitMonthlyReview = useCallback(async (monthKey: string): Promise<boolean> => {
    if (!user || !statsRef) return false
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

    await setDoc(statsRef, finalStats, { merge: true })
    return true
  }, [user, stats, statsRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const setDayMode = useCallback(async (mode: 'normal' | 'minimum') => {
    if (!user || !todayRef || !todayLog) return
    await setDoc(todayRef, { ...todayLog, dayMode: mode }, { merge: true })
    // Minimum mode resets the no-minimum streak
    if (mode === 'minimum' && statsRef) {
      await setDoc(statsRef, { consecutiveNormalDays: 0, lastNormalDay: currentDateKey }, { merge: true })
    }
  }, [user, todayRef, todayLog, statsRef, currentDateKey])

  // Ghost Protocol: grants XP + marks today's log + tracks behavioral stats
  const completeGhostProtocol = useCallback(async () => {
    if (!user || !statsRef) return
    const withStreak = await applyStreakIfNeeded(stats)
    const today = currentDateKey

    // Behavioral: GP consecutive days
    const lastGhost = withStreak.lastGhostDate ?? null
    const isConsecutiveGhost = lastGhost !== null && (() => {
      const [y, m, d] = today.split('-').map(Number)
      const todayDate = new Date(y, m - 1, d)
      const prev = new Date(lastGhost + 'T12:00:00')
      const diff = Math.round((todayDate.getTime() - prev.getTime()) / 86400000)
      return diff <= 1  // same day re-trigger or consecutive day
    })()
    const newConsecGhost = lastGhost === today
      ? (withStreak.consecutiveGhostDays ?? 0)  // same day, no increment
      : isConsecutiveGhost
        ? (withStreak.consecutiveGhostDays ?? 0) + 1
        : 1  // streak broken, reset to 1

    let newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + 50,
      pillarXP: {
        ...withStreak.pillarXP,
        tozsamosc: (withStreak.pillarXP.tozsamosc ?? 0) + 50,
      },
      totalGhostProtocols: (withStreak.totalGhostProtocols ?? 0) + (lastGhost === today ? 0 : 1),
      consecutiveGhostDays: newConsecGhost,
      lastGhostDate: today,
    }
    newStats = applyPillarBalanceIfNeeded(newStats, 'tozsamosc')
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)
    await Promise.all([
      setDoc(statsRef, finalStats, { merge: true }),
      todayRef ? setDoc(todayRef, { ghostProtocolCompleted: true }, { merge: true }) : Promise.resolve(),
    ])
  }, [user, stats, statsRef, todayRef, currentDateKey, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkAchievements, checkLevelUp])

  const toggleSocialPresence = useCallback(async () => {
    if (!user || !todayRef || !todayLog) return
    await setDoc(todayRef, { socialPresence: !todayLog.socialPresence }, { merge: true })
  }, [user, todayRef, todayLog])

  const togglePhysicalActivity = useCallback(async () => {
    if (!user || !todayRef || !todayLog) return
    await setDoc(todayRef, { physicalActivity: !todayLog.physicalActivity }, { merge: true })
  }, [user, todayRef, todayLog])

  const saveMoodCheckIn = useCallback(async (checkin: Omit<MoodCheckIn, 'timestamp'>) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const existing = todayLog.moodCheckIns ?? []
    if (existing.length >= 3) return
    const newCheckIn: MoodCheckIn = { ...checkin, timestamp: Date.now() }
    const newCheckIns = [...existing, newCheckIn]

    const withStreak = await applyStreakIfNeeded(stats)
    const newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + XP_VALUES.moodCheckIn,
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, { moodCheckIns: newCheckIns }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayRef, todayLog, stats, statsRef, applyStreakIfNeeded, checkAchievements, checkLevelUp])

  const saveKeyMoment = useCallback(async (data: { title: string; note?: string }) => {
    if (!user || !todayRef || !todayLog) return
    const keyMoment: KeyMoment = {
      title: data.title,
      note: data.note,
      savedAt: Date.now(),
    }
    await setDoc(todayRef, { keyMoment }, { merge: true })
  }, [user, todayRef, todayLog])

  const clearKeyMoment = useCallback(async () => {
    if (!user || !todayRef) return
    await setDoc(todayRef, { keyMoment: null }, { merge: true })
  }, [user, todayRef])

  const streakFreezeAvailable = !(stats.streakFreezeUsedMonths ?? []).includes(getMonthKey(new Date()))

  return {
    stats, todayLog, loading,
    toggleRoutine, toggleDailyQuest, toggleSideQuest, toggleRule,
    submitWeeklyReview, submitMonthlyReview, setDayMode,
    streakFreezeAvailable, completeGhostProtocol, toggleSocialPresence, togglePhysicalActivity,
    saveMoodCheckIn,
    saveKeyMoment,
    clearKeyMoment,
  }
}
