'use client'
import { PILLARS } from '@/lib/pillars'
import { Eye, EyeOff } from 'lucide-react'
import { SmallCaps, Diamond } from '@/components/ui'

interface ContinuityBannerProps {
  show: boolean
  onToggle: () => void
  label: string
  focusLabel: string
  focusText: string
  pillarsRated: Record<string, number>
}

export default function ContinuityBanner({ show, onToggle, label, focusLabel, focusText, pillarsRated }: ContinuityBannerProps) {
  return (
    <div className="bg-cream/60 border border-gold-light/40 p-5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Diamond size={5} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            {label}
          </SmallCaps>
        </div>
        {show
          ? <EyeOff size={13} className="text-muted-light" strokeWidth={1.5} />
          : <Eye size={13} className="text-muted-light" strokeWidth={1.5} />
        }
      </button>

      {show && (
        <div className="mt-4 space-y-4">
          {focusText && (
            <div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1.5">
                {focusLabel}
              </SmallCaps>
              <p className="font-serif-body italic text-dark text-[14px] leading-relaxed">
                „{focusText}"
              </p>
            </div>
          )}

          <div>
            <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
              Oceny filarów
            </SmallCaps>
            <div className="flex gap-1.5 flex-wrap">
              {PILLARS.map(p => {
                const val = pillarsRated[p.id] ?? 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-ivory border border-hairline px-2.5 py-1"
                  >
                    <span style={{ color: p.color }}>
                      <Diamond size={4} filled />
                    </span>
                    <SmallCaps tracking="luxury" size="xs">
                      <span style={{ color: p.color }}>{p.shortName}</span>
                    </SmallCaps>
                    <span
                      className="font-display text-[11px] tabular-nums"
                      style={{ color: p.color }}
                    >
                      {val}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
