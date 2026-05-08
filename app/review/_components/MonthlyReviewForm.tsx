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
import { getMonthAggregate, getRoutineItemCounts, getCompletedSideQuestDates, getRuleKeptCounts, aggregateXpByMonth } from '@/lib/analytics'
import { MORNING_ROUTINE, EVENING_ROUTINE, DAILY_RULES, DAILY_HABITS, WEEKLY_HABITS } from '@/lib/routineData'
import { SIDE_QUESTS } from '@/lib/questData'
import { CheckCircle, Check, ChevronLeft, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import type { WeeklyReview, MonthlyReview } from '@/types'
import PillarTrendChart from '@/components/PillarTrendChart'
import clsx from 'clsx'
import { formatMonthPL, PL_MONTH_SHORT, formatWeekRange } from './shared'
import ContinuityBanner from './ContinuityBanner'

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
