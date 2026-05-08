'use client'
import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DailyLog } from '@/types'

export function useTimelineData() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<Record<string, DailyLog>>({})
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'logs'))
      const map: Record<string, DailyLog> = {}
      const defaults = {
        completedRoutine: [] as string[],
        completedDailyQuests: [] as string[],
        completedSideQuests: [] as string[],
        keptRules: [] as string[],
        dayMode: 'normal' as const,
      }
      snap.forEach(doc => {
        const data = doc.data() as DailyLog
        const safeXP = Number.isFinite(data.totalXP) && data.totalXP >= 0 ? data.totalXP : 0
        map[doc.id] = {
          ...defaults,
          ...data,
          date: doc.id,   // zawsze doc.id jako date — source of truth
          totalXP: safeXP,
        }
      })
      setLogs(map)
    } catch (err) {
      console.error('timeline fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    fetchLogs()
  }, [fetchLogs])

  // Refetch when tab regains focus so heatmap stays current after logging activity elsewhere.
  useEffect(() => {
    const onFocus = () => fetchLogs()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchLogs])

  return { logs, loading, refetch: fetchLogs }
}
