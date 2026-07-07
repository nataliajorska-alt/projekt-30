'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { Pillar } from '@/types'
import PillarRating from './PillarRating'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { doc, setDoc } from 'firebase/firestore'
import { getMonthKey, XP_VALUES, getEffectiveNow } from '@/lib/gameLogic'
import { getMonthAggregate } from '@/lib/analytics'
import { dailyCigaretteCounts, computeBaseline, ceilingFor, ceilingStatus } from '@/lib/smokeStats'
import type { MonthlyReview } from '@/types'
import { formatMonthPL } from './shared'
import ContinuityBanner from './ContinuityBanner'
import { SmallCaps, GoldRule, Fleuron, Diamond } from '@/components/ui'

interface MonthlyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  logs: ReturnType<typeof useTimelineData>['logs']
  submitMonthlyReview: ReturnType<typeof useGameData>['submitMonthlyReview']
  lastReview: MonthlyReview | null
}

export default function MonthlyReviewForm({ user, stats, logs, submitMonthlyReview, lastReview }: MonthlyFormProps) {
  const monthKey = useMemo(() => getMonthKey(getEffectiveNow()), [])
  const agg = useMemo(() => getMonthAggregate(logs, monthKey), [logs, monthKey])

  // Checkpoint ścieżki papierosowej — jedno pytanie przy każdym miesięcznym podsumowaniu.
  const smokePhase = stats.cigarettesPhase ?? 1
  const cigCeiling = ceilingFor(`${monthKey}-15`)
  const cigAvg = useMemo(() => {
    const counts = dailyCigaretteCounts(logs).filter(c => c.date.slice(0, 7) === monthKey)
    return computeBaseline(counts)?.avgPerDay ?? null
  }, [logs, monthKey])
  const cigStatusWord = { under: 'pod sufitem', at: 'przy suficie', over: 'nad sufitem', unknown: '' }[
    ceilingStatus(cigAvg, cigCeiling?.ceiling ?? null)
  ]

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
      const ref = doc(db, ...paths.monthlyReviewDoc(user.uid, monthKey))
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
      {/* Ceremonia miesiąca — otwarta na ciemnej scenie (jak mock) */}
      <div className="pt-1 pb-2">
        <SmallCaps tone="gold-light" tracking="editorial" size="xs">Ceremonia miesiąca</SmallCaps>
        <h2 className="font-display text-ivory text-[23px] leading-tight mt-1.5 tracking-[-0.4px]">
          {formatMonthPL(monthKey)}
        </h2>
        <div className="flex items-center gap-3.5 my-4 max-w-[380px]">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-light/50" />
          <span className="text-gold text-[9px] leading-none">◆</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-light/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-[18px]">
          {[
            { label: 'XP miesiąca',  value: agg.totalXP.toLocaleString('pl-PL'), gold: true },
            { label: 'Dni aktywne',  value: String(agg.activeDays) },
            { label: 'Rutyny',       value: String(agg.totalRoutines) },
            { label: 'Side questy',  value: String(agg.totalSideQuests) },
            { label: 'Daily questy', value: String(agg.totalDailyQuests) },
            { label: 'Zasady',       value: String(agg.totalRulesKept) },
          ].map(({ label, value, gold }) => (
            <div key={label}>
              <div className="font-ui uppercase tracking-[0.2em] text-[8px] text-gold-light/85 whitespace-nowrap">{label}</div>
              <div className={clsx('font-display font-medium text-[20px] leading-none mt-1.5 tabular-nums', gold ? 'text-gold-light' : 'text-parchment')}>
                {value}
              </div>
            </div>
          ))}
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

      {/* Checkpoint ścieżki papierosowej — cadence miesięczna (PLAN_PALENIE / Faza 2) */}
      {smokePhase >= 2 && cigCeiling && (
        <section className="ritual-card p-6 md:p-8">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Oddech · checkpoint miesiąca
          </SmallCaps>
          <h2 className="font-heading text-dark text-xl mt-1">Ścieżka papierosowa</h2>
          <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
            sufit {cigCeiling.month.replace('-', '.')}: <b className="not-italic font-heading text-gold-deep">maks. {cigCeiling.ceiling}</b> / dzień
            {cigAvg != null && (
              <> · średnia miesiąca: <b className="not-italic font-heading text-dark">{String(cigAvg).replace('.', ',')}</b>{cigStatusWord && <span className="text-muted-light"> · {cigStatusWord}</span>}</>
            )}
          </p>
          <ul className="mt-4 space-y-1.5">
            {[
              'czy sufit tego miesiąca był dotrzymany (średnia ≤ plan)?',
              'który trigger dominował i czy zamiennik zadziałał?',
              'czy nie ma kompensacji (dłuższe, głębsze zaciąganie)?',
            ].map(q => (
              <li key={q} className="font-serif-body italic text-muted text-[13px] pl-4 relative leading-snug">
                <span className="absolute left-0 top-0 text-gold-deep">·</span>{q}
              </li>
            ))}
          </ul>
          <p className="font-serif-body italic text-muted-light text-[12px] mt-3">
            spokojne lustro, nie ocena — papieros to dane.
          </p>
        </section>
      )}

      {/* Pillars */}
      <section className="ritual-card p-6 md:p-8">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Filary miesiąca
        </SmallCaps>
        <h2 className="font-heading text-dark text-xl mt-1">Oceń obecność</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1">
          gdzie byłaś obecna, gdzie znikałaś?
        </p>
        <PillarRating ratings={ratings} onChange={(id, v) => setRatings(r => ({ ...r, [id]: v }))} />
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
