'use client'
import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useVault } from '@/hooks/useVault'
import { usePhotos } from '@/hooks/usePhotos'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { useAuth } from '@/hooks/useAuth'
import { PILLARS } from '@/lib/pillars'
import { MOOD_STATES } from '@/types'
import {
  getLevelFromXP, getNextLevel, LEVELS,
  PROJECT_START, PROJECT_END, getDaysElapsed, getEffectiveNow,
} from '@/lib/gameLogic'
import { aggregateXpByMonth } from '@/lib/analytics'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { Printer, Lock, Star, Camera } from 'lucide-react'
import type { Pillar } from '@/types'
import {
  SmallCaps, Fleuron, Diamond,
} from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const IS_REPORT_DAY = new Date() >= PROJECT_END
const REPORT_DATE_STR = '5 kwietnia 2027'

const PL_MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']

const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fmtK = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`)

// ── Section panel (editorial frame with corner brackets) ─────────

function Panel({ num, eyebrow, title, note, children }: {
  num: number
  eyebrow: string
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="relative bg-ivory border border-hairline px-6 py-7 sm:px-10 sm:py-9 mt-8 print:break-inside-avoid">
      <span className="pointer-events-none absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-gold-light/85" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-gold-light/85" />
      <div className="flex items-baseline gap-3">
        <span className="font-display italic text-gold-light text-[15px] leading-none">{toRoman(num)}</span>
        <SmallCaps tone="gold-deep" tracking="editorial" size="xs">{eyebrow}</SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[26px] leading-[1.05] tracking-tight mt-2.5">{title}</h2>
      {note && (
        <p className="font-serif-body italic text-muted text-[14px] mt-1.5">{note}</p>
      )}
      {children}
    </section>
  )
}

// ── Annual reflection form ──────────────────────────────────────

interface ReflectionFormProps {
  uid: string
  existing: Record<string, string> | null
}

function ReflectionForm({ uid, existing }: ReflectionFormProps) {
  const fields = [
    { key: 'wordOfTheYear', label: 'Jedno słowo opisujące ten rok', placeholder: 'np. klarowność, odwaga, fundament…' },
    { key: 'biggestLesson', label: 'Największa lekcja tego roku', placeholder: 'co zrozumiałaś, czego wcześniej nie wiedziałaś?' },
    { key: 'proudestMoment', label: 'Z czego jesteś najbardziej dumna?', placeholder: 'jeden moment, który definiuje rok.' },
    { key: 'whatChanged', label: 'Co realnie się zmieniło?', placeholder: 'konkretnie — w sobie, w relacjach, w życiu.' },
    { key: 'letterToNext', label: 'List do Natalii 31', placeholder: 'co chcesz, żeby wiedziała idąc dalej?' },
  ]

  const [values, setValues] = useState<Record<string, string>>(existing ?? {})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, ...paths.dataDoc(uid, 'annualReflection')),
        { ...values, savedAt: new Date().toISOString() },
        { merge: true }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!IS_REPORT_DAY) {
    return (
      <div className="mt-8 border border-dashed border-gold-light px-9 py-11 text-center">
        <Lock size={20} className="text-gold mx-auto mb-4" strokeWidth={1.5} />
        <SmallCaps tone="muted" tracking="editorial" size="xs" as="div">
          formularz refleksji otwiera się <b className="text-dark font-semibold">{REPORT_DATE_STR}</b>
        </SmallCaps>
        <p className="font-serif-body italic text-muted-light text-[14px] mt-3 leading-relaxed">
          na razie zbieraj dane i oznaczaj kluczowe momenty.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 mt-8">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
            {label}
          </SmallCaps>
          <textarea
            value={values[key] ?? ''}
            onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={key === 'letterToNext' ? 5 : 3}
            className="w-full font-serif-body italic text-[14px] text-dark bg-cream/40 px-4 py-3 border border-hairline outline-none focus:border-gold resize-none placeholder:text-muted-light/60 transition-colors leading-relaxed"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
      >
        <Diamond size={5} className="text-gold" />
        <SmallCaps tone="ivory" tracking="luxury" size="xs">
          {saved ? 'zapisane ◆' : saving ? 'zapisuję…' : 'zapisz refleksję roczną'}
        </SmallCaps>
      </button>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────

export default function ReportPage() {
  const { user } = useAuth()
  const { stats, loading: gameLoading } = useGameData()
  const { logs, loading: logsLoading } = useTimelineData()
  const { entries: vaultEntries, loading: vaultLoading } = useVault()
  const { photos, loading: photosLoading } = usePhotos()
  const { entries: ghostEntries } = useGhostV2()
  useReviewHistory()

  const loading = gameLoading || logsLoading || vaultLoading || photosLoading

  // Entrance animation trigger (bars / fills grow from zero on mount)
  const [lit, setLit] = useState(false)
  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => setLit(true), 90)
    return () => clearTimeout(t)
  }, [loading])

  const data = useMemo(() => {
    const currentLevel = getLevelFromXP(stats.totalXP)
    const nextLevel = getNextLevel(stats.totalXP)
    const logArray = Object.values(logs)
    const activeDays = logArray.filter(l => l.totalXP > 0).length

    // ── 12-month project arc (kwi 2026 → mar 2027) ──
    const monthly = aggregateXpByMonth(logs)
    const xpByKey: Record<string, number> = {}
    for (const m of Object.values(monthly)) xpByKey[m.monthKey] = m.totalXP
    const nowKey = monthKeyOf(getEffectiveNow())

    const arcMonths = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(PROJECT_START)
      d.setMonth(d.getMonth() + i)
      const key = monthKeyOf(d)
      const xp = xpByKey[key] ?? 0
      return {
        key,
        xp,
        label: PL_MONTHS[d.getMonth()].slice(0, 3),
        isFuture: key > nowKey,
        isNow: key === nowKey,
      }
    })
    const recorded = arcMonths.filter(m => !m.isFuture && m.xp > 0)
    const avgMonthXP = recorded.length
      ? Math.round(recorded.reduce((s, m) => s + m.xp, 0) / recorded.length)
      : 0
    const maxMonthXP = Math.max(0, ...arcMonths.map(m => m.xp))
    const bestKey = recorded.length
      ? recorded.reduce((a, b) => (b.xp > a.xp ? b : a)).key
      : null
    const bestMonth = bestKey ? arcMonths.find(m => m.key === bestKey)! : null
    // Y-axis max: multiple of 4000 so quarter-gridlines are round; min 12k
    const chartMax = Math.max(12000, Math.ceil((maxMonthXP * 1.12) / 4000) * 4000)

    // ── pillars ──
    const pillarRaw = PILLARS.map(p => ({
      id: p.id,
      name: p.shortName,
      descriptor: p.name.toLowerCase(),
      color: p.color,
      xp: stats.pillarXP[p.id as Pillar] ?? 0,
    })).sort((a, b) => b.xp - a.xp)
    const totalPillarXP = pillarRaw.reduce((s, p) => s + p.xp, 0) || 1
    const maxPct = Math.max(1, ...pillarRaw.map(p => Math.round((p.xp / totalPillarXP) * 100)))
    const pillarData = pillarRaw.map(p => ({
      ...p,
      pct: Math.round((p.xp / totalPillarXP) * 100),
    }))

    // ── mood / energy ──
    const allCheckIns = logArray.flatMap(l => l.moodCheckIns ?? [])
    const avgMood = allCheckIns.length
      ? Math.round((allCheckIns.reduce((s, c) => s + c.mood, 0) / allCheckIns.length) * 10) / 10
      : null
    const avgEnergy = allCheckIns.length
      ? Math.round((allCheckIns.reduce((s, c) => s + c.energy, 0) / allCheckIns.length) * 10) / 10
      : null
    const stateCounts: Record<string, number> = { calm: 0, storm: 0, fog: 0, clarity: 0 }
    for (const ci of allCheckIns) stateCounts[ci.state]++
    const dominantState = allCheckIns.length
      ? Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null

    // ── key moments (sorted, with day-gap bridges) ──
    const keyMoments = logArray
      .filter(l => l.keyMoment?.title)
      .sort((a, b) => a.date.localeCompare(b.date))

    // ── photos oldest→newest ──
    const reportPhotos = [...photos]
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(0, 12)

    const totalSideQuests = logArray.reduce((s, l) => s + (l.completedSideQuests?.length ?? 0), 0)

    return {
      currentLevel, nextLevel, activeDays, arcMonths, avgMonthXP, bestMonth, chartMax,
      pillarData, maxPct, avgMood, avgEnergy, dominantState,
      keyMoments, reportPhotos, totalSideQuests,
    }
  }, [stats, logs, photos])

  const {
    currentLevel, nextLevel, activeDays, arcMonths, avgMonthXP, bestMonth, chartMax,
    pillarData, maxPct, avgMood, avgEnergy, dominantState,
    keyMoments, reportPhotos, totalSideQuests,
  } = data

  const dominantStateMeta = MOOD_STATES.find(s => s.value === dominantState)
  const totalXP = stats.totalXP
  const daysElapsed = getDaysElapsed()
  const levelsBehind = currentLevel.level - 1
  const levelsAhead = LEVELS.length - currentLevel.level

  const PLOT = 210 // px — bar plot height
  const axisLabels = [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0]

  if (loading) {
    return (
      <div className="min-h-screen bg-cream grain-parchment flex items-center justify-center">
        <Fleuron size={20} className="text-gold animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-cream grain-parchment min-h-screen">
      <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-24 animate-fade-in">
        {/* Header + print */}
        <header className="flex items-start justify-between gap-6 print:hidden">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <SmallCaps tone="muted" tracking="editorial" size="xs">Annual Report</SmallCaps>
              <span className="text-gold text-[10px]">∴</span>
              <SmallCaps tone="muted" tracking="editorial" size="xs">Podgląd</SmallCaps>
            </div>
            <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.5rem)] leading-none tracking-tight mt-3">
              Rok Natalii
            </h1>
            <p className="font-serif-body italic text-muted text-[15px] mt-3">
              5 kwietnia 2026 <span className="not-italic text-gold-deep mx-1.5">→</span> 5 kwietnia 2027
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-3 px-5 py-3 bg-dark text-ivory border border-gold-deep hover:bg-forest transition-colors shrink-0"
          >
            <Printer size={14} strokeWidth={1.5} className="text-gold-light" />
            <SmallCaps tone="ivory" tracking="editorial" size="xs">drukuj · PDF</SmallCaps>
          </button>
        </header>

        {!IS_REPORT_DAY && (
          <div className="mt-7 bg-ivory border border-hairline border-l-2 border-l-gold px-6 py-4 print:hidden">
            <p className="font-serif-body italic text-muted text-[14.5px] leading-relaxed">
              <b className="not-italic font-semibold text-dark">Podgląd raportu</b> — dane w czasie rzeczywistym.
              pełny raport będzie gotowy {REPORT_DATE_STR}. oznaczaj kluczowe momenty każdego dnia.
            </p>
          </div>
        )}

        {/* ── COVER ─────────────────────────────────────────── */}
        <section className="relative bg-dark grain-linen text-ivory mt-8 px-8 py-14 sm:px-14 sm:py-[68px] text-center overflow-hidden print:break-after-page">
          <div className="pointer-events-none absolute inset-4 border border-gold-light/40" />
          <span className="pointer-events-none absolute top-7 left-7 w-[22px] h-[22px] border-t border-l border-gold-light" />
          <span className="pointer-events-none absolute top-7 right-7 w-[22px] h-[22px] border-t border-r border-gold-light" />
          <span className="pointer-events-none absolute bottom-7 left-7 w-[22px] h-[22px] border-b border-l border-gold-light" />
          <span className="pointer-events-none absolute bottom-7 right-7 w-[22px] h-[22px] border-b border-r border-gold-light" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-4">
              <span className="w-9 h-px bg-gold-light/45" />
              <SmallCaps tone="gold-light" tracking="editorial" size="xs">Annual Report · Projekt 30</SmallCaps>
              <span className="w-9 h-px bg-gold-light/45" />
            </div>
            <h2 className="font-display text-[#f3ecd2] text-5xl sm:text-[72px] leading-none tracking-tight mt-7">
              Rok Natalii
            </h2>
            <p className="font-display italic text-gold-light text-lg sm:text-[21px] tracking-wide mt-5">
              5 kwietnia 2026 — 5 kwietnia 2027
            </p>
            <div className="inline-flex flex-col gap-1.5 mt-8 border border-gold-deep/55 px-8 py-3">
              <SmallCaps tone="muted-light" tracking="editorial" size="xs">Obecny poziom</SmallCaps>
              <SmallCaps tone="gold-light" tracking="editorial" size="xs">
                {toRoman(currentLevel.level)} · {currentLevel.name}
              </SmallCaps>
            </div>
            <div className="flex items-center justify-center gap-4 mt-10 max-w-[420px] mx-auto">
              <span className="flex-1 h-px bg-gold-light/40" />
              <span className="text-gold text-[10px]">◆</span>
              <span className="flex-1 h-px bg-gold-light/40" />
            </div>
            <p className="font-serif-body italic text-parchment text-[17px] leading-relaxed max-w-[480px] mx-auto mt-6">
              „nie musisz być jutro inna niż dziś.
              <br />
              wystarczy, że jesteś tu — i działasz."
            </p>
          </div>
        </section>

        {/* ── I · W LICZBACH ───────────────────────────────── */}
        <Panel num={1} eyebrow="365 dni transformacji" title="W liczbach">
          <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_1.5fr] mt-7 border border-hairline">
            {/* Hero tile */}
            <div className="relative bg-dark text-ivory px-7 py-7 flex flex-col justify-center overflow-hidden">
              <span className="pointer-events-none absolute top-3 left-3 w-3 h-3 border-t border-l border-gold-light" />
              <span className="pointer-events-none absolute bottom-3 right-3 w-3 h-3 border-b border-r border-gold-light" />
              <SmallCaps tone="gold-light" tracking="editorial" size="xs">Łączne XP</SmallCaps>
              <div className="font-display text-[#f3ecd2] text-[52px] leading-[0.92] tracking-tight mt-3">
                {totalXP.toLocaleString('pl-PL')}
              </div>
              <div className="w-11 h-px bg-gold-light/50 my-3.5" />
              <p className="font-serif-body italic text-parchment text-[14px]">
                poziom <b className="not-italic font-display text-gold-light">{toRoman(currentLevel.level)}</b> z XXX · {currentLevel.name}
              </p>
            </div>
            {/* Metric grid */}
            <div className="grid grid-cols-2">
              {([
                { n: activeDays.toString(), k: 'Dni aktywnych', note: 'na 365 możliwych' },
                { n: `${stats.longestStreak}`, em: 'dni', k: 'Najdłuższa seria', note: 'najlepszy ciąg z rzędu' },
                { n: totalSideQuests.toString(), k: 'Side questy', note: 'poza główną ścieżką' },
                { n: stats.unlockedAchievements.length.toString(), k: 'Osiągnięcia', note: 'odblokowane pieczęcie' },
              ] as { n: string; em?: string; k: string; note: string }[]).map((c, i) => (
                <div
                  key={c.k}
                  className={clsx(
                    'flex items-baseline gap-3.5 px-5 py-5 border-border',
                    i % 2 === 0 && 'border-r',
                    i < 2 && 'border-b',
                  )}
                >
                  <span className="font-display text-dark text-[28px] leading-none tracking-tight flex-none">
                    {c.n}
                    {c.em && <em className="font-serif-body not-italic text-[15px] text-muted-light ml-1">{c.em}</em>}
                  </span>
                  <span className="flex flex-col gap-1">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">{c.k}</SmallCaps>
                    <span className="font-serif-body italic text-muted-light text-[12.5px]">{c.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* ── II · ŁUK TRANSFORMACJI ───────────────────────── */}
        <Panel
          num={2}
          eyebrow="XP miesiąc po miesiącu"
          title="Łuk transformacji"
          note="dwanaście miesięcy projektu — łuk dopiero się rysuje."
        >
          <div className="mt-8">
            <div className="grid grid-cols-[40px_minmax(0,1fr)] sm:grid-cols-[52px_minmax(0,1fr)] gap-x-3 sm:gap-x-4 gap-y-2.5">
              {/* Y axis */}
              <div className="flex flex-col justify-between items-end" style={{ height: PLOT }}>
                {axisLabels.map((v, i) => (
                  <span key={i} className="font-ui text-[8px] tracking-wide text-muted-light leading-none">
                    {v === 0 ? '0' : fmtK(v)}
                  </span>
                ))}
              </div>
              {/* Plot */}
              <div
                className="relative grid border-l border-hairline gap-2 sm:gap-3"
                style={{ height: PLOT, gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
              >
                {[25, 50, 75, 100].map(p => (
                  <div key={p} className="absolute left-0 right-0 border-t border-border pointer-events-none" style={{ bottom: `${p}%` }} />
                ))}
                {avgMonthXP > 0 && (
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-gold-light pointer-events-none z-[2]"
                    style={{ bottom: `${(avgMonthXP / chartMax) * 100}%` }}
                  >
                    <span className="absolute right-0.5 -top-1.5 -translate-y-full font-ui text-[8px] tracking-[0.18em] uppercase text-gold-deep bg-ivory px-1.5">
                      śr. {avgMonthXP.toLocaleString('pl-PL')} xp
                    </span>
                  </div>
                )}
                {arcMonths.map(m => {
                  const isBest = bestMonth?.key === m.key
                  const showVal = !m.isFuture && (m.xp > 0 || m.isNow)
                  const barH = m.isFuture ? 8 : Math.max(2, (m.xp / chartMax) * PLOT)
                  const barStyle: React.CSSProperties = m.isFuture
                    ? { height: lit ? barH : 8, border: '1px dashed #D9CDA8', borderBottom: 0, background: 'transparent' }
                    : m.isNow
                      ? { height: lit ? barH : 0, background: 'repeating-linear-gradient(135deg, #B29355 0 6px, #C9B27F 6px 12px)' }
                      : { height: lit ? barH : 0, backgroundColor: isBest ? '#8E7338' : '#B29355' }
                  return (
                    <div key={m.key} className="flex flex-col justify-end items-center h-full">
                      {showVal && (
                        <div className={clsx(
                          'text-center font-display font-medium text-[12px] sm:text-[13px] leading-none whitespace-nowrap mb-2',
                          isBest ? 'text-gold-deep' : 'text-dark',
                        )}>
                          {m.xp.toLocaleString('pl-PL')}
                          <small className="font-ui text-[7px] tracking-wide uppercase text-muted-light ml-0.5">xp</small>
                        </div>
                      )}
                      <div
                        className="w-full max-w-[40px] transition-[height] duration-1000 ease-[cubic-bezier(.2,.7,.2,1)]"
                        style={barStyle}
                      />
                    </div>
                  )
                })}
              </div>
              {/* X axis */}
              <div className="col-start-2 grid gap-2 sm:gap-3" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
                {arcMonths.map(m => (
                  <span
                    key={m.key}
                    className={clsx(
                      'text-center font-ui text-[8px] sm:text-[9px] tracking-wide uppercase leading-tight',
                      m.isFuture ? 'text-muted-light' : 'text-gold-deep font-medium',
                    )}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Foot: legend + tally */}
            <div className="flex items-center gap-6 flex-wrap mt-7 pt-4 border-t border-border">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 bg-gold" />
                <SmallCaps tone="muted" tracking="luxury" size="xs">Zapisany miesiąc</SmallCaps>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3" style={{ background: 'repeating-linear-gradient(135deg, #B29355 0 6px, #C9B27F 6px 12px)' }} />
                <SmallCaps tone="muted" tracking="luxury" size="xs">W toku</SmallCaps>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 border border-dashed border-muted-light" />
                <SmallCaps tone="muted" tracking="luxury" size="xs">Przed Tobą</SmallCaps>
              </div>
              {bestMonth && (
                <p className="ml-auto font-serif-body italic text-muted text-[13.5px]">
                  najlepszy miesiąc — <b className="not-italic font-display text-gold-deep text-[15px] px-0.5">{PL_MONTHS[Number(bestMonth.key.split('-')[1]) - 1].toLowerCase()}</b> · {bestMonth.xp.toLocaleString('pl-PL')} xp
                </p>
              )}
            </div>
          </div>

          {/* Droga przez poziomy */}
          <div className="mt-11">
            <div className="flex items-center gap-2.5">
              <span className="text-gold text-[7px]">◆</span>
              <SmallCaps tone="gold-deep" tracking="editorial" size="xs">Droga przez poziomy</SmallCaps>
            </div>
            <div className="flex gap-1 mt-5">
              {LEVELS.map(lvl => {
                const isCur = lvl.level === currentLevel.level
                const isDone = lvl.level < currentLevel.level
                return (
                  <div
                    key={lvl.level}
                    className={clsx(
                      'group relative flex-1 h-3.5',
                      isDone ? 'bg-gold' : isCur ? 'bg-dark' : 'bg-border',
                    )}
                  >
                    {isCur && (
                      <span className="absolute left-1/2 -top-[7px] -translate-x-1/2 rotate-45 w-2 h-2 bg-dark" />
                    )}
                    <span className="pointer-events-none absolute left-1/2 bottom-[calc(100%+14px)] -translate-x-1/2 bg-dark text-ivory font-ui text-[9px] tracking-[0.18em] uppercase px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-[3]">
                      <i className="font-display not-italic italic text-gold-light mr-1.5 text-[11px]">{toRoman(lvl.level)}</i>{lvl.name}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-3.5">
              <div className="flex flex-col gap-1">
                <span className="font-display italic text-muted-light text-[14px]">{toRoman(LEVELS[0].level)}</span>
                <SmallCaps tone="muted" tracking="luxury" size="xs">{LEVELS[0].name}</SmallCaps>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="font-display italic text-dark text-[16px]">{toRoman(currentLevel.level)}</span>
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs">{currentLevel.name} · jesteś tu</SmallCaps>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="font-display italic text-muted-light text-[14px]">{toRoman(LEVELS[LEVELS.length - 1].level)}</span>
                <SmallCaps tone="muted" tracking="luxury" size="xs">{LEVELS[LEVELS.length - 1].name}</SmallCaps>
              </div>
            </div>
            {nextLevel && (
              <div className="mt-5 pt-4 border-t border-border flex items-baseline gap-2 font-serif-body italic text-muted text-[13.5px]">
                <span className="not-italic text-gold text-[9px]">◆</span>
                <span>
                  następny próg: <b className="font-display not-italic font-medium text-gold-deep">{toRoman(nextLevel.level)} · {nextLevel.name}</b>
                  {' — '}{levelsBehind} {levelsBehind === 1 ? 'poziom' : 'poziomów'} za Tobą, {levelsAhead} przed Tobą.
                </span>
              </div>
            )}
          </div>
        </Panel>

        {/* ── III · SIEDEM FILARÓW ─────────────────────────── */}
        <Panel num={3} eyebrow="Gdzie kierowałaś energię" title="Siedem filarów">
          {/* Spectrum bar */}
          <div className="flex h-[46px] mt-8 border border-hairline overflow-hidden">
            {pillarData.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center px-3 relative overflow-hidden transition-[width] duration-1000 ease-[cubic-bezier(.2,.7,.2,1)]"
                style={{
                  width: lit ? `${p.pct}%` : '0%',
                  backgroundColor: p.color,
                  borderLeft: i === 0 ? undefined : '1px solid rgba(248,243,230,.55)',
                }}
                title={`${p.name} · ${p.pct}%`}
              >
                {p.pct >= 13 && (
                  <span
                    className={clsx(
                      'font-ui text-[8px] tracking-[0.18em] uppercase whitespace-nowrap flex items-center gap-1.5 transition-opacity duration-500 delay-500',
                      lit ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{ color: 'rgba(248,243,230,.78)', textShadow: '0 1px 2px rgba(20,20,16,.28)' }}
                  >
                    {p.name} <b className="font-semibold text-[11px] tracking-[0.04em]" style={{ color: 'rgba(248,243,230,.98)' }}>{p.pct}%</b>
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2.5">
            <SmallCaps tone="muted" tracking="luxury" size="xs">← więcej energii</SmallCaps>
            <SmallCaps tone="muted" tracking="luxury" size="xs">mniej energii →</SmallCaps>
          </div>

          {/* Pillar rows */}
          <div className="mt-8">
            {pillarData.map((p, i) => {
              const fw = (p.pct / maxPct) * 100
              return (
                <div
                  key={p.id}
                  className="grid items-center gap-3 sm:gap-5 py-3.5 border-t border-border first:border-t-0"
                  style={{ gridTemplateColumns: '28px minmax(120px, 1.2fr) minmax(0, 2.1fr) 64px' }}
                >
                  <span className={clsx('font-display italic text-center text-[18px]', i === 0 ? 'text-gold-deep' : 'text-gold-light')}>
                    {toRoman(i + 1)}
                  </span>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rotate-45 flex-none" style={{ backgroundColor: p.color }} />
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-display font-medium text-dark text-[15px] sm:text-[16px] leading-none tracking-tight truncate">{p.name}</span>
                      <span className="font-serif-body italic text-muted-light text-[12px] sm:text-[12.5px] leading-tight truncate">{p.descriptor}</span>
                    </span>
                  </span>
                  <span className="relative h-3.5 bg-cream-warm">
                    <span
                      className="absolute left-0 top-0 h-full transition-[width] duration-1000 ease-[cubic-bezier(.2,.7,.2,1)]"
                      style={{ width: lit ? `${fw}%` : '0%', backgroundColor: p.color }}
                    />
                    <span
                      className={clsx('absolute top-1/2 -translate-y-1/2 font-ui text-[8.5px] tracking-[0.16em] uppercase text-muted whitespace-nowrap transition-opacity duration-500 delay-[1000ms] hidden sm:block', lit ? 'opacity-100' : 'opacity-0')}
                      style={{ left: `calc(${lit ? fw : 0}% + 10px)`, transitionProperty: 'opacity, left' }}
                    >
                      <b className="font-display italic font-medium text-[12px] text-gold-deep mr-1">{p.xp.toLocaleString('pl-PL')}</b>xp
                    </span>
                  </span>
                  <span className={clsx('font-display font-medium text-right text-[20px] sm:text-[21px] leading-none tracking-tight', i === 0 ? 'text-gold-deep' : 'text-dark')}>
                    {p.pct}<em className="font-serif-body not-italic text-[12px] text-muted-light">%</em>
                  </span>
                </div>
              )
            })}
          </div>

          {pillarData.length >= 2 && pillarData[0].xp > 0 && (
            <p className="mt-6 pt-4 border-t border-border font-serif-body italic text-muted text-[13.5px]">
              najwięcej energii poszło do filarów <b className="not-italic font-display font-medium text-gold-deep">{pillarData[0].name}</b> i <b className="not-italic font-display font-medium text-gold-deep">{pillarData[1].name}</b> — to one niosą ten rok.
            </p>
          )}
        </Panel>

        {/* ── IV · NASTRÓJ ROKU ────────────────────────────── */}
        {(avgMood !== null || avgEnergy !== null) && (
          <Panel num={4} eyebrow="Check-iny emocjonalne" title="Nastrój roku">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_220px] gap-8 lg:gap-10 mt-9 items-start">
              {[
                { lbl: 'Śr. nastrój', val: avgMood, cap: 'tuż pod środkiem skali — rok pracy, nie laurki.' },
                { lbl: 'Śr. energia', val: avgEnergy, cap: 'ciało prowadzi — energia napędza resztę.' },
              ].map(s => s.val !== null && (
                <div key={s.lbl}>
                  <div className="flex items-baseline justify-between mb-4">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">{s.lbl}</SmallCaps>
                    <span className="font-display text-dark text-[30px] leading-none tracking-tight">
                      {s.val!.toFixed(1)} <em className="font-serif-body not-italic text-[15px] text-muted-light">/ 5</em>
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-cream-warm my-4">
                    <div
                      className="absolute left-0 top-0 h-full bg-gold transition-[width] duration-1000 ease-[cubic-bezier(.2,.7,.2,1)]"
                      style={{ width: lit ? `${(s.val! / 5) * 100}%` : '0%' }}
                    />
                    <div
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-[11px] h-[11px] bg-gold-deep transition-[left] duration-1000 ease-[cubic-bezier(.2,.7,.2,1)]"
                      style={{ left: lit ? `${(s.val! / 5) * 100}%` : '0%', boxShadow: '0 0 0 3px #FAF8F4' }}
                    />
                  </div>
                  <div className="flex justify-between font-display italic text-muted-light text-[11.5px]">
                    {['i', 'ii', 'iii', 'iv', 'v'].map(t => <span key={t}>{t}</span>)}
                  </div>
                  <p className="mt-3 font-serif-body italic text-muted text-[13px]">{s.cap}</p>
                </div>
              ))}
              {dominantStateMeta && (
                <div className="text-center sm:col-span-2 lg:col-span-1 lg:border-l lg:border-border lg:pl-10 flex flex-col justify-center">
                  <SmallCaps tone="muted" tracking="editorial" size="xs">Dominujący stan</SmallCaps>
                  <div className="font-display italic font-medium text-dark text-[40px] leading-none tracking-tight mt-3.5">
                    {capitalize(dominantStateMeta.label)}
                  </div>
                  <div className="flex items-center gap-3 w-[124px] mx-auto mt-4 mb-0.5">
                    <span className="flex-1 h-px bg-hairline" />
                    <svg viewBox="0 0 28 28" fill="none" className="w-[26px] h-[26px] block">
                      <circle cx="14" cy="14" r="13" stroke="#C9B27F" strokeWidth="1" opacity=".5" />
                      <circle cx="14" cy="14" r="8" stroke="#B29355" strokeWidth="1" />
                      <circle cx="14" cy="14" r="2.6" fill="#8E7338" />
                    </svg>
                    <span className="flex-1 h-px bg-hairline" />
                  </div>
                  <p className="mt-3 font-serif-body italic text-muted-light text-[12.5px]">najczęściej zaznaczany w check-inach</p>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* ── V · KLUCZOWE MOMENTY ─────────────────────────── */}
        <Panel num={5} eyebrow="Dni, które warto zapamiętać" title="Kluczowe momenty">
          {keyMoments.length === 0 ? (
            <div className="text-center py-10">
              <Star size={20} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
              <p className="font-serif-body italic text-muted-light text-[13.5px]">
                oznaczaj ważne dni na dashboardzie — trafią tu automatycznie.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8">
                {keyMoments.map((log, i) => {
                  const [y, m, d] = log.date.split('-').map(Number)
                  const dateStr = new Date(y, m - 1, d).toLocaleDateString('pl-PL', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                  // bridge to previous moment
                  let bridge: string | null = null
                  if (i > 0) {
                    const prev = keyMoments[i - 1]
                    const [py, pm, pd] = prev.date.split('-').map(Number)
                    const diff = Math.round(
                      (new Date(y, m - 1, d).getTime() - new Date(py, pm - 1, pd).getTime()) / 86400000
                    )
                    bridge = diff === 1 ? 'nazajutrz — niecały dzień później'
                      : diff <= 0 ? 'tego samego dnia'
                        : `${diff} dni później`
                  }
                  return (
                    <div key={log.date}>
                      {bridge && (
                        <div className="grid grid-cols-[50px_1fr] gap-6 items-center my-3.5">
                          <span className="justify-self-center w-0 h-8 border-l border-dashed border-gold-light" />
                          <span className="font-serif-body italic text-gold-deep text-[13.5px]">{bridge}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-[50px_1fr] gap-6 items-start">
                        <span className="font-display italic text-gold-light text-[36px] leading-none text-center">{toRoman(i + 1)}</span>
                        <div>
                          <SmallCaps tone="gold-deep" tracking="editorial" size="xs">{dateStr}</SmallCaps>
                          <p className="mt-2 font-display font-medium text-dark text-[22px] sm:text-[25px] leading-[1.12] tracking-tight">
                            {log.keyMoment!.title}
                          </p>
                          {log.keyMoment!.note && (
                            <p className="mt-1.5 font-serif-body italic text-muted text-[13px] leading-relaxed">{log.keyMoment!.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-6 pt-4 border-t border-border font-serif-body italic text-muted text-[13.5px]">
                {keyMoments.length === 1 ? 'jeden moment zapisany' : `${keyMoments.length} momenty zapisane`} — oznaczaj kolejne z poziomu „Dziś", trafią tu automatycznie.
              </p>
            </>
          )}
        </Panel>

        {/* ── VI · PHOTO TIMELINE ──────────────────────────── */}
        <Panel
          num={6}
          eyebrow="Dokumentacja wizualna"
          title="Photo Timeline"
          note={reportPhotos.length > 0 ? `${toRoman(reportPhotos.length)} odbitek z archiwum.` : undefined}
        >
          {reportPhotos.length === 0 ? (
            <div className="text-center py-10">
              <Camera size={20} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
              <p className="font-serif-body italic text-muted-light text-[13.5px]">
                dodaj zdjęcia w photo timeline — pojawią się tutaj.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-[22px] mt-8">
              {reportPhotos.map((photo, i) => {
                const monthIdx = Number(photo.dateKey.split('-')[1]) - 1
                return (
                  <figure key={photo.id} className="bg-cream-warm border border-hairline p-[9px] pb-[7px]">
                    <div className="relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption ?? `Odbitka ${toRoman(i + 1)}`}
                        className="block w-full aspect-square object-cover saturate-[.92] hover:saturate-100 transition-[filter]"
                      />
                    </div>
                    <figcaption className="flex items-baseline gap-2 px-0.5 pt-2">
                      <span className="font-display italic text-gold-deep text-[11px] whitespace-nowrap">№ {toRoman(i + 1)}</span>
                      <span className="flex-1 h-px bg-border self-center" />
                      <SmallCaps tone="muted" tracking="luxury" size="xs">{PL_MONTHS[monthIdx]}</SmallCaps>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          )}
        </Panel>

        {/* ── VII · GHOST PROTOCOL ─────────────────────────── */}
        {ghostEntries.length >= 5 && (
          <Panel num={7} eyebrow="Dane operacyjne · Prywatne" title="Ghost Protocol">
            <div className="grid grid-cols-1 sm:grid-cols-[176px_1fr] gap-8 sm:gap-10 mt-8 items-center">
              <div className="relative text-center border border-hairline bg-cream-warm px-5 pt-6 pb-5">
                <span className="pointer-events-none absolute top-[7px] left-[7px] w-2 h-2 border-t border-l border-gold-light" />
                <div className="font-display text-dark text-[44px] leading-none tracking-tight">{ghostEntries.length}</div>
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-3 block">Uruchomień protokołu</SmallCaps>
              </div>
              <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5" aria-label={`${ghostEntries.length} uruchomień protokołu`}>
                {Array.from({ length: Math.ceil(ghostEntries.length / 5) }, (_, g) => {
                  const left = Math.min(5, ghostEntries.length - g * 5)
                  const bars = left === 5 ? 4 : left
                  return (
                    <span key={g} className={clsx('relative flex gap-1 px-0.5', left === 5 && 'ghost-five')}>
                      {Array.from({ length: bars }, (_, b) => (
                        <i key={b} className="block w-0.5 h-[22px] bg-gold-deep opacity-85" />
                      ))}
                      {left === 5 && (
                        <span className="absolute -left-0.5 -right-0.5 top-1/2 h-0.5 bg-wine" style={{ transform: 'rotate(-24deg)' }} />
                      )}
                    </span>
                  )
                })}
              </div>
              <p className="sm:col-span-2 font-serif-body italic text-muted text-[14.5px] border-t border-border pt-[18px] leading-relaxed">
                <b className="not-italic font-semibold text-dark">{ghostEntries.length}×</b> uruchomiłaś protokół zamiast wysłać wiadomość. każda kreska to jedna decyzja — to są dane o sile, nie o słabości.
              </p>
            </div>
          </Panel>
        )}

        {/* ── VIII · ZE SKARBCA (tylko w dniu raportu) ─────── */}
        {IS_REPORT_DAY && vaultEntries.filter(e => e.letterType !== 'vent' && e.content).length > 0 && (
          <Panel num={8} eyebrow="Listy od Natalii 30" title="Ze Skarbca">
            <div className="space-y-3 mt-8">
              {vaultEntries
                .filter(e => e.letterType !== 'vent' && e.content)
                .slice(0, 5)
                .map(entry => (
                  <div key={entry.id} className="p-5 bg-cream-warm border border-hairline">
                    <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                      Dzień {entry.dayOfProject} · {toRoman(entry.dayOfProject)}
                    </SmallCaps>
                    <h3 className="font-display font-medium text-dark text-[16px] mt-1">{entry.title || 'List bez tytułu'}</h3>
                    <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed line-clamp-3">{entry.content}</p>
                  </div>
                ))}
            </div>
          </Panel>
        )}

        {/* ── IX · ROCZNA REFLEKSJA ────────────────────────── */}
        <Panel num={IS_REPORT_DAY ? 9 : 8} eyebrow="Słowa zamknięcia" title="Roczna refleksja">
          {user ? (
            <ReflectionForm uid={user.uid} existing={null} />
          ) : (
            <p className="font-serif-body italic text-muted-light text-[13.5px] text-center py-4 mt-4">
              zaloguj się, aby zapisać refleksję.
            </p>
          )}
        </Panel>

        {/* ── COLOPHON ─────────────────────────────────────── */}
        <footer className="text-center mt-[72px]">
          <div className="flex items-center justify-center gap-4 max-w-[560px] mx-auto">
            <span className="flex-1 h-px bg-hairline" />
            <span className="text-gold text-[11px]">◆</span>
            <span className="flex-1 h-px bg-hairline" />
          </div>
          <div className="mt-8 text-gold text-[13px]">∴</div>
          <h3 className="mt-3.5 font-display text-dark text-[40px] tracking-tight">Natalia 30.</h3>
          <p className="mt-3.5 font-serif-body italic text-muted text-[15px]">
            5 kwietnia 2026 — 5 kwietnia 2027 · {daysElapsed} dni projektu
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="text-gold text-[9px]">∴</span>
            <SmallCaps tone="muted-light" tracking="editorial" size="xs">Ex Libris · Natalia</SmallCaps>
            <span className="text-gold text-[9px]">∴</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
