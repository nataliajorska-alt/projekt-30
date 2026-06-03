'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { dateKey, formatDate } from '@/lib/gameLogic'
import { SmallCaps, Diamond } from '@/components/ui'
import type { AprilQuest } from '@/lib/seasonal/aprilData'

/* ── Date helpers (local, tz-safe — parse/format YYYY-MM-DD) ───────── */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDaysKey(key: string, days: number): string {
  const d = keyToDate(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

/**
 * Modal wyboru daty przeniesienia questa.
 * `today`   — realna dzisiejsza data (do etykiet szybkich opcji: jutro/pojutrze…)
 * `minDate` — najwcześniejsza wybieralna data (domyślnie jutro)
 */
export default function PostponeModal({
  quest,
  today,
  minDate,
  onConfirm,
  onClose,
}: {
  quest: AprilQuest
  today: string
  minDate?: string
  onConfirm: (targetDate: string) => void
  onClose: () => void
}) {
  const floor = minDate ?? addDaysKey(today, 1)
  const quickPicks = [
    { off: 1, label: 'Jutro' },
    { off: 2, label: 'Pojutrze' },
    { off: 3, label: 'Za 3 dni' },
    { off: 7, label: 'Za tydzień' },
  ]
    .map(c => ({ label: c.label, date: addDaysKey(today, c.off) }))
    .filter(c => c.date >= floor)
    .slice(0, 3)
  const [selected, setSelected] = useState(quickPicks[0]?.date ?? floor)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-6 md:pb-0">
      <div className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ivory border border-gold-light/40 w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Przeniesienie questa
            </SmallCaps>
            <h3 className="font-heading text-dark text-base mt-1">{quest.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-light hover:text-dark transition-colors ml-3 flex-shrink-0"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <p className="font-serif-body italic text-muted text-[13px] mb-4">
          na kiedy chcesz przenieść to zadanie?
        </p>

        {quickPicks.length > 0 && (
          <div className="flex gap-2 mb-4">
            {quickPicks.map(p => (
              <button
                key={p.label}
                onClick={() => setSelected(p.date)}
                className={clsx(
                  'flex-1 border px-2 py-2.5 transition-colors',
                  selected === p.date
                    ? 'border-gold bg-gold-pale/50 text-dark'
                    : 'border-hairline text-muted hover:border-gold hover:text-dark',
                )}
              >
                <SmallCaps tone={selected === p.date ? 'gold-deep' : 'muted'} tracking="luxury" size="xs">
                  {p.label}
                </SmallCaps>
              </button>
            ))}
          </div>
        )}

        <label className="block mb-1">
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            albo wybierz datę
          </SmallCaps>
        </label>
        <input
          type="date"
          value={selected}
          min={floor}
          onChange={e => e.target.value && setSelected(e.target.value)}
          className="w-full border border-hairline px-4 py-3 font-serif-body text-[14px] text-dark bg-cream/40 focus:outline-none focus:border-gold transition-colors mb-2"
        />
        <p className="font-serif-body italic text-muted-light text-[12px] mb-4">
          przeniesiesz na: {formatDate(keyToDate(selected))}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 bg-dark-deep text-ivory border border-gold py-3 hover:bg-forest transition-colors flex items-center justify-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              Przenieś zadanie
            </SmallCaps>
          </button>
          <button
            onClick={onClose}
            className="border border-hairline text-muted px-4 py-3 hover:border-gold hover:text-dark transition-colors"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              Anuluj
            </SmallCaps>
          </button>
        </div>
      </div>
    </div>
  )
}
