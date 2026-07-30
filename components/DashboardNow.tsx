'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import { SmallCaps, Diamond } from '@/components/ui'
import EveningClosing from '@/components/EveningClosing'

// Pasek „Teraz" — jedna odpowiedź na „co teraz zrobić", wyprowadzona z todayLog.
// Góra dashboardu była dotąd kontemplacyjnym ornamentem bez pojedynczej wskazówki.
// Priorytet: niedokończony poranek → niedokończony wieczór → dzień domknięty.
// Logika kompletności mirroruje RoutineChecklist.getItemSplit: zbiór „essential"
// = getEffectiveItems(cat, false), zawężony filterItemsForMinimumDay w dzień minimum.
export default function DashboardNow() {
  const { todayLog, loading } = useGameData()
  const { getEffectiveItems } = useRoutineConfig()
  const [showClosing, setShowClosing] = useState(false)
  if (loading || !todayLog) return null

  const done = todayLog.completedRoutine ?? []
  const isMinimum = todayLog.dayMode === 'minimum'
  const reason = todayLog.minimumReason

  // „Po wstaniu 30 minut bez telefonu" — okno tylko zaraz po przebudzeniu.
  // Gdy reszta poranka jest odhaczona, a ten blok nie, to znaczy, że dziś już
  // nie będzie (nie zrobiłaś rano). Nie blokujemy na nim paska „Teraz" — niech
  // poranek liczy się jako domknięty i przełącza na dzień, bez „dokończ rytuał".
  const PHONE_ITEM_ID = 'm1'

  const isDone = (cat: 'morning' | 'evening') => {
    const full = getEffectiveItems(cat, false)
    let essential = isMinimum && reason ? filterItemsForMinimumDay(full, reason) : full
    if (cat === 'morning') {
      const withoutPhone = essential.filter((i) => i.id !== PHONE_ITEM_ID)
      // Wycinamy tylko gdy zostają inne pozycje — nie chcemy pustego zbioru.
      if (withoutPhone.length > 0) essential = withoutPhone
    }
    // Pusty zbiór: w trybie minimum traktujemy jako domknięty (jak progress=100).
    return essential.length === 0 ? isMinimum : essential.every((i) => done.includes(i.id))
  }

  const morningDone = isDone('morning')
  const eveningDone = isDone('evening')

  // Świadomość pory dnia: „wieczorny rytuał" podpowiadamy DOPIERO wieczorem,
  // a nie o 7:30 rano (gdy poranek wypadł jako zrobiony — np. zaliczony albo
  // w dzień minimum, gdy poranny zestaw jest pusty). Dzień resetuje się o 3:00,
  // więc okno wieczoru to 18:00–02:59.
  const hour = new Date().getHours()
  const eveningWindow = hour >= 18 || hour < 3

  let label: string
  let closed = false
  if (!morningDone) {
    label = 'dokończ poranny rytuał'
  } else if (!eveningDone) {
    label = eveningWindow ? 'czas na wieczorny rytuał' : 'poranek zrobiony — wróć wieczorem'
  } else {
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
      {/* Wieczorne domknięcie: rutyna e1–e7 + „ostatni papieros dnia" na jednym
          ekranie. Dostępne przez całe okno wieczoru — także po domknięciu rutyny,
          bo deklarację papierosa można postawić później. */}
      {eveningWindow && (
        <button
          onClick={() => setShowClosing(true)}
          className="font-ui uppercase tracking-[0.28em] text-[9.5px] text-gold-deep hover:text-dark transition-colors shrink-0"
        >
          domknij ◆
        </button>
      )}
      {closed && !eveningWindow && <Diamond size={5} className="text-gold" filled />}
      {showClosing && <EveningClosing onClose={() => setShowClosing(false)} />}
    </div>
  )
}
