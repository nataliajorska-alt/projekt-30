'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { getDaysElapsed, getDaysRemaining } from '@/lib/gameLogic'
import clsx from 'clsx'
import WeeklyReviewForm from './_components/WeeklyReviewForm'
import MonthlyReviewForm from './_components/MonthlyReviewForm'
import ArchiveTab from './_components/ArchiveTab'

type Mode = 'weekly' | 'monthly' | 'archive'

export default function ReviewPage() {
  const { user } = useAuth()
  const { stats, submitWeeklyReview, submitMonthlyReview } = useGameData()
  const { logs } = useTimelineData()
  const { weeklyReviews, monthlyReviews, lastWeeklyReview, lastMonthlyReview, loading: historyLoading } = useReviewHistory()
  const [mode, setMode] = useState<Mode>('weekly')

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-5">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Refleksja</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Przegląd & Korekta</h1>
        <p className="font-sans text-sm text-muted">
          Zatrzymaj się. Co naprawdę się dzieje?
        </p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'weekly',   label: 'Tygodniowy' },
          { key: 'monthly',  label: 'Miesięczny' },
          { key: 'archive',  label: 'Archiwum' },
        ] as { key: Mode; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex-1 py-2.5 rounded-xl font-sans text-xs transition-all',
              mode === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Dzień projektu', value: getDaysElapsed() },
          { label: 'Dni do urodzin', value: getDaysRemaining() },
          { label: 'Łączne XP', value: stats.totalXP.toLocaleString('pl-PL') },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-elegant p-4 text-center">
            <p className="font-serif text-dark text-xl mb-1">{s.value}</p>
            <p className="font-sans text-[11px] text-muted uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {mode === 'weekly' && (
        <WeeklyReviewForm
          user={user}
          stats={stats}
          submitWeeklyReview={submitWeeklyReview}
          lastReview={lastWeeklyReview}
        />
      )}
      {mode === 'monthly' && (
        <MonthlyReviewForm
          user={user}
          stats={stats}
          logs={logs}
          submitMonthlyReview={submitMonthlyReview}
          lastReview={lastMonthlyReview}
        />
      )}
      {mode === 'archive' && (
        <ArchiveTab
          logs={logs}
          weeklyReviews={weeklyReviews}
          monthlyReviews={monthlyReviews}
          loading={historyLoading}
        />
      )}
    </div>
  )
}
