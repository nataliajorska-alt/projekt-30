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

interface WeeklyFormProps {
  user: ReturnType<typeof useAuth>['user']
  stats: ReturnType<typeof useGameData>['stats']
  submitWeeklyReview: ReturnType<typeof useGameData>['submitWeeklyReview']
  lastReview: WeeklyReview | null
}

export default function WeeklyReviewForm({ user, stats, submitWeeklyReview, lastReview }: WeeklyFormProps) {
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
