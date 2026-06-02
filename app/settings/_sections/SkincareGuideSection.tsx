'use client'
import { Droplets } from 'lucide-react'
import { SmallCaps, GoldRule, RomanNumeral } from '@/components/ui'
import { MORNING_SKINCARE_STEPS, EVENING_SKINCARE } from '@/lib/routineData'

// Kolejność wyświetlania: pn → nd (dane są kluczowane 0=nd…6=sb)
const WEEK_ORDER: { dow: number; name: string }[] = [
  { dow: 1, name: 'Poniedziałek' },
  { dow: 2, name: 'Wtorek' },
  { dow: 3, name: 'Środa' },
  { dow: 4, name: 'Czwartek' },
  { dow: 5, name: 'Piątek' },
  { dow: 6, name: 'Sobota' },
  { dow: 0, name: 'Niedziela' },
]

export default function SkincareGuideSection() {
  return (
    <section className="bg-ivory border border-gold-light/40 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Droplets size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Pielęgnacja cery
        </SmallCaps>
      </div>
      <h2 className="font-heading text-dark text-xl mt-1">Twoja rutyna skincare</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5 leading-relaxed">
        opis dla przypomnienia — co i kiedy. te same kroki rozwijają się pod
        pozycją „zadbanie o twarz" w rutynie.
      </p>

      {/* Rano */}
      <SmallCaps tone="dark" tracking="luxury" size="sm">
        Rano · codziennie
      </SmallCaps>
      <ol className="mt-2.5 mb-6 space-y-1.5">
        {MORNING_SKINCARE_STEPS.map((step, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <RomanNumeral value={i + 1} className="text-gold-deep text-[11px] w-5 shrink-0 text-center" />
            <span className="font-serif-body text-[14px] text-dark leading-snug">{step}</span>
          </li>
        ))}
      </ol>

      <GoldRule variant="plain" tone="gold-deep" className="mb-5 opacity-30" />

      {/* Wieczór */}
      <SmallCaps tone="dark" tracking="luxury" size="sm">
        Wieczór · plan tygodnia
      </SmallCaps>
      <div className="mt-3 space-y-2.5">
        {WEEK_ORDER.map(({ dow, name }) => {
          const e = EVENING_SKINCARE[dow]
          if (!e) return null
          return (
            <div key={dow} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 border-b border-hairline/50 pb-2">
              <div className="flex items-baseline gap-2 sm:w-40 shrink-0">
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  {name}
                </SmallCaps>
                <span className="font-serif-body italic text-forest/70 text-[11px]">{e.theme}</span>
              </div>
              <span className="font-serif-body text-[13px] text-dark leading-snug">
                {e.steps.join(' · ')}
              </span>
            </div>
          )
        })}
      </div>

      <p className="font-serif-body italic text-muted text-[12px] mt-5 leading-relaxed">
        4 noce aktywne (azelaina / retinoid / BHA / retinoid) + 3 barierowe.
        Nigdy retinoid + kwas tej samej nocy. Retinoid i C-Glow w lodówce.
      </p>
    </section>
  )
}
