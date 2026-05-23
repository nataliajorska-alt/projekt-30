'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { X } from 'lucide-react'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'

export default function KeyMomentCapture() {
  const { todayLog, saveKeyMoment, clearKeyMoment } = useGameData()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existing = todayLog?.keyMoment

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const trimmedNote = note.trim()
      await saveKeyMoment({ title: title.trim(), ...(trimmedNote ? { note: trimmedNote } : {}) })
      setOpen(false)
      setTitle('')
      setNote('')
    } catch (e) {
      console.error('[KeyMoment] zapis nie powiódł się', e)
      setError('Nie udało się zapisać. Spróbuj jeszcze raz.')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    await clearKeyMoment()
  }

  // Already marked today — editorial inscription card
  if (existing) {
    return (
      <div className="relative bg-ivory border border-gold px-5 py-4 mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Fleuron size={14} className="text-gold mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Kluczowy moment · zapisany
            </SmallCaps>
            <p className="font-heading text-dark text-base mt-1 truncate">
              {existing.title}
            </p>
            {existing.note && (
              <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-snug line-clamp-2">
                {existing.note}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-muted-light hover:text-dark transition-colors flex-shrink-0 mt-0.5"
          aria-label="Usuń"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Subtle trigger — editorial */}
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-3 py-3 border border-dashed border-gold/40 hover:border-gold transition-all group"
      >
        <Fleuron size={10} className="text-gold/70 group-hover:text-gold transition-colors" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Oznacz ten dzień jako kluczowy moment
        </SmallCaps>
        <Fleuron size={10} className="text-gold/70 group-hover:text-gold transition-colors" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 bg-ivory border border-gold-light/40 p-7 animate-slide-up">
            <div className="flex items-start justify-between mb-5">
              <div>
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                  Kluczowy moment
                </SmallCaps>
                <h2 className="font-display text-dark text-2xl mt-2 leading-tight">
                  Co się wydarzyło?
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-light hover:text-dark transition-colors mt-1 flex-shrink-0"
                aria-label="Zamknij"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <p className="font-serif-body italic text-muted text-[13.5px] mb-5 leading-relaxed">
              ten wpis trafi do twojego rocznego raportu —<br />
              jeden dzień, jedno zdanie. za rok będziesz wiedziała.
            </p>

            <input
              type="text"
              placeholder="pierwsza randka z sobą / awans / przełom…"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 80))}
              className="w-full font-serif-body text-dark text-[15px] bg-cream/40 px-4 py-3 border border-hairline outline-none focus:border-gold mb-3 placeholder:text-muted-light/60 transition-colors"
              autoFocus
            />

            <textarea
              placeholder="krótka notatka (opcjonalnie)…"
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 280))}
              rows={2}
              className="w-full font-serif-body text-[14px] text-dark bg-cream/40 px-4 py-3 border border-hairline outline-none focus:border-gold mb-5 placeholder:text-muted-light/60 resize-none transition-colors leading-relaxed"
            />

            {error && (
              <p className="font-serif-body italic text-red-700 bg-red-50 border border-red-100 px-3 py-2 mb-4 text-[13px]">
                {error}
              </p>
            )}

            <GoldRule variant="diamond" tone="gold-deep" className="mb-5 opacity-40" />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="flex-1 py-3 bg-dark-deep border border-gold text-ivory disabled:opacity-40 hover:bg-forest transition-colors flex items-center justify-center gap-2"
              >
                <Diamond size={5} className="text-gold" />
                <SmallCaps tone="ivory" tracking="luxury" size="xs">
                  {saving ? 'zapisuję…' : 'zapisz w raporcie'}
                </SmallCaps>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-3 border border-hairline text-muted hover:text-dark hover:border-gold transition-colors"
              >
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  Anuluj
                </SmallCaps>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
