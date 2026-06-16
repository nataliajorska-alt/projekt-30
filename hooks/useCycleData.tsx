'use client'
import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import type { CycleLog } from '@/lib/cycle-data'

export function useCycleData() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<CycleLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const snap = await getDocs(
        query(collection(db, ...paths.cycleCol(user.uid)), orderBy('startDate', 'desc'))
      )
      setLogs(snap.docs.map(d => ({ ...d.data(), docId: d.id } as CycleLog)))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const logCycleStart = useCallback(async (startDate: string) => {
    if (!user) return
    const entry: Omit<CycleLog, 'id' | 'docId'> & { id: string } = {
      id: `cycle_${startDate}`,
      startDate,
      savedAt: new Date().toISOString(),
    }
    await addDoc(collection(db, ...paths.cycleCol(user.uid)), entry)
    await fetchLogs()
  }, [user, fetchLogs])

  const deleteCycleLog = useCallback(async (docId: string) => {
    if (!user) return
    await deleteDoc(doc(db, ...paths.cycleDoc(user.uid, docId)))
    await fetchLogs()
  }, [user, fetchLogs])

  return { logs, loading, logCycleStart, deleteCycleLog }
}
