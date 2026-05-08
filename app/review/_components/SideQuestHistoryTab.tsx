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

export default function SideQuestHistoryTab({ logs }: { logs: ReturnType<typeof useTimelineData>['logs'] }) {
  const questMap = useMemo(
    () => Object.fromEntries(SIDE_QUESTS.map(q => [q.id, q])),
    []
  )

  const allCompleted = useMemo(() => {
    const result: { questId: string; date: string; title: string; pillar: string; xp: number }[] = []
    const sorted = Object.keys(logs).sort().reverse()
    for (const dateKey of sorted) {
      const log = logs[dateKey]
      for (const qid of log.completedSideQuests ?? []) {
        const q = questMap[qid]
        result.push({
          questId: qid,
          date: dateKey,
          title: q?.title ?? qid,
          pillar: q?.pillar ?? '—',
          xp: q?.xp ?? 120,
        })
      }
      for (const csq of log.customSideQuests ?? []) {
        result.push({
          questId: csq.id,
          date: dateKey,
          title: csq.title,
          pillar: csq.pillar,
          xp: csq.xp,
        })
      }
    }
    return result
  }, [logs, questMap])

  if (allCompleted.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-6 text-center">
        <p className="font-sans text-sm text-muted">Brak ukończonych side questów w logach.</p>
      </div>
    )
  }

  const totalXP = allCompleted.reduce((s, q) => s + q.xp, 0)

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-elegant p-4 flex justify-between items-center">
        <p className="font-sans text-sm text-dark">Łącznie ukończonych: <span className="font-semibold">{allCompleted.length}</span></p>
        <p className="font-sans text-sm text-gold font-semibold">{totalXP.toLocaleString('pl-PL')} XP</p>
      </div>
      {allCompleted.map((entry, i) => (
        <div key={`${entry.questId}-${entry.date}-${i}`} className="bg-white rounded-xl shadow-elegant px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm text-dark truncate">{entry.title}</p>
            <p className="font-sans text-xs text-muted">{entry.date} · {entry.pillar}</p>
          </div>
          <p className="font-sans text-xs text-gold font-semibold shrink-0">+{entry.xp} XP</p>
        </div>
      ))}
    </div>
  )
}

// ---------- Monthly summary tab ----------
