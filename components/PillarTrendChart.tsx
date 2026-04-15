'use client'
import { useState } from 'react'
import { PILLARS } from '@/lib/pillars'
import type { WeeklyReview, Pillar } from '@/types'

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
  pillarIcon: string
  pillarColor: string
  value: number
  weekLabel: string
}

export default function PillarTrendChart({ reviews }: Props) {
  const [hiddenPillars, setHiddenPillars] = useState<Set<Pillar>>(new Set())
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Reviews come in newest-first; chart should go left=oldest, right=newest
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
    <div
      className="rounded-2xl border p-5 mb-5"
      style={{ background: '#FAF8F4', borderColor: 'rgba(184,150,62,0.2)' }}
    >
      <div className="mb-4">
        <p className="font-sans text-[10px] uppercase tracking-widest text-muted mb-0.5">Wizualizacja</p>
        <h3 className="font-serif text-dark text-base">Trend filarów — {n} {n === 1 ? 'tydzień' : n < 5 ? 'tygodnie' : 'tygodni'}</h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PILLARS.map(p => {
          const hidden = hiddenPillars.has(p.id)
          return (
            <button
              key={p.id}
              onClick={() => togglePillar(p.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-[11px] transition-all border"
              style={{
                borderColor: hidden ? 'rgba(0,0,0,0.08)' : p.color,
                background: hidden ? 'transparent' : p.bgColor,
                color: hidden ? '#9E9189' : p.color,
                opacity: hidden ? 0.5 : 1,
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: hidden ? '#CCC' : p.color }}
              />
              {p.shortName}
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
          {/* Horizontal gridlines */}
          {gridYValues.map(v => (
            <g key={v}>
              <line
                x1={PAD_LEFT}
                x2={PAD_LEFT + CHART_W}
                y1={yPos(v)}
                y2={yPos(v)}
                stroke="rgba(184,150,62,0.12)"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 6}
                y={yPos(v) + 4}
                textAnchor="end"
                fontSize={9}
                fill="#9E9189"
                fontFamily="DM Sans, sans-serif"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {sorted.map((r, idx) => (
            <text
              key={r.weekStart}
              x={xPos(idx, n)}
              y={SVG_HEIGHT - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#9E9189"
              fontFamily="DM Sans, sans-serif"
            >
              {formatWeekLabel(r.weekStart)}
            </text>
          ))}

          {/* Lines per pillar */}
          {PILLARS.map(pillar => {
            if (hiddenPillars.has(pillar.id)) return null
            const points = sorted.map((r, idx) => {
              const val = r.pillarsRated?.[pillar.id]
              if (val == null) return null
              return { x: xPos(idx, n), y: yPos(val), val, weekLabel: formatWeekLabel(r.weekStart), idx }
            })

            // Build path with gaps for missing data
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
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {points.map((pt, i) => {
                  if (!pt) return null
                  return (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={pillar.color}
                      stroke="#FAF8F4"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const svg = (e.target as SVGElement).closest('svg')!
                        const rect = svg.getBoundingClientRect()
                        const svgW = rect.width
                        const scaleX = svgW / SVG_WIDTH
                        const scaleY = rect.height / SVG_HEIGHT
                        setTooltip({
                          x: pt.x * scaleX,
                          y: pt.y * scaleY,
                          pillarId: pillar.id,
                          pillarName: pillar.name,
                          pillarIcon: pillar.icon,
                          pillarColor: pillar.color,
                          value: pt.val,
                          weekLabel: pt.weekLabel,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
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
          <div
            className="inline-flex items-center gap-2 bg-white rounded-xl border px-3 py-1.5 shadow-elegant text-xs font-sans"
            style={{ borderColor: 'rgba(184,150,62,0.25)' }}
          >
            <span>{tooltip.pillarIcon}</span>
            <span className="text-dark font-medium">{tooltip.pillarName}</span>
            <span
              className="font-serif font-medium text-sm"
              style={{ color: tooltip.pillarColor }}
            >
              {tooltip.value}/5
            </span>
            <span className="text-muted-light">{tooltip.weekLabel}</span>
          </div>
        ) : (
          <p className="text-[11px] font-sans text-muted-light">Najedź na punkt, aby zobaczyć ocenę</p>
        )}
      </div>
    </div>
  )
}
