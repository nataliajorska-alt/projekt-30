'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { parseMonthPlan, type MonthPlan } from '@/lib/seasonal/monthPlans'
import { createQuestBook } from '@/lib/seasonal/aprilData'

// Plany miesięcy z /plan. Kilka komponentów woła hook naraz — Firestore SDK
// i tak współdzieli jeden nasłuch na to samo zapytanie.
export function useMonthPlans() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<MonthPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const unsub = onSnapshot(
      collection(db, ...paths.monthPlansCol(user.uid)),
      snap => {
        const parsed: MonthPlan[] = []
        snap.forEach(d => {
          const p = parseMonthPlan({ monthKey: d.id, ...d.data() })
          if (p) parsed.push(p)
        })
        setPlans(parsed)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  const savePlan = useCallback(async (plan: MonthPlan) => {
    if (!user) return
    const clean: MonthPlan = {
      ...plan,
      quests: [...plan.quests].sort((a, b) => a.date.localeCompare(b.date)),
      updatedAt: new Date().toISOString(),
    }
    // Firestore odrzuca undefined — pytanie zapisujemy tylko, gdy jest.
    if (!clean.question) delete clean.question
    await setDoc(doc(db, ...paths.monthPlanDoc(user.uid, plan.monthKey)), clean)
  }, [user])

  const deletePlan = useCallback(async (monthKey: string) => {
    if (!user) return
    await deleteDoc(doc(db, ...paths.monthPlanDoc(user.uid, monthKey)))
  }, [user])

  return { plans, loading, savePlan, deletePlan }
}

/** Księga questów z planami z apki — zamiast gołych helperów z aprilData. */
export function useQuestBook() {
  const { plans, loading } = useMonthPlans()
  const book = useMemo(() => createQuestBook(plans), [plans])
  return { book, loading }
}
