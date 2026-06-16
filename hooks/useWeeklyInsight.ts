'use client'
import { useEffect, useState, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { useTimelineData } from './useTimelineData'
import { getISOWeekKey } from '@/lib/gameLogic'
import { computeWeeklyInsight, type WeeklyInsight } from '@/lib/weeklyInsight'
import { parseSafe, WeeklyInsightSchema } from '@/lib/schemas'
import { fireInsightSeen } from './useWeeklyInsightBadge'

// Lazy generation: tylko od niedzieli (lokalny dzień tygodnia 0) lub poniedziałku (1)
// dla bieżącego tygodnia ISO. Wcześniej w tygodniu czeka — zbyt mało danych.
function shouldGenerateNow(now: Date = new Date()): boolean {
  const dow = now.getDay()
  return dow === 0 || dow === 1
}

export function useWeeklyInsight() {
  const { user } = useAuth()
  const { logs, loading: logsLoading } = useTimelineData()
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasNewBadge, setHasNewBadge] = useState(false)

  const weekKey = getISOWeekKey(new Date())

  const ensureInsight = useCallback(async () => {
    if (!user || logsLoading) return
    setLoading(true)

    const ref = doc(db, ...paths.insightDoc(user.uid, weekKey))
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data = parseSafe<WeeklyInsight>(
        WeeklyInsightSchema,
        snap.data(),
        { weekKey, generatedAt: new Date().toISOString(), totalHypotheses: 0, testsRun: 0, passedCount: 0, outcomes: [], headline: '', body: '', hasContent: false },
        `WeeklyInsight ${weekKey}`,
      )
      setInsight(data)
      // Badge: "nowy" gdy sessionStorage nie pamięta że już widział tego tygodnia.
      const seenKey = `insight_seen_${weekKey}`
      setHasNewBadge(!sessionStorage.getItem(seenKey))
      setLoading(false)
      return
    }

    // Brak cachu — generuj tylko jeśli niedziela/poniedziałek.
    if (!shouldGenerateNow()) {
      setInsight(null)
      setHasNewBadge(false)
      setLoading(false)
      return
    }

    const fresh = computeWeeklyInsight(logs, weekKey)
    await setDoc(ref, fresh)
    setInsight(fresh)
    setHasNewBadge(true)
    setLoading(false)
  }, [user?.uid, weekKey, logs, logsLoading])

  useEffect(() => { ensureInsight() }, [ensureInsight])

  /** Wymusza regenerację (np. przycisk "policz jeszcze raz"). */
  const regenerate = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const fresh = computeWeeklyInsight(logs, weekKey)
    const ref = doc(db, ...paths.insightDoc(user.uid, weekKey))
    await setDoc(ref, fresh)
    setInsight(fresh)
    setHasNewBadge(true)
    setLoading(false)
  }, [user?.uid, weekKey, logs])

  /** Oznacza badge jako "widziany" w tej sesji. */
  const markSeen = useCallback(() => {
    sessionStorage.setItem(`insight_seen_${weekKey}`, '1')
    setHasNewBadge(false)
    fireInsightSeen()
  }, [weekKey])

  return { insight, loading, regenerate, hasNewBadge, markSeen, weekKey }
}
