'use client'
import { getDaysRemaining, getDaysElapsed, getProjectProgress, getLevelFromXP, getNextLevel, getLevelProgress } from '@/lib/gameLogic'
import { useGameData } from '@/hooks/useGameData'
import { todayKey } from '@/lib/gameLogic'
import { getDailySpark } from '@/lib/questData'

export default function CountdownHero() {
  const { stats } = useGameData()
  const daysLeft = getDaysRemaining()
  const daysElapsed = getDaysElapsed()
  const projectProgress = getProjectProgress()
  const level = getLevelFromXP(stats.totalXP)
  const nextLevel = getNextLevel(stats.totalXP)
  const lvlProgress = getLevelProgress(stats.totalXP)
  const spark = getDailySpark(todayKey())

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

        {/* Spark */}
        <div className="bg-forest/50 rounded-xl px-4 py-3 border border-gold/20">
          <p className="text-xs font-sans text-gold-light/70 uppercase tracking-widest mb-1">Iskra dnia</p>
          <p className="font-serif text-sm text-ivory/90 leading-relaxed italic">&ldquo;{spark}&rdquo;</p>
        </div>
      </div>
    </div>
  )
}
