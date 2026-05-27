'use client'
import { useState } from 'react'
import { SOOTHING_SUGGESTIONS } from '@/lib/routineData'
import { RotateCw } from 'lucide-react'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

function pickRandom(prev: string | null): string {
  if (SOOTHING_SUGGESTIONS.length <= 1) return SOOTHING_SUGGESTIONS[0] ?? ''
  let next = SOOTHING_SUGGESTIONS[Math.floor(Math.random() * SOOTHING_SUGGESTIONS.length)]
  while (next === prev) {
    next = SOOTHING_SUGGESTIONS[Math.floor(Math.random() * SOOTHING_SUGGESTIONS.length)]
  }
  return next
}

export default function SoothingPicker() {
  const [suggestion, setSuggestion] = useState<string | null>(null)

  if (!suggestion) {
    return (
      <button
        onClick={() => setSuggestion(pickRandom(null))}
        className="mt-1.5 ml-8 inline-flex items-center gap-2 hover:opacity-80 transition-opacity group"
      >
        <Fleuron size={9} className="text-gold-deep/70 group-hover:text-gold transition-colors" />
        <SmallCaps tone="muted" tracking="luxury" size="xs" className="group-hover:text-gold-deep transition-colors">
          Bez pomysłu? Wylosuj rzecz dla spokoju
        </SmallCaps>
      </button>
    )
  }

  return (
    <div className="mt-1.5 ml-8 mr-1 bg-cream-warm/50 border border-gold-light/50 px-3 py-2 flex items-center gap-3">
      <Diamond size={5} className="text-gold shrink-0" />
      <p className="font-serif-body italic text-dark text-[13.5px] leading-snug flex-1">
        {suggestion}
      </p>
      <button
        onClick={() => setSuggestion(pickRandom(suggestion))}
        className="shrink-0 inline-flex items-center gap-1.5 border border-hairline hover:border-gold active:border-gold active:bg-cream px-2.5 py-1.5 text-muted hover:text-dark active:text-gold-deep transition-colors"
        aria-label="Wylosuj inną"
        title="Wylosuj inną propozycję"
      >
        <RotateCw size={12} strokeWidth={1.5} />
        <span className="font-ui uppercase tracking-luxury text-[10px]">Losuj</span>
      </button>
    </div>
  )
}
