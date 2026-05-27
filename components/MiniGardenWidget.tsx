'use client'
import Link from 'next/link'
import { useGameData } from '@/hooks/useGameData'
import {
  getLevelFromXP,
  getGardenStage,
  getStageProgress,
} from '@/lib/gameLogic'
import { Diamond, SmallCaps } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

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

  return (
    <Link
      href="/progress"
      className="flex items-center gap-2.5 border border-border/70 hover:border-gold px-3 py-2 transition-colors"
      aria-label={`Poziom ${lvl.level}, ${stage.stageName}. Otwórz drzewko.`}
    >
      <span
        className="flex-shrink-0 w-[26px] h-[26px] bg-cream flex items-center justify-center text-[13px]"
        style={{ color: stage.accentColor }}
      >
        {stage.emoji}
      </span>
      <span className="flex-1 min-w-0 leading-tight">
        <span
          className="block font-ui uppercase tracking-[0.3em] text-[8px]"
          style={{ color: stage.accentColor }}
        >
          Drzewko · {toRoman(lvl.level)}
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
