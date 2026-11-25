'use client'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, Minus,
  Sprout, CalendarHeart, Flame, Trophy,
} from 'lucide-react'
import type { DailyLog } from '@/types'
import type { CyclePhaseId } from '@/lib/weeklyHypotheses'
import { computeCorrelations, type DayOfWeekInsight } from '@/lib/correlations'
import { computeStreaks } from '@/lib/analytics'
import { groupLevers, leverLabel, leverSentence, fmtPts } from '@/lib/patternVerdicts'
import {
  comparePeriods, pctChange, trendOf, type PeriodStats, type Trend,
} from '@/lib/periodSummary'
import { SmallCaps, CornerBrackets } from '@/components/ui'

// ── Przegląd — pierwsza zakładka Analiz ──────────────────────────
// Odpowiada w kilka sekund na „jak mi idzie?": liczby z porównaniem do
// poprzedniego okresu, wnioski zwykłym językiem i drogowskazy do szczegółów.

export type DeepTab = 'calendar' | 'habits' | 'mood' | 'patterns' | 'protokol' | 'oddech'

// prevWith — narzędnik („w porównaniu z …"), prevOf — dopełniacz („względem …").
const PERIODS = [
  { days: 7,  chip: '7 dni',  name: 'Ostatni tydzień',     prevWith: 'poprzednim tygodniem',     prevOf: 'poprzedniego tygodnia' },
  { days: 30, chip: '30 dni', name: 'Ostatnie 30 dni',     prevWith: 'poprzednimi 30 dniami',    prevOf: 'poprzednich 30 dni' },
  { days: 90, chip: '90 dni', name: 'Ostatnie 3 miesiące', prevWith: 'poprzednimi 3 miesiącami', prevOf: 'poprzednich 3 miesięcy' },
] as const

const PL_MONTHS_GEN = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia']
const PL_MONTHS_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

function dayMonth(key: string, short = false): string {
  const [, m, d] = key.split('-').map(Number)
  return `${d} ${(short ? PL_MONTHS_SHORT : PL_MONTHS_GEN)[m - 1]}`
}

function dni(n: number): string {
  return n === 1 ? 'dzień' : 'dni'
}

/** 1 side quest · 2–4 side questy · 5+ side questów (12–14 też „-ów"). */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  const d = n % 10, dd = n % 100
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many
}

// „w niedzielę", „we wtorek" — indeks jak Date.getDay() (0 = niedziela).
const DOW_LOC = ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę']

function fmt1(v: number): string {
  return v.toFixed(1).replace('.', ',')
}

// ── Mini-wykresy ─────────────────────────────────────────────────

function MiniBars({ values, tone = 'gold' }: { values: number[]; tone?: 'gold' | 'ivory' }) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex items-end gap-px h-9" aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={clsx('flex-1 min-w-0', tone === 'gold' ? 'bg-gold/70' : 'bg-gold-light/60', v <= 0 && 'opacity-25')}
          style={{ height: `${v <= 0 ? 6 : Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function DayDots({ values }: { values: number[] }) {
  return (
    <div className="flex flex-wrap gap-[3px] h-9 content-end" aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={clsx(values.length > 40 ? 'w-[5px] h-[5px]' : values.length > 10 ? 'w-[7px] h-[7px]' : 'w-3 h-3', v > 0 ? 'bg-gold' : 'bg-border')}
        />
      ))}
    </div>
  )
}

function MiniLine({ values, min = 1, max = 5 }: { values: (number | null)[]; min?: number; max?: number }) {
  const n = values.length
  if (n < 2) return <div className="h-9" />
  const W = 100, H = 36
  const x = (i: number) => (i / (n - 1)) * W
  const y = (v: number) => H - 3 - ((v - min) / (max - min)) * (H - 6)
  // Dni bez check-inu pomijamy (bez zmyślania wartości), a linia łączy
  // kolejne pomiary — czyta się jako trend, nie jako poszarpane kreski.
  const pts = values
    .map((v, i) => (v === null ? null : `${x(i).toFixed(2)},${y(v).toFixed(2)}`))
    .filter((p): p is string => p !== null)
  const mid = y(3)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-9" aria-hidden>
      <line x1="0" x2={W} y1={mid} y2={mid} stroke="#D9CDA8" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {pts.length > 1 && (
        <polyline points={pts.join(' ')} fill="none" stroke="#826933" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      )}
    </svg>
  )
}

// ── Kafel liczby ─────────────────────────────────────────────────

function TrendChip({ trend, text }: { trend: Trend; text: string }) {
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-ui text-[11px] tabular-nums',
        trend === 'up' ? 'text-forest' : trend === 'down' ? 'text-wine' : 'text-muted',
      )}
    >
      <Icon size={13} strokeWidth={1.75} />
      {text}
    </span>
  )
}

function Kpi({ label, value, unit, trend, trendText, chart, foot }: {
  label: string
  value: string
  unit?: string
  trend?: Trend
  trendText?: string
  chart: React.ReactNode
  foot?: string
}) {
  return (
    <div className="relative bg-ivory border border-gold-light/40 p-4 sm:p-5 flex flex-col">
      <SmallCaps tone="gold-deep" tracking="luxury" size="sm" as="div">{label}</SmallCaps>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-dark text-[30px] sm:text-[34px] leading-none tracking-tight tabular-nums">{value}</span>
        {unit && <span className="font-serif-body italic text-muted text-[14px]">{unit}</span>}
      </div>
      <div className="mt-1.5 min-h-[18px]">
        {trend && trendText
          ? <TrendChip trend={trend} text={trendText} />
          : <span className="font-serif-body italic text-muted-light text-[12.5px]">{foot ?? 'brak okresu do porównania'}</span>}
      </div>
      <div className="mt-auto pt-3">{chart}</div>
    </div>
  )
}

// ── Werdykt okresu ───────────────────────────────────────────────

interface Change { key: string; trend: Trend; text: string }

function describeChanges(cur: PeriodStats, prev: PeriodStats): Change[] {
  const out: Change[] = []
  const xpPct = pctChange(cur.xpPerDay, prev.xpPerDay)
  if (xpPct !== null) {
    const t: Trend = xpPct >= 5 ? 'up' : xpPct <= -5 ? 'down' : 'flat'
    out.push({ key: 'xp', trend: t, text: t === 'up' ? `więcej XP (+${xpPct}%)` : t === 'down' ? `mniej XP (−${Math.abs(xpPct)}%)` : 'XP na podobnym poziomie' })
  }
  if (cur.mood !== null && prev.mood !== null) {
    const t = trendOf(cur.mood, prev.mood, 0.15)
    const d = fmtPts(cur.mood - prev.mood)
    out.push({ key: 'mood', trend: t, text: t === 'up' ? `lepszy nastrój (+${d})` : t === 'down' ? `niższy nastrój (−${d})` : 'nastrój stabilny' })
  }
  if (cur.routineRate !== null && prev.routineRate !== null) {
    const t = trendOf(cur.routineRate, prev.routineRate, 3)
    const d = Math.abs(cur.routineRate - prev.routineRate)
    out.push({ key: 'routine', trend: t, text: t === 'up' ? `pełniejsza rutyna (+${d} pkt)` : t === 'down' ? `luźniejsza rutyna (−${d} pkt)` : 'rutyna bez zmian' })
  }
  return out
}

function verdictTitle(changes: Change[]): string {
  const score = changes.reduce((s, c) => s + (c.trend === 'up' ? 1 : c.trend === 'down' ? -1 : 0), 0)
  if (score >= 2) return 'Mocniej niż wcześniej'
  if (score === 1) return 'Lekko w górę'
  if (score === -1) return 'Odrobinę spokojniej'
  if (score <= -2) return 'Spokojniejszy czas'
  return 'Równe tempo'
}

function joinPL(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} i ${items[items.length - 1]}`
}

// ── Wiersz wniosku ───────────────────────────────────────────────

function Finding({ icon: Icon, title, children, cta, onCta }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  cta?: string
  onCta?: () => void
}) {
  return (
    <div className="flex gap-3.5 py-4 border-t border-border first:border-t-0 first:pt-1">
      <span className="shrink-0 w-10 h-10 border border-gold-light/60 text-gold-deep flex items-center justify-center">
        <Icon size={18} strokeWidth={1.4} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-dark text-[17px] leading-tight">{title}</h3>
        <p className="font-serif-body text-dark/85 text-[15px] leading-snug mt-1">{children}</p>
        {cta && onCta && (
          <button
            onClick={onCta}
            className="mt-2 inline-flex items-center gap-1.5 font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:opacity-70 transition-opacity"
          >
            {cta} <ArrowRight size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Zakładka ─────────────────────────────────────────────────────

export default function OverviewTab({
  logs, cigarettesPhase, cyclePhaseOf, routineAvgAllTime, onOpen, showOddech,
}: {
  logs: Record<string, DailyLog>
  cigarettesPhase?: number
  cyclePhaseOf?: (dateKey: string) => CyclePhaseId | null
  routineAvgAllTime: number
  onOpen: (tab: DeepTab) => void
  showOddech: boolean
}) {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const period = PERIODS.find(p => p.days === days)!

  const cmp = useMemo(() => comparePeriods(logs, days), [logs, days])
  const insights = useMemo(
    () => computeCorrelations(logs, cigarettesPhase, { cyclePhaseOf }),
    [logs, cigarettesPhase, cyclePhaseOf],
  )
  const levers = useMemo(() => groupLevers(insights), [insights])
  const streaks = useMemo(() => computeStreaks(logs), [logs])

  const allMood = useMemo(() => {
    let sum = 0, n = 0
    for (const l of Object.values(logs)) for (const c of l.moodCheckIns ?? []) { sum += c.mood; n += 1 }
    return { avg: n ? sum / n : null, n }
  }, [logs])

  const { current: cur, previous: prev, hasPrevious } = cmp
  const changes = hasPrevious ? describeChanges(cur, prev) : []

  // Kafle
  const xpPct = hasPrevious ? pctChange(cur.xpPerDay, prev.xpPerDay) : null
  const xpTrend: Trend | undefined = xpPct === null ? undefined : xpPct >= 5 ? 'up' : xpPct <= -5 ? 'down' : 'flat'
  const daysDiff = cur.daysLogged - prev.daysLogged
  const routineDiff = cur.routineRate !== null && prev.routineRate !== null ? cur.routineRate - prev.routineRate : null
  const moodDiff = cur.mood !== null && prev.mood !== null ? cur.mood - prev.mood : null

  // Wnioski
  const topLever = levers.works[0] ?? null
  const dowMood = insights.find((i): i is DayOfWeekInsight => i.type === 'dow' && i.metric === 'mood')
  const dowRated = dowMood?.byDay.filter(d => d.value !== null && d.count >= 3) ?? []
  const bestDow = dowRated.length >= 3 ? dowRated.reduce((a, b) => (b.value! > a.value! ? b : a)) : null
  const worstDow = dowRated.length >= 3 ? dowRated.reduce((a, b) => (b.value! < a.value! ? b : a)) : null

  const emptyPeriod = cur.daysLogged === 0

  return (
    <div className="space-y-5">
      {/* Wybór okresu */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SmallCaps tone="gold-deep" tracking="luxury" size="sm" as="div">Okres</SmallCaps>
          <p className="font-serif-body italic text-muted text-[14px] mt-0.5">
            {dayMonth(cur.from)} – {dayMonth(cur.to)} · pełne dni, do wczoraj
          </p>
        </div>
        <div role="radiogroup" aria-label="Okres" className="flex border border-hairline bg-ivory">
          {PERIODS.map(p => {
            const active = p.days === days
            return (
              <button
                key={p.days}
                role="radio"
                aria-checked={active}
                onClick={() => setDays(p.days)}
                className={clsx(
                  'px-4 py-2 font-ui uppercase tracking-[0.16em] text-[11px] transition-colors min-w-[72px]',
                  active ? 'bg-dark text-gold-pale' : 'text-muted hover:text-gold-deep',
                )}
              >
                {p.chip}
              </button>
            )
          })}
        </div>
      </div>

      {/* Werdykt */}
      <section className="relative bg-dark text-gold-pale px-6 sm:px-9 py-7 overflow-hidden">
        <CornerBrackets size={11} tone="gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="sm" as="div">{period.name}</SmallCaps>
        {emptyPeriod ? (
          <>
            <h2 className="font-display text-gold-pale text-[28px] sm:text-[34px] leading-tight mt-2">Cisza w zapisach</h2>
            <p className="font-serif-body italic text-parchment/85 text-[16px] mt-2 max-w-[52ch]">
              w tym okresie nie ma zapisanych dni. to nie wyrok — wybierz dłuższy okres albo wróć tu po kilku dniach.
            </p>
          </>
        ) : hasPrevious ? (
          <>
            <h2 className="font-display text-gold-pale text-[28px] sm:text-[34px] leading-tight mt-2">{verdictTitle(changes)}</h2>
            <p className="font-serif-body italic text-parchment/85 text-[16px] sm:text-[17px] mt-2 max-w-[56ch] leading-snug">
              w porównaniu z {period.prevWith}: {joinPL(changes.map(c => c.text))}.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {changes.map(c => (
                <span
                  key={c.key}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-1 border font-ui text-[11px]',
                    c.trend === 'up' ? 'border-sage/60 text-[#B9C9A6]' : c.trend === 'down' ? 'border-rose/50 text-[#E2B3A6]' : 'border-gold-light/30 text-parchment/75',
                  )}
                >
                  {c.trend === 'up' ? <ArrowUpRight size={12} /> : c.trend === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                  {c.key === 'xp' ? 'XP' : c.key === 'mood' ? 'nastrój' : 'rutyna'}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-gold-pale text-[28px] sm:text-[34px] leading-tight mt-2">Pierwszy taki okres</h2>
            <p className="font-serif-body italic text-parchment/85 text-[16px] mt-2 max-w-[52ch]">
              przed nim jest za mało zapisów, żeby uczciwie porównać. poniżej liczby z tego okresu.
            </p>
          </>
        )}
      </section>

      {/* Liczby */}
      {hasPrevious && !emptyPeriod && (
        <p className="font-serif-body italic text-muted text-[14px] -mb-2">
          strzałki pokazują zmianę względem {period.prevOf}.
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi
          label="XP dziennie"
          value={cur.xpPerDay.toLocaleString('pl-PL')}
          trend={xpTrend}
          trendText={xpPct === null ? undefined : `${xpPct > 0 ? '+' : xpPct < 0 ? '−' : ''}${Math.abs(xpPct)}%`}
          chart={<MiniBars values={cur.dailyXP} />}
        />
        <Kpi
          label="Dni z zapisem"
          value={`${cur.daysLogged}`}
          unit={`/ ${cur.days}`}
          trend={hasPrevious ? (daysDiff > 0 ? 'up' : daysDiff < 0 ? 'down' : 'flat') : undefined}
          trendText={hasPrevious ? (daysDiff === 0 ? 'tyle samo' : `${daysDiff > 0 ? '+' : '−'}${Math.abs(daysDiff)} ${dni(Math.abs(daysDiff))}`) : undefined}
          chart={<DayDots values={cur.dailyXP} />}
        />
        <Kpi
          label="Rutyna"
          value={cur.routineRate === null ? '—' : `${cur.routineRate}`}
          unit={cur.routineRate === null ? undefined : '%'}
          trend={hasPrevious && routineDiff !== null ? trendOf(cur.routineRate, prev.routineRate, 3) : undefined}
          trendText={hasPrevious && routineDiff !== null ? `${routineDiff > 0 ? '+' : routineDiff < 0 ? '−' : ''}${Math.abs(routineDiff)} pkt` : undefined}
          chart={<MiniBars values={cur.dailyRoutine.map(v => v ?? 0)} />}
          foot={cur.routineRate === null ? 'brak zapisów' : undefined}
        />
        <Kpi
          label="Nastrój"
          value={cur.mood === null ? '—' : fmt1(cur.mood)}
          unit={cur.mood === null ? undefined : '/ 5'}
          trend={hasPrevious && moodDiff !== null ? trendOf(cur.mood, prev.mood, 0.15) : undefined}
          trendText={hasPrevious && moodDiff !== null ? `${moodDiff > 0.04 ? '+' : moodDiff < -0.04 ? '−' : ''}${fmtPts(moodDiff)} pkt` : undefined}
          chart={<MiniLine values={cur.dailyMood} />}
          foot={cur.mood === null ? 'brak check-inów w tym okresie' : undefined}
        />
      </div>

      {/* Wnioski */}
      <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
        <CornerBrackets size={10} tone="gold-light" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="sm" as="div">Wnioski</SmallCaps>
        <h2 className="font-heading text-dark text-[22px] mt-1">Co widać w Twoich danych</h2>
        <p className="font-serif-body italic text-muted text-[14px] mt-1 mb-4">
          z całego projektu — im więcej check-inów, tym pewniejsze.
        </p>

        {topLever ? (
          <Finding icon={Sprout} title={`Pomaga Ci: ${leverLabel(topLever).toLowerCase()}`} cta="wszystkie dźwignie" onCta={() => onOpen('patterns')}>
            {leverSentence(topLever)}
            {levers.works.length > 1 && (
              <span className="text-muted italic"> Działa też: {levers.works.slice(1, 3).map(l => leverLabel(l).toLowerCase()).join(', ')}.</span>
            )}
          </Finding>
        ) : (
          <Finding icon={Sprout} title="Jeszcze bez wyraźnej dźwigni" cta="zobacz wzorce" onCta={() => onOpen('patterns')}>
            {levers.ranked.length > 0
              ? 'żaden nawyk nie odróżnia się jeszcze wyraźnie od reszty. najwięcej pokażą dwa check-iny dziennie — rano i wieczorem.'
              : 'za mało check-inów, żeby porównać dni. zrób dwa dziennie — rano i wieczorem — a wnioski pojawią się same.'}
          </Finding>
        )}

        {bestDow && worstDow && bestDow.dow !== worstDow.dow && (
          <Finding icon={CalendarHeart} title="Twój rytm tygodnia" cta="nastrój po dniach" onCta={() => onOpen('mood')}>
            najlepiej bywa <b className="font-medium">{DOW_LOC[bestDow.dow]}</b> ({fmt1(bestDow.value!)}/5),
            najtrudniej <b className="font-medium">{DOW_LOC[worstDow.dow]}</b> ({fmt1(worstDow.value!)}/5) —
            ten dzień warto planować łagodniej.
          </Finding>
        )}

        <Finding icon={Flame} title={streaks.currentStreak > 0 ? `Seria: ${streaks.currentStreak} ${dni(streaks.currentStreak)} z rzędu` : 'Seria czeka na nowy początek'} cta="kalendarz" onCta={() => onOpen('calendar')}>
          {streaks.currentStreak > 0 && streaks.currentStreak >= streaks.longestStreak
            ? 'to Twoja najdłuższa seria w projekcie — każdy kolejny dzień to nowy rekord.'
            : `najdłuższa w projekcie: ${streaks.longestStreak} ${dni(streaks.longestStreak)}.${streaks.currentStreak > 0 ? ` do rekordu brakuje ${streaks.longestStreak - streaks.currentStreak}.` : ' jeden zapisany dzień zaczyna nową.'}`}
        </Finding>

        {cur.bestDay && (
          <Finding icon={Trophy} title="Najmocniejszy dzień okresu">
            {dayMonth(cur.bestDay.date)} — {cur.bestDay.xp.toLocaleString('pl-PL')} XP
            {cur.sideQuests > 0 && <span className="text-muted italic">. w całym okresie: {cur.sideQuests} {plural(cur.sideQuests, 'side quest', 'side questy', 'side questów')}.</span>}
          </Finding>
        )}
      </section>

      {/* Drogowskazy */}
      <section>
        <div className="flex items-center gap-3.5 mb-3">
          <SmallCaps tone="muted" tracking="editorial" size="sm">Zajrzyj głębiej</SmallCaps>
          <span className="flex-1 h-px bg-hairline" />
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {([
            { tab: 'calendar', title: 'Kalendarz', text: `cały rok jednym spojrzeniem · najdłuższa seria ${streaks.longestStreak} ${dni(streaks.longestStreak)}` },
            { tab: 'habits',   title: 'Nawyki',    text: `rutyna średnio ${routineAvgAllTime}% · zasady i ruch` },
            { tab: 'mood',     title: 'Nastrój',   text: allMood.avg === null ? 'jeszcze bez check-inów' : `średnio ${fmt1(allMood.avg)}/5 · ${allMood.n} ${plural(allMood.n, 'check-in', 'check-iny', 'check-inów')}` },
            { tab: 'patterns', title: 'Wzorce',    text: levers.works.length > 0 ? `${levers.works.length} ${levers.works.length === 1 ? 'rzecz wyraźnie pomaga' : 'rzeczy wyraźnie pomagają'} · wzorzec tygodnia` : 'co pomaga, a co nie · wzorzec tygodnia' },
            { tab: 'protokol', title: 'Protokół',  text: 'impulsy kontaktu — kiedy jesteś najbardziej narażona' },
            ...(showOddech ? [{ tab: 'oddech' as const, title: 'Oddech', text: 'papierosy — dane, nie ocena' }] : []),
          ] as { tab: DeepTab; title: string; text: string }[]).map(l => (
            <button
              key={l.tab}
              onClick={() => onOpen(l.tab)}
              className="group text-left flex items-center gap-3 bg-ivory border border-gold-light/40 hover:border-gold px-4 py-3.5 transition-colors"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-display text-dark text-[17px] leading-tight">{l.title}</span>
                <span className="block font-serif-body italic text-muted text-[14px] leading-snug mt-0.5">{l.text}</span>
              </span>
              <ArrowRight size={16} strokeWidth={1.4} className="shrink-0 text-gold-deep transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
