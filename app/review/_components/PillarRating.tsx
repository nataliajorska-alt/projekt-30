'use client'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/types'

// Klejnotowe tony filarów (z mocka Przegląd) — czytelne na pergaminie,
// inne niż surowe pillar.color (część jest za jasna/za ciemna na papierze).
export const JEWEL: Record<string, string> = {
  pozycja: '#2f3c31',
  cialo: '#7c5a32',
  styl: '#a9842c',
  kapital: '#5d7356',
  kariera: '#283228',
  tozsamosc: '#5d4570',
  milosc: '#9c413a',
}

// Ocena filaru diamentami: klik na romb ustawia wartość; klik na bieżącą — zmniejsza o 1.
export default function PillarRating({
  ratings,
  onChange,
}: {
  ratings: Record<Pillar, number>
  onChange: (id: Pillar, value: number) => void
}) {
  return (
    <div className="mt-5">
      {PILLARS.map(p => {
        const c = JEWEL[p.id] ?? p.color
        const score = ratings[p.id as Pillar]
        return (
          <div
            key={p.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 sm:gap-5 py-3.5 border-t first:border-t-0"
            style={{ borderColor: '#cfc4a0' }}
          >
            <span className="font-serif-body text-[17px] flex items-center gap-2.5" style={{ color: '#2a2a26' }}>
              <span className="text-[9px]" style={{ color: c }}>◆</span> {p.shortName}
            </span>
            <span className="flex gap-2 sm:gap-2.5">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  aria-label={`${p.shortName} ${v}/5`}
                  onClick={() => onChange(p.id as Pillar, score === v ? v - 1 : v)}
                  className="w-3.5 h-3.5 rotate-45 border transition-all hover:shadow-[0_0_0_2px_rgba(178,147,85,.25)]"
                  style={{ borderColor: c, background: v <= score ? c : 'transparent' }}
                />
              ))}
            </span>
            <span className="font-display font-medium text-[16px] tabular-nums min-w-[42px] text-right" style={{ color: c }}>
              {score}<small className="font-serif-body italic text-[12px]" style={{ color: '#9c8e6b' }}>/5</small>
            </span>
          </div>
        )
      })}
    </div>
  )
}
