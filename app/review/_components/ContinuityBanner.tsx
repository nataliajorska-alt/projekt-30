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

interface ContinuityBannerProps {
  show: boolean
  onToggle: () => void
  label: string
  focusLabel: string
  focusText: string
  pillarsRated: Record<string, number>
}

export default function ContinuityBanner({ show, onToggle, label, focusLabel, focusText, pillarsRated }: ContinuityBannerProps) {
  return (
    <div className="bg-cream rounded-2xl border border-border p-5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full"
      >
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest">{label}</p>
        {show ? <EyeOff size={14} className="text-muted" /> : <Eye size={14} className="text-muted" />}
      </button>

      {show && (
        <div className="mt-3 space-y-3">
          {focusText && (
            <div>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">{focusLabel}</p>
              <p className="font-sans text-sm text-dark italic leading-relaxed">&ldquo;{focusText}&rdquo;</p>
            </div>
          )}

          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-2">Oceny filarów</p>
            <div className="flex gap-2 flex-wrap">
              {PILLARS.map(p => {
                const val = pillarsRated[p.id] ?? 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1"
                  >
                    <span className="text-xs">{p.icon}</span>
                    <span
                      className="font-serif text-xs font-medium"
                      style={{ color: p.color }}
                    >
                      {val}/5
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Archive tab (Podsumowanie + Historia przeglądów) ----------
