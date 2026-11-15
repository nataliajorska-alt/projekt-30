'use client'
import DayPlanner from '@/components/coach/DayPlanner'
import { SmallCaps } from '@/components/ui'

// Karta planu dnia: z włączoną asystentką układa plan w apce i pokazuje go jako
// oś dnia; bez niej — dotychczasowy brief do skopiowania do Claude’a.
// 'tomorrow' — widok „Jutro"; 'today' — plan reszty dzisiejszego dnia.
export default function TomorrowBriefing({ variant = 'tomorrow' }: { variant?: 'today' | 'tomorrow' }) {
  const isToday = variant === 'today'
  return (
    <section
      aria-label={isToday ? 'Plan na dziś' : 'Plan na jutro'}
      className="bg-ivory border border-gold-light/40 mb-4"
    >
      <div className="px-5 pt-5 pb-3 flex items-baseline gap-3">
        <h2 className="font-heading text-dark text-xl whitespace-nowrap">
          {isToday ? 'Plan na dziś' : 'Plan na jutro'}
        </h2>
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          brief · asystentka
        </SmallCaps>
      </div>
      <div className="px-5 pb-5">
        <DayPlanner variant={variant} />
      </div>
    </section>
  )
}
