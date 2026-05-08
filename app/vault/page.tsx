'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useVault, type NewLetterDraft } from '@/hooks/useVault'
import { Lock, Trash2, X, PenLine, ChevronLeft, MessageCirclePlus } from 'lucide-react'
import clsx from 'clsx'
import {
  LETTER_TYPES, MOOD_STATES,
  type LetterType, type UnlockType, type MoodState, type VaultEntry, type VaultReply,
} from '@/types'
import {
  getUnlockStatus, getNextGlobalUnlock, daysUntil, countUnlocked, gratitudeUnlockDate,
} from '@/lib/vaultUnlock'
import { getRandomPrompt } from '@/lib/vaultPrompts'

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function moodMeta(state?: MoodState) {
  if (!state) return null
  return MOOD_STATES.find(m => m.value === state) ?? null
}

function letterTypeMeta(type: LetterType) {
  return LETTER_TYPES.find(t => t.value === type) ?? LETTER_TYPES[0]
}

// ── Banner ─────────────────────────────────────────────────────────

function NextUnlockBanner({ entries, unlockedCount }: { entries: VaultEntry[]; unlockedCount: number }) {
  const next = getNextGlobalUnlock(entries)
  const total = entries.filter(e => e.unlockType !== 'never').length
  const days = next ? daysUntil(next.date) : 0
  const allDone = !next && total > 0

  if (allDone) {
    return (
      <div className="bg-gold-pale border border-gold/30 rounded-2xl p-6 text-center mb-6">
        <div className="text-4xl mb-3">🔓</div>
        <p className="font-serif text-dark text-xl mb-1">Skarbiec otwarty</p>
        <p className="font-sans text-sm text-muted">
          Masz {unlockedCount} {unlockedCount === 1 ? 'list' : unlockedCount < 5 ? 'listy' : 'listów'} do odczytania.
        </p>
      </div>
    )
  }

  if (!next) {
    return null
  }

  return (
    <div className="bg-dark rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.1) 10px,rgba(255,255,255,.1) 11px)' }}
      />
      <div className="relative z-10">
        <div className="text-4xl mb-3">🔐</div>
        <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] mb-2">
          {unlockedCount > 0 ? 'Następne otwarcie za' : 'Pierwsze otwarcie za'}
        </p>
        <p className="font-serif text-5xl text-ivory mb-1">
          <span className="text-gold">{days}</span>
        </p>
        <p className="font-sans text-sm text-muted-light mb-4">
          {days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'} · {next.label}
        </p>
        {unlockedCount > 0 && (
          <p className="font-sans text-xs text-gold-light mb-3">
            Już otwarte: {unlockedCount}
          </p>
        )}
        <p className="font-serif text-ivory/50 text-xs italic leading-relaxed max-w-xs mx-auto">
          &ldquo;Piszesz jako Natalia 30 — ona już wie, jak się skończyło.&rdquo;
        </p>
      </div>
    </div>
  )
}

// ── Letter Type Picker (krok 1 pisania) ───────────────────────────

interface TypePickerProps {
  onPick: (type: LetterType) => void
  onClose: () => void
}

function LetterTypePicker({ onPick, onClose }: TypePickerProps) {
  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-ivory animate-fade-in">
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div>
          <p className="font-sans text-[10px] text-gold uppercase tracking-[0.2em]">Skarbiec · Nowy list</p>
          <p className="font-serif text-dark text-base mt-0.5">Jaki to ma być list?</p>
        </div>
        <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {LETTER_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => onPick(t.value)}
            className="w-full text-left bg-white rounded-2xl border border-border p-4 hover:border-gold/40 hover:shadow-elegant transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{t.emoji}</div>
              <div className="flex-1">
                <p className="font-serif text-dark text-base mb-1">{t.label}</p>
                <p className="font-sans text-sm text-muted leading-relaxed">{t.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Write Modal (krok 2 — mood + prompt + treść) ──────────────────

interface WriteModalProps {
  letterType: LetterType
  onSave: (draft: NewLetterDraft) => Promise<void>
  onBack: () => void
  onClose: () => void
}

function WriteModal({ letterType, onSave, onBack, onClose }: WriteModalProps) {
  const meta = letterTypeMeta(letterType)
  const isVent = letterType === 'vent'
  const isCustomDate = letterType === 'date'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<MoodState | null>(null)
  const [prompt, setPrompt] = useState<string | null>(() => getRandomPrompt(letterType))
  const [usePrompt, setUsePrompt] = useState(true)
  const [unlockDate, setUnlockDate] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const canSave = (() => {
    if (!content.trim()) return false
    if (isCustomDate && !unlockDate) return false
    return true
  })()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)

    let finalUnlockDate: string | undefined
    if (letterType === 'gratitude') finalUnlockDate = gratitudeUnlockDate()
    else if (letterType === 'date')  finalUnlockDate = unlockDate

    await onSave({
      letterType,
      unlockType: meta.unlockType as UnlockType,
      title,
      content,
      unlockDate: finalUnlockDate,
      moodAtWriting: mood ?? undefined,
      promptUsed: usePrompt && prompt && !isVent ? prompt : undefined,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-ivory animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="text-muted-light hover:text-dark transition-colors flex-shrink-0">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="min-w-0">
            <p className="font-sans text-[10px] text-gold uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span>{meta.emoji}</span> {meta.label}
            </p>
            <p className="font-serif text-dark text-base mt-0.5 truncate">
              {isVent ? 'Pisz. Nikt tego nie przeczyta.' : 'Piszę jako Natalia 30'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors flex-shrink-0">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Mood picker */}
      <div className="px-5 py-3 border-b border-border flex-shrink-0">
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Jak się teraz czujesz?</p>
        <div className="flex gap-2">
          {MOOD_STATES.map(m => (
            <button
              key={m.value}
              onClick={() => setMood(prev => prev === m.value ? null : m.value)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm transition-all',
                mood === m.value
                  ? 'bg-dark text-ivory border-dark'
                  : 'bg-white text-muted border-border hover:border-gold/40',
              )}
            >
              <span className="text-base">{m.emoji}</span>
              <span className="font-sans text-xs">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt card (ukryte dla venta — tam wystarcza sam zaproszenie do wypuszczenia) */}
      {!isVent && (
        <div className="px-5 py-3 bg-gold-pale/60 border-b border-gold/10 flex-shrink-0">
          {usePrompt && prompt ? (
            <>
              <p className="font-serif text-sm text-dark/80 leading-relaxed italic">
                &ldquo;{prompt}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setPrompt(getRandomPrompt(letterType, prompt ?? undefined))}
                  className="font-sans text-[11px] text-gold hover:text-dark transition-colors"
                >
                  Inny prompt ↻
                </button>
                <button
                  onClick={() => setUsePrompt(false)}
                  className="font-sans text-[11px] text-muted hover:text-dark transition-colors"
                >
                  Pisz bez promptu
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { setUsePrompt(true); setPrompt(getRandomPrompt(letterType)) }}
              className="font-sans text-[11px] text-gold hover:text-dark transition-colors"
            >
              Pokaż prompt ↻
            </button>
          )}
        </div>
      )}

      {/* Datepicker tylko dla 'date' */}
      {isCustomDate && (
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <label className="block font-sans text-[10px] text-muted uppercase tracking-widest mb-1.5">
            Otwiera się w dniu
          </label>
          <input
            type="date"
            value={unlockDate}
            onChange={e => setUnlockDate(e.target.value)}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            className="w-full font-sans text-sm text-dark bg-white border border-border rounded-xl px-3 py-2 outline-none focus:border-gold"
          />
        </div>
      )}

      {/* Form */}
      <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-y-auto">
        {!isVent && (
          <input
            type="text"
            placeholder="Tytuł listu (opcjonalny)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full font-serif text-lg text-dark bg-transparent border-none outline-none placeholder:text-muted-light/60"
          />
        )}
        <textarea
          ref={textareaRef}
          placeholder={isVent ? 'Wypuść wszystko. Nic z tego nie zostanie zapisane.' : 'Zaczynam pisać...'}
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
          disabled={!canSave || saving}
          className="bg-dark text-ivory font-sans text-sm px-5 py-2.5 rounded-xl disabled:opacity-40 hover:bg-forest transition-colors"
        >
          {saving ? 'Zapisuję...' : isVent ? 'Wypuść 🌪️' : 'Zamknij w skarbcu ✦'}
        </button>
      </div>
    </div>
  )
}

// ── Reply composer (wewnątrz expanded entry) ──────────────────────

interface ReplyComposerProps {
  onSave: (content: string, mood?: MoodState) => Promise<void>
  onCancel: () => void
}

function ReplyComposer({ onSave, onCancel }: ReplyComposerProps) {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<MoodState | null>(null)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    await onSave(content.trim(), mood ?? undefined)
    setSaving(false)
    onCancel()
  }

  return (
    <div className="bg-cream/60 border border-gold/20 rounded-2xl p-4 mb-3">
      <p className="font-sans text-[10px] text-gold uppercase tracking-widest mb-2">Twoja odpowiedź</p>
      <div className="flex gap-1.5 mb-3">
        {MOOD_STATES.map(m => (
          <button
            key={m.value}
            onClick={() => setMood(prev => prev === m.value ? null : m.value)}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all border',
              mood === m.value
                ? 'bg-dark text-ivory border-dark'
                : 'bg-white text-muted border-border hover:border-gold/40',
            )}
          >
            <span>{m.emoji}</span>
            <span className="font-sans">{m.label}</span>
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Co chcesz teraz powiedzieć tamtej Tobie?"
        className="w-full bg-white rounded-xl border border-border outline-none p-3 font-sans text-sm text-dark min-h-[120px] resize-none focus:border-gold"
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="font-sans text-xs text-muted-light hover:text-dark px-3 py-1.5"
        >
          Anuluj
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="bg-dark text-ivory font-sans text-xs px-4 py-1.5 rounded-xl disabled:opacity-40 hover:bg-forest transition-colors"
        >
          {saving ? 'Zapisuję...' : 'Dodaj odpowiedź'}
        </button>
      </div>
    </div>
  )
}

// ── Reply card ────────────────────────────────────────────────────

function ReplyCard({ reply, onDelete }: { reply: VaultReply; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const moodInfo = moodMeta(reply.moodAtWriting)
  return (
    <div className="bg-white rounded-2xl border border-border p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-sans text-[11px] text-muted">
            {formatDate(reply.dateKey)} · dzień {reply.dayOfProject}
          </p>
          {moodInfo && (
            <span className="text-xs flex items-center gap-1 bg-cream rounded-full px-2 py-0.5">
              <span>{moodInfo.emoji}</span>
              <span className="font-sans text-[10px] text-muted">{moodInfo.label}</span>
            </span>
          )}
        </div>
        {confirm ? (
          <div className="flex items-center gap-2">
            <button onClick={onDelete} className="font-sans text-[11px] text-red-500">Usuń</button>
            <button onClick={() => setConfirm(false)} className="font-sans text-[11px] text-muted-light">Anuluj</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="text-muted-light hover:text-dark">
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <p className="font-sans text-sm text-dark leading-relaxed whitespace-pre-wrap">{reply.content}</p>
    </div>
  )
}

// ── Entry Card (lista) ────────────────────────────────────────────

interface EntryCardProps {
  entry: VaultEntry
  allEntries: VaultEntry[]
  onOpen: () => void
}

function EntryCard({ entry, allEntries, onOpen }: EntryCardProps) {
  const status = getUnlockStatus(entry, allEntries)
  const meta = letterTypeMeta(entry.letterType)
  const isVent = entry.letterType === 'vent'
  const replyCount = entry.replies?.length ?? 0
  const canOpen = status.unlocked || isVent  // vent — można "otworzyć" żeby zobaczyć meta

  return (
    <button
      onClick={() => canOpen && onOpen()}
      className={clsx(
        'w-full text-left bg-white rounded-2xl border p-5 transition-all',
        canOpen
          ? 'border-gold/20 hover:border-gold/40 hover:shadow-elegant cursor-pointer'
          : 'border-border cursor-default',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {!status.unlocked && !isVent && <Lock size={11} className="text-muted-light flex-shrink-0" strokeWidth={2} />}
            <span className="text-base flex-shrink-0">{meta.emoji}</span>
            <p className="font-serif text-dark text-base truncate">
              {isVent ? 'Vent' : (entry.title || 'List bez tytułu')}
            </p>
          </div>
          <p className="font-sans text-xs text-muted-light">
            {meta.label} · dzień {entry.dayOfProject} · {formatDate(entry.dateKey)}
          </p>
        </div>
        <span className="font-sans text-[10px] text-gold bg-gold-pale px-2 py-1 rounded-full flex-shrink-0">
          D{entry.dayOfProject}
        </span>
      </div>

      {/* Preview */}
      {isVent ? (
        <p className="font-sans text-sm text-muted italic">
          🌪️ Wypuszczone — treść nie istnieje. {entry.charCount ? `${entry.charCount} znaków uleciało.` : ''}
        </p>
      ) : (
        <p className={clsx(
          'font-sans text-sm text-muted leading-relaxed line-clamp-2 select-none',
          !status.unlocked && 'blur-sm pointer-events-none',
        )}>
          {entry.content}
        </p>
      )}

      {/* Unlock date for locked letters */}
      {!status.unlocked && !isVent && status.nextUnlockLabel && (
        <p className="mt-3 font-sans text-[11px] text-gold/80 flex items-center gap-1.5">
          <Lock size={10} strokeWidth={2} />
          Otwiera się {status.nextUnlockLabel}
        </p>
      )}

      {/* Reply badge */}
      {replyCount > 0 && status.unlocked && (
        <p className="mt-3 font-sans text-[11px] text-gold flex items-center gap-1.5">
          <MessageCirclePlus size={11} strokeWidth={2} />
          {replyCount} {replyCount === 1 ? 'odpowiedź' : replyCount < 5 ? 'odpowiedzi' : 'odpowiedzi'}
        </p>
      )}
    </button>
  )
}

// ── Expanded Entry View ───────────────────────────────────────────

interface ExpandedEntryProps {
  entry: VaultEntry
  allEntries: VaultEntry[]
  onClose: () => void
  onDelete: (id: string) => void
  onAddReply: (letterId: string, content: string, mood?: MoodState) => Promise<void>
  onDeleteReply: (letterId: string, replyId: string) => void
}

function ExpandedEntry({ entry, allEntries, onClose, onDelete, onAddReply, onDeleteReply }: ExpandedEntryProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [composing, setComposing] = useState(false)
  const meta = letterTypeMeta(entry.letterType)
  const isVent = entry.letterType === 'vent'
  const writingMoodInfo = moodMeta(entry.moodAtWriting)

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-ivory animate-fade-in">
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
        <div className="min-w-0">
          <p className="font-sans text-[10px] text-gold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <span>{meta.emoji}</span> {meta.label}
          </p>
          <p className="font-serif text-dark text-lg mt-0.5 truncate">
            {isVent ? 'Vent — bez treści' : (entry.title || 'List bez tytułu')}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors flex-shrink-0">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Meta strip */}
        <div className="bg-gold-pale/40 rounded-xl px-4 py-3 mb-5 border border-gold/10 space-y-1">
          <p className="font-sans text-[11px] text-muted">
            Napisany {formatDate(entry.dateKey)} · dzień {entry.dayOfProject}
          </p>
          {writingMoodInfo && (
            <p className="font-sans text-xs text-dark/80 flex items-center gap-1.5">
              <span>{writingMoodInfo.emoji}</span>
              <span>Pisałaś gdy czułaś: <span className="font-medium">{writingMoodInfo.label}</span></span>
            </p>
          )}
          {entry.promptUsed && (
            <p className="font-serif text-xs italic text-muted leading-relaxed pt-1">
              &ldquo;{entry.promptUsed}&rdquo;
            </p>
          )}
        </div>

        {/* Content */}
        {isVent ? (
          <div className="bg-cream/60 border border-border rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🌪️</div>
            <p className="font-serif text-dark text-base mb-1">Treść nie istnieje</p>
            <p className="font-sans text-sm text-muted leading-relaxed">
              Tak miało być. {entry.charCount ? `Wypuściłaś ${entry.charCount} znaków` : 'Wypuściłaś to'} — i tyle.
            </p>
          </div>
        ) : (
          <p className="font-sans text-sm text-dark leading-relaxed whitespace-pre-wrap mb-6">{entry.content}</p>
        )}

        {/* Replies */}
        {!isVent && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans text-[10px] text-muted uppercase tracking-widest">
                Twoje odpowiedzi {entry.replies && entry.replies.length > 0 ? `(${entry.replies.length})` : ''}
              </p>
              {!composing && (
                <button
                  onClick={() => setComposing(true)}
                  className="flex items-center gap-1.5 font-sans text-xs text-gold hover:text-dark transition-colors"
                >
                  <MessageCirclePlus size={13} strokeWidth={1.5} />
                  Odpowiedz
                </button>
              )}
            </div>

            {composing && (
              <ReplyComposer
                onSave={(content, mood) => onAddReply(entry.id, content, mood)}
                onCancel={() => setComposing(false)}
              />
            )}

            {entry.replies?.map(r => (
              <ReplyCard
                key={r.id}
                reply={r}
                onDelete={() => onDeleteReply(entry.id, r.id)}
              />
            ))}

            {(!entry.replies || entry.replies.length === 0) && !composing && (
              <p className="font-sans text-xs text-muted-light italic">
                Możesz odpisać sobie z tego momentu — w rocznym raporcie zobaczysz cały dialog.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border flex justify-between items-center">
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-muted">Na pewno usunąć?</span>
            <button
              onClick={() => { onDelete(entry.id); onClose() }}
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
          onClick={onClose}
          className="font-sans text-sm text-muted-light hover:text-dark transition-colors"
        >
          Zamknij
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────

export default function VaultPage() {
  const { entries, loading, addEntry, removeEntry, addReply, removeReply } = useVault()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [writingType, setWritingType] = useState<LetterType | null>(null)
  const [openEntryId, setOpenEntryId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // ?action=write z FAB lub crisis nudge — od razu otwórz picker.
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'write') setPickerOpen(true)
  }, [searchParams])

  const unlockedCount = countUnlocked(entries)
  const openEntry = entries.find(e => e.id === openEntryId) ?? null

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Prywatne</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Skarbiec</h1>
        <p className="font-sans text-sm text-muted">
          Listy w 5 stanach: do siebie z przyszłości, na trudną chwilę, wdzięczność, vent, na konkretną datę.
        </p>
      </div>

      <NextUnlockBanner entries={entries} unlockedCount={unlockedCount} />

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 mb-6 rounded-2xl border border-dashed border-gold/40 text-gold hover:bg-gold-pale transition-all font-sans text-sm"
      >
        <PenLine size={15} strokeWidth={1.5} />
        Napisz nowy list
      </button>

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
              allEntries={entries}
              onOpen={() => setOpenEntryId(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Pisanie — krok 1: wybór typu */}
      {pickerOpen && writingType === null && (
        <LetterTypePicker
          onPick={setWritingType}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Pisanie — krok 2: mood + prompt + treść */}
      {pickerOpen && writingType !== null && (
        <WriteModal
          letterType={writingType}
          onSave={addEntry}
          onBack={() => setWritingType(null)}
          onClose={() => { setPickerOpen(false); setWritingType(null) }}
        />
      )}

      {/* Expanded entry */}
      {openEntry && (
        <ExpandedEntry
          entry={openEntry}
          allEntries={entries}
          onClose={() => setOpenEntryId(null)}
          onDelete={removeEntry}
          onAddReply={addReply}
          onDeleteReply={removeReply}
        />
      )}
    </div>
  )
}
