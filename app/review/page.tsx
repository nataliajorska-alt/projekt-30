'use client'
import { useState, useMemo } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { getDaysElapsed, getDaysRemaining, getMonthKey, XP_VALUES } from '@/lib/gameLogic'
import { getMonthAggregate } from '@/lib/analytics'
import { CheckCircle } from 'lucide-react'
import clsx from 'clsx'

type Mode = 'weekly' | 'monthly'

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatMonthPL(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${PL_MONTH_NAMES[m - 1]} ${y}`
}

export default function ReviewPage() {
  const { user } = useAuth()
  const { stats, submitWeeklyReview, submitMonthlyReview } = useGameData()
  const { logs } = useTimelineData()
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
      <div className="flex gap-2 mb-6">
        {(['weekly', 'monthly'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              'flex-1 py-2.5 rounded-xl font-sans text-sm transition-all',
              mode === m
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {m === 'weekly' ? 'Tygodniowy' : 'Miesięczny'}
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

      {mode === 'weekly' ? (
        <WeeklyReviewForm
          user={user}
          stats={stats}
          submitWeeklyReview={submitWeeklyReview}
        />
      ) : (
        <MonthlyReviewForm
          user={user}
          stats={stats}
          logs={logs}
          submitMonthlyReview={submitMonthlyReview}
        />
      )}
    </div>
  )
}

// ---------- Weekly form ----------

interface WeeklyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  submitWeeklyReview: ReturnType<typeof useGameData>['submitWeeklyReview']
}

function WeeklyReviewForm({ user, stats, submitWeeklyReview }: WeeklyFormProps) {
  const [highlights, setHighlights] = useState('')
  const [challenges, setChallenges] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [ratings, setRatings] = useState<Record<Pillar, number>>({
    pozycja: 3, cialo: 3, styl: 3, kapital: 3, kariera: 3, tozsamosc: 3, milosc: 3,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)

  const weekStart = (() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.getFullYear(), now.getMonth(), diff)
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  })()

  const alreadyReviewedThisWeek = (stats.reviewedWeeks ?? []).includes(weekStart)

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

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-dark text-ivory font-sans text-sm py-4 rounded-2xl hover:bg-forest transition-colors disabled:opacity-60 font-medium tracking-wide"
      >
        {saving
          ? 'Zapisuję...'
          : alreadyReviewedThisWeek
            ? 'Zapisz zmiany'
            : `Zapisz przegląd · +${XP_VALUES.weeklyReview} XP`}
      </button>
    </div>
  )
}

// ---------- Monthly form ----------

interface MonthlyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  logs: ReturnType<typeof useTimelineData>['logs']
  submitMonthlyReview: ReturnType<typeof useGameData>['submitMonthlyReview']
}

function MonthlyReviewForm({ user, stats, logs, submitMonthlyReview }: MonthlyFormProps) {
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

  const alreadyReviewed = (stats.reviewedMonths ?? []).includes(monthKey)

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
        disabled={saving}
        className="w-full bg-dark text-ivory font-sans text-sm py-4 rounded-2xl hover:bg-forest transition-colors disabled:opacity-60 font-medium tracking-wide"
      >
        {saving
          ? 'Zapisuję...'
          : alreadyReviewed
            ? 'Zapisz zmiany'
            : `Zamknij miesiąc · +${XP_VALUES.monthlyReview} XP`}
      </button>
    </div>
  )
}
