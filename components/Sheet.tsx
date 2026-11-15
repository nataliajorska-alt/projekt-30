'use client'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { SmallCaps } from '@/components/ui'

// Arkusz: na telefonie wysuwa się od dołu na prawie cały ekran, na komputerze
// to wyśrodkowane okno. Treść przewija się w środku, nagłówek zostaje na miejscu.
export default function Sheet({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow?: string
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useModalDismiss<HTMLDivElement>(onClose)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center print:hidden">
      <div className="absolute inset-0 bg-forest-deep/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col bg-ivory border-t sm:border border-gold-light/40 animate-slide-up"
      >
        <header className="flex items-start gap-3 px-5 pt-5 pb-3.5 border-b border-hairline/70">
          <div className="flex-1 min-w-0">
            {eyebrow && <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">{eyebrow}</SmallCaps>}
            <h2 className="font-display text-dark text-[24px] leading-tight mt-0.5 first-letter:uppercase">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="p-2 -m-1 text-muted hover:text-dark transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>
        <div className="overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
