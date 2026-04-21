'use client'
import Link from 'next/link'
import { useCycleData } from '@/hooks/useCycleData'
import { getPhaseForDate } from '@/lib/cycle-data'
import { useMemo } from 'react'

export default function CyclePhaseWidget() {
  const { logs, loading } = useCycleData()

  const today = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  if (loading || logs.length === 0) return null

  const current = getPhaseForDate(logs[0].startDate, today)
  if (!current) return null

  const { phase, cycleDay } = current

  return (
    <Link href="/cycle">
      <div
        className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 border transition-opacity hover:opacity-90"
        style={{ backgroundColor: phase.bgColor, borderColor: `${phase.color}25` }}
      >
        <span className="text-xl">{phase.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] uppercase tracking-widest mb-0.5" style={{ color: phase.color }}>
            Rytm kobiecy · Dzień {cycleDay}
          </p>
          <p className="font-serif text-dark text-sm">{phase.name}</p>
        </div>
        <p className="font-sans text-[10px] text-muted-light flex-shrink-0">{phase.energy}</p>
      </div>
    </Link>
  )
}
