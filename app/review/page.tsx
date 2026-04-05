'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { PILLARS } from '@/lib/pillars'
import { Pillar } from '@/types'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { getDaysElapsed, getDaysRemaining, XP_VALUES } from '@/lib/gameLogic'
import { CheckCircle } from 'lucide-react'
import clsx from 'clsx'

export default function ReviewPage() {
  const { user } = useAuth()
  const { stats } = useGameData()

  const [highlights, setHighlights] = useState('')
  const [challenges, setChallenges] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [ratings, setRatings] = useState<Record<Pillar, number>>({
    pozycja: 3, cialo: 3, styl: 3, kapital: 3, kariera: 3, tozsamosc: 3, milosc: 3,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const weekStart = (() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  })()

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
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Tygodniowy</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Przegląd & Korekta</h1>
        <p className="font-sans text-sm text-muted">
          Zatrzymaj się. Co naprawdę się dzieje?
        </p>
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

      {saved ? (
        <div className="bg-gold-pale rounded-2xl border border-gold/30 p-8 text-center">
          <CheckCircle size={40} className="text-gold mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="font-serif text-dark text-xl mb-2">Przegląd zapisany</h2>
          <p className="font-sans text-sm text-muted">+{XP_VALUES.weeklyReview} XP za refleksję. Dobra robota.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pillar ratings */}
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

          {/* Written reflection */}
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
            {saving ? 'Zapisuję...' : `Zapisz przegląd · +${XP_VALUES.weeklyReview} XP`}
          </button>
        </div>
      )}
    </div>
  )
}
