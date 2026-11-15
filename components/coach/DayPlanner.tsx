'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { Sparkles, Copy, Share2, Check, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useBriefingBuilder } from '@/hooks/useBriefing'
import { useDayPlan } from '@/hooks/useDayPlan'
import { useCoachAvailability, useCoachRequest, useElapsed, useClock } from '@/hooks/useCoach'
import { useToast } from '@/components/ToastProvider'
import { todayKey, tomorrowKey } from '@/lib/gameLogic'
import { planClockMinutes } from '@/lib/dayPlan'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'
import CoachMarkdown from './CoachMarkdown'
import PlanTimeline from './PlanTimeline'

// Plan dnia z asystentką — jedno miejsce dla karty „Plan na jutro/dziś"
// i arkusza z ekranu „Dziś". Kolejne stany:
//   formularz (kalendarz + „ułóż plan")  →  asystentka myśli / pisze na żywo
//   →  plan zapisany w Firestore i pokazany jako oś dnia.
// Bez włączonej asystentki zostaje dotychczasowy brief do skopiowania.

type Variant = 'today' | 'tomorrow'

const notesKey = (dateKey: string) => `coach.notes.${dateKey}`
function readNotes(key: string): string {
  try { return localStorage.getItem(key) ?? '' } catch { return '' }
}
function writeNotes(key: string, value: string) {
  try {
    if (value.trim()) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch { /* prywatne okno — notatka żyje tylko do zamknięcia */ }
}

function clockOf(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

const primaryBtn =
  'inline-flex items-center gap-2 bg-dark text-ivory border border-dark py-2.5 px-4 hover:bg-forest transition-colors disabled:opacity-50'
const quietBtn =
  'inline-flex items-center gap-2 border border-hairline text-dark py-2.5 px-4 hover:border-gold transition-colors'
const btnLabel = 'font-ui uppercase tracking-luxury text-[10px]'

function Thinking() {
  return (
    <span aria-hidden className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rotate-45 bg-gold animate-pulse"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}
    </span>
  )
}

interface Props {
  variant: Variant
  /** 'card' — skrót kilku najbliższych bloków (karta), 'full' — cały plan (arkusz). */
  view?: 'card' | 'full'
}

export default function DayPlanner({ variant, view = 'card' }: Props) {
  const isToday = variant === 'today'
  const dateKey = isToday ? todayKey() : tomorrowKey()
  const when = isToday ? 'dziś' : 'jutro'
  const build = useBriefingBuilder(variant)
  const { plan, loading, savePlan, deletePlan } = useDayPlan(dateKey)
  const availability = useCoachAvailability()
  const coach = useCoachRequest()
  const busy = coach.phase === 'waiting' || coach.phase === 'streaming'
  const elapsed = useElapsed(busy ? coach.startedAt : null)
  const now = useClock(30_000)
  const { addToast } = useToast()
  const [notes, setNotes] = useState('')
  const [redo, setRedo] = useState(false)
  const [copied, setCopied] = useState<'brief' | 'plan' | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setNotes(readNotes(notesKey(dateKey))) }, [dateKey])
  const changeNotes = (value: string) => { setNotes(value); writeNotes(notesKey(dateKey), value) }
  const calendar = notes.split('\n').map(l => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean)

  const canAsk = availability?.enabled === true
  // Brief do skopiowania: bez dopisków zostawia miejsce na ręczne uzupełnienie.
  const manualBrief = () => build(calendar.length > 0 ? calendar : undefined)

  const copy = async (text: string, what: 'brief' | 'plan') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 2500)
    } catch {
      // Schowek zablokowany (np. brak fokusa) — arkusz udostępniania
      if (navigator.share) await navigator.share({ text }).catch(() => {})
    }
  }

  const share = async (text: string) => {
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* anulowane */ }
    } else {
      await copy(text, 'brief')
    }
  }

  const save = async (r: { text: string; model: string; demo: boolean; truncated: boolean }) => {
    setSaving(true)
    try {
      await savePlan(r)
      coach.reset()
      setRedo(false)
      addToast({
        type: 'success',
        message: isToday
          ? 'Plan zapisany — ekran „Dziś" pokaże, co teraz.'
          : 'Plan na jutro zapisany — rano przywita Cię na ekranie „Dziś".',
      })
    } catch {
      addToast({ type: 'error', message: 'Plan gotowy, ale zapis nie wyszedł. Skopiuj go, zanim zamkniesz.' })
    } finally {
      setSaving(false)
    }
  }

  const ask = async () => {
    const r = await coach.ask('day', build(calendar))
    if (r) await save(r)
  }

  const remove = async () => {
    if (!confirm(`Usunąć plan na ${when}? Ekran „Dziś" przestanie go pokazywać.`)) return
    await deletePlan()
  }

  if (loading) return <div className="h-16" aria-busy="true" />

  // ── Asystentka pracuje ──────────────────────────────────────────────
  if (busy) {
    return (
      <div aria-live="polite">
        <div className="flex items-center gap-3 mb-2">
          <Thinking />
          <p className="flex-1 font-serif-body italic text-dark text-[15px]">
            {coach.phase === 'waiting' ? 'asystentka czyta brief i układa dzień…' : 'asystentka pisze plan…'}
          </p>
          <span className="font-ui tabular-nums text-[11px] text-muted">{elapsed} s</span>
        </div>
        {coach.phase === 'waiting' && (
          <p className="font-serif-body text-muted text-[13.5px] leading-relaxed mb-3">
            rutyna, questy, faza cyklu, energia z ostatnich dni{calendar.length > 0 ? ' i Twój kalendarz' : ''}.
            zwykle trwa to 20–60 sekund — nie zamykaj, plan zapisze się sam.
          </p>
        )}
        {coach.text && (
          <div className="border-l-2 border-gold-light/60 pl-4 my-4 max-h-[52vh] overflow-y-auto">
            <CoachMarkdown text={coach.text} streaming />
          </div>
        )}
        <button onClick={coach.reset} className={quietBtn}>
          <Square size={11} className="text-gold-deep" />
          <span className={btnLabel}>przerwij</span>
        </button>
      </div>
    )
  }

  // ── Błąd ────────────────────────────────────────────────────────────
  if (coach.phase === 'error' && coach.error) {
    return (
      <div role="alert">
        <div className="border border-wine/30 bg-wine/5 px-4 py-3 mb-3">
          <p className="font-serif-body text-dark text-[15px] leading-snug">{coach.error.message}</p>
          {coach.error.detail && (
            <p className="font-ui text-[11px] text-muted mt-1.5 break-words">{coach.error.detail}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {coach.error.code !== 'daily_cap' && coach.error.code !== 'not_configured' && (
            <button onClick={ask} className={primaryBtn}>
              <RotateCcw size={12} className="text-gold" />
              <span className={btnLabel}>spróbuj ponownie</span>
            </button>
          )}
          <button onClick={() => copy(manualBrief(), 'brief')} className={quietBtn}>
            {copied === 'brief' ? <Check size={12} className="text-gold-deep" /> : <Copy size={12} className="text-gold-deep" />}
            <span className={btnLabel}>{copied === 'brief' ? 'skopiowano' : 'kopiuj brief'}</span>
          </button>
          <button onClick={coach.reset} className={quietBtn}>
            <span className={btnLabel}>wróć</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Odpowiedź gotowa, ale niezapisana (zapis w toku albo nieudany) ──
  if (coach.phase === 'done' && coach.result) {
    const r = coach.result
    return (
      <div>
        <div className="border-l-2 border-gold-light/60 pl-4 mb-4">
          <CoachMarkdown text={r.text} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save(r)} disabled={saving} className={primaryBtn}>
            <span className={btnLabel}>{saving ? 'zapisuję…' : 'zapisz plan'}</span>
          </button>
          <button onClick={() => copy(r.text, 'plan')} className={quietBtn}>
            {copied === 'plan' ? <Check size={12} className="text-gold-deep" /> : <Copy size={12} className="text-gold-deep" />}
            <span className={btnLabel}>{copied === 'plan' ? 'skopiowano' : 'kopiuj plan'}</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Zapisany plan ───────────────────────────────────────────────────
  if (plan && !redo) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="gold-deep" size="xs">
            ułożony {clockOf(plan.createdAt)}{plan.demo ? ' · odpowiedź demo' : ''}
          </SmallCaps>
          <button
            onClick={remove}
            aria-label={`Usuń plan na ${when}`}
            className="ml-auto -my-2 p-2 text-muted hover:text-wine transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
        {plan.truncated && (
          <p className="font-serif-body italic text-muted text-[13px] mb-3">
            odpowiedź doszła do limitu długości — koniec planu mógł się uciąć.
          </p>
        )}
        <PlanTimeline text={plan.text} nowMin={isToday ? planClockMinutes(now) : null} compact={view === 'card'} />
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <button onClick={() => copy(plan.text, 'plan')} className={quietBtn}>
            {copied === 'plan' ? <Check size={12} className="text-gold-deep" /> : <Copy size={12} className="text-gold-deep" />}
            <span className={btnLabel}>{copied === 'plan' ? 'skopiowano' : 'kopiuj'}</span>
          </button>
          <button onClick={() => setRedo(true)} className={quietBtn}>
            <RotateCcw size={12} className="text-gold-deep" />
            <span className={btnLabel}>ułóż od nowa</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Formularz ───────────────────────────────────────────────────────
  return (
    <div>
      <p className="font-serif-body italic text-muted text-[14px] leading-relaxed mb-4">
        {canAsk ? (
          isToday
            ? 'rutyna, questy, zasady, faza cyklu i energia z ostatnich dni — asystentka ułoży z nich plan reszty dnia, od teraz do snu. dopisz tylko, co masz w kalendarzu.'
            : 'rutyna, questy, zasady, faza cyklu i energia z ostatnich dni — asystentka ułoży z nich jutro godzina po godzinie. dopisz tylko, co masz w kalendarzu.'
        ) : (
          isToday
            ? 'nie zdążyłaś rozpisać dnia wieczorem? rutyna, questy, zasady, faza cyklu i energia z ostatnich dni — jeden gotowy prompt. wklej do Claude’a i poproś o plan reszty dnia od teraz.'
            : 'rutyna, questy, zasady, faza cyklu i energia z ostatnich dni — jeden gotowy prompt. wklej do Claude’a i poproś o plan dnia.'
        )}
      </p>

      <label className="block mb-4">
        <SmallCaps tone="muted" size="xs" as="span" className="block mb-1.5">w kalendarzu {when} (opcjonalnie)</SmallCaps>
        <textarea
          value={notes}
          onChange={e => changeNotes(e.target.value)}
          rows={3}
          placeholder={'np. 10:00 terapia\n14:00–16:00 spotkanie zespołu\nwieczorem trening'}
          className="w-full border border-hairline bg-cream/40 px-3 py-2 font-serif-body text-[15px] text-dark leading-snug placeholder:text-muted-light focus:outline-none focus:border-gold resize-y"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {canAsk && (
          <button onClick={ask} className={clsx(primaryBtn, 'bg-dark-deep border-gold')}>
            <Sparkles size={13} className="text-gold" />
            <span className={btnLabel}>ułóż plan z asystentką</span>
          </button>
        )}
        <button onClick={() => copy(manualBrief(), 'brief')} className={quietBtn}>
          {copied === 'brief' ? <Check size={12} className="text-gold-deep" /> : <Copy size={12} className="text-gold-deep" />}
          <span className={btnLabel}>{copied === 'brief' ? 'skopiowano' : 'kopiuj brief'}</span>
        </button>
        <button onClick={() => share(manualBrief())} className={quietBtn}>
          <Share2 size={12} className="text-gold-deep" />
          <span className={btnLabel}>udostępnij</span>
        </button>
        {redo && (
          <button onClick={() => setRedo(false)} className={quietBtn}>
            <span className={btnLabel}>zostaw obecny plan</span>
          </button>
        )}
      </div>

      {canAsk && (
        <p className="font-ui text-[10.5px] text-muted mt-2.5 leading-relaxed">
          {availability?.demo
            ? 'tryb demo: odpowiedź przykładowa, nic nie wychodzi poza ten komputer.'
            : 'wysyła brief do Claude (Anthropic) · płatne zapytanie z Twojego klucza API.'}
        </p>
      )}
      {availability && !availability.enabled && (
        <p className="font-serif-body italic text-muted text-[13px] mt-3">
          asystentka w apce jest wyłączona —{' '}
          <Link href="/settings" className="underline decoration-gold/50 underline-offset-2 hover:text-dark">
            zobacz, jak ją włączyć
          </Link>
          .
        </p>
      )}
      {copied === 'brief' && (
        <div className="mt-4 flex items-center gap-2">
          <Fleuron size={10} className="text-gold" />
          <p className="font-serif-body italic text-gold-deep text-[13px]">
            brief w schowku — wklej do Claude’a{calendar.length ? '' : ' i dopisz swoje plany'}.
          </p>
        </div>
      )}
    </div>
  )
}
