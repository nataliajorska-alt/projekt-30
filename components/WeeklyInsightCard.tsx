'use client'
import { useState, useEffect } from 'react'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { SkipReason } from '@/lib/weeklyInsight'

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

  // Oznacz jako zobaczony przy pierwszym renderze.
  useEffect(() => {
    if (insight && hasNewBadge) markSeen()
  }, [insight, hasNewBadge, markSeen])

  if (loading) {
    return (
      <div className="bg-cream rounded-2xl h-32 animate-pulse" />
    )
  }

  if (!insight) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-gold" strokeWidth={1.5} />
          <p className="font-sans text-[10px] text-gold uppercase tracking-widest">Wzorzec tygodnia</p>
        </div>
        <p className="font-serif text-dark text-base mb-1">Czeka na niedzielę</p>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Insight liczy się raz w tygodniu, w niedzielę lub poniedziałek. Wróć wtedy.
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
    <div className={clsx(
      'rounded-2xl border p-5 transition-colors',
      insight.hasContent ? 'bg-gold-pale/40 border-gold/30' : 'bg-white border-border',
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold flex-shrink-0" strokeWidth={1.5} />
          <p className="font-sans text-[10px] text-gold uppercase tracking-widest">
            Wzorzec tygodnia · {weekKey}
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-muted-light hover:text-dark transition-colors disabled:opacity-40"
          aria-label="Przelicz"
        >
          <RefreshCw size={13} strokeWidth={1.5} className={regenerating ? 'animate-spin' : ''} />
        </button>
      </div>

      <p className="font-serif text-dark text-base mb-3">{insight.headline}</p>

      <div className="font-sans text-sm text-dark/85 leading-relaxed whitespace-pre-line">
        {insight.body}
      </div>

      {/* Methodology badge */}
      <p className="font-sans text-[10px] text-muted-light mt-4 leading-relaxed">
        {insight.testsRun > 0 && (
          <>Sprawdziłam {insight.testsRun} z {insight.totalHypotheses} pre-zdefiniowanych hipotez.{' '}
          {insight.passedCount > 0 && `${insight.passedCount} przeszło rygor (n≥10, |effect|≥0.3, p<0.05 po Bonferronim).`}</>
        )}
      </p>

      {/* Expandable: co testowaliśmy */}
      <button
        onClick={() => setShowDetails(s => !s)}
        className="flex items-center gap-1.5 mt-3 text-muted-light hover:text-dark transition-colors font-sans text-xs"
      >
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className={clsx('transition-transform', showDetails && 'rotate-180')}
        />
        {showDetails ? 'Schowaj szczegóły' : 'Pokaż wszystkie testy'}
      </button>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gold/10 space-y-2">
          {insight.outcomes.map(o => (
            <div key={o.id} className="flex items-center justify-between gap-2 font-sans text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={clsx(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  o.passed ? 'bg-gold' : 'bg-muted-light/40',
                )} />
                <span className={clsx('truncate', o.passed ? 'text-dark' : 'text-muted-light')}>
                  {o.shortLabel}
                </span>
              </div>
              <span className="text-[10px] text-muted-light flex-shrink-0">
                {o.passed
                  ? `passed · |effect|=${Math.abs(o.result!.effectSize).toFixed(2)}`
                  : REASON_LABELS[o.reason ?? 'no_data']}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
