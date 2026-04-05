'use client'
import { useGameData } from '@/hooks/useGameData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { Lock } from 'lucide-react'
import clsx from 'clsx'

export default function AchievementsPage() {
  const { stats } = useGameData()
  const unlocked = stats.unlockedAchievements ?? []
  const unlockedCount = unlocked.length

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Kolekcja</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Osiągnięcia</h1>
        <p className="font-sans text-sm text-muted">
          {unlockedCount} z {ACHIEVEMENTS.length} odblokowanych
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-sm text-dark">Postęp kolekcji</span>
          <span className="font-sans text-sm text-gold font-medium">
            {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-cream rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-700"
            style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {ACHIEVEMENTS.slice(0, 8).map(a => (
            <div
              key={a.id}
              className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all',
                unlocked.includes(a.id) ? 'bg-gold-pale' : 'bg-cream grayscale opacity-40'
              )}
              title={a.title}
            >
              {a.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Achievement list */}
      <div className="space-y-3">
        {/* Unlocked first */}
        {ACHIEVEMENTS.filter(a => unlocked.includes(a.id)).map(a => (
          <div key={a.id} className="bg-gold-pale rounded-2xl border border-gold/20 p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {a.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-dark text-base">{a.title}</h3>
                  <p className="font-sans text-xs text-muted mt-0.5">{a.description}</p>
                </div>
                <span className="font-sans text-xs text-gold font-medium flex-shrink-0">
                  +{a.xpReward} XP
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Locked */}
        {ACHIEVEMENTS.filter(a => !unlocked.includes(a.id)).map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-border p-5 flex items-start gap-4 opacity-60">
            <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-2xl flex-shrink-0 grayscale">
              {a.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Lock size={11} className="text-muted-light" strokeWidth={2} />
                    <h3 className="font-serif text-dark text-base">{a.title}</h3>
                  </div>
                  <p className="font-sans text-xs text-muted">{a.description}</p>
                </div>
                <span className="font-sans text-xs text-muted-light flex-shrink-0">
                  +{a.xpReward} XP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
