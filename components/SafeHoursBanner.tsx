'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { useGameData } from '@/hooks/useGameData'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { getPhaseIdForDate } from '@/lib/cycle-data'
import { todayKey } from '@/lib/gameLogic'
import {
  analyzeSafeHours,
  getCurrentRiskWindow,
  isApproachingRiskWindow,
  formatWeeklyForecast,
} from '@/lib/safe-hours'
import type { SafeHoursWindow } from '@/types'
import { SmallCaps, Diamond } from '@/components/ui'

const ACTIVITY_SUGGESTIONS = [
  'Włącz playlistę i zrób coś fizycznego przez 20 minut.',
  'Napisz do kogoś, komu zależy — nie do niego.',
  'Wyjdź z pokoju. Dosłownie. Zmień otoczenie.',
  'Zaparzyć herbatę. Usiąść. Oddychać 5 minut.',
  'Otwórz Questy i zrób jeden szybki.',
]

function Frame({
  accentClass,
  children,
}: {
  accentClass: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative bg-ivory border border-gold-light/40 px-5 py-4 mb-4 ${accentClass}`}
    >
      {children}
    </div>
  )
}

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-muted-light hover:text-dark transition-colors flex-shrink-0"
      aria-label="Zamknij"
    >
      <X size={13} strokeWidth={1.5} />
    </button>
  )
}

export default function SafeHoursBanner() {
  const { entries } = useGhostV2()
  const { recordGhostImpulseV2 } = useGameData()
  const { logs: cycleLogs } = useCycleData()
  const { settings: cycleSettings } = useCycleSettings()
  const [windows, setWindows] = useState<SafeHoursWindow[]>([])
  const [activeWindow, setActiveWindow] = useState<SafeHoursWindow | null>(null)
  const [approachingWindow, setApproachingWindow] = useState<SafeHoursWindow | null>(null)
  const [mode, setMode] = useState<'idle' | 'plan' | 'suggestions' | 'confirmed'>('idle')
  const [dismissed, setDismissed] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)
  const [isSunday, setIsSunday] = useState(false)

  useEffect(() => {
    const analyzed = analyzeSafeHours(entries, cycleLogs, cycleSettings)
    setWindows(analyzed)
    const currentPhase = cycleLogs.length
      ? (getPhaseIdForDate(cycleLogs, todayKey(), cycleSettings) ?? undefined)
      : undefined
    setActiveWindow(getCurrentRiskWindow(analyzed, currentPhase))
    setApproachingWindow(isApproachingRiskWindow(analyzed, currentPhase))
    setIsSunday(new Date().getDay() === 0)
  }, [entries, cycleLogs, cycleSettings])

  const handleHavePlan = useCallback(async () => {
    setMode('confirmed')
    if (!xpGranted) {
      setXpGranted(true)
      await recordGhostImpulseV2(false)
    }
  }, [xpGranted, recordGhostImpulseV2])

  const suggestion = ACTIVITY_SUGGESTIONS[new Date().getMinutes() % ACTIVITY_SUGGESTIONS.length]

  if (dismissed || !windows.length) return null

  // ── Niedzielna prognoza ──
  if (isSunday && !activeWindow && !approachingWindow) {
    const forecast = formatWeeklyForecast(windows)
    return (
      <Frame accentClass="border-l-2 border-l-gold/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Prognoza tygodniowa
            </SmallCaps>
            <p className="font-heading text-dark text-[15px] leading-snug mt-1">
              W tym tygodniu Twoje trudne momenty:
            </p>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">
              {forecast}. przygotuj plany.
            </p>
          </div>
          <CloseBtn onClick={() => setDismissed(true)} />
        </div>
      </Frame>
    )
  }

  // ── Approaching ──
  if (approachingWindow && !activeWindow && mode === 'idle') {
    return (
      <Frame accentClass="border-l-2 border-l-gold/70">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Safe Hours
            </SmallCaps>
            <p className="font-heading text-dark text-[15px] leading-snug mt-1">
              Za pół godziny zaczyna się Twoja trudna pora.
            </p>
            <p className="font-serif-body italic text-muted text-[13px] mt-1">
              masz plan?
            </p>
          </div>
          <CloseBtn onClick={() => setDismissed(true)} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHavePlan}
            className="flex-1 py-2.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors flex items-center justify-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              mam plan · + 10 XP
            </SmallCaps>
          </button>
          <button
            onClick={() => setMode('suggestions')}
            className="flex-1 py-2.5 border border-hairline text-muted hover:border-gold hover:text-dark transition-colors"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              potrzebuję pomysłu
            </SmallCaps>
          </button>
        </div>
      </Frame>
    )
  }

  // ── Suggestions ──
  if (mode === 'suggestions') {
    return (
      <Frame accentClass="border-l-2 border-l-gold/70">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
          Safe Hours · plan
        </SmallCaps>
        <div className="space-y-2 mb-4">
          {ACTIVITY_SUGGESTIONS.slice(0, 3).map(s => (
            <div
              key={s}
              className="flex items-start gap-3 bg-cream/50 border border-hairline px-4 py-2.5"
            >
              <Diamond size={5} className="text-gold mt-1.5 shrink-0" />
              <p className="font-serif-body italic text-dark text-[13px] leading-relaxed">
                {s}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={handleHavePlan}
          className="w-full py-2.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors flex items-center justify-center gap-2"
        >
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            gotowe, mam plan · + 10 XP
          </SmallCaps>
        </button>
      </Frame>
    )
  }

  // ── Confirmed ──
  if (mode === 'confirmed') {
    return (
      <Frame accentClass="border-l-2 border-l-forest/60 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Diamond size={6} className="text-forest" filled />
            <div>
              <SmallCaps tone="dark" tracking="luxury" size="xs">
                <span className="text-forest">Safe Hours</span>
              </SmallCaps>
              <p className="font-serif-body italic text-dark text-[14px] mt-0.5">
                plan aktywowany · + 10 XP
              </p>
            </div>
          </div>
          <CloseBtn onClick={() => setDismissed(true)} />
        </div>
      </Frame>
    )
  }

  // ── Active window ──
  if (activeWindow) {
    return (
      <Frame accentClass="border-l-2 border-l-gold">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Safe Hours · aktywne
            </SmallCaps>
            <p className="font-heading text-dark text-[15px] leading-snug mt-1">
              Jesteś teraz w swoim trudnym oknie.
            </p>
            <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">
              {suggestion}
            </p>
          </div>
          <CloseBtn onClick={() => setDismissed(true)} />
        </div>
      </Frame>
    )
  }

  return null
}
