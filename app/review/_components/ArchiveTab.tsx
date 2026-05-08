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
import ReviewHistoryTab from './ReviewHistoryTab'
import MonthlySummaryTab from './MonthlySummaryTab'
import SideQuestHistoryTab from './SideQuestHistoryTab'

type ArchiveSubTab = 'przeglądy' | 'statystyki' | 'sidequesty'

interface ArchiveTabProps {
  logs: ReturnType<typeof useTimelineData>['logs']
  weeklyReviews: WeeklyReview[]
  monthlyReviews: MonthlyReview[]
  loading: boolean
}

export default function ArchiveTab({ logs, weeklyReviews, monthlyReviews, loading }: ArchiveTabProps) {
  const [sub, setSub] = useState<ArchiveSubTab>('przeglądy')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([
          { key: 'przeglądy' as const, label: 'Przeglądy' },
          { key: 'statystyki' as const, label: 'Statystyki' },
          { key: 'sidequesty' as const, label: 'Side questy' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={clsx(
              'flex-1 py-2 rounded-xl font-sans text-xs transition-all',
              sub === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'przeglądy' && (
        <ReviewHistoryTab
          weeklyReviews={weeklyReviews}
          monthlyReviews={monthlyReviews}
          loading={loading}
        />
      )}
      {sub === 'statystyki' && <MonthlySummaryTab logs={logs} />}
      {sub === 'sidequesty' && <SideQuestHistoryTab logs={logs} />}
    </div>
  )
}

// ---------- All-time side quest history ----------
