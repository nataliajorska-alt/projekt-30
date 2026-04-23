'use client'
import { getDaysRemaining, getDaysElapsed, getProjectProgress, getLevelFromXP, getNextLevel, getLevelProgress } from '@/lib/gameLogic'
import { useGameData } from '@/hooks/useGameData'
import { todayKey } from '@/lib/gameLogic'
import { getDailySpark } from '@/lib/questData'
import { getCurrentMonthData } from '@/lib/monthData'
import { useSparkSchedule } from '@/hooks/useSparkSchedule'

export default function CountdownHero() {
  const { stats, streakFreezeAvailable } = useGameData()
  const { sparks } = useSparkSchedule()
  const daysLeft = getDaysRemaining()
  const daysElapsed = getDaysElapsed()
  const projectProgress = getProjectProgress()
  const level = getLevelFromXP(stats.totalXP)
  const nextLevel = getNextLevel(stats.totalXP)
  const lvlProgress = getLevelProgress(stats.totalXP)
  const key = todayKey()
  const spark = sparks[key] || getDailySpark(key)
  const month = getCurrentMonthData()

  return (
    <div className="bg-dark rounded-2xl p-6 text-ivory mb-6 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)',
        }} />
      </div>

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-gold-light/70 font-sans text-xs uppercase tracking-widest mb-1">
              Dzień projektu
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl text-ivory">{daysElapsed}</span>
              <span className="text-muted-light font-sans text-sm">z 365</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gold-light/70 font-sans text-xs uppercase tracking-widest mb-1">
              Do urodzin
            </p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="font-serif text-4xl text-gold-light">{daysLeft}</span>
              <span className="text-muted-light font-sans text-sm">dni</span>
            </div>
          </div>
        </div>

        {/* Project progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-sans text-xs text-muted-light">Postęp projektu</span>
            <span className="font-sans text-xs text-gold-light">{projectProgress}%</span>
          </div>
          <div className="h-1.5 bg-forest rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient rounded-full transition-all duration-700"
              style={{ width: `${projectProgress}%` }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-forest/60 mb-5" />

        {/* Level */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gold font-sans text-xs uppercase tracking-widest">Poziom {level.level}</span>
              <span className="font-serif text-ivory text-sm">— {level.name}</span>
            </div>
            {nextLevel && (
              <span className="font-sans text-xs text-muted-light">
                → {nextLevel.name} ({lvlProgress}%)
              </span>
            )}
          </div>
          <div className="h-2 bg-forest rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${lvlProgress}%`,
                background: 'linear-gradient(90deg, #B8963E, #D4AF6B)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[11px] text-muted-light">{stats.totalXP.toLocaleString('pl-PL')} XP</span>
            {nextLevel && (
              <span className="font-sans text-[11px] text-muted-light">{nextLevel.xpRequired.toLocaleString('pl-PL')} XP</span>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="bg-forest/40 rounded-xl px-4 py-2.5 border border-gold/20 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-[10px] font-sans text-gold-light/70 uppercase tracking-widest">Seria</span>
          </div>
          <div className="flex items-center gap-3">
            {stats.currentStreak > 0 ? (
              <span className="font-serif text-ivory text-sm">
                <span className="text-gold-light">{stats.currentStreak}</span>
                <span className="text-muted-light text-xs ml-1">dni</span>
              </span>
            ) : (
              <span className="font-serif text-ivory/70 text-xs italic">Zacznij dziś</span>
            )}
            <span className="font-sans text-[11px] text-muted-light">
              Najlepsza: <span className="text-ivory/80">{stats.longestStreak}</span>
            </span>
            <span
              title={streakFreezeAvailable ? 'Zamrożenie dostępne w tym miesiącu' : 'Zamrożenie użyte w tym miesiącu'}
              className="text-base leading-none"
            >
              {streakFreezeAvailable ? '🛡️' : '🩶'}
            </span>
          </div>
        </div>

        {/* Monthly motto */}
        <div className="bg-gold/15 rounded-xl px-4 py-3 border border-gold/30 mb-3">
          <p className="text-[10px] font-sans text-gold uppercase tracking-widest mb-1">
            Hasło miesiąca · {month.name}
          </p>
          <p className="font-serif text-sm text-ivory leading-relaxed italic">&ldquo;{month.motto}&rdquo;</p>
        </div>

        {/* Spark */}
        <div className="bg-forest/50 rounded-xl px-4 py-3 border border-gold/20">
          <p className="text-xs font-sans text-gold-light/70 uppercase tracking-widest mb-1">Iskra dnia</p>
          <p className="font-serif text-sm text-ivory/90 leading-relaxed italic">&ldquo;{spark}&rdquo;</p>
        </div>
      </div>
    </div>
  )
}
