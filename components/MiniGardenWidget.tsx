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
      <div className="bg-ivory border border-gold-light/40 px-3 py-3 animate-pulse h-[68px]" />
    )
  }

  const totalXP = stats?.totalXP ?? 0
  const lvl = getLevelFromXP(totalXP)
  const stage = getGardenStage(lvl.level)
  const pct = getStageProgress(totalXP)

  return (
    <Link
      href="/progress"
      className="block bg-ivory border border-gold-light/40 hover:border-gold px-3 py-2.5 transition-colors h-[68px]"
      aria-label={`Poziom ${lvl.level}, ${stage.stageName}. Otwórz drzewko.`}
    >
      <div className="flex items-center gap-3 h-full">
        <div
          className="flex-shrink-0 w-9 h-9 border flex items-center justify-center text-base"
          style={{ borderColor: `${stage.accentColor}55` }}
        >
          {stage.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <SmallCaps tracking="luxury" size="xs">
            <span style={{ color: stage.accentColor }}>
              Drzewko · {toRoman(lvl.level)}
            </span>
          </SmallCaps>
          <p className="font-heading text-dark text-[13px] leading-tight truncate mt-0.5">
            {stage.stageName}
          </p>
          <div className="relative h-px w-full bg-hairline mt-1.5">
            <div
              className="absolute left-0 top-0 h-px transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: stage.accentColor }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
