'use client'
import CountdownHero from '@/components/CountdownHero'
import RoutineChecklist from '@/components/RoutineChecklist'
import AprilQuests from '@/components/AprilQuests'
import DailyQuests from '@/components/DailyQuests'
import SideQuestPicker from '@/components/SideQuestPicker'
import NegativeChecklist from '@/components/NegativeChecklist'
import DailyXPSummary from '@/components/DailyXPSummary'
import { useGameData } from '@/hooks/useGameData'
import { useEffect } from 'react'

export default function Dashboard() {
  const { loading, logDayStreak, todayLog } = useGameData()

  // Log the day for streak on first load if not yet done
  useEffect(() => {
    if (!loading && todayLog && todayLog.completedRoutine.length === 0 && todayLog.completedDailyQuests.length === 0) {
      // Don't auto-log until user does something — streak tracked on first action
    }
  }, [loading, todayLog])

  if (loading) return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted font-sans text-sm">Ładowanie twojego dnia...</p>
      </div>
    </div>
  )

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      {/* Date */}
      <div className="mb-5">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Dziś</p>
        <h1 className="font-serif text-dark text-2xl capitalize">{today}</h1>
      </div>

      <CountdownHero />
      <DailyXPSummary />
      <RoutineChecklist />
      <AprilQuests />
      <DailyQuests />
      <SideQuestPicker />
      <NegativeChecklist />
    </div>
  )
}
