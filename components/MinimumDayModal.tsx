'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { X, BatteryLow } from 'lucide-react'
import { MINIMUM_DAY_REASONS } from '@/types'
import type { MinimumDayReason } from '@/types'
import { SmallCaps, Diamond } from '@/components/ui'

interface Props {
  onConfirm: (reason: MinimumDayReason) => void
  onClose: () => void
}

export default function MinimumDayModal({ onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<MinimumDayReason | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div
        className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-ivory border border-gold-light/40 w-full max-w-sm p-7 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-light hover:text-dark transition-colors"
          aria-label="Zamknij"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <BatteryLow size={13} className="text-forest" strokeWidth={1.5} />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Dzień minimum
          </SmallCaps>
        </div>
        <h3 className="font-display text-dark text-2xl mt-1 leading-tight">
          Co dziś bierzesz na siebie?
        </h3>
        <p className="font-serif-body italic text-muted text-[13px] mt-2 mb-5 leading-relaxed">
          pokażę ci tylko to, co najważniejsze.
        </p>

        <div className="space-y-2 mb-5">
          {MINIMUM_DAY_REASONS.map(({ value, label, emoji, description }) => {
            const sel = selected === value
            return (
              <button
                key={value}
                onClick={() => setSelected(value)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-all border',
                  sel
                    ? 'bg-forest/8 border-forest'
                    : 'bg-cream/30 border-hairline hover:border-gold-light'
                )}
              >
                <Diamond
                  size={9}
                  filled={sel}
                  className={sel ? 'text-forest' : 'text-hairline'}
                />
                <span className="text-base leading-none flex-shrink-0">{emoji}</span>
                <div className="min-w-0">
                  <p className={clsx(
                    'font-heading text-[14px] leading-tight',
                    sel ? 'text-forest' : 'text-dark'
                  )}>
                    {label}
                  </p>
                  <p className="font-serif-body italic text-muted text-[12px] mt-0.5 leading-snug">
                    {description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={clsx(
            'w-full py-3 transition-all flex items-center justify-center gap-2 border',
            selected
              ? 'bg-dark-deep text-ivory border-gold hover:bg-forest'
              : 'bg-cream/50 border-hairline text-muted-light cursor-not-allowed'
          )}
        >
          <Diamond size={5} className={selected ? 'text-gold' : 'text-muted-light'} />
          <SmallCaps
            tone={selected ? 'ivory' : 'muted'}
            tracking="luxury"
            size="xs"
          >
            włącz tryb minimum
          </SmallCaps>
        </button>
      </div>
    </div>
  )
}
