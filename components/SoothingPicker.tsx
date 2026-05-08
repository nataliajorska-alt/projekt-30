'use client'
import { useState } from 'react'
import { SOOTHING_SUGGESTIONS } from '@/lib/routineData'
import { Sparkles, RotateCw } from 'lucide-react'

function pickRandom(prev: string | null): string {
  if (SOOTHING_SUGGESTIONS.length <= 1) return SOOTHING_SUGGESTIONS[0] ?? ''
  let next = SOOTHING_SUGGESTIONS[Math.floor(Math.random() * SOOTHING_SUGGESTIONS.length)]
  // Unikaj powtórzenia z rzędu
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
        className="mt-1.5 ml-8 inline-flex items-center gap-1.5 text-[11px] font-sans text-muted hover:text-gold-dark transition-colors"
      >
        <Sparkles size={11} />
        <span>Bez pomysłu? Wylosuj rzecz dla spokoju</span>
      </button>
    )
  }

  return (
    <div className="mt-1.5 ml-8 mr-1 bg-cream/60 border border-gold/15 rounded-lg px-3 py-2 flex items-start gap-2">
      <Sparkles size={12} className="text-gold-dark flex-shrink-0 mt-0.5" />
      <p className="font-sans text-[12px] text-dark leading-snug flex-1">{suggestion}</p>
      <button
        onClick={() => setSuggestion(pickRandom(suggestion))}
        className="flex-shrink-0 text-muted hover:text-gold-dark transition-colors"
        aria-label="Wylosuj inną"
        title="Wylosuj inną"
      >
        <RotateCw size={12} />
      </button>
    </div>
  )
}
