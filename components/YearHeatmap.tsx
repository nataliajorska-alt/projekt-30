'use client'
import { useMemo, useState } from 'react'
import type { DailyLog } from '@/types'
import { dateKey, PROJECT_START, PROJECT_END } from '@/lib/gameLogic'
import { SmallCaps, Diamond } from '@/components/ui'

interface Props {
  logs: Record<string, DailyLog>
}

// XP thresholds → background colour. Matches the old-money ivory/gold palette.
function colorForXp(xp: number): string {
  if (xp <= 0) return '#F0EBE3'            // cream
  if (xp <= 50) return '#F5EDD8'           // gold-pale
  if (xp <= 150) return '#D4AF6B'          // gold-light
  if (xp <= 300) return '#B8963E'          // gold
  return '#8B6914'                          // gold-dark
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
  const [hovered, setHovered] = useState<{ date: string; xp: number; log?: DailyLog } | null>(null)

  const { weeks, monthLabels } = useMemo(() => {
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

    // Month label = first week column where the Monday (week[0]) is in a new month,
    // using the month that the majority of the week belongs to (mid-week = Thursday, index 3).
    const monthLabels: Array<{ colIndex: number; label: string }> = []
    let lastMonth = -1
    weeks.forEach((week, idx) => {
      const mid = week[3]
      if (mid.getMonth() !== lastMonth) {
        monthLabels.push({ colIndex: idx, label: PL_MONTHS[mid.getMonth()] })
        lastMonth = mid.getMonth()
      }
    })

    return { weeks, monthLabels }
  }, [])

  const todayStr = dateKey(new Date())
  const projectStartStr = dateKey(PROJECT_START)
  const projectEndStr = dateKey(PROJECT_END)

  const formatDatePL = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

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
                const log = logs[key]
                const xp = log?.totalXP ?? 0

                let bg = colorForXp(xp)
                let opacity = 1
                if (!inProject) {
                  bg = 'transparent'
                  opacity = 0
                } else if (isFuture) {
                  bg = '#FAF8F4'
                  opacity = 0.5
                }

                return (
                  <div
                    key={dIdx}
                    onMouseEnter={() => inProject && setHovered({ date: key, xp, log })}
                    onMouseLeave={() => setHovered(null)}
                    className="w-[13px] h-[13px] sm:w-[14px] sm:h-[14px] transition-transform hover:scale-125"
                    style={{
                      backgroundColor: bg,
                      opacity,
                      border: isToday
                        ? '1.5px solid #B8963E'
                        : inProject && isFuture
                          ? '1px dashed #C9BFB1'
                          : 'none',
                      boxSizing: 'border-box',
                      visibility: inProject ? 'visible' : 'hidden',
                    }}
                    aria-label={inProject ? `${key}: ${xp} XP` : undefined}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip area */}
      <div className="mt-4 min-h-[32px]">
        {hovered && (
          <div className="inline-flex items-center gap-3 bg-ivory border border-gold-light/40 px-3 py-1.5">
            <Diamond size={4} className="text-gold" />
            <SmallCaps tone="dark" tracking="luxury" size="xs">
              {formatDatePL(new Date(hovered.date))}
            </SmallCaps>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              {hovered.xp} XP
            </SmallCaps>
            {hovered.log && (
              <SmallCaps tone="muted" size="xs">
                {(hovered.log.completedRoutine?.length ?? 0)
                  + (hovered.log.completedDailyQuests?.length ?? 0)
                  + (hovered.log.completedSideQuests?.length ?? 0)} akcji
              </SmallCaps>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4">
        <SmallCaps tone="muted" tracking="luxury" size="xs">Mniej</SmallCaps>
        {[0, 30, 100, 200, 400].map((v, i) => (
          <div
            key={i}
            className="w-[13px] h-[13px] border border-hairline/30"
            style={{ backgroundColor: colorForXp(v) }}
          />
        ))}
        <SmallCaps tone="muted" tracking="luxury" size="xs">Więcej</SmallCaps>
      </div>
    </div>
  )
}
