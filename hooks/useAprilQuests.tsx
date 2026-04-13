'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { useGameData } from './useGameData'
import type { Pillar } from '@/types'

export interface QuestSkip {
  questId: string
  reason: string
  skippedAt: string
}

export interface QuestPostpone {
  questId: string
  originalDate: string
  targetDate: string
  postponedAt: string
}

interface AprilQuestLog {
  completed: string[]
  skips: QuestSkip[]
  postponed: QuestPostpone[]
}

const DEFAULT_LOG: AprilQuestLog = { completed: [], skips: [], postponed: [] }

export function useAprilQuests() {
  const { user } = useAuth()
  const { toggleDailyQuest } = useGameData()
  const [log, setLog] = useState<AprilQuestLog>(DEFAULT_LOG)
  const [loading, setLoading] = useState(true)

  const logRef = user ? doc(db, 'users', user.uid, 'data', 'aprilQuestLog') : null

  useEffect(() => {
    if (!user || !logRef) { setLoading(false); return }
    const unsub = onSnapshot(logRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          // backwards compat: old postponed was string[], migrate to QuestPostpone[]
          const rawPostponed = data.postponed ?? []
          const migratedPostponed: QuestPostpone[] = rawPostponed.filter(
            (p: any) => typeof p === 'object' && p.questId && p.targetDate
          )
          setLog({
            completed: data.completed ?? [],
            skips: data.skips ?? [],
            postponed: migratedPostponed,
          })
        } else {
          setLog(DEFAULT_LOG)
        }
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [user?.uid])

  const completeQuest = useCallback(async (questId: string, pillar: Pillar) => {
    if (!user || !logRef || log.completed.includes(questId)) return
    const updated = { ...log, completed: [...log.completed, questId] }
    await setDoc(logRef, updated, { merge: true })
    await toggleDailyQuest(questId, pillar)
  }, [user, logRef, log, toggleDailyQuest])

  const skipQuest = useCallback(async (questId: string, reason: string) => {
    if (!user || !logRef) return
    const skip: QuestSkip = { questId, reason, skippedAt: new Date().toISOString() }
    const updated = { ...log, skips: [...log.skips, skip] }
    await setDoc(logRef, updated, { merge: true })
  }, [user, logRef, log])

  const postponeQuest = useCallback(async (questId: string, originalDate: string, targetDate: string) => {
    if (!user || !logRef) return
    const filtered = log.postponed.filter(p => p.questId !== questId)
    const entry: QuestPostpone = {
      questId,
      originalDate,
      targetDate,
      postponedAt: new Date().toISOString(),
    }
    const updated = { ...log, postponed: [...filtered, entry] }
    await setDoc(logRef, updated, { merge: true })
  }, [user, logRef, log])

  const skippedIds = log.skips.map(s => s.questId)

  return { log, skippedIds, loading, completeQuest, skipQuest, postponeQuest }
}
