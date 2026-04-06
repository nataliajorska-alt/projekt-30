'use client'
import { useMemo, useState } from 'react'
import type { DailyLog } from '@/types'
import { getISOWeekKey, PROJECT_START, PROJECT_END } from '@/lib/gameLogic'
import { aggregateXpByWeek } from '@/lib/analytics'

interface Props {
  logs: Record<string, DailyLog>
}

function getAllWeekKeysInRange(start: Date, end: Date): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const cur = new Date(start)
  while (cur <= end) {
    const k = getISOWeekKey(cur)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
    cur.setDate(cur.getDate() + 7)
  }
  // ensure the last week (if partial) is included
  const lastKey = getISOWeekKey(end)
  if (!seen.has(lastKey)) out.push(lastKey)
  return out
}

export default function WeeklyXPChart({ logs }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const data = useMemo(() => {
    const agg = aggregateXpByWeek(logs)
    const allWeeks = getAllWeekKeysInRange(PROJECT_START, PROJECT_END)
    const rows = allWeeks.map(k => ({
      weekKey: k,
      totalXP: agg[k]?.totalXP ?? 0,
      activeDays: agg[k]?.activeDays ?? 0,
    }))
    const max = Math.max(1, ...rows.map(r => r.totalXP))
    return { rows, max, currentWeek: getISOWeekKey(new Date()) }
  }, [logs])

  const chartHeight = 120

  return (
    <div className="w-full">
      <div className="flex items-end gap-[3px] border-b border-border pb-1" style={{ height: chartHeight + 4 }}>
        {data.rows.map((row, idx) => {
          const h = Math.max(2, Math.round((row.totalXP / data.max) * chartHeight))
          const isCurrent = row.weekKey === data.currentWeek
          const isHovered = idx === hoveredIdx
          return (
            <div
              key={row.weekKey}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 min-w-[5px] rounded-t-sm transition-all cursor-default"
              style={{
                height: `${h}px`,
                backgroundColor: isCurrent ? '#B8963E' : isHovered ? '#D4AF6B' : '#E5DDD3',
                opacity: row.totalXP === 0 ? 0.6 : 1,
              }}
              aria-label={`${row.weekKey}: ${row.totalXP} XP`}
            />
          )
        })}
      </div>

      <div className="flex justify-between mt-2 text-[10px] font-sans text-muted-light">
        <span>kwi &apos;26</span>
        <span>lip</span>
        <span>paź</span>
        <span>sty &apos;27</span>
        <span>kwi</span>
      </div>

      <div className="mt-3 min-h-[28px]">
        {hoveredIdx !== null && (
          <div className="inline-flex items-center gap-3 bg-white rounded-lg border border-border px-3 py-1.5 shadow-elegant text-xs font-sans">
            <span className="text-dark font-medium">Tydzień {data.rows[hoveredIdx].weekKey.split('-W')[1]}</span>
            <span className="text-gold-dark">{data.rows[hoveredIdx].totalXP.toLocaleString('pl-PL')} XP</span>
            <span className="text-muted-light">{data.rows[hoveredIdx].activeDays} dni</span>
          </div>
        )}
      </div>
    </div>
  )
}
