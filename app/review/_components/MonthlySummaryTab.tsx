'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useTimelineData } from '@/hooks/useTimelineData'
import { PILLARS } from '@/lib/pillars'
import { getMonthKey, getEffectiveNow } from '@/lib/gameLogic'
import { getRoutineItemCounts, getCompletedSideQuestDates, getRuleKeptCounts, aggregateXpByMonth } from '@/lib/analytics'
import { MORNING_ROUTINE, EVENING_ROUTINE, DAILY_RULES, DAILY_HABITS, WEEKLY_HABITS } from '@/lib/routineData'
import { SIDE_QUESTS } from '@/lib/questData'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthPL, PL_MONTH_SHORT } from './shared'
import { SmallCaps, Diamond, Fleuron, CornerBrackets } from '@/components/ui'

function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${PL_MONTH_SHORT[m - 1]}`
}

function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function getElapsedDaysInMonth(monthKey: string): number {
  const today = getEffectiveNow()
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
  const currentMonthKey = useMemo(() => getMonthKey(getEffectiveNow()), [])
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

  function ProgressLine({ count, total }: { count: number; total: number }) {
    const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0
    return (
      <div className="flex items-center gap-2 shrink-0 w-28">
        <div className="flex-1 h-px bg-hairline relative">
          <div className="absolute left-0 top-0 h-px bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-12 text-right shrink-0 tabular-nums">
          {count}/{total}
        </SmallCaps>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-[#dcd5bc] border border-gold-light/25 p-4">
        <button
          onClick={() => canGoPrev && setMonthKey(shiftMonth(monthKey, -1))}
          disabled={!canGoPrev}
          className="w-9 h-9 flex items-center justify-center border border-hairline text-muted hover:text-dark hover:border-gold transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>
        <div className="text-center">
          <h3 className="font-heading text-dark text-lg">{formatMonthPL(monthKey)}</h3>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-0.5 block">
            {elapsedDays} dni w miesiącu
          </SmallCaps>
        </div>
        <button
          onClick={() => canGoNext && setMonthKey(shiftMonth(monthKey, 1))}
          disabled={!canGoNext}
          className="w-9 h-9 flex items-center justify-center border border-hairline text-muted hover:text-dark hover:border-gold transition-colors disabled:opacity-30"
        >
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Dni aktywne', value: String(agg.activeDays) },
          { label: 'XP miesiąca', value: agg.totalXP.toLocaleString('pl-PL') },
          { label: 'Side questy', value: String(agg.totalSideQuests) },
        ].map(c => (
          <div key={c.label} className="bg-[#dcd5bc] border border-gold-light/25 p-3 text-center">
            <p className="font-display text-dark text-2xl leading-none">{c.value}</p>
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">
              {c.label}
            </SmallCaps>
          </div>
        ))}
      </div>

      {/* Morning */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Rutyna poranna
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Ile razy wykonana</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          z {elapsedDays} możliwych dni.
        </p>
        <div className="space-y-3">
          {MORNING_ROUTINE.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="font-serif-body text-[13px] text-dark flex-1 leading-snug min-w-0">
                {item.text}
              </span>
              <ProgressLine count={routineCounts[item.id] ?? 0} total={elapsedDays} />
            </div>
          ))}
        </div>
      </section>

      {/* Evening */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Rutyna wieczorna
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Ile razy wykonana</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          z {elapsedDays} możliwych dni.
        </p>
        <div className="space-y-3">
          {EVENING_ROUTINE.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="font-serif-body text-[13px] text-dark flex-1 leading-snug min-w-0">
                {item.text}
              </span>
              <ProgressLine count={routineCounts[item.id] ?? 0} total={elapsedDays} />
            </div>
          ))}
        </div>
      </section>

      {/* Daily */}
      {(() => {
        function countWeekdayOccurrences(dow: number): number {
          const [y, m] = monthKey.split('-').map(Number)
          let count = 0
          for (let d = 1; d <= elapsedDays; d++) {
            if (new Date(y, m - 1, d).getDay() === dow) count++
          }
          return count
        }
        const weekdayDays = [1, 2, 3, 4, 5].reduce((s, d) => s + countWeekdayOccurrences(d), 0)
        const studyPossible = [1, 3, 5].reduce((s, d) => s + countWeekdayOccurrences(d), 0)
        const studyCount = Object.entries(routineCounts)
          .filter(([id]) => id.startsWith('study_'))
          .reduce((s, [, c]) => s + c, 0)

        const DAY_LABELS: Record<number, string> = {
          0: 'Niedziela', 1: 'Poniedziałek', 2: 'Wtorek',
          3: 'Środa', 4: 'Czwartek', 5: 'Piątek', 6: 'Sobota',
        }

        return (
          <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Rutyna dzienna
            </SmallCaps>
            <h3 className="font-heading text-dark text-base mt-1 mb-1">Nawyki i temat tygodnia</h3>
            <p className="font-serif-body italic text-muted text-[12.5px] mb-5">
              nawyki dnia, temat tygodnia i cykliczne zadania.
            </p>
            <div className="space-y-5">
              {DAILY_HABITS.length > 0 && (
                <div>
                  <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2 opacity-80">
                    Codzienne robocze
                  </SmallCaps>
                  <div className="space-y-3">
                    {DAILY_HABITS.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="font-serif-body text-[13px] text-dark flex-1 leading-snug min-w-0">
                          {item.text}
                        </span>
                        <ProgressLine count={routineCounts[item.id] ?? 0} total={weekdayDays} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {studyPossible > 0 && (
                <div>
                  <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2 opacity-80">
                    Temat tygodnia · pn / śr / pt
                  </SmallCaps>
                  <div className="flex items-center gap-3">
                    <span className="font-serif-body text-[13px] text-dark flex-1 leading-snug min-w-0">
                      Nauka z danego tygodnia
                    </span>
                    <ProgressLine count={studyCount} total={studyPossible} />
                  </div>
                </div>
              )}

              {([0, 1, 2, 3, 4, 5, 6] as number[])
                .filter(dow => WEEKLY_HABITS[dow]?.length > 0)
                .map(dow => {
                  const items = WEEKLY_HABITS[dow]
                  const possible = countWeekdayOccurrences(dow)
                  if (possible === 0) return null
                  return (
                    <div key={dow}>
                      <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2 opacity-80">
                        {DAY_LABELS[dow]}
                      </SmallCaps>
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <span className="font-serif-body text-[13px] text-dark flex-1 leading-snug min-w-0">
                              {item.text}
                            </span>
                            <ProgressLine count={routineCounts[item.id] ?? 0} total={possible} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </section>
        )
      })()}

      {/* Rules */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Zasady
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Dotrzymanie zasad</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          jak często trzymałaś się zasad.
        </p>
        <div className="space-y-4">
          {DAILY_RULES.map(rule => {
            const count = ruleCounts[rule.id] ?? 0
            const pct = elapsedDays > 0 ? Math.round((count / elapsedDays) * 100) : 0
            return (
              <div key={rule.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-serif-body text-[13px] text-dark leading-snug">
                    {rule.text}
                  </span>
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="ml-2 shrink-0">
                    {pct}%
                  </SmallCaps>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-hairline relative">
                    <div className="absolute left-0 top-0 h-px bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0 tabular-nums">
                    {count}/{elapsedDays} dni
                  </SmallCaps>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Daily quests */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Daily questy
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Ukończone</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          III questy dziennie × {elapsedDays} dni = {elapsedDays * 3} możliwych.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-hairline relative">
            <div
              className="absolute left-0 top-0 h-px bg-gold transition-all"
              style={{
                width: `${elapsedDays * 3 > 0
                  ? Math.min(100, Math.round((agg.totalDailyQuests / (elapsedDays * 3)) * 100))
                  : 0}%`,
              }}
            />
          </div>
          <span className="font-display text-dark text-xl leading-none shrink-0">
            {agg.totalDailyQuests}
          </span>
        </div>
      </section>

      {/* Side quests list */}
      {completedSideQuests.length > 0 && (
        <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Side questy
          </SmallCaps>
          <h3 className="font-heading text-dark text-base mt-1 mb-1">Lista ukończonych</h3>
          <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
            {completedSideQuests.length} ukończonych ·{' '}
            {completedSideQuests.reduce((s, sq) => s + (questMap[sq.questId]?.xp ?? 0), 0).toLocaleString('pl-PL')} XP łącznie.
          </p>
          <div>
            {completedSideQuests.map(({ questId, date }, i) => {
              const quest = questMap[questId]
              if (!quest) return null
              const pillar = PILLARS.find(p => p.id === quest.pillar)
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-hairline last:border-0">
                  <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0 w-12 pt-0.5">
                    {formatDay(date)}
                  </SmallCaps>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif-body text-[13.5px] text-dark leading-snug">{quest.title}</p>
                    {pillar && (
                      <div className="inline-flex items-center gap-1 mt-1.5">
                        <span style={{ color: pillar.color }}>
                          <Diamond size={4} filled />
                        </span>
                        <SmallCaps tracking="luxury" size="xs">
                          <span style={{ color: pillar.color }}>{pillar.shortName}</span>
                        </SmallCaps>
                      </div>
                    )}
                  </div>
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="shrink-0 pt-0.5">
                    + {quest.xp} XP
                  </SmallCaps>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Comparison */}
      {prevAgg && (prevAgg.totalXP > 0 || prevAgg.activeDays > 0) && (
        <div className="relative bg-forest-deep grain-linen text-ivory p-6">
          <CornerBrackets size={14} tone="gold" weight={1} />
          <div className="relative z-10">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">
              Porównanie z poprzednim
            </SmallCaps>
            <h3 className="font-display text-ivory text-xl mt-2 mb-5">
              vs. {formatMonthPL(prevMonthKey)}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'XP',          now: agg.totalXP,        prev: prevAgg.totalXP,        fmt: (v: number) => v.toLocaleString('pl-PL') },
                { label: 'Dni aktywne', now: agg.activeDays,     prev: prevAgg.activeDays,     fmt: (v: number) => String(v) },
                { label: 'Side questy', now: agg.totalSideQuests, prev: prevAgg.totalSideQuests, fmt: (v: number) => String(v) },
              ].map(({ label, now, prev, fmt }) => {
                const diff = now - prev
                const positive = diff >= 0
                return (
                  <div key={label} className="flex items-center justify-between">
                    <SmallCaps tone="parchment" tracking="luxury" size="xs">
                      {label}
                    </SmallCaps>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif-body italic text-parchment/60 text-[13px]">{fmt(prev)}</span>
                      <span className="text-parchment/40">→</span>
                      <span className="font-display text-ivory text-sm">{fmt(now)}</span>
                      {diff !== 0 && (
                        <SmallCaps
                          tracking="luxury"
                          size="xs"
                          className={positive ? '!text-gold-light' : '!text-red-300'}
                        >
                          {positive ? '+' : ''}{fmt(diff)}
                        </SmallCaps>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {agg.activeDays === 0 && elapsedDays > 0 && (
        <div className="text-center py-8">
          <Fleuron size={12} className="text-gold-deep mx-auto mb-3 inline-block" />
          <p className="font-serif-body italic text-muted text-[13.5px]">
            brak danych za {formatMonthPL(monthKey)}.
          </p>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-70">
            wróć tu gdy zalogujesz pierwsze dni.
          </SmallCaps>
        </div>
      )}
    </div>
  )
}
