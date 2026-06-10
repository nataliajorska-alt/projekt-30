'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useTimelineData } from '@/hooks/useTimelineData'
import type { WeeklyReview, MonthlyReview, QuarterlyReview } from '@/types'
import ReviewHistoryTab from './ReviewHistoryTab'
import MonthlySummaryTab from './MonthlySummaryTab'
import SideQuestHistoryTab from './SideQuestHistoryTab'
import { SmallCaps, RomanNumeral } from '@/components/ui'

type ArchiveSubTab = 'przeglądy' | 'statystyki' | 'sidequesty'

interface ArchiveTabProps {
  logs: ReturnType<typeof useTimelineData>['logs']
  weeklyReviews: WeeklyReview[]
  monthlyReviews: MonthlyReview[]
  quarterlyReviews: QuarterlyReview[]
  loading: boolean
}

const SUB_TABS: { key: ArchiveSubTab; label: string; roman: number }[] = [
  { key: 'przeglądy',   label: 'Przeglądy',   roman: 1 },
  { key: 'statystyki',  label: 'Statystyki',  roman: 2 },
  { key: 'sidequesty',  label: 'Side questy', roman: 3 },
]

export default function ArchiveTab({ logs, weeklyReviews, monthlyReviews, quarterlyReviews, loading }: ArchiveTabProps) {
  const [sub, setSub] = useState<ArchiveSubTab>('przeglądy')

  return (
    <div className="space-y-4">
      <nav className="flex justify-center gap-8 md:gap-10">
        {SUB_TABS.map(({ key, label, roman }) => {
          const active = sub === key
          return (
            <button
              key={key}
              onClick={() => setSub(key)}
              className="group flex flex-col items-center gap-1.5"
            >
              <span className="flex items-baseline gap-2">
                <RomanNumeral
                  value={roman}
                  className={clsx(
                    'text-sm transition-colors',
                    active ? 'text-gold' : 'text-muted-light group-hover:text-gold-light'
                  )}
                />
                <SmallCaps
                  tone={active ? 'gold' : 'muted'}
                  tracking="luxury"
                  size="sm"
                >
                  {label}
                </SmallCaps>
              </span>
              <span
                className={clsx(
                  'h-px w-10 transition-colors',
                  active ? 'bg-gold' : 'bg-transparent'
                )}
              />
            </button>
          )
        })}
      </nav>

      {sub === 'przeglądy' && (
        <ReviewHistoryTab
          weeklyReviews={weeklyReviews}
          monthlyReviews={monthlyReviews}
          quarterlyReviews={quarterlyReviews}
          loading={loading}
        />
      )}
      {sub === 'statystyki' && <MonthlySummaryTab logs={logs} />}
      {sub === 'sidequesty' && <SideQuestHistoryTab logs={logs} />}
    </div>
  )
}
