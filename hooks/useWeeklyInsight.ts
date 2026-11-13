'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { doc, getDoc, setDoc } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { useTimelineData } from './useTimelineData'
import { useCycleData } from './useCycleData'
import { useCycleSettings } from './useCycleSettings'
import { getISOWeekKey, getEffectiveNow } from '@/lib/gameLogic'
import { getPhaseIdForDate } from '@/lib/cycle-data'
import { computeWeeklyInsight, logsSignature, type WeeklyInsight } from '@/lib/weeklyInsight'
import type { HypothesisContext } from '@/lib/weeklyHypotheses'
import { parseSafe, WeeklyInsightSchema } from '@/lib/schemas'
import { fireInsightSeen } from './useWeeklyInsightBadge'

export function useWeeklyInsight() {
  const { user } = useAuth()
  const { logs, loading: logsLoading } = useTimelineData()
  const { logs: cycleLogs } = useCycleData()
  const { settings: cycleSettings } = useCycleSettings()
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasNewBadge, setHasNewBadge] = useState(false)

  const weekKey = getISOWeekKey(getEffectiveNow())

  // Kontekst z fazą cyklu — daje silnikowi „trzecią oś". Stabilny referencyjnie,
  // by nie retriggerować przeliczeń bez zmiany danych cyklu.
  const ctx = useMemo<HypothesisContext>(
    () => (cycleLogs.length > 0
      ? { cyclePhaseOf: (dateKey: string) => getPhaseIdForDate(cycleLogs, dateKey, cycleSettings) }
      : {}),
    [cycleLogs, cycleSettings],
  )

  const ensureInsight = useCallback(async () => {
    if (!user || logsLoading) return
    setLoading(true)

    const ref = doc(db, ...paths.insightDoc(user.uid, weekKey))
    const sig = logsSignature(logs, ctx)

    try {
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = parseSafe<WeeklyInsight>(
          WeeklyInsightSchema,
          snap.data(),
          { weekKey, generatedAt: new Date().toISOString(), totalHypotheses: 0, testsRun: 0, passedCount: 0, outcomes: [], headline: '', body: '', hasContent: false },
          `WeeklyInsight ${weekKey}`,
        )
        // Cache jest aktualny tylko gdy policzony z tych samych danych. Gdy dojdą
        // nowe check-iny/dni — przelicz (insight odświeża się codziennie, nie raz
        // w tygodniu).
        if (data.inputSig === sig) {
          setInsight(data)
          // Badge: "nowy" gdy sessionStorage nie pamięta że już widział tego tygodnia.
          const seenKey = `insight_seen_${weekKey}`
          setHasNewBadge(!sessionStorage.getItem(seenKey))
          setLoading(false)
          return
        }
      }
    } catch (e) {
      // Offline / błąd odczytu — liczymy świeży insight lokalnie, zamiast
      // zostawiać loading=true na zawsze (to chowało też fallbackowy
      // PatternOfTheWeek na dashboardzie).
      console.warn('weekly insight read error', e)
    }

    // Brak cachu albo dane się zmieniły — przelicz (każdego dnia, nie tylko nd/pn).
    const fresh = computeWeeklyInsight(logs, weekKey, ctx)
    // Celowo bez await: offline promise setDoc rozstrzyga się dopiero po
    // acku serwera, a UI nie ma na co czekać — cache to optymalizacja.
    setDoc(ref, fresh).catch(e => console.warn('weekly insight cache write error', e))
    setInsight(fresh)
    setHasNewBadge(true)
    setLoading(false)
  }, [user?.uid, weekKey, logs, logsLoading, ctx])

  useEffect(() => { ensureInsight() }, [ensureInsight])

  /** Wymusza regenerację (np. przycisk "policz jeszcze raz"). */
  const regenerate = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const fresh = computeWeeklyInsight(logs, weekKey, ctx)
    const ref = doc(db, ...paths.insightDoc(user.uid, weekKey))
    // Jak w ensureInsight: bez await, żeby offline nie wieszał loading=true.
    setDoc(ref, fresh).catch(e => console.warn('weekly insight cache write error', e))
    setInsight(fresh)
    setHasNewBadge(true)
    setLoading(false)
  }, [user?.uid, weekKey, logs, ctx])

  /** Oznacza badge jako "widziany" w tej sesji. */
  const markSeen = useCallback(() => {
    sessionStorage.setItem(`insight_seen_${weekKey}`, '1')
    setHasNewBadge(false)
    fireInsightSeen()
  }, [weekKey])

  return { insight, loading, regenerate, hasNewBadge, markSeen, weekKey }
}
