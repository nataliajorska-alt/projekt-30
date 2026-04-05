'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DailyLog, UserStats } from '@/types'
import { todayKey, XP_VALUES } from '@/lib/gameLogic'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { Pillar } from '@/types'

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
}

export function useGameData() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)

  const statsRef = user ? doc(db, 'users', user.uid, 'data', 'stats') : null
  const todayRef = user ? doc(db, 'users', user.uid, 'logs', todayKey()) : null

  useEffect(() => {
    if (!user || !statsRef || !todayRef) { setLoading(false); return }

    let unsub1: () => void
    let unsub2: () => void

    unsub1 = onSnapshot(statsRef,
      (snap) => {
        if (snap.exists()) setStats(snap.data() as UserStats)
        else setDoc(statsRef, DEFAULT_STATS)
      },
      (err) => { console.error('stats error:', err); setLoading(false) }
    )

    unsub2 = onSnapshot(todayRef,
      (snap) => {
        if (snap.exists()) setTodayLog(snap.data() as DailyLog)
        else setTodayLog({ date: todayKey(), completedRoutine: [], completedDailyQuests: [], completedSideQuests: [], keptRules: [], totalXP: 0, dayMode: 'normal' })
        setLoading(false)
      },
      (err) => { console.error('today error:', err); setLoading(false) }
    )

    return () => { unsub1?.(); unsub2?.() }
  }, [user?.uid])

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
      return {
        unlockedAchievements: [...newStats.unlockedAchievements, ...newlyUnlocked],
        totalXP: newStats.totalXP + bonusXP,
      }
    }
    return {}
  }, [])

  const toggleRoutine = useCallback(async (itemId: string, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const completed = todayLog.completedRoutine.includes(itemId)
    const newCompleted = completed
      ? todayLog.completedRoutine.filter(id => id !== itemId)
      : [...todayLog.completedRoutine, itemId]
    const xpDelta = completed ? -xp : xp

    const newTodayXP = todayLog.totalXP + xpDelta
    const newTotalXP = Math.max(0, stats.totalXP + xpDelta)
    const newRoutinesTotal = stats.totalRoutinesCompleted + (completed ? -1 : 1)

    const newStats: UserStats = {
      ...stats,
      totalXP: newTotalXP,
      totalRoutinesCompleted: Math.max(0, newRoutinesTotal),
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }

    await Promise.all([
      setDoc(todayRef, { ...todayLog, completedRoutine: newCompleted, totalXP: newTodayXP }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements])

  const toggleDailyQuest = useCallback(async (questId: string, pillar: Pillar) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const completed = todayLog.completedDailyQuests.includes(questId)
    const newCompleted = completed
      ? todayLog.completedDailyQuests.filter(id => id !== questId)
      : [...todayLog.completedDailyQuests, questId]
    const xpDelta = completed ? -XP_VALUES.dailyQuest : XP_VALUES.dailyQuest

    const newStats: UserStats = {
      ...stats,
      totalXP: Math.max(0, stats.totalXP + xpDelta),
      totalQuestsCompleted: Math.max(0, stats.totalQuestsCompleted + (completed ? -1 : 1)),
      pillarXP: {
        ...stats.pillarXP,
        [pillar]: Math.max(0, (stats.pillarXP[pillar] ?? 0) + xpDelta),
      },
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }

    await Promise.all([
      setDoc(todayRef, { ...todayLog, completedDailyQuests: newCompleted, totalXP: todayLog.totalXP + xpDelta }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements])

  const completeSideQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    if (todayLog.completedSideQuests.includes(questId)) return
    const newCompleted = [...todayLog.completedSideQuests, questId]

    const newStats: UserStats = {
      ...stats,
      totalXP: stats.totalXP + xp,
      totalSideQuestsCompleted: stats.totalSideQuestsCompleted + 1,
      totalQuestsCompleted: stats.totalQuestsCompleted + 1,
      pillarXP: {
        ...stats.pillarXP,
        [pillar]: (stats.pillarXP[pillar] ?? 0) + xp,
      },
    }
    const achUpdates = await checkAchievements(newStats)
    const finalStats = { ...newStats, ...achUpdates }

    await Promise.all([
      setDoc(todayRef, { ...todayLog, completedSideQuests: newCompleted, totalXP: todayLog.totalXP + xp }, { merge: true }),
      setDoc(statsRef, finalStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef, checkAchievements])

  const toggleRule = useCallback(async (ruleId: string) => {
    if (!user || !statsRef || !todayRef || !todayLog) return
    const kept = todayLog.keptRules.includes(ruleId)
    const newKept = kept
      ? todayLog.keptRules.filter(id => id !== ruleId)
      : [...todayLog.keptRules, ruleId]
    const xpDelta = kept ? -XP_VALUES.rulekept : XP_VALUES.rulekept

    const newStats: UserStats = {
      ...stats,
      totalXP: Math.max(0, stats.totalXP + xpDelta),
      totalRulesKept: Math.max(0, stats.totalRulesKept + (kept ? -1 : 1)),
    }

    await Promise.all([
      setDoc(todayRef, { ...todayLog, keptRules: newKept, totalXP: todayLog.totalXP + xpDelta }, { merge: true }),
      setDoc(statsRef, newStats, { merge: true }),
    ])
  }, [user, todayLog, stats, statsRef, todayRef])

  const logDayStreak = useCallback(async () => {
    if (!user || !statsRef) return
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    const yRef = doc(db, 'users', user.uid, 'logs', yKey)
    const ySnap = await getDoc(yRef)

    const newStreak = ySnap.exists() ? stats.currentStreak + 1 : 1
    const newLongest = Math.max(stats.longestStreak, newStreak)
    const newDays = stats.totalDaysLogged + 1

    await updateDoc(statsRef, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalDaysLogged: newDays,
    })
  }, [user, stats, statsRef])

  const setDayMode = useCallback(async (mode: 'normal' | 'minimum') => {
    if (!user || !todayRef || !todayLog) return
    await setDoc(todayRef, { ...todayLog, dayMode: mode }, { merge: true })
  }, [user, todayRef, todayLog])

  return {
    stats, todayLog, loading,
    toggleRoutine, toggleDailyQuest, completeSideQuest, toggleRule, logDayStreak, setDayMode,
  }
}
