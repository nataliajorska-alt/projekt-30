'use client'
import { useState, useMemo } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { getDaysElapsed, getDaysRemaining, getMonthKey, XP_VALUES } from '@/lib/gameLogic'
import { getMonthAggregate, getRoutineItemCounts, getCompletedSideQuestDates, getRuleKeptCounts, aggregateXpByMonth } from '@/lib/analytics'
import { MORNING_ROUTINE, EVENING_ROUTINE, DAILY_RULES, DAILY_HABITS, WEEKLY_HABITS } from '@/lib/routineData'
import { SIDE_QUESTS } from '@/lib/questData'
import { CheckCircle, Check, ChevronLeft, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import type { WeeklyReview, MonthlyReview } from '@/types'
import PillarTrendChart from '@/components/PillarTrendChart'
import clsx from 'clsx'
import { formatMonthPL, PL_MONTH_SHORT, formatWeekRange } from './shared'

interface ReviewHistoryTabProps {
  weeklyReviews: WeeklyReview[]
  monthlyReviews: MonthlyReview[]
  loading: boolean
}

function avgPillarRating(pillarsRated: Record<string, number>): string {
  const vals = Object.values(pillarsRated)
  if (vals.length === 0) return '–'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

export default function ReviewHistoryTab({ weeklyReviews, monthlyReviews, loading }: ReviewHistoryTabProps) {
  const [subTab, setSubTab] = useState<'weekly' | 'monthly'>('weekly')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-sans text-sm text-muted">Ładuję historię...</p>
      </div>
    )
  }

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-2">
        {([
          { key: 'weekly' as const, label: 'Tygodniowe' },
          { key: 'monthly' as const, label: 'Miesięczne' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSubTab(key); setExpandedId(null) }}
            className={clsx(
              'flex-1 py-2 rounded-xl font-sans text-xs transition-all',
              subTab === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'weekly' && weeklyReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-muted">Brak przeglądów tygodniowych.</p>
          <p className="font-sans text-xs text-muted-light mt-1">Twój pierwszy przegląd pojawi się tutaj.</p>
        </div>
      )}

      {subTab === 'monthly' && monthlyReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-muted">Brak przeglądów miesięcznych.</p>
          <p className="font-sans text-xs text-muted-light mt-1">Twój pierwszy przegląd pojawi się tutaj.</p>
        </div>
      )}

      {/* Pillar trend chart */}
      {subTab === 'weekly' && weeklyReviews.length > 0 && (
        <PillarTrendChart reviews={weeklyReviews.slice(0, 8)} />
      )}

      {/* Weekly reviews list */}
      {subTab === 'weekly' && weeklyReviews.map((review, idx) => {
        const isOpen = expandedId === review.weekStart
        const prevReview = weeklyReviews[idx + 1] ?? null
        return (
          <div key={review.weekStart} className="bg-white rounded-2xl shadow-elegant overflow-hidden">
            <button
              onClick={() => toggle(review.weekStart)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="text-left">
                <p className="font-serif text-dark text-base">{formatWeekRange(review.weekStart)}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">
                  Średnia filarów: {avgPillarRating(review.pillarsRated)} · +{review.xpEarned} XP
                </p>
              </div>
              <ChevronDown
                size={16}
                className={clsx('text-muted transition-transform', isOpen && 'rotate-180')}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                {review.highlights && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co działało</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.highlights}</p>
                  </div>
                )}
                {review.challenges && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co było trudne</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.challenges}</p>
                  </div>
                )}
                {review.nextWeekFocus && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Focus na następny tydzień</p>
                    <p className="font-sans text-sm text-dark italic leading-relaxed">&ldquo;{review.nextWeekFocus}&rdquo;</p>
                  </div>
                )}

                {/* Pillar ratings with delta */}
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-2">Filary</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(p => {
                      const val = review.pillarsRated[p.id as Pillar] ?? 0
                      const prevVal = prevReview?.pillarsRated[p.id as Pillar] ?? null
                      const delta = prevVal !== null ? val - prevVal : null
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
                          <span className="text-xs">{p.icon}</span>
                          <span className="font-sans text-xs text-dark flex-1">{p.shortName}</span>
                          <span className="font-serif text-sm font-medium" style={{ color: p.color }}>
                            {val}
                          </span>
                          {delta !== null && delta !== 0 && (
                            <span className={clsx(
                              'font-sans text-[10px] font-medium',
                              delta > 0 ? 'text-green-600' : 'text-red-400'
                            )}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Monthly reviews list */}
      {subTab === 'monthly' && monthlyReviews.map((review, idx) => {
        const isOpen = expandedId === review.month
        const prevReview = monthlyReviews[idx + 1] ?? null
        return (
          <div key={review.month} className="bg-white rounded-2xl shadow-elegant overflow-hidden">
            <button
              onClick={() => toggle(review.month)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="text-left">
                <p className="font-serif text-dark text-base">{formatMonthPL(review.month)}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">
                  Średnia filarów: {avgPillarRating(review.pillarsRated)} · +{review.xpEarned} XP
                </p>
              </div>
              <ChevronDown
                size={16}
                className={clsx('text-muted transition-transform', isOpen && 'rotate-180')}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                {review.highlights && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co ten miesiąc wniósł</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.highlights}</p>
                  </div>
                )}
                {review.challenges && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co się nie udało</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.challenges}</p>
                  </div>
                )}
                {review.intentionNextMonth && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Intencja na nowy miesiąc</p>
                    <p className="font-sans text-sm text-dark italic leading-relaxed">&ldquo;{review.intentionNextMonth}&rdquo;</p>
                  </div>
                )}

                {/* Pillar ratings with delta */}
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-2">Filary</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(p => {
                      const val = review.pillarsRated[p.id as Pillar] ?? 0
                      const prevVal = prevReview?.pillarsRated[p.id as Pillar] ?? null
                      const delta = prevVal !== null ? val - prevVal : null
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
                          <span className="text-xs">{p.icon}</span>
                          <span className="font-sans text-xs text-dark flex-1">{p.shortName}</span>
                          <span className="font-serif text-sm font-medium" style={{ color: p.color }}>
                            {val}
                          </span>
                          {delta !== null && delta !== 0 && (
                            <span className={clsx(
                              'font-sans text-[10px] font-medium',
                              delta > 0 ? 'text-green-600' : 'text-red-400'
                            )}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
