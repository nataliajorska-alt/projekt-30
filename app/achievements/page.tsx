'use client'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { SkeletonAchievementGrid, SkeletonCard } from '@/components/SkeletonCard'
import { Lock } from 'lucide-react'
import type { Achievement, UserStats } from '@/types'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

// ── Micro-goal helper ────────────────────────────────────────────

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

// ── Cards ────────────────────────────────────────────────────────

function UnlockedCard({ a }: { a: Achievement }) {
  return (
    <div className="bg-ivory border border-gold p-5 flex items-start gap-4">
      <div className="w-14 h-14 border border-gold flex items-center justify-center text-2xl flex-shrink-0 relative">
        {a.icon}
        {a.hidden && (
          <span className="absolute -top-1.5 -right-1.5">
            <Diamond size={8} className="text-gold" filled />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {a.hidden && (
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                Ukryte osiągnięcie
              </SmallCaps>
            )}
            <h3 className="font-heading text-dark text-base leading-snug mt-0.5">
              {a.title}
            </h3>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">
              {a.description}
            </p>
          </div>
          <SmallCaps tone="gold" tracking="luxury" size="xs" className="shrink-0">
            + {a.xpReward} XP
          </SmallCaps>
        </div>
      </div>
    </div>
  )
}

function LockedCard({ a, stats }: { a: Achievement; stats: UserStats }) {
  if (a.hidden) {
    return (
      <div className="bg-ivory border border-hairline p-5 flex items-start gap-4 opacity-50">
        <div className="w-14 h-14 border border-hairline flex items-center justify-center flex-shrink-0">
          <Lock size={16} className="text-muted-light" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              Ukryte
            </SmallCaps>
          </div>
          <h3 className="font-heading text-muted text-base">???</h3>
          <p className="font-serif-body italic text-muted-light text-[13px] mt-1">
            ukryte osiągnięcie — odkryj je działając.
          </p>
        </div>
        <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0">
          ? XP
        </SmallCaps>
      </div>
    )
  }

  const prog = a.progress?.(stats)
  const pct = prog ? Math.round((prog.current / prog.target) * 100) : 0
  const isClose = prog && pct >= 50

  return (
    <div
      className={clsx(
        'bg-ivory border p-5 flex items-start gap-4 transition-all',
        isClose ? 'border-gold-light' : 'border-hairline opacity-70'
      )}
    >
      <div
        className={clsx(
          'w-14 h-14 border flex items-center justify-center text-2xl flex-shrink-0',
          isClose ? 'border-gold-light/60' : 'border-hairline grayscale'
        )}
      >
        {a.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Lock size={10} className="text-muted-light" strokeWidth={1.5} />
              <h3 className="font-heading text-dark text-base leading-snug">
                {a.title}
              </h3>
            </div>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">
              {a.description}
            </p>
          </div>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0">
            + {a.xpReward} XP
          </SmallCaps>
        </div>

        {prog && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                {prog.current.toLocaleString('pl-PL')} / {prog.target.toLocaleString('pl-PL')} {prog.label}
              </SmallCaps>
              <SmallCaps
                tracking="luxury"
                size="xs"
                tone={isClose ? 'gold' : 'muted'}
              >
                {pct}%
              </SmallCaps>
            </div>
            <div className="relative h-px w-full bg-hairline">
              <div
                className={clsx(
                  'absolute left-0 top-0 h-px transition-all duration-700',
                  isClose ? 'bg-gold' : 'bg-muted/30'
                )}
                style={{ width: `${pct}%` }}
              />
              {isClose && pct > 0 && pct < 100 && (
                <div
                  className="absolute -top-[3px] transition-all duration-700"
                  style={{ left: `calc(${pct}% - 4px)` }}
                >
                  <Diamond size={7} className="text-gold" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const { stats, loading } = useGameData()

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="mb-6">
        <div className="bg-cream h-3 w-20 mb-2 animate-pulse" />
        <div className="bg-cream h-7 w-36 mb-2 animate-pulse" />
        <div className="bg-cream h-3 w-28 animate-pulse" />
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
  const lockedList = ACHIEVEMENTS.filter(a => !unlocked.includes(a.id))
  const collectionPct = Math.round((unlockedCount / totalVisible) * 100)
  const hasHidden = ACHIEVEMENTS.some(a => a.hidden && !unlocked.includes(a.id))

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-8">
        <SmallCaps tone="muted" tracking="editorial" size="xs">
          Kolekcja · Vol. I
        </SmallCaps>
        <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
          Osiągnięcia
        </h1>
        <p className="font-serif-body italic text-muted text-[14px] mt-2">
          {toRoman(unlockedCount)} z {toRoman(totalVisible)} odkrytych
          {hasHidden && <span className="text-muted-light"> · kilka ukrytych czeka</span>}
        </p>
        <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />
      </header>

      {/* Micro-goal banner */}
      {microGoal && (
        <div className="relative bg-forest-deep grain-linen text-ivory border border-gold-light/40 p-5 mb-6">
          <div className="flex items-center gap-4">
            <Fleuron size={14} className="text-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                Micro-cel na horyzoncie
              </SmallCaps>
              <p className="font-serif-body italic text-ivory text-[14px] mt-1 leading-snug">
                za{' '}
                <span className="font-display text-gold text-lg not-italic">
                  {microGoal.daysLeft}
                </span>{' '}
                {microGoal.daysLeft === 1 ? 'dzień' : 'dni'} odblokujesz{' '}
                <span className="font-heading text-ivory not-italic">
                  {microGoal.achievement.title}
                </span>
              </p>
            </div>
            <SmallCaps tone="gold-light" tracking="luxury" size="xs" className="shrink-0">
              + {microGoal.achievement.xpReward} XP
            </SmallCaps>
          </div>
        </div>
      )}

      {/* Collection progress */}
      <section className="bg-ivory border border-gold-light/40 p-5 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
            Postęp kolekcji
          </SmallCaps>
          <span className="font-display text-2xl text-gold leading-none">
            {collectionPct}%
          </span>
        </div>
        <div className="relative h-px w-full bg-hairline">
          <div
            className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
            style={{ width: `${collectionPct}%` }}
          />
          {collectionPct > 0 && collectionPct < 100 && (
            <div
              className="absolute leading-none transition-all duration-700"
              style={{
                left: `${collectionPct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Diamond size={7} className="text-gold block" filled />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {ACHIEVEMENTS.filter(a => !a.hidden).slice(0, 8).map(a => (
            <div
              key={a.id}
              className={clsx(
                'w-10 h-10 border flex items-center justify-center text-lg transition-all',
                unlocked.includes(a.id) ? 'border-gold' : 'border-hairline grayscale opacity-40'
              )}
              title={a.title}
            >
              {a.icon}
            </div>
          ))}
        </div>
      </section>

      {/* Lists */}
      <div className="space-y-3">
        {unlockedList.map(a => <UnlockedCard key={a.id} a={a} />)}
        {lockedList.map(a => <LockedCard key={a.id} a={a} stats={stats} />)}
      </div>
    </div>
  )
}
