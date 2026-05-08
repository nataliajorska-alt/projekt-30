'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTimelineData } from '@/hooks/useTimelineData'
import { dateKey } from '@/lib/gameLogic'
import { Sparkles } from 'lucide-react'

const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']

interface Pattern {
  short: string    // krótki tekst dla pigułki dashboard
  detail: string   // doprecyzowanie pod spodem
}

// Wybiera najmocniejszy insight z 28 ostatnich dni.
// Zwraca null jeśli za mało danych (< 7 aktywnych dni).
function computePattern(logs: Record<string, { totalXP?: number }>): Pattern | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeDays: { date: Date; xp: number; weekday: number }[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const xp = logs[dateKey(d)]?.totalXP ?? 0
    if (xp > 0) activeDays.push({ date: d, xp, weekday: d.getDay() })
  }

  if (activeDays.length < 7) return null

  // 1. Najlepszy dzień tygodnia
  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of activeDays) {
    sums[d.weekday] += d.xp
    counts[d.weekday]++
  }
  const avgs = sums.map((s, i) => (counts[i] >= 2 ? s / counts[i] : 0))
  const bestIdx = avgs.indexOf(Math.max(...avgs))
  const bestAvg = Math.round(avgs[bestIdx])

  return {
    short: `Najlepszy dzień: ${WEEKDAYS[bestIdx]}`,
    detail: `śr. ${bestAvg} XP / 28 dni`,
  }
}

export default function PatternOfTheWeek() {
  const { logs, loading } = useTimelineData()
  const pattern = useMemo(() => computePattern(logs), [logs])

  if (loading || !pattern) return null

  return (
    <Link
      href="/timeline?tab=patterns"
      className="block bg-gold-pale/40 border border-gold/15 rounded-2xl px-3 py-3 hover:bg-gold-pale/70 transition-colors h-[68px]"
    >
      <div className="flex items-center gap-2.5 h-full">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
          <Sparkles size={14} strokeWidth={1.8} className="text-gold-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[9px] uppercase tracking-widest text-gold-dark truncate">
            Wzorzec
          </p>
          <p className="font-serif text-dark text-xs leading-tight truncate">
            {pattern.short}
          </p>
          <p className="font-sans text-[10px] text-muted truncate">
            {pattern.detail}
          </p>
        </div>
      </div>
    </Link>
  )
}
