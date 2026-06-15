'use client'
import { PILLARS } from '@/lib/pillars'
import { Eye, EyeOff } from 'lucide-react'
import { SmallCaps, Diamond } from '@/components/ui'
import { JEWEL } from './PillarRating'

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
    <div className="bg-cream border border-gold-light/40 p-5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
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
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-1.5">
                {focusLabel}
              </SmallCaps>
              <p className="font-serif-body italic text-dark text-[14px] leading-relaxed">
                „{focusText}"
              </p>
            </div>
          )}

          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-2">
              Oceny filarów
            </SmallCaps>
            <div className="flex gap-2 flex-wrap">
              {PILLARS.map(p => {
                const c = JEWEL[p.id] ?? p.color
                const val = pillarsRated[p.id] ?? 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-ivory border border-hairline px-3 py-1.5"
                  >
                    {/* kolor zostaje tylko na rombie (dekoracja); etykieta i liczba
                        ciemne = czytelne (raw p.color np. złoty Styl mdlał na ivory) */}
                    <span style={{ color: c }}>
                      <Diamond size={4} filled />
                    </span>
                    <SmallCaps tracking="luxury" size="xs">
                      <span className="text-dark">{p.shortName}</span>
                    </SmallCaps>
                    <span className="font-display font-medium text-[15px] tabular-nums text-dark leading-none">
                      {val}
                      <span className="font-serif-body not-italic text-[10px] text-muted-light ml-0.5">/5</span>
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
