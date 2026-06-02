'use client'
import { useMemo, useState } from 'react'
import type { DailyLog } from '@/types'
import { getISOWeekKey, PROJECT_START, PROJECT_END } from '@/lib/gameLogic'
import { aggregateXpByWeek } from '@/lib/analytics'
import { SmallCaps } from '@/components/ui'

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
  const lastKey = getISOWeekKey(end)
  if (!seen.has(lastKey)) out.push(lastKey)
  return out
}

export default function WeeklyXPChart({ logs }: Props) {
  const [tip, setTip] = useState<{ x: number; y: number; idx: number } | null>(null)

  const data = useMemo(() => {
    const agg = aggregateXpByWeek(logs)
    const allWeeks = getAllWeekKeysInRange(PROJECT_START, PROJECT_END)
    const rows = allWeeks.map(k => ({
      weekKey: k,
      totalXP: agg[k]?.totalXP ?? 0,
      activeDays: agg[k]?.activeDays ?? 0,
    }))
    const max = Math.max(1, ...rows.map(r => r.totalXP))
    const logged = rows.filter(r => r.totalXP > 0)
    const avg = logged.length
      ? Math.round(logged.reduce((s, r) => s + r.totalXP, 0) / logged.length)
      : 0
    let peakIdx = -1
    let peakVal = 0
    rows.forEach((r, i) => {
      if (r.totalXP > peakVal) {
        peakVal = r.totalXP
        peakIdx = i
      }
    })
    return { rows, max, avg, peakIdx, currentWeek: getISOWeekKey(new Date()) }
  }, [logs])

  const chartHeight = 180

  return (
    <div className="w-full">
      <div
        className="relative flex items-end gap-[3px] border-b border-hairline"
        style={{ height: chartHeight + 4 }}
      >
        {/* Average line */}
        {data.avg > 0 && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ bottom: `${(data.avg / data.max) * chartHeight}px`, borderTop: '1px dashed #c9b27f' }}
          >
            <span className="absolute right-0 -top-4 bg-ivory px-1 font-ui text-[8px] tracking-[0.22em] uppercase text-gold-deep">
              śr. {data.avg.toLocaleString('pl-PL')} XP
            </span>
          </div>
        )}

        {data.rows.map((row, idx) => {
          const h = Math.max(2, Math.round((row.totalXP / data.max) * chartHeight))
          const isCurrent = row.weekKey === data.currentWeek
          const isFuture = row.totalXP === 0
          const isPeak = idx === data.peakIdx
          return (
            <div
              key={row.weekKey}
              onMouseEnter={e => !isFuture && setTip({ x: e.clientX, y: e.clientY, idx })}
              onMouseMove={e => setTip(t => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
              onMouseLeave={() => setTip(null)}
              className="relative flex-1 min-w-[5px] h-full flex flex-col justify-end items-center cursor-default"
            >
              {isPeak && row.totalXP > 0 && (
                <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 font-display italic text-[12px] text-gold-deep whitespace-nowrap">
                  {row.totalXP.toLocaleString('pl-PL')} XP
                </span>
              )}
              <div
                className="w-full transition-all"
                style={{
                  height: `${h}px`,
                  backgroundColor: isCurrent ? '#b29355' : isFuture ? 'transparent' : '#b7a787',
                  borderTop: isFuture ? '1px dashed #d9cda8' : 'none',
                  opacity: isFuture ? 1 : isCurrent ? 1 : 0.55,
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between mt-3">
        {['kwi MMXXVI', 'lip', 'paź', 'sty MMXXVII', 'kwi'].map(m => (
          <SmallCaps key={m} tone="muted" size="xs">{m}</SmallCaps>
        ))}
      </div>

      {/* Floating tooltip */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none bg-dark border border-gold px-3 py-2"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 12px))' }}
        >
          <div className="font-serif-body italic text-[13px] text-gold-pale whitespace-nowrap">
            Tydzień {data.rows[tip.idx].weekKey.split('-W')[1]} · {data.rows[tip.idx].activeDays} dni
          </div>
          <div className="font-display text-[14px] text-gold-light mt-0.5">
            {data.rows[tip.idx].totalXP.toLocaleString('pl-PL')} XP
          </div>
        </div>
      )}
    </div>
  )
}
