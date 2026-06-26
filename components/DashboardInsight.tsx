'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import { SmallCaps, Fleuron, CornerBrackets } from '@/components/ui'

// Kompaktowy pasek „wzorca tygodnia" na dashboardzie.
//
// #3 — Silnik insightów (rygor: n≥10, |effect|≥0.2, korekta Bonferroniego)
// renderował się DOTĄD wyłącznie w /timeline?tab=patterns. To najmocniejszy atut
// aplikacji, a był schowany dwa tapnięcia głębiej. Tu pokazujemy nagłówek +
// najsilniejszy wzorzec od razu na „Dziś", ale TYLKO gdy naprawdę coś wyszło
// (hasContent) — w przeciwnym razie komponent nic nie renderuje (zero szumu).
//
// #4 — Zamykamy pętlę wniosek→działanie: zamiast kończyć na pytaniu
// refleksyjnym, dajemy CTA prowadzące do questów (eksperyment) i do pełnych
// wzorców. Insight ma prowadzić do ruchu, nie tylko do zadumy.
export default function DashboardInsight() {
  const { insight, loading, hasNewBadge, markSeen } = useWeeklyInsight()

  useEffect(() => {
    if (insight?.hasContent && hasNewBadge) markSeen()
  }, [insight, hasNewBadge, markSeen])

  if (loading || !insight || !insight.hasContent) return null

  const top = insight.outcomes.find((o) => o.passed)
  // pierwsze zdanie najmocniejszego wzorca — pełny rozkład jest w /timeline
  const topLine = top?.text?.split('\n')[0]?.trim()

  return (
    <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-6 mb-4">
      <CornerBrackets size={10} tone="gold-light" />
      <div className="flex items-center gap-2">
        <Fleuron size={11} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Czego nauczyły się Twoje dane
        </SmallCaps>
        {hasNewBadge && <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />}
      </div>

      <h2 className="font-heading text-dark text-lg sm:text-xl mt-1.5 leading-tight">
        {insight.headline}
      </h2>

      {topLine && (
        <p className="font-serif-body italic text-muted text-[14px] mt-2 leading-relaxed max-w-[62ch]">
          {topLine}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 flex-wrap">
        <Link
          href="/quests"
          className="inline-flex items-center gap-1.5 font-ui uppercase tracking-luxury text-[10px] text-ivory bg-forest px-4 py-2 transition-opacity hover:opacity-85"
        >
          Zaplanuj eksperyment
          <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
        <Link
          href="/timeline?tab=patterns"
          className="font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:opacity-70 transition-opacity"
        >
          Wszystkie wzorce →
        </Link>
      </div>
    </section>
  )
}
