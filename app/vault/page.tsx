'use client'
import { useState, useRef, useEffect } from 'react'
import { useVault } from '@/hooks/useVault'
import { PROJECT_END, getDaysRemaining } from '@/lib/gameLogic'
import { Lock, Trash2, X, PenLine } from 'lucide-react'
import clsx from 'clsx'

const UNLOCK_DATE = PROJECT_END // 2027-04-05

function isUnlocked(): boolean {
  return new Date() >= UNLOCK_DATE
}

function formatDate(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DaysCountdown() {
  const days = getDaysRemaining()
  return (
    <div className="bg-dark rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.1) 10px,rgba(255,255,255,.1) 11px)' }}
      />
      <div className="relative z-10">
        <div className="text-4xl mb-3">🔐</div>
        <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] mb-2">
          Skarbiec otwiera się za
        </p>
        <p className="font-serif text-5xl text-ivory mb-1">
          <span className="text-gold">{days}</span>
        </p>
        <p className="font-sans text-sm text-muted-light mb-4">
          {days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'} · 5 kwietnia 2027
        </p>
        <p className="font-serif text-ivory/50 text-xs italic leading-relaxed max-w-xs mx-auto">
          &ldquo;Piszesz jako Natalia 30 — ona już wie, jak się skończyło.&rdquo;
        </p>
      </div>
    </div>
  )
}

function UnlockedBanner({ count }: { count: number }) {
  return (
    <div className="bg-gold-pale border border-gold/30 rounded-2xl p-6 text-center mb-6">
      <div className="text-4xl mb-3">🔓</div>
      <p className="font-serif text-dark text-xl mb-1">Skarbiec otwarty</p>
      <p className="font-sans text-sm text-muted">
        Masz {count} {count === 1 ? 'list' : count < 5 ? 'listy' : 'listów'} do odczytania.
      </p>
    </div>
  )
}

interface WriteModalProps {
  onSave: (title: string, content: string) => Promise<void>
  onClose: () => void
}

function WriteModal({ onSave, onClose }: WriteModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    await onSave(title.trim() || 'List bez tytułu', content.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-ivory animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div>
          <p className="font-sans text-[10px] text-gold uppercase tracking-[0.2em]">Skarbiec · Nowy list</p>
          <p className="font-serif text-dark text-base mt-0.5">Piszę jako Natalia 30</p>
        </div>
        <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Prompt card */}
      <div className="px-5 py-4 bg-gold-pale/60 border-b border-gold/10 flex-shrink-0">
        <p className="font-serif text-sm text-dark/70 leading-relaxed italic">
          &ldquo;Piszę z 5 kwietnia 2027. Wiem, co się wydarzyło, jak wyglądasz, co czujesz.
          Piszę do Ciebie — teraźniejszej — bo wiem, że dziś jest ciężko i chcę, żebyś wiedziała...&rdquo;
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-y-auto">
        <input
          type="text"
          placeholder="Tytuł listu (opcjonalny)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full font-serif text-lg text-dark bg-transparent border-none outline-none placeholder:text-muted-light/60"
        />
        <textarea
          ref={textareaRef}
          placeholder="Zaczynam pisać..."
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1 w-full font-sans text-sm text-dark bg-transparent border-none outline-none resize-none placeholder:text-muted-light/60 leading-relaxed min-h-[300px]"
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
        <p className="font-sans text-xs text-muted-light">
          {content.length > 0 ? `${content.length} znaków` : 'Zacznij pisać...'}
        </p>
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="bg-dark text-ivory font-sans text-sm px-5 py-2.5 rounded-xl disabled:opacity-40 hover:bg-forest transition-colors"
        >
          {saving ? 'Zapisuję...' : 'Zamknij w skarbcu ✦'}
        </button>
      </div>
    </div>
  )
}

interface EntryCardProps {
  entry: ReturnType<typeof useVault>['entries'][0]
  unlocked: boolean
  onDelete: (id: string) => void
}

function EntryCard({ entry, unlocked, onDelete }: EntryCardProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <button
        onClick={() => unlocked && setOpen(true)}
        className={clsx(
          'w-full text-left bg-white rounded-2xl border p-5 transition-all',
          unlocked
            ? 'border-gold/20 hover:border-gold/40 hover:shadow-elegant cursor-pointer'
            : 'border-border cursor-default'
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!unlocked && <Lock size={11} className="text-muted-light flex-shrink-0" strokeWidth={2} />}
              <p className="font-serif text-dark text-base truncate">
                {unlocked ? entry.title : entry.title}
              </p>
            </div>
            <p className="font-sans text-xs text-muted-light">
              Dzień {entry.dayOfProject} · {formatDate(entry.dateKey)}
            </p>
          </div>
          <span className="font-sans text-[10px] text-gold bg-gold-pale px-2 py-1 rounded-full flex-shrink-0">
            D{entry.dayOfProject}
          </span>
        </div>

        {/* Preview — blurred if locked */}
        <p className={clsx(
          'font-sans text-sm text-muted leading-relaxed line-clamp-2 select-none',
          !unlocked && 'blur-sm pointer-events-none'
        )}>
          {entry.content}
        </p>
      </button>

      {/* Expanded entry (unlocked only) */}
      {open && unlocked && (
        <div className="fixed inset-0 z-[130] flex flex-col bg-ivory animate-fade-in">
          <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
            <div>
              <p className="font-sans text-[10px] text-gold uppercase tracking-[0.2em]">
                Dzień {entry.dayOfProject} · {formatDate(entry.dateKey)}
              </p>
              <p className="font-serif text-dark text-lg mt-0.5">{entry.title}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-light hover:text-dark transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="bg-gold-pale/40 rounded-xl px-4 py-3 mb-5 border border-gold/10">
              <p className="font-serif text-xs text-muted-light italic">Napisane przez Natalię 30</p>
            </div>
            <p className="font-sans text-sm text-dark leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          </div>

          <div className="px-5 py-4 border-t border-border flex justify-between items-center">
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs text-muted">Na pewno usunąć?</span>
                <button
                  onClick={() => { onDelete(entry.id); setOpen(false) }}
                  className="font-sans text-xs text-red-500 hover:text-red-700"
                >Usuń</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-sans text-xs text-muted-light"
                >Anuluj</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-muted-light hover:text-dark transition-colors"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                <span className="font-sans text-xs">Usuń</span>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="font-sans text-sm text-muted-light hover:text-dark transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function VaultPage() {
  const { entries, loading, addEntry, removeEntry } = useVault()
  const [writing, setWriting] = useState(false)
  const unlocked = isUnlocked()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Prywatne</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Skarbiec</h1>
        <p className="font-sans text-sm text-muted">
          Listy od Natalii 30 — do odczytania w dniu urodzin.
        </p>
      </div>

      {unlocked ? <UnlockedBanner count={entries.length} /> : <DaysCountdown />}

      {/* Write button */}
      <button
        onClick={() => setWriting(true)}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 mb-6 rounded-2xl border border-dashed border-gold/40 text-gold hover:bg-gold-pale transition-all font-sans text-sm"
      >
        <PenLine size={15} strokeWidth={1.5} />
        Napisz list jako Natalia 30
      </button>

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="bg-cream rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📜</p>
          <p className="font-serif text-dark text-base mb-1">Skarbiec czeka</p>
          <p className="font-sans text-sm text-muted">
            Napisz pierwszy list — Natalia 30 ma już coś do powiedzenia.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              unlocked={unlocked}
              onDelete={removeEntry}
            />
          ))}
        </div>
      )}

      {/* Write modal */}
      {writing && (
        <WriteModal
          onSave={addEntry}
          onClose={() => setWriting(false)}
        />
      )}
    </div>
  )
}
