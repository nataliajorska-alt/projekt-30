'use client'
import { useGameData } from '@/hooks/useGameData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { SkeletonAchievementGrid, SkeletonCard } from '@/components/SkeletonCard'
import { Lock, Target } from 'lucide-react'
import type { Achievement, UserStats } from '@/types'
import clsx from 'clsx'

// ── Micro-goal helper ────────────────────────────────────────────────────────
// Finds the closest streak-based achievement the user can unlock within 7 days.

function getMicroGoal(
  stats: UserStats,
  unlocked: string[],
): { achievement: Achievement; daysLeft: number } | null {
  const candidates = ACHIEVEMENTS
    .filter(a => a.streakBased && !unlocked.includes(a.id) && a.progress)
    .map(a => {
      const prog = a.progress!(stats)
      return { achievement: a, daysLeft: prog.target - prog.current }
    })
    .filter(c => c.daysLeft > 0 && c.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return candidates[0] ?? null
}

// ── Achievement card variants ────────────────────────────────────────────────

function UnlockedCard({ a }: { a: Achievement }) {
  return (
    <div className="bg-gold-pale rounded-2xl border border-gold/20 p-5 flex items-start gap-4">
      <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative">
        {a.icon}
        {a.hidden && (
          <span className="absolute -top-1.5 -right-1.5 text-sm leading-none">🎁</span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            {a.hidden && (
              <p className="font-sans text-[10px] text-gold uppercase tracking-widest mb-0.5">
                Ukryte osiągnięcie
              </p>
            )}
            <h3 className="font-serif text-dark text-base">{a.title}</h3>
            <p className="font-sans text-xs text-muted mt-0.5">{a.description}</p>
          </div>
          <span className="font-sans text-xs text-gold font-medium flex-shrink-0">
            +{a.xpReward} XP
          </span>
        </div>
      </div>
    </div>
  )
}

function LockedCard({ a, stats }: { a: Achievement; stats: UserStats }) {
  if (a.hidden) {
    // Mystery card — don't reveal anything
    return (
      <div className="bg-white rounded-2xl border border-border p-5 flex items-start gap-4 opacity-50">
        <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl grayscale">🔒</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={11} className="text-muted-light" strokeWidth={2} />
            <span className="font-serif text-dark text-base">???</span>
          </div>
          <p className="font-sans text-xs text-muted-light italic">
            Ukryte osiągnięcie — odkryj je działając.
          </p>
        </div>
        <span className="font-sans text-xs text-muted-light flex-shrink-0">? XP</span>
      </div>
    )
  }

  const prog = a.progress?.(stats)
  const pct = prog ? Math.round((prog.current / prog.target) * 100) : 0
  const isClose = prog && pct >= 50

  return (
    <div className={clsx(
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
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
  const totalVisible = ACHIEVEMENTS.filter(a => !a.hidden || unlocked.includes(a.id)).length
  const microGoal = getMicroGoal(stats, unlocked)

  const unlockedList = ACHIEVEMENTS.filter(a => unlocked.includes(a.id))
  const lockedList   = ACHIEVEMENTS.filter(a => !unlocked.includes(a.id))

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Kolekcja</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Osiągnięcia</h1>
        <p className="font-sans text-sm text-muted">
          {unlockedCount} z {totalVisible} odkrytych
          {ACHIEVEMENTS.some(a => a.hidden && !unlocked.includes(a.id)) && (
            <span className="text-muted-light"> · kilka ukrytych czeka</span>
          )}
        </p>
      </div>

      {/* Micro-goal banner */}
      {microGoal && (
        <div className="bg-forest/8 border border-forest/20 rounded-2xl p-4 mb-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-forest/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target size={18} className="text-forest" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[10px] text-forest uppercase tracking-widest mb-0.5">
              Micro-cel na horyzoncie
            </p>
            <p className="font-sans text-sm text-dark leading-snug">
              Za <span className="font-semibold text-forest">{microGoal.daysLeft} {microGoal.daysLeft === 1 ? 'dzień' : 'dni'}</span> odblokujesz{' '}
              <span className="font-serif">{microGoal.achievement.title}</span>
              {microGoal.achievement.hidden && <span className="text-muted-light"> 🎁</span>}
            </p>
          </div>
          <span className="font-sans text-xs text-forest/70 flex-shrink-0">
            +{microGoal.achievement.xpReward} XP
          </span>
        </div>
      )}

      {/* Collection progress */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-sm text-dark">Postęp kolekcji</span>
          <span className="font-sans text-sm text-gold font-medium">
            {Math.round((unlockedCount / totalVisible) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-cream rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-700"
            style={{ width: `${(unlockedCount / totalVisible) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {ACHIEVEMENTS.filter(a => !a.hidden).slice(0, 8).map(a => (
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
        {unlockedList.map(a => <UnlockedCard key={a.id} a={a} />)}
        {lockedList.map(a => <LockedCard key={a.id} a={a} stats={stats} />)}
      </div>
    </div>
  )
}
