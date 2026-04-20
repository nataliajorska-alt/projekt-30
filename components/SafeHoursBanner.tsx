'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { useGameData } from '@/hooks/useGameData'
import { analyzeSafeHours, getCurrentRiskWindow, isApproachingRiskWindow, formatWeeklyForecast } from '@/lib/safe-hours'
import type { SafeHoursWindow } from '@/types'
import clsx from 'clsx'

const ACTIVITY_SUGGESTIONS = [
  'Włącz playlistę i zrób coś fizycznego przez 20 minut.',
  'Napisz do kogoś, komu zależy — nie do niego.',
  'Wyjdź z pokoju. Dosłownie. Zmień otoczenie.',
  'Zaparzyć herbatę. Usiąść. Oddychać 5 minut.',
  'Otwórz Questy i zrób jeden szybki.',
]

export default function SafeHoursBanner() {
  const { entries } = useGhostV2()
  const { stats, recordGhostImpulseV2 } = useGameData()
  const [windows, setWindows] = useState<SafeHoursWindow[]>([])
  const [activeWindow, setActiveWindow] = useState<SafeHoursWindow | null>(null)
  const [approachingWindow, setApproachingWindow] = useState<SafeHoursWindow | null>(null)
  const [mode, setMode] = useState<'idle' | 'plan' | 'suggestions' | 'confirmed'>('idle')
  const [dismissed, setDismissed] = useState(false)
  const [xpGranted, setXpGranted] = useState(false)
  const [isSunday, setIsSunday] = useState(false)

  useEffect(() => {
    const analyzed = analyzeSafeHours(entries)
    setWindows(analyzed)
    setActiveWindow(getCurrentRiskWindow(analyzed))
    setApproachingWindow(isApproachingRiskWindow(analyzed))
    setIsSunday(new Date().getDay() === 0)
  }, [entries])

  const handleHavePlan = useCallback(async () => {
    setMode('confirmed')
    if (!xpGranted) {
      setXpGranted(true)
      // +10 XP za gotowość (Safe Hours "mam plan")
      await recordGhostImpulseV2(false)
    }
  }, [xpGranted, recordGhostImpulseV2])

  const suggestion = ACTIVITY_SUGGESTIONS[new Date().getMinutes() % ACTIVITY_SUGGESTIONS.length]

  if (dismissed || !windows.length) return null

  // ── Niedzielna prognoza tygodniowa ───────────────────────────────────────────
  if (isSunday && !activeWindow && !approachingWindow) {
    const forecast = formatWeeklyForecast(windows)
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4 border-l-2 border-l-gold/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-sans text-[11px] text-gold/70 uppercase tracking-widest mb-1">
              Prognoza tygodniowa
            </p>
            <p className="font-serif text-dark text-sm leading-snug">
              W tym tygodniu Twoje trudne momenty:
            </p>
            <p className="font-sans text-muted text-xs mt-1 leading-relaxed">
              {forecast}. Przygotuj plany.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="font-sans text-[11px] text-muted-light hover:text-muted flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // ── Nadchodzi okno ryzyka (30 min ostrzeżenie) ───────────────────────────────
  if (approachingWindow && !activeWindow && mode === 'idle') {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4 border-l-2 border-l-gold/60">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <p className="font-sans text-[11px] text-gold/70 uppercase tracking-widest mb-1">
              Safe Hours
            </p>
            <p className="font-serif text-dark text-sm leading-snug">
              Za pół godziny zaczyna się Twoja trudna pora.
            </p>
            <p className="font-sans text-muted text-xs mt-1">Masz plan?</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="font-sans text-[11px] text-muted-light hover:text-muted flex-shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHavePlan}
            className="flex-1 py-2.5 rounded-xl bg-dark text-ivory font-sans text-xs hover:bg-forest transition-all"
          >
            Mam plan +10 XP
          </button>
          <button
            onClick={() => setMode('suggestions')}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted font-sans text-xs hover:border-dark hover:text-dark transition-all"
          >
            Potrzebuję pomysłu
          </button>
        </div>
      </div>
    )
  }

  // ── Potrzebuję pomysłu ───────────────────────────────────────────────────────
  if (mode === 'suggestions') {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4 border-l-2 border-l-gold/60">
        <p className="font-sans text-[11px] text-gold/70 uppercase tracking-widest mb-3">
          Safe Hours — plan
        </p>
        <div className="space-y-2 mb-4">
          {ACTIVITY_SUGGESTIONS.slice(0, 3).map(s => (
            <p key={s} className="font-sans text-xs text-muted bg-cream/60 rounded-xl px-4 py-2.5 leading-relaxed">
              {s}
            </p>
          ))}
        </div>
        <button
          onClick={handleHavePlan}
          className="w-full py-2.5 rounded-xl bg-dark text-ivory font-sans text-xs hover:bg-forest transition-all"
        >
          Gotowe, mam plan +10 XP
        </button>
      </div>
    )
  }

  // ── Potwierdzenie planu ──────────────────────────────────────────────────────
  if (mode === 'confirmed') {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4 border-l-2 border-l-forest/50 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[11px] text-forest/70 uppercase tracking-widest mb-1">Safe Hours</p>
            <p className="font-serif text-dark text-sm">Plan aktywowany. +10 XP ✦</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="font-sans text-[11px] text-muted-light hover:text-muted"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // ── Aktywne okno ryzyka (jesteś w nim teraz) ──────────────────────────────────
  if (activeWindow) {
    return (
      <div className={clsx(
        'bg-white rounded-2xl shadow-elegant p-5 mb-4 border-l-2 border-l-gold/80'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-sans text-[11px] text-gold/70 uppercase tracking-widest mb-1">
              Safe Hours — aktywne
            </p>
            <p className="font-serif text-dark text-sm leading-snug">
              Jesteś teraz w swoim trudnym oknie.
            </p>
            <p className="font-sans text-muted text-xs mt-1">
              {suggestion}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="font-sans text-[11px] text-muted-light hover:text-muted flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return null
}
