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


function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${PL_MONTH_SHORT[m - 1]}`
}

function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function getElapsedDaysInMonth(monthKey: string): number {
  const today = new Date()
  const [y, m] = monthKey.split('-').map(Number)
  if (today.getFullYear() === y && today.getMonth() + 1 === m) {
    return today.getDate()
  }
  if (new Date(y, m - 1, 1) > today) return 0
  return getDaysInMonth(monthKey)
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface SummaryProps {
  logs: ReturnType<typeof useTimelineData>['logs']
}

export default function MonthlySummaryTab({ logs }: SummaryProps) {
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), [])
  const [monthKey, setMonthKey] = useState(currentMonthKey)

  const PROJECT_START_MONTH = '2026-04'

  const canGoPrev = monthKey > PROJECT_START_MONTH
  const canGoNext = monthKey < currentMonthKey

  const routineCounts = useMemo(() => getRoutineItemCounts(logs, monthKey), [logs, monthKey])
  const ruleCounts = useMemo(() => getRuleKeptCounts(logs, monthKey), [logs, monthKey])
  const completedSideQuests = useMemo(() => getCompletedSideQuestDates(logs, monthKey), [logs, monthKey])
  const allMonthAggs = useMemo(() => aggregateXpByMonth(logs), [logs])

  const agg = allMonthAggs[monthKey] ?? {
    totalXP: 0, activeDays: 0, totalDailyQuests: 0,
    totalSideQuests: 0, totalRoutines: 0, totalRulesKept: 0, monthKey,
  }

  const prevMonthKey = shiftMonth(monthKey, -1)
  const prevAgg = prevMonthKey >= PROJECT_START_MONTH ? (allMonthAggs[prevMonthKey] ?? null) : null

  const elapsedDays = getElapsedDaysInMonth(monthKey)

  const questMap = useMemo(
    () => Object.fromEntries(SIDE_QUESTS.map(q => [q.id, q])),
    []
  )

  function ProgressBar({ count, total }: { count: number; total: number }) {
    const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0
    return (
      <div className="flex items-center gap-2 flex-shrink-0 w-28">
        <div className="flex-1 bg-parchment rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-sans text-xs text-muted w-10 text-right shrink-0">{count}/{total}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-elegant p-4">
        <button
          onClick={() => canGoPrev && setMonthKey(shiftMonth(monthKey, -1))}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-cream transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-serif text-dark text-lg">{formatMonthPL(monthKey)}</p>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">{elapsedDays} dni w miesiącu</p>
        </div>
        <button
          onClick={() => canGoNext && setMonthKey(shiftMonth(monthKey, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-cream transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Dni aktywne', value: agg.activeDays },
          { label: 'XP miesiąca', value: agg.totalXP.toLocaleString('pl-PL') },
          { label: 'Side questy', value: agg.totalSideQuests },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-elegant p-3 text-center">
            <p className="font-serif text-dark text-xl mb-0.5">{c.value}</p>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide leading-tight">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Morning routine */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Rutyna poranna</h3>
        <p className="font-sans text-[11px] text-muted mb-4">ile razy wykonana z {elapsedDays} możliwych dni</p>
        <div className="space-y-3">
          {MORNING_ROUTINE.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
              <ProgressBar count={routineCounts[item.id] ?? 0} total={elapsedDays} />
            </div>
          ))}
        </div>
      </div>

      {/* Evening routine */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Rutyna wieczorna</h3>
        <p className="font-sans text-[11px] text-muted mb-4">ile razy wykonana z {elapsedDays} możliwych dni</p>
        <div className="space-y-3">
          {EVENING_ROUTINE.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
              <ProgressBar count={routineCounts[item.id] ?? 0} total={elapsedDays} />
            </div>
          ))}
        </div>
      </div>

      {/* Daily routine */}
      {(() => {
        // Count occurrences of each weekday (0=sun…6=sat) in the elapsed days of the month
        function countWeekdayOccurrences(dow: number): number {
          const [y, m] = monthKey.split('-').map(Number)
          let count = 0
          for (let d = 1; d <= elapsedDays; d++) {
            if (new Date(y, m - 1, d).getDay() === dow) count++
          }
          return count
        }
        const weekdayDays = [1, 2, 3, 4, 5].reduce((s, d) => s + countWeekdayOccurrences(d), 0)
        // Study item: appears Mon(1), Wed(3), Fri(5)
        const studyPossible = [1, 3, 5].reduce((s, d) => s + countWeekdayOccurrences(d), 0)
        const studyCount = Object.entries(routineCounts)
          .filter(([id]) => id.startsWith('study_'))
          .reduce((s, [, c]) => s + c, 0)

        const DAY_LABELS: Record<number, string> = {
          0: 'Niedziela', 1: 'Poniedziałek', 2: 'Wtorek',
          3: 'Środa', 4: 'Czwartek', 5: 'Piątek', 6: 'Sobota',
        }

        return (
          <div className="bg-white rounded-2xl shadow-elegant p-5">
            <h3 className="font-serif text-dark text-base mb-0.5">Rutyna dzienna</h3>
            <p className="font-sans text-[11px] text-muted mb-4">nawyki dnia, temat tygodnia i cykliczne zadania</p>
            <div className="space-y-5">

              {/* Daily habits (weekdays only) */}
              {DAILY_HABITS.length > 0 && (
                <div>
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2">Codzienne robocze</p>
                  <div className="space-y-3">
                    {DAILY_HABITS.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
                        <ProgressBar count={routineCounts[item.id] ?? 0} total={weekdayDays} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study item */}
              {studyPossible > 0 && (
                <div>
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2">Temat tygodnia (pn / śr / pt)</p>
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">Nauka z danego tygodnia</span>
                    <ProgressBar count={studyCount} total={studyPossible} />
                  </div>
                </div>
              )}

              {/* Weekly habits per day */}
              {([0, 1, 2, 3, 4, 5, 6] as number[])
                .filter(dow => WEEKLY_HABITS[dow]?.length > 0)
                .map(dow => {
                  const items = WEEKLY_HABITS[dow]
                  const possible = countWeekdayOccurrences(dow)
                  if (possible === 0) return null
                  return (
                    <div key={dow}>
                      <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2">{DAY_LABELS[dow]}</p>
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
                            <ProgressBar count={routineCounts[item.id] ?? 0} total={possible} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )
      })()}

      {/* Rules */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Zasady</h3>
        <p className="font-sans text-[11px] text-muted mb-4">jak często trzymałaś się zasad</p>
        <div className="space-y-4">
          {DAILY_RULES.map(rule => {
            const count = ruleCounts[rule.id] ?? 0
            const pct = elapsedDays > 0 ? Math.round((count / elapsedDays) * 100) : 0
            return (
              <div key={rule.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-xs text-dark leading-snug">{rule.text}</span>
                  <span className="font-sans text-xs text-gold-light font-medium ml-2 shrink-0">{pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-parchment rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-sans text-xs text-muted shrink-0">{count}/{elapsedDays} dni</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily quests */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Daily questy</h3>
        <p className="font-sans text-[11px] text-muted mb-3">
          3 questy dziennie × {elapsedDays} dni = {elapsedDays * 3} możliwych
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-parchment rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gold transition-all"
              style={{
                width: `${elapsedDays * 3 > 0 ? Math.min(100, Math.round((agg.totalDailyQuests / (elapsedDays * 3)) * 100)) : 0}%`,
              }}
            />
          </div>
          <span className="font-serif text-dark text-lg shrink-0">{agg.totalDailyQuests}</span>
        </div>
        <p className="font-sans text-[11px] text-muted mt-1">ukończonych questów</p>
      </div>

      {/* Side quests list */}
      {completedSideQuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elegant p-5">
          <h3 className="font-serif text-dark text-base mb-0.5">Side questy</h3>
          <p className="font-sans text-[11px] text-muted mb-4">
            {completedSideQuests.length} ukończonych ·{' '}
            {completedSideQuests.reduce((s, sq) => s + (questMap[sq.questId]?.xp ?? 0), 0).toLocaleString('pl-PL')} XP łącznie
          </p>
          <div className="space-y-0">
            {completedSideQuests.map(({ questId, date }, i) => {
              const quest = questMap[questId]
              if (!quest) return null
              const pillar = PILLARS.find(p => p.id === quest.pillar)
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-cream last:border-0">
                  <span className="font-sans text-[11px] text-muted shrink-0 w-12 pt-0.5">{formatDay(date)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-dark leading-snug">{quest.title}</p>
                    {pillar && (
                      <span
                        className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-sans uppercase tracking-wide text-white"
                        style={{ backgroundColor: pillar.color }}
                      >
                        {pillar.shortName}
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-xs text-gold-light font-medium shrink-0 pt-0.5">+{quest.xp} XP</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Comparison with previous month */}
      {prevAgg && (prevAgg.totalXP > 0 || prevAgg.activeDays > 0) && (
        <div className="bg-dark rounded-2xl p-5 text-ivory">
          <h3 className="font-serif text-ivory text-base mb-3">
            vs. {formatMonthPL(prevMonthKey)}
          </h3>
          <div className="space-y-3">
            {[
              { label: 'XP', now: agg.totalXP, prev: prevAgg.totalXP, fmt: (v: number) => v.toLocaleString('pl-PL') },
              { label: 'Dni aktywne', now: agg.activeDays, prev: prevAgg.activeDays, fmt: (v: number) => String(v) },
              { label: 'Side questy', now: agg.totalSideQuests, prev: prevAgg.totalSideQuests, fmt: (v: number) => String(v) },
            ].map(({ label, now, prev, fmt }) => {
              const diff = now - prev
              const positive = diff >= 0
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="font-sans text-xs text-muted-light">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-ivory/50">{fmt(prev)}</span>
                    <span className="font-sans text-xs text-muted-light">→</span>
                    <span className="font-serif text-sm text-ivory">{fmt(now)}</span>
                    {diff !== 0 && (
                      <span className={clsx(
                        'font-sans text-xs font-medium',
                        positive ? 'text-gold-light' : 'text-red-300'
                      )}>
                        {positive ? '+' : ''}{fmt(diff)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {agg.activeDays === 0 && elapsedDays > 0 && (
        <div className="text-center py-8">
          <p className="font-sans text-muted text-sm">Brak danych za {formatMonthPL(monthKey)}.</p>
          <p className="font-sans text-muted text-xs mt-1">Wróć tu gdy zalogujesz pierwsze dni.</p>
        </div>
      )}
    </div>
  )
}


// ---------- Review history tab ----------

