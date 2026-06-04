'use client'
import { useMemo } from 'react'
import clsx from 'clsx'
import {
  computeCorrelations,
  type ComparisonInsight, type DayOfWeekInsight, type LiftInsight, type CarryoverInsight,
} from '@/lib/correlations'
import type { DailyLog } from '@/types'
import WeeklyInsightCard from '@/components/WeeklyInsightCard'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

// ── Helpers ──────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(1)
}
function pctDiff(a: number | null, b: number | null): string | null {
  if (a === null || b === null || b === 0) return null
  const diff = Math.round(((a - b) / b) * 100)
  if (Math.abs(diff) < 5) return null
  return diff > 0 ? `+${diff}%` : `${diff}%`
}
function fmtSigned(v: number | null): string {
  if (v === null) return '—'
  if (Math.abs(v) < 0.05) return '0,0'
  return (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ',')
}

// ── Narratives (zachowane) ───────────────────────────────────────

function comparisonNarrative(ins: ComparisonInsight): string {
  const { withValue, withoutValue, withLabel, metric } = ins
  if (withValue === null || withoutValue === null) return 'za mało danych do porównania.'
  const diff = withValue - withoutValue
  const metricPL = metric === 'mood' ? 'nastrój' : 'energia'
  if (Math.abs(diff) < 0.15) return `nie wykryto znaczącej różnicy w ${metricPL === 'nastrój' ? 'nastroju' : 'energii'} między grupami.`
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutValue, 0.1)) * 100)
  const dir = diff > 0 ? 'wyższy' : 'niższy'
  return `${withLabel.toLowerCase()}: twój ${metricPL} jest o ${absPct}% ${dir} niż w pozostałe dni.`
}
function dowNarrative(ins: DayOfWeekInsight): string {
  const withData = ins.byDay.filter(d => d.count >= 2 && d.value !== null)
  if (withData.length < 3) return 'za mało danych — check-iny z co najmniej III różnych dni tygodnia.'
  const sorted = [...withData].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const best  = sorted[0]
  const worst = sorted[sorted.length - 1]
  const metricPL = ins.metric === 'energy' ? 'energia' : 'nastrój'
  return `twoja ${metricPL} jest najwyższa w ${best.full.toLowerCase()} (śr. ${fmt(best.value)}/5), najniższa w ${worst.full.toLowerCase()} (śr. ${fmt(worst.value)}/5).`
}
function liftNarrative(ins: LiftInsight): string {
  const { withLift, withoutLift, metric } = ins
  if (withLift === null || withoutLift === null) return 'za mało danych do porównania.'
  const m = metric === 'mood' ? 'nastrój' : 'energia'
  const diff = withLift - withoutLift
  if (withLift > 0.2 && withoutLift <= 0) {
    return `${m === 'nastrój' ? 'nastrój' : 'energia'} rośnie w ciągu dnia o ${fmtSigned(withLift)} kiedy działasz, a spada o ${fmtSigned(withoutLift)} kiedy nie. mocny dowód: to wpływa w obie strony.`
  }
  if (Math.abs(diff) < 0.2) {
    return `nie wykryto różnicy w zmianie ${m === 'nastrój' ? 'nastroju' : 'energii'} — efekt może być słaby lub potrzeba więcej dni.`
  }
  if (diff > 0) {
    return `${m === 'nastrój' ? 'nastrój' : 'energia'} rośnie o ${fmtSigned(diff)} więcej w dni, kiedy działasz. to sugeruje realny wpływ — nie tylko korelację.`
  }
  return `wzrost ${m === 'nastrój' ? 'nastroju' : 'energii'} jest o ${fmtSigned(Math.abs(diff))} mniejszy gdy działasz — warto sprawdzić co innego dzieje się w te dni.`
}
function carryoverNarrative(ins: CarryoverInsight): string {
  const { withMorning, withoutMorning } = ins
  if (withMorning === null || withoutMorning === null) return 'za mało danych do porównania.'
  const diff = withMorning - withoutMorning
  if (Math.abs(diff) < 0.15) return 'wieczór nie wpływa wyraźnie na poranek następnego dnia.'
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutMorning, 0.1)) * 100)
  if (diff > 0) {
    return `po wieczorach z rutyną budzisz się w lepszym nastroju o ${absPct}% (${fmtSigned(diff)} pkt). wieczór dnia X kształtuje poranek X+1.`
  }
  return `po wieczorach z rutyną poranek bywa o ${absPct}% gorszy. może rutyna wieczorna jest zbyt późno?`
}

// ── Directional verdict (siła i kierunek dźwigni) ────────────────

type Directional = LiftInsight | CarryoverInsight
type Verdict = 'works' | 'weak' | 'reverse' | 'nodata'

// Krótkie nazwy dźwigni do rankingu „Twoje dźwignie"
const LEVER_LABEL: Record<string, string> = {
  lift_morning_mood: 'Rutyna poranna',
  lift_low_start_routine: 'Rutyna po gorszym poranku',
  lift_activity_energy: 'Ruch',
  lift_social_mood: 'Kontakt z ludźmi',
  lift_sidequest_mood: 'Side quest',
  lift_rules_mood: 'Trzymanie zasad',
  lift_dailyquest_mood: 'Quest dnia',
  carryover_evening_morning: 'Wieczór z rutyną → poranek',
  carryover_evening_energy: 'Wieczór z rutyną → energia rano',
  carryover_activity_energy: 'Ruch wczoraj → energia rano',
  carryover_xp_energy: 'Mocny dzień → energia rano',
}

function dirDiff(ins: Directional): number | null {
  const w  = ins.type === 'lift' ? ins.withLift    : ins.withMorning
  const wo = ins.type === 'lift' ? ins.withoutLift : ins.withoutMorning
  if (w === null || wo === null) return null
  return w - wo
}

function dirVerdict(ins: Directional): Verdict {
  if (!ins.hasEnoughData) return 'nodata'
  const d = dirDiff(ins)
  if (d === null) return 'nodata'
  const thr = ins.type === 'carryover' ? 0.15 : 0.2
  if (d > thr) return 'works'
  if (d < -thr) return 'reverse'
  return 'weak'
}

// Jednozdaniowy wpis do rankingu dźwigni.
// Opis różnicowy: znak różnicy niesie kierunek, więc jest poprawny i dla
// wzrostu, i dla „spada mniej" — bez przeszacowania słowem „podnosi".
function leverLine(ins: Directional): string {
  const name = LEVER_LABEL[ins.id] ?? ins.title
  const metricGen = ins.metric === 'mood' ? 'nastroju' : 'energii'
  if (dirVerdict(ins) === 'weak') return `${name}: bez wyraźnego efektu`
  return `${name} → ${fmtSigned(dirDiff(ins))} do ${metricGen}`
}

function VerdictChip({ v }: { v: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string }> = {
    works:   { label: 'działa',         cls: 'text-forest border-forest/40 bg-forest/5' },
    weak:    { label: 'słaby sygnał',   cls: 'text-muted border-hairline bg-cream/60' },
    reverse: { label: 'odwrotnie',      cls: 'text-red-700 border-red-200 bg-red-50/40' },
    nodata:  { label: 'za mało danych', cls: 'text-muted-light border-hairline bg-cream/40' },
  }
  const { label, cls } = map[v]
  return (
    <span className={clsx('font-ui uppercase tracking-luxury text-[9px] px-1.5 py-0.5 border whitespace-nowrap shrink-0', cls)}>
      {label}
    </span>
  )
}

// Ranking na górze sekcji — co realnie rusza nastrój/energię, od najmocniejszego
function LeversSummary({ items }: { items: Directional[] }) {
  return (
    <div className="bg-forest/5 border border-forest/25 p-5 mb-4">
      <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
        Twoje dźwignie
      </SmallCaps>
      <p className="font-serif-body italic text-muted text-[12.5px] mt-1 mb-3 leading-relaxed">
        co realnie rusza Twój nastrój i energię — od najmocniejszego.
      </p>
      <ul className="space-y-2">
        {items.map(ins => {
          const v = dirVerdict(ins)
          return (
            <li key={ins.id} className="flex items-start gap-2.5">
              <Diamond
                size={5}
                className={clsx(
                  'mt-1.5 shrink-0',
                  v === 'works' ? 'text-forest' : v === 'reverse' ? 'text-red-600' : 'text-muted-light'
                )}
                filled={v === 'works'}
              />
              <span
                className={clsx(
                  'font-serif-body text-[13px] leading-snug',
                  v === 'works' ? 'text-forest' : v === 'reverse' ? 'text-red-700' : 'text-muted'
                )}
              >
                {leverLine(ins)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Zwinięta lista dźwigni, które jeszcze nie mają dość danych
function CompactNoData({ items }: { items: Directional[] }) {
  return (
    <div className="bg-cream/50 border border-hairline px-4 py-3">
      <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1">
        Jeszcze zbierają dane
      </SmallCaps>
      <p className="font-serif-body italic text-muted-light text-[12px] leading-relaxed">
        {items.map(i => LEVER_LABEL[i.id] ?? i.title).join(' · ')}
      </p>
    </div>
  )
}

// ── Shared card primitives ───────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
  return <div className="bg-ivory border border-gold-light/40 p-5 sm:p-6">{children}</div>
}

function CardHeader({ icon, title, subtitle, metric, chip }: {
  icon: string
  title: string
  subtitle?: string
  metric?: string
  chip?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="text-2xl leading-none mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-dark text-base leading-tight">{title}</h3>
          {chip}
        </div>
        {(subtitle || metric) && (
          <p className="font-serif-body italic text-muted text-[12.5px] mt-1 leading-relaxed">
            {subtitle ?? (metric === 'mood' ? 'nastrój I–V' : 'energia I–V')}
          </p>
        )}
      </div>
    </div>
  )
}

function NarrativeBox({ narrative, tone }: {
  narrative: string
  tone: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div
      className={clsx(
        'border px-4 py-3 flex items-start gap-3',
        tone === 'positive' && 'bg-forest/5 border-forest/30',
        tone === 'negative' && 'bg-red-50/40 border-red-200',
        tone === 'neutral' && 'bg-cream/50 border-hairline'
      )}
    >
      <Diamond
        size={5}
        className={clsx(
          'mt-1.5 shrink-0',
          tone === 'positive' && 'text-forest',
          tone === 'negative' && 'text-red-600',
          tone === 'neutral' && 'text-muted'
        )}
        filled={tone === 'positive'}
      />
      <p
        className={clsx(
          'font-serif-body italic text-[13px] leading-relaxed',
          tone === 'positive' && 'text-forest',
          tone === 'negative' && 'text-red-700',
          tone === 'neutral' && 'text-muted'
        )}
      >
        {narrative}
      </p>
    </div>
  )
}

function NotEnoughData({ message }: { message: string }) {
  return (
    <div className="bg-cream/50 border border-hairline px-4 py-3">
      <p className="font-serif-body italic text-muted-light text-[12.5px] leading-relaxed">
        {message}
      </p>
    </div>
  )
}

// ── Cards ────────────────────────────────────────────────────────

function ComparisonCard({ ins }: { ins: ComparisonInsight }) {
  const narrative = comparisonNarrative(ins)
  const delta = ins.withValue !== null && ins.withoutValue !== null
    ? ins.withValue - ins.withoutValue : null
  const positive = delta !== null && delta > 0.1
  const negative = delta !== null && delta < -0.1
  const tone: 'positive' | 'negative' | 'neutral' = positive ? 'positive' : negative ? 'negative' : 'neutral'

  return (
    <CardShell>
      <CardHeader icon={ins.icon} title={ins.title} metric={ins.metric} />
      {!ins.hasEnoughData ? (
        <NotEnoughData message="za mało danych — potrzeba co najmniej III dni w każdej grupie i VII check-inów nastroju." />
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-serif-body text-[13px] text-dark truncate max-w-[70%]">{ins.withLabel}</span>
                <span
                  className={clsx(
                    'font-ui text-[11px] tabular-nums',
                    positive ? 'text-forest' : negative ? 'text-red-600' : 'text-muted'
                  )}
                >
                  {fmt(ins.withValue)}
                  {pctDiff(ins.withValue, ins.withoutValue) && (
                    <span className="ml-1 opacity-70">({pctDiff(ins.withValue, ins.withoutValue)})</span>
                  )}
                </span>
              </div>
              <div className="relative h-px w-full bg-hairline">
                <div
                  className={clsx('absolute left-0 top-0 h-px transition-all duration-700', positive ? 'bg-forest' : 'bg-gold')}
                  style={{ width: `${((ins.withValue ?? 0) / 5) * 100}%` }}
                />
              </div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-60">
                {ins.withCount} dni
              </SmallCaps>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-serif-body italic text-[13px] text-muted truncate max-w-[70%]">{ins.withoutLabel}</span>
                <span className="font-ui text-[11px] text-muted-light tabular-nums">{fmt(ins.withoutValue)}</span>
              </div>
              <div className="relative h-px w-full bg-hairline">
                <div
                  className="absolute left-0 top-0 h-px bg-parchment transition-all duration-700"
                  style={{ width: `${((ins.withoutValue ?? 0) / 5) * 100}%` }}
                />
              </div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-60">
                {ins.withoutCount} dni
              </SmallCaps>
            </div>
          </div>
          <NarrativeBox narrative={narrative} tone={tone} />
        </>
      )}
    </CardShell>
  )
}

function DayOfWeekCard({ ins }: { ins: DayOfWeekInsight }) {
  const narrative = dowNarrative(ins)
  const withData = ins.byDay.filter(d => d.value !== null)
  const maxVal = withData.length > 0 ? Math.max(...withData.map(d => d.value ?? 0)) : 5
  const minVal = withData.length > 0 ? Math.min(...withData.map(d => d.value ?? 0)) : 0

  return (
    <CardShell>
      <CardHeader icon={ins.icon} title={ins.title} metric={ins.metric} />

      {!ins.hasEnoughData ? (
        <NotEnoughData message="za mało danych — potrzeba co najmniej VII check-inów nastroju." />
      ) : (
        <>
          <div className="flex gap-1.5 mb-4 items-end" style={{ height: '76px' }}>
            {ins.byDay.map(day => {
              const hasDat = day.value !== null && day.count >= 1
              const isBest  = hasDat && day.value === maxVal && maxVal > minVal
              const isWorst = hasDat && day.value === minVal && maxVal > minVal
              const heightPct = hasDat ? ((day.value! - 0) / 5) * 100 : 8

              return (
                <div key={day.dow} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: '54px' }}>
                    <div
                      className={clsx(
                        'w-full transition-all duration-700',
                        isBest  ? 'bg-forest' :
                        isWorst ? 'bg-parchment' :
                        hasDat  ? 'bg-gold/60' : 'bg-cream'
                      )}
                      style={{ height: `${heightPct}%` }}
                      title={hasDat ? `${day.full}: ${fmt(day.value)}/5 (${day.count} dni)` : day.full}
                    />
                  </div>
                  <span
                    className={clsx(
                      'font-ui uppercase tracking-luxury text-[9px]',
                      isBest ? 'text-forest' : isWorst ? 'text-muted' : 'text-muted-light'
                    )}
                  >
                    {day.short}
                  </span>
                  <span className="font-ui text-[9px] text-muted-light tabular-nums">{fmt(day.value)}</span>
                </div>
              )
            })}
          </div>

          <NarrativeBox narrative={narrative} tone="neutral" />
        </>
      )}
    </CardShell>
  )
}

function LiftCard({ ins }: { ins: LiftInsight }) {
  const narrative = liftNarrative(ins)
  const positive = ins.withLift !== null && ins.withoutLift !== null
    && ins.withLift - ins.withoutLift > 0.2
  const negative = ins.withLift !== null && ins.withoutLift !== null
    && ins.withLift - ins.withoutLift < -0.2
  const tone: 'positive' | 'negative' | 'neutral' = positive ? 'positive' : negative ? 'negative' : 'neutral'

  const renderBar = (val: number | null, count: number, label: string, isWith: boolean) => {
    const safeVal = val ?? 0
    const pct = Math.min(100, Math.abs(safeVal) / 2 * 50)
    const goingUp = safeVal >= 0
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className={clsx('font-serif-body text-[13px] truncate max-w-[70%]', isWith ? 'text-dark' : 'text-muted italic')}>
            {label}
          </span>
          <span
            className={clsx(
              'font-ui text-[11px] tabular-nums',
              val === null ? 'text-muted-light' :
              isWith && positive ? 'text-forest' :
              isWith && negative ? 'text-red-600' :
              goingUp ? 'text-dark' : 'text-muted'
            )}
          >
            {fmtSigned(val)}
          </span>
        </div>
        <div className="relative h-3 bg-cream/60 overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-hairline" />
          {val !== null && (
            <div
              className={clsx(
                'absolute top-0 bottom-0 transition-all duration-700',
                isWith && positive ? 'bg-forest' :
                isWith && negative ? 'bg-red-400' :
                goingUp ? 'bg-gold' : 'bg-parchment'
              )}
              style={{
                left: goingUp ? '50%' : `${50 - pct}%`,
                width: `${pct}%`,
              }}
            />
          )}
        </div>
        <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-60">
          {count} dni
        </SmallCaps>
      </div>
    )
  }

  return (
    <CardShell>
      <CardHeader icon={ins.icon} title={ins.title} subtitle={ins.subtitle} chip={<VerdictChip v={dirVerdict(ins)} />} />

      {!ins.hasEnoughData ? (
        <NotEnoughData message="za mało danych — potrzeba V+ dni z II+ check-inami nastroju i III dni w każdej grupie." />
      ) : (
        <>
          <div className="space-y-4 mb-4">
            {renderBar(ins.withLift, ins.withCount, ins.withLabel, true)}
            {renderBar(ins.withoutLift, ins.withoutCount, ins.withoutLabel, false)}
          </div>

          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mb-3 block px-1 opacity-60">
            ← spadek · 0 · wzrost →
          </SmallCaps>

          <NarrativeBox narrative={narrative} tone={tone} />
        </>
      )}
    </CardShell>
  )
}

function CarryoverCard({ ins }: { ins: CarryoverInsight }) {
  const narrative = carryoverNarrative(ins)
  const positive = ins.withMorning !== null && ins.withoutMorning !== null
    && ins.withMorning - ins.withoutMorning > 0.15
  const negative = ins.withMorning !== null && ins.withoutMorning !== null
    && ins.withMorning - ins.withoutMorning < -0.15
  const tone: 'positive' | 'negative' | 'neutral' = positive ? 'positive' : negative ? 'negative' : 'neutral'

  return (
    <CardShell>
      <CardHeader icon={ins.icon} title={ins.title} subtitle={ins.subtitle} chip={<VerdictChip v={dirVerdict(ins)} />} />

      {!ins.hasEnoughData ? (
        <NotEnoughData message="za mało danych — potrzeba III+ par sąsiednich dni w każdej grupie." />
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-serif-body text-[13px] text-dark truncate max-w-[70%]">{ins.withLabel}</span>
                <span
                  className={clsx(
                    'font-ui text-[11px] tabular-nums',
                    positive ? 'text-forest' : negative ? 'text-red-600' : 'text-muted'
                  )}
                >
                  {fmt(ins.withMorning)}
                </span>
              </div>
              <div className="relative h-px w-full bg-hairline">
                <div
                  className={clsx('absolute left-0 top-0 h-px transition-all duration-700', positive ? 'bg-forest' : 'bg-gold')}
                  style={{ width: `${((ins.withMorning ?? 0) / 5) * 100}%` }}
                />
              </div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-60">
                {ins.withCount} poranków
              </SmallCaps>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-serif-body italic text-[13px] text-muted truncate max-w-[70%]">{ins.withoutLabel}</span>
                <span className="font-ui text-[11px] text-muted-light tabular-nums">{fmt(ins.withoutMorning)}</span>
              </div>
              <div className="relative h-px w-full bg-hairline">
                <div
                  className="absolute left-0 top-0 h-px bg-parchment transition-all duration-700"
                  style={{ width: `${((ins.withoutMorning ?? 0) / 5) * 100}%` }}
                />
              </div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-60">
                {ins.withoutCount} poranków
              </SmallCaps>
            </div>
          </div>

          <NarrativeBox narrative={narrative} tone={tone} />
        </>
      )}
    </CardShell>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export default function PatternsTab({ logs }: { logs: Record<string, DailyLog> }) {
  const insights = useMemo(() => computeCorrelations(logs), [logs])
  const logsWithMood = Object.values(logs).filter(l => l.moodCheckIns && l.moodCheckIns.length > 0)
  const MIN_TOTAL = 7

  if (logsWithMood.length === 0) {
    return (
      <div className="bg-ivory border border-gold-light/40 p-12 text-center">
        <Fleuron size={16} className="text-gold-deep mx-auto mb-4 inline-block" />
        <h3 className="font-display text-dark text-2xl">Wzorce pojawią się z czasem</h3>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-3 max-w-sm mx-auto leading-relaxed">
          uzupełniaj check-iny nastroju (pojawiają się losowo na dashboardzie) —
          po kilku tygodniach zobaczysz tu automatyczne wnioski.
        </p>
      </div>
    )
  }

  // ── Grupowanie wniosków ──────────────────────────────────────────
  const directional = insights.filter(
    (i): i is Directional => i.type === 'lift' || i.type === 'carryover'
  )
  const dirWithData = directional
    .filter(i => dirVerdict(i) !== 'nodata')
    .sort((a, b) => Math.abs(dirDiff(b) ?? 0) - Math.abs(dirDiff(a) ?? 0))
  const dirNoData = directional.filter(i => dirVerdict(i) === 'nodata')

  const dowInsights = insights.filter(
    (i): i is DayOfWeekInsight => i.type === 'dow'
  )
  const cigInsights = insights.filter(
    (i): i is ComparisonInsight => i.type === 'comparison' && i.id.startsWith('cigarettes')
  )
  const cigWithData = cigInsights.filter(i => i.hasEnoughData)

  return (
    <div className="space-y-4">
      <WeeklyInsightCard />

      <div className="bg-cream/60 border border-hairline px-4 py-3">
        <p className="font-serif-body italic text-muted text-[13px] leading-relaxed">
          analiza oparta na{' '}
          <span className="not-italic font-heading text-dark">{logsWithMood.length} dniach z check-inem nastroju</span>.
          {logsWithMood.length < MIN_TOTAL
            ? ` potrzeba co najmniej ${MIN_TOTAL}, żeby uruchomić pełną analizę.`
            : ' wzorce aktualizują się automatycznie wraz z nowymi danymi.'}
        </p>
      </div>

      {/* ── Wpływ kierunkowy — to, co realnie działa ── */}
      {directional.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Diamond size={5} className="text-gold-deep" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
              Wpływ kierunkowy
            </SmallCaps>
          </div>
          <p className="font-serif-body italic text-muted-light text-[12.5px] mb-3 px-1 leading-relaxed">
            co realnie podnosi Twój nastrój i energię — mierzone wzrostem w ciągu dnia,
            a nie tylko tym, że coś występuje razem.
          </p>

          {dirWithData.length > 0 ? (
            <>
              <LeversSummary items={dirWithData} />
              <div className="space-y-4">
                {dirWithData.map(ins =>
                  ins.type === 'lift'
                    ? <LiftCard key={ins.id} ins={ins} />
                    : <CarryoverCard key={ins.id} ins={ins} />
                )}
              </div>
            </>
          ) : (
            <div className="bg-cream/50 border border-hairline px-4 py-3 mb-3">
              <p className="font-serif-body italic text-muted text-[13px] leading-relaxed">
                jeszcze za mało danych, żeby wskazać dźwignie — rób check-iny nastroju
                (najlepiej 2 w ciągu dnia), a wnioski pojawią się same.
              </p>
            </div>
          )}

          {dirNoData.length > 0 && (
            <div className="mt-3">
              <CompactNoData items={dirNoData} />
            </div>
          )}
        </div>
      )}

      {/* ── Rytm tygodnia ── */}
      {dowInsights.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Diamond size={5} className="text-gold-deep" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
              Rytm tygodnia
            </SmallCaps>
          </div>
          <p className="font-serif-body italic text-muted-light text-[12.5px] mb-3 px-1 leading-relaxed">
            kiedy w tygodniu masz statystycznie lepiej, a kiedy trudniej — do planowania trudnych dni.
          </p>
          <div className="space-y-4">
            {dowInsights.map(ins => <DayOfWeekCard key={ins.id} ins={ins} />)}
          </div>
        </div>
      )}

      {/* ── Obserwacje (papierosy) — neutralnie, bez oceny ── */}
      {cigInsights.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Diamond size={5} className="text-gold-deep" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
              Obserwacje
            </SmallCaps>
          </div>
          <p className="font-serif-body italic text-muted-light text-[12.5px] mb-3 px-1 leading-relaxed">
            neutralny ślad, bez oceny — faza obserwacji. tylko patrzymy, co się z czym schodzi.
          </p>
          {cigWithData.length > 0 ? (
            <div className="space-y-4">
              {cigWithData.map(ins => <ComparisonCard key={ins.id} ins={ins} />)}
            </div>
          ) : (
            <div className="bg-cream/50 border border-hairline px-4 py-3">
              <p className="font-serif-body italic text-muted-light text-[12.5px] leading-relaxed">
                jeszcze zbierasz dane — porównania pojawią się, gdy uzbiera się dość dni z check-inem.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
