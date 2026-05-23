'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useMagnetismHistory } from '@/hooks/useMagnetismHistory'
import { calcMagnetism, magnetismLabel, magnetismColor } from '@/lib/magnetism'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'

const DIMS = [
  { key: 'morning', label: 'Rutyna (ogółem)', max: 35 },
  { key: 'cialo',   label: 'Ciało / ruch',   max: 25 },
  { key: 'social',  label: 'Obecność',        max: 20 },
  { key: 'ghost',   label: 'Ghost Protocol',  max: 10 },
  { key: 'style',   label: 'Wygląd',          max: 10 },
] as const

function dayLabel(dateStr: string): string {
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

export default function MagnetismMeter() {
  const { todayLog, toggleSocialPresence, togglePhysicalActivity } = useGameData()
  const { history } = useMagnetismHistory(30)
  const [expanded, setExpanded] = useState(false)

  if (!todayLog) return null

  const score = calcMagnetism(todayLog)
  const color = magnetismColor(score.total)
  const label = magnetismLabel(score.total)

  const last7 = history.slice(-7)

  return (
    <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-4">
      {/* Hairline accent */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div className="px-5 pt-5 pb-5">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-baseline justify-between mb-4"
        >
          <div className="flex items-baseline gap-3">
            <h2 className="font-heading text-dark text-xl">Magnetyzm</h2>
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              {label}
            </SmallCaps>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none" style={{ color }}>
              {score.total}
            </span>
            <span className="font-serif-body italic text-muted-light text-sm">/ 100</span>
          </div>
        </button>

        {/* Main bar — hairline */}
        <div className="relative h-px w-full bg-hairline mb-1">
          <div
            className="absolute left-0 top-0 h-px transition-all duration-700"
            style={{ width: `${score.total}%`, backgroundColor: color }}
          />
          {score.total > 0 && score.total < 100 && (
            <div
              className="absolute leading-none transition-all duration-700"
              style={{
                left: `${score.total}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color,
              }}
            >
              <Diamond size={7} filled className="block" />
            </div>
          )}
        </div>

        {expanded && (
          <div className="animate-fade-in mt-6">
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

            {/* Weekly sparkline */}
            {last7.length > 1 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Diamond size={5} className="text-gold-deep" />
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    Ostatnie dni
                  </SmallCaps>
                </div>
                <div className="flex items-end gap-1.5 h-12">
                  {last7.map(day => {
                    const h = Math.max(4, Math.round((day.score.total / 100) * 48))
                    const isToday = day.date === todayLog.date
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full transition-all duration-500"
                          style={{
                            height: h,
                            backgroundColor: isToday ? color : magnetismColor(day.score.total) + '80',
                          }}
                          title={`${dayLabel(day.date)}: ${day.score.total}`}
                        />
                        <span className="font-ui uppercase tracking-wide text-[8.5px] text-muted-light leading-none">
                          {dayLabel(day.date)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {history.length >= 7 && <Report30 history={history} />}
          </div>
        )}

        {!expanded && last7.length > 1 && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-4 w-full flex items-center justify-between gap-3 group"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              Ostatnie 7 dni
            </SmallCaps>
            <div className="flex items-end gap-[3px] h-3 flex-1 mx-2 opacity-70 group-hover:opacity-100 transition-opacity">
              {last7.map(day => {
                const h = Math.max(2, Math.round((day.score.total / 100) * 12))
                const isToday = day.date === todayLog.date
                return (
                  <div
                    key={day.date}
                    className="flex-1"
                    style={{
                      height: h,
                      backgroundColor: isToday ? color : '#C9BFB1',
                    }}
                  />
                )
              })}
            </div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="group-hover:text-gold transition-colors">
              rozwiń ›
            </SmallCaps>
          </button>
        )}
      </div>
    </div>
  )
}
