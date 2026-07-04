'use client'
import { useState } from 'react'
import { PILLARS } from '@/lib/pillars'
import type { WeeklyReview, MonthlyReview } from '@/types'
import { SmallCaps, Diamond } from '@/components/ui'

type Period = 'weekly' | 'monthly'

interface Props {
  reviews: WeeklyReview[] | MonthlyReview[]
  period?: Period
}

const PL_MONTHS_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split('-').map(Number)
  return `${d} ${PL_MONTHS_SHORT[m - 1]}`
}

function formatMonthLabel(month: string): string {
  const [, m] = month.split('-').map(Number)
  return PL_MONTHS_SHORT[m - 1]
}

// Normalizuje tygodniowe i miesięczne przeglądy do wspólnego kształtu dla wykresu.
function normalize(reviews: Props['reviews'], period: Period) {
  if (period === 'monthly') {
    return (reviews as MonthlyReview[]).map(r => ({
      key: r.month,
      label: formatMonthLabel(r.month),
      pillarsRated: r.pillarsRated,
    }))
  }
  return (reviews as WeeklyReview[]).map(r => ({
    key: r.weekStart,
    label: formatWeekLabel(r.weekStart),
    pillarsRated: r.pillarsRated,
  }))
}

const PERIOD_NOUN: Record<Period, (n: number) => string> = {
  weekly: n => (n === 1 ? 'tydzień' : n < 5 ? 'tygodnie' : 'tygodni'),
  monthly: n => (n === 1 ? 'miesiąc' : n < 5 ? 'miesiące' : 'miesięcy'),
}

interface TooltipState {
  pillarName: string
  pillarColor: string
  value: number
  periodLabel: string
}

export default function PillarTrendChart({ reviews, period = 'weekly' }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // od najstarszego do najnowszego — czas płynie w prawo
  const sorted = normalize(reviews, period).reverse()
  const n = sorted.length

  // oś czasu: % szerokości toru; pojedynczy punkt ląduje na środku
  const xPct = (idx: number) => (n > 1 ? (idx / (n - 1)) * 100 : 50)
  // oś ocen: 5 u góry, 1 na dole
  const yPct = (val: number) => ((5 - val) / 4) * 100

  return (
    <div className="bg-[#dcd5bc] border border-gold-light/25 p-5 mb-5">
      <div className="mb-1">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Wizualizacja
        </SmallCaps>
        <h3 className="font-heading text-dark text-lg mt-1">
          Trend filarów · {n} {PERIOD_NOUN[period](n)}
        </h3>
      </div>
      <p className="font-serif-body italic text-muted text-[12px] mb-5">
        każdy filar na własnym torze — linia prowadzi przez {period === 'weekly' ? 'tygodnie' : 'miesiące'}, pełny romb = {period === 'weekly' ? 'ostatni tydzień' : 'ostatni miesiąc'}.
      </p>

      {PILLARS.map((pillar, pillarIdx) => {
        const pts = sorted
          .map((r, idx) => ({ idx, val: r.pillarsRated?.[pillar.id], label: r.label }))
          .filter((pt): pt is { idx: number; val: number; label: string } => pt.val != null)
        const latest = pts.length > 0 ? pts[pts.length - 1] : null
        const prev = pts.length > 1 ? pts[pts.length - 2] : null
        const delta = latest && prev ? latest.val - prev.val : null

        return (
          <div key={pillar.id} className="flex items-center gap-3 py-2 border-b border-hairline last:border-0">
            <div className="w-24 shrink-0 flex items-center gap-1.5 min-w-0">
              <span className="shrink-0" style={{ color: pillar.color }}>
                <Diamond size={4} filled />
              </span>
              <SmallCaps tracking="luxury" size="xs">
                <span style={{ color: pillar.color }}>{pillar.shortName}</span>
              </SmallCaps>
            </div>

            {/* Tor czasowy filaru: sparkline 1–5 */}
            <div className="flex-1 relative h-12">
              <div className="absolute inset-x-0 top-[7px] bottom-[7px]">
                {/* linie pomocnicze: 5 / 3 / 1 */}
                {[0, 50, 100].map(top => (
                  <span
                    key={top}
                    className="absolute inset-x-0 h-px bg-hairline"
                    style={{ top: `${top}%`, opacity: top === 50 ? 0.8 : 0.45 }}
                  />
                ))}

                {pts.length > 1 && (
                  <svg
                    className="absolute inset-0 w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={pts.map(pt => `${xPct(pt.idx)},${yPct(pt.val)}`).join(' ')}
                      fill="none"
                      stroke={pillar.color}
                      strokeWidth={1.4}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={0.45}
                      vectorEffect="non-scaling-stroke"
                      pathLength={1}
                      strokeDasharray="1"
                      className="animate-draw"
                      style={{ animationDelay: `${pillarIdx * 90}ms`, animationFillMode: 'backwards' }}
                    />
                  </svg>
                )}

                {pts.map((pt, i) => {
                  const isLatest = i === pts.length - 1
                  const t = pts.length > 1 ? i / (pts.length - 1) : 1
                  const size = isLatest ? 10 : 7
                  return (
                    <button
                      key={pt.idx}
                      className="absolute"
                      style={{
                        left: `${xPct(pt.idx)}%`,
                        top: `${yPct(pt.val)}%`,
                        width: size,
                        height: size,
                        background: pillar.color,
                        opacity: isLatest ? 1 : 0.3 + 0.4 * t,
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        border: isLatest ? '1.2px solid #FAF8F4' : 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setTooltip({
                        pillarName: pillar.name,
                        pillarColor: pillar.color,
                        value: pt.val,
                        periodLabel: pt.label,
                      })}
                      onMouseLeave={() => setTooltip(null)}
                      aria-label={`${pillar.name}: ${pt.val}/5 · ${pt.label}`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Obecna ocena + zmiana vs poprzedni okres */}
            <div className="w-12 shrink-0 text-right">
              {latest ? (
                <span
                  className="font-display font-medium text-[14px] inline-flex items-baseline gap-1"
                  style={{ color: pillar.color }}
                >
                  {latest.val}
                  {delta !== null && delta !== 0 && (
                    <span className="font-ui text-[9px]" style={{ color: delta > 0 ? '#5d7356' : '#9c413a' }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </span>
              ) : (
                <span className="font-serif-body italic text-muted-light text-[12px]">–</span>
              )}
            </div>
          </div>
        )
      })}

      {/* Oś czasu: od najstarszego do najnowszego */}
      {n > 1 && (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-24 shrink-0" />
          <div className="flex-1 flex justify-between">
            <SmallCaps tone="muted" tracking="luxury" size="xs">{sorted[0].label}</SmallCaps>
            <SmallCaps tone="muted" tracking="luxury" size="xs">{sorted[n - 1].label}</SmallCaps>
          </div>
          <div className="w-12 shrink-0" />
        </div>
      )}

      {/* Tooltip */}
      <div className="mt-3 min-h-[28px]">
        {tooltip ? (
          <div className="inline-flex items-center gap-2.5 bg-[#dcd5bc] border border-gold-light/25 px-3 py-1.5">
            <span style={{ color: tooltip.pillarColor }}>
              <Diamond size={4} filled />
            </span>
            <SmallCaps tracking="luxury" size="xs">
              <span style={{ color: tooltip.pillarColor }}>{tooltip.pillarName}</span>
            </SmallCaps>
            <span className="font-display text-sm" style={{ color: tooltip.pillarColor }}>
              {tooltip.value}/5
            </span>
            <SmallCaps tone="muted" size="xs">
              {tooltip.periodLabel}
            </SmallCaps>
          </div>
        ) : (
          <p className="font-serif-body italic text-muted-light text-[12px]">
            najedź na romb, aby zobaczyć ocenę i {period === 'weekly' ? 'tydzień' : 'miesiąc'}
          </p>
        )}
      </div>
    </div>
  )
}
