'use client'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import { SmallCaps, Fleuron } from '@/components/ui'
import type { Confidence } from '@/lib/statTests'

// Kompaktowa linijka „wzorca tygodnia" na dashboardzie — celowo NIE panel.
// Pełny rozkład (tekst, pytanie refleksyjne, CTA eksperymentu) mieszka w
// /timeline?tab=patterns; tu tylko zajawka.
//
// Cykl ustępuje miejsca: hipotezy fazy cyklu to wiedza strukturalna („owulacja
// wyżej, menstruacja niżej") — prawie zawsze najsilniejszy sygnał i tygodniami
// ta sama treść. Dashboard pokazuje najciekawszy sygnał BEHAWIORALNY, a cyklowy
// dopiero gdy nic innego nie wyszło.
const RANK: Record<Confidence, number> = { pewny: 3, wstępny: 2, słaby: 1 }

const TIER_STYLE: Record<Confidence, string> = {
  pewny:   'text-forest border-forest/40 bg-forest/5',
  wstępny: 'text-gold-deep border-gold-light',
  słaby:   'text-muted border-hairline',
}

// Pierwsze zdanie — wystarczy na zajawkę. Polskie liczby używają przecinka
// („2,6"), więc pierwsze „. " to naprawdę koniec zdania.
function firstSentence(t: string): string {
  const i = t.indexOf('. ')
  return i > 0 ? t.slice(0, i + 1) : t
}

export default function DashboardInsight() {
  const { insight, loading, hasNewBadge, markSeen } = useWeeklyInsight()

  useEffect(() => {
    if (insight?.hasContent && hasNewBadge) markSeen()
  }, [insight, hasNewBadge, markSeen])

  const top = useMemo(() => {
    const signals = (insight?.outcomes ?? []).filter(o => o.confidence && o.text)
    if (signals.length === 0) return null
    return [...signals].sort((a, b) => {
      const cycA = a.id.startsWith('cycle_phase') ? 1 : 0
      const cycB = b.id.startsWith('cycle_phase') ? 1 : 0
      if (cycA !== cycB) return cycA - cycB
      const r = RANK[b.confidence!] - RANK[a.confidence!]
      if (r !== 0) return r
      return (a.result?.pCorrected ?? 1) - (b.result?.pCorrected ?? 1)
    })[0]
  }, [insight])

  if (loading || !insight || !insight.hasContent || !top) return null

  return (
    <section className="relative bg-ivory border border-gold-light/40 px-4 py-3 mb-4">
      <div className="flex items-baseline gap-x-3 gap-y-1.5 flex-wrap">
        <span className="flex items-center gap-2 shrink-0">
          <Fleuron size={10} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Wzorzec tygodnia
          </SmallCaps>
          <span
            className={`font-ui uppercase tracking-luxury text-[7px] border px-1.5 py-0.5 whitespace-nowrap ${TIER_STYLE[top.confidence!]}`}
          >
            {top.confidence}
          </span>
        </span>
        <p className="font-serif-body italic text-muted text-[13px] leading-snug flex-1 min-w-[220px] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
          {firstSentence(top.text!)}{' '}
          <Link
            href="/timeline?tab=patterns"
            className="not-italic font-ui uppercase tracking-luxury text-[9px] text-gold-deep hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            wzorce →
          </Link>
        </p>
      </div>
    </section>
  )
}
