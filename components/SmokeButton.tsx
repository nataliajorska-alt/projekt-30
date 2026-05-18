'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Undo2, X } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { CIGARETTE_CONTEXTS } from '@/lib/smoke-data'
import type { CigaretteContext } from '@/types'

interface SmokeButtonProps {
  onClose: () => void
}

// Patrz PLAN_PALENIE.md sekcja 3.3.
// Nie ma czerwonych alertów, nie ma „skuś mnie nie!". Spokojny licznik.
// 1 tap = +1 bez kontekstu. „Dodaj kontekst" otwiera ekran wyboru.
// „Cofnij" usuwa ostatni wpis (omyłka, podwójne tapnięcie).
export default function SmokeButton({ onClose }: SmokeButtonProps) {
  const { todayLog, logCigarette, removeLastCigarette } = useGameData()
  const [showContextPicker, setShowContextPicker] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  const todayCount = todayLog?.cigarettes?.length ?? 0
  const lastContext = todayLog?.cigarettes?.[todayLog.cigarettes.length - 1]?.context

  // Krótka pozytywna informacja zwrotna po tapnięciu — nie nagroda, tylko potwierdzenie.
  useEffect(() => {
    if (!justLogged) return
    const t = setTimeout(() => setJustLogged(false), 1200)
    return () => clearTimeout(t)
  }, [justLogged])

  const handleQuickLog = async () => {
    await logCigarette()
    setJustLogged(true)
  }

  const handleContextLog = async (context: CigaretteContext) => {
    await logCigarette(context)
    setShowContextPicker(false)
    setJustLogged(true)
  }

  const handleUndo = async () => {
    await removeLastCigarette()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-ivory w-full md:max-w-md md:rounded-2xl rounded-t-3xl shadow-elegant border border-border/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between border-b border-border/40">
          <div>
            <h2 className="font-serif text-lg text-dark">Papieros</h2>
            <p className="font-sans text-xs text-muted mt-0.5">
              Spokojny licznik. To są dane, nie ocena.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="text-muted hover:text-dark transition-colors p-1"
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>

        {!showContextPicker ? (
          <div className="px-5 py-6">
            {/* Dzisiejszy licznik — duży, ale spokojny. Nie ma porównania do wczoraj. */}
            <div className="text-center mb-6">
              <div className="font-serif text-5xl text-dark tabular-nums">
                {todayCount}
              </div>
              <div className="font-sans text-[11px] uppercase tracking-wider text-muted mt-1">
                dzisiaj
              </div>
              {lastContext && (
                <div className="font-sans text-xs text-muted/80 mt-2">
                  ostatni: {CIGARETTE_CONTEXTS.find(c => c.id === lastContext)?.label.toLowerCase()}
                </div>
              )}
            </div>

            {/* Główna akcja: +1 */}
            <button
              onClick={handleQuickLog}
              className={clsx(
                'w-full py-4 rounded-xl bg-dark text-ivory font-sans text-sm transition-all',
                'hover:bg-forest active:scale-[0.98]',
                justLogged && 'bg-forest'
              )}
            >
              {justLogged ? 'Zapisane' : '+1 papieros'}
            </button>

            {/* Sekundarna akcja: kontekst */}
            <button
              onClick={() => setShowContextPicker(true)}
              className="w-full py-3 mt-2 rounded-xl border border-border text-dark font-sans text-xs hover:bg-cream transition-colors"
            >
              + dodaj z kontekstem
            </button>

            {/* Cofnij — tylko gdy jest co cofnąć */}
            {todayCount > 0 && (
              <button
                onClick={handleUndo}
                className="w-full py-2 mt-3 text-muted hover:text-dark font-sans text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Undo2 size={12} strokeWidth={1.6} />
                cofnij ostatni
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-5">
            <p className="font-sans text-xs text-muted mb-4">
              Co go wywołało? (Im więcej takich, tym wyraźniejszy wzorzec po fazie 1.)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CIGARETTE_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => handleContextLog(ctx.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-border/60 bg-white hover:border-gold/60 hover:bg-cream transition-all"
                >
                  <span className="text-xl leading-none">{ctx.icon}</span>
                  <span className="font-sans text-[11px] text-dark leading-tight text-center">
                    {ctx.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowContextPicker(false)}
              className="w-full py-2 mt-4 text-muted hover:text-dark font-sans text-xs transition-colors"
            >
              ← wróć
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
