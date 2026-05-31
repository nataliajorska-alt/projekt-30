'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { ChevronDown } from 'lucide-react'
import type { WeeklyReview, MonthlyReview } from '@/types'
import PillarTrendChart from '@/components/PillarTrendChart'
import { formatMonthPL, formatWeekRange } from './shared'
import { SmallCaps, Fleuron, RomanNumeral } from '@/components/ui'
import { JEWEL } from './PillarRating'

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
    <div className="overflow-hidden border border-gold-light/20" style={{ background: '#dcd5bc' }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left">
        <div className="min-w-0">
          <h3 className="font-display font-medium text-[19px] text-dark leading-none tracking-[-0.2px]">{title}</h3>
          <div className="font-ui uppercase tracking-[0.26em] text-[9px] text-muted mt-2">{sub}</div>
        </div>
        <ChevronDown
          size={15}
          className={clsx('text-gold-deep transition-transform shrink-0', isOpen && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t" style={{ borderColor: '#cfc4a0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Block({ label, body, italic = false }: { label: string; body: string; italic?: boolean }) {
  return (
    <div>
      <div className="font-ui uppercase tracking-[0.3em] text-[10px] text-gold-deep mt-[18px] mb-2">{label}</div>
      <p className={clsx(
        'font-serif-body text-[15px] leading-[1.62]',
        italic ? 'italic text-muted' : 'text-dark'
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
      <div className="font-ui uppercase tracking-[0.3em] text-[10px] text-gold-deep mt-[18px] mb-3">Filary</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PILLARS.map(p => {
          const c = JEWEL[p.id] ?? p.color
          const val = pillarsRated[p.id as Pillar] ?? 0
          const prevVal = prevRated?.[p.id as Pillar] ?? null
          const delta = prevVal !== null ? val - prevVal : null
          return (
            <div key={p.id} className="flex items-center justify-between gap-2 border px-3.5 py-3" style={{ borderColor: '#cfc4a0' }}>
              <span className="font-serif-body text-[14px] text-dark flex items-center gap-2.5">
                <span className="text-[8px]" style={{ color: c }}>◆</span>{p.shortName}
              </span>
              <span className="font-display font-medium text-[14px] flex items-baseline gap-1.5" style={{ color: c }}>
                {val}
                {delta !== null && delta !== 0 && (
                  <span className="font-ui text-[9px]" style={{ color: delta > 0 ? '#5d7356' : '#9c413a' }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
