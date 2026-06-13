'use client'
import { useState } from 'react'
import { Plus, X, Swords } from 'lucide-react'
import { useCustomQuestLibrary } from '@/hooks/useCustomQuestLibrary'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

export default function CustomQuestLibrarySection() {
  const { quests, loading, addQuest, removeQuest } = useCustomQuestLibrary()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    await addQuest(newTitle, newDesc)
    setNewTitle('')
    setNewDesc('')
    setAdding(false)
    setSaving(false)
  }

  if (loading) return null

  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Swords size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Moje side questy
        </SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mt-1">Biblioteka pomysłów</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5 leading-relaxed">
        wpisuj pomysły na side questy gdy coś ci przyjdzie do głowy.
        trafią do losowania obok standardowej biblioteki.
      </p>

      {quests.length > 0 && (
        <div className="space-y-2 mb-4">
          {quests.map(q => (
            <div key={q.id} className="flex items-start gap-3 bg-cream/40 border border-hairline px-4 py-3">
              <Diamond size={5} className="text-gold mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-dark text-[14px]">{q.title}</p>
                {q.description && (
                  <p className="font-serif-body italic text-muted text-[12.5px] mt-1 leading-relaxed">
                    {q.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeQuest(q.id)}
                className="text-muted hover:text-red-500 transition-colors shrink-0 mt-0.5"
                aria-label="Usuń quest"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {quests.length === 0 && !adding && (
        <p className="font-serif-body italic text-muted-light text-[13px] mb-4">
          brak własnych questów. dodaj pierwszy pomysł poniżej.
        </p>
      )}

      {adding ? (
        <div className="border border-hairline p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="nazwa questa…"
            maxLength={80}
            autoFocus
            className="w-full border border-hairline bg-cream/40 px-4 py-2.5 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors"
          />
          <textarea
            rows={2}
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="opis (opcjonalnie)…"
            maxLength={200}
            className="w-full border border-hairline bg-cream/40 px-4 py-2.5 font-serif-body italic text-[14px] text-dark focus:outline-none focus:border-gold transition-colors resize-none"
          />
          <div className="flex gap-2 items-center">
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewDesc('') }}
              className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-dark transition-colors"
            >
              anuluj
            </button>
            <div className="flex-1" />
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim() || saving}
              className="bg-dark-deep text-ivory border border-gold py-2 px-4 hover:bg-forest transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <Fleuron size={9} className="text-gold animate-pulse" />
              ) : (
                <Diamond size={4} className="text-gold" />
              )}
              <SmallCaps tone="ivory" tracking="luxury" size="xs">
                {saving ? '…' : 'dodaj'}
              </SmallCaps>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-muted hover:text-gold-deep transition-colors"
        >
          <Plus size={12} strokeWidth={1.5} />
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            dodaj pomysł na quest
          </SmallCaps>
        </button>
      )}
    </section>
  )
}
