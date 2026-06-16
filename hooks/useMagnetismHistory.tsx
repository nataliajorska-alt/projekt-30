'use client'
import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { parseSafe, DailyLogSchema } from '@/lib/schemas'
import type { DailyLog } from '@/types'
import { calcMagnetism, MagnetismBreakdown } from '@/lib/magnetism'

export interface MagnetismDay {
  date: string
  log: DailyLog
  score: MagnetismBreakdown
}

export function useMagnetismHistory(days: number = 7) {
  const { user } = useAuth()
  const [history, setHistory] = useState<MagnetismDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const logsRef = collection(db, ...paths.logsCol(user.uid))
    const q = query(logsRef, orderBy('date', 'desc'), limit(days))

    getDocs(q).then(snap => {
      const result: MagnetismDay[] = snap.docs
        .map(doc => {
          const parsed = parseSafe<DailyLog>(
            DailyLogSchema,
            doc.data(),
            { date: doc.id, completedRoutine: [], completedDailyQuests: [], completedSideQuests: [], keptRules: [], totalXP: 0, dayMode: 'normal' } as DailyLog,
            `DailyLog ${doc.id}`,
          )
          const log = { ...parsed, date: doc.id }
          return { date: log.date, log, score: calcMagnetism(log) }
        })
        .sort((a, b) => a.date.localeCompare(b.date))
      setHistory(result)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid, days])

  return { history, loading }
}
