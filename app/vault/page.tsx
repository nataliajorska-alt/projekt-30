'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { useVault, type NewLetterDraft } from '@/hooks/useVault'
import { Lock, Trash2, X, PenLine, ChevronLeft, MessageCirclePlus } from 'lucide-react'
import {
  LETTER_TYPES, MOOD_STATES,
  type LetterType, type UnlockType, type MoodState, type VaultEntry, type VaultReply,
} from '@/types'
import {
  getUnlockStatus, getNextGlobalUnlock, daysUntil, countUnlocked, gratitudeUnlockDate,
} from '@/lib/vaultUnlock'
import { getRandomPrompt } from '@/lib/vaultPrompts'
import { SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

// ── Helpers ─────────────────────────────────────────────────────

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

// ── Ritual frame ─────────────────────────────────────────────────

function RitualFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[130] bg-forest-deep grain-linen animate-fade-in flex flex-col">
      <div className="pointer-events-none absolute inset-6 border border-gold-light/40" />
      <div className="pointer-events-none absolute inset-9 border border-gold-light/15" />
      <div className="pointer-events-none absolute inset-12">
        <CornerBrackets size={20} tone="gold" weight={1} />
      </div>
      <div className="relative flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  )
}

// ── Banner ──────────────────────────────────────────────────────

function NextUnlockBanner({ entries, unlockedCount }: { entries: VaultEntry[]; unlockedCount: number }) {
  const next = getNextGlobalUnlock(entries)
  const total = entries.filter(e => e.unlockType !== 'never').length
  const days = next ? daysUntil(next.date) : 0
  const allDone = !next && total > 0

  if (allDone) {
    return (
      <div className="bg-ivory border border-gold p-7 text-center mb-6">
        <Fleuron size={16} className="text-gold mx-auto mb-3 inline-block" />
        <h3 className="font-display text-dark text-2xl">Skarbiec otwarty</h3>
        <p className="font-serif-body italic text-muted text-[14px] mt-2">
          masz {unlockedCount} {unlockedCount === 1 ? 'list' : unlockedCount < 5 ? 'listy' : 'listów'} do odczytania.
        </p>
      </div>
    )
  }
  if (!next) return null

  return (
    <div className="relative bg-forest-deep grain-linen text-ivory p-7 text-center mb-6 border border-gold-light/40">
      <CornerBrackets size={14} tone="gold" weight={1} />
      <div className="relative z-10">
        <Fleuron size={14} className="text-gold mx-auto mb-3 inline-block" />
        <SmallCaps tone="gold-light" tracking="editorial" size="xs">
          {unlockedCount > 0 ? 'Następne otwarcie za' : 'Pierwsze otwarcie za'}
        </SmallCaps>
        <p className="font-display text-gold text-6xl leading-none mt-3 mb-1">{days}</p>
        <p className="font-serif-body italic text-parchment text-[14px]">
          {days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'} · {next.label}
        </p>
        {unlockedCount > 0 && (
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" className="mt-3 block opacity-70">
            już otwarte · {unlockedCount}
          </SmallCaps>
        )}
        <GoldRule variant="diamond" tone="gold" className="my-5 max-w-xs mx-auto opacity-60" />
        <p className="font-serif-body italic text-parchment/80 text-[13px] leading-relaxed max-w-xs mx-auto">
          „piszesz jako natalia 30 — ona już wie, jak się skończyło."
        </p>
      </div>
    </div>
  )
}

// ── Letter Type Picker ─────────────────────────────────────────

function LetterTypePicker({ onPick, onClose }: {
  onPick: (type: LetterType) => void
  onClose: () => void
}) {
  return (
    <RitualFrame>
      <div className="flex items-center justify-between px-7 pt-8 pb-4 shrink-0">
        <div>
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Skarbiec · Nowy list
          </SmallCaps>
          <h2 className="font-display text-ivory text-3xl mt-1 leading-tight">
            Jaki to ma być list?
          </h2>
        </div>
        <button onClick={onClose} className="text-parchment/50 hover:text-ivory transition-colors">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>
      <GoldRule variant="plain" tone="gold-deep" className="opacity-40 mx-7" />
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-3">
        {LETTER_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => onPick(t.value)}
            className="w-full text-left bg-forest/20 border border-gold-light/30 p-5 hover:bg-forest/40 hover:border-gold transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl flex-shrink-0">{t.emoji}</div>
              <div className="flex-1">
                <h3 className="font-heading text-ivory text-lg leading-tight">{t.label}</h3>
                <p className="font-serif-body italic text-parchment text-[13.5px] mt-2 leading-relaxed">
                  {t.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </RitualFrame>
  )
}

// ── Write Modal ─────────────────────────────────────────────────

function WriteModal({ letterType, onSave, onBack, onClose }: {
  letterType: LetterType
  onSave: (draft: NewLetterDraft) => Promise<void>
  onBack: () => void
  onClose: () => void
}) {
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

  useEffect(() => { textareaRef.current?.focus() }, [])

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
    <RitualFrame>
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-8 pb-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="text-parchment/50 hover:text-ivory transition-colors shrink-0">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="min-w-0">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">
              <span className="inline-flex items-center gap-1.5">
                <span>{meta.emoji}</span> {meta.label}
              </span>
            </SmallCaps>
            <h2 className="font-display text-ivory text-2xl mt-1 leading-tight truncate">
              {isVent ? 'Pisz. Nikt tego nie przeczyta.' : 'Piszę jako Natalia 30'}
            </h2>
          </div>
        </div>
        <button onClick={onClose} className="text-parchment/50 hover:text-ivory transition-colors shrink-0">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>
      <GoldRule variant="plain" tone="gold-deep" className="opacity-40 mx-7" />

      {/* Mood */}
      <div className="px-7 py-4 shrink-0">
        <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
          Jak się teraz czujesz?
        </SmallCaps>
        <div className="flex gap-2 flex-wrap">
          {MOOD_STATES.map(m => {
            const sel = mood === m.value
            return (
              <button
                key={m.value}
                onClick={() => setMood(prev => prev === m.value ? null : m.value)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 border transition-all',
                  sel
                    ? 'bg-forest/60 border-gold'
                    : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                )}
              >
                <span className="text-base">{m.emoji}</span>
                <SmallCaps tone={sel ? 'gold-light' : 'parchment'} tracking="luxury" size="xs">
                  {m.label}
                </SmallCaps>
              </button>
            )
          })}
        </div>
      </div>

      {/* Prompt */}
      {!isVent && (
        <div className="px-7 py-4 bg-gold/8 border-y border-gold-light/20 shrink-0">
          {usePrompt && prompt ? (
            <>
              <p className="font-serif-body italic text-parchment text-[13.5px] leading-relaxed">
                „{prompt}"
              </p>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => setPrompt(getRandomPrompt(letterType, prompt ?? undefined))}
                  className="font-ui uppercase tracking-luxury text-[10px] text-gold-light hover:text-gold transition-colors"
                >
                  Inny prompt ↻
                </button>
                <button
                  onClick={() => setUsePrompt(false)}
                  className="font-ui uppercase tracking-luxury text-[10px] text-parchment/60 hover:text-parchment transition-colors"
                >
                  Pisz bez promptu
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { setUsePrompt(true); setPrompt(getRandomPrompt(letterType)) }}
              className="font-ui uppercase tracking-luxury text-[10px] text-gold-light hover:text-gold transition-colors"
            >
              Pokaż prompt ↻
            </button>
          )}
        </div>
      )}

      {/* Custom date */}
      {isCustomDate && (
        <div className="px-7 py-4 shrink-0">
          <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Otwiera się w dniu
          </SmallCaps>
          <input
            type="date"
            value={unlockDate}
            onChange={e => setUnlockDate(e.target.value)}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            className="w-full font-serif-body text-[14px] text-ivory bg-forest/20 border border-ivory/15 px-3 py-2.5 outline-none focus:border-gold transition-colors"
          />
        </div>
      )}

      {/* Form */}
      <div className="flex-1 flex flex-col px-7 py-5 gap-3 overflow-y-auto min-h-0">
        {!isVent && (
          <input
            type="text"
            placeholder="tytuł listu (opcjonalny)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full font-display text-2xl text-ivory bg-transparent border-none outline-none placeholder:text-parchment/30"
          />
        )}
        <textarea
          ref={textareaRef}
          placeholder={isVent ? 'wypuść wszystko. nic z tego nie zostanie zapisane.' : 'zaczynam pisać…'}
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1 w-full font-serif-body text-[15px] text-ivory bg-transparent border-none outline-none resize-none placeholder:text-parchment/30 leading-relaxed min-h-[300px]"
        />
      </div>

      {/* Footer */}
      <GoldRule variant="plain" tone="gold-deep" className="opacity-40 mx-7" />
      <div className="px-7 py-5 flex items-center justify-between shrink-0">
        <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
          {content.length > 0 ? `${content.length} znaków` : 'zacznij pisać…'}
        </SmallCaps>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="bg-gold text-dark-deep border border-gold px-6 py-3 disabled:opacity-40 hover:bg-gold-light transition-colors flex items-center gap-2"
        >
          <Diamond size={5} className="text-dark-deep" filled />
          <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
            {saving ? 'zapisuję…' : isVent ? 'wypuść' : 'zamknij w skarbcu'}
          </SmallCaps>
          <Diamond size={5} className="text-dark-deep" filled />
        </button>
      </div>
    </RitualFrame>
  )
}

// ── Reply composer ──────────────────────────────────────────────

function ReplyComposer({ onSave, onCancel }: {
  onSave: (content: string, mood?: MoodState) => Promise<void>
  onCancel: () => void
}) {
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
    <div className="bg-cream/60 border border-gold-light/40 p-4 mb-3">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-2.5">
        Twoja odpowiedź
      </SmallCaps>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {MOOD_STATES.map(m => {
          const sel = mood === m.value
          return (
            <button
              key={m.value}
              onClick={() => setMood(prev => prev === m.value ? null : m.value)}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 border transition-all',
                sel
                  ? 'bg-dark-deep text-ivory border-gold'
                  : 'bg-ivory text-muted border-hairline hover:border-gold-light'
              )}
            >
              <span className="text-xs">{m.emoji}</span>
              <SmallCaps tone={sel ? 'ivory' : 'muted'} tracking="luxury" size="xs">
                {m.label}
              </SmallCaps>
            </button>
          )
        })}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="co chcesz teraz powiedzieć tamtej tobie?"
        className="w-full bg-ivory border border-hairline outline-none p-3 font-serif-body italic text-[14px] text-dark min-h-[120px] resize-none focus:border-gold"
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-dark px-3 py-1.5 transition-colors"
        >
          anuluj
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="bg-dark-deep text-ivory border border-gold px-4 py-1.5 disabled:opacity-40 hover:bg-forest transition-colors flex items-center gap-2"
        >
          <Diamond size={4} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            {saving ? 'zapisuję…' : 'dodaj odpowiedź'}
          </SmallCaps>
        </button>
      </div>
    </div>
  )
}

// ── Reply card ──────────────────────────────────────────────────

function ReplyCard({ reply, onDelete }: { reply: VaultReply; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const moodInfo = moodMeta(reply.moodAtWriting)
  return (
    <div className="bg-ivory border border-hairline p-4 mb-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            {formatDate(reply.dateKey)} · dzień {reply.dayOfProject}
          </SmallCaps>
          {moodInfo && (
            <span className="inline-flex items-center gap-1 border border-hairline px-2 py-0.5">
              <span className="text-xs">{moodInfo.emoji}</span>
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                {moodInfo.label}
              </SmallCaps>
            </span>
          )}
        </div>
        {confirm ? (
          <div className="flex items-center gap-2">
            <button onClick={onDelete} className="font-ui uppercase tracking-luxury text-[10px] text-red-500 hover:text-red-700">
              usuń
            </button>
            <button onClick={() => setConfirm(false)} className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-dark">
              anuluj
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="text-muted-light hover:text-dark">
            <Trash2 size={11} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <p className="font-serif-body italic text-dark text-[14px] leading-relaxed whitespace-pre-wrap">
        {reply.content}
      </p>
    </div>
  )
}

// ── Entry card ──────────────────────────────────────────────────

function EntryCard({ entry, allEntries, onOpen }: {
  entry: VaultEntry
  allEntries: VaultEntry[]
  onOpen: () => void
}) {
  const status = getUnlockStatus(entry, allEntries)
  const meta = letterTypeMeta(entry.letterType)
  const isVent = entry.letterType === 'vent'
  const replyCount = entry.replies?.length ?? 0
  const canOpen = status.unlocked || isVent

  return (
    <button
      onClick={() => canOpen && onOpen()}
      className={clsx(
        'w-full text-left bg-ivory border p-5 transition-all',
        canOpen
          ? 'border-gold-light/60 hover:border-gold cursor-pointer'
          : 'border-hairline cursor-default'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {!status.unlocked && !isVent && (
              <Lock size={11} className="text-muted-light shrink-0" strokeWidth={1.5} />
            )}
            <span className="text-base shrink-0">{meta.emoji}</span>
            <h3 className="font-heading text-dark text-[16px] truncate">
              {isVent ? 'Vent' : (entry.title || 'List bez tytułu')}
            </h3>
          </div>
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            {meta.label} · dzień {entry.dayOfProject} · {formatDate(entry.dateKey)}
          </SmallCaps>
        </div>
        <span className="font-display text-gold-deep text-sm border border-gold-light/40 px-2 py-0.5 shrink-0">
          {toRoman(entry.dayOfProject)}
        </span>
      </div>

      {isVent ? (
        <p className="font-serif-body italic text-muted text-[13px] leading-snug">
          ◆ wypuszczone — treść nie istnieje. {entry.charCount ? `${entry.charCount} znaków uleciało.` : ''}
        </p>
      ) : (
        <p className={clsx(
          'font-serif-body text-muted text-[13.5px] leading-relaxed line-clamp-2 select-none',
          !status.unlocked && 'blur-sm pointer-events-none'
        )}>
          {entry.content}
        </p>
      )}

      {!status.unlocked && !isVent && status.nextUnlockLabel && (
        <div className="mt-3 flex items-center gap-1.5">
          <Lock size={9} strokeWidth={1.5} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            otwiera się {status.nextUnlockLabel}
          </SmallCaps>
        </div>
      )}

      {replyCount > 0 && status.unlocked && (
        <div className="mt-3 flex items-center gap-1.5">
          <MessageCirclePlus size={10} strokeWidth={1.5} className="text-gold" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            {replyCount} {replyCount === 1 ? 'odpowiedź' : replyCount < 5 ? 'odpowiedzi' : 'odpowiedzi'}
          </SmallCaps>
        </div>
      )}
    </button>
  )
}

// ── Expanded entry ──────────────────────────────────────────────

function ExpandedEntry({ entry, onClose, onDelete, onAddReply, onDeleteReply }: {
  entry: VaultEntry
  allEntries: VaultEntry[]
  onClose: () => void
  onDelete: (id: string) => void
  onAddReply: (letterId: string, content: string, mood?: MoodState) => Promise<void>
  onDeleteReply: (letterId: string, replyId: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [composing, setComposing] = useState(false)
  const meta = letterTypeMeta(entry.letterType)
  const isVent = entry.letterType === 'vent'
  const writingMoodInfo = moodMeta(entry.moodAtWriting)

  return (
    <RitualFrame>
      <div className="flex items-center justify-between px-7 pt-8 pb-4 shrink-0">
        <div className="min-w-0">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            <span className="inline-flex items-center gap-1.5">
              <span>{meta.emoji}</span> {meta.label}
            </span>
          </SmallCaps>
          <h2 className="font-display text-ivory text-3xl mt-1 leading-tight truncate">
            {isVent ? 'Vent — bez treści' : (entry.title || 'List bez tytułu')}
          </h2>
        </div>
        <button onClick={onClose} className="text-parchment/50 hover:text-ivory transition-colors shrink-0">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>
      <GoldRule variant="plain" tone="gold-deep" className="opacity-40 mx-7" />

      <div className="flex-1 overflow-y-auto px-7 py-6">
        {/* Meta strip */}
        <div className="bg-forest/30 border border-gold-light/20 px-5 py-4 mb-6 space-y-1">
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-80">
            Napisany {formatDate(entry.dateKey)} · dzień {entry.dayOfProject}
          </SmallCaps>
          {writingMoodInfo && (
            <p className="font-serif-body italic text-parchment text-[13px] flex items-center gap-1.5">
              <span>{writingMoodInfo.emoji}</span>
              <span>pisałaś gdy czułaś: <span className="text-ivory not-italic">{writingMoodInfo.label}</span></span>
            </p>
          )}
          {entry.promptUsed && (
            <p className="font-serif-body italic text-parchment/70 text-[12.5px] leading-relaxed pt-1">
              „{entry.promptUsed}"
            </p>
          )}
        </div>

        {/* Content */}
        {isVent ? (
          <div className="bg-forest/20 border border-gold-light/20 p-7 text-center">
            <Fleuron size={14} className="text-gold mx-auto mb-3 inline-block" />
            <h3 className="font-display text-ivory text-2xl">Treść nie istnieje</h3>
            <p className="font-serif-body italic text-parchment text-[14px] mt-2 leading-relaxed">
              tak miało być. {entry.charCount ? `wypuściłaś ${entry.charCount} znaków` : 'wypuściłaś to'} — i tyle.
            </p>
          </div>
        ) : (
          <div className="relative bg-ivory/95 px-6 py-7 mb-6">
            <Fleuron size={11} className="text-gold absolute -top-2 left-1/2 -translate-x-1/2 bg-forest-deep px-1" />
            <p className="font-serif-body text-dark text-[15px] leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        )}

        {/* Replies */}
        {!isVent && (
          <div className="mt-7">
            <div className="flex items-center justify-between mb-4">
              <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                Twoje odpowiedzi {entry.replies && entry.replies.length > 0 ? `· ${entry.replies.length}` : ''}
              </SmallCaps>
              {!composing && (
                <button
                  onClick={() => setComposing(true)}
                  className="flex items-center gap-1.5 text-gold-light hover:text-ivory transition-colors"
                >
                  <MessageCirclePlus size={11} strokeWidth={1.5} />
                  <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                    odpowiedz
                  </SmallCaps>
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
              <p className="font-serif-body italic text-parchment/70 text-[12.5px]">
                możesz odpisać sobie z tego momentu — w rocznym raporcie zobaczysz cały dialog.
              </p>
            )}
          </div>
        )}
      </div>

      <GoldRule variant="plain" tone="gold-deep" className="opacity-40 mx-7" />
      <div className="px-7 py-5 flex justify-between items-center shrink-0">
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <SmallCaps tone="parchment" tracking="luxury" size="xs">na pewno usunąć?</SmallCaps>
            <button
              onClick={() => { onDelete(entry.id); onClose() }}
              className="font-ui uppercase tracking-luxury text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              usuń
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment"
            >
              anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-parchment/50 hover:text-parchment transition-colors"
          >
            <Trash2 size={12} strokeWidth={1.5} />
            <SmallCaps tracking="luxury" size="xs">
              <span className="!text-current">usuń</span>
            </SmallCaps>
          </button>
        )}
        <button
          onClick={onClose}
          className="font-ui uppercase tracking-luxury text-[10px] text-parchment/60 hover:text-parchment transition-colors"
        >
          zamknij
        </button>
      </div>
    </RitualFrame>
  )
}

// ── Page ────────────────────────────────────────────────────────

export default function VaultPage() {
  const { entries, loading, addEntry, removeEntry, addReply, removeReply } = useVault()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [writingType, setWritingType] = useState<LetterType | null>(null)
  const [openEntryId, setOpenEntryId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'write') setPickerOpen(true)
  }, [searchParams])

  const unlockedCount = countUnlocked(entries)
  const openEntry = entries.find(e => e.id === openEntryId) ?? null

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-7">
        <SmallCaps tone="muted" tracking="editorial" size="xs">
          Prywatne · Vol. I
        </SmallCaps>
        <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
          Skarbiec
        </h1>
        <p className="font-serif-body italic text-muted text-[14px] mt-2 leading-relaxed">
          listy w pięciu stanach: do siebie z przyszłości, na trudną chwilę,
          wdzięczność, vent, na konkretną datę.
        </p>
        <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />
      </header>

      <NextUnlockBanner entries={entries} unlockedCount={unlockedCount} />

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full flex items-center justify-center gap-3 py-4 mb-6 border border-dashed border-gold/50 text-gold-deep hover:border-gold hover:bg-gold-pale/30 transition-all group"
      >
        <PenLine size={13} strokeWidth={1.5} />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Napisz nowy list
        </SmallCaps>
        <Fleuron size={9} className="text-gold-deep/70 group-hover:text-gold transition-colors" />
      </button>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="bg-cream border border-hairline h-24 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-ivory border border-gold-light/40 px-6 py-14 text-center">
          <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
          <h3 className="font-display text-dark text-2xl">Skarbiec czeka</h3>
          <p className="font-serif-body italic text-muted text-[14px] mt-2">
            napisz pierwszy list — natalia 30 ma już coś do powiedzenia.
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

      {pickerOpen && writingType === null && (
        <LetterTypePicker
          onPick={setWritingType}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {pickerOpen && writingType !== null && (
        <WriteModal
          letterType={writingType}
          onSave={addEntry}
          onBack={() => setWritingType(null)}
          onClose={() => { setPickerOpen(false); setWritingType(null) }}
        />
      )}

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
