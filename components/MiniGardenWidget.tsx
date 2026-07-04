'use client'
import Link from 'next/link'
import { useGameData } from '@/hooks/useGameData'
import {
  getLevelFromXP,
  getGardenStage,
  getStageProgress,
} from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'
import GardenArt from '@/components/GardenArt'

export default function MiniGardenWidget() {
  const { stats, loading } = useGameData()

  if (loading) {
    return (
      <div className="border border-border/70 px-3 py-2 animate-pulse h-[44px]" />
    )
  }

  const totalXP = stats?.totalXP ?? 0
  const lvl = getLevelFromXP(totalXP)
  const stage = getGardenStage(lvl.level)
  const pct = getStageProgress(totalXP)
  const levelStage = Math.floor((lvl.level - 1) / 3)

  return (
    <Link
      href="/progress"
      className="flex items-center gap-2.5 border border-border/70 hover:border-gold px-3 py-2 transition-colors"
      aria-label={`Poziom ${lvl.level}, ${stage.stageName}. Otwórz drzewko.`}
    >
      <span className="flex-shrink-0 w-[30px] h-[30px] bg-cream-warm flex items-end justify-center overflow-hidden">
        <GardenArt levelStage={levelStage} viewBox="25 5 110 140" className="w-full h-full" />
      </span>
      <span className="flex-1 min-w-0 leading-tight">
        <span
          className="block font-ui uppercase tracking-[0.3em] text-[8px]"
          style={{ color: stage.accentColor }}
        >
          Tree · {toRoman(lvl.level)}
        </span>
        <span className="block font-display text-dark text-[13px] font-medium mt-0.5 truncate">
          {stage.stageName}
          <span className="ml-1.5 font-serif-body italic text-muted text-[11px]">
            {pct}%
          </span>
        </span>
      </span>
    </Link>
  )
}
