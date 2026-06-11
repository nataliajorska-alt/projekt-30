'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { SmallCaps, Diamond } from '@/components/ui'
import type { AprilQuest } from '@/lib/seasonal/aprilData'

// Modal pominięcia questa z opcjonalnym powodem — wyniesiony z DailyQuests,
// żeby ekran Jutro mógł pomijać te same questy (wspólny log.skips).
export default function SkipModal({
  quest,
  onConfirm,
  onClose,
}: {
  quest: AprilQuest
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-6 md:pb-0">
      <div className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ivory border border-gold-light/40 w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Pominięcie questa
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
          dlaczego pomijasz to zadanie? (opcjonalnie)
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="np. nie miałam czasu, zrobiłam to inaczej, nie pasuje na teraz…"
          className="w-full border border-hairline px-4 py-3 font-serif-body text-[14px] text-dark bg-cream/40 placeholder:text-muted-light/70 focus:outline-none focus:border-gold transition-colors resize-none mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-dark-deep text-ivory border border-gold py-3 hover:bg-forest transition-colors flex items-center justify-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              Pomiń zadanie
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
