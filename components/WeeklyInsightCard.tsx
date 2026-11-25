'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import Link from 'next/link'
import { RefreshCw, ChevronDown, ArrowRight } from 'lucide-react'
import type { SkipReason, HypothesisOutcome } from '@/lib/weeklyInsight'
import type { Confidence } from '@/lib/statTests'
import { plainInsight, emphasisParts } from '@/lib/plainInsight'
import { SmallCaps, Diamond, Fleuron, CornerBrackets } from '@/components/ui'

const REASON_LABELS: Record<SkipReason, string> = {
  n_too_small:      'za mało danych',
  effect_too_small: 'efekt za słaby',
  p_too_high:       'może być przypadkiem',
  no_data:          'brak danych',
}

const CONF_LABEL: Record<Confidence, string> = {
  pewny:   'Pewny',
  wstępny: 'Wstępny',
  słaby:   'Słaby sygnał',
}
const CONF_STYLE: Record<Confidence, string> = {
  pewny:   'text-forest border-forest/40 bg-forest/5',
  wstępny: 'text-gold-deep border-gold-light bg-gold-pale/40',
  słaby:   'text-muted border-hairline',
}
const RANK: Record<Confidence, number> = { pewny: 3, wstępny: 2, słaby: 1 }

/** Te same sygnały, które trafiły do treści insightu: najpewniejsze, potem najistotniejsze. */
function topSignals(outcomes: HypothesisOutcome[] | undefined): HypothesisOutcome[] {
  return (outcomes ?? [])
    .filter(o => o && o.confidence && o.text)
    .sort((a, b) => {
      const r = RANK[b.confidence!] - RANK[a.confidence!]
      if (r !== 0) return r
      return (a.result?.pCorrected ?? 1) - (b.result?.pCorrected ?? 1)
    })
    .slice(0, 3)
}

function Emph({ text }: { text: string }) {
  return (
    <>
      {emphasisParts(text).map((p, i) => (p.em ? <em key={i} className="italic font-semibold">{p.text}</em> : <span key={i}>{p.text}</span>))}
    </>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="font-display text-dark text-[19px] leading-none tracking-tight">{value}</span>
      <span className="font-ui uppercase text-muted text-[9.5px] tracking-[0.16em] leading-snug">{label}</span>
    </div>
  )
}

/** „2026-W48" → „tydzień 48". */
function weekLabel(weekKey: string): string {
  const m = /W(\d+)/.exec(weekKey)
  return m ? `tydzień ${Number(m[1])}` : weekKey
}

export default function WeeklyInsightCard({ moodDays }: { moodDays?: number }) {
  const { insight, loading, regenerate, hasNewBadge, markSeen, weekKey } = useWeeklyInsight()
  const [showDetails, setShowDetails] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (insight && hasNewBadge) markSeen()
  }, [insight, hasNewBadge, markSeen])

  if (loading) {
    return <div className="bg-cream/40 border border-hairline h-32 animate-pulse" />
  }

  if (!insight) {
    return (
      <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
        <CornerBrackets size={10} tone="gold-light" />
        <div className="flex items-center gap-2">
          <Fleuron size={11} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Wzorzec tygodnia
          </SmallCaps>
        </div>
        <h2 className="font-heading text-dark text-xl mt-1.5">Czeka na niedzielę</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
          insight liczy się raz w tygodniu, w niedzielę lub poniedziałek. wróć wtedy.
        </p>
      </section>
    )
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    await regenerate()
    setRegenerating(false)
  }

  const signals = topSignals(insight.outcomes)

  return (
    <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
      <CornerBrackets size={10} tone="gold-light" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Fleuron size={11} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="sm" as="div">
            Wzorzec tygodnia · {weekLabel(weekKey)}
          </SmallCaps>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-muted hover:text-gold-deep transition-colors disabled:opacity-40 p-1 -m-1"
          aria-label="Przelicz"
        >
          <RefreshCw size={14} strokeWidth={1.5} className={regenerating ? 'animate-spin' : ''} />
        </button>
      </div>
      <h2 className="font-heading text-dark text-[22px] mt-1.5 leading-tight">
        {insight.headline}
      </h2>
      <p className="font-serif-body italic text-muted text-[14px] mt-1">
        co tydzień sprawdzam na Twoich danych {insight.totalHypotheses} pytań i pokazuję tylko to, co naprawdę widać.
      </p>

      {signals.length > 0 ? (
        <ol className="mt-5 space-y-4">
          {signals.map(o => (
            <li key={o.id} className="border-l-2 border-gold-light pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx('font-ui uppercase tracking-[0.14em] text-[9.5px] border px-2 py-0.5', CONF_STYLE[o.confidence!])}>
                  {CONF_LABEL[o.confidence!]}
                </span>
                <span className="font-ui uppercase tracking-[0.14em] text-[9.5px] text-muted">{o.shortLabel}</span>
              </div>
              <p className="font-serif-body text-dark text-[16px] leading-snug mt-2 max-w-[62ch]">
                <Emph text={plainInsight(o.text!)} />
              </p>
              {o.reflectionQuestion && (
                <p className="font-serif-body italic text-gold-deep text-[15px] leading-snug mt-1.5">
                  <Emph text={o.reflectionQuestion} />
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 space-y-3 max-w-[62ch]">
          {plainInsight(insight.body).split(/\n\n+/).filter(p => p.trim() && p.trim() !== '— · —').map((p, i) => (
            <p key={i} className="font-serif-body text-dark/85 text-[15.5px] leading-snug"><Emph text={p} /></p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-5">
        {/* #4 — zamknięcie pętli: od wzorca do działania, nie tylko do refleksji */}
        {insight.hasContent && (
          <Link
            href="/quests"
            className="inline-flex items-center gap-1.5 font-ui uppercase tracking-luxury text-[10px] text-ivory bg-forest px-4 py-2.5 transition-opacity hover:opacity-85"
          >
            Zaplanuj eksperyment
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        )}
        <button
          onClick={() => setShowDetails(s => !s)}
          aria-expanded={showDetails}
          className="flex items-center gap-1.5 text-muted hover:text-gold-deep transition-colors"
        >
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={clsx('transition-transform', showDetails && 'rotate-180')}
          />
          <SmallCaps tone="muted" tracking="luxury" size="sm">
            {showDetails ? 'schowaj szczegóły' : 'jak to liczę · wszystkie pytania'}
          </SmallCaps>
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4">
            <Stat
              value={insight.testsRun > 0 ? <>{insight.testsRun} <em className="font-serif-body not-italic text-[13px] text-muted">/ {insight.totalHypotheses}</em></> : '—'}
              label="pytań policzonych"
            />
            {moodDays != null && <Stat value={moodDays} label="dni z check-inem" />}
            <Stat value={insight.outcomes.filter(o => o.confidence).length} label="sygnałów" />
          </div>
          <p className="font-serif-body italic text-muted text-[14px] leading-relaxed mt-4">
            <b className="not-italic font-medium text-forest">pewny</b> — widać to wyraźnie, w co najmniej 10 dniach z każdej strony porównania.{' '}
            <b className="not-italic font-medium text-gold-deep">wstępny</b> — prawdopodobne, warto obserwować.{' '}
            <b className="not-italic font-medium text-muted">słaby</b> — ledwie zarysowany.
            {' '}wyniki są korygowane na liczbę sprawdzanych pytań (Benjamini–Hochberg), żeby przypadek nie udawał wzorca.
          </p>
          <div className="mt-4 space-y-2">
            {insight.outcomes.map(o => (
              <div key={o.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Diamond
                    size={5}
                    filled={!!o.confidence}
                    className={o.confidence ? 'text-gold' : 'text-muted-light/60'}
                  />
                  <span
                    className={clsx(
                      'font-serif-body text-[14px] truncate',
                      o.confidence ? 'text-dark' : 'text-muted italic'
                    )}
                  >
                    {o.shortLabel}
                  </span>
                </div>
                <span className="shrink-0 font-ui text-[10.5px] text-muted">
                  {o.confidence ? CONF_LABEL[o.confidence].toLowerCase() : REASON_LABELS[o.reason ?? 'no_data']}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
