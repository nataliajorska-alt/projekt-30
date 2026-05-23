'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { ChevronDown } from 'lucide-react'
import type { WeeklyReview, MonthlyReview } from '@/types'
import PillarTrendChart from '@/components/PillarTrendChart'
import { formatMonthPL, formatWeekRange } from './shared'
import { SmallCaps, Diamond, Fleuron, RomanNumeral } from '@/components/ui'

interface ReviewHistoryTabProps {
  weeklyReviews: WeeklyReview[]
  monthlyReviews: MonthlyReview[]
  loading: boolean
}

function avgPillarRating(pillarsRated: Record<string, number>): string {
  const vals = Object.values(pillarsRated)
  if (vals.length === 0) return '–'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

const SUB_TABS = [
  { key: 'weekly' as const,  label: 'Tygodniowe', roman: 1 },
  { key: 'monthly' as const, label: 'Miesięczne', roman: 2 },
]

export default function ReviewHistoryTab({ weeklyReviews, monthlyReviews, loading }: ReviewHistoryTabProps) {
  const [subTab, setSubTab] = useState<'weekly' | 'monthly'>('weekly')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="text-center py-12">
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block animate-pulse" />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          Ładuję historię
        </SmallCaps>
      </div>
    )
  }

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="space-y-5">
      <nav className="flex justify-center gap-10">
        {SUB_TABS.map(({ key, label, roman }) => {
          const active = subTab === key
          return (
            <button
              key={key}
              onClick={() => { setSubTab(key); setExpandedId(null) }}
              className="group flex flex-col items-center gap-1.5"
            >
              <span className="flex items-baseline gap-2">
                <RomanNumeral
                  value={roman}
                  className={clsx('text-sm transition-colors', active ? 'text-gold' : 'text-muted-light')}
                />
                <SmallCaps
                  tone={active ? 'gold' : 'muted'}
                  tracking="luxury"
                  size="sm"
                >
                  {label}
                </SmallCaps>
              </span>
              <span className={clsx('h-px w-10 transition-colors', active ? 'bg-gold' : 'bg-transparent')} />
            </button>
          )
        })}
      </nav>

      {subTab === 'weekly' && weeklyReviews.length === 0 && (
        <div className="text-center py-12">
          <Fleuron size={12} className="text-gold-deep mx-auto mb-3 inline-block" />
          <p className="font-serif-body italic text-muted text-[13.5px]">
            brak przeglądów tygodniowych.
          </p>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-70">
            twój pierwszy przegląd pojawi się tutaj.
          </SmallCaps>
        </div>
      )}

      {subTab === 'monthly' && monthlyReviews.length === 0 && (
        <div className="text-center py-12">
          <Fleuron size={12} className="text-gold-deep mx-auto mb-3 inline-block" />
          <p className="font-serif-body italic text-muted text-[13.5px]">
            brak przeglądów miesięcznych.
          </p>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-70">
            twój pierwszy przegląd pojawi się tutaj.
          </SmallCaps>
        </div>
      )}

      {subTab === 'weekly' && weeklyReviews.length > 0 && (
        <PillarTrendChart reviews={weeklyReviews.slice(0, 8)} />
      )}

      {subTab === 'weekly' && weeklyReviews.map((review, idx) => {
        const isOpen = expandedId === review.weekStart
        const prevReview = weeklyReviews[idx + 1] ?? null
        return (
          <ReviewCard
            key={review.weekStart}
            id={review.weekStart}
            title={formatWeekRange(review.weekStart)}
            sub={`Średnia filarów: ${avgPillarRating(review.pillarsRated)} · + ${review.xpEarned} XP`}
            isOpen={isOpen}
            onToggle={() => toggle(review.weekStart)}
          >
            {review.highlights && (
              <Block label="Co działało" body={review.highlights} />
            )}
            {review.challenges && (
              <Block label="Co było trudne" body={review.challenges} />
            )}
            {review.nextWeekFocus && (
              <Block label="Focus na następny tydzień" body={review.nextWeekFocus} italic />
            )}
            <PillarsGrid pillarsRated={review.pillarsRated} prevRated={prevReview?.pillarsRated} />
          </ReviewCard>
        )
      })}

      {subTab === 'monthly' && monthlyReviews.map((review, idx) => {
        const isOpen = expandedId === review.month
        const prevReview = monthlyReviews[idx + 1] ?? null
        return (
          <ReviewCard
            key={review.month}
            id={review.month}
            title={formatMonthPL(review.month)}
            sub={`Średnia filarów: ${avgPillarRating(review.pillarsRated)} · + ${review.xpEarned} XP`}
            isOpen={isOpen}
            onToggle={() => toggle(review.month)}
          >
            {review.highlights && (
              <Block label="Co ten miesiąc wniósł" body={review.highlights} />
            )}
            {review.challenges && (
              <Block label="Co się nie udało" body={review.challenges} />
            )}
            {review.intentionNextMonth && (
              <Block label="Intencja na nowy miesiąc" body={review.intentionNextMonth} italic />
            )}
            <PillarsGrid pillarsRated={review.pillarsRated} prevRated={prevReview?.pillarsRated} />
          </ReviewCard>
        )
      })}
    </div>
  )
}

function ReviewCard({
  title, sub, isOpen, onToggle, children,
}: {
  id: string
  title: string
  sub: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-ivory border border-gold-light/40 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left">
        <div>
          <h3 className="font-heading text-dark text-base leading-tight">{title}</h3>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1 block opacity-80">
            {sub}
          </SmallCaps>
        </div>
        <ChevronDown
          size={14}
          className={clsx('text-muted transition-transform', isOpen && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-hairline pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Block({ label, body, italic = false }: { label: string; body: string; italic?: boolean }) {
  return (
    <div>
      <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1.5">
        {label}
      </SmallCaps>
      <p className={clsx(
        'font-serif-body text-[14px] text-dark leading-relaxed',
        italic && 'italic'
      )}>
        {italic ? `„${body}"` : body}
      </p>
    </div>
  )
}

function PillarsGrid({ pillarsRated, prevRated }: {
  pillarsRated: Record<string, number>
  prevRated?: Record<string, number>
}) {
  return (
    <div>
      <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
        Filary
      </SmallCaps>
      <div className="grid grid-cols-2 gap-2">
        {PILLARS.map(p => {
          const val = pillarsRated[p.id as Pillar] ?? 0
          const prevVal = prevRated?.[p.id as Pillar] ?? null
          const delta = prevVal !== null ? val - prevVal : null
          return (
            <div key={p.id} className="flex items-center gap-2 bg-cream/50 border border-hairline px-3 py-2">
              <span style={{ color: p.color }}><Diamond size={4} filled /></span>
              <span className="font-serif-body text-[12.5px] text-dark flex-1">{p.shortName}</span>
              <span className="font-display text-sm" style={{ color: p.color }}>
                {val}
              </span>
              {delta !== null && delta !== 0 && (
                <span
                  className={clsx(
                    'font-ui uppercase tracking-luxury text-[9px]',
                    delta > 0 ? 'text-forest' : 'text-red-500'
                  )}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
