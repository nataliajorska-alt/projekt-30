'use client'
import Link from 'next/link'
import { useHeartBlock } from '@/hooks/useHeartBlock'
import { useGameData } from '@/hooks/useGameData'
import { XP_VALUES } from '@/lib/gameLogic'
import { Heart, ChevronRight, Check, Sparkles } from 'lucide-react'

export default function HeartBlockCard() {
  const { block, loading, weekKey } = useHeartBlock()
  const { stats } = useGameData()

  if (loading) return null

  const isComplete = !!block?.completedAt
  const xpAwarded = (stats.completedHeartBlocks ?? []).includes(weekKey)
  const hasContent = !!(block?.pain?.trim() || block?.thoughts?.some(t => t.trim()) || block?.steps?.some(s => s.trim()))
  const status = isComplete ? 'done' : hasContent ? 'started' : 'todo'

  const statusText: Record<typeof status, string> = {
    done: 'Domknięte w tym tygodniu',
    started: 'W toku — wróć i dokończ',
    todo: 'W tym tygodniu jeszcze nieotwarte',
  }

  return (
    <Link
      href="/serce"
      className="block bg-white rounded-2xl shadow-elegant p-4 mb-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold-pale flex items-center justify-center">
          {isComplete ? (
            <Check size={16} className="text-gold-dark" strokeWidth={2.5} />
          ) : (
            <Heart size={16} className="text-gold-dark" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-serif text-dark text-base">Blok serca</h3>
            <span className="font-sans text-[10px] text-muted uppercase tracking-wide">{weekKey}</span>
          </div>
          <p className="font-sans text-xs text-muted leading-snug">{statusText[status]}</p>
        </div>
        {!xpAwarded && (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans text-gold-dark bg-gold-pale border border-gold/15 px-2 py-0.5 rounded-full flex-shrink-0">
            <Sparkles size={9} /> +{XP_VALUES.heartBlock}
          </span>
        )}
        <ChevronRight size={16} className="text-muted-light flex-shrink-0" />
      </div>
    </Link>
  )
}
