'use client'

import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useMagnetismHistory } from '@/hooks/useMagnetismHistory'
import { calcMagnetism, magnetismLabel, magnetismColor } from '@/lib/magnetism'
import clsx from 'clsx'

const DIMS = [
  { key: 'morning', label: 'Rutyna (ogółem)', max: 35, icon: '🌅' },
  { key: 'cialo',   label: 'Ciało / ruch',   max: 25, icon: '⚡' },
  { key: 'social',  label: 'Obecność',        max: 20, icon: '🌐' },
  { key: 'ghost',   label: 'Ghost Protocol',  max: 10, icon: '🛡️' },
  { key: 'style',   label: 'Wygląd',          max: 10, icon: '✨' },
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
    <div className="mt-4 pt-4 border-t border-border">
      <p className="font-sans text-[11px] text-gold uppercase tracking-widest mb-3">
        Twoje najlepsze dni
      </p>
      {top3.map((day, i) => (
        <div key={day.date} className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-muted-light w-4">{i + 1}.</span>
            <span className="font-sans text-xs text-dark">
              {new Date(day.date + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${day.score.total}%`, backgroundColor: magnetismColor(day.score.total) }}
              />
            </div>
            <span className="font-sans text-xs font-medium text-dark w-6 text-right">{day.score.total}</span>
          </div>
        </div>
      ))}
      {patterns.length > 0 && (
        <p className="font-sans text-xs text-muted mt-3 leading-relaxed">
          Twoje szczyty łączyło: <span className="text-dark">{patterns.join(', ')}</span>.
          Średni magnetyzm: <span className="text-gold font-medium">{avg}/100</span>.
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

  // Last 7 days for sparkline
  const last7 = history.slice(-7)

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      {/* Color top bar matching score */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}40, ${color})` }} />

      <div className="px-5 pt-4 pb-5">
        {/* Header row */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <h2 className="font-serif text-dark text-base">Magnetyzm</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-muted-light">{label}</span>
            <span className="font-serif text-2xl font-medium" style={{ color }}>
              {score.total}
            </span>
          </div>
        </button>

        {/* Main bar */}
        <div className="h-2 bg-cream rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score.total}%`, backgroundColor: color }}
          />
        </div>

        {/* Expanded: dimensions breakdown + social toggle + history */}
        {expanded && (
          <div className="animate-fade-in">
            {/* Dimensions */}
            <div className="space-y-2 mb-4">
              {DIMS.map(dim => {
                const val = score[dim.key]
                const pct = Math.round((val / dim.max) * 100)
                const isActive = val > 0
                return (
                  <div key={dim.key} className="flex items-center gap-3">
                    <span className="text-sm w-5 flex-shrink-0 text-center opacity-70">{dim.icon}</span>
                    <span className="font-sans text-xs text-muted w-28 flex-shrink-0">{dim.label}</span>
                    <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isActive ? color : '#E5DDD3',
                        }}
                      />
                    </div>
                    <span className="font-sans text-[11px] text-muted-light w-10 text-right flex-shrink-0">
                      {val}/{dim.max}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Manual toggles */}
            <div className="space-y-2 mb-4">
              {[
                { flag: todayLog.physicalActivity, toggle: togglePhysicalActivity, icon: '⚡', label: 'Ćwiczyłam dziś' },
                { flag: todayLog.socialPresence,   toggle: toggleSocialPresence,   icon: '🌐', label: 'Byłam gdzieś / miałam kontakt z ludźmi' },
              ].map(({ flag, toggle, icon, label }) => (
                <button
                  key={label}
                  onClick={toggle}
                  className={clsx(
                    'w-full flex items-start justify-between px-4 py-2.5 rounded-xl border transition-all',
                    flag ? 'bg-gold-pale border-gold/20' : 'bg-cream/50 border-transparent hover:border-border'
                  )}
                >
                  <div className="flex items-start gap-2 text-left">
                    <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
                    <span className="font-sans text-sm text-dark">{label}</span>
                  </div>
                  <div className={clsx(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ml-2 transition-all',
                    flag ? 'bg-gold border-gold' : 'border-border'
                  )} />
                </button>
              ))}
            </div>

            {/* Weekly sparkline */}
            {last7.length > 1 && (
              <div>
                <p className="font-sans text-[11px] text-muted uppercase tracking-widest mb-2">
                  Ostatnie dni
                </p>
                <div className="flex items-end gap-1.5 h-10">
                  {last7.map(day => {
                    const h = Math.max(4, Math.round((day.score.total / 100) * 40))
                    const isToday = day.date === todayLog.date
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-sm transition-all duration-500"
                          style={{
                            height: h,
                            backgroundColor: isToday ? color : magnetismColor(day.score.total) + '80',
                          }}
                          title={`${dayLabel(day.date)}: ${day.score.total}`}
                        />
                        <span className="font-sans text-[9px] text-muted-light leading-none">
                          {dayLabel(day.date)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 30-day report */}
            {history.length >= 7 && <Report30 history={history} />}
          </div>
        )}

        {/* Collapse hint */}
        {!expanded && last7.length > 1 && (
          <div className="flex items-end gap-1 h-5 cursor-pointer" onClick={() => setExpanded(true)}>
            {last7.map(day => {
              const h = Math.max(2, Math.round((day.score.total / 100) * 20))
              const isToday = day.date === todayLog.date
              return (
                <div
                  key={day.date}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: h,
                    backgroundColor: isToday ? color : magnetismColor(day.score.total) + '60',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
