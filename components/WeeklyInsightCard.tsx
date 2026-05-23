'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import { RefreshCw, ChevronDown } from 'lucide-react'
import type { SkipReason } from '@/lib/weeklyInsight'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

const REASON_LABELS: Record<SkipReason, string> = {
  n_too_small:      'za mało danych',
  effect_too_small: 'efekt za słaby',
  p_too_high:       'nieistotne statystycznie',
  no_data:          'brak danych',
}

export default function WeeklyInsightCard() {
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
      <div className="bg-ivory border border-gold-light/40 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Fleuron size={11} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Wzorzec tygodnia
          </SmallCaps>
        </div>
        <h3 className="font-heading text-dark text-lg mt-1">Czeka na niedzielę</h3>
        <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
          insight liczy się raz w tygodniu, w niedzielę lub poniedziałek. wróć wtedy.
        </p>
      </div>
    )
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    await regenerate()
    setRegenerating(false)
  }

  return (
    <div
      className={clsx(
        'border p-5 transition-colors',
        insight.hasContent ? 'bg-gold-pale/40 border-gold-light/60' : 'bg-ivory border-hairline'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Fleuron size={11} className="text-gold-deep shrink-0" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Wzorzec tygodnia · {weekKey}
          </SmallCaps>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-muted-light hover:text-gold-deep transition-colors disabled:opacity-40"
          aria-label="Przelicz"
        >
          <RefreshCw size={12} strokeWidth={1.5} className={regenerating ? 'animate-spin' : ''} />
        </button>
      </div>

      <h3 className="font-heading text-dark text-[17px] leading-snug mb-3">
        {insight.headline}
      </h3>

      <div className="font-serif-body text-dark/85 text-[14px] leading-relaxed whitespace-pre-line italic">
        {insight.body}
      </div>

      {insight.testsRun > 0 && (
        <p className="font-serif-body italic text-muted-light text-[11.5px] mt-4 leading-relaxed">
          sprawdziłam {insight.testsRun} z {insight.totalHypotheses} pre-zdefiniowanych hipotez.{' '}
          {insight.passedCount > 0 && (
            <>
              {insight.passedCount} przeszło rygor (n≥10, |effect|≥0.3, p&lt;0.05 po Bonferronim).
            </>
          )}
        </p>
      )}

      <button
        onClick={() => setShowDetails(s => !s)}
        className="flex items-center gap-1.5 mt-3 text-muted-light hover:text-gold-deep transition-colors"
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
    </div>
  )
}
