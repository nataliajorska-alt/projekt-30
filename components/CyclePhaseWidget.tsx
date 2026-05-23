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
      className="block bg-ivory border border-gold-light/40 hover:border-gold px-3 py-2.5 transition-colors h-[68px]"
    >
      <div className="flex items-center gap-3 h-full">
        <div
          className="flex-shrink-0 w-9 h-9 border flex items-center justify-center text-base"
          style={{ borderColor: `${phase.color}55` }}
        >
          {phase.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <SmallCaps tracking="luxury" size="xs">
            <span style={{ color: phase.color }}>
              Rytm · {toRoman(cycleDay)}
            </span>
          </SmallCaps>
          <p className="font-heading text-dark text-[13px] leading-tight truncate mt-0.5">
            {phase.name}
          </p>
          <p className="font-serif-body italic text-muted text-[11px] leading-snug truncate">
            {phase.energy}
          </p>
        </div>
      </div>
    </Link>
  )
}
