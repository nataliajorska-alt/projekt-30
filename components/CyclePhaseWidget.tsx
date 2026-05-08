'use client'
import Link from 'next/link'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { getPhaseForDate } from '@/lib/cycle-data'
import { useMemo } from 'react'

export default function CyclePhaseWidget() {
  const { logs, loading } = useCycleData()
  const { settings, loading: settingsLoading } = useCycleSettings()

  const today = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  if (loading || settingsLoading || logs.length === 0) return null

  const current = getPhaseForDate(logs[0].startDate, today, settings)
  if (!current) return null

  const { phase, cycleDay } = current

  return (
    <Link
      href="/cycle"
      className="block rounded-2xl px-3 py-3 border transition-opacity hover:opacity-90 h-[68px]"
      style={{ backgroundColor: phase.bgColor, borderColor: `${phase.color}25` }}
    >
      <div className="flex items-center gap-2.5 h-full">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xl"
          style={{ background: `${phase.color}1F` }}
        >
          {phase.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[9px] uppercase tracking-widest truncate" style={{ color: phase.color }}>
            Rytm · D{cycleDay}
          </p>
          <p className="font-serif text-dark text-xs leading-tight truncate">
            {phase.name}
          </p>
          <p className="font-sans text-[10px] text-muted-light truncate">
            {phase.energy}
          </p>
        </div>
      </div>
    </Link>
  )
}
