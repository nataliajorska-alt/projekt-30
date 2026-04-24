'use client'
import { useState, useMemo } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { getDaysElapsed, getDaysRemaining, getMonthKey, XP_VALUES, LEVELS, getLevelFromXP } from '@/lib/gameLogic'
import { getMonthAggregate, getRoutineItemCounts, getCompletedSideQuestDates, getRuleKeptCounts, aggregateXpByMonth } from '@/lib/analytics'
import { MORNING_ROUTINE, EVENING_ROUTINE, DAILY_RULES, DAILY_HABITS, WEEKLY_HABITS } from '@/lib/routineData'
import { SIDE_QUESTS } from '@/lib/questData'
import { CheckCircle, Check, ChevronLeft, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import type { WeeklyReview, MonthlyReview } from '@/types'
import PillarTrendChart from '@/components/PillarTrendChart'
import clsx from 'clsx'

type Mode = 'weekly' | 'monthly' | 'archive' | 'progress'

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatMonthPL(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${PL_MONTH_NAMES[m - 1]} ${y}`
}

export default function ReviewPage() {
  const { user } = useAuth()
  const { stats, submitWeeklyReview, submitMonthlyReview } = useGameData()
  const { logs } = useTimelineData()
  const { weeklyReviews, monthlyReviews, lastWeeklyReview, lastMonthlyReview, loading: historyLoading } = useReviewHistory()
  const [mode, setMode] = useState<Mode>('weekly')

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-5">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Refleksja</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Przegląd & Korekta</h1>
        <p className="font-sans text-sm text-muted">
          Zatrzymaj się. Co naprawdę się dzieje?
        </p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'weekly',   label: 'Tygodniowy' },
          { key: 'monthly',  label: 'Miesięczny' },
          { key: 'archive',  label: 'Archiwum' },
          { key: 'progress', label: 'Postęp' },
        ] as { key: Mode; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex-1 py-2.5 rounded-xl font-sans text-xs transition-all',
              mode === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Dzień projektu', value: getDaysElapsed() },
          { label: 'Dni do urodzin', value: getDaysRemaining() },
          { label: 'Łączne XP', value: stats.totalXP.toLocaleString('pl-PL') },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-elegant p-4 text-center">
            <p className="font-serif text-dark text-xl mb-1">{s.value}</p>
            <p className="font-sans text-[11px] text-muted uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {mode === 'weekly' && (
        <WeeklyReviewForm
          user={user}
          stats={stats}
          submitWeeklyReview={submitWeeklyReview}
          lastReview={lastWeeklyReview}
        />
      )}
      {mode === 'monthly' && (
        <MonthlyReviewForm
          user={user}
          stats={stats}
          logs={logs}
          submitMonthlyReview={submitMonthlyReview}
          lastReview={lastMonthlyReview}
        />
      )}
      {mode === 'archive' && (
        <ArchiveTab
          logs={logs}
          weeklyReviews={weeklyReviews}
          monthlyReviews={monthlyReviews}
          loading={historyLoading}
        />
      )}
      {mode === 'progress' && <ProgressTab stats={stats} />}
    </div>
  )
}

// ---------- Weekly form ----------

interface WeeklyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  submitWeeklyReview: ReturnType<typeof useGameData>['submitWeeklyReview']
  lastReview: WeeklyReview | null
}

function WeeklyReviewForm({ user, stats, submitWeeklyReview, lastReview }: WeeklyFormProps) {
  const [highlights, setHighlights] = useState('')
  const [challenges, setChallenges] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [ratings, setRatings] = useState<Record<Pillar, number>>({
    pozycja: 3, cialo: 3, styl: 3, kapital: 3, kariera: 3, tozsamosc: 3, milosc: 3,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)
  const [showContext, setShowContext] = useState(!!lastReview)

  const weekStart = (() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.getFullYear(), now.getMonth(), diff)
    // W poniedziałek recenzujemy ubiegły tydzień, nie nowy
    if (day === 1) monday.setDate(monday.getDate() - 7)
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  })()

  const alreadyReviewedThisWeek = (stats.reviewedWeeks ?? []).includes(weekStart)

  const hasAnyContent = highlights.trim().length > 0 || challenges.trim().length > 0 || nextFocus.trim().length > 0
  const hasNonDefaultRating = Object.values(ratings).some(r => r !== 3)
  const canSave = hasAnyContent || hasNonDefaultRating

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const ref = doc(db, 'users', user.uid, 'reviews', weekStart)
      await setDoc(ref, {
        weekStart,
        highlights,
        challenges,
        nextWeekFocus: nextFocus,
        pillarsRated: ratings,
        xpEarned: XP_VALUES.weeklyReview,
        savedAt: new Date().toISOString(),
      }, { merge: true })
      const granted = await submitWeeklyReview(weekStart)
      setXpGranted(granted)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="bg-gold-pale rounded-2xl border border-gold/30 p-8 text-center">
        <CheckCircle size={40} className="text-gold mx-auto mb-3" strokeWidth={1.5} />
        <h2 className="font-serif text-dark text-xl mb-2">Przegląd zapisany</h2>
        <p className="font-sans text-sm text-muted">
          {xpGranted
            ? `+${XP_VALUES.weeklyReview} XP za refleksję. Dobra robota.`
            : 'Zaktualizowano. XP za ten tydzień masz już przyznane.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {lastReview && (
        <ContinuityBanner
          show={showContext}
          onToggle={() => setShowContext(v => !v)}
          label={`Tydzień ${formatWeekRange(lastReview.weekStart)}`}
          focusLabel="Twój focus"
          focusText={lastReview.nextWeekFocus}
          pillarsRated={lastReview.pillarsRated}
        />
      )}

      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h2 className="font-serif text-dark text-lg mb-1">Oceń filary tego tygodnia</h2>
        <p className="font-sans text-xs text-muted mb-4">1 = zaniedbany, 5 = zadbany</p>
        <div className="space-y-4">
          {PILLARS.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span className="font-sans text-sm text-dark">{p.shortName}</span>
                </div>
                <span className="font-serif text-dark text-sm font-medium">
                  {ratings[p.id as Pillar]}/5
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatings(r => ({ ...r, [p.id]: n }))}
                    className={clsx(
                      'flex-1 h-8 rounded-lg font-sans text-xs transition-all',
                      ratings[p.id as Pillar] >= n
                        ? 'text-white'
                        : 'bg-cream text-muted-light hover:bg-parchment'
                    )}
                    style={ratings[p.id as Pillar] >= n ? { backgroundColor: p.color } : {}}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-elegant p-5 space-y-5">
        <h2 className="font-serif text-dark text-lg">Refleksja pisana</h2>

        <div>
          <label className="block font-sans text-xs text-muted uppercase tracking-wider mb-2">
            Co w tym tygodniu działało?
          </label>
          <textarea
            value={highlights}
            onChange={e => setHighlights(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Konkretne momenty, decyzje, działania..."
          />
        </div>

        <div>
          <label className="block font-sans text-xs text-muted uppercase tracking-wider mb-2">
            Co było trudne lub nie wyszło?
          </label>
          <textarea
            value={challenges}
            onChange={e => setChallenges(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Uczciwie. Bez oceniania siebie za bardzo."
          />
        </div>

        <div>
          <label className="block font-sans text-xs text-muted uppercase tracking-wider mb-2">
            Focus na następny tydzień
          </label>
          <textarea
            value={nextFocus}
            onChange={e => setNextFocus(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Jedna, dwie rzeczy. Nie lista 15 postanowień."
          />
        </div>
      </div>

      <div title={!canSave ? 'Oceń przynajmniej jeden filar lub wypełnij jedno pole, żeby zapisać przegląd' : undefined}>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="w-full bg-dark text-ivory font-sans text-sm py-4 rounded-2xl hover:bg-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide"
        >
          {saving
            ? 'Zapisuję...'
            : !canSave
              ? 'Wypełnij przynajmniej jedno pole'
              : alreadyReviewedThisWeek
                ? 'Zapisz zmiany'
                : `Zapisz przegląd · +${XP_VALUES.weeklyReview} XP`}
        </button>
      </div>
    </div>
  )
}

// ---------- Monthly form ----------

interface MonthlyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  logs: ReturnType<typeof useTimelineData>['logs']
  submitMonthlyReview: ReturnType<typeof useGameData>['submitMonthlyReview']
  lastReview: MonthlyReview | null
}

function MonthlyReviewForm({ user, stats, logs, submitMonthlyReview, lastReview }: MonthlyFormProps) {
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
        month: monthKey,
        highlights,
        challenges,
        pillarsRated: ratings,
        intentionNextMonth: intention,
        xpEarned: XP_VALUES.monthlyReview,
        savedAt: new Date().toISOString(),
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
      <div className="bg-gold-pale rounded-2xl border border-gold/30 p-8 text-center">
        <CheckCircle size={40} className="text-gold mx-auto mb-3" strokeWidth={1.5} />
        <h2 className="font-serif text-dark text-xl mb-2">Miesiąc zamknięty</h2>
        <p className="font-sans text-sm text-muted">
          {xpGranted
            ? `+${XP_VALUES.monthlyReview} XP za miesięczną ceremonię. Idziesz dalej.`
            : 'Zaktualizowano. XP za ten miesiąc masz już przyznane.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Month summary */}
      <div className="bg-dark rounded-2xl p-5 text-ivory">
        <p className="font-sans text-[10px] text-gold-light/70 uppercase tracking-widest mb-1">
          Ceremonia miesiąca
        </p>
        <h2 className="font-serif text-ivory text-xl mb-4">{formatMonthPL(monthKey)}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-wide mb-0.5">XP miesiąca</p>
            <p className="font-serif text-gold-light text-2xl">{agg.totalXP.toLocaleString('pl-PL')}</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-wide mb-0.5">Dni aktywne</p>
            <p className="font-serif text-ivory text-2xl">{agg.activeDays}</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-wide mb-0.5">Rutyny</p>
            <p className="font-serif text-ivory text-lg">{agg.totalRoutines}</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-wide mb-0.5">Side questy</p>
            <p className="font-serif text-ivory text-lg">{agg.totalSideQuests}</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-wide mb-0.5">Daily questy</p>
            <p className="font-serif text-ivory text-lg">{agg.totalDailyQuests}</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-wide mb-0.5">Zasady</p>
            <p className="font-serif text-ivory text-lg">{agg.totalRulesKept}</p>
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

      {/* Pillar ratings */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h2 className="font-serif text-dark text-lg mb-1">Oceń filary tego miesiąca</h2>
        <p className="font-sans text-xs text-muted mb-4">Gdzie byłaś obecna, gdzie znikałaś?</p>
        <div className="space-y-4">
          {PILLARS.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span className="font-sans text-sm text-dark">{p.shortName}</span>
                </div>
                <span className="font-serif text-dark text-sm font-medium">
                  {ratings[p.id as Pillar]}/5
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatings(r => ({ ...r, [p.id]: n }))}
                    className={clsx(
                      'flex-1 h-8 rounded-lg font-sans text-xs transition-all',
                      ratings[p.id as Pillar] >= n
                        ? 'text-white'
                        : 'bg-cream text-muted-light hover:bg-parchment'
                    )}
                    style={ratings[p.id as Pillar] >= n ? { backgroundColor: p.color } : {}}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Written reflection */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 space-y-5">
        <h2 className="font-serif text-dark text-lg">Refleksja miesiąca</h2>

        <div>
          <label className="block font-sans text-xs text-muted uppercase tracking-wider mb-2">
            Co ten miesiąc wniósł do twojego życia?
          </label>
          <textarea
            value={highlights}
            onChange={e => setHighlights(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Decyzje, zmiany, momenty, które chcesz zapamiętać..."
          />
        </div>

        <div>
          <label className="block font-sans text-xs text-muted uppercase tracking-wider mb-2">
            Co się nie udało i czego cię to nauczyło?
          </label>
          <textarea
            value={challenges}
            onChange={e => setChallenges(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Bez wymówek, bez samobiczowania."
          />
        </div>

        <div>
          <label className="block font-sans text-xs text-muted uppercase tracking-wider mb-2">
            Intencja na nowy miesiąc
          </label>
          <textarea
            value={intention}
            onChange={e => setIntention(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Jedno zdanie, które niesiesz dalej."
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className="w-full bg-dark text-ivory font-sans text-sm py-4 rounded-2xl hover:bg-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide"
        title={!canSave ? 'Oceń przynajmniej jeden filar lub wypełnij jedno pole, żeby zapisać przegląd' : undefined}
      >
        {saving
          ? 'Zapisuję...'
          : !canSave
            ? 'Wypełnij przynajmniej jedno pole'
            : alreadyReviewed
              ? 'Zapisz zmiany'
              : `Zamknij miesiąc · +${XP_VALUES.monthlyReview} XP`}
      </button>
    </div>
  )
}

// ---------- Continuity banner ----------

interface ContinuityBannerProps {
  show: boolean
  onToggle: () => void
  label: string
  focusLabel: string
  focusText: string
  pillarsRated: Record<string, number>
}

function ContinuityBanner({ show, onToggle, label, focusLabel, focusText, pillarsRated }: ContinuityBannerProps) {
  return (
    <div className="bg-cream rounded-2xl border border-border p-5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full"
      >
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest">{label}</p>
        {show ? <EyeOff size={14} className="text-muted" /> : <Eye size={14} className="text-muted" />}
      </button>

      {show && (
        <div className="mt-3 space-y-3">
          {focusText && (
            <div>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">{focusLabel}</p>
              <p className="font-sans text-sm text-dark italic leading-relaxed">&ldquo;{focusText}&rdquo;</p>
            </div>
          )}

          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-2">Oceny filarów</p>
            <div className="flex gap-2 flex-wrap">
              {PILLARS.map(p => {
                const val = pillarsRated[p.id] ?? 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1"
                  >
                    <span className="text-xs">{p.icon}</span>
                    <span
                      className="font-serif text-xs font-medium"
                      style={{ color: p.color }}
                    >
                      {val}/5
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Archive tab (Podsumowanie + Historia przeglądów) ----------

type ArchiveSubTab = 'przeglądy' | 'statystyki'

interface ArchiveTabProps {
  logs: ReturnType<typeof useTimelineData>['logs']
  weeklyReviews: WeeklyReview[]
  monthlyReviews: MonthlyReview[]
  loading: boolean
}

function ArchiveTab({ logs, weeklyReviews, monthlyReviews, loading }: ArchiveTabProps) {
  const [sub, setSub] = useState<ArchiveSubTab>('przeglądy')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([
          { key: 'przeglądy' as const, label: 'Przeglądy' },
          { key: 'statystyki' as const, label: 'Statystyki' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={clsx(
              'flex-1 py-2 rounded-xl font-sans text-xs transition-all',
              sub === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'przeglądy' && (
        <ReviewHistoryTab
          weeklyReviews={weeklyReviews}
          monthlyReviews={monthlyReviews}
          loading={loading}
        />
      )}
      {sub === 'statystyki' && <MonthlySummaryTab logs={logs} />}
    </div>
  )
}

// ---------- Monthly summary tab ----------

const PL_MONTH_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${PL_MONTH_SHORT[m - 1]}`
}

function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function getElapsedDaysInMonth(monthKey: string): number {
  const today = new Date()
  const [y, m] = monthKey.split('-').map(Number)
  if (today.getFullYear() === y && today.getMonth() + 1 === m) {
    return today.getDate()
  }
  if (new Date(y, m - 1, 1) > today) return 0
  return getDaysInMonth(monthKey)
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface SummaryProps {
  logs: ReturnType<typeof useTimelineData>['logs']
}

function MonthlySummaryTab({ logs }: SummaryProps) {
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), [])
  const [monthKey, setMonthKey] = useState(currentMonthKey)

  const PROJECT_START_MONTH = '2026-04'

  const canGoPrev = monthKey > PROJECT_START_MONTH
  const canGoNext = monthKey < currentMonthKey

  const routineCounts = useMemo(() => getRoutineItemCounts(logs, monthKey), [logs, monthKey])
  const ruleCounts = useMemo(() => getRuleKeptCounts(logs, monthKey), [logs, monthKey])
  const completedSideQuests = useMemo(() => getCompletedSideQuestDates(logs, monthKey), [logs, monthKey])
  const allMonthAggs = useMemo(() => aggregateXpByMonth(logs), [logs])

  const agg = allMonthAggs[monthKey] ?? {
    totalXP: 0, activeDays: 0, totalDailyQuests: 0,
    totalSideQuests: 0, totalRoutines: 0, totalRulesKept: 0, monthKey,
  }

  const prevMonthKey = shiftMonth(monthKey, -1)
  const prevAgg = prevMonthKey >= PROJECT_START_MONTH ? (allMonthAggs[prevMonthKey] ?? null) : null

  const elapsedDays = getElapsedDaysInMonth(monthKey)

  const questMap = useMemo(
    () => Object.fromEntries(SIDE_QUESTS.map(q => [q.id, q])),
    []
  )

  function ProgressBar({ count, total }: { count: number; total: number }) {
    const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0
    return (
      <div className="flex items-center gap-2 flex-shrink-0 w-28">
        <div className="flex-1 bg-parchment rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-sans text-xs text-muted w-10 text-right shrink-0">{count}/{total}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-elegant p-4">
        <button
          onClick={() => canGoPrev && setMonthKey(shiftMonth(monthKey, -1))}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-cream transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-serif text-dark text-lg">{formatMonthPL(monthKey)}</p>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">{elapsedDays} dni w miesiącu</p>
        </div>
        <button
          onClick={() => canGoNext && setMonthKey(shiftMonth(monthKey, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-cream transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Dni aktywne', value: agg.activeDays },
          { label: 'XP miesiąca', value: agg.totalXP.toLocaleString('pl-PL') },
          { label: 'Side questy', value: agg.totalSideQuests },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-elegant p-3 text-center">
            <p className="font-serif text-dark text-xl mb-0.5">{c.value}</p>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide leading-tight">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Morning routine */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Rutyna poranna</h3>
        <p className="font-sans text-[11px] text-muted mb-4">ile razy wykonana z {elapsedDays} możliwych dni</p>
        <div className="space-y-3">
          {MORNING_ROUTINE.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
              <ProgressBar count={routineCounts[item.id] ?? 0} total={elapsedDays} />
            </div>
          ))}
        </div>
      </div>

      {/* Evening routine */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Rutyna wieczorna</h3>
        <p className="font-sans text-[11px] text-muted mb-4">ile razy wykonana z {elapsedDays} możliwych dni</p>
        <div className="space-y-3">
          {EVENING_ROUTINE.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
              <ProgressBar count={routineCounts[item.id] ?? 0} total={elapsedDays} />
            </div>
          ))}
        </div>
      </div>

      {/* Daily routine */}
      {(() => {
        // Count occurrences of each weekday (0=sun…6=sat) in the elapsed days of the month
        function countWeekdayOccurrences(dow: number): number {
          const [y, m] = monthKey.split('-').map(Number)
          let count = 0
          for (let d = 1; d <= elapsedDays; d++) {
            if (new Date(y, m - 1, d).getDay() === dow) count++
          }
          return count
        }
        const weekdayDays = [1, 2, 3, 4, 5].reduce((s, d) => s + countWeekdayOccurrences(d), 0)
        // Study item: appears Mon(1), Wed(3), Fri(5)
        const studyPossible = [1, 3, 5].reduce((s, d) => s + countWeekdayOccurrences(d), 0)
        const studyCount = Object.entries(routineCounts)
          .filter(([id]) => id.startsWith('study_'))
          .reduce((s, [, c]) => s + c, 0)

        const DAY_LABELS: Record<number, string> = {
          0: 'Niedziela', 1: 'Poniedziałek', 2: 'Wtorek',
          3: 'Środa', 4: 'Czwartek', 5: 'Piątek', 6: 'Sobota',
        }

        return (
          <div className="bg-white rounded-2xl shadow-elegant p-5">
            <h3 className="font-serif text-dark text-base mb-0.5">Rutyna dzienna</h3>
            <p className="font-sans text-[11px] text-muted mb-4">nawyki dnia, temat tygodnia i cykliczne zadania</p>
            <div className="space-y-5">

              {/* Daily habits (weekdays only) */}
              {DAILY_HABITS.length > 0 && (
                <div>
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2">Codzienne robocze</p>
                  <div className="space-y-3">
                    {DAILY_HABITS.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
                        <ProgressBar count={routineCounts[item.id] ?? 0} total={weekdayDays} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study item */}
              {studyPossible > 0 && (
                <div>
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2">Temat tygodnia (pn / śr / pt)</p>
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">Nauka z danego tygodnia</span>
                    <ProgressBar count={studyCount} total={studyPossible} />
                  </div>
                </div>
              )}

              {/* Weekly habits per day */}
              {([0, 1, 2, 3, 4, 5, 6] as number[])
                .filter(dow => WEEKLY_HABITS[dow]?.length > 0)
                .map(dow => {
                  const items = WEEKLY_HABITS[dow]
                  const possible = countWeekdayOccurrences(dow)
                  if (possible === 0) return null
                  return (
                    <div key={dow}>
                      <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2">{DAY_LABELS[dow]}</p>
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <span className="font-sans text-xs text-dark flex-1 leading-snug min-w-0">{item.text}</span>
                            <ProgressBar count={routineCounts[item.id] ?? 0} total={possible} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )
      })()}

      {/* Rules */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Zasady</h3>
        <p className="font-sans text-[11px] text-muted mb-4">jak często trzymałaś się zasad</p>
        <div className="space-y-4">
          {DAILY_RULES.map(rule => {
            const count = ruleCounts[rule.id] ?? 0
            const pct = elapsedDays > 0 ? Math.round((count / elapsedDays) * 100) : 0
            return (
              <div key={rule.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-xs text-dark leading-snug">{rule.text}</span>
                  <span className="font-sans text-xs text-gold-light font-medium ml-2 shrink-0">{pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-parchment rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-sans text-xs text-muted shrink-0">{count}/{elapsedDays} dni</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily quests */}
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-0.5">Daily questy</h3>
        <p className="font-sans text-[11px] text-muted mb-3">
          3 questy dziennie × {elapsedDays} dni = {elapsedDays * 3} możliwych
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-parchment rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gold transition-all"
              style={{
                width: `${elapsedDays * 3 > 0 ? Math.min(100, Math.round((agg.totalDailyQuests / (elapsedDays * 3)) * 100)) : 0}%`,
              }}
            />
          </div>
          <span className="font-serif text-dark text-lg shrink-0">{agg.totalDailyQuests}</span>
        </div>
        <p className="font-sans text-[11px] text-muted mt-1">ukończonych questów</p>
      </div>

      {/* Side quests list */}
      {completedSideQuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elegant p-5">
          <h3 className="font-serif text-dark text-base mb-0.5">Side questy</h3>
          <p className="font-sans text-[11px] text-muted mb-4">
            {completedSideQuests.length} ukończonych ·{' '}
            {completedSideQuests.reduce((s, sq) => s + (questMap[sq.questId]?.xp ?? 0), 0).toLocaleString('pl-PL')} XP łącznie
          </p>
          <div className="space-y-0">
            {completedSideQuests.map(({ questId, date }, i) => {
              const quest = questMap[questId]
              if (!quest) return null
              const pillar = PILLARS.find(p => p.id === quest.pillar)
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-cream last:border-0">
                  <span className="font-sans text-[11px] text-muted shrink-0 w-12 pt-0.5">{formatDay(date)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-dark leading-snug">{quest.title}</p>
                    {pillar && (
                      <span
                        className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-sans uppercase tracking-wide text-white"
                        style={{ backgroundColor: pillar.color }}
                      >
                        {pillar.shortName}
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-xs text-gold-light font-medium shrink-0 pt-0.5">+{quest.xp} XP</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Comparison with previous month */}
      {prevAgg && (prevAgg.totalXP > 0 || prevAgg.activeDays > 0) && (
        <div className="bg-dark rounded-2xl p-5 text-ivory">
          <h3 className="font-serif text-ivory text-base mb-3">
            vs. {formatMonthPL(prevMonthKey)}
          </h3>
          <div className="space-y-3">
            {[
              { label: 'XP', now: agg.totalXP, prev: prevAgg.totalXP, fmt: (v: number) => v.toLocaleString('pl-PL') },
              { label: 'Dni aktywne', now: agg.activeDays, prev: prevAgg.activeDays, fmt: (v: number) => String(v) },
              { label: 'Side questy', now: agg.totalSideQuests, prev: prevAgg.totalSideQuests, fmt: (v: number) => String(v) },
            ].map(({ label, now, prev, fmt }) => {
              const diff = now - prev
              const positive = diff >= 0
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="font-sans text-xs text-muted-light">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-ivory/50">{fmt(prev)}</span>
                    <span className="font-sans text-xs text-muted-light">→</span>
                    <span className="font-serif text-sm text-ivory">{fmt(now)}</span>
                    {diff !== 0 && (
                      <span className={clsx(
                        'font-sans text-xs font-medium',
                        positive ? 'text-gold-light' : 'text-red-300'
                      )}>
                        {positive ? '+' : ''}{fmt(diff)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {agg.activeDays === 0 && elapsedDays > 0 && (
        <div className="text-center py-8">
          <p className="font-sans text-muted text-sm">Brak danych za {formatMonthPL(monthKey)}.</p>
          <p className="font-sans text-muted text-xs mt-1">Wróć tu gdy zalogujesz pierwsze dni.</p>
        </div>
      )}
    </div>
  )
}

// ---------- Progress tab (ogród transformacji) ----------

const TOTAL_XP = 200_000

interface GardenStage {
  emoji: string
  stageName: string
  desc: string
  bg: string
  accentColor: string
}

function getGardenStage(level: number): GardenStage {
  if (level <= 2)  return { emoji: '🌰', stageName: 'Nasienie',        desc: 'Wszystko wielkie zaczyna się od małego ziarnka.',         bg: 'from-stone-50 to-parchment',      accentColor: '#8B6914' }
  if (level <= 4)  return { emoji: '🌱', stageName: 'Kiełek',          desc: 'Pierwsze pędy przebijają się przez ziemię.',              bg: 'from-green-50/60 to-ivory',        accentColor: '#3d6b2b' }
  if (level <= 6)  return { emoji: '🌿', stageName: 'Łodyżka',         desc: 'Korzenie się ugruntowują, liście złapały słońce.',        bg: 'from-emerald-50/50 to-ivory',     accentColor: '#2d5a20' }
  if (level <= 9)  return { emoji: '🪴', stageName: 'Roślina',         desc: 'Jesteś silna, zakorzeniona i wyraźna.',                   bg: 'from-green-50/40 to-parchment',   accentColor: '#3d6b2b' }
  if (level <= 12) return { emoji: '🌷', stageName: 'Pąk',             desc: 'Coś bardzo pięknego właśnie się zbliża.',                 bg: 'from-pink-50/40 to-ivory',        accentColor: '#c06080' }
  if (level <= 15) return { emoji: '🌸', stageName: 'Pierwszy kwiat',  desc: 'Rozkwitasz — i warto było na to czekać.',                 bg: 'from-pink-50/50 to-parchment',    accentColor: '#d4698c' }
  if (level <= 18) return { emoji: '🌺', stageName: 'Pełen rozkwit',   desc: 'Piękno w pełnej, niepowstrzymanej ekspresji.',            bg: 'from-rose-50/50 to-ivory',        accentColor: '#c0392b' }
  if (level <= 21) return { emoji: '🌹', stageName: 'Róża',            desc: 'Klasyczna elegancja, silna i nieodparta.',                bg: 'from-rose-50/60 to-parchment',    accentColor: '#9b2335' }
  if (level <= 24) return { emoji: '💐', stageName: 'Bukiet',          desc: 'Otaczasz się pięknem, które sama stworzyłaś.',            bg: 'from-purple-50/30 to-ivory',      accentColor: '#7c5cbf' }
  if (level <= 27) return { emoji: '🌳', stageName: 'Drzewo',          desc: 'Głęboko zakorzeniona siła, widoczna z daleka.',           bg: 'from-emerald-50/40 to-parchment', accentColor: '#1a5c2a' }
  if (level <= 29) return { emoji: '🌿✨', stageName: 'Ogród Eden',    desc: 'Na samym progu finału. Jeden krok dzieli Cię od wszystkiego.', bg: 'from-gold-pale to-ivory',    accentColor: '#B8963E' }
  return                 { emoji: '✨',  stageName: 'Natalia 30',      desc: 'Osiągnęłaś wszystko, co zaplanowałaś. To jest Ty.',       bg: 'from-gold-pale to-parchment',     accentColor: '#B8963E' }
}

function GardenArt({ levelStage }: { levelStage: number }) {
  const s = Math.min(levelStage, 10)
  const stemH = 20 + s * 9
  const stemY = 130 - stemH
  const showLeaves = s >= 2
  const showBud    = s >= 4
  const showPetals = s >= 6
  const showSecond = s >= 8
  const isEden     = s >= 10

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden>
      <ellipse cx="80" cy="135" rx="50" ry="6" fill="#2A1A0A" opacity="0.12" />
      {s >= 1 && (
        <>
          <path d={`M80,130 Q70,${140} 60,${138}`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
          <path d={`M80,130 Q90,${142} 100,${139}`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
        </>
      )}
      {s === 0 && (
        <ellipse cx="80" cy="128" rx="8" ry="5" fill="#8B6914" opacity="0.6" />
      )}
      {s >= 1 && (
        <path
          d={`M80,130 Q77,${stemY + stemH * 0.5} 80,${stemY}`}
          stroke="#3d6b2b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {showLeaves && (
        <>
          <path d={`M79,${stemY + stemH * 0.65} Q60,${stemY + stemH * 0.45} 65,${stemY + stemH * 0.3}`}
            fill="#4a8a35" opacity="0.75" />
          <path d={`M81,${stemY + stemH * 0.50} Q100,${stemY + stemH * 0.30} 95,${stemY + stemH * 0.15}`}
            fill="#4a8a35" opacity="0.65" />
        </>
      )}
      {s >= 5 && (
        <>
          <path d={`M79,${stemY + stemH * 0.80} Q58,${stemY + stemH * 0.70} 62,${stemY + stemH * 0.55}`}
            fill="#3d7a2a" opacity="0.55" />
        </>
      )}
      {showBud && !showPetals && (
        <ellipse cx="80" cy={stemY} rx="6" ry="9" fill="#d4698c" opacity="0.8" />
      )}
      {showPetals && (
        <g transform={`translate(80, ${stemY})`}>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <ellipse
              key={i}
              cx={Math.cos((deg * Math.PI) / 180) * 10}
              cy={Math.sin((deg * Math.PI) / 180) * 10}
              rx="5"
              ry="8"
              fill={s >= 9 ? '#D4AF6B' : '#e8a0b8'}
              opacity="0.85"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="5" fill={s >= 9 ? '#B8963E' : '#d4698c'} />
        </g>
      )}
      {showSecond && (
        <>
          <path d={`M80,${stemY + 5} Q65,${stemY - 20} 55,${stemY - 25}`} stroke="#3d6b2b" strokeWidth="2" fill="none" />
          <g transform={`translate(55, ${stemY - 25})`}>
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <ellipse
                key={i}
                cx={Math.cos((deg * Math.PI) / 180) * 7}
                cy={Math.sin((deg * Math.PI) / 180) * 7}
                rx="4"
                ry="6"
                fill="#c0a0d8"
                opacity="0.75"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="3.5" fill="#9b6bb5" />
          </g>
        </>
      )}
      {isEden && (
        <>
          {[[35, 30], [125, 25], [110, 70], [30, 75], [80, 15]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#D4AF6B" strokeWidth="1.5" opacity="0.7" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#D4AF6B" strokeWidth="1.5" opacity="0.7" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#D4AF6B" strokeWidth="1" opacity="0.5" />
              <line x1="3" y1="-3" x2="-3" y2="3" stroke="#D4AF6B" strokeWidth="1" opacity="0.5" />
            </g>
          ))}
        </>
      )}
    </svg>
  )
}

interface ProgressTabProps {
  stats: ReturnType<typeof useGameData>['stats']
}

function ProgressTab({ stats }: ProgressTabProps) {
  const totalXP    = stats?.totalXP ?? 0
  const currentLvl = getLevelFromXP(totalXP)
  const stage      = getGardenStage(currentLvl.level)
  const overallPct = Math.min(100, Math.round((totalXP / TOTAL_XP) * 100))
  const levelStage = Math.floor((currentLvl.level - 1) / 3)

  // Track calculation
  const daysElapsed = getDaysElapsed()
  const TOTAL_DAYS = 365
  const expectedXP = Math.round((daysElapsed / TOTAL_DAYS) * TOTAL_XP)
  const xpDiff = totalXP - expectedXP
  const isOnTrack = xpDiff >= -500
  const isAhead = xpDiff > 500

  let trackStatus: string
  let trackColor: string
  if (isAhead) {
    trackStatus = `↑ Jesteś ${Math.abs(xpDiff).toLocaleString('pl-PL')} XP przed planem`
    trackColor = 'bg-green-50 border-green-200 text-green-700'
  } else if (isOnTrack) {
    trackStatus = xpDiff > 0
      ? `✓ Jesteś ${Math.abs(xpDiff).toLocaleString('pl-PL')} XP przed planem`
      : '✓ Jesteś na tracku'
    trackColor = 'bg-gold-pale border-gold/30 text-dark'
  } else {
    trackStatus = `↓ Jesteś ${Math.abs(xpDiff).toLocaleString('pl-PL')} XP za planem`
    trackColor = 'bg-rose-50 border-rose-200 text-rose-700'
  }

  return (
    <div className="space-y-5">
      {/* Hero garden card */}
      <div className="bg-white rounded-2xl shadow-elegant overflow-hidden">
        <div className={clsx('relative bg-gradient-to-b px-6 pt-8 pb-5', stage.bg)}>
          <span className="absolute top-3 left-4 text-[10px] text-muted-light/50 select-none font-serif">✦</span>
          <span className="absolute top-3 right-4 text-[10px] text-muted-light/50 select-none font-serif">✦</span>

          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-32 h-32">
              <GardenArt levelStage={levelStage} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-sans text-[10px] uppercase tracking-widest mb-1"
                 style={{ color: stage.accentColor }}>
                Poziom {currentLvl.level} · {stage.stageName}
              </p>
              <h2 className="font-serif text-dark text-2xl mb-2 leading-tight">
                {currentLvl.name}
              </h2>
              <p className="font-sans text-xs text-muted leading-relaxed italic">
                {stage.desc}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border/40">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-sans text-xs text-muted uppercase tracking-wider">Droga do Natalii 30</span>
            <span className="font-serif text-gold text-2xl">{overallPct}<span className="text-base">%</span></span>
          </div>
          <div className="relative h-3 bg-cream rounded-full overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 9px)' }} />
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${overallPct}%`,
                background: 'linear-gradient(90deg, #B8963E 0%, #D4AF6B 50%, #C9A84C 100%)',
                boxShadow: '0 0 8px rgba(184,150,62,0.4)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-sans text-[11px] text-muted">
              {totalXP.toLocaleString('pl-PL')} XP zebrane
            </span>
            <span className="font-sans text-[11px] text-muted-light">
              cel: 140 000 XP
            </span>
          </div>
        </div>

        {currentLvl.level < 30 && (
          <div className="px-6 pb-5">
            <div className="bg-cream rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="font-sans text-xs text-muted">Pozostało do celu</span>
              <span className="font-serif text-dark text-base">
                {(TOTAL_XP - totalXP).toLocaleString('pl-PL')}
                <span className="font-sans text-xs text-muted-light ml-1">XP</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Track status */}
      <div className={clsx('rounded-2xl border px-5 py-4', trackColor)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-wider font-medium mb-1">
              {daysElapsed} dzień z 365 · Oczekiwany XP: {expectedXP.toLocaleString('pl-PL')}
            </p>
            <p className="font-serif text-sm">
              {trackStatus}
            </p>
          </div>
        </div>
      </div>

      {/* All 30 levels */}
      <div>
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-4">
          Wszystkie 30 poziomów
        </p>

        <div className="relative">
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-border/60" />

          <div className="space-y-1">
            {LEVELS.map((lvl, idx) => {
              const done      = totalXP >= lvl.xpRequired
              const isCurrent = lvl.level === currentLvl.level
              const nextLvl   = LEVELS[idx + 1]

              return (
                <div
                  key={lvl.level}
                  className={clsx(
                    'relative flex items-center gap-3 pl-0 pr-3 py-2.5 rounded-xl transition-all',
                    isCurrent ? 'bg-gold-pale' : 'bg-transparent'
                  )}
                >
                  <div className="relative z-10 flex-shrink-0 ml-0">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isCurrent
                        ? 'bg-gold shadow-md'
                        : done
                          ? 'bg-forest/15 border border-forest/30'
                          : 'bg-ivory border border-border'
                    )}>
                      {isCurrent && (
                        <span className="font-serif text-white text-sm">✦</span>
                      )}
                      {done && !isCurrent && (
                        <Check size={14} className="text-forest" strokeWidth={2.5} />
                      )}
                      {!done && !isCurrent && (
                        <span className="font-sans text-[10px] text-muted-light font-medium">
                          {lvl.level}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className={clsx(
                        'font-serif truncate',
                        isCurrent
                          ? 'text-dark text-base font-medium'
                          : done
                            ? 'text-muted text-sm'
                            : 'text-muted-light text-sm'
                      )}>
                        {lvl.name}
                      </span>
                      {isCurrent && (
                        <span className="flex-shrink-0 font-sans text-[9px] bg-gold text-ivory px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          teraz
                        </span>
                      )}
                    </div>

                    <span className={clsx(
                      'flex-shrink-0 font-sans text-xs tabular-nums',
                      done ? 'text-muted' : 'text-muted-light'
                    )}>
                      {lvl.xpRequired === 0
                        ? 'Start'
                        : `${lvl.xpRequired.toLocaleString('pl-PL')} XP`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 text-center border-t border-border/40 pt-6">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">✦</p>
          <p className="font-serif text-sm text-muted leading-relaxed">
            Nie musisz być jutro inna niż dziś.<br />
            <span className="text-dark/70">Wystarczy, że jesteś tu — i działasz.</span>
          </p>
          <p className="font-sans text-[10px] text-muted-light mt-3 uppercase tracking-wider">
            Projekt 30 · 5 kwietnia 2026 → 5 kwietnia 2027
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------- Review history tab ----------

interface ReviewHistoryTabProps {
  weeklyReviews: WeeklyReview[]
  monthlyReviews: MonthlyReview[]
  loading: boolean
}

function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startDay = start.getDate()
  const endDay = end.getDate()
  const startMonth = PL_MONTH_SHORT[start.getMonth()]
  const endMonth = PL_MONTH_SHORT[end.getMonth()]
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${startMonth} ${y}`
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${end.getFullYear()}`
}

function avgPillarRating(pillarsRated: Record<string, number>): string {
  const vals = Object.values(pillarsRated)
  if (vals.length === 0) return '–'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function ReviewHistoryTab({ weeklyReviews, monthlyReviews, loading }: ReviewHistoryTabProps) {
  const [subTab, setSubTab] = useState<'weekly' | 'monthly'>('weekly')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-sans text-sm text-muted">Ładuję historię...</p>
      </div>
    )
  }

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-2">
        {([
          { key: 'weekly' as const, label: 'Tygodniowe' },
          { key: 'monthly' as const, label: 'Miesięczne' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSubTab(key); setExpandedId(null) }}
            className={clsx(
              'flex-1 py-2 rounded-xl font-sans text-xs transition-all',
              subTab === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'weekly' && weeklyReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-muted">Brak przeglądów tygodniowych.</p>
          <p className="font-sans text-xs text-muted-light mt-1">Twój pierwszy przegląd pojawi się tutaj.</p>
        </div>
      )}

      {subTab === 'monthly' && monthlyReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-muted">Brak przeglądów miesięcznych.</p>
          <p className="font-sans text-xs text-muted-light mt-1">Twój pierwszy przegląd pojawi się tutaj.</p>
        </div>
      )}

      {/* Pillar trend chart */}
      {subTab === 'weekly' && weeklyReviews.length > 0 && (
        <PillarTrendChart reviews={weeklyReviews.slice(0, 8)} />
      )}

      {/* Weekly reviews list */}
      {subTab === 'weekly' && weeklyReviews.map((review, idx) => {
        const isOpen = expandedId === review.weekStart
        const prevReview = weeklyReviews[idx + 1] ?? null
        return (
          <div key={review.weekStart} className="bg-white rounded-2xl shadow-elegant overflow-hidden">
            <button
              onClick={() => toggle(review.weekStart)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="text-left">
                <p className="font-serif text-dark text-base">{formatWeekRange(review.weekStart)}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">
                  Średnia filarów: {avgPillarRating(review.pillarsRated)} · +{review.xpEarned} XP
                </p>
              </div>
              <ChevronDown
                size={16}
                className={clsx('text-muted transition-transform', isOpen && 'rotate-180')}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                {review.highlights && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co działało</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.highlights}</p>
                  </div>
                )}
                {review.challenges && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co było trudne</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.challenges}</p>
                  </div>
                )}
                {review.nextWeekFocus && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Focus na następny tydzień</p>
                    <p className="font-sans text-sm text-dark italic leading-relaxed">&ldquo;{review.nextWeekFocus}&rdquo;</p>
                  </div>
                )}

                {/* Pillar ratings with delta */}
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-2">Filary</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(p => {
                      const val = review.pillarsRated[p.id as Pillar] ?? 0
                      const prevVal = prevReview?.pillarsRated[p.id as Pillar] ?? null
                      const delta = prevVal !== null ? val - prevVal : null
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
                          <span className="text-xs">{p.icon}</span>
                          <span className="font-sans text-xs text-dark flex-1">{p.shortName}</span>
                          <span className="font-serif text-sm font-medium" style={{ color: p.color }}>
                            {val}
                          </span>
                          {delta !== null && delta !== 0 && (
                            <span className={clsx(
                              'font-sans text-[10px] font-medium',
                              delta > 0 ? 'text-green-600' : 'text-red-400'
                            )}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Monthly reviews list */}
      {subTab === 'monthly' && monthlyReviews.map((review, idx) => {
        const isOpen = expandedId === review.month
        const prevReview = monthlyReviews[idx + 1] ?? null
        return (
          <div key={review.month} className="bg-white rounded-2xl shadow-elegant overflow-hidden">
            <button
              onClick={() => toggle(review.month)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="text-left">
                <p className="font-serif text-dark text-base">{formatMonthPL(review.month)}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">
                  Średnia filarów: {avgPillarRating(review.pillarsRated)} · +{review.xpEarned} XP
                </p>
              </div>
              <ChevronDown
                size={16}
                className={clsx('text-muted transition-transform', isOpen && 'rotate-180')}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                {review.highlights && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co ten miesiąc wniósł</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.highlights}</p>
                  </div>
                )}
                {review.challenges && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Co się nie udało</p>
                    <p className="font-sans text-sm text-dark leading-relaxed">{review.challenges}</p>
                  </div>
                )}
                {review.intentionNextMonth && (
                  <div>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1">Intencja na nowy miesiąc</p>
                    <p className="font-sans text-sm text-dark italic leading-relaxed">&ldquo;{review.intentionNextMonth}&rdquo;</p>
                  </div>
                )}

                {/* Pillar ratings with delta */}
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-2">Filary</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(p => {
                      const val = review.pillarsRated[p.id as Pillar] ?? 0
                      const prevVal = prevReview?.pillarsRated[p.id as Pillar] ?? null
                      const delta = prevVal !== null ? val - prevVal : null
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
                          <span className="text-xs">{p.icon}</span>
                          <span className="font-sans text-xs text-dark flex-1">{p.shortName}</span>
                          <span className="font-serif text-sm font-medium" style={{ color: p.color }}>
                            {val}
                          </span>
                          {delta !== null && delta !== 0 && (
                            <span className={clsx(
                              'font-sans text-[10px] font-medium',
                              delta > 0 ? 'text-green-600' : 'text-red-400'
                            )}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
