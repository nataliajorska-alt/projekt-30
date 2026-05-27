'use client'
import Link from 'next/link'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { getPhaseForDate } from '@/lib/cycle-data'
import { useMemo } from 'react'
import { SmallCaps } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

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
      className="flex items-center gap-2.5 border border-border/70 hover:border-gold px-3 py-2 transition-colors"
    >
      <span
        className="flex-shrink-0 w-[26px] h-[26px] bg-cream flex items-center justify-center text-[13px]"
        style={{ color: phase.color }}
      >
        {phase.emoji}
      </span>
      <span className="flex-1 min-w-0 leading-tight">
        <span
          className="block font-ui uppercase tracking-[0.3em] text-[8px]"
          style={{ color: phase.color }}
        >
          Rytm · {toRoman(cycleDay)}
        </span>
        <span className="block font-display text-dark text-[13px] font-medium mt-0.5 truncate">
          {phase.name}
          <span className="ml-1.5 font-serif-body italic text-muted text-[11px]">
            {phase.energy}
          </span>
        </span>
      </span>
    </Link>
  )
}
