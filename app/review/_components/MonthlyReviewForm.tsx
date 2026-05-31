'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { getMonthKey, XP_VALUES } from '@/lib/gameLogic'
import { getMonthAggregate } from '@/lib/analytics'
import type { MonthlyReview } from '@/types'
import { formatMonthPL } from './shared'
import ContinuityBanner from './ContinuityBanner'
import { SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets } from '@/components/ui'

interface MonthlyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  logs: ReturnType<typeof useTimelineData>['logs']
  submitMonthlyReview: ReturnType<typeof useGameData>['submitMonthlyReview']
  lastReview: MonthlyReview | null
}

export default function MonthlyReviewForm({ user, stats, logs, submitMonthlyReview, lastReview }: MonthlyFormProps) {
  const monthKey = useMemo(() => getMonthKey(new Date()), [])
  const agg = useMemo(() => getMonthAggregate(logs, monthKey), [logs, monthKey])

  const [highlights, setHighlights] = useState('')
  const [challenges, setChallenges] = useState('')
  const [intention, setIntention] = useState('')
  const [ratings, setRatings] = useState<Record<Pillar, number>>({
    pozycja: 3, cialo: 3, styl: 3, kapital: 3, kariera: 3, tozsamosc: 3, milosc: 3,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)

  const [showContext, setShowContext] = useState(!!lastReview)
  const alreadyReviewed = (stats.reviewedMonths ?? []).includes(monthKey)

  const hasAnyContent = highlights.trim().length > 0 || challenges.trim().length > 0 || intention.trim().length > 0
  const hasNonDefaultRating = Object.values(ratings).some(r => r !== 3)
  const canSave = hasAnyContent || hasNonDefaultRating

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const ref = doc(db, 'users', user.uid, 'monthlyReviews', monthKey)
      await setDoc(ref, {
        month: monthKey, highlights, challenges,
        pillarsRated: ratings, intentionNextMonth: intention,
        xpEarned: XP_VALUES.monthlyReview, savedAt: new Date().toISOString(),
      }, { merge: true })
      const granted = await submitMonthlyReview(monthKey)
      setXpGranted(granted)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="ritual-card p-10 text-center">
        <Fleuron size={20} className="text-gold mx-auto mb-4 inline-block" />
        <h2 className="font-display text-dark text-3xl leading-tight">Miesiąc zamknięty</h2>
        <GoldRule variant="diamond" tone="gold-deep" className="max-w-xs mx-auto my-5 opacity-50" />
        <p className="font-serif-body italic text-muted text-[14px] leading-relaxed">
          {xpGranted
            ? `+ ${XP_VALUES.monthlyReview} XP za miesięczną ceremonię. idziesz dalej.`
            : 'zaktualizowano. xp za ten miesiąc masz już przyznane.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Month summary — ritual dark */}
      <div className="relative bg-forest-deep grain-linen text-ivory p-6">
        <CornerBrackets size={14} tone="gold" weight={1} />
        <div className="relative z-10">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Ceremonia miesiąca
          </SmallCaps>
          <h2 className="font-display text-ivory text-3xl leading-tight mt-2 mb-5">
            {formatMonthPL(monthKey)}
          </h2>
          <GoldRule variant="diamond" tone="gold" className="max-w-xs mb-5 opacity-50" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {[
              { label: 'XP miesiąca',  value: agg.totalXP.toLocaleString('pl-PL'), gold: true },
              { label: 'Dni aktywne',  value: String(agg.activeDays) },
              { label: 'Rutyny',       value: String(agg.totalRoutines) },
              { label: 'Side questy',  value: String(agg.totalSideQuests) },
              { label: 'Daily questy', value: String(agg.totalDailyQuests) },
              { label: 'Zasady',       value: String(agg.totalRulesKept) },
            ].map(({ label, value, gold }) => (
              <div key={label}>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
                  {label}
                </SmallCaps>
                <p className={clsx('font-display text-2xl leading-none mt-1', gold ? 'text-gold-light' : 'text-ivory')}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lastReview && (
        <ContinuityBanner
          show={showContext}
          onToggle={() => setShowContext(v => !v)}
          label="Z poprzedniego miesiąca"
          focusLabel="Twoja intencja"
          focusText={lastReview.intentionNextMonth}
          pillarsRated={lastReview.pillarsRated}
        />
      )}

      {/* Pillars */}
      <section className="ritual-card p-6 md:p-8">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Filary miesiąca
        </SmallCaps>
        <h2 className="font-heading text-dark text-xl mt-1">Oceń obecność</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
          gdzie byłaś obecna, gdzie znikałaś?
        </p>
        <div className="space-y-4">
          {PILLARS.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: p.color }}><Diamond size={5} /></span>
                  <span className="font-heading text-dark text-[14px]" style={{ color: p.color }}>
                    {p.shortName}
                  </span>
                </div>
                <span className="font-display text-base" style={{ color: p.color }}>
                  {ratings[p.id as Pillar]}/5
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatings(r => ({ ...r, [p.id]: n }))}
                    className={clsx(
                      'flex-1 h-9 border transition-all flex items-center justify-center',
                      ratings[p.id as Pillar] >= n
                        ? 'text-ivory'
                        : 'bg-cream/40 border-hairline text-muted-light hover:border-gold-light'
                    )}
                    style={ratings[p.id as Pillar] >= n
                      ? { backgroundColor: p.color, borderColor: p.color }
                      : {}}
                  >
                    <span className="font-display text-sm">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reflection */}
      <section className="ritual-card p-6 md:p-8 space-y-5">
        <div>
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Refleksja miesiąca
          </SmallCaps>
          <h2 className="font-heading text-dark text-xl mt-1">Trzy pytania</h2>
        </div>

        {[
          { value: highlights, set: setHighlights, label: 'Co ten miesiąc wniósł do twojego życia?', placeholder: 'decyzje, zmiany, momenty, które chcesz zapamiętać…', rows: 4 },
          { value: challenges, set: setChallenges, label: 'Co się nie udało i czego cię to nauczyło?', placeholder: 'bez wymówek, bez samobiczowania.', rows: 4 },
          { value: intention,  set: setIntention,  label: 'Intencja na nowy miesiąc',                placeholder: 'jedno zdanie, które niesiesz dalej.', rows: 3 },
        ].map(f => (
          <div key={f.label}>
            <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
              {f.label}
            </SmallCaps>
            <textarea
              value={f.value}
              onChange={e => f.set(e.target.value)}
              rows={f.rows}
              className="ritual-ta"
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </section>

      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className="w-full bg-dark-deep text-ivory border border-gold py-4 hover:bg-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        title={!canSave ? 'Oceń przynajmniej jeden filar lub wypełnij jedno pole' : undefined}
      >
        <Diamond size={5} className="text-gold" />
        <SmallCaps tone="ivory" tracking="luxury" size="sm">
          {saving
            ? 'zapisuję…'
            : !canSave
              ? 'wypełnij przynajmniej jedno pole'
              : alreadyReviewed
                ? 'zapisz zmiany'
                : `zamknij miesiąc · + ${XP_VALUES.monthlyReview} XP`}
        </SmallCaps>
        <Diamond size={5} className="text-gold" />
      </button>
    </div>
  )
}
