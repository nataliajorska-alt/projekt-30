'use client'
import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { WeeklyReview, MonthlyReview } from '@/types'
import { getMonthKey } from '@/lib/gameLogic'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchReviews = async () => {
      setLoading(true)
      try {
        const [weeklySnap, monthlySnap] = await Promise.all([
          getDocs(query(collection(db, 'users', user.uid, 'reviews'), orderBy('weekStart', 'desc'))),
          getDocs(query(collection(db, 'users', user.uid, 'monthlyReviews'), orderBy('month', 'desc'))),
        ])

        setWeeklyReviews(weeklySnap.docs.map(d => d.data() as WeeklyReview))
        setMonthlyReviews(monthlySnap.docs.map(d => d.data() as MonthlyReview))
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

  return { weeklyReviews, monthlyReviews, lastWeeklyReview, lastMonthlyReview, loading }
}
