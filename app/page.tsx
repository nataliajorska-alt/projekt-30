'use client'
import CountdownHero from '@/components/CountdownHero'
import RoutineChecklist from '@/components/RoutineChecklist'
import DailyQuests from '@/components/DailyQuests'
import SideQuestPicker from '@/components/SideQuestPicker'
import NegativeChecklist from '@/components/NegativeChecklist'
import DailyXPSummary from '@/components/DailyXPSummary'
import { SkeletonHero, SkeletonChecklist, SkeletonCard } from '@/components/SkeletonCard'
import { useGameData } from '@/hooks/useGameData'

export default function Dashboard() {
  const { loading } = useGameData()

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="mb-5">
        <div className="bg-cream h-3 w-16 rounded-full mb-2 animate-pulse" />
        <div className="bg-cream h-8 w-48 rounded-full animate-pulse" />
      </div>
      <SkeletonHero />
      <SkeletonCard className="mb-4 h-16" />
      <SkeletonChecklist rows={6} />
      <SkeletonChecklist rows={3} />
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
      <DailyQuests />
      <SideQuestPicker />
      <NegativeChecklist />
    </div>
  )
}
