'use client'
import { useState, useEffect, useRef } from 'react'
import CountdownHero from '@/components/CountdownHero'
import RoutineChecklist from '@/components/RoutineChecklist'
import TomorrowChecklist from '@/components/TomorrowChecklist'
import DailyQuests from '@/components/DailyQuests'
import TomorrowQuests from '@/components/TomorrowQuests'
import TomorrowBriefing from '@/components/TomorrowBriefing'
import SideQuestPicker from '@/components/SideQuestPicker'
import NegativeChecklist from '@/components/NegativeChecklist'
import HeartBlockCard from '@/components/HeartBlockCard'
import PozwolenieCard from '@/components/PozwolenieCard'
import DailyXPSummary from '@/components/DailyXPSummary'
import MagnetismMeter from '@/components/MagnetismMeter'
import MoodCheckInModal from '@/components/MoodCheckInModal'
import KeyMomentCapture from '@/components/KeyMomentCapture'
import ReturnCeremony from '@/components/ReturnCeremony'
import DashboardNudges from '@/components/DashboardNudges'
import DashboardInsight, { selectTopSignal } from '@/components/DashboardInsight'
import DashboardNow from '@/components/DashboardNow'
import DailySeal from '@/components/DailySeal'
import QuickDock from '@/components/QuickDock'
import DayFlags from '@/components/DayFlags'
import PlanNow from '@/components/coach/PlanNow'
import SafeHoursBanner from '@/components/SafeHoursBanner'
import CyclePhaseWidget from '@/components/CyclePhaseWidget'
import MiniGardenWidget from '@/components/MiniGardenWidget'
import PatternOfTheWeek from '@/components/PatternOfTheWeek'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SkeletonHero, SkeletonChecklist, SkeletonCard } from '@/components/SkeletonCard'
import { useGameData } from '@/hooks/useGameData'
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight'
import {
  todayKey,
  tomorrowDate,
  getEffectiveNow,
  getDayOfProject,
  MAX_MOOD_CHECKINS_PER_DAY,
} from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'
import { SmallCaps, Fleuron } from '@/components/ui'
import type { MoodState } from '@/types'


// ── Trzy widoki ekranu „Dziś" ──────────────────────────────────────────
// Wcześniej wszystko leżało na jednej, bardzo długiej stronie: do pierwszej
// rzeczy do odhaczenia były dwa ekrany przewijania, a refleksja ginęła na dnie.
// Teraz: karta dnia + szybkie akcje u góry, a pod nimi jeden z trzech widoków.
type HomeTab = 'praktyka' | 'margines' | 'stan'

const HOME_TABS: { id: HomeTab; label: string; sub: string }[] = [
  { id: 'praktyka', label: 'Praktyka', sub: 'rutyna i questy' },
  { id: 'margines', label: 'Margines', sub: 'refleksja' },
  { id: 'stan',     label: 'Stan',     sub: 'rok i wzorce' },
]
const HOME_TAB_KEY = 'dash.tab'

function HomeTabs({ value, onChange }: { value: HomeTab; onChange: (t: HomeTab) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Widok dnia"
      // sticky: zakładki zostają pod ręką przy przewijaniu długiej listy.
      className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 px-4 md:-mx-10 md:px-10 mb-5 flex bg-ivory/95 backdrop-blur-sm border-b border-hairline"
    >
      {HOME_TABS.map(({ id, label, sub }, i) => {
        const active = value === id
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className="group relative flex-1 pt-3 pb-2.5 text-center"
          >
            <span className="flex items-baseline justify-center gap-2">
              <span className={`font-display italic text-[15px] leading-none ${active ? 'text-wine' : 'text-muted-light'}`}>
                {toRoman(i + 1)}
              </span>
              <span className={`font-ui uppercase tracking-[0.26em] text-[11px] transition-colors ${active ? 'text-dark' : 'text-muted group-hover:text-dark'}`}>
                {label}
              </span>
            </span>
            <span className={`block mt-1 font-serif-body italic text-[12.5px] leading-none transition-colors ${active ? 'text-gold-deep' : 'text-muted-light'}`}>
              {sub}
            </span>
            {active && <span className="absolute left-1/2 -bottom-px h-[2px] w-10 -translate-x-1/2 bg-gold" />}
          </button>
        )
      })}
    </div>
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
  const { loading, synced, todayLog, stats, saveMoodCheckIn, completeReturnCeremony } = useGameData()
  // Jedno wywołanie na dashboard — DashboardInsight dostaje dane propem,
  // a my tą samą regułą decydujemy, czy The Glance pokazuje fallbackowy
  // PatternOfTheWeek (tylko gdy silnik insightów nie ma nic do pokazania).
  const weeklyInsight = useWeeklyInsight()
  const insightVisible = !weeklyInsight.loading && !!selectTopSignal(weeklyInsight.insight)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [daysMissed, setDaysMissed] = useState(0)
  const [viewingTomorrow, setViewingTomorrow] = useState(false)
  // Ostatnio otwarty widok wraca po przejściu na inną stronę i z powrotem
  // (w obrębie sesji); nowe otwarcie apki zaczyna od Praktyki.
  const [tab, setTab] = useState<HomeTab>('praktyka')
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(HOME_TAB_KEY)
      if (saved === 'praktyka' || saved === 'margines' || saved === 'stan') setTab(saved)
    } catch { /* prywatne okno */ }
  }, [])
  const changeTab = (t: HomeTab) => {
    setTab(t)
    try { sessionStorage.setItem(HOME_TAB_KEY, t) } catch { /* prywatne okno */ }
  }
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
  // Czeka na statystyki potwierdzone przez serwer (synced): pamięć urządzenia
  // nieużywanego od kilku dni nie wie o odhaczeniach z drugiego — bez tego telefon
  // witałby ceremonią powrotu (+200 XP) kogoś, kto wczoraj był tu z laptopa.
  useEffect(() => {
    if (loading || !synced || returnEvaluated.current) return
    if (!stats.lastStreakDate || stats.totalDaysLogged === 0) return
    returnEvaluated.current = true

    const today = todayKey()
    if (stats.lastReturnCeremonyDate === today) return  // already shown today

    const gap = daysBetween(stats.lastStreakDate, today)
    if (gap > 2) {
      setDaysMissed(gap)
      setShowReturn(true)
    }
  }, [loading, synced, stats])

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

  // Liczony z getEffectiveNow() (granica doby o DAY_START_HOUR), żeby nagłówek
  // nie przeskakiwał na nowy dzień o północy, gdy rutyna i questy są jeszcze
  // w dniu poprzednim. Jutro = dzień o jeden dalej.
  const day = Math.min(365, getDayOfProject() + (viewingTomorrow ? 1 : 0))

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-6 md:pt-10 pb-12 md:pb-20 reveal-stagger">
      {/* Nagłówek: numer dnia i przełącznik w jednym wierszu, pod nimi data —
          na telefonie mieści się teraz w jednej linii zamiast łamać na dwie. */}
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SmallCaps tone="gold-deep" size="sm" tracking="luxury">
              Day {toRoman(day)}
            </SmallCaps>
            <Fleuron size={10} className="text-gold-deep shrink-0" />
            <SmallCaps tone="muted" size="xs" className="hidden sm:inline">
              the year of becoming
            </SmallCaps>
          </div>
          <div role="group" aria-label="Który dzień pokazać" className="flex shrink-0 border border-hairline">
            <button
              onClick={() => setViewingTomorrow(false)}
              aria-pressed={!viewingTomorrow}
              className={`font-ui uppercase tracking-luxury text-[10px] px-3.5 py-2 transition-colors ${
                !viewingTomorrow ? 'bg-dark text-ivory' : 'text-muted hover:text-dark'
              }`}
            >
              Dziś
            </button>
            <button
              onClick={() => setViewingTomorrow(true)}
              aria-pressed={viewingTomorrow}
              className={`font-ui uppercase tracking-luxury text-[10px] px-3.5 py-2 transition-colors ${
                viewingTomorrow ? 'bg-dark text-ivory' : 'text-muted hover:text-dark'
              }`}
            >
              Jutro
            </button>
          </div>
        </div>
        <h1 className="font-display text-dark text-[clamp(1.8rem,7.2vw,2.6rem)] leading-[1.08] capitalize mt-3">
          {viewingTomorrow ? tomorrowLabel : todayLabel}
        </h1>
      </header>

      {viewingTomorrow ? (
        <>
          <p className="mb-5 pb-3 border-b border-hairline font-serif-body italic text-muted text-[15px]">
            przygotuj jutro dziś — to, co odhaczysz „na zapas”, jutro będzie już czekać zrobione.
          </p>
          <ErrorBoundary label="Jutrzejsza rutyna"><TomorrowChecklist /></ErrorBoundary>
          <ErrorBoundary label="Jutrzejsze questy"><TomorrowQuests /></ErrorBoundary>
          <ErrorBoundary label="Brief na jutro"><TomorrowBriefing /></ErrorBoundary>
        </>
      ) : (
        <>
          {/* Dzień w jednym kadrze: pieczęć, karta „Teraz" z ogrodem, plan dnia, szybkie akcje. */}
          <ErrorBoundary label="Pieczęć dnia"><DailySeal /></ErrorBoundary>
          <ErrorBoundary label="Teraz"><DashboardNow /></ErrorBoundary>
          <ErrorBoundary label="Plan dnia"><PlanNow /></ErrorBoundary>
          <ErrorBoundary label="Szybkie akcje"><QuickDock /></ErrorBoundary>
          <ErrorBoundary label="Ruch i ludzie"><DayFlags /></ErrorBoundary>

          <SafeHoursBanner />
          <DashboardNudges />

          <HomeTabs value={tab} onChange={changeTab} />

          {/* I — PRAKTYKA: to, co się dziś robi */}
          {tab === 'praktyka' && (
            <>
              <ErrorBoundary label="Rutyna"><RoutineChecklist /></ErrorBoundary>
              <ErrorBoundary label="Daily questy"><DailyQuests /></ErrorBoundary>
              <ErrorBoundary label="Side quest"><SideQuestPicker /></ErrorBoundary>
            </>
          )}

          {/* II — MARGINES: to, nad czym się dziś zatrzymuje */}
          {tab === 'margines' && (
            <>
              <ErrorBoundary label="Moment dnia"><KeyMomentCapture /></ErrorBoundary>
              <ErrorBoundary label="Negative checklist"><NegativeChecklist /></ErrorBoundary>
              <ErrorBoundary label="Heart Block"><HeartBlockCard /></ErrorBoundary>
              <ErrorBoundary label="Pozwolenie"><PozwolenieCard /></ErrorBoundary>
              <ErrorBoundary label="Brief na dziś"><TomorrowBriefing variant="today" /></ErrorBoundary>
            </>
          )}

          {/* III — STAN: gdzie jestem w roku i co mówią wzorce */}
          {tab === 'stan' && (
            <>
              <CountdownHero />
              {/* Wzorzec tygodnia — pokazuje się tylko gdy silnik insightów coś znalazł */}
              <ErrorBoundary label="Wzorzec tygodnia"><DashboardInsight data={weeklyInsight} /></ErrorBoundary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5 mb-5">
                <ErrorBoundary label="Drzewko"><MiniGardenWidget /></ErrorBoundary>
                <ErrorBoundary label="Cykl"><CyclePhaseWidget /></ErrorBoundary>
                {/* Fallback: prosty „najlepszy dzień" tylko, gdy insight milczy —
                    dwa widgety wzorca naraz to był ten sam komunikat dwa razy. */}
                {!weeklyInsight.loading && !insightVisible && (
                  <ErrorBoundary label="Wzorzec tygodnia"><PatternOfTheWeek /></ErrorBoundary>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 md:gap-8">
                <ErrorBoundary label="Magnetyzm"><MagnetismMeter /></ErrorBoundary>
                <ErrorBoundary label="Podsumowanie XP"><DailyXPSummary /></ErrorBoundary>
              </div>
            </>
          )}
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
