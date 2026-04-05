'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { useGameData } from './useGameData'
import { XP_VALUES } from '@/lib/gameLogic'
import type { Pillar } from '@/types'

interface AprilQuestLog {
  completed: string[]
  skipped: string[]
}

const DEFAULT_LOG: AprilQuestLog = { completed: [], skipped: [] }

export function useAprilQuests() {
  const { user } = useAuth()
  const { stats, toggleDailyQuest } = useGameData()
  const [log, setLog] = useState<AprilQuestLog>(DEFAULT_LOG)
  const [loading, setLoading] = useState(true)

  const logRef = user ? doc(db, 'users', user.uid, 'data', 'aprilQuestLog') : null

  useEffect(() => {
    if (!user || !logRef) { setLoading(false); return }
    const unsub = onSnapshot(logRef,
      (snap) => {
        if (snap.exists()) setLog(snap.data() as AprilQuestLog)
        else setLog(DEFAULT_LOG)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [user?.uid])

  const completeQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !logRef || log.completed.includes(questId)) return
    const updated = { ...log, completed: [...log.completed, questId] }
    await setDoc(logRef, updated, { merge: true })
    // Award XP via the main game data hook (reuse daily quest XP logic)
    await toggleDailyQuest(questId, pillar)
  }, [user, logRef, log, toggleDailyQuest])

  const skipQuest = useCallback(async (questId: string) => {
    if (!user || !logRef) return
    const updated = { ...log, skipped: [...log.skipped, questId] }
    await setDoc(logRef, updated, { merge: true })
  }, [user, logRef, log])

  return { log, loading, completeQuest, skipQuest }
}
