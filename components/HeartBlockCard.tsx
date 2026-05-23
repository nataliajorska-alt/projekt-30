'use client'
import Link from 'next/link'
import { useHeartBlock } from '@/hooks/useHeartBlock'
import { useGameData } from '@/hooks/useGameData'
import { XP_VALUES } from '@/lib/gameLogic'
import { ChevronRight } from 'lucide-react'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

export default function HeartBlockCard() {
  const { block, loading, weekKey } = useHeartBlock()
  const { stats } = useGameData()

  if (loading) return null

  const isComplete = !!block?.completedAt
  const xpAwarded = (stats.completedHeartBlocks ?? []).includes(weekKey)
  const hasContent = !!(block?.pain?.trim() || block?.thoughts?.some(t => t.trim()) || block?.steps?.some(s => s.trim()))
  const status = isComplete ? 'done' : hasContent ? 'started' : 'todo'

  const statusText: Record<typeof status, string> = {
    done: 'domknięte w tym tygodniu',
    started: 'w toku — wróć i dokończ',
    todo: 'w tym tygodniu jeszcze nieotwarte',
  }

  return (
    <Link
      href="/serce"
      className="block bg-ivory border border-gold-light/40 px-5 py-4 mb-4 hover:border-gold transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-11 h-11 border border-gold flex items-center justify-center">
          {isComplete ? (
            <Diamond size={10} filled className="text-gold" />
          ) : (
            <Fleuron size={16} className="text-gold-deep group-hover:text-gold transition-colors" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-0.5">
            <h3 className="font-heading text-dark text-lg leading-tight whitespace-nowrap">
              Blok serca
            </h3>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="whitespace-nowrap">
              {weekKey}
            </SmallCaps>
          </div>
          <p className="font-serif-body italic text-muted text-[13px] leading-snug">
            {statusText[status]}
          </p>
        </div>
        {!xpAwarded && (
          <div className="flex items-center gap-1.5 border border-gold-light/40 px-2.5 py-1 flex-shrink-0">
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              + {XP_VALUES.heartBlock}
            </SmallCaps>
          </div>
        )}
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          className="text-muted-light group-hover:text-gold transition-colors flex-shrink-0"
        />
      </div>
    </Link>
  )
}
