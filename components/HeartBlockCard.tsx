'use client'
import Link from 'next/link'
import { useHeartBlock } from '@/hooks/useHeartBlock'
import { useGameData } from '@/hooks/useGameData'
import { XP_VALUES } from '@/lib/gameLogic'

export default function HeartBlockCard() {
  const { block, loading, weekKey } = useHeartBlock()
  const { stats } = useGameData()

  if (loading) return null

  const isComplete = !!block?.completedAt
  const xpAwarded = (stats.completedHeartBlocks ?? []).includes(weekKey)
  const hasContent =
    !!(block?.pain?.trim() ||
      block?.thoughts?.some(t => t.trim()) ||
      block?.steps?.some(s => s.trim()))
  const status: 'done' | 'started' | 'todo' = isComplete
    ? 'done'
    : hasContent
      ? 'started'
      : 'todo'

  const statusText: Record<typeof status, string> = {
    done: 'domknięte w tym tygodniu',
    started: 'w toku — wróć i dokończ',
    todo: 'w tym tygodniu jeszcze nieotwarte',
  }

  return (
    <Link
      href="/serce"
      className="grid grid-cols-[auto_1fr_auto] gap-4 items-center mt-4 mb-4 px-5 py-3.5 border border-hairline bg-cream/40 hover:border-gold transition-colors group"
    >
      {/* Bordered icon box */}
      <span className="w-9 h-9 flex items-center justify-center border border-hairline text-gold text-[13px] group-hover:border-gold transition-colors">
        ❦
      </span>

      {/* Title + sub */}
      <div className="min-w-0">
        <h4 className="font-display text-dark text-lg leading-none tracking-tight">
          Blok serca
        </h4>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-1 leading-snug">
          {statusText[status]}
        </p>
      </div>

      {/* Right column — weekKey + points */}
      <div className="text-right shrink-0">
        <div className="font-ui uppercase tracking-luxury text-[10px] text-muted whitespace-nowrap">
          {weekKey.replace('-W', ' — W')}
        </div>
        {!xpAwarded && (
          <div className="font-display italic text-gold-deep text-lg mt-1 whitespace-nowrap">
            <span className="mr-0.5">◆</span> +{XP_VALUES.heartBlock}
          </div>
        )}
      </div>
    </Link>
  )
}
