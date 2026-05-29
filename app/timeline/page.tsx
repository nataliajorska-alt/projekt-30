'use client'
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useGameData } from '@/hooks/useGameData'
import { useHabitAnalytics } from '@/hooks/useHabitAnalytics'
import { useGhostV2 } from '@/hooks/useGhostV2'
import YearHeatmap from '@/components/YearHeatmap'
import WeeklyXPChart from '@/components/WeeklyXPChart'
import { computeStreaks, findBestDay, findWorstActiveDay, aggregateXpByMonth } from '@/lib/analytics'
import HabitsTab from './_tabs/HabitsTab'
import PillarsTab from './_tabs/PillarsTab'
import MoodTab from './_tabs/MoodTab'
import ProtocolTab from './_tabs/ProtocolTab'
import PatternsTab from './_tabs/PatternsTab'
import { SmallCaps, GoldRule, Diamond, RomanNumeral, Fleuron } from '@/components/ui'

type TimelineMode = 'calendar' | 'habits' | 'pillars' | 'mood' | 'patterns' | 'protokol'

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatDatePL(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${PL_MONTH_NAMES[m - 1].toLowerCase()} ${y}`
}

function formatMonthPL(key: string): string {
  const [, m] = key.split('-').map(Number)
  return PL_MONTH_NAMES[m - 1] ?? key
}

const VALID_TABS: TimelineMode[] = ['calendar', 'habits', 'pillars', 'mood', 'patterns', 'protokol']

const SUB_COPY: Record<TimelineMode, string> = {
  calendar: 'cały projekt w jednym kadrze — każdy dzień się liczy.',
  habits:   'konsekwencja buduje tożsamość — śledź swoje nawyki.',
  pillars:  'gdzie kierujesz energię? dbaj o równowagę.',
  mood:     'co czujesz na co dzień. twój emocjonalny puls projektu.',
  patterns: 'korelacje, najlepsze dni, ukryte zależności.',
  protokol: 'kiedy konkretnie jesteś najbardziej narażona. dane operacyjne.',
}

const TABS: { key: TimelineMode; label: string; roman: number }[] = [
  { key: 'calendar', label: 'Kalendarz', roman: 1 },
  { key: 'habits',   label: 'Nawyki',    roman: 2 },
  { key: 'pillars',  label: 'Filary',    roman: 3 },
  { key: 'mood',     label: 'Nastrój',   roman: 4 },
  { key: 'patterns', label: 'Wzorce',    roman: 5 },
  { key: 'protokol', label: 'Protokół',  roman: 6 },
]

export default function TimelinePage() {
  const { logs, loading } = useTimelineData()
  const { stats } = useGameData()
  const { entries: ghostEntries, failures: ghostFailures, loading: ghostLoading } = useGhostV2()
  const searchParams = useSearchParams()
  const initialTab = (() => {
    const t = searchParams.get('tab') as TimelineMode | null
    return t && VALID_TABS.includes(t) ? t : 'calendar'
  })()
  const [mode, setMode] = useState<TimelineMode>(initialTab)

  useEffect(() => {
    const t = searchParams.get('tab') as TimelineMode | null
    if (t && VALID_TABS.includes(t)) setMode(t)
  }, [searchParams])

  const habitAnalytics = useHabitAnalytics(logs)

  const analytics = useMemo(() => {
    const streaks = computeStreaks(logs)
    const best = findBestDay(logs)
    const worst = findWorstActiveDay(logs)
    const monthly = aggregateXpByMonth(logs)
    const months = Object.values(monthly).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    const maxMonthXP = Math.max(1, ...months.map(m => m.totalXP))
    const longStreaks = streaks.allStreaks.filter(s => s.length >= 7).length
    return { streaks, best, worst, months, maxMonthXP, longStreaks }
  }, [logs])

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-8">
        <SmallCaps tone="muted" tracking="editorial" size="xs">
          Twój rok · Vol. I
        </SmallCaps>
        <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
          Historia
        </h1>
        <p className="font-serif-body italic text-muted text-[14px] mt-2">
          {SUB_COPY[mode]}
        </p>
        <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />
      </header>

      {/* Tabs — editorial */}
      <nav className="mb-8">
        <div className="flex gap-5 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {TABS.map(({ key, label, roman }) => {
            const active = mode === key
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="flex-shrink-0 group flex flex-col items-center gap-1.5"
              >
                <span className="flex items-baseline gap-2 whitespace-nowrap">
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
                    className={clsx('transition-colors', !active && 'group-hover:text-gold-deep')}
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
        </div>
        <GoldRule variant="plain" tone="gold-deep" className="opacity-30" />
      </nav>

      {loading ? (
        <div className="bg-ivory border border-gold-light/40 p-12 text-center">
          <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block animate-pulse" />
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            Wczytuję dane
          </SmallCaps>
        </div>
      ) : mode === 'calendar' ? (
        <div className="space-y-5">
          {/* Heatmap */}
          <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6 overflow-x-auto">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Kalendarz · CCCLXV dni
            </SmallCaps>
            <h2 className="font-heading text-dark text-lg mt-1">365 dni jednym spojrzeniem</h2>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
              każdy kwadrat to jeden dzień. intensywność koloru = XP.
            </p>
            <YearHeatmap logs={logs} />
          </section>

          {/* Weekly XP */}
          <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Tydzień po tygodniu
            </SmallCaps>
            <h2 className="font-heading text-dark text-lg mt-1">Rytm tygodniowy</h2>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
              XP zebrane w każdym tygodniu projektu.
            </p>
            <WeeklyXPChart logs={logs} />
          </section>

          {/* Months */}
          {analytics.months.length > 0 && (
            <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
                Miesiące projektu
              </SmallCaps>
              <h2 className="font-heading text-dark text-lg mt-1">Rozkład na oś czasu</h2>
              <div className="space-y-3 mt-5">
                {analytics.months.map(m => {
                  const pct = Math.round((m.totalXP / analytics.maxMonthXP) * 100)
                  return (
                    <div key={m.monthKey}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading text-dark text-[14px]">
                          {formatMonthPL(m.monthKey)}
                        </span>
                        <div className="flex items-baseline gap-3">
                          <SmallCaps tone="muted" tracking="luxury" size="xs">
                            {m.activeDays} dni
                          </SmallCaps>
                          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="tabular-nums w-20 text-right">
                            {m.totalXP.toLocaleString('pl-PL')} XP
                          </SmallCaps>
                        </div>
                      </div>
                      <div className="relative h-px w-full bg-hairline">
                        <div
                          className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Streaks + records */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section className="bg-ivory border border-gold-light/40 p-5">
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
                Serie
              </SmallCaps>
              <div className="space-y-3">
                <Row label="Aktualna" value={`${analytics.streaks.currentStreak}`} sub="dni" />
                <Row label="Najdłuższa" value={`${analytics.streaks.longestStreak}`} sub="dni" />
                <Row label="Serii ≥ 7 dni" value={`${analytics.longStreaks}`} />
              </div>
            </section>

            <section className="bg-ivory border border-gold-light/40 p-5">
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
                Rekordy
              </SmallCaps>
              <div className="space-y-3">
                <div>
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    Najlepszy dzień
                  </SmallCaps>
                  {analytics.best ? (
                    <p className="font-serif-body text-dark text-[13.5px] mt-1">
                      {formatDatePL(analytics.best.date)}{' '}
                      <span className="text-gold-deep">· {analytics.best.xp} XP</span>
                    </p>
                  ) : (
                    <p className="font-serif-body italic text-muted-light text-[12px] mt-1">
                      jeszcze brak danych
                    </p>
                  )}
                </div>
                <div>
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    Najspokojniejszy aktywny dzień
                  </SmallCaps>
                  {analytics.worst ? (
                    <p className="font-serif-body text-dark text-[13.5px] mt-1">
                      {formatDatePL(analytics.worst.date)}{' '}
                      <span className="text-muted">· {analytics.worst.xp} XP</span>
                    </p>
                  ) : (
                    <p className="font-serif-body italic text-muted-light text-[12px] mt-1">
                      jeszcze brak danych
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Recap */}
          <section className="bg-cream border border-gold-light/30 p-5 relative">
            <Fleuron size={11} className="text-gold absolute -top-2 left-5 bg-cream px-1" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Łącznie
            </SmallCaps>
            <p className="font-serif-body italic text-dark text-[14px] mt-2 leading-relaxed">
              {stats.totalDaysLogged} dni zalogowanych · {stats.totalXP.toLocaleString('pl-PL')} XP ·{' '}
              {stats.totalRoutinesCompleted} rutyn · {stats.totalSideQuestsCompleted} side questów ·{' '}
              {stats.totalRulesKept} zasad dotrzymanych.
            </p>
          </section>
        </div>
      ) : mode === 'habits' ? (
        <HabitsTab analytics={habitAnalytics} />
      ) : mode === 'mood' ? (
        <MoodTab logs={logs} />
      ) : mode === 'patterns' ? (
        <PatternsTab logs={logs} />
      ) : mode === 'protokol' ? (
        <ProtocolTab entries={ghostEntries} failures={ghostFailures} loading={ghostLoading} />
      ) : (
        <PillarsTab stats={stats} />
      )}
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <SmallCaps tone="muted" tracking="luxury" size="xs">
        {label}
      </SmallCaps>
      <p className="font-display text-dark text-2xl leading-none">
        {value}
        {sub && (
          <span className="font-serif-body italic text-muted-light text-xs ml-1.5">{sub}</span>
        )}
      </p>
    </div>
  )
}
