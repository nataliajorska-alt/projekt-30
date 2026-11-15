'use client'
import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, deleteDoc } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { DayPlanSchema, type DayPlan } from '@/lib/schemas'

export type { DayPlan }

// Plan dnia od asystentki: users/{uid}/dayPlans/{dateKey}. Nasłuch zamiast
// jednorazowego odczytu — plan ułożony w arkuszu ma się od razu pojawić na
// ekranie „Dziś" (i na drugim urządzeniu), bez odświeżania.
export function useDayPlan(dateKey: string) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<DayPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setPlan(null); setLoading(false); return }
    setLoading(true)
    return onSnapshot(
      doc(db, ...paths.dayPlanDoc(user.uid, dateKey)),
      snap => {
        const r = snap.exists() ? DayPlanSchema.safeParse({ ...snap.data(), dateKey }) : null
        setPlan(r?.success && r.data.text.trim() ? r.data : null)
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [user, dateKey])

  const savePlan = useCallback(async (p: { text: string; model: string; demo?: boolean; truncated?: boolean }) => {
    if (!user) return
    const data: DayPlan = { dateKey, text: p.text, model: p.model, createdAt: new Date().toISOString() }
    if (p.demo) data.demo = true
    if (p.truncated) data.truncated = true
    await setDoc(doc(db, ...paths.dayPlanDoc(user.uid, dateKey)), data)
  }, [user, dateKey])

  const deletePlan = useCallback(async () => {
    if (!user) return
    await deleteDoc(doc(db, ...paths.dayPlanDoc(user.uid, dateKey)))
  }, [user, dateKey])

  return { plan, loading, savePlan, deletePlan }
}
