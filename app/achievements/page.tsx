'use client'
import { useGameData } from '@/hooks/useGameData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { SkeletonAchievementGrid, SkeletonCard } from '@/components/SkeletonCard'
import { Lock } from 'lucide-react'
import clsx from 'clsx'

export default function AchievementsPage() {
  const { stats, loading } = useGameData()

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="mb-6">
        <div className="bg-cream h-3 w-20 rounded-full mb-2 animate-pulse" />
        <div className="bg-cream h-7 w-36 rounded-full mb-2 animate-pulse" />
        <div className="bg-cream h-3 w-28 rounded-full animate-pulse" />
      </div>
      <SkeletonCard className="mb-6 h-20" />
      <SkeletonAchievementGrid count={12} />
    </div>
  )
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
        {ACHIEVEMENTS.filter(a => !unlocked.includes(a.id)).map(a => {
          const prog = a.progress?.(stats)
          const pct = prog ? Math.round((prog.current / prog.target) * 100) : 0
          const isClose = prog && pct >= 50
          return (
            <div key={a.id} className={clsx(
              'bg-white rounded-2xl border p-5 flex items-start gap-4 transition-all',
              isClose ? 'border-gold/30 opacity-90' : 'border-border opacity-60'
            )}>
              <div className={clsx(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
                isClose ? 'bg-gold-pale' : 'bg-cream grayscale'
              )}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
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

                {/* Progress bar */}
                {prog && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans text-[11px] text-muted-light">
                        {prog.current.toLocaleString('pl-PL')} / {prog.target.toLocaleString('pl-PL')} {prog.label}
                      </span>
                      <span className={clsx(
                        'font-sans text-[11px] font-medium',
                        isClose ? 'text-gold' : 'text-muted-light'
                      )}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-700',
                          isClose ? 'bg-gold' : 'bg-parchment'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
