'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  doc, setDoc, onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DailyLog, UserStats, MoodCheckIn, KeyMoment } from '@/types'
import { todayKey, XP_VALUES, getISOWeekKey, getLevelFromXP, getMonthKey } from '@/lib/gameLogic'
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
        if (snap.exists()) setTodayLog(snap.data() as DailyLog)
        else setTodayLog({ date: currentDateKey, completedRoutine: [], completedDailyQuests: [], completedSideQuests: [], keptRules: [], totalXP: 0, dayMode: 'normal' })
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
    const completed = todayLog.completedRoutine.includes(itemId)
    const newCompleted = completed
      ? todayLog.completedRoutine.filter(id => id !== itemId)
      : [...todayLog.completedRoutine, itemId]
    const xpDelta = completed ? -xp : xp

    const newTodayXP = todayLog.totalXP + xpDelta
    const withStreak = await applyStreakIfNeeded(stats)
    const newTotalXP = Math.max(0, withStreak.totalXP + xpDelta)
    const newRoutinesTotal = withStreak.totalRoutinesCompleted + (completed ? -1 : 1)

    const newStats: UserStats = {
      ...withStreak,
      totalXP: newTotalXP,
      totalRoutinesCompleted: Math.max(0, newRoutinesTotal),
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)

    await Promise.all([
      setDoc(todayRef, { ...todayLog, completedRoutine: newCompleted, totalXP: newTodayXP }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, checkLevelUp])

  const toggleDailyQuest = useCallback(async (questId: string, pillar: Pillar) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const completed = todayLog.completedDailyQuests.includes(questId)
    const newCompleted = completed
      ? todayLog.completedDailyQuests.filter(id => id !== questId)
      : [...todayLog.completedDailyQuests, questId]
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
      setDoc(todayRef, { ...todayLog, completedDailyQuests: newCompleted, totalXP: todayLog.totalXP + xpDelta }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkLevelUp])

  const toggleSideQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const completed = todayLog.completedSideQuests.includes(questId)
    const newCompleted = completed
      ? todayLog.completedSideQuests.filter(id => id !== questId)
      : [...todayLog.completedSideQuests, questId]
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
      setDoc(todayRef, { ...todayLog, completedSideQuests: newCompleted, totalXP: Math.max(0, todayLog.totalXP + xpDelta) }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkLevelUp])

  const toggleRule = useCallback(async (ruleId: string) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const kept = todayLog.keptRules.includes(ruleId)
    const newKept = kept
      ? todayLog.keptRules.filter(id => id !== ruleId)
      : [...todayLog.keptRules, ruleId]
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
      setDoc(todayRef, { ...todayLog, keptRules: newKept, totalXP: todayLog.totalXP + xpDelta }, { merge: true }),
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
  }, [user, todayRef, todayLog])

  // Ghost Protocol: grants XP + marks today's log
  const completeGhostProtocol = useCallback(async () => {
    if (!user || !statsRef) return
    const withStreak = await applyStreakIfNeeded(stats)
    let newStats: UserStats = {
      ...withStreak,
      totalXP: withStreak.totalXP + 50,
      pillarXP: {
        ...withStreak.pillarXP,
        tozsamosc: (withStreak.pillarXP.tozsamosc ?? 0) + 50,
      },
    }
    newStats = applyPillarBalanceIfNeeded(newStats, 'tozsamosc')
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }
    checkLevelUp(stats.totalXP, finalStats.totalXP)
    await Promise.all([
      setDoc(statsRef, finalStats, { merge: true }),
      todayRef ? setDoc(todayRef, { ghostProtocolCompleted: true }, { merge: true }) : Promise.resolve(),
    ])
  }, [user, stats, statsRef, todayRef, applyStreakIfNeeded, applyPillarBalanceIfNeeded, checkAchievements, checkLevelUp])

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
