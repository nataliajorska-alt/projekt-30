'use client'
import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Square, RotateCcw, Check } from 'lucide-react'
import { useCoachAvailability, useCoachRequest, useElapsed } from '@/hooks/useCoach'
import { parsePlanText, type ParseResult } from '@/lib/monthPlanner'
import { SmallCaps, Diamond } from '@/components/ui'

// Rozpisanie miesiąca w apce: asystentka dostaje ten sam prompt co „Prompt dla
// Claude" (hasło, motto, fazy cyklu na każdy dzień, wnioski z danych) plus
// kontekst wpisany tutaj, a jej odpowiedź od razu trafia do szkicu — bez
// kopiowania i wklejania. Zapis zostaje decyzją użytkowniczki (przycisk „Zapisz").

const contextKey = (monthKey: string) => `coach.month.${monthKey}`
function readContext(key: string): string {
  try { return localStorage.getItem(key) ?? '' } catch { return '' }
}
function writeContext(key: string, value: string) {
  try {
    if (value.trim()) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch { /* prywatne okno */ }
}

interface Props {
  monthKey: string
  /** Ile dni zostało do rozpisania (od dziś do końca miesiąca). */
  daysToPlan: number
  buildPrompt: (context: string) => string
  /** Wstawia questy do szkicu; false, gdy użytkowniczka nie zgodziła się na podmianę. */
  onPlan: (res: ParseResult) => boolean
}

const btnLabel = 'font-ui uppercase tracking-luxury text-[10px]'

export default function MonthAssistant({ monthKey, daysToPlan, buildPrompt, onPlan }: Props) {
  const availability = useCoachAvailability()
  const { phase, text, error, startedAt, ask, reset } = useCoachRequest()
  const busy = phase === 'waiting' || phase === 'streaming'
  const elapsed = useElapsed(busy ? startedAt : null)
  const [context, setContext] = useState('')
  const [outcome, setOutcome] = useState<{ res: ParseResult; applied: boolean } | null>(null)

  useEffect(() => {
    setContext(readContext(contextKey(monthKey)))
    setOutcome(null)
    reset()
  }, [monthKey, reset])

  const live = useMemo(() => (text ? parsePlanText(text, monthKey) : null), [text, monthKey])
  const daysDone = live ? new Set(live.quests.map(q => q.date)).size : 0
  const latest = live?.quests[live.quests.length - 1] ?? null

  if (!availability?.enabled || daysToPlan === 0) return null

  const changeContext = (value: string) => {
    setContext(value)
    writeContext(contextKey(monthKey), value)
  }

  const run = async () => {
    setOutcome(null)
    const r = await ask('month', buildPrompt(context))
    if (!r) return
    const res = parsePlanText(r.text, monthKey)
    const applied = res.quests.length > 0 && onPlan(res)
    setOutcome({ res, applied })
    reset()
  }

  const apply = () => {
    if (outcome && onPlan(outcome.res)) setOutcome({ ...outcome, applied: true })
  }

  return (
    <div className="mt-4 border border-gold-light/60 bg-ivory panel-frame px-4 sm:px-5 py-4">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-gold" />
        <SmallCaps tone="gold-deep" size="xs">rozpisz z asystentką</SmallCaps>
        {availability.demo && <SmallCaps tone="muted" size="xs" className="ml-auto">demo</SmallCaps>}
      </div>

      {busy ? (
        <div aria-live="polite" className="mt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-serif-body italic text-dark text-[15px]">
              {phase === 'waiting' ? 'asystentka układa miesiąc…' : `rozpisane dni: ${daysDone} z ${daysToPlan}`}
            </p>
            <span className="font-ui tabular-nums text-[11px] text-muted">{elapsed} s</span>
          </div>
          <span className="relative block h-[3px] bg-hairline/70 overflow-hidden mt-2.5">
            <span
              className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-500"
              style={{ width: `${Math.min(100, (daysDone / Math.max(1, daysToPlan)) * 100)}%` }}
            />
          </span>
          <p className="font-serif-body text-muted text-[13.5px] mt-2 min-h-[1.4em] truncate">
            {latest
              ? <><span className="font-ui tabular-nums text-[11px] text-gold-deep mr-1.5">{latest.date.slice(8)}.{latest.date.slice(5, 7)}</span>{latest.title}</>
              : 'czyta hasło, fazy cyklu i wnioski z Twoich danych · zwykle 1–2 minuty'}
          </p>
          <button
            onClick={reset}
            className="mt-3 inline-flex items-center gap-2 border border-hairline text-dark py-2 px-3.5 hover:border-gold transition-colors"
          >
            <Square size={11} className="text-gold-deep" />
            <span className={btnLabel}>przerwij</span>
          </button>
        </div>
      ) : (
        <>
          <p className="font-serif-body italic text-muted text-[13.5px] leading-relaxed mt-2">
            asystentka dostanie hasło, motto, fazę cyklu na każdy dzień i wnioski z Twoich danych — i rozpisze
            {daysToPlan === 1 ? ' ostatni dzień' : ` ${daysToPlan} dni`} do końca miesiąca prosto do szkicu. przejrzysz i zapiszesz sama.
          </p>
          <label className="block mt-3">
            <SmallCaps tone="muted" size="xs" as="span" className="block mb-1.5">kontekst miesiąca (opcjonalnie)</SmallCaps>
            <textarea
              value={context}
              onChange={e => changeContext(e.target.value)}
              rows={3}
              placeholder="praca, terapia, wyjazdy, ludzie, pętle do zamknięcia, czego chcesz od tego miesiąca"
              className="w-full border border-hairline bg-cream/40 px-3 py-2 font-serif-body text-[15px] text-dark leading-snug placeholder:text-muted-light focus:outline-none focus:border-gold resize-y"
            />
          </label>

          {error && (
            <div role="alert" className="mt-3 border border-wine/30 bg-wine/5 px-3.5 py-2.5">
              <p className="font-serif-body text-dark text-[14.5px] leading-snug">{error.message}</p>
              {error.detail && <p className="font-ui text-[11px] text-muted mt-1 break-words">{error.detail}</p>}
            </div>
          )}

          {outcome && (
            <div className="mt-3 border-l-2 border-gold-light pl-3.5">
              {outcome.res.quests.length === 0 ? (
                <p className="font-serif-body text-dark text-[14.5px]">
                  Asystentka nie zwróciła żadnej linii w formacie planu — spróbuj jeszcze raz.
                </p>
              ) : outcome.applied ? (
                <p className="flex items-start gap-2 font-serif-body text-dark text-[14.5px] leading-snug">
                  <Check size={14} className="text-gold-deep mt-0.5 shrink-0" />
                  <span>
                    {outcome.res.quests.length} questów na {new Set(outcome.res.quests.map(q => q.date)).size} dni jest w szkicu —
                    przejrzyj dni niżej i zapisz.
                  </span>
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-serif-body text-dark text-[14.5px]">
                    Plan gotowy ({outcome.res.quests.length} questów), obecny szkic został bez zmian.
                  </p>
                  <button onClick={apply} className="font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:text-dark">
                    wstaw do szkicu
                  </button>
                </div>
              )}
              {outcome.res.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  <li className="font-ui text-[10.5px] text-muted">pominięte linie ({outcome.res.errors.length}):</li>
                  {outcome.res.errors.slice(0, 5).map(e => (
                    <li key={e.line} className="font-mono text-[11px] text-wine truncate">
                      {e.reason} · {e.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
            <button
              onClick={run}
              className="inline-flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-4 hover:bg-forest transition-colors"
            >
              {outcome ? <RotateCcw size={12} className="text-gold" /> : <Sparkles size={13} className="text-gold" />}
              <span className={btnLabel}>{outcome ? 'rozpisz jeszcze raz' : 'rozpisz miesiąc'}</span>
            </button>
            <span className="flex items-center gap-1.5 font-ui text-[10.5px] text-muted">
              <Diamond size={4} className="text-gold" />
              {availability.demo ? 'odpowiedź przykładowa, bez wysyłania' : 'wysyła prompt do Claude (Anthropic) · płatne'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
