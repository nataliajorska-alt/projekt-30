'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTimelineData } from '@/hooks/useTimelineData'
import { dateKey } from '@/lib/gameLogic'
import { Fleuron, SmallCaps } from '@/components/ui'

const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']

interface Pattern {
  short: string
  detail: string
}

function computePattern(logs: Record<string, { totalXP?: number }>): Pattern | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeDays: { date: Date; xp: number; weekday: number }[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const xp = logs[dateKey(d)]?.totalXP ?? 0
    if (xp > 0) activeDays.push({ date: d, xp, weekday: d.getDay() })
  }

  if (activeDays.length < 7) return null

  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of activeDays) {
    sums[d.weekday] += d.xp
    counts[d.weekday]++
  }
  const avgs = sums.map((s, i) => (counts[i] >= 2 ? s / counts[i] : 0))
  const bestIdx = avgs.indexOf(Math.max(...avgs))
  const bestAvg = Math.round(avgs[bestIdx])

  return {
    short: `Najlepszy dzień · ${WEEKDAYS[bestIdx]}`,
    detail: `śr. ${bestAvg} XP · 28 dni`,
  }
}

export default function PatternOfTheWeek() {
  const { logs, loading } = useTimelineData()
  const pattern = useMemo(() => computePattern(logs), [logs])

  if (loading || !pattern) return null

  return (
    <Link
      href="/timeline?tab=patterns"
      className="flex items-center gap-2.5 border border-border/70 hover:border-gold px-3 py-2 transition-colors"
    >
      <span className="flex-shrink-0 w-[26px] h-[26px] bg-cream flex items-center justify-center">
        <Fleuron size={10} className="text-gold" />
      </span>
      <span className="flex-1 min-w-0 leading-tight">
        <span className="block font-ui uppercase tracking-[0.3em] text-[8px] text-gold-deep">
          Wzorzec
        </span>
        <span className="block font-display text-dark text-[13px] font-medium mt-0.5 truncate">
          {pattern.short}
          <span className="ml-1.5 font-serif-body italic text-muted text-[11px]">
            {pattern.detail}
          </span>
        </span>
      </span>
    </Link>
  )
}
