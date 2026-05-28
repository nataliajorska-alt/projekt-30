'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useVault } from '@/hooks/useVault'
import { usePhotos } from '@/hooks/usePhotos'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { useAuth } from '@/hooks/useAuth'
import { PILLARS } from '@/lib/pillars'
import { GHOST_CATEGORIES } from '@/lib/ghost-data'
import { MOOD_STATES } from '@/types'
import { getLevelFromXP, LEVELS, PROJECT_END, getDaysElapsed } from '@/lib/gameLogic'
import { aggregateXpByMonth } from '@/lib/analytics'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Printer, Lock, Star, Camera } from 'lucide-react'
import type { Pillar } from '@/types'
import {
  SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets,
} from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const IS_REPORT_DAY = new Date() >= PROJECT_END
const REPORT_DATE_STR = 'V · IV · MMXXVII'

const PL_MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
                   'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatMonthShort(key: string) {
  const [, m] = key.split('-').map(Number)
  return PL_MONTHS[m - 1]?.slice(0, 3) ?? key
}

// ── Section wrapper ──────────────────────────────────────────────

function Section({ num, title, subtitle, children }: {
  num: number
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-ivory border border-gold-light/40 p-6 sm:p-8 mb-6 print:break-inside-avoid">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-display text-gold-deep text-sm">{toRoman(num)}</span>
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          {subtitle ?? 'Annual Report · MMXXVI–MMXXVII'}
        </SmallCaps>
      </div>
      <h2 className="font-display text-dark text-2xl leading-tight mb-5">{title}</h2>
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
    { key: 'wordOfTheYear',  label: 'Jedno słowo opisujące ten rok',     placeholder: 'np. klarowność, odwaga, fundament…' },
    { key: 'biggestLesson',  label: 'Największa lekcja tego roku',       placeholder: 'co zrozumiałaś, czego wcześniej nie wiedziałaś?' },
    { key: 'proudestMoment', label: 'Z czego jesteś najbardziej dumna?', placeholder: 'jeden moment, który definiuje rok.' },
    { key: 'whatChanged',    label: 'Co realnie się zmieniło?',          placeholder: 'konkretnie — w sobie, w relacjach, w życiu.' },
    { key: 'letterToNext',   label: 'List do Natalii 31',                placeholder: 'co chcesz, żeby wiedziała idąc dalej?' },
  ]

  const [values, setValues] = useState<Record<string, string>>(existing ?? {})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', uid, 'data', 'annualReflection'),
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
      <div className="bg-cream/50 border border-dashed border-hairline p-6 text-center">
        <Lock size={16} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          formularz refleksji otwiera się {REPORT_DATE_STR}
        </SmallCaps>
        <p className="font-serif-body italic text-muted-light text-[12.5px] mt-2 leading-relaxed">
          na razie zbieraj dane i oznaczaj kluczowe momenty.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
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

  const {
    currentLevel, activeDays, monthlyXP, maxMonthXP,
    keyMoments, avgMood, avgEnergy, dominantState,
    topGhostCategory, pillarData, totalSideQuests,
  } = useMemo(() => {
    const currentLevel = getLevelFromXP(stats.totalXP)
    const logArray = Object.values(logs)
    const activeDays = logArray.filter(l => l.totalXP > 0).length

    const monthly = aggregateXpByMonth(logs)
    const monthlyXP = Object.values(monthly).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    const maxMonthXP = Math.max(1, ...monthlyXP.map(m => m.totalXP))

    const keyMoments = logArray
      .filter(l => l.keyMoment?.title)
      .sort((a, b) => a.date.localeCompare(b.date))

    const allCheckIns = logArray.flatMap(l => l.moodCheckIns ?? [])
    const avgMood = allCheckIns.length
      ? Math.round((allCheckIns.reduce((s, c) => s + c.mood, 0) / allCheckIns.length) * 10) / 10
      : null
    const avgEnergy = allCheckIns.length
      ? Math.round((allCheckIns.reduce((s, c) => s + c.energy, 0) / allCheckIns.length) * 10) / 10
      : null
    const stateCounts = { calm: 0, storm: 0, fog: 0, clarity: 0 } as Record<string, number>
    for (const ci of allCheckIns) stateCounts[ci.state]++
    const dominantState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    const categoryCounts = {} as Record<string, number>
    for (const e of ghostEntries) categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1
    const topGhostCategory = GHOST_CATEGORIES
      .map(c => ({ ...c, count: categoryCounts[c.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)[0]

    const pillarData = PILLARS.map(p => ({
      ...p,
      xp: stats.pillarXP[p.id as Pillar] ?? 0,
    })).sort((a, b) => b.xp - a.xp)

    const totalSideQuests = logArray.reduce((s, l) => s + (l.completedSideQuests?.length ?? 0), 0)

    return {
      currentLevel, activeDays, monthlyXP, maxMonthXP,
      keyMoments, avgMood, avgEnergy, dominantState,
      topGhostCategory, pillarData, totalSideQuests,
    }
  }, [stats, logs, ghostEntries])

  const dominantStateMeta = MOOD_STATES.find(s => s.value === dominantState)
  const totalXP = stats.totalXP
  const levelName = currentLevel.name
  const daysElapsed = getDaysElapsed()

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory grain-parchment flex items-center justify-center">
        <Fleuron size={20} className="text-gold animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 animate-fade-in">
      {/* Header + print */}
      <header className="flex items-end justify-between gap-4 mb-8 print:hidden">
        <div className="min-w-0">
          <SmallCaps tone="muted" tracking="editorial" size="xs">
            {IS_REPORT_DAY ? 'Annual Report' : 'Annual Report · podgląd'}
          </SmallCaps>
          <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
            Rok Natalii
          </h1>
          <p className="font-serif-body italic text-muted text-[14px] mt-2">
            V · IV · MMXXVI → V · IV · MMXXVII
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors shrink-0"
        >
          <Printer size={13} strokeWidth={1.5} />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            drukuj · PDF
          </SmallCaps>
        </button>
      </header>

      {!IS_REPORT_DAY && (
        <div className="bg-gold-pale/40 border border-gold-light/60 px-5 py-4 mb-6 print:hidden flex items-start gap-3">
          <Diamond size={5} className="text-gold mt-1.5 shrink-0" />
          <p className="font-serif-body italic text-dark text-[13.5px] leading-relaxed">
            <span className="not-italic font-heading">Podgląd raportu</span> — dane w czasie rzeczywistym.
            pełny raport będzie gotowy {REPORT_DATE_STR}. oznaczaj kluczowe momenty każdego dnia.
          </p>
        </div>
      )}

      {/* ── COVER (ritual V2) ─────────────────────────────── */}
      <div className="relative bg-forest-deep grain-linen text-ivory p-8 sm:p-14 mb-6 text-center print:break-after-page">
        <div className="pointer-events-none absolute inset-3 border border-gold-light/40" />
        <div className="pointer-events-none absolute inset-[14px] border border-gold-light/15" />
        <div className="pointer-events-none absolute inset-6">
          <CornerBrackets size={20} tone="gold" weight={1} />
        </div>

        <div className="relative z-10">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Annual Report · Projekt 30
          </SmallCaps>
          <Fleuron size={22} className="text-gold mx-auto my-7 inline-block" />
          <h2 className="font-display text-ivory text-5xl sm:text-6xl leading-none mb-3">
            Rok Natalii
          </h2>
          <p className="font-display text-gold-light text-xl sm:text-2xl mb-7">
            V · IV · MMXXVI — V · IV · MMXXVII
          </p>
          <div className="inline-block border border-gold/50 px-7 py-2.5 mb-8">
            <SmallCaps tone="gold" tracking="editorial" size="sm">
              {levelName}
            </SmallCaps>
          </div>
          <GoldRule variant="diamond" tone="gold" className="max-w-xs mx-auto mb-7 opacity-60" />
          <p className="font-serif-body italic text-parchment text-[14px] leading-relaxed max-w-md mx-auto">
            „nie musisz być jutro inna niż dziś.
            <br />
            wystarczy, że jesteś tu — i działasz."
          </p>
        </div>
      </div>

      {/* ── I · W liczbach ──────────────────────────── */}
      <Section num={1} title="W liczbach" subtitle="365 dni transformacji">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Dni aktywnych',    value: activeDays.toString() },
            { label: 'Łączne XP',        value: totalXP.toLocaleString('pl-PL') },
            { label: 'Poziom',           value: `${toRoman(currentLevel.level)} / XXX` },
            { label: 'Side questy',      value: totalSideQuests.toString() },
            { label: 'Najdłuższa seria', value: `${stats.longestStreak}`, sub: 'dni' },
            { label: 'Osiągnięcia',      value: stats.unlockedAchievements.length.toString() },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-cream/60 border border-gold-light/30 p-4 text-center">
              <p className="font-display text-dark text-2xl leading-none">
                {value}
                {sub && (
                  <span className="font-serif-body italic text-muted-light text-sm ml-1">{sub}</span>
                )}
              </p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">
                {label}
              </SmallCaps>
            </div>
          ))}
        </div>
      </Section>

      {/* ── II · Łuk transformacji ──────────────── */}
      {monthlyXP.length > 0 && (
        <Section num={2} title="Łuk transformacji" subtitle="XP miesiąc po miesiącu">
          <div className="space-y-3">
            {monthlyXP.map(m => {
              const pct = Math.round((m.totalXP / maxMonthXP) * 100)
              return (
                <div key={m.monthKey} className="flex items-center gap-3">
                  <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-10 shrink-0">
                    {formatMonthShort(m.monthKey)}
                  </SmallCaps>
                  <div className="flex-1 relative h-px bg-hairline">
                    <div
                      className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
                      style={{ width: `${Math.max(pct > 0 ? 2 : 0, pct)}%` }}
                    />
                  </div>
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="tabular-nums w-20 text-right shrink-0">
                    {m.totalXP.toLocaleString('pl-PL')} XP
                  </SmallCaps>
                </div>
              )
            })}
          </div>

          {/* Level journey */}
          <div className="mt-7 pt-5 border-t border-hairline">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
              Droga przez poziomy
            </SmallCaps>
            <div className="flex flex-wrap gap-x-3 gap-y-2 items-baseline">
              {LEVELS.map(lvl => {
                const done = totalXP >= lvl.xpRequired
                const isCurrent = lvl.level === currentLevel.level
                return (
                  <span key={lvl.level} className="inline-flex items-baseline gap-1.5">
                    <span className={clsx(
                      'font-display text-sm',
                      isCurrent ? 'text-gold' : done ? 'text-gold-deep' : 'text-muted-light/40'
                    )}>
                      {toRoman(lvl.level)}
                    </span>
                    <span className={clsx(
                      'font-serif-body text-[12.5px]',
                      isCurrent ? 'text-dark italic' : done ? 'text-muted' : 'text-muted-light/40 italic'
                    )}>
                      {lvl.name}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        </Section>
      )}

      {/* ── III · Siedem filarów ─────────────────── */}
      <Section num={3} title="Siedem filarów" subtitle="Gdzie kierowałaś energię">
        <div className="space-y-4">
          {pillarData.map(p => {
            const totalPillarXP = pillarData.reduce((s, x) => s + x.xp, 0) || 1
            const pct = Math.round((p.xp / totalPillarXP) * 100)
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: p.color }}><Diamond size={5} /></span>
                    <span className="font-heading text-dark text-[14px]" style={{ color: p.color }}>
                      {p.shortName}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      {pct}%
                    </SmallCaps>
                    <span className="font-ui text-[11px] text-muted-light w-20 text-right tabular-nums">
                      {p.xp.toLocaleString('pl-PL')} XP
                    </span>
                  </div>
                </div>
                <div className="relative h-px w-full bg-hairline">
                  <div
                    className="absolute left-0 top-0 h-px transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── IV · Nastrój roku ───────────────────── */}
      {(avgMood !== null || avgEnergy !== null) && (
        <Section num={4} title="Nastrój roku" subtitle="Check-iny emocjonalne">
          <div className="grid grid-cols-3 gap-4">
            {avgMood !== null && (
              <div className="text-center">
                <p className="font-display text-dark text-4xl mb-1 leading-none">
                  {avgMood.toFixed(1)}
                </p>
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  śr. nastrój / 5
                </SmallCaps>
              </div>
            )}
            {avgEnergy !== null && (
              <div className="text-center">
                <p className="font-display text-dark text-4xl mb-1 leading-none">
                  {avgEnergy.toFixed(1)}
                </p>
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  śr. energia / 5
                </SmallCaps>
              </div>
            )}
            {dominantStateMeta && (
              <div className="text-center">
                <p className="text-3xl mb-1 leading-none">{dominantStateMeta.emoji}</p>
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  {dominantStateMeta.label}
                </SmallCaps>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── V · Kluczowe momenty ─────────────────── */}
      <Section num={5} title="Kluczowe momenty" subtitle="Dni, które warto zapamiętać">
        {keyMoments.length === 0 ? (
          <div className="text-center py-8">
            <Star size={20} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-serif-body italic text-muted-light text-[13.5px]">
              oznaczaj ważne dni na dashboardzie — trafią tu automatycznie.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {keyMoments.map(log => {
              const [y, m, d] = log.date.split('-').map(Number)
              const dateStr = new Date(y, m - 1, d).toLocaleDateString('pl-PL', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
              return (
                <div
                  key={log.date}
                  className="flex items-start gap-3 p-4 bg-gold-pale/40 border border-gold-light/50"
                >
                  <Fleuron size={11} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                      {dateStr}
                    </SmallCaps>
                    <p className="font-heading text-dark text-[15px] mt-1">
                      {log.keyMoment!.title}
                    </p>
                    {log.keyMoment!.note && (
                      <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">
                        {log.keyMoment!.note}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── VI · Photo Timeline ─────────────────── */}
      <Section num={6} title="Photo Timeline" subtitle="Dokumentacja wizualna">
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <Camera size={20} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-serif-body italic text-muted-light text-[13.5px]">
              dodaj zdjęcia w photo timeline — pojawią się tutaj.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.slice(0, 12).map(photo => (
              <div key={photo.id} className="aspect-square overflow-hidden border border-hairline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {photos.length > 12 && (
              <div className="aspect-square bg-cream/60 border border-hairline flex items-center justify-center">
                <p className="font-display text-muted text-2xl">+{photos.length - 12}</p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── VII · Skarbiec ─────────────────────── */}
      {IS_REPORT_DAY && vaultEntries.filter(e => e.letterType !== 'vent' && e.content).length > 0 && (
        <Section num={7} title="Ze Skarbca" subtitle="Listy od Natalii 30">
          <div className="space-y-3">
            {vaultEntries
              .filter(e => e.letterType !== 'vent' && e.content)
              .slice(0, 5)
              .map(entry => (
                <div key={entry.id} className="p-5 bg-gold-pale/40 border border-gold-light/50">
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                    Dzień {entry.dayOfProject} · {toRoman(entry.dayOfProject)}
                  </SmallCaps>
                  <h3 className="font-heading text-dark text-[16px] mt-1">
                    {entry.title || 'List bez tytułu'}
                  </h3>
                  <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>
                </div>
              ))}
            {vaultEntries.filter(e => e.letterType !== 'vent' && e.content).length > 5 && (
              <p className="font-serif-body italic text-muted-light text-[12.5px] text-center">
                + {vaultEntries.filter(e => e.letterType !== 'vent' && e.content).length - 5} kolejnych listów w skarbcu
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ── VIII · Ghost Protocol ─────────────── */}
      {ghostEntries.length >= 5 && (
        <Section num={8} title="Ghost Protocol" subtitle="Dane operacyjne · prywatne">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-cream/60 border border-hairline p-4 text-center">
              <p className="font-display text-dark text-3xl mb-1 leading-none">{ghostEntries.length}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                uruchomień protokołu
              </SmallCaps>
            </div>
            <div className="bg-cream/60 border border-hairline p-4 text-center">
              <p className="text-2xl mb-1 leading-none">{topGhostCategory?.icon}</p>
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                {topGhostCategory?.label}
              </SmallCaps>
            </div>
          </div>
          <p className="font-serif-body italic text-muted text-[13.5px] leading-relaxed">
            {ghostEntries.length}× uruchomiłaś protokół zamiast wysłać wiadomość.
            {ghostEntries.length > 0 && ' to są dane o sile, nie o słabości.'}
          </p>
        </Section>
      )}

      {/* ── IX · Roczna refleksja ─────────────── */}
      <Section num={9} title="Roczna refleksja" subtitle="Słowa zamknięcia">
        {user ? (
          <ReflectionForm uid={user.uid} existing={null} />
        ) : (
          <p className="font-serif-body italic text-muted-light text-[13.5px] text-center py-4">
            zaloguj się, aby zapisać refleksję.
          </p>
        )}
      </Section>

      {/* ── Footer ────────────────────────────── */}
      <footer className="text-center mt-10 pt-7">
        <GoldRule variant="diamond" tone="gold-deep" className="max-w-sm mx-auto mb-7 opacity-40" />
        <Fleuron size={14} className="text-gold mx-auto mb-3 inline-block" />
        <h3 className="font-display text-dark text-3xl">Natalia 30.</h3>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-3">
          V · IV · MMXXVI — V · IV · MMXXVII · {daysElapsed} dni projektu
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Fleuron size={9} className="text-gold-deep" />
          <SmallCaps tone="muted" tracking="editorial" size="xs">
            ex libris · natalia
          </SmallCaps>
          <Fleuron size={9} className="text-gold-deep" />
        </div>
      </footer>
    </div>
  )
}
