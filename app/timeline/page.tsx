'use client'
import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useGameData } from '@/hooks/useGameData'
import { useHabitAnalytics } from '@/hooks/useHabitAnalytics'
import { useGhostV2 } from '@/hooks/useGhostV2'
import YearHeatmap from '@/components/YearHeatmap'
import YearRosette from '@/components/YearRosette'
import WeeklyXPChart from '@/components/WeeklyXPChart'
import { computeStreaks, findBestDay, findWorstActiveDay, aggregateXpByMonth } from '@/lib/analytics'
import HabitsTab from './_tabs/HabitsTab'
import MoodTab from './_tabs/MoodTab'
import ProtocolTab from './_tabs/ProtocolTab'
import PatternsTab from './_tabs/PatternsTab'
import OddechTab from './_tabs/OddechTab'
import { SmallCaps, GoldRule, RomanNumeral, Fleuron, CornerBrackets } from '@/components/ui'
import PageHeader from '@/components/PageHeader'

// Filary celowo NIE jest zakładką Historii — pełny widok balansu filarów ma osobna strona /pillars.
type TimelineMode = 'calendar' | 'habits' | 'mood' | 'patterns' | 'protokol' | 'oddech'

// Licznik „nabijający" wartość jak stary hodometr — animuje od poprzedniej
// wartości (start: 0), więc dociągnięcie danych z Firestore płynnie doliczy.
// prefers-reduced-motion i ukryta karta (rAF wstrzymany) po prostu skaczą do celu.
function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = value
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      value === from
    ) {
      setDisplay(value)
      return
    }
    const duration = 1100
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{display.toLocaleString('pl-PL')}</>
}

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatDatePL(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${PL_MONTH_NAMES[m - 1].toLowerCase()} ${y}`
}

function formatMonthPL(key: string): string {
  const [, m] = key.split('-').map(Number)
  return PL_MONTH_NAMES[m - 1] ?? key
}

const VALID_TABS: TimelineMode[] = ['calendar', 'habits', 'mood', 'patterns', 'protokol', 'oddech']

const SUB_COPY: Record<TimelineMode, string> = {
  calendar: 'cały projekt w jednym kadrze — każdy dzień się liczy.',
  habits:   'konsekwencja buduje tożsamość — śledź swoje nawyki.',
  mood:     'co czujesz na co dzień. twój emocjonalny puls projektu.',
  patterns: 'korelacje, najlepsze dni, ukryte zależności.',
  protokol: 'kiedy konkretnie jesteś najbardziej narażona. dane operacyjne.',
  oddech:   'spokojny licznik kilometrów. wzorce, nie wyroki.',
}

const TABS: { key: TimelineMode; label: string; roman: number }[] = [
  { key: 'calendar', label: 'Kalendarz', roman: 1 },
  { key: 'habits',   label: 'Nawyki',    roman: 2 },
  { key: 'mood',     label: 'Nastrój',   roman: 3 },
  { key: 'patterns', label: 'Wzorce',    roman: 4 },
  { key: 'protokol', label: 'Protokół',  roman: 5 },
  { key: 'oddech',   label: 'Oddech',    roman: 6 },
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
      <PageHeader
        chapter="III"
        eyebrow="Twój rok"
        title="Historia"
        subtitle={SUB_COPY[mode]}
        rule
      />

      {/* Tabs — editorial */}
      <nav className="mb-8">
        <div className="flex gap-5 sm:gap-2 md:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {/* Oddech znika gdy tracking palenia wyłączony — bez wstydu (PLAN_PALENIE.md 3.9) */}
          {TABS.filter(t => t.key !== 'oddech' || stats.smokingTrackingEnabled !== false).map(({ key, label, roman }) => {
            const active = mode === key
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="flex-shrink-0 sm:flex-1 group flex flex-col items-center gap-1.5"
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
          {/* Rozeta roku — 365 promieni, rok w jednym okręgu */}
          <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
            <CornerBrackets size={10} tone="gold-light" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Rozeta roku · CCCLXV promieni
            </SmallCaps>
            <h2 className="font-heading text-dark text-lg mt-1">Rok w jednym okręgu</h2>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-4">
              każdy promień to jeden dzień — im dłuższy i ciemniejszy, tym pełniejszy zapis.
            </p>
            <YearRosette logs={logs} />
          </section>

          {/* Heatmap */}
          <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
            <CornerBrackets size={10} tone="gold-light" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Kalendarz · CCCLXV dni
            </SmallCaps>
            <h2 className="font-heading text-dark text-lg mt-1">365 dni jednym spojrzeniem</h2>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
              każdy kwadrat to jeden dzień. intensywność koloru = XP.
            </p>
            <div className="overflow-x-auto">
              <YearHeatmap logs={logs} />
            </div>
          </section>

          {/* Weekly XP */}
          <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
            <CornerBrackets size={10} tone="gold-light" />
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
            <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
              <CornerBrackets size={10} tone="gold-light" />
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
                Miesiące projektu
              </SmallCaps>
              <h2 className="font-heading text-dark text-lg mt-1">Rozkład na oś czasu</h2>
              <div className="mt-5">
                {analytics.months.map((m, i) => {
                  const pct = Math.round((m.totalXP / analytics.maxMonthXP) * 100)
                  return (
                    <div
                      key={m.monthKey}
                      className={clsx('py-3', i > 0 && 'border-t border-border')}
                    >
                      <div className="flex items-baseline justify-between mb-2.5">
                        <span className="font-display text-dark text-[15px]">
                          {formatMonthPL(m.monthKey)}
                        </span>
                        <div className="flex items-baseline gap-5">
                          <SmallCaps tone="muted" tracking="luxury" size="xs">
                            <b className="font-display italic text-gold-deep text-[12px] mr-1">{m.activeDays}</b>
                            dni
                          </SmallCaps>
                          <SmallCaps tone="muted" tracking="luxury" size="xs" className="tabular-nums text-right">
                            <b className="font-display italic text-gold-deep text-[12px] mr-1">
                              {m.totalXP.toLocaleString('pl-PL')}
                            </b>
                            XP
                          </SmallCaps>
                        </div>
                      </div>
                      <div className="relative h-[2px] w-full bg-border">
                        <div
                          className="absolute left-0 top-0 h-[2px] bg-gold transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                        <span
                          className="absolute top-1/2 w-[7px] h-[7px] bg-gold"
                          style={{ left: `${pct}%`, transform: 'translate(-50%,-50%) rotate(45deg)' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Streaks + records */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-7">
            <section className="relative bg-ivory border border-gold-light/40 p-6 sm:p-7">
              <CornerBrackets size={10} tone="gold-light" />
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-1">
                Serie
              </SmallCaps>
              <div>
                <Row label="Aktualna" value={`${analytics.streaks.currentStreak}`} sub="dni" />
                <Row label="Najdłuższa" value={`${analytics.streaks.longestStreak}`} sub="dni" />
                <Row label="Serii ≥ 7 dni" value={`${analytics.longStreaks}`} />
              </div>
            </section>

            <section className="relative bg-ivory border border-gold-light/40 p-6 sm:p-7">
              <CornerBrackets size={10} tone="gold-light" />
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-1">
                Rekordy
              </SmallCaps>
              <div>
                <div className="py-3">
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                    Najlepszy dzień
                  </SmallCaps>
                  {analytics.best ? (
                    <p className="font-serif-body text-dark text-[13.5px] mt-1.5">
                      {formatDatePL(analytics.best.date)}
                      <span className="text-gold mx-2">·</span>
                      <span className="font-display italic text-gold-deep">{analytics.best.xp} XP</span>
                    </p>
                  ) : (
                    <p className="font-serif-body italic text-muted-light text-[12px] mt-1.5">
                      jeszcze brak danych
                    </p>
                  )}
                </div>
                <div className="py-3 border-t border-border">
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                    Najspokojniejszy aktywny dzień
                  </SmallCaps>
                  {analytics.worst ? (
                    <p className="font-serif-body text-dark text-[13.5px] mt-1.5">
                      {formatDatePL(analytics.worst.date)}
                      <span className="text-gold mx-2">·</span>
                      <span className="font-display italic text-gold-deep">{analytics.worst.xp} XP</span>
                    </p>
                  ) : (
                    <p className="font-serif-body italic text-muted-light text-[12px] mt-1.5">
                      jeszcze brak danych
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Total band */}
          <section className="relative bg-dark text-gold-pale px-6 sm:px-10 py-7 overflow-hidden">
            <CornerBrackets size={11} tone="gold" />
            <div className="flex items-center justify-center gap-3.5">
              <span className="h-px w-6 bg-gold-light/50" />
              <SmallCaps tone="gold-light" tracking="editorial" size="xs">Łącznie</SmallCaps>
              <span className="h-px w-6 bg-gold-light/50" />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap justify-center mt-5">
              {[
                { n: stats.totalDaysLogged, k: 'dni zalogowanych' },
                { n: stats.totalXP, k: 'XP' },
                { n: stats.totalRoutinesCompleted, k: 'rutyn' },
                { n: stats.totalSideQuestsCompleted, k: 'side questów' },
                { n: stats.totalRulesKept, k: 'zasad dotrzymanych' },
              ].map((s, i) => (
                <div
                  key={s.k}
                  className={clsx(
                    'min-w-[40%] sm:min-w-0 flex-1 text-center px-3 py-2 sm:py-0',
                    i > 0 && 'sm:border-l sm:border-gold-light/20'
                  )}
                >
                  <div className="font-display text-gold-pale text-[22px] leading-none tracking-tight tabular-nums">
                    <CountUpNumber value={s.n} />
                  </div>
                  <div className="font-ui uppercase text-gold-light text-[7px] tracking-[0.26em] mt-2">
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : mode === 'habits' ? (
        <HabitsTab analytics={habitAnalytics} />
      ) : mode === 'mood' ? (
        <MoodTab logs={logs} />
      ) : mode === 'patterns' ? (
        <PatternsTab logs={logs} cigarettesPhase={stats.cigarettesPhase} />
      ) : mode === 'oddech' ? (
        <OddechTab logs={logs} loading={loading} />
      ) : (
        <ProtocolTab entries={ghostEntries} failures={ghostFailures} loading={ghostLoading} />
      )}
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-t border-border first:border-t-0">
      <SmallCaps tone="muted" tracking="luxury" size="xs">
        {label}
      </SmallCaps>
      <p className="font-display text-dark text-[21px] leading-none tracking-tight">
        {value}
        {sub && (
          <span className="font-serif-body italic text-muted-light text-xs ml-1.5">{sub}</span>
        )}
      </p>
    </div>
  )
}
