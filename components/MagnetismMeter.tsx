'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useMagnetismHistory } from '@/hooks/useMagnetismHistory'
import { calcMagnetism, magnetismLabel, magnetismColor } from '@/lib/magnetism'
import { SmallCaps, Diamond } from '@/components/ui'

const DIMS = [
  { key: 'morning', label: 'Rutyna (ogółem)', max: 35 },
  { key: 'cialo',   label: 'Ciało / ruch',   max: 25 },
  { key: 'social',  label: 'Obecność',        max: 20 },
  { key: 'ghost',   label: 'Ghost Protocol',  max: 10 },
  { key: 'style',   label: 'Wygląd',          max: 10 },
] as const

function dayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { weekday: 'short' })
}

function Report30({ history }: { history: ReturnType<typeof useMagnetismHistory>['history'] }) {
  if (history.length < 7) return null

  const sorted = [...history].sort((a, b) => b.score.total - a.score.total)
  const top3 = sorted.slice(0, 3)
  const avg = Math.round(history.reduce((s, d) => s + d.score.total, 0) / history.length)

  const peakDims = top3[0]?.score
  const patterns: string[] = []
  if (peakDims) {
    if (peakDims.morning >= 28) patterns.push('pełna poranna rutyna')
    if (peakDims.cialo >= 25)   patterns.push('aktywność fizyczna')
    if (peakDims.social >= 20)  patterns.push('kontakt z ludźmi')
    if (peakDims.ghost >= 10)   patterns.push('Ghost Protocol')
    if (peakDims.style >= 10)   patterns.push('zadbany wygląd')
  }

  return (
    <div className="mt-5 pt-5 border-t border-hairline">
      <div className="flex items-center gap-2 mb-3">
        <Diamond size={5} className="text-gold" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Twoje najlepsze dni
        </SmallCaps>
      </div>
      <div className="space-y-2">
        {top3.map((day, i) => (
          <div key={day.date} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="font-display text-xs w-5 text-muted-light"
                style={{ color: i === 0 ? '#B8963E' : undefined }}
              >
                {['I', 'II', 'III'][i]}
              </span>
              <span className="font-serif-body italic text-dark text-[13px]">
                {new Date(day.date + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-px bg-hairline relative">
                <div
                  className="absolute left-0 top-0 h-px"
                  style={{ width: `${day.score.total}%`, backgroundColor: magnetismColor(day.score.total) }}
                />
              </div>
              <span className="font-display text-sm text-dark w-7 text-right">
                {day.score.total}
              </span>
            </div>
          </div>
        ))}
      </div>
      {patterns.length > 0 && (
        <p className="font-serif-body italic text-muted text-[12.5px] mt-4 leading-relaxed">
          twoje szczyty łączyło: <span className="text-dark not-italic">{patterns.join(', ')}</span>.
          średni magnetyzm:{' '}
          <span className="font-display text-gold not-italic">{avg}</span>
          <span className="text-muted-light"> / 100</span>.
        </p>
      )}
    </div>
  )
}

/* ── Sparkline SVG built from last 7 days ─────────────────────────── */
function Sparkline({
  history,
  color,
  deepColor,
}: {
  history: { date: string; score: { total: number } }[]
  color: string
  deepColor: string
}) {
  // Always render 7 slots; pad with zeros at the start if fewer days
  const filled = [...Array(Math.max(0, 7 - history.length)).fill(null), ...history].slice(-7)
  const W = 280
  const H = 64
  const baseY = H - 6 // baseline a bit above bottom edge

  // y at given value (0..100): 18 (top) → baseY (bottom). Higher value → lower y.
  const yAt = (v: number) => baseY - (Math.min(100, Math.max(0, v)) / 100) * (baseY - 18)
  const xAt = (i: number) => (i / 6) * W

  const points = filled.map((d, i) => ({
    x: xAt(i),
    y: d ? yAt(d.score.total) : baseY, // missing day = baseline
    has: !!d,
  }))

  const lineD = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ')
  const fillD = `${lineD} L ${W},${H} L 0,${H} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-12"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="magn-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#e5dcc1" strokeWidth="1" />
      <path d={fillD} fill="url(#magn-spark-fill)" />
      <path d={lineD} fill="none" stroke={color} strokeWidth="1.5" />
      {points.map((p, i) =>
        p.has ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3 : 2}
            fill={i === points.length - 1 ? deepColor : color}
          />
        ) : null,
      )}
    </svg>
  )
}

export default function MagnetismMeter() {
  const { todayLog, toggleSocialPresence, togglePhysicalActivity } = useGameData()
  const { history } = useMagnetismHistory(30)
  const [expanded, setExpanded] = useState(false)

  if (!todayLog) return null

  const score = calcMagnetism(todayLog)
  const color = magnetismColor(score.total)
  const label = magnetismLabel(score.total)

  const last7 = history.slice(-7)
  const last7Labels = last7.map(d => dayShort(d.date))

  return (
    <div className="border-t border-b border-hairline px-1 py-4 sm:py-5 flex flex-col">
      {/* Top row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex justify-between items-baseline mb-3.5 min-h-[38px]"
      >
        <h3 className="font-display text-dark text-2xl sm:text-[26px] leading-none tracking-tight">
          Magnetyzm{' '}
          <span className="font-serif-body italic text-muted text-[13px] ml-2.5 font-normal align-baseline">
            {label}
          </span>
        </h3>
        <span
          className="font-display italic text-[28px] sm:text-[32px] leading-none"
          style={{ color }}
        >
          {score.total}
          <span className="font-ui not-italic text-base text-muted-light tracking-[0.2em] ml-1.5">
            / 100
          </span>
        </span>
      </button>

      {/* Collapsed: editorial sparkline */}
      {!expanded && (
        <div className="mt-auto">
          <div className="flex justify-between items-center font-ui uppercase tracking-luxury text-[10px] text-muted mb-1">
            <span>Ostatnie 7 dni</span>
            <button
              onClick={() => setExpanded(true)}
              className="font-serif-body italic text-gold-deep text-[13px] normal-case tracking-normal hover:text-gold transition-colors"
            >
              Rozwiń ›
            </button>
          </div>
          {last7.length > 1 ? (
            <Sparkline
              history={last7}
              color={color}
              deepColor="#8A3A2C"
            />
          ) : (
            <div className="h-12 flex items-center font-serif-body italic text-muted-light text-[12.5px]">
              jeszcze za mało danych, ale to się zbiera.
            </div>
          )}
          <div className="grid grid-cols-7 mt-1 font-ui uppercase tracking-[0.2em] text-[9px] text-muted-light text-center">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i}>
                {last7Labels[i] ?? ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded view */}
      {expanded && (
        <div className="animate-fade-in">
          {/* Main bar — hairline */}
          <div className="relative h-px w-full bg-hairline mb-4 mt-2">
            <div
              className="absolute left-0 -top-px h-[3px] transition-all duration-700"
              style={{ width: `${score.total}%`, backgroundColor: color }}
            />
            {score.total > 0 && score.total < 100 && (
              <span
                className="absolute top-1/2 w-[6px] h-[6px] rotate-45 transition-all duration-700"
                style={{
                  left: `${score.total}%`,
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  backgroundColor: color,
                }}
              />
            )}
          </div>

          {/* Dimensions */}
          <div className="space-y-2.5 mb-5">
            {DIMS.map(dim => {
              const val = score[dim.key]
              const pct = Math.round((val / dim.max) * 100)
              const isActive = val > 0
              return (
                <div key={dim.key} className="flex items-center gap-3">
                  <span className="font-serif-body italic text-muted text-[13px] w-32 flex-shrink-0">
                    {dim.label}
                  </span>
                  <div className="flex-1 h-px bg-hairline relative">
                    <div
                      className="absolute left-0 top-0 h-px transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isActive ? color : '#C9BFB1',
                      }}
                    />
                  </div>
                  <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-12 text-right shrink-0">
                    {val} / {dim.max}
                  </SmallCaps>
                </div>
              )
            })}
          </div>

          {/* Manual toggles */}
          <div className="space-y-2 mb-5">
            {[
              { flag: todayLog.physicalActivity, toggle: togglePhysicalActivity, label: 'Ćwiczyłam dziś' },
              { flag: todayLog.socialPresence,   toggle: toggleSocialPresence,   label: 'Byłam gdzieś / miałam kontakt z ludźmi' },
            ].map(({ flag, toggle, label }) => (
              <button
                key={label}
                onClick={toggle}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 border transition-all',
                  flag
                    ? 'bg-gold-pale/40 border-gold'
                    : 'bg-cream/30 border-hairline hover:border-gold-light'
                )}
              >
                <Diamond
                  size={9}
                  filled={flag}
                  className={flag ? 'text-gold' : 'text-hairline'}
                />
                <span
                  className={clsx(
                    'font-serif-body text-[14px] flex-1 text-left',
                    flag ? 'text-dark italic' : 'text-dark'
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Sparkline inline (also in collapsed but shown here for context) */}
          {last7.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Diamond size={5} className="text-gold-deep" />
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  Ostatnie dni
                </SmallCaps>
              </div>
              <Sparkline history={last7} color={color} deepColor="#8A3A2C" />
              <div className="grid grid-cols-7 mt-1 font-ui uppercase tracking-[0.2em] text-[9px] text-muted-light text-center">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i}>{last7Labels[i] ?? ''}</span>
                ))}
              </div>
            </div>
          )}

          {history.length >= 7 && <Report30 history={history} />}

          <button
            onClick={() => setExpanded(false)}
            className="mt-4 w-full text-center font-serif-body italic text-muted hover:text-dark transition-colors text-[13px]"
          >
            Zwiń ‹
          </button>
        </div>
      )}
    </div>
  )
}
