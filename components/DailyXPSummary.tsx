'use client'
import { useGameData } from '@/hooks/useGameData'
import { SmallCaps, Fleuron } from '@/components/ui'

export default function DailyXPSummary() {
  const { todayLog, stats } = useGameData()
  const todayXP = todayLog?.totalXP ?? 0

  return (
    <div className="bg-cream border border-gold-light/30 px-4 sm:px-5 py-4 mb-4 flex items-center gap-3 sm:gap-4">
      <div className="flex-1 min-w-0 text-left">
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          XP dziś
        </SmallCaps>
        <p className="font-display text-dark text-2xl sm:text-3xl leading-none mt-1.5 tabular-nums">
          + {todayXP.toLocaleString('pl-PL')}
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
        <span className="h-3 w-px bg-gold-deep/40" />
        <Fleuron size={10} className="text-gold" />
        <span className="h-3 w-px bg-gold-deep/40" />
      </div>

      <div className="flex-1 min-w-0 text-right">
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          XP łącznie
        </SmallCaps>
        <p className="font-display text-dark text-2xl sm:text-3xl leading-none mt-1.5 tabular-nums">
          {stats.totalXP.toLocaleString('pl-PL')}
        </p>
      </div>
    </div>
  )
}
