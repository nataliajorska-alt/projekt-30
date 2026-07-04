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
import WaxSeal from '@/components/WaxSeal'
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

// ── Kategorie listów (paleta + pieczęć) ──────────────────────────

type CatSlug = 'wdziecznosc' | 'przyszlosc' | 'trudna' | 'vent' | 'data'
const CATEGORY: Record<LetterType, { slug: CatSlug; color: string; mono: string; tag: string }> = {
  gratitude: { slug: 'wdziecznosc', color: '#8E7338', mono: 'W', tag: 'Wdzięczność' },
  future:    { slug: 'przyszlosc',  color: '#4F5F42', mono: 'P', tag: 'Do siebie z przyszłości' },
  crisis:    { slug: 'trudna',      color: '#B56A6A', mono: 'T', tag: 'Na trudną chwilę' },
  vent:      { slug: 'vent',        color: '#8A3A2C', mono: 'V', tag: 'Vent' },
  date:      { slug: 'data',        color: '#4D6173', mono: 'D', tag: 'Na konkretną datę' },
}

const PL_MON_ABBR = ['STY','LUT','MAR','KWI','MAJ','CZE','LIP','SIE','WRZ','PAŹ','LIS','GRU']
function shortDate(d: Date): string {
  const y = d.getFullYear()
  const curY = new Date().getFullYear()
  return `${d.getDate()} ${PL_MON_ABBR[d.getMonth()]}${y !== curY ? ` ’${String(y).slice(2)}` : ''}`
}

// % dojrzewania listu: od napisania (createdAt) do daty otwarcia.
function maturation(entry: VaultEntry, unlockDate: Date | undefined, now = new Date()): number | null {
  if (!unlockDate) return null
  const written = new Date(entry.createdAt).getTime()
  const target = unlockDate.getTime()
  if (!Number.isFinite(written) || target <= written) return 100
  const pct = ((now.getTime() - written) / (target - written)) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
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

// ── Vault countdown (ciemna wstęga, 3 kolumny) ───────────────────

function VaultStat({ roman, lbl, sub }: { roman: string; lbl: React.ReactNode; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-7 text-center">
      <div className="font-display text-[28px] leading-none text-gold-pale">{roman}</div>
      <span className="w-7 h-px bg-gold-light/50" />
      <div className="font-ui uppercase text-[8px] tracking-[0.3em] text-gold-light leading-[1.8]">{lbl}</div>
      <div className="font-serif-body italic text-[13px] text-parchment/70">{sub}</div>
    </div>
  )
}

function VaultCountdown({ entries, unlockedCount }: { entries: VaultEntry[]; unlockedCount: number }) {
  const now = new Date()
  const sealed = entries.filter(e => {
    const s = getUnlockStatus(e, entries, now)
    return !s.unlocked && !s.contentHidden
  })
  const statesInUse = new Set(entries.map(e => e.letterType)).size
  const next = getNextGlobalUnlock(entries, now)
  const days = next ? daysUntil(next.date, now) : 0

  let longest: Date | null = null
  for (const e of entries) {
    const s = getUnlockStatus(e, entries, now)
    if (s.unlocked || !s.nextUnlockDate) continue
    if (!longest || s.nextUnlockDate > longest) longest = s.nextUnlockDate
  }

  // Wszystko otwarte / nic nie czeka
  if (!next) {
    return (
      <section className="relative bg-dark text-ivory border border-gold-light/45 p-8 sm:p-10 text-center mb-6">
        <CornerBrackets size={14} tone="gold" weight={1} />
        <Fleuron size={16} className="text-gold mx-auto mb-3 inline-block" />
        <h3 className="font-display text-gold-pale text-3xl">Skarbiec otwarty</h3>
        <p className="font-serif-body italic text-parchment text-[14px] mt-2">
          masz {unlockedCount} {unlockedCount === 1 ? 'list' : unlockedCount < 5 ? 'listy' : 'listów'} do odczytania.
        </p>
      </section>
    )
  }

  const statesWord = statesInUse === 1 ? 'stan w użyciu' : statesInUse < 5 ? 'stany w użyciu' : 'stanów w użyciu'

  return (
    <section className="relative bg-dark text-ivory border border-gold-light/45 mb-6">
      <div className="pointer-events-none absolute inset-[7px] border border-gold-light/25" />
      <CornerBrackets size={14} tone="gold" weight={1} />
      <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_1.6fr_1fr] items-stretch divide-y sm:divide-y-0 sm:divide-x divide-gold-light/20">
        <VaultStat roman={toRoman(sealed.length)} lbl={<>listów<br />zapieczętowanych</>} sub={`${toRoman(statesInUse)} ${statesWord}`} />
        <div className="text-center px-6 py-8">
          <div className="font-ui uppercase text-[9px] tracking-[0.4em] text-gold-light flex items-center justify-center gap-3">
            <span className="text-gold">∴</span>
            {unlockedCount > 0 ? 'Następne otwarcie za' : 'Pierwsze otwarcie za'}
            <span className="text-gold">∴</span>
          </div>
          <div className="font-display text-gold-light text-[clamp(3.5rem,11vw,5.25rem)] leading-none mt-2.5">{days}</div>
          <div className="font-serif-body italic text-[16px] text-parchment mt-1.5">
            {days === 1 ? 'dzień' : 'dni'} · {next.label}
          </div>
          <div className="relative w-[220px] max-w-full h-px bg-gold-light/45 my-4 mx-auto">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark px-2 text-gold text-[8px]">◆</span>
          </div>
          <p className="font-serif-body italic text-[14px] text-parchment/70 max-w-[420px] mx-auto">
            „piszesz jako natalia 30 — ona już wie, jak się skończyło."
          </p>
        </div>
        {longest
          ? <VaultStat roman={toRoman(daysUntil(longest, now))} lbl={<>dni czeka<br />najcierpliwszy list</>} sub={`do ${shortDate(longest).toLowerCase()}`} />
          : <VaultStat roman="—" lbl={<>dni czeka<br />najcierpliwszy list</>} sub="—" />}
      </div>
    </section>
  )
}

// ── Oś otwarć (timeline SVG) ─────────────────────────────────────

function OpeningsAxis({ entries }: { entries: VaultEntry[] }) {
  const now = new Date()
  const upcoming = entries
    .map(e => ({ e, date: getUnlockStatus(e, entries, now).nextUnlockDate, unlocked: getUnlockStatus(e, entries, now).unlocked }))
    .filter((x): x is { e: VaultEntry; date: Date; unlocked: boolean } => !x.unlocked && !!x.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6)

  if (upcoming.length === 0) return null

  const W = 1320, padL = 40, padR = 40, baseY = 80
  const first = 250
  const last = W - padR - 30
  const N = upcoming.length
  const X = (i: number) => (N === 1 ? (first + last) / 2 : first + (i / (N - 1)) * (last - first))

  const catsPresent = Array.from(new Set(upcoming.map(u => u.e.letterType)))

  return (
    <section className="relative bg-cream border border-hairline p-7 sm:p-9 mb-6">
      <span className="absolute top-2 left-2 w-2.5 h-2.5 border-l border-t border-gold-light/85" />
      <span className="absolute bottom-2 right-2 w-2.5 h-2.5 border-r border-b border-gold-light/85" />
      <div className="font-ui uppercase text-[9px] tracking-[0.34em] text-gold-deep flex items-center gap-2.5">
        <span className="text-gold text-[7px]">◆</span> Oś otwarć · {toRoman(N)} {N === 1 ? 'pieczęć' : N < 5 ? 'pieczęcie' : 'pieczęci'}
      </div>
      <h2 className="font-display text-dark text-lg mt-2.5 tracking-tight">Kiedy listy wracają</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1.5">listy w kolejności otwierania — romb znaczy stan listu.</p>

      <div className="mt-6 w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} 150`} className="w-full block" style={{ minWidth: 560 }} role="img" aria-label="Oś czasu otwarć listów">
          <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} stroke="#D9CDA8" strokeWidth={1.4} />
          {/* segmenty + dziś */}
          <line x1={padL + 6} y1={baseY} x2={X(0) - 6} y2={baseY} stroke={CATEGORY[upcoming[0].e.letterType].color} strokeWidth={2.4} opacity={0.55} />
          {upcoming.slice(1).map((u, i) => (
            <line key={`seg-${i}`} x1={X(i) + 6} y1={baseY} x2={X(i + 1) - 6} y2={baseY} stroke={CATEGORY[u.e.letterType].color} strokeWidth={2.4} opacity={0.55} />
          ))}
          {/* dziś */}
          <rect x={padL - 5.5} y={baseY - 5.5} width={11} height={11} transform={`rotate(45 ${padL} ${baseY})`} fill="#1D231F" />
          <line x1={padL} y1={baseY - 6} x2={padL} y2={baseY - 26} stroke="#D9CDA8" strokeWidth={1} />
          <text x={padL} y={baseY - 34} textAnchor="middle" fontSize={14} fontStyle="italic" fill="#1D231F" fontFamily="'Bodoni Moda', serif">dziś</text>
          <text x={padL} y={baseY + 24} textAnchor="middle" fontSize={11} letterSpacing="0.14em" fill="#1D231F" fontFamily="Inter, sans-serif">{shortDate(now)}</text>
          {/* pieczęcie */}
          {upcoming.map((u, i) => {
            const c = CATEGORY[u.e.letterType].color
            const x = X(i)
            return (
              <g key={u.e.id}>
                <rect x={x - 5.5} y={baseY - 5.5} width={11} height={11} transform={`rotate(45 ${x} ${baseY})`} fill={c} />
                <line x1={x} y1={baseY - 6} x2={x} y2={baseY - 26} stroke="#D9CDA8" strokeWidth={1} />
                <text x={x} y={baseY - 34} textAnchor="middle" fontSize={17} fontStyle="italic" fill={c} fontFamily="'Bodoni Moda', serif">{toRoman(u.e.dayOfProject)}</text>
                <text x={x} y={baseY + 24} textAnchor="middle" fontSize={11} letterSpacing="0.14em" fill="#2A2A26" fontFamily="Inter, sans-serif">{shortDate(u.date)}</text>
                <text x={x} y={baseY + 44} textAnchor="middle" fontSize={13} fontStyle="italic" fill="#8A7A55" fontFamily="'Cormorant Garamond', serif">za {daysUntil(u.date, now)} dni</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-3.5 border-t border-border">
        {catsPresent.map(lt => (
          <div key={lt} className="flex items-center gap-2.5 font-ui uppercase text-[9px] tracking-[0.22em] text-muted">
            <span className="w-[9px] h-[9px] rotate-45" style={{ background: CATEGORY[lt].color }} />
            {CATEGORY[lt].tag.toLowerCase()}
          </div>
        ))}
        <div className="flex items-center gap-2.5 font-ui uppercase text-[9px] tracking-[0.22em] text-muted">
          <span className="w-[9px] h-[9px] rotate-45 bg-dark" /> dziś
        </div>
      </div>
    </section>
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
            className="w-full font-display text-2xl text-ivory bg-transparent border-none outline-none placeholder:text-parchment/50"
          />
        )}
        <textarea
          ref={textareaRef}
          placeholder={isVent ? 'wypuść wszystko. nic z tego nie zostanie zapisane.' : 'zaczynam pisać…'}
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1 w-full font-serif-body text-[15px] text-ivory bg-transparent border-none outline-none resize-none placeholder:text-parchment/50 leading-relaxed min-h-[300px]"
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

function LetterCard({ entry, allEntries, onOpen }: {
  entry: VaultEntry
  allEntries: VaultEntry[]
  onOpen: () => void
}) {
  const status = getUnlockStatus(entry, allEntries)
  const isVent = entry.letterType === 'vent'
  const cat = CATEGORY[entry.letterType]
  const canOpen = status.unlocked || isVent
  const replyCount = entry.replies?.length ?? 0
  const mat = !status.unlocked && !isVent ? maturation(entry, status.nextUnlockDate) : null
  const [cracking, setCracking] = useState(false)

  // Rytuał łamania pieczęci: tylko przy PIERWSZYM otwarciu listu (localStorage),
  // przy reduced-motion i kolejnych wejściach list otwiera się od razu.
  const handleOpen = () => {
    if (!canOpen || cracking) return
    const storageKey = `vault_opened_${entry.id}`
    let first = false
    try {
      first = !localStorage.getItem(storageKey)
      if (first) localStorage.setItem(storageKey, '1')
    } catch { /* prywatny tryb — po prostu bez rytuału */ }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (first && !reduced) {
      setCracking(true)
      setTimeout(() => { onOpen(); setCracking(false) }, 620)
    } else {
      onOpen()
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={clsx(
        'relative w-full text-left bg-ivory border border-hairline pl-[27px] pr-8 py-6 block',
        canOpen ? 'cursor-pointer hover:border-gold-light transition-colors' : 'cursor-default'
      )}
      style={{ borderLeft: `3px solid ${cat.color}` }}
    >
      <span className="absolute bottom-2 right-2 w-2.5 h-2.5 border-r border-b border-gold-light/85" />

      {/* Head: seal · id · day-badge */}
      <div className="flex items-center gap-4">
        <WaxSeal color={cat.color} monogram={cat.mono} size={46} breaking={cracking} />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-medium text-[20px] text-dark tracking-tight truncate">
            {isVent ? 'Vent' : entry.title || <span className="text-muted italic font-normal">List bez tytułu</span>}
          </h3>
          <div className="mt-1.5 font-ui uppercase text-[9px] tracking-[0.26em] text-muted flex items-center gap-2.5 flex-wrap">
            <span style={{ color: cat.color }}>{cat.tag}</span>
            <span className="text-muted-light">·</span>
            <span>napisany {formatDate(entry.dateKey)}</span>
          </div>
        </div>
        <span className="shrink-0 min-w-[54px] text-center border border-hairline bg-cream px-3 py-2 font-display italic font-medium text-[17px] text-gold-deep">
          {toRoman(entry.dayOfProject)}
          <span className="block font-ui not-italic text-[7px] tracking-[0.26em] text-muted-light uppercase mt-0.5">dzień</span>
        </span>
      </div>

      {/* Body */}
      {isVent ? (
        <p className="font-serif-body italic text-muted text-[13.5px] leading-snug mt-5 ml-16">
          ◆ wypuszczone — treść nie istnieje.{entry.charCount ? ` ${entry.charCount} znaków uleciało.` : ''}
        </p>
      ) : status.unlocked ? (
        <div className="mt-5 ml-16 relative bg-paper-2 border border-border px-5 py-4" style={{ background: '#EFE9D9' }}>
          <p className="font-serif-body text-dark text-[14px] leading-relaxed line-clamp-3 whitespace-pre-wrap">{entry.content}</p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <Diamond size={4} className="text-gold" filled />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">otwarty · czytaj</SmallCaps>
            {replyCount > 0 && (
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="ml-2">
                · {replyCount} {replyCount === 1 ? 'odpowiedź' : 'odpowiedzi'}
              </SmallCaps>
            )}
          </div>
        </div>
      ) : (
        // Sealed — redacted ink lines
        <div className="mt-5 ml-16 relative bg-paper-2 border border-border px-5 py-4 overflow-hidden" style={{ background: '#EFE9D9' }}>
          <div className="h-2 my-[7px]" style={{ background: 'repeating-linear-gradient(90deg, rgba(42,42,38,.16) 0 26px, transparent 26px 34px, rgba(42,42,38,.13) 34px 78px, transparent 78px 86px, rgba(42,42,38,.17) 86px 132px, transparent 132px 140px)' }} />
          <div className="h-2 my-[7px] w-[92%]" style={{ background: 'repeating-linear-gradient(90deg, rgba(42,42,38,.13) 0 44px, transparent 44px 52px, rgba(42,42,38,.16) 52px 84px, transparent 84px 92px)' }} />
          <div className="h-2 my-[7px] w-[55%]" style={{ background: 'repeating-linear-gradient(90deg, rgba(42,42,38,.16) 0 26px, transparent 26px 34px, rgba(42,42,38,.13) 34px 78px)' }} />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-ivory border border-hairline px-3 py-1.5 font-ui uppercase text-[8px] tracking-[0.3em] text-muted">
            <Lock size={11} strokeWidth={1.6} className="text-gold-deep" />
            zapieczętowany
          </div>
        </div>
      )}

      {/* Footer: opening + maturation */}
      {!status.unlocked && !isVent && (
        <div className="mt-4 ml-16 flex items-center gap-6 flex-wrap">
          {status.nextUnlockLabel && (
            <div className="flex items-center gap-2 font-ui uppercase text-[9px] tracking-[0.26em] text-muted whitespace-nowrap">
              <Lock size={12} strokeWidth={1.6} className="text-gold-deep" />
              otwiera się <b className="font-medium text-ink-text" style={{ color: '#2A2A26' }}>{status.nextUnlockLabel}</b>
              {status.nextUnlockDate && <span className="text-muted-light">· za {daysUntil(status.nextUnlockDate)} dni</span>}
            </div>
          )}
          {mat != null && (
            <div className="flex-1 flex items-center gap-3.5 min-w-[140px]">
              <div className="flex-1 h-[2px] bg-border relative">
                <div className="absolute left-0 top-0 bottom-0 transition-all duration-700" style={{ width: `${mat}%`, background: cat.color }} />
                <span className="absolute top-1/2 w-[7px] h-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ivory" style={{ left: `${mat}%`, border: `1px solid ${cat.color}` }} />
              </div>
              <span className="font-serif-body italic text-[13px] text-muted whitespace-nowrap">
                dojrzewa · <b className="not-italic font-display font-medium text-gold-deep">{mat}%</b>
              </span>
            </div>
          )}
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
  const [filter, setFilter] = useState<LetterType | 'all'>('all')
  const searchParams = useSearchParams()

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'write') setPickerOpen(true)
  }, [searchParams])

  const unlockedCount = countUnlocked(entries)
  const openEntry = entries.find(e => e.id === openEntryId) ?? null

  const catCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.letterType] = (acc[e.letterType] ?? 0) + 1
    return acc
  }, {})
  const filtered = filter === 'all' ? entries : entries.filter(e => e.letterType === filter)
  const CHIP_ORDER: LetterType[] = ['gratitude', 'future', 'crisis', 'vent', 'date']

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
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

      {!loading && entries.length > 0 && (
        <VaultCountdown entries={entries} unlockedCount={unlockedCount} />
      )}

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full flex items-center justify-center gap-3 py-4 mb-6 border border-dashed border-gold-light text-gold-deep hover:border-gold hover:bg-gold/[0.07] transition-all group"
      >
        <PenLine size={13} strokeWidth={1.5} />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Napisz nowy list
        </SmallCaps>
        <Fleuron size={9} className="text-gold-deep/70 group-hover:text-gold transition-colors" />
      </button>

      {!loading && entries.length > 0 && <OpeningsAxis entries={entries} />}

      {/* Filtry stanu */}
      {!loading && entries.length > 0 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0 mr-1">Stan</SmallCaps>
          {(['all', ...CHIP_ORDER] as (LetterType | 'all')[]).map(key => {
            const count = key === 'all' ? entries.length : (catCounts[key] ?? 0)
            const on = filter === key
            const label = key === 'all' ? 'Wszystkie' : CATEGORY[key].tag
            const disabled = key !== 'all' && count === 0
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setFilter(key)}
                className={clsx(
                  'shrink-0 inline-flex items-baseline gap-1.5 border px-3 py-2 font-ui uppercase text-[9px] tracking-[0.16em] whitespace-nowrap transition-colors',
                  disabled
                    ? 'opacity-45 border-hairline text-muted cursor-default'
                    : on
                      ? 'border-gold-deep text-dark bg-gold/[0.08]'
                      : 'border-hairline text-muted hover:text-dark hover:border-gold-light'
                )}
              >
                {label}
                <span className="font-display italic text-[12px]" style={{ color: on ? '#8E7338' : '#C9B27F' }}>
                  {count > 0 ? toRoman(count) : '—'}
                </span>
              </button>
            )
          })}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-hairline text-center py-14">
          <div className="text-gold text-base">∴</div>
          <p className="font-serif-body italic text-muted text-[15px] mt-3">
            żaden list nie czeka w tym stanie — jeszcze.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {filtered.map(entry => (
            <LetterCard
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
