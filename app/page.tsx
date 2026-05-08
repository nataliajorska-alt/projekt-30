'use client'
import { useState, useEffect, useRef } from 'react'
import CountdownHero from '@/components/CountdownHero'
import RoutineChecklist from '@/components/RoutineChecklist'
import TomorrowChecklist from '@/components/TomorrowChecklist'
import DailyQuests from '@/components/DailyQuests'
import TomorrowQuests from '@/components/TomorrowQuests'
import SideQuestPicker from '@/components/SideQuestPicker'
import NegativeChecklist from '@/components/NegativeChecklist'
import HeartBlockCard from '@/components/HeartBlockCard'
import DailyXPSummary from '@/components/DailyXPSummary'
import MagnetismMeter from '@/components/MagnetismMeter'
import MoodCheckInModal from '@/components/MoodCheckInModal'
import KeyMomentCapture from '@/components/KeyMomentCapture'
import ReturnCeremony from '@/components/ReturnCeremony'
import DashboardNudges from '@/components/DashboardNudges'
import SafeHoursBanner from '@/components/SafeHoursBanner'
import CyclePhaseWidget from '@/components/CyclePhaseWidget'
import MiniGardenWidget from '@/components/MiniGardenWidget'
import PatternOfTheWeek from '@/components/PatternOfTheWeek'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SkeletonHero, SkeletonChecklist, SkeletonCard } from '@/components/SkeletonCard'
import { useGameData } from '@/hooks/useGameData'
import { todayKey, tomorrowDate } from '@/lib/gameLogic'
import type { MoodState } from '@/types'

// Probability of showing the check-in on any given app open (when < 4 check-ins today).
const CHECKIN_TRIGGER_PROBABILITY = 0.4

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000)
}

export default function Dashboard() {
  const { loading, todayLog, stats, saveMoodCheckIn, completeReturnCeremony } = useGameData()
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [daysMissed, setDaysMissed] = useState(0)
  const [viewingTomorrow, setViewingTomorrow] = useState(false)
  const evaluated = useRef(false)
  const returnEvaluated = useRef(false)

  // Once todayLog loads, decide randomly whether to show the check-in modal.
  // Uses sessionStorage to ensure we only evaluate once per page session.
  useEffect(() => {
    if (loading || !todayLog || evaluated.current) return
    evaluated.current = true

    const sessionKey = `moodCheckInShown_${todayKey()}`
    if (sessionStorage.getItem(sessionKey)) return

    sessionStorage.setItem(sessionKey, '1')

    const checkIns = todayLog.moodCheckIns ?? []
    if (checkIns.length >= 4) return

    // Don't show if last check-in was less than 3 hours ago
    const lastTs = checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp : null
    const COOLDOWN_MS = 3 * 60 * 60 * 1000
    if (lastTs && Date.now() - lastTs < COOLDOWN_MS) return

    if (Math.random() < CHECKIN_TRIGGER_PROBABILITY) {
      // Small delay so the dashboard renders first
      setTimeout(() => setShowMoodModal(true), 1200)
    }
  }, [loading, todayLog])

  // Detect gap > 2 days → show Return Ceremony (once per return)
  useEffect(() => {
    if (loading || returnEvaluated.current) return
    if (!stats.lastStreakDate || stats.totalDaysLogged === 0) return
    returnEvaluated.current = true

    const today = todayKey()
    if (stats.lastReturnCeremonyDate === today) return  // already shown today

    const gap = daysBetween(stats.lastStreakDate, today)
    if (gap > 2) {
      setDaysMissed(gap)
      setShowReturn(true)
    }
  }, [loading, stats])

  const handleMoodSave = async (data: { energy: number; mood: number; state: MoodState }) => {
    setShowMoodModal(false)
    await saveMoodCheckIn(data)
  }

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

  const todayLabel    = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
  const tomorrowLabel = tomorrowDate().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      {/* Date + switcher */}
      <div className="mb-5">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">
          {viewingTomorrow ? 'Jutro' : 'Dziś'}
        </p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-serif text-dark text-2xl capitalize">
            {viewingTomorrow ? tomorrowLabel : todayLabel}
          </h1>
          <div className="flex items-center gap-1 mb-0.5 flex-shrink-0">
            <button
              onClick={() => setViewingTomorrow(false)}
              className={`font-sans text-xs px-3 py-1.5 rounded-full transition-all ${
                !viewingTomorrow
                  ? 'bg-dark text-ivory'
                  : 'text-muted hover:text-dark border border-border'
              }`}
            >
              Dziś
            </button>
            <button
              onClick={() => setViewingTomorrow(true)}
              className={`font-sans text-xs px-3 py-1.5 rounded-full transition-all ${
                viewingTomorrow
                  ? 'bg-dark text-ivory'
                  : 'text-muted hover:text-dark border border-border'
              }`}
            >
              Jutro →
            </button>
          </div>
        </div>
      </div>

      <CountdownHero />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <ErrorBoundary label="Drzewko"><MiniGardenWidget /></ErrorBoundary>
        <ErrorBoundary label="Cykl"><CyclePhaseWidget /></ErrorBoundary>
        <ErrorBoundary label="Wzorzec tygodnia"><PatternOfTheWeek /></ErrorBoundary>
      </div>
      <ErrorBoundary label="Magnetyzm"><MagnetismMeter /></ErrorBoundary>
      <SafeHoursBanner />
      <DashboardNudges />
      <ErrorBoundary label="Podsumowanie XP"><DailyXPSummary /></ErrorBoundary>

      {viewingTomorrow ? (
        <>
          <ErrorBoundary label="Jutrzejsza rutyna"><TomorrowChecklist /></ErrorBoundary>
          <ErrorBoundary label="Jutrzejsze questy"><TomorrowQuests /></ErrorBoundary>
        </>
      ) : (
        <>
          <ErrorBoundary label="Rutyna"><RoutineChecklist /></ErrorBoundary>
          <ErrorBoundary label="Daily questy"><DailyQuests /></ErrorBoundary>
          <ErrorBoundary label="Side quest"><SideQuestPicker /></ErrorBoundary>
          <ErrorBoundary label="Moment dnia"><KeyMomentCapture /></ErrorBoundary>
          <ErrorBoundary label="Negative checklist"><NegativeChecklist /></ErrorBoundary>
          <ErrorBoundary label="Heart Block"><HeartBlockCard /></ErrorBoundary>
        </>
      )}

      {showMoodModal && (
        <MoodCheckInModal
          onSave={handleMoodSave}
          onDismiss={() => setShowMoodModal(false)}
        />
      )}

      {showReturn && (
        <ReturnCeremony
          daysMissed={daysMissed}
          onComplete={async () => { await completeReturnCeremony() }}
          onDismiss={() => setShowReturn(false)}
        />
      )}
    </div>
  )
}
