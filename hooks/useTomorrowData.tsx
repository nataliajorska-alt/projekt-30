'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DailyLog, Pillar, UserStats } from '@/types'
import { tomorrowKey } from '@/lib/gameLogic'

const EMPTY_LOG: DailyLog = {
  date: '', completedRoutine: [], completedDailyQuests: [],
  completedSideQuests: [], keptRules: [], totalXP: 0, dayMode: 'normal',
}

export function useTomorrowData() {
  const { user } = useAuth()
  const [tomorrowLog, setTomorrowLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const dateKey = tomorrowKey()

  const tomorrowRef = user ? doc(db, 'users', user.uid, 'logs', dateKey) : null
  const statsRef    = user ? doc(db, 'users', user.uid, 'data', 'stats') : null

  useEffect(() => {
    if (!user || !tomorrowRef) { setLoading(false); return }
    const unsub = onSnapshot(tomorrowRef, (snap) => {
      setTomorrowLog(snap.exists()
        ? { ...EMPTY_LOG, ...(snap.data() as DailyLog) }
        : { ...EMPTY_LOG, date: dateKey }
      )
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid, dateKey])

  const toggleTomorrowRoutine = useCallback(async (itemId: string, xp: number) => {
    if (!user || !tomorrowRef || !tomorrowLog || !statsRef) return
    const current = tomorrowLog.completedRoutine ?? []
    const done = current.includes(itemId)
    const newCompleted = done ? current.filter(id => id !== itemId) : [...current, itemId]
    const xpDelta = done ? -xp : xp
    const newLogXP = Math.max(0, (tomorrowLog.totalXP ?? 0) + xpDelta)

    const snap = await getDoc(statsRef)
    if (!snap.exists()) return
    const stats = snap.data() as UserStats

    await Promise.all([
      setDoc(tomorrowRef, { completedRoutine: newCompleted, totalXP: newLogXP, date: dateKey }, { merge: true }),
      setDoc(statsRef, { totalXP: Math.max(0, (stats.totalXP ?? 0) + xpDelta) }, { merge: true }),
    ])
  }, [user, tomorrowRef, tomorrowLog, statsRef, dateKey])

  const toggleTomorrowQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !tomorrowRef || !tomorrowLog || !statsRef) return
    const current = tomorrowLog.completedDailyQuests ?? []
    const done = current.includes(questId)
    const newCompleted = done ? current.filter(id => id !== questId) : [...current, questId]
    const xpDelta = done ? -xp : xp
    const newLogXP = Math.max(0, (tomorrowLog.totalXP ?? 0) + xpDelta)

    const snap = await getDoc(statsRef)
    if (!snap.exists()) return
    const stats = snap.data() as UserStats

    // ALSO sync to aprilQuestLog — the canonical store DailyQuests reads from.
    // Bez tego quest zrobiony „na zapas" wczoraj nie wyświetli się dziś jako zrobiony.
    const aprilQuestLogRef = doc(db, 'users', user.uid, 'data', 'aprilQuestLog')
    const aprilSnap = await getDoc(aprilQuestLogRef)
    const aprilData = aprilSnap.exists() ? (aprilSnap.data() as { completed?: string[] }) : {}
    const aprilCompleted = aprilData.completed ?? []
    const newAprilCompleted = done
      ? aprilCompleted.filter(id => id !== questId)
      : (aprilCompleted.includes(questId) ? aprilCompleted : [...aprilCompleted, questId])

    await Promise.all([
      setDoc(tomorrowRef, { completedDailyQuests: newCompleted, totalXP: newLogXP, date: dateKey }, { merge: true }),
      setDoc(statsRef, {
        totalXP: Math.max(0, (stats.totalXP ?? 0) + xpDelta),
        pillarXP: {
          ...stats.pillarXP,
          [pillar]: Math.max(0, (stats.pillarXP?.[pillar] ?? 0) + xpDelta),
        },
        totalQuestsCompleted: Math.max(0, (stats.totalQuestsCompleted ?? 0) + (done ? -1 : 1)),
      }, { merge: true }),
      setDoc(aprilQuestLogRef, { completed: newAprilCompleted }, { merge: true }),
    ])
  }, [user, tomorrowRef, tomorrowLog, statsRef, dateKey])

  return { tomorrowLog, tomorrowDateKey: dateKey, loading, toggleTomorrowRoutine, toggleTomorrowQuest }
}
