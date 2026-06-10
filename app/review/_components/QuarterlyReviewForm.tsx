'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import type { MonthlyReview, QuarterlyReview, GhostLogEntryV2, HonestFailureEntry, Pillar } from '@/types'
import { SMOKING_PHASE_META } from '@/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { dateKey, XP_VALUES } from '@/lib/gameLogic'
import { getMonthAggregate, computeStreaks, type LogMap } from '@/lib/analytics'
import { dailyCigaretteCounts, computeBaseline, phase2TargetRange } from '@/lib/smokeStats'
import { GHOST_CATEGORIES } from '@/lib/ghost-data'
import { PILLARS } from '@/lib/pillars'
import { JEWEL } from './PillarRating'
import {
  getCurrentQuarterKey, getQuarterMonths, getQuarterDateRange,
  previousQuarterKey, formatQuarterPL,
} from '@/lib/quarters'
import { formatMonthPL } from './shared'
import { SmallCaps, GoldRule, Fleuron, Diamond, RomanNumeral, CornerBrackets } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface QuarterlyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  logs: ReturnType<typeof useTimelineData>['logs']
  monthlyReviews: MonthlyReview[]
  ghostEntries: GhostLogEntryV2[]
  ghostFailures: HonestFailureEntry[]
  submitQuarterlyReview: ReturnType<typeof useGameData>['submitQuarterlyReview']
  lastReview: QuarterlyReview | null
}

const PILLAR_IDS = PILLARS.map(p => p.id as Pillar)

interface QuarterAgg {
  totalXP: number
  activeDays: number
  totalSideQuests: number
  totalRoutines: number
  totalDailyQuests: number
  totalRulesKept: number
  longestStreak: number
  cigsAvgPerDay: number | null
}

function aggregateQuarter(logs: LogMap, quarterKey: string): QuarterAgg {
  const months = getQuarterMonths(quarterKey)
  const range = getQuarterDateRange(quarterKey)

  const monthAggs = months.map(mk => getMonthAggregate(logs, mk))
  const totals = monthAggs.reduce((acc, m) => ({
    totalXP: acc.totalXP + m.totalXP,
    activeDays: acc.activeDays + m.activeDays,
    totalRoutines: acc.totalRoutines + m.totalRoutines,
    totalDailyQuests: acc.totalDailyQuests + m.totalDailyQuests,
    totalSideQuests: acc.totalSideQuests + m.totalSideQuests,
    totalRulesKept: acc.totalRulesKept + m.totalRulesKept,
  }), { totalXP: 0, activeDays: 0, totalRoutines: 0, totalDailyQuests: 0, totalSideQuests: 0, totalRulesKept: 0 })

  const quarterLogs: LogMap = Object.fromEntries(
    Object.entries(logs).filter(([k]) => k >= range.start && k <= range.end)
  )
  const longestStreak = computeStreaks(quarterLogs).longestStreak

  const cigCounts = dailyCigaretteCounts(logs).filter(c => c.date >= range.start && c.date <= range.end)
  const cigBaseline = computeBaseline(cigCounts)

  return { ...totals, longestStreak, cigsAvgPerDay: cigBaseline?.avgPerDay ?? null }
}

function ProgressLine({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex-1 h-px bg-hairline relative">
      <div className="absolute left-0 top-0 h-px transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export default function QuarterlyReviewForm({
  user, stats, logs, monthlyReviews, ghostEntries, ghostFailures, submitQuarterlyReview, lastReview,
}: QuarterlyFormProps) {
  const currentQuarter = useMemo(() => getCurrentQuarterKey(), [])
  const [quarterKey, setQuarterKey] = useState(currentQuarter)

  const months = useMemo(() => getQuarterMonths(quarterKey), [quarterKey])
  const range = useMemo(() => getQuarterDateRange(quarterKey), [quarterKey])
  const agg = useMemo(() => aggregateQuarter(logs, quarterKey), [logs, quarterKey])
  const monthAggs = useMemo(() => months.map(mk => ({ monthKey: mk, ...getMonthAggregate(logs, mk) })), [logs, months])

  const quarterIdx = Number(quarterKey.slice(1))
  const canGoPrev = quarterIdx > 1
  const canGoNext = quarterKey !== currentQuarter

  const prevKey = previousQuarterKey(quarterKey)
  const prevAgg = useMemo(() => prevKey ? aggregateQuarter(logs, prevKey) : null, [logs, prevKey])

  // Filary — średnia ocen z miesięcznych przeglądów w obrębie kwartału.
  const pillarAvg = useMemo(() => {
    const reviews = monthlyReviews.filter(r => months.includes(r.month))
    if (reviews.length === 0) return null
    const out = {} as Record<Pillar, number>
    for (const p of PILLAR_IDS) {
      const vals = reviews.map(r => r.pillarsRated[p] ?? 0)
      out[p] = Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
    }
    return out
  }, [monthlyReviews, months])

  // Ghost Protocol — wpisy i odmowy z zakresu dat kwartału.
  const quarterGhostEntries = useMemo(
    () => ghostEntries.filter(e => { const dk = dateKey(new Date(e.timestamp)); return dk >= range.start && dk <= range.end }),
    [ghostEntries, range]
  )
  const quarterGhostFailures = useMemo(
    () => ghostFailures.filter(e => { const dk = dateKey(new Date(e.timestamp)); return dk >= range.start && dk <= range.end }),
    [ghostFailures, range]
  )
  const ghostTotal = quarterGhostEntries.length
  const topCat = useMemo(() => {
    if (ghostTotal === 0) return null
    const counts: Record<string, number> = {}
    for (const c of GHOST_CATEGORIES) counts[c.id] = 0
    for (const e of quarterGhostEntries) counts[e.category] = (counts[e.category] ?? 0) + 1
    return GHOST_CATEGORIES.map(c => ({ ...c, count: counts[c.id] })).sort((a, b) => b.count - a.count)[0]
  }, [quarterGhostEntries, ghostTotal])
  const noContactCount = quarterGhostEntries.filter(e => !e.hadContact).length
  const avgIntensity = ghostTotal > 0
    ? (quarterGhostEntries.reduce((s, e) => s + e.intensity, 0) / ghostTotal).toFixed(1)
    : '—'

  // Papierosy — okno dat kwartału, niezależnie od bazy/celu.
  const cigCounts = useMemo(
    () => dailyCigaretteCounts(logs).filter(c => c.date >= range.start && c.date <= range.end),
    [logs, range]
  )
  const cigBaseline = useMemo(() => computeBaseline(cigCounts), [cigCounts])
  const phase = stats.cigarettesPhase ?? 1
  const phaseMeta = SMOKING_PHASE_META[phase]
  const targetRange = stats.cigarettesBaseline !== undefined ? phase2TargetRange(stats.cigarettesBaseline) : null

  // Refleksja — zawsze dla bieżącego kwartału (kwartał w trakcie).
  const [lessons, setLessons] = useState('')
  const [openFronts, setOpenFronts] = useState('')
  const [bridgeToNext, setBridgeToNext] = useState('')
  const [whatChanged, setWhatChanged] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)

  const alreadyReviewed = (stats.reviewedQuarters ?? []).includes(currentQuarter)
  const hasAnyContent = [lessons, openFronts, bridgeToNext, whatChanged].some(v => v.trim().length > 0)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const ref = doc(db, 'users', user.uid, 'quarterlyReviews', currentQuarter)
      await setDoc(ref, {
        quarter: currentQuarter, lessons, openFronts, bridgeToNext, whatChanged,
        xpEarned: XP_VALUES.quarterlyReview, savedAt: new Date().toISOString(),
      }, { merge: true })
      const granted = await submitQuarterlyReview(currentQuarter)
      setXpGranted(granted)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header — dark, jak ceremonia miesiąca */}
      <div className="pt-1 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">Kwartał projektu</SmallCaps>
            <h2 className="font-display text-ivory text-[23px] leading-tight mt-1.5 tracking-[-0.4px] flex items-baseline gap-3">
              <RomanNumeral value={quarterIdx} className="text-gold-light text-xl" />
              <span className="font-serif-body italic font-normal text-parchment text-[15px]">
                {formatQuarterPL(quarterKey)}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => canGoPrev && setQuarterKey(`Q${quarterIdx - 1}`)}
              disabled={!canGoPrev}
              className="w-9 h-9 flex items-center justify-center border border-gold-light/30 text-parchment hover:text-gold-light hover:border-gold transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => canGoNext && setQuarterKey(`Q${quarterIdx + 1}`)}
              disabled={!canGoNext}
              className="w-9 h-9 flex items-center justify-center border border-gold-light/30 text-parchment hover:text-gold-light hover:border-gold transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3.5 my-4 max-w-[380px]">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-light/50" />
          <span className="text-gold text-[9px] leading-none">◆</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-light/50" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-[18px]">
          {[
            { label: 'XP kwartału', value: agg.totalXP.toLocaleString('pl-PL'), gold: true },
            { label: 'Dni aktywne', value: String(agg.activeDays) },
            { label: 'Najdłuższy streak', value: String(agg.longestStreak) },
            { label: 'Side questy', value: String(agg.totalSideQuests) },
            { label: 'Daily questy', value: String(agg.totalDailyQuests) },
            { label: 'Zasady', value: String(agg.totalRulesKept) },
          ].map(({ label, value, gold }) => (
            <div key={label}>
              <div className="font-ui uppercase tracking-[0.2em] text-[8px] text-gold-light/85 whitespace-nowrap">{label}</div>
              <div className={`font-display font-medium text-[20px] leading-none mt-1.5 tabular-nums ${gold ? 'text-gold-light' : 'text-parchment'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Część I — dane */}
      <div className="flex items-center gap-2 mt-2">
        <RomanNumeral value={1} className="text-gold-light text-sm" />
        <SmallCaps tone="gold-light" tracking="editorial" size="xs">Dane</SmallCaps>
      </div>

      {/* Miesiące kwartału */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Po miesiącach
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-4">XP i dni aktywne</h3>
        <div className="space-y-3">
          {monthAggs.map(m => {
            const pct = agg.totalXP > 0 ? Math.round((m.totalXP / agg.totalXP) * 100) : 0
            return (
              <div key={m.monthKey} className="flex items-center gap-3">
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-24 shrink-0">
                  {formatMonthPL(m.monthKey)}
                </SmallCaps>
                <ProgressLine value={pct} max={100} color="rgba(184,150,62,0.7)" />
                <span className="font-display text-dark text-sm tabular-nums w-16 text-right">
                  {m.totalXP.toLocaleString('pl-PL')} XP
                </span>
                <span className="font-serif-body italic text-muted text-[11px] w-16 text-right shrink-0">
                  {m.activeDays} dni
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Filary */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Filary
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Średnia ocena z miesięcy</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          średnia z miesięcznych przeglądów w tym kwartale.
        </p>
        {pillarAvg ? (
          <div className="space-y-3">
            {PILLARS.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-24 shrink-0">
                  {p.shortName}
                </SmallCaps>
                <ProgressLine value={pillarAvg[p.id as Pillar]} color={JEWEL[p.id] ?? p.color} />
                <span className="font-display text-dark text-sm tabular-nums w-10 text-right">
                  {pillarAvg[p.id as Pillar].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-serif-body italic text-muted text-[13px]">
            brak miesięcznych przeglądów w tym kwartale jeszcze.
          </p>
        )}
      </section>

      {/* Ghost Protocol */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Ghost Protocol
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Impulsy i odmowy</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          dane z protokołu w oknie tego kwartału.
        </p>
        {ghostTotal > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="font-display text-dark text-2xl leading-none">{ghostTotal}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">impulsy</SmallCaps>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-1 leading-none">{topCat?.icon}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs">{topCat?.label}</SmallCaps>
            </div>
            <div className="text-center">
              <p className="font-display text-dark text-2xl leading-none">{noContactCount}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">bez kontaktu</SmallCaps>
            </div>
            <div className="text-center">
              <p className="font-display text-dark text-2xl leading-none">{avgIntensity}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">śr. intensywność</SmallCaps>
            </div>
          </div>
        ) : (
          <p className="font-serif-body italic text-muted text-[13px]">
            brak wpisów protokołu w tym kwartale.
          </p>
        )}
        {quarterGhostFailures.length > 0 && (
          <p className="font-serif-body italic text-muted text-[12.5px] mt-4 pt-4 border-t border-gold-light/20">
            + {quarterGhostFailures.length} uczciwych logów — odwaga przyznania też jest danymi.
          </p>
        )}
      </section>

      {/* Papierosy */}
      <section className="bg-[#dcd5bc] border border-gold-light/25 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Oddech
        </SmallCaps>
        <h3 className="font-heading text-dark text-base mt-1 mb-1">Papierosy — licznik, nie wyrok</h3>
        <p className="font-serif-body italic text-muted text-[12.5px] mb-4">
          {phaseMeta.label} · {phaseMeta.period}
        </p>
        {cigBaseline ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center">
              <p className="font-display text-dark text-2xl leading-none">{cigBaseline.avgPerDay}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">śr. / dzień</SmallCaps>
            </div>
            <div className="text-center">
              <p className="font-display text-dark text-2xl leading-none">{cigBaseline.total}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">łącznie</SmallCaps>
            </div>
            <div className="text-center">
              <p className="font-display text-dark text-2xl leading-none">{cigBaseline.daysWithData}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">dni z danymi</SmallCaps>
            </div>
          </div>
        ) : (
          <p className="font-serif-body italic text-muted text-[13px]">
            brak danych o papierosach w tym kwartale.
          </p>
        )}
        {targetRange && (
          <p className="font-serif-body italic text-muted text-[12.5px] mt-4 pt-4 border-t border-gold-light/20">
            cel fazy 2: <span className="not-italic font-heading text-gold-deep">{targetRange.lo}–{targetRange.hi}</span> / dzień
            (baza: {stats.cigarettesBaseline})
          </p>
        )}
      </section>

      {/* Porównanie z poprzednim kwartałem */}
      {prevKey && prevAgg ? (
        <div className="relative bg-forest-deep grain-linen text-ivory border border-gold-light/30 p-6">
          <CornerBrackets size={14} tone="gold" weight={1} />
          <div className="relative z-10">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">
              Porównanie z poprzednim kwartałem
            </SmallCaps>
            <h3 className="font-display text-ivory text-xl mt-2 mb-5">
              vs. {formatQuarterPL(prevKey)}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'XP', now: agg.totalXP, prev: prevAgg.totalXP, fmt: (v: number) => v.toLocaleString('pl-PL') },
                { label: 'Dni aktywne', now: agg.activeDays, prev: prevAgg.activeDays, fmt: (v: number) => String(v) },
                { label: 'Side questy', now: agg.totalSideQuests, prev: prevAgg.totalSideQuests, fmt: (v: number) => String(v) },
                ...(agg.cigsAvgPerDay !== null && prevAgg.cigsAvgPerDay !== null
                  ? [{ label: 'Papierosy / dzień', now: agg.cigsAvgPerDay, prev: prevAgg.cigsAvgPerDay, fmt: (v: number) => String(v) }]
                  : []),
              ].map(({ label, now, prev, fmt }) => {
                const diff = Math.round((now - prev) * 10) / 10
                const positive = diff >= 0
                return (
                  <div key={label} className="flex items-center justify-between">
                    <SmallCaps tone="parchment" tracking="luxury" size="xs">{label}</SmallCaps>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif-body italic text-parchment/60 text-[13px]">{fmt(prev)}</span>
                      <span className="text-parchment/40">→</span>
                      <span className="font-display text-ivory text-sm">{fmt(now)}</span>
                      {diff !== 0 && (
                        <SmallCaps tracking="luxury" size="xs" className={positive ? '!text-gold-light' : '!text-red-300'}>
                          {positive ? '+' : ''}{fmt(diff)}
                        </SmallCaps>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-ivory/15 bg-ivory/5 p-4 text-center">
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
            pierwszy kwartał projektu — punkt odniesienia na przyszłość.
          </SmallCaps>
        </div>
      )}

      {/* Część II — refleksja (zawsze bieżący kwartał) */}
      <div className="flex items-center gap-2 mt-6">
        <RomanNumeral value={2} className="text-gold-light text-sm" />
        <SmallCaps tone="gold-light" tracking="editorial" size="xs">
          Lekcje i most dalej · {formatQuarterPL(currentQuarter)}
        </SmallCaps>
      </div>

      {saved ? (
        <div className="ritual-card p-10 text-center">
          <Fleuron size={20} className="text-gold mx-auto mb-4 inline-block" />
          <h2 className="font-display text-dark text-3xl leading-tight">Kwartał domknięty</h2>
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-xs mx-auto my-5 opacity-50" />
          <p className="font-serif-body italic text-muted text-[14px] leading-relaxed">
            {xpGranted
              ? `+ ${XP_VALUES.quarterlyReview} XP za kwartalną ceremonię. idziesz dalej.`
              : 'zaktualizowano. xp za ten kwartał masz już przyznane.'}
          </p>
        </div>
      ) : (
        <section className="ritual-card p-6 md:p-8 space-y-5">
          {lastReview && (
            <div className="bg-cream/60 border border-gold-light/40 p-5">
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-2">
                Most z {formatQuarterPL(lastReview.quarter)}
              </SmallCaps>
              <p className="font-serif-body italic text-dark text-[13.5px] leading-relaxed">
                {lastReview.bridgeToNext || lastReview.whatChanged}
              </p>
            </div>
          )}

          {[
            { value: lessons, set: setLessons, label: 'Lekcje tego kwartału', placeholder: 'co się sprawdziło, czego się nauczyłaś — bez wymówek, bez samobiczowania.', rows: 4 },
            { value: openFronts, set: setOpenFronts, label: 'Otwarte fronty', placeholder: 'co zostaje niedokończone, co świadomie odkładasz dalej.', rows: 3 },
            { value: bridgeToNext, set: setBridgeToNext, label: 'Most do następnego kwartału', placeholder: 'jedna decyzja albo intencja, którą niesiesz dalej.', rows: 3 },
            { value: whatChanged, set: setWhatChanged, label: 'Co zmieniło się we mnie', placeholder: 'jedno zdanie.', rows: 2 },
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

          <button
            onClick={handleSave}
            disabled={saving || !hasAnyContent}
            className="w-full bg-dark-deep text-ivory border border-gold py-4 hover:bg-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            title={!hasAnyContent ? 'Wypełnij przynajmniej jedno pole' : undefined}
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="sm">
              {saving
                ? 'zapisuję…'
                : !hasAnyContent
                  ? 'wypełnij przynajmniej jedno pole'
                  : alreadyReviewed
                    ? 'zapisz zmiany'
                    : `zamknij kwartał · + ${XP_VALUES.quarterlyReview} XP`}
            </SmallCaps>
            <Diamond size={5} className="text-gold" />
          </button>
        </section>
      )}
    </div>
  )
}
