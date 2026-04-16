'use client'

import { useState } from 'react'
import type { MoodState } from '@/types'
import { MOOD_STATES } from '@/types'

interface Props {
  onSave: (data: { energy: number; mood: number; state: MoodState }) => void
  onDismiss: () => void
}

function ScaleSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-5">
      <p className="font-sans text-xs text-muted uppercase tracking-widest mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`
              w-10 h-10 rounded-full border font-sans text-sm transition-all duration-150
              ${value === n
                ? 'bg-forest border-forest text-ivory'
                : 'border-cream bg-transparent text-muted hover:border-forest/60 hover:text-dark'
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MoodCheckInModal({ onSave, onDismiss }: Props) {
  const [energy, setEnergy] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [state, setState] = useState<MoodState | null>(null)

  const canSave = energy !== null && mood !== null && state !== null

  const handleSave = () => {
    if (!canSave) return
    onSave({ energy: energy!, mood: mood!, state: state! })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Card */}
      <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 bg-ivory rounded-2xl shadow-2xl border border-cream/60 p-6 animate-slide-up">
        {/* Header */}
        <div className="mb-5">
          <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Check-in</p>
          <h2 className="font-serif text-dark text-xl">Jak się teraz czujesz?</h2>
          <p className="font-sans text-xs text-muted mt-1">10 sekund, dane na całe życie.</p>
        </div>

        {/* Energy */}
        <ScaleSelector label="Energia" value={energy} onChange={setEnergy} />

        {/* Mood */}
        <ScaleSelector label="Nastrój" value={mood} onChange={setMood} />

        {/* State icons */}
        <div className="mb-6">
          <p className="font-sans text-xs text-muted uppercase tracking-widest mb-2">Stan</p>
          <div className="flex gap-2 flex-wrap">
            {MOOD_STATES.map(({ value, emoji, label }) => (
              <button
                key={value}
                onClick={() => setState(value)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-full border font-sans text-xs transition-all duration-150
                  ${state === value
                    ? 'bg-forest border-forest text-ivory'
                    : 'border-cream bg-transparent text-muted hover:border-forest/60 hover:text-dark'
                  }
                `}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`
              flex-1 py-2.5 rounded-xl font-sans text-sm font-medium transition-all duration-150
              ${canSave
                ? 'bg-forest text-ivory hover:bg-forest/90'
                : 'bg-cream text-muted cursor-not-allowed'
              }
            `}
          >
            Zapisz +5 XP
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl border border-cream font-sans text-sm text-muted hover:text-dark hover:border-forest/40 transition-all duration-150"
          >
            Może później
          </button>
        </div>
      </div>
    </div>
  )
}
