'use client'
import { useGameData } from '@/hooks/useGameData'
import { Zap } from 'lucide-react'

export default function DailyXPSummary() {
  const { todayLog, stats } = useGameData()
  const todayXP = todayLog?.totalXP ?? 0

  const breakdown = [
    { label: 'Rutyna', count: todayLog?.completedRoutine.length ?? 0, xp: (todayLog?.completedRoutine.length ?? 0) * 10 },
    { label: 'Questy', count: todayLog?.completedDailyQuests.length ?? 0, xp: (todayLog?.completedDailyQuests.length ?? 0) * 50 },
    { label: 'Side questy', count: todayLog?.completedSideQuests.length ?? 0, xp: (todayLog?.completedSideQuests.length ?? 0) * 120 },
    { label: 'Zasady', count: todayLog?.keptRules.length ?? 0, xp: (todayLog?.keptRules.length ?? 0) * 20 },
  ].filter(b => b.count > 0)

  return (
    <div className="bg-cream rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gold/20 rounded-full flex items-center justify-center">
          <Zap size={16} className="text-gold" strokeWidth={2} />
        </div>
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-wider">XP dziś</p>
          <p className="font-serif text-dark text-xl">+{todayXP.toLocaleString('pl-PL')}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-sans text-xs text-muted uppercase tracking-wider">XP łącznie</p>
        <p className="font-serif text-dark text-xl">{stats.totalXP.toLocaleString('pl-PL')}</p>
      </div>
    </div>
  )
}
