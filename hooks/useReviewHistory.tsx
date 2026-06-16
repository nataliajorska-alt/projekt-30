'use client'
import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import type { WeeklyReview, MonthlyReview, QuarterlyReview } from '@/types'
import { parseSafe, WeeklyReviewSchema, MonthlyReviewSchema, QuarterlyReviewSchema, ZERO_PILLAR_RATING } from '@/lib/schemas'
import { getMonthKey } from '@/lib/gameLogic'
import { getCurrentQuarterKey } from '@/lib/quarters'

function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

export function useReviewHistory() {
  const { user } = useAuth()
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([])
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>([])
  const [quarterlyReviews, setQuarterlyReviews] = useState<QuarterlyReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchReviews = async () => {
      setLoading(true)
      try {
        const [weeklySnap, monthlySnap, quarterlySnap] = await Promise.all([
          getDocs(query(collection(db, ...paths.reviewsCol(user.uid)), orderBy('weekStart', 'desc'))),
          getDocs(query(collection(db, ...paths.monthlyReviewsCol(user.uid)), orderBy('month', 'desc'))),
          getDocs(query(collection(db, ...paths.quarterlyReviewsCol(user.uid)), orderBy('quarter', 'desc'))),
        ])

        setWeeklyReviews(weeklySnap.docs.map(d => parseSafe<WeeklyReview>(
          WeeklyReviewSchema,
          d.data(),
          { weekStart: d.id, highlights: '', challenges: '', pillarsRated: { ...ZERO_PILLAR_RATING }, nextWeekFocus: '', xpEarned: 0 },
          `WeeklyReview ${d.id}`,
        )))
        setMonthlyReviews(monthlySnap.docs.map(d => parseSafe<MonthlyReview>(
          MonthlyReviewSchema,
          d.data(),
          { month: d.id, highlights: '', challenges: '', pillarsRated: { ...ZERO_PILLAR_RATING }, intentionNextMonth: '', xpEarned: 0, savedAt: new Date().toISOString() },
          `MonthlyReview ${d.id}`,
        )))
        setQuarterlyReviews(quarterlySnap.docs.map(d => parseSafe<QuarterlyReview>(
          QuarterlyReviewSchema,
          d.data(),
          { quarter: d.id, lessons: '', openFronts: '', bridgeToNext: '', whatChanged: '', xpEarned: 0, savedAt: new Date().toISOString() },
          `QuarterlyReview ${d.id}`,
        )))
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [user])

  const currentWeekStart = useMemo(() => getCurrentWeekStart(), [])
  const currentMonth = useMemo(() => getMonthKey(new Date()), [])

  const lastWeeklyReview = useMemo(() => {
    return weeklyReviews[0] ?? null
  }, [weeklyReviews])

  const lastMonthlyReview = useMemo(() => {
    return monthlyReviews.find(r => r.month < currentMonth) ?? null
  }, [monthlyReviews, currentMonth])

  const currentQuarter = useMemo(() => getCurrentQuarterKey(), [])

  const lastQuarterlyReview = useMemo(() => {
    return quarterlyReviews.find(r => r.quarter !== currentQuarter) ?? null
  }, [quarterlyReviews, currentQuarter])

  return {
    weeklyReviews, monthlyReviews, quarterlyReviews,
    lastWeeklyReview, lastMonthlyReview, lastQuarterlyReview,
    loading,
  }
}
