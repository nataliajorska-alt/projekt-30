'use client'

import { useState } from 'react'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { X } from 'lucide-react'
import type { MoodState } from '@/types'
import { MOOD_STATES } from '@/types'
import { SmallCaps, Diamond, GoldRule } from '@/components/ui'

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
      <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2.5">
        {label}
      </SmallCaps>
      <div className="flex gap-2">
        {/* Skala jako wypełniane romby: 1..n pełne, wybrana wartość na ciemnym tle */}
        {[1, 2, 3, 4, 5].map((n) => {
          const sel = value === n
          const filled = value !== null && n <= value
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-label={`${label}: ${n} z 5`}
              aria-pressed={sel}
              className={`flex-1 h-11 border transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                sel
                  ? 'bg-dark-deep border-gold'
                  : 'border-hairline bg-cream/30 hover:border-gold-light'
              }`}
            >
              <span
                className={`w-3 h-3 rotate-45 border transition-colors ${
                  filled ? 'bg-gold border-gold' : sel ? 'border-gold-light' : 'border-gold/50'
                }`}
              />
              <span className={`font-ui text-[9px] tracking-[0.14em] leading-none ${sel ? 'text-gold-pale' : 'text-muted'}`}>
                {n}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MoodCheckInModal({ onSave, onDismiss }: Props) {
  const dialogRef = useModalDismiss<HTMLDivElement>(onDismiss)
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
        className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Card */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 bg-ivory border border-gold-light/40 p-7 animate-slide-up">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-muted-light hover:text-dark transition-colors"
          aria-label="Zamknij"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Header */}
        <div className="mb-5">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Check-in
          </SmallCaps>
          <h2 className="font-display text-dark text-2xl mt-1 leading-tight">
            Jak się teraz czujesz?
          </h2>
          <p className="font-serif-body italic text-muted text-[13px] mt-1">
            dziesięć sekund · dane na całe życie.
          </p>
        </div>

        <GoldRule variant="diamond" tone="gold-deep" className="opacity-40 mb-5" />

        <ScaleSelector label="Energia" value={energy} onChange={setEnergy} />
        <ScaleSelector label="Nastrój" value={mood} onChange={setMood} />

        {/* State pills */}
        <div className="mb-6">
          <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2.5">
            Stan
          </SmallCaps>
          <div className="flex gap-2 flex-wrap">
            {MOOD_STATES.map(({ value, emoji, label }) => {
              const sel = state === value
              return (
                <button
                  key={value}
                  onClick={() => setState(value)}
                  className={`flex items-center gap-2 px-3 py-2 border transition-all duration-150 ${
                    sel
                      ? 'bg-dark-deep border-gold text-ivory'
                      : 'border-hairline bg-cream/30 text-muted hover:border-gold-light hover:text-dark'
                  }`}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <SmallCaps
                    tone={sel ? 'ivory' : 'muted'}
                    tracking="luxury"
                    size="xs"
                  >
                    {label}
                  </SmallCaps>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 py-3 transition-all duration-150 flex items-center justify-center gap-2 ${
              canSave
                ? 'bg-dark-deep text-ivory border border-gold hover:bg-forest'
                : 'bg-cream/50 border border-hairline text-muted-light cursor-not-allowed'
            }`}
          >
            <Diamond size={5} className={canSave ? 'text-gold' : 'text-muted-light'} />
            <SmallCaps
              tone={canSave ? 'ivory' : 'muted'}
              tracking="luxury"
              size="xs"
            >
              zapisz · + 5 XP
            </SmallCaps>
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 border border-hairline text-muted hover:text-dark hover:border-gold transition-all"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              może później
            </SmallCaps>
          </button>
        </div>
      </div>
    </div>
  )
}
