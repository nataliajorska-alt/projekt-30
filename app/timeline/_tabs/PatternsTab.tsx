'use client'
import { useMemo } from 'react'
import {
  computeCorrelations,
  type ComparisonInsight, type DayOfWeekInsight, type LiftInsight, type CarryoverInsight,
} from '@/lib/correlations'
import type { DailyLog } from '@/types'
import WeeklyInsightCard from '@/components/WeeklyInsightCard'
import clsx from 'clsx'

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── Narratives ────────────────────────────────────────────────────────

function comparisonNarrative(ins: ComparisonInsight): string {
  const { withValue, withoutValue, withLabel, metric } = ins
  if (withValue === null || withoutValue === null) return 'Za mało danych do porównania.'
  const diff = withValue - withoutValue
  const metricPL = metric === 'mood' ? 'nastrój' : 'energia'
  if (Math.abs(diff) < 0.15) return `Nie wykryto znaczącej różnicy w ${metricPL === 'nastrój' ? 'nastroju' : 'energii'} między grupami.`
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutValue, 0.1)) * 100)
  const dir = diff > 0 ? 'wyższy' : 'niższy'
  return `${withLabel}: Twój ${metricPL} jest o ${absPct}% ${dir} niż w pozostałe dni.`
}

function dowNarrative(ins: DayOfWeekInsight): string {
  const withData = ins.byDay.filter(d => d.count >= 2 && d.value !== null)
  if (withData.length < 3) return 'Za mało danych — check-iny z co najmniej 3 różnych dni tygodnia.'
  const sorted = [...withData].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const best  = sorted[0]
  const worst = sorted[sorted.length - 1]
  const metricPL = ins.metric === 'energy' ? 'energia' : 'nastrój'
  return `Twoja ${metricPL} jest najwyższa w ${best.full} (śr. ${fmt(best.value)}/5), najniższa w ${worst.full} (śr. ${fmt(worst.value)}/5).`
}

function liftNarrative(ins: LiftInsight): string {
  const { withLift, withoutLift, metric } = ins
  if (withLift === null || withoutLift === null) return 'Za mało danych do porównania.'
  const m = metric === 'mood' ? 'nastrój' : 'energia'
  const diff = withLift - withoutLift
  if (withLift > 0.2 && withoutLift <= 0) {
    return `${m === 'nastrój' ? 'Nastrój' : 'Energia'} rośnie w ciągu dnia o ${fmtSigned(withLift)} kiedy działasz, a ${m === 'nastrój' ? 'spada' : 'spada'} o ${fmtSigned(withoutLift)} kiedy nie. Mocny dowód: to wpływa w obie strony.`
  }
  if (Math.abs(diff) < 0.2) {
    return `Nie wykryto różnicy w zmianie ${m === 'nastrój' ? 'nastroju' : 'energii'} — efekt może być słaby lub potrzeba więcej dni.`
  }
  if (diff > 0) {
    return `${m === 'nastrój' ? 'Nastrój' : 'Energia'} rośnie o ${fmtSigned(diff)} więcej w dni, kiedy działasz. To sugeruje realny wpływ — nie tylko korelację.`
  }
  return `Wzrost ${m === 'nastrój' ? 'nastroju' : 'energii'} jest o ${fmtSigned(Math.abs(diff))} mniejszy gdy działasz — warto sprawdzić co innego dzieje się w te dni.`
}

function carryoverNarrative(ins: CarryoverInsight): string {
  const { withMorning, withoutMorning } = ins
  if (withMorning === null || withoutMorning === null) return 'Za mało danych do porównania.'
  const diff = withMorning - withoutMorning
  if (Math.abs(diff) < 0.15) return 'Wieczór nie wpływa wyraźnie na poranek następnego dnia.'
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutMorning, 0.1)) * 100)
  if (diff > 0) {
    return `Po wieczorach z rutyną budzisz się w lepszym nastroju o ${absPct}% (${fmtSigned(diff)} pkt). Wieczór dnia X kształtuje poranek X+1.`
  }
  return `Po wieczorach z rutyną poranek bywa o ${absPct}% gorszy. Może rutyna wieczorna jest zbyt późno?`
}

// ── Cards ──────────────────────────────────────────────────────────────

function ComparisonCard({ ins }: { ins: ComparisonInsight }) {
  const maxVal = 5
  const narrative = comparisonNarrative(ins)
  const delta = ins.withValue !== null && ins.withoutValue !== null
    ? ins.withValue - ins.withoutValue : null
  const positive = delta !== null && delta > 0.1
  const negative = delta !== null && delta < -0.1

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl leading-none mt-0.5">{ins.icon}</span>
        <div>
          <h3 className="font-serif text-dark text-base leading-snug">{ins.title}</h3>
          <p className="font-sans text-xs text-muted mt-0.5">
            {ins.metric === 'mood' ? 'nastrój 1–5' : 'energia 1–5'}
          </p>
        </div>
      </div>

      {!ins.hasEnoughData ? (
        <div className="bg-cream rounded-xl px-4 py-3">
          <p className="font-sans text-xs text-muted-light leading-relaxed">
            Za mało danych — potrzeba co najmniej 3 dni w każdej grupie i 7 check-inów nastroju.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-dark truncate max-w-[70%]">{ins.withLabel}</span>
                <span className={clsx(
                  'font-sans text-xs font-semibold',
                  positive ? 'text-forest' : negative ? 'text-red-400' : 'text-muted'
                )}>
                  {fmt(ins.withValue)}
                  {pctDiff(ins.withValue, ins.withoutValue) && (
                    <span className="ml-1 text-[10px]">({pctDiff(ins.withValue, ins.withoutValue)})</span>
                  )}
                </span>
              </div>
              <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-700', positive ? 'bg-forest' : 'bg-gold')}
                  style={{ width: `${((ins.withValue ?? 0) / maxVal) * 100}%` }}
                />
              </div>
              <span className="font-sans text-[10px] text-muted-light">{ins.withCount} dni</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-muted truncate max-w-[70%]">{ins.withoutLabel}</span>
                <span className="font-sans text-xs text-muted-light">{fmt(ins.withoutValue)}</span>
              </div>
              <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-parchment rounded-full transition-all duration-700"
                  style={{ width: `${((ins.withoutValue ?? 0) / maxVal) * 100}%` }}
                />
              </div>
              <span className="font-sans text-[10px] text-muted-light">{ins.withoutCount} dni</span>
            </div>
          </div>

          <div className={clsx(
            'rounded-xl px-4 py-3 border',
            positive ? 'bg-forest/5 border-forest/20' : negative ? 'bg-red-50 border-red-100' : 'bg-cream border-transparent'
          )}>
            <p className={clsx(
              'font-sans text-xs leading-relaxed',
              positive ? 'text-forest' : negative ? 'text-red-600' : 'text-muted'
            )}>
              {narrative}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function DayOfWeekCard({ ins }: { ins: DayOfWeekInsight }) {
  const narrative = dowNarrative(ins)
  const withData = ins.byDay.filter(d => d.value !== null)
  const maxVal = withData.length > 0 ? Math.max(...withData.map(d => d.value ?? 0)) : 5
  const minVal = withData.length > 0 ? Math.min(...withData.map(d => d.value ?? 0)) : 0

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl leading-none mt-0.5">{ins.icon}</span>
        <div>
          <h3 className="font-serif text-dark text-base leading-snug">{ins.title}</h3>
          <p className="font-sans text-xs text-muted mt-0.5">
            {ins.metric === 'mood' ? 'nastrój 1–5' : 'energia 1–5'}
          </p>
        </div>
      </div>

      {!ins.hasEnoughData ? (
        <div className="bg-cream rounded-xl px-4 py-3">
          <p className="font-sans text-xs text-muted-light">Za mało danych — potrzeba co najmniej 7 check-inów nastroju.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 mb-4 items-end" style={{ height: '72px' }}>
            {ins.byDay.map(day => {
              const hasDat = day.value !== null && day.count >= 1
              const isBest  = hasDat && day.value === maxVal && maxVal > minVal
              const isWorst = hasDat && day.value === minVal && maxVal > minVal
              const heightPct = hasDat ? ((day.value! - 0) / 5) * 100 : 8

              return (
                <div key={day.dow} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: '52px' }}>
                    <div
                      className={clsx(
                        'w-full rounded-md transition-all duration-700',
                        isBest  ? 'bg-forest' :
                        isWorst ? 'bg-parchment' :
                        hasDat  ? 'bg-gold/60' : 'bg-cream'
                      )}
                      style={{ height: `${heightPct}%` }}
                      title={hasDat ? `${day.full}: ${fmt(day.value)}/5 (${day.count} dni)` : day.full}
                    />
                  </div>
                  <span className={clsx(
                    'font-sans text-[9px]',
                    isBest ? 'text-forest font-semibold' : isWorst ? 'text-muted' : 'text-muted-light'
                  )}>
                    {day.short}
                  </span>
                  <span className="font-sans text-[9px] text-muted-light">{fmt(day.value)}</span>
                </div>
              )
            })}
          </div>

          <div className="bg-cream rounded-xl px-4 py-3">
            <p className="font-sans text-xs text-muted leading-relaxed">{narrative}</p>
          </div>
        </>
      )}
    </div>
  )
}

function LiftCard({ ins }: { ins: LiftInsight }) {
  const narrative = liftNarrative(ins)
  const positive = ins.withLift !== null && ins.withoutLift !== null
    && ins.withLift - ins.withoutLift > 0.2
  const negative = ins.withLift !== null && ins.withoutLift !== null
    && ins.withLift - ins.withoutLift < -0.2

  const renderBar = (val: number | null, count: number, label: string, isWith: boolean) => {
    const safeVal = val ?? 0
    const pct = Math.min(100, Math.abs(safeVal) / 2 * 50)
    const goingUp = safeVal >= 0
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className={clsx('font-sans text-xs truncate max-w-[70%]', isWith ? 'text-dark' : 'text-muted')}>{label}</span>
          <span className={clsx(
            'font-sans text-xs font-semibold',
            val === null ? 'text-muted-light' :
            isWith && positive ? 'text-forest' :
            isWith && negative ? 'text-red-400' :
            goingUp ? 'text-dark' : 'text-muted'
          )}>
            {fmtSigned(val)}
          </span>
        </div>
        <div className="relative h-3 bg-cream rounded-full overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
          {val !== null && (
            <div
              className={clsx(
                'absolute top-0 bottom-0 transition-all duration-700 rounded-full',
                isWith && positive ? 'bg-forest' :
                isWith && negative ? 'bg-red-300' :
                goingUp ? 'bg-gold' : 'bg-parchment'
              )}
              style={{
                left: goingUp ? '50%' : `${50 - pct}%`,
                width: `${pct}%`,
              }}
            />
          )}
        </div>
        <span className="font-sans text-[10px] text-muted-light">{count} dni</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5 border border-forest/10">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl leading-none mt-0.5">{ins.icon}</span>
        <div>
          <h3 className="font-serif text-dark text-base leading-snug">{ins.title}</h3>
          <p className="font-sans text-[11px] text-muted mt-1 leading-relaxed">{ins.subtitle}</p>
        </div>
      </div>

      {!ins.hasEnoughData ? (
        <div className="bg-cream rounded-xl px-4 py-3 mt-3">
          <p className="font-sans text-xs text-muted-light leading-relaxed">
            Za mało danych — potrzeba 5+ dni z co najmniej 2 check-inami nastroju i 3 dni w każdej grupie.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 mt-4">
            {renderBar(ins.withLift, ins.withCount, ins.withLabel, true)}
            {renderBar(ins.withoutLift, ins.withoutCount, ins.withoutLabel, false)}
          </div>

          <div className="font-sans text-[10px] text-muted-light mb-3 px-1">
            ← spadek · 0 · wzrost →
          </div>

          <div className={clsx(
            'rounded-xl px-4 py-3 border',
            positive ? 'bg-forest/5 border-forest/20' : negative ? 'bg-red-50 border-red-100' : 'bg-cream border-transparent'
          )}>
            <p className={clsx(
              'font-sans text-xs leading-relaxed',
              positive ? 'text-forest' : negative ? 'text-red-600' : 'text-muted'
            )}>
              {narrative}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function CarryoverCard({ ins }: { ins: CarryoverInsight }) {
  const narrative = carryoverNarrative(ins)
  const positive = ins.withMorning !== null && ins.withoutMorning !== null
    && ins.withMorning - ins.withoutMorning > 0.15
  const negative = ins.withMorning !== null && ins.withoutMorning !== null
    && ins.withMorning - ins.withoutMorning < -0.15

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5 border border-forest/10">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl leading-none mt-0.5">{ins.icon}</span>
        <div>
          <h3 className="font-serif text-dark text-base leading-snug">{ins.title}</h3>
          <p className="font-sans text-[11px] text-muted mt-1 leading-relaxed">{ins.subtitle}</p>
        </div>
      </div>

      {!ins.hasEnoughData ? (
        <div className="bg-cream rounded-xl px-4 py-3 mt-3">
          <p className="font-sans text-xs text-muted-light leading-relaxed">
            Za mało danych — potrzeba 3+ par sąsiednich dni w każdej grupie.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-dark truncate max-w-[70%]">{ins.withLabel}</span>
                <span className={clsx(
                  'font-sans text-xs font-semibold',
                  positive ? 'text-forest' : negative ? 'text-red-400' : 'text-muted'
                )}>
                  {fmt(ins.withMorning)}
                </span>
              </div>
              <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-700', positive ? 'bg-forest' : 'bg-gold')}
                  style={{ width: `${((ins.withMorning ?? 0) / 5) * 100}%` }}
                />
              </div>
              <span className="font-sans text-[10px] text-muted-light">{ins.withCount} poranków</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-muted truncate max-w-[70%]">{ins.withoutLabel}</span>
                <span className="font-sans text-xs text-muted-light">{fmt(ins.withoutMorning)}</span>
              </div>
              <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-parchment rounded-full transition-all duration-700"
                  style={{ width: `${((ins.withoutMorning ?? 0) / 5) * 100}%` }}
                />
              </div>
              <span className="font-sans text-[10px] text-muted-light">{ins.withoutCount} poranków</span>
            </div>
          </div>

          <div className={clsx(
            'rounded-xl px-4 py-3 border',
            positive ? 'bg-forest/5 border-forest/20' : negative ? 'bg-red-50 border-red-100' : 'bg-cream border-transparent'
          )}>
            <p className={clsx(
              'font-sans text-xs leading-relaxed',
              positive ? 'text-forest' : negative ? 'text-red-600' : 'text-muted'
            )}>
              {narrative}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main tab ───────────────────────────────────────────────────────────

export default function PatternsTab({ logs }: { logs: Record<string, DailyLog> }) {
  const insights = useMemo(() => computeCorrelations(logs), [logs])
  const logsWithMood = Object.values(logs).filter(l => l.moodCheckIns && l.moodCheckIns.length > 0)
  const MIN_TOTAL = 7

  if (logsWithMood.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p className="font-serif text-dark text-lg mb-2">Wzorce pojawią się z czasem</p>
        <p className="font-sans text-sm text-muted leading-relaxed max-w-sm mx-auto">
          Uzupełniaj check-iny nastroju (pojawiają się losowo na dashboardzie) — po kilku tygodniach zobaczysz tu automatyczne wnioski.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <WeeklyInsightCard />

      <div className="bg-cream rounded-2xl p-4">
        <p className="font-sans text-xs text-muted leading-relaxed">
          Analiza oparta na <span className="font-medium text-dark">{logsWithMood.length} dniach z check-inem nastroju</span>.
          {logsWithMood.length < MIN_TOTAL
            ? ` Potrzeba co najmniej ${MIN_TOTAL}, żeby uruchomić pełną analizę.`
            : ' Wzorce aktualizują się automatycznie wraz z nowymi danymi.'}
        </p>
      </div>

      {insights.some(i => i.type === 'lift' || i.type === 'carryover') && (
        <div className="pt-2">
          <h3 className="font-serif text-dark text-sm mb-2 px-1">Wpływ kierunkowy</h3>
          <p className="font-sans text-[11px] text-muted-light mb-3 px-1 leading-relaxed">
            Te wykresy odpowiadają na pytanie <span className="italic">„czy działanie X realnie podnosi nastrój"</span>, a nie tylko czy występują razem.
          </p>
          <div className="space-y-4">
            {insights.filter(i => i.type === 'lift').map(ins => (
              <LiftCard key={ins.id} ins={ins as LiftInsight} />
            ))}
            {insights.filter(i => i.type === 'carryover').map(ins => (
              <CarryoverCard key={ins.id} ins={ins as CarryoverInsight} />
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <h3 className="font-serif text-dark text-sm mb-2 px-1">Współwystępowanie</h3>
        <p className="font-sans text-[11px] text-muted-light mb-3 px-1 leading-relaxed">
          Te porównania pokazują co dzieje się razem — nie zawsze co powoduje co.
        </p>
        <div className="space-y-4">
          {insights.filter(i => i.type === 'comparison' || i.type === 'dow').map(ins => (
            ins.type === 'comparison'
              ? <ComparisonCard key={ins.id} ins={ins as ComparisonInsight} />
              : <DayOfWeekCard key={ins.id} ins={ins as DayOfWeekInsight} />
          ))}
        </div>
      </div>
    </div>
  )
}
