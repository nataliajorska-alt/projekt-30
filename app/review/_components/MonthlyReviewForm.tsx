'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
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
  monthlyReviews: MonthlyReview[]
  reviewsLoading: boolean
}

const DEFAULT_RATINGS: Record<Pillar, number> = {
  pozycja: 3, cialo: 3, styl: 3, kapital: 3, kariera: 3, tozsamosc: 3, milosc: 3,
}

// Wartość spoza skali 1–5 (np. zera z fallbacku parseSafe) nie jest oceną — wraca do 3.
function hydrateRatings(saved?: Record<Pillar, number>): Record<Pillar, number> {
  const out = { ...DEFAULT_RATINGS }
  if (!saved) return out
  for (const id of Object.keys(out) as Pillar[]) {
    const v = saved[id]
    if (typeof v === 'number' && v >= 1 && v <= 5) out[id] = v
  }
  return out
}

function monthsBack(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y!, m! - 1 - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthlyReviewForm({ user, stats, logs, submitMonthlyReview, monthlyReviews, reviewsLoading }: MonthlyFormProps) {
  const currentMonthKey = useMemo(() => getMonthKey(getEffectiveNow()), [])
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const reviewedMonths = stats.reviewedMonths

  // Bieżący miesiąc + trzy wstecz. Zamknięte też są na liście: formularz wczytuje
  // zapisaną treść, więc setDoc(merge) nie ma już czego wyzerować.
  const selectableMonths = useMemo(
    () => [0, 1, 2, 3].map(n => monthsBack(currentMonthKey, n)),
    [currentMonthKey],
  )

  // useReviewHistory czyta kolekcję raz przy montowaniu, więc zapis z tej sesji
  // trzymamy lokalnie — inaczej powrót na ten miesiąc pokazałby stan sprzed zapisu.
  const [sessionDrafts, setSessionDrafts] = useState<Record<string, MonthlyReview>>({})
  const reviewFor = useCallback(
    (key: string) => sessionDrafts[key] ?? monthlyReviews.find(r => r.month === key) ?? null,
    [sessionDrafts, monthlyReviews],
  )

  // Ciągłość liczona od wybranego miesiąca, nie od dzisiaj (kolekcja jest malejąca).
  const previousReview = useMemo(
    () => monthlyReviews.find(r => r.month < monthKey) ?? null,
    [monthlyReviews, monthKey],
  )

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
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)

  const [showContext, setShowContext] = useState(true)
  const alreadyReviewed = (reviewedMonths ?? []).includes(monthKey)

  // Formularz zaczyna od tego, co już jest w bazie dla wybranego miesiąca. Póki
  // kolekcja się wczytuje, nie wypełniamy i nie pozwalamy zapisać (patrz canSave).
  const [hydratedKey, setHydratedKey] = useState<string | null>(null)
  useEffect(() => {
    if (!user || reviewsLoading || hydratedKey === monthKey) return
    const existing = reviewFor(monthKey)
    setHighlights(existing?.highlights ?? '')
    setChallenges(existing?.challenges ?? '')
    setIntention(existing?.intentionNextMonth ?? '')
    setRatings(hydrateRatings(existing?.pillarsRated))
    setHydratedKey(monthKey)
  }, [user, reviewsLoading, hydratedKey, monthKey, reviewFor])

  const handleMonthChange = (key: string) => {
    if (key === monthKey) return
    setMonthKey(key)
    setSaved(false)
    setXpGranted(false)
  }

  const hasAnyContent = highlights.trim().length > 0 || challenges.trim().length > 0 || intention.trim().length > 0
  const hasNonDefaultRating = Object.values(ratings).some(r => r !== 3)
  const contentMissing = alreadyReviewed && !reviewFor(monthKey)
  const ready = !reviewsLoading && hydratedKey === monthKey && !contentMissing
  const canSave = ready && (hasAnyContent || hasNonDefaultRating)

  const handleSave = async () => {
    if (!user || !ready) return
    setSaving(true)
    try {
      const payload: MonthlyReview = {
        month: monthKey, highlights, challenges,
        pillarsRated: ratings, intentionNextMonth: intention,
        xpEarned: XP_VALUES.monthlyReview, savedAt: new Date().toISOString(),
      }
      const ref = doc(db, ...paths.monthlyReviewDoc(user.uid, monthKey))
      await setDoc(ref, payload, { merge: true })
      const granted = await submitMonthlyReview(monthKey)
      setSessionDrafts(d => ({ ...d, [monthKey]: payload }))
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
        <button
          type="button"
          onClick={() => setSaved(false)}
          className="font-ui uppercase tracking-[0.18em] text-[9px] text-muted hover:text-dark border border-gold-deep/30 hover:border-gold-deep px-4 py-2 mt-6 transition-colors"
        >
          wybierz inny miesiąc
        </button>
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
        <div className="flex flex-wrap gap-2 mt-3">
          {selectableMonths.map(key => {
            const closed = (reviewedMonths ?? []).includes(key)
            const note = closed ? 'zamknięty' : key === currentMonthKey ? '' : 'zaległy'
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleMonthChange(key)}
                className={clsx(
                  'font-ui uppercase tracking-[0.18em] text-[9px] px-3 py-1.5 border transition-colors',
                  key === monthKey
                    ? 'border-gold text-gold-light bg-gold/10'
                    : 'border-gold-light/30 text-gold-light/60 hover:border-gold-light/60',
                )}
              >
                {formatMonthPL(key)}
                {note && <span className="ml-1.5 opacity-60">{note}</span>}
              </button>
            )
          })}
        </div>
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

      {previousReview && (
        <ContinuityBanner
          show={showContext}
          onToggle={() => setShowContext(v => !v)}
          label={`Z poprzedniego miesiąca · ${formatMonthPL(previousReview.month)}`}
          focusLabel="Twoja intencja"
          focusText={previousReview.intentionNextMonth}
          pillarsRated={previousReview.pillarsRated}
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
        title={
          contentMissing
            ? 'Ten miesiąc jest zamknięty, ale nie udało się wczytać jego treści — odśwież stronę, żeby zapis jej nie nadpisał'
            : !ready
              ? 'Czekam na wczytanie zapisanych przeglądów'
              : !canSave
                ? 'Oceń przynajmniej jeden filar lub wypełnij jedno pole'
                : undefined
        }
      >
        <Diamond size={5} className="text-gold" />
        <SmallCaps tone="ivory" tracking="luxury" size="sm">
          {saving
            ? 'zapisuję…'
            : contentMissing
              ? 'odśwież — nie mam treści tego miesiąca'
              : !ready
                ? 'wczytuję zapisany miesiąc…'
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
