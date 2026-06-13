'use client'
import { Pill } from 'lucide-react'
import { SmallCaps, GoldRule, RomanNumeral } from '@/components/ui'
import { MORNING_SUPPLEMENTS, EVENING_SUPPLEMENTS, WEEKLY_HABITS } from '@/lib/routineData'

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

// Pozycje suplementowe brane w ciągu dnia (np. cynk+selen przy obiedzie) —
// czytane z nawyków tygodniowych, żeby opis był zgodny z zakładką Dzień.
const DAY_SUPPS = WEEK_ORDER.flatMap(({ dow, name }) =>
  (WEEKLY_HABITS[dow] ?? [])
    .filter(i => i.id.includes('supp'))
    .map(i => ({ name, text: i.text })),
)

export default function SupplementGuideSection() {
  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Pill size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Witaminy i suplementy
        </SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mt-1">Twój plan suplementacji</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5 leading-relaxed">
        opis dla przypomnienia — dawki rozwijają się też pod pozycjami
        „witaminy" i „magnez + duloksetyna" w rutynie. kawa dopiero po porannych
        tabletkach; D3 / K2 / omega zawsze z tłuszczem.
      </p>

      {/* Rano */}
      <SmallCaps tone="dark" tracking="luxury" size="sm">
        Rano · po śniadaniu z tłuszczem
      </SmallCaps>
      <div className="mt-3 space-y-2.5">
        {WEEK_ORDER.map(({ dow, name }) => {
          const m = MORNING_SUPPLEMENTS[dow]
          if (!m) return null
          return (
            <div key={dow} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 border-b border-hairline/50 pb-2">
              <div className="sm:w-40 shrink-0">
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  {name}
                </SmallCaps>
              </div>
              <span className="font-serif-body text-[13px] text-dark leading-snug">
                {m.steps.join(' · ')}
              </span>
            </div>
          )
        })}
      </div>

      {/* W ciągu dnia */}
      {DAY_SUPPS.length > 0 && (
        <>
          <GoldRule variant="plain" tone="gold-deep" className="my-5 opacity-30" />
          <SmallCaps tone="dark" tracking="luxury" size="sm">
            W ciągu dnia · przy obiedzie
          </SmallCaps>
          <div className="mt-3 space-y-2.5">
            {DAY_SUPPS.map((d, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 border-b border-hairline/50 pb-2">
                <div className="sm:w-40 shrink-0">
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    {d.name}
                  </SmallCaps>
                </div>
                <span className="font-serif-body text-[13px] text-dark leading-snug">{d.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <GoldRule variant="plain" tone="gold-deep" className="my-5 opacity-30" />

      {/* Wieczór */}
      <SmallCaps tone="dark" tracking="luxury" size="sm">
        Wieczór · {EVENING_SUPPLEMENTS.theme}
      </SmallCaps>
      <ol className="mt-2.5 space-y-1.5">
        {EVENING_SUPPLEMENTS.steps.map((step, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <RomanNumeral value={i + 1} className="text-gold-deep text-[11px] w-5 shrink-0 text-center" />
            <span className="font-serif-body text-[14px] text-dark leading-snug">{step}</span>
          </li>
        ))}
      </ol>

      <p className="font-serif-body italic text-muted text-[12px] mt-5 leading-relaxed">
        Cynk i selen z dala od kreatyny (min. 1–2 h). Kreatyna = więcej wody.
        Witamina C 500 mg doraźnie też w inne dni przy infekcji lub stresie.
        Kontrola witaminy D za 8–12 tygodni.
      </p>
    </section>
  )
}
