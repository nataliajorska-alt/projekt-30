'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, getDoc, setDoc, getDocs, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { todayKey, getISOWeekKey } from '@/lib/gameLogic'

export interface HeartBlockRituals {
  gratitude: boolean
  prayer: boolean
  planTomorrow: boolean
  breath: boolean
}

export interface HeartBlock {
  weekKey: string
  startedDateKey: string
  pain: string
  thoughts: [string, string, string]
  steps: [string, string, string]
  closing: string
  rituals: HeartBlockRituals
  completedAt: string | null
  updatedAt: string
}

function emptyBlock(weekKey: string): HeartBlock {
  return {
    weekKey,
    startedDateKey: todayKey(),
    pain: '',
    thoughts: ['', '', ''],
    steps: ['', '', ''],
    closing: '',
    rituals: { gratitude: false, prayer: false, planTomorrow: false, breath: false },
    completedAt: null,
    updatedAt: new Date().toISOString(),
  }
}

export function useHeartBlock() {
  const { user } = useAuth()
  const [block, setBlock] = useState<HeartBlock | null>(null)
  const [history, setHistory] = useState<HeartBlock[]>([])
  const [loading, setLoading] = useState(true)
  const weekKey = getISOWeekKey(new Date())

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const ref = doc(db, 'users', user.uid, 'heartBlocks', weekKey)
    const snap = await getDoc(ref)
    setBlock(snap.exists() ? (snap.data() as HeartBlock) : emptyBlock(weekKey))

    const histRef = collection(db, 'users', user.uid, 'heartBlocks')
    const q = query(histRef, orderBy('weekKey', 'desc'))
    const histSnap = await getDocs(q)
    setHistory(histSnap.docs.map(d => d.data() as HeartBlock))
    setLoading(false)
  }, [user?.uid, weekKey])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (next: Partial<HeartBlock>) => {
    if (!user) return
    const merged: HeartBlock = {
      ...(block ?? emptyBlock(weekKey)),
      ...next,
      weekKey,
      updatedAt: new Date().toISOString(),
    }
    setBlock(merged)
    const ref = doc(db, 'users', user.uid, 'heartBlocks', weekKey)
    await setDoc(ref, { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid, weekKey, block])

  const markComplete = useCallback(async () => {
    if (!user || !block) return
    const completedAt = new Date().toISOString()
    await save({ completedAt })
  }, [user?.uid, block, save])

  return { block, history, loading, weekKey, save, markComplete }
}
