'use client'
import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { parseSafe, DailyLogSchema } from '@/lib/schemas'
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
      snap.forEach(doc => {
        const parsed = parseSafe<DailyLog>(
          DailyLogSchema,
          doc.data(),
          {
            date: doc.id,
            completedRoutine: [],
            completedDailyQuests: [],
            completedSideQuests: [],
            keptRules: [],
            totalXP: 0,
            dayMode: 'normal',
          } as DailyLog,
          `DailyLog ${doc.id}`,
        )
        map[doc.id] = { ...parsed, date: doc.id }   // doc.id jako source of truth dla date
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
