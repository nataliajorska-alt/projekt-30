'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { Star, X } from 'lucide-react'

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

  // Already marked today
  if (existing) {
    return (
      <div className="bg-gold-pale border border-gold/30 rounded-2xl px-4 py-3 mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Star size={14} className="text-gold mt-0.5 flex-shrink-0" fill="currentColor" strokeWidth={0} />
          <div className="min-w-0">
            <p className="font-sans text-[10px] text-gold uppercase tracking-widest mb-0.5">Kluczowy moment</p>
            <p className="font-serif text-dark text-sm truncate">{existing.title}</p>
            {existing.note && (
              <p className="font-sans text-xs text-muted mt-0.5 line-clamp-2">{existing.note}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-muted-light hover:text-dark transition-colors flex-shrink-0 mt-0.5"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Subtle trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gold/30 text-gold/60 hover:border-gold/60 hover:text-gold transition-all font-sans text-xs tracking-wide"
      >
        <Star size={12} strokeWidth={1.5} />
        <span>Oznacz ten dzień jako kluczowy moment</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 bg-ivory rounded-2xl shadow-2xl border border-cream/60 p-6 animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-sans text-[10px] text-gold uppercase tracking-widest mb-0.5">Kluczowy moment</p>
                <h2 className="font-serif text-dark text-lg">Co się wydarzyło?</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-light hover:text-dark transition-colors mt-1">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <p className="font-sans text-xs text-muted mb-4 leading-relaxed">
              Ten wpis trafi do Twojego Annual Report. Jeden dzień, jedno zdanie — za rok będziesz wiedziała.
            </p>

            <input
              type="text"
              placeholder="Pierwsza randka z sobą / Awans / Przełom..."
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 80))}
              className="w-full font-serif text-dark text-base bg-cream/50 rounded-xl px-4 py-2.5 border border-cream outline-none focus:border-gold/40 mb-3 placeholder:text-muted-light/50 transition-colors"
              autoFocus
            />

            <textarea
              placeholder="Krótka notatka (opcjonalnie)..."
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 280))}
              rows={2}
              className="w-full font-sans text-sm text-dark bg-cream/50 rounded-xl px-4 py-2.5 border border-cream outline-none focus:border-gold/40 mb-4 placeholder:text-muted-light/50 resize-none transition-colors leading-relaxed"
            />

            {error && (
              <p className="font-sans text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-forest text-ivory font-sans text-sm disabled:opacity-40 hover:bg-forest/90 transition-colors"
              >
                {saving ? 'Zapisuję...' : 'Zapisz w raporcie ✦'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-cream font-sans text-sm text-muted hover:text-dark transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
