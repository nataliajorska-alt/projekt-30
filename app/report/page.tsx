'use client'
import { useState, useMemo } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useVault } from '@/hooks/useVault'
import { usePhotos } from '@/hooks/usePhotos'
import { useGhostLog } from '@/hooks/useGhostLog'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { useAuth } from '@/hooks/useAuth'
import { PILLARS } from '@/lib/pillars'
import { GHOST_TRIGGER_TAGS, MOOD_STATES } from '@/types'
import { getLevelFromXP, LEVELS, PROJECT_END, PROJECT_START, getDaysElapsed } from '@/lib/gameLogic'
import { aggregateXpByMonth } from '@/lib/analytics'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Printer, Lock, Star, Camera } from 'lucide-react'
import clsx from 'clsx'
import type { Pillar, DailyLog } from '@/types'

const IS_REPORT_DAY = new Date() >= PROJECT_END
const REPORT_DATE_STR = '5 kwietnia 2027'

const PL_MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
                   'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatMonthShort(key: string) {
  const [, m] = key.split('-').map(Number)
  return PL_MONTHS[m - 1]?.slice(0, 3) ?? key
}

// ── Section wrapper ─────────────────────────────────────────────
function Section({ title, subtitle, children, dark = false }: {
  title: string; subtitle?: string; children: React.ReactNode; dark?: boolean
}) {
  return (
    <div className={clsx(
      'rounded-2xl p-6 sm:p-8 mb-6 print:break-inside-avoid',
      dark ? 'bg-dark' : 'bg-white shadow-elegant'
    )}>
      <div className="mb-5">
        <p className={clsx('font-sans text-[10px] uppercase tracking-widest mb-1',
          dark ? 'text-gold/60' : 'text-muted')}>{subtitle ?? 'Annual Report · 2026–2027'}</p>
        <h2 className={clsx('font-serif text-xl', dark ? 'text-ivory' : 'text-dark')}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Annual reflection form ──────────────────────────────────────
interface ReflectionFormProps {
  uid: string
  existing: Record<string, string> | null
}

function ReflectionForm({ uid, existing }: ReflectionFormProps) {
  const fields = [
    { key: 'wordOfTheYear',    label: 'Jedno słowo opisujące ten rok',              placeholder: 'np. klarowność, odwaga, fundament...' },
    { key: 'biggestLesson',    label: 'Największa lekcja tego roku',                placeholder: 'Co zrozumiałaś, czego wcześniej nie wiedziałaś?' },
    { key: 'proudestMoment',   label: 'Z czego jesteś najbardziej dumna?',          placeholder: 'Jeden moment, który definiuje rok.' },
    { key: 'whatChanged',      label: 'Co realnie się zmieniło?',                   placeholder: 'Konkretnie — w sobie, w relacjach, w życiu.' },
    { key: 'letterToNext',     label: 'List do Natalii 31',                         placeholder: 'Co chcesz, żeby wiedziała idąc dalej?' },
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
      <div className="bg-dark/5 rounded-xl p-5 text-center border border-dashed border-border">
        <Lock size={18} className="text-muted-light mx-auto mb-2" strokeWidth={1.5} />
        <p className="font-sans text-sm text-muted">
          Formularz refleksji otwiera się {REPORT_DATE_STR}.
        </p>
        <p className="font-sans text-xs text-muted-light mt-1">
          Na razie zbieraj dane i oznaczaj kluczowe momenty.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="font-sans text-xs text-muted uppercase tracking-widest block mb-2">{label}</label>
          <textarea
            value={values[key] ?? ''}
            onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={key === 'letterToNext' ? 5 : 3}
            className="w-full font-sans text-sm text-dark bg-cream/50 rounded-xl px-4 py-3 border border-cream outline-none focus:border-gold/40 resize-none placeholder:text-muted-light/50 transition-colors leading-relaxed"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-forest text-ivory font-sans text-sm hover:bg-forest/90 transition-colors disabled:opacity-50"
      >
        {saved ? 'Zapisane ✦' : saving ? 'Zapisuję...' : 'Zapisz refleksję roczną'}
      </button>
    </div>
  )
}

// ── Main report ─────────────────────────────────────────────────
export default function ReportPage() {
  const { user } = useAuth()
  const { stats, loading: gameLoading } = useGameData()
  const { logs, loading: logsLoading } = useTimelineData()
  const { entries: vaultEntries, loading: vaultLoading } = useVault()
  const { photos, loading: photosLoading } = usePhotos()
  const { entries: ghostEntries } = useGhostLog()
  const { monthlyReviews } = useReviewHistory()

  const loading = gameLoading || logsLoading || vaultLoading || photosLoading

  // ── Compute all report data ─────────────────────────────────
  const {
    currentLevel, activeDays, monthlyXP, maxMonthXP,
    keyMoments, avgMood, avgEnergy, dominantState,
    topGhostTag, pillarData, totalSideQuests,
  } = useMemo(() => {
    const currentLevel = getLevelFromXP(stats.totalXP)
    const logArray = Object.values(logs)
    const activeDays = logArray.filter(l => l.totalXP > 0).length

    const monthly = aggregateXpByMonth(logs)
    const monthlyXP = Object.values(monthly)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    const maxMonthXP = Math.max(1, ...monthlyXP.map(m => m.totalXP))

    // Key moments: logs that have keyMoment set
    const keyMoments = logArray
      .filter(l => l.keyMoment?.title)
      .sort((a, b) => a.date.localeCompare(b.date))

    // Mood averages
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

    // Ghost protocol
    const tagCounts = {} as Record<string, number>
    for (const e of ghostEntries) tagCounts[e.triggerTag] = (tagCounts[e.triggerTag] ?? 0) + 1
    const topGhostTag = GHOST_TRIGGER_TAGS
      .map(t => ({ ...t, count: tagCounts[t.value] ?? 0 }))
      .sort((a, b) => b.count - a.count)[0]

    // Pillars
    const pillarData = PILLARS.map(p => ({
      ...p,
      xp: stats.pillarXP[p.id as Pillar] ?? 0,
    })).sort((a, b) => b.xp - a.xp)

    const totalSideQuests = logArray.reduce((s, l) => s + (l.completedSideQuests?.length ?? 0), 0)

    return {
      currentLevel, activeDays, monthlyXP, maxMonthXP,
      keyMoments, avgMood, avgEnergy, dominantState,
      topGhostTag, pillarData, totalSideQuests,
    }
  }, [stats, logs, ghostEntries])

  const dominantStateMeta = MOOD_STATES.find(s => s.value === dominantState)
  const totalXP = stats.totalXP
  const levelName = currentLevel.name
  const daysElapsed = getDaysElapsed()

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-16 animate-fade-in">

      {/* Header + print button */}
      <div className="flex items-end justify-between mb-8 print:hidden">
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">
            {IS_REPORT_DAY ? 'Annual Report' : 'Annual Report — Podgląd'}
          </p>
          <h1 className="font-serif text-dark text-2xl">Rok Natalii</h1>
          <p className="font-sans text-sm text-muted mt-0.5">5 kwietnia 2026 → 5 kwietnia 2027</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark text-ivory rounded-xl font-sans text-sm hover:bg-forest transition-colors"
        >
          <Printer size={14} strokeWidth={1.5} />
          Drukuj / PDF
        </button>
      </div>

      {!IS_REPORT_DAY && (
        <div className="bg-gold-pale border border-gold/30 rounded-2xl p-4 mb-6 print:hidden">
          <p className="font-sans text-sm text-dark leading-relaxed">
            <span className="font-semibold">Podgląd raportu</span> — dane w czasie rzeczywistym.
            Pełny raport będzie gotowy {REPORT_DATE_STR}. Oznaczaj kluczowe momenty każdego dnia.
          </p>
        </div>
      )}

      {/* ── COVER ─────────────────────────────────── */}
      <div className="bg-dark rounded-2xl p-8 sm:p-12 mb-6 text-center relative overflow-hidden print:break-after-page">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.05) 20px,rgba(255,255,255,.05) 21px)' }}
        />
        <div className="relative z-10">
          <p className="font-sans text-[10px] text-gold/60 uppercase tracking-[0.3em] mb-8">
            Annual Report · Projekt 30
          </p>
          <div className="text-5xl mb-6">✦</div>
          <h2 className="font-serif text-ivory text-4xl sm:text-5xl mb-3">Rok Natalii</h2>
          <p className="font-sans text-ivory/40 text-sm mb-8 tracking-wide">
            5 kwietnia 2026 — 5 kwietnia 2027
          </p>
          <div className="inline-block border border-gold/30 rounded-full px-6 py-2 mb-8">
            <p className="font-serif text-gold text-lg">{levelName}</p>
          </div>
          <p className="font-serif text-ivory/40 text-sm italic">
            &ldquo;Nie musisz być jutro inna niż dziś.<br />
            Wystarczy, że jesteś tu — i działasz.&rdquo;
          </p>
        </div>
      </div>

      {/* ── W LICZBACH ────────────────────────────── */}
      <Section title="W liczbach" subtitle="365 dni transformacji">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Dni aktywnych',        value: activeDays },
            { label: 'Łączne XP',            value: totalXP.toLocaleString('pl-PL') },
            { label: 'Poziom',               value: `${currentLevel.level} / 30` },
            { label: 'Side questy',          value: totalSideQuests },
            { label: 'Najdłuższa seria',     value: `${stats.longestStreak} dni` },
            { label: 'Osiągnięcia',          value: stats.unlockedAchievements.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-cream rounded-xl p-4 text-center">
              <p className="font-serif text-dark text-2xl mb-1">{value}</p>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ŁUK TRANSFORMACJI ─────────────────────── */}
      {monthlyXP.length > 0 && (
        <Section title="Łuk transformacji" subtitle="XP miesiąc po miesiącu">
          <div className="space-y-2">
            {monthlyXP.map(m => {
              const pct = Math.round((m.totalXP / maxMonthXP) * 100)
              return (
                <div key={m.monthKey} className="flex items-center gap-3">
                  <span className="font-sans text-[11px] text-muted w-10 flex-shrink-0">
                    {formatMonthShort(m.monthKey)}
                  </span>
                  <div className="flex-1 h-3 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(pct > 0 ? 2 : 0, pct)}%`,
                        background: 'linear-gradient(90deg, #B8963E 0%, #D4AF6B 100%)',
                      }}
                    />
                  </div>
                  <span className="font-sans text-xs text-muted-light w-20 text-right flex-shrink-0">
                    {m.totalXP.toLocaleString('pl-PL')} XP
                  </span>
                </div>
              )
            })}
          </div>

          {/* Level journey */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="font-sans text-xs text-muted uppercase tracking-widest mb-3">Droga przez poziomy</p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map(lvl => {
                const done = totalXP >= lvl.xpRequired
                const isCurrent = lvl.level === currentLevel.level
                return (
                  <div
                    key={lvl.level}
                    className={clsx(
                      'px-2.5 py-1 rounded-full font-sans text-[10px] transition-all',
                      isCurrent
                        ? 'bg-gold text-ivory font-semibold'
                        : done
                          ? 'bg-forest/15 text-forest'
                          : 'bg-cream text-muted-light'
                    )}
                  >
                    {lvl.name}
                  </div>
                )
              })}
            </div>
          </div>
        </Section>
      )}

      {/* ── 7 FILARÓW ─────────────────────────────── */}
      <Section title="7 Filarów" subtitle="Gdzie kierowałaś energię">
        <div className="space-y-4">
          {pillarData.map(p => {
            const totalPillarXP = pillarData.reduce((s, p) => s + p.xp, 0) || 1
            const pct = Math.round((p.xp / totalPillarXP) * 100)
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="font-sans text-sm text-dark">{p.shortName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-muted">{pct}%</span>
                    <span className="font-sans text-xs text-gold-dark w-20 text-right">
                      {p.xp.toLocaleString('pl-PL')} XP
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── NASTRÓJ ROKU ──────────────────────────── */}
      {(avgMood !== null || avgEnergy !== null) && (
        <Section title="Nastrój roku" subtitle="Check-iny emocjonalne">
          <div className="grid grid-cols-3 gap-4">
            {avgMood !== null && (
              <div className="text-center">
                <p className="font-serif text-dark text-3xl mb-1">{avgMood.toFixed(1)}</p>
                <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Śr. nastrój / 5</p>
              </div>
            )}
            {avgEnergy !== null && (
              <div className="text-center">
                <p className="font-serif text-dark text-3xl mb-1">{avgEnergy.toFixed(1)}</p>
                <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Śr. energia / 5</p>
              </div>
            )}
            {dominantStateMeta && (
              <div className="text-center">
                <p className="text-3xl mb-1">{dominantStateMeta.emoji}</p>
                <p className="font-sans text-[10px] text-muted uppercase tracking-wide capitalize">{dominantStateMeta.label}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── KLUCZOWE MOMENTY ──────────────────────── */}
      <Section title="Kluczowe momenty" subtitle="Dni, które warto zapamiętać">
        {keyMoments.length === 0 ? (
          <div className="text-center py-6">
            <Star size={24} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-sans text-sm text-muted-light">
              Oznaczaj ważne dni na dashboardzie — trafią tu automatycznie.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {keyMoments.map(log => {
              const [y, m, d] = log.date.split('-').map(Number)
              const dateStr = new Date(y, m - 1, d).toLocaleDateString('pl-PL', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
              return (
                <div key={log.date} className="flex items-start gap-3 p-4 bg-gold-pale rounded-xl border border-gold/20">
                  <Star size={14} className="text-gold mt-0.5 flex-shrink-0" fill="currentColor" strokeWidth={0} />
                  <div>
                    <p className="font-sans text-[10px] text-gold uppercase tracking-widest mb-0.5">{dateStr}</p>
                    <p className="font-serif text-dark text-sm font-medium">{log.keyMoment!.title}</p>
                    {log.keyMoment!.note && (
                      <p className="font-sans text-xs text-muted mt-1 leading-relaxed">{log.keyMoment!.note}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── PHOTO TIMELINE ────────────────────────── */}
      <Section title="Photo Timeline" subtitle="Dokumentacja wizualna">
        {photos.length === 0 ? (
          <div className="text-center py-6">
            <Camera size={24} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-sans text-sm text-muted-light">
              Dodaj zdjęcia w Photo Timeline — pojawią się tutaj.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.slice(0, 12).map(photo => (
              <div key={photo.id} className="aspect-square rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {photos.length > 12 && (
              <div className="aspect-square rounded-xl bg-cream flex items-center justify-center">
                <p className="font-serif text-muted text-lg">+{photos.length - 12}</p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── SKARBIEC ──────────────────────────────── */}
      {IS_REPORT_DAY && vaultEntries.length > 0 && (
        <Section title="Ze Skarbca" subtitle="Listy od Natalii 30">
          <div className="space-y-4">
            {vaultEntries.slice(0, 5).map(entry => (
              <div key={entry.id} className="p-4 bg-gold-pale rounded-xl border border-gold/20">
                <p className="font-sans text-[10px] text-gold uppercase tracking-widest mb-1">
                  Dzień {entry.dayOfProject}
                </p>
                <p className="font-serif text-dark text-sm font-medium mb-2">{entry.title}</p>
                <p className="font-sans text-xs text-muted leading-relaxed line-clamp-3">{entry.content}</p>
              </div>
            ))}
            {vaultEntries.length > 5 && (
              <p className="font-sans text-xs text-muted-light text-center">
                + {vaultEntries.length - 5} kolejnych listów w Skarbcu
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ── GHOST PROTOCOL ────────────────────────── */}
      {ghostEntries.length >= 5 && (
        <Section title="Ghost Protocol" subtitle="Dane operacyjne — prywatne">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="font-serif text-dark text-2xl mb-1">{ghostEntries.length}</p>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Uruchomień protokołu</p>
            </div>
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{topGhostTag?.emoji}</p>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide">{topGhostTag?.label}</p>
            </div>
          </div>
          <p className="font-sans text-xs text-muted leading-relaxed">
            {ghostEntries.length}× uruchomiłaś protokół zamiast wysłać wiadomość.
            {ghostEntries.length > 0 && ' To są dane o sile, nie o słabości.'}
          </p>
        </Section>
      )}

      {/* ── ROCZNA REFLEKSJA ──────────────────────── */}
      <Section title="Roczna refleksja" subtitle="Słowa zamknięcia">
        {user ? (
          <ReflectionForm uid={user.uid} existing={null} />
        ) : (
          <p className="font-sans text-sm text-muted-light text-center py-4">Zaloguj się, aby zapisać refleksję.</p>
        )}
      </Section>

      {/* ── STOPKA ────────────────────────────────── */}
      <div className="text-center mt-8 pt-6 border-t border-border">
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">✦</p>
        <p className="font-serif text-dark text-lg mb-2">Natalia 30.</p>
        <p className="font-sans text-sm text-muted">
          5 kwietnia 2026 — 5 kwietnia 2027 · {daysElapsed} dni projektu
        </p>
      </div>

    </div>
  )
}
