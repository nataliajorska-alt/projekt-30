'use client'
import Link from 'next/link'
import { useGameData } from '@/hooks/useGameData'
import {
  getLevelFromXP,
  getGardenStage,
  getStageProgress,
} from '@/lib/gameLogic'

export default function MiniGardenWidget() {
  const { stats, loading } = useGameData()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant px-3 py-3 animate-pulse h-[68px]" />
    )
  }

  const totalXP = stats?.totalXP ?? 0
  const lvl = getLevelFromXP(totalXP)
  const stage = getGardenStage(lvl.level)
  const pct = getStageProgress(totalXP)

  return (
    <Link
      href="/progress"
      className="block bg-white rounded-2xl shadow-elegant px-3 py-3 hover:shadow-md transition-shadow h-[68px]"
      aria-label={`Poziom ${lvl.level}, ${stage.stageName}. Otwórz drzewko.`}
    >
      <div className="flex items-center gap-2.5 h-full">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xl"
          style={{ background: `${stage.accentColor}18` }}
        >
          {stage.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[9px] uppercase tracking-widest truncate" style={{ color: stage.accentColor }}>
            Drzewko · L{lvl.level}
          </p>
          <p className="font-serif text-dark text-xs leading-tight truncate mb-1">
            {stage.stageName}
          </p>
          <div className="relative h-1 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #B8963E 0%, #D4AF6B 100%)' }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
