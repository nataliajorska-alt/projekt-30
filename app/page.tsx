'use client'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import CountdownHero from '@/components/CountdownHero'
import RoutineChecklist from '@/components/RoutineChecklist'
import TomorrowChecklist from '@/components/TomorrowChecklist'
import DailyQuests from '@/components/DailyQuests'
import TomorrowQuests from '@/components/TomorrowQuests'
import TomorrowBriefing from '@/components/TomorrowBriefing'
import SideQuestPicker from '@/components/SideQuestPicker'
import NegativeChecklist from '@/components/NegativeChecklist'
import HeartBlockCard from '@/components/HeartBlockCard'
import MostekCard from '@/components/MostekCard'
import CBTCard from '@/components/CBTCard'
import PozwolenieCard from '@/components/PozwolenieCard'
import DailyXPSummary from '@/components/DailyXPSummary'
import MagnetismMeter from '@/components/MagnetismMeter'
import MoodCheckInModal from '@/components/MoodCheckInModal'
import KeyMomentCapture from '@/components/KeyMomentCapture'
import ReturnCeremony from '@/components/ReturnCeremony'
import DashboardNudges from '@/components/DashboardNudges'
import DashboardInsight from '@/components/DashboardInsight'
import DashboardNow from '@/components/DashboardNow'
import SafeHoursBanner from '@/components/SafeHoursBanner'
import CyclePhaseWidget from '@/components/CyclePhaseWidget'
import MiniGardenWidget from '@/components/MiniGardenWidget'
import PatternOfTheWeek from '@/components/PatternOfTheWeek'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SkeletonHero, SkeletonChecklist, SkeletonCard } from '@/components/SkeletonCard'
import { useGameData } from '@/hooks/useGameData'
import {
  todayKey,
  tomorrowDate,
  getEffectiveNow,
  getDaysElapsed,
  MAX_MOOD_CHECKINS_PER_DAY,
} from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'
import { SmallCaps, Fleuron } from '@/components/ui'
import { ChevronDown } from 'lucide-react'
import type { MoodState } from '@/types'

// Dzień projektu liczony z getEffectiveNow() (granica doby o DAY_START_HOUR),
// żeby nagłówek nie przeskakiwał na nowy dzień o północy, gdy rutyna i questy
// są jeszcze w dniu poprzednim.
function dayOfProject(): number {
  return Math.max(1, getDaysElapsed() + 1)
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

// Sekcja z nagłówkiem, którą można zwinąć. Stan zwinięcia trzymamy w localStorage,
// żeby decyzja "schowaj orientację, chcę od razu ćwiczenie" trzymała się między porankami.
function CollapsibleSection({
  num,
  name,
  sub,
  storageKey,
  children,
}: {
  num: number
  name: string
  sub?: string
  storageKey: string
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(storageKey) === '1') setCollapsed(true)
  }, [storageKey])

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(storageKey, next ? '1' : '0')
      return next
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="group w-full mt-8 mb-4 flex items-baseline gap-4 pb-2.5 border-b border-hairline text-left"
      >
        <span className="font-display italic text-wine text-lg leading-none w-[22px] shrink-0">
          {toRoman(num)}
        </span>
        <div className="flex items-baseline gap-3 flex-wrap flex-1">
          <span className="font-ui uppercase tracking-[0.36em] text-[11px] text-dark">
            {name}
          </span>
          {sub && (
            <span className="font-serif-body italic text-muted text-[14px]">
              {collapsed ? 'zwinięte — dotknij, by pokazać' : sub}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`self-center shrink-0 text-muted group-hover:text-gold-deep transition-transform ${collapsed ? '-rotate-90' : ''}`}
        />
      </button>
      {!collapsed && children}
    </>
  )
}

// Okna proaktywnego pytania o nastrój. Deterministycznie (nie losowo): raz w
// oknie rannym, raz w wieczornym — żeby silnik wzorców miał parę ranek+wieczór,
// której potrzebują insighty o „lift / carryover". Środek dnia i noc: nie pytamy.
function moodWindow(d: Date): 'morning' | 'evening' | null {
  const h = d.getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 18 && h < 24) return 'evening'
  return null
}

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

  // Po załadowaniu logu: jeśli jesteśmy w oknie rannym/wieczornym i nie ma jeszcze
  // odczytu w tym oknie — zaczep raz o nastrój. Deterministycznie (nie losowo),
  // żeby para ranek+wieczór zbierała się niezawodnie dla silnika wzorców.
  useEffect(() => {
    if (loading || !todayLog || evaluated.current) return
    evaluated.current = true

    const win = moodWindow(new Date())
    if (!win) return  // środek dnia / noc — nie zaczepiamy

    // Raz na okno na dzień (osobno ranek i wieczór).
    const sessionKey = `moodCheckIn_${todayKey()}_${win}`
    if (sessionStorage.getItem(sessionKey)) return

    const checkIns = todayLog.moodCheckIns ?? []
    if (checkIns.length >= MAX_MOOD_CHECKINS_PER_DAY) return

    // Cooldown 3h od ostatniego odczytu.
    const lastTs = checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp : null
    const COOLDOWN_MS = 3 * 60 * 60 * 1000
    if (lastTs && Date.now() - lastTs < COOLDOWN_MS) return

    // Jeśli w tym oknie jest już dziś odczyt — nie pytaj ponownie.
    if (checkIns.some(c => moodWindow(new Date(c.timestamp)) === win)) return

    // Dopiero teraz oznacz okno jako zaczepione i pokaż (po krótkim renderze).
    sessionStorage.setItem(sessionKey, '1')
    setTimeout(() => setShowMoodModal(true), 1200)
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

  const todayLabel    = getEffectiveNow().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
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

      {/* Pasek „Teraz" — pojedyncza odpowiedź „co teraz zrobić" (tylko widok Dziś) */}
      {!viewingTomorrow && (
        <ErrorBoundary label="Teraz"><DashboardNow /></ErrorBoundary>
      )}

      {/* I — THE COUNTDOWN: today within the year */}
      <SectionLabel num={1} name="The Countdown" sub="punkt w roku" />
      <CountdownHero />

      {/* Wzorzec tygodnia — pokazuje się tylko gdy silnik insightów coś znalazł */}
      <ErrorBoundary label="Wzorzec tygodnia"><DashboardInsight /></ErrorBoundary>

      {/* II — THE GLANCE: orientation widgets (zwijane, by szybciej dojść do ćwiczenia) */}
      <CollapsibleSection num={2} name="The Glance" sub="stan rzeczy" storageKey="dash.collapse.glance">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <ErrorBoundary label="Drzewko"><MiniGardenWidget /></ErrorBoundary>
          <ErrorBoundary label="Cykl"><CyclePhaseWidget /></ErrorBoundary>
          <ErrorBoundary label="Wzorzec tygodnia"><PatternOfTheWeek /></ErrorBoundary>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 md:gap-8">
          <ErrorBoundary label="Magnetyzm"><MagnetismMeter /></ErrorBoundary>
          <ErrorBoundary label="Podsumowanie XP"><DailyXPSummary /></ErrorBoundary>
        </div>
      </CollapsibleSection>
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
          <ErrorBoundary label="Brief na jutro"><TomorrowBriefing /></ErrorBoundary>
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
          <ErrorBoundary label="Myśli i emocje"><CBTCard /></ErrorBoundary>
          <ErrorBoundary label="Mostek"><MostekCard /></ErrorBoundary>
          <ErrorBoundary label="Pozwolenie"><PozwolenieCard /></ErrorBoundary>
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
