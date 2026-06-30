'use client'
import { useMemo, useState } from 'react'
import type { DailyLog } from '@/types'
import { dateKey, PROJECT_START, PROJECT_END, getEffectiveNow } from '@/lib/gameLogic'
import { SmallCaps } from '@/components/ui'

interface Props {
  logs: Record<string, DailyLog>
}

// Heatmap intensity scale (MNIEJ → WIĘCEJ) — 1:1 with the design tokens --h0…--h4.
const HEAT = ['#e9e0c8', '#d6bd84', '#bd9c56', '#94793b', '#5a4b22']
const PAPER_SOFT = '#f8f3e6' // ring inner gap, matches design --paper-soft

function levelForXp(xp: number): number {
  if (xp <= 0) return 0
  if (xp <= 50) return 1
  if (xp <= 150) return 2
  if (xp <= 300) return 3
  return 4
}

const PL_MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
const PL_DAYS = ['pon', '', 'śr', '', 'pt', '', '']

// Find the Monday on or before the given date (ISO week start).
function mondayOnOrBefore(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // 0=Mon..6=Sun
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - day)
  return m
}

// Find the Sunday on or after the given date.
function sundayOnOrAfter(d: Date): Date {
  const day = (d.getDay() + 6) % 7
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() + (6 - day))
  return m
}

export default function YearHeatmap({ logs }: Props) {
  const [tip, setTip] = useState<{ x: number; y: number; date: string; xp: number } | null>(null)

  const { weeks, monthLabels, bestDate, activeDays, projectDays } = useMemo(() => {
    const gridStart = mondayOnOrBefore(PROJECT_START)
    const gridEnd = sundayOnOrAfter(PROJECT_END)
    const weeks: Array<Array<Date>> = []
    const cur = new Date(gridStart)
    while (cur <= gridEnd) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur))
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push(week)
    }

    // Month label = mid-week (Thursday) lands in a new month.
    const monthLabels: Array<{ colIndex: number; label: string }> = []
    let lastMonth = -1
    weeks.forEach((week, idx) => {
      const mid = week[3]
      if (mid.getMonth() !== lastMonth) {
        monthLabels.push({ colIndex: idx, label: PL_MONTHS[mid.getMonth()] })
        lastMonth = mid.getMonth()
      }
    })

    // Best (highest-XP) day — gets the gold ring marker.
    let bestDate: string | null = null
    let bestXp = 0
    let activeDays = 0
    for (const [k, log] of Object.entries(logs)) {
      const xp = log.totalXP ?? 0
      if (xp > 0) activeDays += 1
      if (xp > bestXp) {
        bestXp = xp
        bestDate = k
      }
    }

    // Full project length in days (inclusive).
    const projectDays = Math.round((PROJECT_END.getTime() - PROJECT_START.getTime()) / 86400000) + 1

    return { weeks, monthLabels, bestDate, activeDays, projectDays }
  }, [logs])

  const todayStr = dateKey(getEffectiveNow())
  const projectStartStr = dateKey(PROJECT_START)
  const projectEndStr = dateKey(PROJECT_END)

  const formatTipDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const s = date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <div className="w-full">
      {/* Month labels */}
      <div className="flex pl-7 mb-1.5">
        <div className="flex gap-[2px]">
          {weeks.map((_, idx) => {
            const label = monthLabels.find(m => m.colIndex === idx)?.label
            return (
              <div key={idx} className="w-[13px] sm:w-[14px] text-left">
                {label && (
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    {label}
                  </SmallCaps>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex">
        {/* Day-of-week labels column */}
        <div className="flex flex-col gap-[2px] pr-1.5 pt-[1px]">
          {PL_DAYS.map((d, i) => (
            <div key={i} className="h-[13px] sm:h-[14px] leading-[13px] sm:leading-[14px] w-5 text-right">
              {d && (
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  {d}
                </SmallCaps>
              )}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[2px]">
              {week.map((d, dIdx) => {
                const key = dateKey(d)
                const inProject = key >= projectStartStr && key <= projectEndStr
                const isFuture = key > todayStr
                const isToday = key === todayStr
                const isBest = key === bestDate
                const log = logs[key]
                const xp = log?.totalXP ?? 0

                if (!inProject) {
                  return (
                    <div
                      key={dIdx}
                      className="w-[13px] h-[13px] sm:w-[14px] sm:h-[14px]"
                      style={{ visibility: 'hidden' }}
                    />
                  )
                }

                // Ring (box-shadow) priority: today (rust) > best (gold).
                // Normal cells leave boxShadow unset so the Tailwind hover ring can apply.
                let boxShadow: string | undefined
                if (isToday) boxShadow = `0 0 0 1px ${PAPER_SOFT}, 0 0 0 2px #8a3a2c`
                else if (isBest) boxShadow = `0 0 0 1px ${PAPER_SOFT}, 0 0 0 2px #b29355`

                return (
                  <div
                    key={dIdx}
                    onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, date: key, xp })}
                    onMouseMove={e => setTip(t => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                    onMouseLeave={() => setTip(null)}
                    className="relative w-[13px] h-[13px] sm:w-[14px] sm:h-[14px] cursor-pointer transition-shadow hover:z-10 hover:shadow-[0_0_0_1px_#f8f3e6,0_0_0_2px_#8e7338]"
                    style={{
                      backgroundColor: isFuture ? 'transparent' : HEAT[levelForXp(xp)],
                      border: isFuture ? '1px dashed #d9cda8' : 'none',
                      boxShadow,
                      boxSizing: 'border-box',
                    }}
                    aria-label={`${key}: ${xp} XP`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: legend + tally */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-border">
        <div className="flex items-center gap-2">
          <SmallCaps tone="muted" tracking="luxury" size="xs">Mniej</SmallCaps>
          {HEAT.map((c, i) => (
            <div key={i} className="w-[13px] h-[13px]" style={{ backgroundColor: c }} />
          ))}
          <SmallCaps tone="muted" tracking="luxury" size="xs">Więcej</SmallCaps>
        </div>
        <p className="font-serif-body italic text-muted text-[13px] whitespace-nowrap">
          <b className="font-display not-italic text-gold-deep text-[15px] px-0.5">{activeDays}</b>{' '}
          dni zalogowanych z{' '}
          <b className="font-display not-italic text-gold-deep text-[15px] px-0.5">{projectDays}</b>
        </p>
      </div>

      {/* Floating tooltip */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none bg-dark border border-gold px-3 py-2"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 12px))' }}
        >
          <div className="font-serif-body italic text-[13px] text-gold-pale whitespace-nowrap">
            {formatTipDate(tip.date)}
          </div>
          <div className="font-display text-[14px] text-gold-light mt-0.5">
            {tip.xp.toLocaleString('pl-PL')} XP
          </div>
        </div>
      )}
    </div>
  )
}
