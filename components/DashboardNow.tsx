'use client'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import { SmallCaps, Diamond } from '@/components/ui'

// Pasek „Teraz" — jedna odpowiedź na „co teraz zrobić", wyprowadzona z todayLog.
// Góra dashboardu była dotąd kontemplacyjnym ornamentem bez pojedynczej wskazówki.
// Priorytet: niedokończony poranek → niedokończony wieczór → dzień domknięty.
// Logika kompletności mirroruje RoutineChecklist.getItemSplit: zbiór „essential"
// = getEffectiveItems(cat, false), zawężony filterItemsForMinimumDay w dzień minimum.
export default function DashboardNow() {
  const { todayLog, loading } = useGameData()
  const { getEffectiveItems } = useRoutineConfig()
  if (loading || !todayLog) return null

  const done = todayLog.completedRoutine ?? []
  const isMinimum = todayLog.dayMode === 'minimum'
  const reason = todayLog.minimumReason

  const isDone = (cat: 'morning' | 'evening') => {
    const full = getEffectiveItems(cat, false)
    const essential = isMinimum && reason ? filterItemsForMinimumDay(full, reason) : full
    // Pusty zbiór: w trybie minimum traktujemy jako domknięty (jak progress=100).
    return essential.length === 0 ? isMinimum : essential.every((i) => done.includes(i.id))
  }

  const morningDone = isDone('morning')
  const eveningDone = isDone('evening')

  let label: string
  let closed = false
  if (!morningDone) label = 'dokończ poranny rytuał'
  else if (!eveningDone) label = 'czas na wieczorny rytuał'
  else {
    label = 'dzień domknięty — możesz odpocząć'
    closed = true
  }

  return (
    <div className="flex items-center gap-3 border-y border-hairline/70 py-3 mb-4">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
        Teraz
      </SmallCaps>
      <span className="text-gold text-[9px] leading-none" aria-hidden="true">◆</span>
      <span className="flex-1 font-serif-body italic text-[14.5px] text-dark leading-snug">
        {label}
      </span>
      {closed && <Diamond size={5} className="text-gold" filled />}
    </div>
  )
}
