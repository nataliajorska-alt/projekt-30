'use client'
import { useState } from 'react'
import { X, BatteryLow } from 'lucide-react'
import { MINIMUM_DAY_REASONS } from '@/types'
import type { MinimumDayReason } from '@/types'
import clsx from 'clsx'

interface Props {
  onConfirm: (reason: MinimumDayReason) => void
  onClose: () => void
}

export default function MinimumDayModal({ onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<MinimumDayReason | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ivory rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-light hover:text-muted transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <BatteryLow size={16} className="text-forest" strokeWidth={1.5} />
          <h3 className="font-serif text-dark text-base">Dzień minimum</h3>
        </div>
        <p className="font-sans text-xs text-muted mb-5">
          Co sprawia, że dziś potrzebujesz minimum? Pokażę Ci tylko to, co najważniejsze.
        </p>

        <div className="space-y-2 mb-5">
          {MINIMUM_DAY_REASONS.map(({ value, label, emoji, description }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border',
                selected === value
                  ? 'bg-forest/10 border-forest/40 text-dark'
                  : 'bg-white border-border hover:border-forest/20 hover:bg-forest/5'
              )}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <div>
                <p className="font-sans text-sm font-medium text-dark">{label}</p>
                <p className="font-sans text-[11px] text-muted">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={clsx(
            'w-full py-3 rounded-xl font-sans text-sm font-medium transition-all',
            selected
              ? 'bg-forest text-white hover:bg-forest/90'
              : 'bg-cream text-muted-light cursor-not-allowed'
          )}
        >
          Włącz tryb minimum
        </button>
      </div>
    </div>
  )
}
