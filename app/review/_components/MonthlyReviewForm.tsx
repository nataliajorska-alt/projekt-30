'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
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
import { formatMonthPL, formatMonthChipPL, monthNamePL, projectMonthKeys, shiftMonthKey } from './shared'
import ContinuityBanner from './ContinuityBanner'
import { SmallCaps, GoldRule, Fleuron, Diamond } from '@/components/ui'

const DEFAULT_RATINGS: Record<Pillar, number> = {
  pozycja: 3, cialo: 3, styl: 3, kapital: 3, kariera: 3, tozsamosc: 3, milosc: 3,
}

interface MonthlyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  logs: ReturnType<typeof useTimelineData>['logs']
  submitMonthlyReview: ReturnType<typeof useGameData>['submitMonthlyReview']
  monthlyReviews: MonthlyReview[]
}

export default function MonthlyReviewForm({ user, stats, logs, submitMonthlyReview, monthlyReviews }: MonthlyFormProps) {
  const currentMonth = useMemo(() => getMonthKey(getEffectiveNow()), [])
  // Wybrany miesiąc — domyślnie bieżący, ale można cofnąć się i uzupełnić zaległy.
  const [monthKey, setMonthKey] = useState(currentMonth)
  // Historia z Firestore ładuje się raz przy wejściu na stronę, więc to, co zapiszemy
  // w tej sesji, trzymamy lokalnie — inaczej wybór miesiąca pokazywałby nieaktualny stan.
  const [justSaved, setJustSaved] = useState<Record<string, MonthlyReview>>({})

  const months = useMemo(() => projectMonthKeys(currentMonth), [currentMonth])

  const reviewsByMonth = useMemo(() => {
    const byMonth: Record<string, MonthlyReview> = {}
    for (const r of monthlyReviews) byMonth[r.month] = r
    return { ...byMonth, ...justSaved }
  }, [monthlyReviews, justSaved])

  const closedMonths = useMemo(() => {
    const set = new Set<string>(stats.reviewedMonths ?? [])
    for (const key of Object.keys(reviewsByMonth)) set.add(key)
    return set
  }, [stats.reviewedMonths, reviewsByMonth])

  const pendingMonths = useMemo(
    () => months.filter(m => m < currentMonth && !closedMonths.has(m)),
    [months, currentMonth, closedMonths],
  )

  const existing = reviewsByMonth[monthKey] ?? null
  const prevReview = useMemo(() => {
    const earlier = Object.keys(reviewsByMonth).filter(k => k < monthKey).sort()
    const key = earlier[earlier.length - 1]
    return key ? reviewsByMonth[key] : null
  }, [reviewsByMonth, monthKey])

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
  const [ratings, setRatings] = useState<Record<Pillar, number>>({ ...DEFAULT_RATINGS })
  const [savedMonth, setSavedMonth] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)
  const [showContext, setShowContext] = useState(false)

  // Formularz trzyma treść wybranego miesiąca: przy zmianie miesiąca (i gdy historia
  // dojedzie z Firestore) wczytujemy zapisany przegląd, ale nigdy nie kasujemy tego,
  // co użytkowniczka już wpisała.
  const hydratedFor = useRef<string | null>(null)
  const dirty = useRef(false)
  useEffect(() => {
    const monthChanged = hydratedFor.current !== monthKey
    if (!monthChanged && dirty.current) return
    hydratedFor.current = monthKey
    dirty.current = false
    if (monthChanged) {
      setSavedMonth(null)
      setXpGranted(false)
    }
    setHighlights(existing?.highlights ?? '')
    setChallenges(existing?.challenges ?? '')
    setIntention(existing?.intentionNextMonth ?? '')
    setRatings({ ...DEFAULT_RATINGS, ...(existing?.pillarsRated ?? {}) })
  }, [monthKey, existing])

  // Baner ciągłości rozwija się sam, kiedy jest co pokazać z poprzedniego miesiąca.
  useEffect(() => { setShowContext(!!prevReview) }, [prevReview])

  const alreadyReviewed = closedMonths.has(monthKey)
  const isBacklog = monthKey < currentMonth

  const hasAnyContent = highlights.trim().length > 0 || challenges.trim().length > 0 || intention.trim().length > 0
  const hasNonDefaultRating = Object.values(ratings).some(r => r !== 3)
  const canSave = hasAnyContent || hasNonDefaultRating

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const review: MonthlyReview = {
        month: monthKey, highlights, challenges,
        pillarsRated: ratings, intentionNextMonth: intention,
        xpEarned: XP_VALUES.monthlyReview, savedAt: new Date().toISOString(),
      }
      const ref = doc(db, ...paths.monthlyReviewDoc(user.uid, monthKey))
      await setDoc(ref, review, { merge: true })
      const granted = await submitMonthlyReview(monthKey)
      setXpGranted(granted)
      setJustSaved(prev => ({ ...prev, [monthKey]: review }))
      setSavedMonth(monthKey)
    } finally {
      setSaving(false)
    }
  }

  const pickMonth = (key: string) => {
    setMonthKey(key)
    setSavedMonth(null)   // klik w miesiąc zawsze wraca do formularza
  }

  const renderMonthPicker = (heading: string) => (
    <div>
      <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
        {heading}
      </SmallCaps>
      <div className="flex flex-wrap gap-x-4 gap-y-2.5 mt-2.5">
        {months.map(key => {
          const active = key === monthKey
          const closed = closedMonths.has(key)
          return (
            <button
              key={key}
              onClick={() => pickMonth(key)}
              aria-pressed={active}
              title={`${formatMonthPL(key)} — ${closed ? 'zamknięty' : 'do uzupełnienia'}`}
              className="group flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <span className="flex items-center gap-1.5 leading-none">
                <Diamond
                  size={5}
                  filled={closed}
                  className={clsx(
                    'transition-colors',
                    active ? 'text-gold' : closed ? 'text-gold-light/70' : 'text-parchment/45',
                  )}
                />
                <span
                  className={clsx(
                    'font-ui uppercase tracking-[0.16em] text-[10px] transition-colors',
                    active ? 'text-gold' : 'text-parchment/70 group-hover:text-gold-light',
                  )}
                >
                  {formatMonthChipPL(key)}
                </span>
              </span>
              <span className={clsx('h-px w-9 transition-colors', active ? 'bg-gold' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
      {pendingMonths.length > 0 && (
        <p className="font-serif-body italic text-parchment/75 text-[12px] mt-3">
          czeka na domknięcie:{' '}
          {pendingMonths.map((key, i) => (
            <span key={key}>
              {i > 0 && ', '}
              <button
                onClick={() => pickMonth(key)}
                className="not-italic font-ui uppercase tracking-[0.12em] text-[10px] text-gold-light underline underline-offset-4 decoration-gold-light/40 hover:text-gold"
              >
                {monthNamePL(key)}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  )

  if (savedMonth) {
    return (
      <div className="space-y-5">
        <div className="ritual-card p-10 text-center">
          <Fleuron size={20} className="text-gold mx-auto mb-4 inline-block" />
          <h2 className="font-display text-dark text-3xl leading-tight">
            {savedMonth < currentMonth ? `${formatMonthPL(savedMonth)} uzupełniony` : 'Miesiąc zamknięty'}
          </h2>
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-xs mx-auto my-5 opacity-50" />
          <p className="font-serif-body italic text-muted text-[14px] leading-relaxed">
            {xpGranted
              ? `+ ${XP_VALUES.monthlyReview} XP za miesięczną ceremonię. idziesz dalej.`
              : 'zaktualizowano. xp za ten miesiąc masz już przyznane.'}
          </p>
        </div>
        {renderMonthPicker('Domknij kolejny miesiąc')}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Ceremonia miesiąca — otwarta na ciemnej scenie (jak mock) */}
      <div className="pt-1 pb-2">
        <SmallCaps tone="gold-light" tracking="editorial" size="xs">Ceremonia miesiąca</SmallCaps>
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mt-1.5">
          <h2 className="font-display text-ivory text-[23px] leading-tight tracking-[-0.4px]">
            {formatMonthPL(monthKey)}
          </h2>
          <span
            className={clsx(
              'font-ui uppercase tracking-[0.18em] text-[8px] border px-2 py-1 leading-none',
              alreadyReviewed
                ? 'text-gold-light border-gold-light/40'
                : isBacklog
                  ? 'text-parchment border-parchment/40'
                  : 'text-parchment/70 border-parchment/25',
            )}
          >
            {alreadyReviewed ? 'zamknięty' : isBacklog ? 'zaległy' : 'w toku'}
          </span>
        </div>
        <div className="flex items-center gap-3.5 my-4 max-w-[380px]">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-light/50" />
          <span className="text-gold text-[9px] leading-none">◆</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-light/50" />
        </div>

        {renderMonthPicker('Który miesiąc domykasz')}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-[18px] mt-6">
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

      {prevReview && (
        <ContinuityBanner
          show={showContext}
          onToggle={() => setShowContext(v => !v)}
          label={`Z poprzedniego miesiąca · ${formatMonthPL(prevReview.month)}`}
          focusLabel="Twoja intencja"
          focusText={prevReview.intentionNextMonth}
          pillarsRated={prevReview.pillarsRated}
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
          {isBacklog ? 'wróć pamięcią do tamtego miesiąca — gdzie byłaś obecna?' : 'gdzie byłaś obecna, gdzie znikałaś?'}
        </p>
        <PillarRating
          ratings={ratings}
          onChange={(id, v) => { dirty.current = true; setRatings(r => ({ ...r, [id]: v })) }}
        />
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
          { value: highlights, set: setHighlights, label: `Co ${isBacklog ? 'tamten' : 'ten'} miesiąc wniósł do twojego życia?`, placeholder: 'decyzje, zmiany, momenty, które chcesz zapamiętać…', rows: 4 },
          { value: challenges, set: setChallenges, label: 'Co się nie udało i czego cię to nauczyło?', placeholder: 'bez wymówek, bez samobiczowania.', rows: 4 },
          { value: intention,  set: setIntention,  label: isBacklog ? `Intencja, z którą weszłaś w ${monthNamePL(shiftMonthKey(monthKey, 1))}` : 'Intencja na nowy miesiąc', placeholder: 'jedno zdanie, które niesiesz dalej.', rows: 3 },
        ].map(f => (
          <div key={f.label}>
            <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
              {f.label}
            </SmallCaps>
            <textarea
              value={f.value}
              onChange={e => { dirty.current = true; f.set(e.target.value) }}
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
                : isBacklog
                  ? `uzupełnij ${monthNamePL(monthKey)} · + ${XP_VALUES.monthlyReview} XP`
                  : `zamknij miesiąc · + ${XP_VALUES.monthlyReview} XP`}
        </SmallCaps>
        <Diamond size={5} className="text-gold" />
      </button>
    </div>
  )
}
