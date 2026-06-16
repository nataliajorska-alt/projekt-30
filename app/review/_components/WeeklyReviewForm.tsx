'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { Pillar } from '@/types'
import PillarRating from './PillarRating'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { doc, setDoc } from 'firebase/firestore'
import { XP_VALUES } from '@/lib/gameLogic'
import type { WeeklyReview } from '@/types'
import { formatWeekRange } from './shared'
import ContinuityBanner from './ContinuityBanner'
import { SmallCaps, GoldRule, Fleuron, Diamond } from '@/components/ui'

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
      const ref = doc(db, ...paths.reviewDoc(user.uid, weekStart))
      await setDoc(ref, {
        weekStart, highlights, challenges, nextWeekFocus: nextFocus,
        pillarsRated: ratings, xpEarned: XP_VALUES.weeklyReview,
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
      <div className="ritual-card p-10 text-center">
        <Fleuron size={20} className="text-gold mx-auto mb-4 inline-block" />
        <h2 className="font-display text-dark text-3xl leading-tight">Przegląd zapisany</h2>
        <GoldRule variant="diamond" tone="gold-deep" className="max-w-xs mx-auto my-5 opacity-50" />
        <p className="font-serif-body italic text-muted text-[14px] leading-relaxed">
          {xpGranted
            ? `+ ${XP_VALUES.weeklyReview} XP za refleksję. dobra robota.`
            : 'zaktualizowano. xp za ten tydzień masz już przyznane.'}
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

      <section className="ritual-card p-6 md:p-8">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Filary tygodnia
        </SmallCaps>
        <h2 className="font-heading text-dark text-xl mt-1">Oceń każdy</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1">
          puste = zaniedbany · pełne = zadbany.
        </p>
        <PillarRating ratings={ratings} onChange={(id, v) => setRatings(r => ({ ...r, [id]: v }))} />
      </section>

      <section className="ritual-card p-6 md:p-8 space-y-5">
        <div>
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Refleksja pisana
          </SmallCaps>
          <h2 className="font-heading text-dark text-xl mt-1">Trzy pytania</h2>
        </div>

        {[
          { value: highlights, set: setHighlights, label: 'Co w tym tygodniu działało?', placeholder: 'konkretne momenty, decyzje, działania…', rows: 3 },
          { value: challenges, set: setChallenges, label: 'Co było trudne lub nie wyszło?', placeholder: 'uczciwie. bez oceniania siebie za bardzo.', rows: 3 },
          { value: nextFocus,  set: setNextFocus,  label: 'Focus na następny tydzień',     placeholder: 'jedna, dwie rzeczy. nie lista piętnastu postanowień.', rows: 2 },
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

      <div title={!canSave ? 'Oceń przynajmniej jeden filar lub wypełnij jedno pole' : undefined}>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="w-full bg-dark-deep text-ivory border border-gold py-4 hover:bg-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="sm">
            {saving
              ? 'zapisuję…'
              : !canSave
                ? 'wypełnij przynajmniej jedno pole'
                : alreadyReviewedThisWeek
                  ? 'zapisz zmiany'
                  : `zapisz przegląd · + ${XP_VALUES.weeklyReview} XP`}
          </SmallCaps>
          <Diamond size={5} className="text-gold" />
        </button>
      </div>
    </div>
  )
}
