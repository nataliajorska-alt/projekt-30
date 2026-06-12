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

const SCALE = [1, 2, 3, 4, 5]

function xPct(val: number): number {
  return ((val - 1) / 4) * 100
}

interface TooltipState {
  pillarName: string
  pillarColor: string
  value: number
  periodLabel: string
}

export default function PillarTrendChart({ reviews, period = 'weekly' }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // od najstarszego do najnowszego — najnowszy rysowany na wierzchu
  const sorted = normalize(reviews, period).reverse()
  const n = sorted.length

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
        pełny romb = {period === 'weekly' ? 'ostatni tydzień' : 'ostatni miesiąc'}, bledsze = wcześniejsze.
      </p>

      {/* Oś 1–5 */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-24 shrink-0" />
        <div className="flex-1 relative h-4">
          {SCALE.map(v => (
            <span
              key={v}
              className="absolute -translate-x-1/2 font-ui text-[9px] text-muted-light"
              style={{ left: `${xPct(v)}%` }}
            >
              {v}
            </span>
          ))}
        </div>
        <div className="w-12 shrink-0" />
      </div>

      {PILLARS.map(pillar => {
        const pts = sorted
          .map(r => ({ val: r.pillarsRated?.[pillar.id], label: r.label }))
          .filter((pt): pt is { val: number; label: string } => pt.val != null)
        const latest = pts.length > 0 ? pts[pts.length - 1] : null
        const prev = pts.length > 1 ? pts[pts.length - 2] : null
        const delta = latest && prev ? latest.val - prev.val : null

        return (
          <div key={pillar.id} className="flex items-center gap-3 py-3 border-b border-hairline last:border-0">
            <div className="w-24 shrink-0 flex items-center gap-1.5 min-w-0">
              <span className="shrink-0" style={{ color: pillar.color }}>
                <Diamond size={4} filled />
              </span>
              <SmallCaps tracking="luxury" size="xs">
                <span style={{ color: pillar.color }}>{pillar.shortName}</span>
              </SmallCaps>
            </div>

            {/* Tor 1–5 */}
            <div className="flex-1 relative h-6">
              <div className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
              {SCALE.map(v => (
                <span
                  key={v}
                  className="absolute top-1/2 w-px h-[5px] -translate-x-1/2 -translate-y-1/2 bg-hairline"
                  style={{ left: `${xPct(v)}%` }}
                />
              ))}
              {pts.map((pt, i) => {
                const isLatest = i === pts.length - 1
                const t = pts.length > 1 ? i / (pts.length - 1) : 1
                const size = isLatest ? 11 : 7
                return (
                  <button
                    key={i}
                    className="absolute top-1/2"
                    style={{
                      left: `${xPct(pt.val)}%`,
                      width: size,
                      height: size,
                      background: pillar.color,
                      opacity: isLatest ? 1 : 0.15 + 0.45 * t,
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
