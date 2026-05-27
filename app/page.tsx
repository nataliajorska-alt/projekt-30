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
import { toRoman } from '@/lib/romanNumerals'
import { SmallCaps, Fleuron } from '@/components/ui'
import type { MoodState } from '@/types'

const PROJECT_START = '2026-04-05'

function dayOfProject(): number {
  const today = new Date()
  const [y, m, d] = PROJECT_START.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

function SectionLabel({ num, name, sub }: { num: number; name: string; sub?: string }) {
  return (
    <div className="mt-8 mb-4 flex items-baseline gap-4 pb-2.5 border-b border-hairline">
      <span className="font-display italic text-wine text-lg leading-none w-[22px] shrink-0">
        {toRoman(num)}
      </span>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-ui uppercase tracking-[0.36em] text-[11px] text-dark">
          {name}
        </span>
        {sub && (
          <span className="font-serif-body italic text-muted text-[14px]">
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

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

  const todayLabel    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const tomorrowLabel = tomorrowDate().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const day = dayOfProject()

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 md:pt-10 pb-12 md:pb-20 animate-fade-in">
      {/* Editorial date header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SmallCaps tone="muted" tracking="editorial" size="xs">
              {viewingTomorrow ? 'Jutro' : 'Dziś'}
            </SmallCaps>
            <h1 className="font-display text-dark text-[clamp(1.75rem,5vw,2.5rem)] leading-tight capitalize mt-1">
              {viewingTomorrow ? tomorrowLabel : todayLabel}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <SmallCaps tone="gold-deep" size="xs" tracking="luxury">
                  Day {toRoman(day)}
                </SmallCaps>
                <Fleuron size={10} className="text-gold-deep" />
              </span>
              <SmallCaps tone="muted" size="xs">
                the year of becoming
              </SmallCaps>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <button
              onClick={() => setViewingTomorrow(false)}
              className={`font-ui uppercase tracking-luxury text-[10px] px-3 py-1.5 transition-all border ${
                !viewingTomorrow
                  ? 'bg-dark text-ivory border-dark'
                  : 'text-muted hover:text-dark border-hairline hover:border-gold'
              }`}
            >
              Dziś
            </button>
            <button
              onClick={() => setViewingTomorrow(true)}
              className={`font-ui uppercase tracking-luxury text-[10px] px-3 py-1.5 transition-all border ${
                viewingTomorrow
                  ? 'bg-dark text-ivory border-dark'
                  : 'text-muted hover:text-dark border-hairline hover:border-gold'
              }`}
            >
              Jutro
            </button>
          </div>
        </div>
        {/* Ornament — ─ ∴ ─ */}
        <div className="mt-6 flex items-center gap-3.5">
          <span className="flex-1 h-px bg-hairline" />
          <span className="text-gold text-sm leading-none">∴</span>
          <span className="flex-1 h-px bg-hairline" />
        </div>
      </header>

      {/* I — THE COUNTDOWN: today within the year */}
      <SectionLabel num={1} name="The Countdown" sub="punkt w roku" />
      <CountdownHero />

      {/* II — THE GLANCE: orientation widgets */}
      <SectionLabel num={2} name="The Glance" sub="stan rzeczy" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <ErrorBoundary label="Drzewko"><MiniGardenWidget /></ErrorBoundary>
        <ErrorBoundary label="Cykl"><CyclePhaseWidget /></ErrorBoundary>
        <ErrorBoundary label="Wzorzec tygodnia"><PatternOfTheWeek /></ErrorBoundary>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 md:gap-8">
        <ErrorBoundary label="Magnetyzm"><MagnetismMeter /></ErrorBoundary>
        <ErrorBoundary label="Podsumowanie XP"><DailyXPSummary /></ErrorBoundary>
      </div>
      <SafeHoursBanner />
      <DashboardNudges />

      {/* III — TODAY'S PRACTICE: routine + quests */}
      <SectionLabel
        num={3}
        name={viewingTomorrow ? "Tomorrow's Practice" : "Today's Practice"}
        sub="ćwiczenie dnia"
      />
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

          {/* IV — THE MARGIN: reflection */}
          <SectionLabel num={4} name="The Margin" sub="na marginesie" />
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
