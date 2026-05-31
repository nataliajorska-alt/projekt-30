'use client'
import { useState } from 'react'
import { PILLARS } from '@/lib/pillars'
import type { WeeklyReview, Pillar } from '@/types'
import { SmallCaps, Diamond } from '@/components/ui'

interface Props {
  reviews: WeeklyReview[]
}

const PL_MONTHS_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split('-').map(Number)
  return `${d} ${PL_MONTHS_SHORT[m - 1]}`
}

const SVG_WIDTH = 600
const SVG_HEIGHT = 220
const PAD_LEFT = 32
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 36
const CHART_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT
const CHART_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM
const Y_MIN = 1
const Y_MAX = 5

function yPos(val: number): number {
  return PAD_TOP + ((Y_MAX - val) / (Y_MAX - Y_MIN)) * CHART_H
}
function xPos(idx: number, total: number): number {
  if (total <= 1) return PAD_LEFT + CHART_W / 2
  return PAD_LEFT + (idx / (total - 1)) * CHART_W
}

interface TooltipState {
  x: number
  y: number
  pillarId: Pillar
  pillarName: string
  pillarColor: string
  value: number
  weekLabel: string
}

export default function PillarTrendChart({ reviews }: Props) {
  const [hiddenPillars, setHiddenPillars] = useState<Set<Pillar>>(new Set())
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const sorted = [...reviews].reverse()
  const n = sorted.length

  const togglePillar = (id: Pillar) => {
    setHiddenPillars(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const gridYValues = [1, 2, 3, 4, 5]

  return (
    <div className="bg-[#dcd5bc] border border-gold-light/25 p-5 mb-5">
      <div className="mb-4">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Wizualizacja
        </SmallCaps>
        <h3 className="font-heading text-dark text-lg mt-1">
          Trend filarów · {n} {n === 1 ? 'tydzień' : n < 5 ? 'tygodnie' : 'tygodni'}
        </h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PILLARS.map(p => {
          const hidden = hiddenPillars.has(p.id)
          return (
            <button
              key={p.id}
              onClick={() => togglePillar(p.id)}
              className="flex items-center gap-2 px-3 py-1.5 border transition-all"
              style={{
                borderColor: hidden ? '#C9BFB1' : p.color,
                background: hidden ? 'transparent' : `${p.color}0F`,
                opacity: hidden ? 0.5 : 1,
              }}
            >
              <span style={{ color: hidden ? '#9E9189' : p.color }}>
                <Diamond size={4} filled={!hidden} />
              </span>
              <SmallCaps tracking="luxury" size="xs">
                <span style={{ color: hidden ? '#9E9189' : p.color }}>{p.shortName}</span>
              </SmallCaps>
            </button>
          )
        })}
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ minWidth: 280, display: 'block' }}
          onMouseLeave={() => setTooltip(null)}
        >
          {gridYValues.map(v => (
            <g key={v}>
              <line
                x1={PAD_LEFT}
                x2={PAD_LEFT + CHART_W}
                y1={yPos(v)}
                y2={yPos(v)}
                stroke="#C9BFB1"
                strokeWidth={0.5}
                strokeDasharray="2 3"
              />
              <text
                x={PAD_LEFT - 6}
                y={yPos(v) + 4}
                textAnchor="end"
                fontSize={9}
                fill="#9E9189"
                fontFamily="Instrument Sans, sans-serif"
              >
                {v}
              </text>
            </g>
          ))}

          {sorted.map((r, idx) => (
            <text
              key={r.weekStart}
              x={xPos(idx, n)}
              y={SVG_HEIGHT - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#9E9189"
              fontFamily="Instrument Sans, sans-serif"
            >
              {formatWeekLabel(r.weekStart)}
            </text>
          ))}

          {PILLARS.map(pillar => {
            if (hiddenPillars.has(pillar.id)) return null
            const points = sorted.map((r, idx) => {
              const val = r.pillarsRated?.[pillar.id]
              if (val == null) return null
              return { x: xPos(idx, n), y: yPos(val), val, weekLabel: formatWeekLabel(r.weekStart), idx }
            })

            const segments: string[] = []
            let currentPath = ''
            for (let i = 0; i < points.length; i++) {
              const pt = points[i]
              if (!pt) {
                if (currentPath) { segments.push(currentPath); currentPath = '' }
                continue
              }
              if (!currentPath) currentPath = `M${pt.x},${pt.y}`
              else currentPath += ` L${pt.x},${pt.y}`
            }
            if (currentPath) segments.push(currentPath)

            return (
              <g key={pillar.id}>
                {segments.map((d, si) => (
                  <path
                    key={si}
                    d={d}
                    fill="none"
                    stroke={pillar.color}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {points.map((pt, i) => {
                  if (!pt) return null
                  return (
                    <g key={i}>
                      {/* Diamond marker — rotate 45 square */}
                      <rect
                        x={pt.x - 3.5}
                        y={pt.y - 3.5}
                        width={7}
                        height={7}
                        fill={pillar.color}
                        transform={`rotate(45 ${pt.x} ${pt.y})`}
                        stroke="#FAF8F4"
                        strokeWidth={1.2}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          const svg = (e.target as SVGElement).closest('svg')!
                          const rect = svg.getBoundingClientRect()
                          const scaleX = rect.width / SVG_WIDTH
                          const scaleY = rect.height / SVG_HEIGHT
                          setTooltip({
                            x: pt.x * scaleX,
                            y: pt.y * scaleY,
                            pillarId: pillar.id,
                            pillarName: pillar.name,
                            pillarColor: pillar.color,
                            value: pt.val,
                            weekLabel: pt.weekLabel,
                          })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

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
              {tooltip.weekLabel}
            </SmallCaps>
          </div>
        ) : (
          <p className="font-serif-body italic text-muted-light text-[12px]">
            najedź na punkt, aby zobaczyć ocenę
          </p>
        )}
      </div>
    </div>
  )
}
