'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import Link from 'next/link'
import { RefreshCw, ChevronDown, ArrowRight } from 'lucide-react'
import type { SkipReason } from '@/lib/weeklyInsight'
import { SmallCaps, Diamond, Fleuron, CornerBrackets } from '@/components/ui'

const REASON_LABELS: Record<SkipReason, string> = {
  n_too_small:      'za mało danych',
  effect_too_small: 'efekt za słaby',
  p_too_high:       'nieistotne statystycznie',
  no_data:          'brak danych',
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="py-2.5 border-t border-border first:border-t-0 first:pt-0.5 flex flex-col gap-1.5">
      <span className="font-display text-dark text-[19px] leading-none tracking-tight">{value}</span>
      <span className="font-ui uppercase text-muted text-[7px] tracking-[0.26em]">{label}</span>
    </div>
  )
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

  return (
    <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
      <CornerBrackets size={10} tone="gold-light" />

      <div className="grid sm:grid-cols-[1fr_210px] gap-6 sm:gap-9">
        {/* Werdykt */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Wzorzec tygodnia · {weekKey}
            </SmallCaps>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-muted-light hover:text-gold-deep transition-colors disabled:opacity-40 -mt-0.5"
              aria-label="Przelicz"
            >
              <RefreshCw size={12} strokeWidth={1.5} className={regenerating ? 'animate-spin' : ''} />
            </button>
          </div>
          <h2 className="font-heading text-dark text-xl mt-1.5 leading-tight">
            {insight.headline}
          </h2>
          <div className="font-serif-body italic text-muted text-[14px] leading-relaxed whitespace-pre-line mt-2.5 max-w-[62ch]">
            {insight.body}
          </div>
        </div>

        {/* Statystyki rygoru */}
        <div className="sm:border-l sm:border-border sm:pl-8">
          <Stat
            value={insight.testsRun > 0 ? <>{insight.testsRun} <em className="font-serif-body not-italic text-[12px] text-muted-light">/ {insight.totalHypotheses}</em></> : '—'}
            label="hipotez sprawdzonych"
          />
          {moodDays != null && <Stat value={moodDays} label="dni z check-inem nastroju" />}
          <Stat value={<>p &lt; .05</>} label="próg · korekta Bonferroniego" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border font-serif-body italic text-muted-light text-[13px] leading-relaxed">
        próg rygoru: n ≥ 10 dni, |efekt| ≥ 0,2
        <span className="text-gold mx-2">·</span>
        wzorce aktualizują się automatycznie wraz z nowymi danymi.
      </div>

      {/* #4 — zamknięcie pętli: od wzorca do działania, nie tylko do refleksji */}
      {insight.hasContent && (
        <Link
          href="/quests"
          className="inline-flex items-center gap-1.5 mt-4 font-ui uppercase tracking-luxury text-[10px] text-ivory bg-forest px-4 py-2 transition-opacity hover:opacity-85"
        >
          Zaplanuj eksperyment
          <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      )}

      <button
        onClick={() => setShowDetails(s => !s)}
        className="flex items-center gap-1.5 mt-4 text-muted-light hover:text-gold-deep transition-colors"
      >
        <ChevronDown
          size={11}
          strokeWidth={1.5}
          className={clsx('transition-transform', showDetails && 'rotate-180')}
        />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          {showDetails ? 'schowaj szczegóły' : 'pokaż wszystkie testy'}
        </SmallCaps>
      </button>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gold-deep/15 space-y-2">
          {insight.outcomes.map(o => (
            <div key={o.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Diamond
                  size={5}
                  filled={o.passed}
                  className={o.passed ? 'text-gold' : 'text-muted-light/50'}
                />
                <span
                  className={clsx(
                    'font-serif-body text-[12.5px] truncate',
                    o.passed ? 'text-dark' : 'text-muted-light italic'
                  )}
                >
                  {o.shortLabel}
                </span>
              </div>
              <SmallCaps tone="muted" size="xs" className="shrink-0 opacity-70">
                {o.passed
                  ? `passed · |effect|=${Math.abs(o.result!.effectSize).toFixed(2)}`
                  : REASON_LABELS[o.reason ?? 'no_data']}
              </SmallCaps>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
