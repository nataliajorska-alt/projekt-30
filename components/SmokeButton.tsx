'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Undo2, X } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { CIGARETTE_CONTEXTS } from '@/lib/smoke-data'
import type { CigaretteContext } from '@/types'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

interface SmokeButtonProps {
  onClose: () => void
}

// „mniej więcej kiedy" — godzina zegarowa + ile temu. Spokojnie, bez pełnej gramatyki godzin.
function formatLastSmoke(timestamp: number): string {
  const d = new Date(timestamp)
  const clock = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  const diffMin = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  let rel: string
  if (diffMin < 1) rel = 'przed chwilą'
  else if (diffMin < 60) rel = `${diffMin} min temu`
  else {
    const h = Math.floor(diffMin / 60)
    const m = diffMin % 60
    rel = m === 0 ? `${h} h temu` : `${h} h ${m} min temu`
  }
  return `${rel} · ${clock}`
}

export default function SmokeButton({ onClose }: SmokeButtonProps) {
  const { todayLog, logCigarette, removeLastCigarette } = useGameData()
  const [showContextPicker, setShowContextPicker] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  const todayCount = todayLog?.cigarettes?.length ?? 0
  const lastEntry = todayLog?.cigarettes?.[todayLog.cigarettes.length - 1]
  const lastContext = lastEntry?.context

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

  return (
    <div
      className="fixed inset-0 z-50 bg-forest-deep/85 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-ivory border border-gold-light/40 w-full md:max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-hairline">
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Papieros
            </SmallCaps>
            <h2 className="font-heading text-dark text-xl mt-1">Spokojny licznik</h2>
            <p className="font-serif-body italic text-muted text-[12.5px] mt-1">
              to są dane, nie ocena.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="text-muted-light hover:text-dark transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {!showContextPicker ? (
          <div className="px-6 py-6">
            {/* Licznik */}
            <div className="text-center mb-7">
              <p className="font-display text-dark text-6xl leading-none tabular-nums">
                {todayCount}
              </p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-3 block">
                dzisiaj
              </SmallCaps>
              {lastEntry && (
                <p className="font-serif-body italic text-muted text-[12.5px] mt-3">
                  ostatni: {formatLastSmoke(lastEntry.timestamp)}
                  {lastContext && (
                    <> · {CIGARETTE_CONTEXTS.find(c => c.id === lastContext)?.label.toLowerCase()}</>
                  )}
                </p>
              )}
            </div>

            {/* Główna akcja */}
            <button
              onClick={handleQuickLog}
              className={clsx(
                'w-full py-4 border transition-all flex items-center justify-center gap-2 active:scale-[0.98]',
                justLogged
                  ? 'bg-forest text-ivory border-gold'
                  : 'bg-dark-deep text-ivory border-gold hover:bg-forest'
              )}
            >
              {justLogged ? (
                <>
                  <Diamond size={5} className="text-gold" filled />
                  <SmallCaps tone="ivory" tracking="luxury" size="sm">
                    zapisane
                  </SmallCaps>
                </>
              ) : (
                <>
                  <Diamond size={5} className="text-gold" />
                  <SmallCaps tone="ivory" tracking="luxury" size="sm">
                    + I papieros
                  </SmallCaps>
                </>
              )}
            </button>

            {/* Dodaj kontekst */}
            <button
              onClick={() => setShowContextPicker(true)}
              className="w-full py-3 mt-2 border border-hairline text-dark hover:border-gold transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                + dodaj z kontekstem
              </SmallCaps>
            </button>

            {/* Cofnij */}
            {todayCount > 0 && (
              <button
                onClick={() => removeLastCigarette()}
                className="w-full py-2 mt-3 text-muted-light hover:text-dark transition-colors flex items-center justify-center gap-2"
              >
                <Undo2 size={10} strokeWidth={1.5} />
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  cofnij ostatni
                </SmallCaps>
              </button>
            )}
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Fleuron size={9} className="text-gold-deep" />
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                co go wywołało?
              </SmallCaps>
            </div>
            <p className="font-serif-body italic text-muted-light text-[12.5px] mb-4">
              im więcej takich, tym wyraźniejszy wzorzec po fazie I.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CIGARETTE_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => handleContextLog(ctx.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 border border-hairline bg-ivory hover:border-gold transition-all"
                >
                  <span className="text-xl leading-none">{ctx.icon}</span>
                  <SmallCaps tone="dark" tracking="luxury" size="xs">
                    {ctx.label}
                  </SmallCaps>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowContextPicker(false)}
              className="w-full py-2 mt-4 text-muted-light hover:text-dark transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                ‹ wróć
              </SmallCaps>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
