'use client'
import { useMemo } from 'react'
import {
  getDaysRemaining,
  getDaysElapsed,
  getProjectProgress,
  getLevelFromXP,
  getNextLevel,
  getLevelProgress,
  todayKey,
  PROJECT_START,
} from '@/lib/gameLogic'
import { useGameData } from '@/hooks/useGameData'
import { getDailySpark } from '@/lib/questData'
import { getCurrentMonthData } from '@/lib/seasonal/monthData'
import { useSparkSchedule } from '@/hooks/useSparkSchedule'
import { toRoman } from '@/lib/romanNumerals'

const PROJECT_TOTAL = 365

// Roman numerals I..XII for the year ring (project months 1..12 = April..March)
const MONTH_ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

// Skumulowane początki miesięcy projektu w dniach (kwi 2026 → mar 2027):
// 30+31+30+31+31+30+31+30+31+31+28+31 = 365.
const MONTH_STARTS = [0, 30, 61, 91, 122, 153, 183, 214, 244, 275, 306, 334]

// Geometria pierścienia roku (viewBox 240×240, środek 120).
const RING_C = 120

function pad3(n: number): string {
  return n < 1000 ? n.toString().padStart(3, '0') : n.toString()
}

/** Project month index 0..11 (April = 0, March 2027 = 11). Clamped to [0,11]. */
function currentProjectMonthIndex(): number {
  const now = new Date()
  const diff =
    (now.getFullYear() - PROJECT_START.getFullYear()) * 12 +
    (now.getMonth() - PROJECT_START.getMonth())
  return Math.max(0, Math.min(11, diff))
}

export default function CountdownHero() {
  const { stats } = useGameData()
  const { sparks } = useSparkSchedule()
  const daysLeft = getDaysRemaining()
  const daysElapsed = getDaysElapsed()
  const projectProgress = getProjectProgress()
  const level = getLevelFromXP(stats.totalXP)
  const nextLevel = getNextLevel(stats.totalXP)
  const lvlProgress = getLevelProgress(stats.totalXP)
  const key = todayKey()
  const spark = sparks[key] || getDailySpark(key)
  const month = getCurrentMonthData()
  const projectMonth = currentProjectMonthIndex()

  // 10-segment level bar: how many full + one partial
  const segments = 10
  const totalSegProgress = (lvlProgress / 100) * segments
  const fullSegs = Math.floor(totalSegProgress)
  const partialFrac = Math.min(1, Math.max(0, totalSegProgress - fullSegs))

  // Pierścień roku: 365 kresek jak grawer zegarka kieszonkowego — dni minione
  // w pełnym złocie, przyszłe wygaszone, granice miesięcy dłuższymi tikami.
  // Statyczny SVG (zero animacji), aria-hidden — treść niesie tekst w środku.
  const ring = useMemo(() => {
    const dayIdx = Math.min(PROJECT_TOTAL, Math.max(0, daysElapsed))
    const ticks: { x1: number; y1: number; x2: number; y2: number; w: number; o: number }[] = []
    const starts = new Set(MONTH_STARTS)
    for (let i = 0; i < PROJECT_TOTAL; i++) {
      const a = (i / PROJECT_TOTAL) * Math.PI * 2 - Math.PI / 2
      const isBoundary = starts.has(i)
      const done = i < dayIdx
      const r1 = isBoundary ? 90 : done ? 95 : 98
      const r2 = 103
      ticks.push({
        x1: RING_C + Math.cos(a) * r1,
        y1: RING_C + Math.sin(a) * r1,
        x2: RING_C + Math.cos(a) * r2,
        y2: RING_C + Math.sin(a) * r2,
        w: isBoundary ? 1.1 : 1,
        o: done ? 0.95 : isBoundary ? 0.5 : 0.22,
      })
    }
    const ma = ((Math.max(0.5, dayIdx - 0.5)) / PROJECT_TOTAL) * Math.PI * 2 - Math.PI / 2
    return {
      ticks,
      dayIdx,
      marker: { x: RING_C + Math.cos(ma) * 99, y: RING_C + Math.sin(ma) * 99 },
    }
  }, [daysElapsed])

  return (
    <div className="relative bg-dark text-ivory mb-6 border border-gold-light/30 grain-linen">
      {/* Corner brackets — only top-left + bottom-right */}
      <span className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l border-gold" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold" />

      <div className="relative px-6 py-5 sm:px-8 sm:py-6">
        {/* Year ring — 365 kresek wokół liczby dnia (tarcza zegarka kieszonkowego) */}
        <div className="relative w-[212px] h-[212px] sm:w-[232px] sm:h-[232px] mx-auto">
          <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full" aria-hidden>
            {ring.ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke="#B29355" strokeWidth={t.w} opacity={t.o}
              />
            ))}
            {/* Rzymskie numery miesięcy przy granicach */}
            {MONTH_ROMANS.map((roman, m) => {
              const start = MONTH_STARTS[m]
              const end = m < 11 ? MONTH_STARTS[m + 1] : PROJECT_TOTAL
              const a = (((start + end) / 2) / PROJECT_TOTAL) * Math.PI * 2 - Math.PI / 2
              return (
                <text
                  key={roman}
                  x={RING_C + Math.cos(a) * 112.5}
                  y={RING_C + Math.sin(a) * 112.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7.5"
                  letterSpacing="0.08em"
                  className="font-ui"
                  fill={m === projectMonth ? '#B29355' : '#E7DFD0'}
                  opacity={m === projectMonth ? 1 : 0.5}
                >
                  {roman}
                </text>
              )
            })}
            {/* Marker dnia — złoty romb z ciemnym rantem, jak dawny marker paska */}
            {ring.dayIdx > 0 && (
              <rect
                x={-3.2} y={-3.2} width={6.4} height={6.4}
                transform={`translate(${ring.marker.x} ${ring.marker.y}) rotate(45)`}
                fill="#B29355" stroke="#1D231F" strokeWidth={1.2}
              />
            )}
          </svg>

          {/* Centrum tarczy */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center gap-2.5">
              <span className="h-px w-4 bg-gold/50" />
              <span className="font-ui uppercase text-gold text-[10px] tracking-[0.42em]">
                Day {toRoman(daysElapsed)}
              </span>
              <span className="h-px w-4 bg-gold/50" />
            </div>
            <div className="font-display text-[42px] sm:text-[48px] leading-[0.9] text-gold-pale mt-1.5 tracking-tight">
              {pad3(daysElapsed)}
            </div>
            <div className="mt-1 inline-flex items-center gap-2 font-serif-body italic text-gold-light text-[11px]">
              <span className="h-px w-3 bg-gold/40" />
              of {toRoman(PROJECT_TOTAL)}
              <span className="h-px w-3 bg-gold/40" />
            </div>
          </div>
        </div>

        {/* Progress line — pod pierścieniem (w środku by się nie zmieściła) */}
        <div className="text-center font-ui uppercase tracking-[0.3em] text-[8px] text-parchment/80 mt-2">
          project progress{' '}
          <strong className="font-display italic text-gold text-[12px] tracking-normal normal-case">
            {projectProgress}%
          </strong>{' '}
          ·{' '}
          <strong className="font-display italic text-gold text-[12px] tracking-normal normal-case">
            {daysLeft}
          </strong>{' '}
          days remaining
        </div>

        {/* Level row */}
        <div className="mt-4 pt-3 border-t border-gold/15 flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <span className="font-ui uppercase tracking-[0.36em] text-[8px] text-gold">
              Level {toRoman(level.level)}
            </span>
            <span className="font-display text-gold-pale text-base sm:text-lg leading-none">
              {level.name}
            </span>
          </div>
          {nextLevel && (
            <span className="font-ui uppercase tracking-[0.3em] text-[8px] text-parchment/70 shrink-0">
              <strong className="text-gold-pale font-medium">{lvlProgress}%</strong> → Level{' '}
              {toRoman(level.level + 1)} · {nextLevel.name}
            </span>
          )}
        </div>

        {/* 10-segment level bar */}
        <div className="mt-2 h-[2px] flex gap-[2px]">
          {Array.from({ length: segments }).map((_, i) => {
            if (i < fullSegs) {
              return <span key={i} className="flex-1 bg-gold" />
            }
            if (i === fullSegs && partialFrac > 0) {
              return (
                <span key={i} className="flex-1 relative bg-gold/15 overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 bg-gold"
                    style={{ width: `${partialFrac * 100}%` }}
                  />
                </span>
              )
            }
            return <span key={i} className="flex-1 bg-gold/15" />
          })}
        </div>

        {/* XP row */}
        <div className="mt-1.5 flex justify-between font-ui uppercase tracking-[0.24em] text-[9px] text-parchment/70">
          <span>
            <strong className="text-gold-pale font-medium">
              {stats.totalXP.toLocaleString('pl-PL')}
            </strong>{' '}
            XP
          </span>
          {nextLevel && (
            <span>
              <strong className="text-gold-pale font-medium">
                {nextLevel.xpRequired.toLocaleString('pl-PL')}
              </strong>{' '}
              XP
            </span>
          )}
        </div>

        {/* Mantras — 3-col grid with center divider, collapses to 1-col on mobile */}
        <div className="mt-4 pt-3.5 border-t border-gold/20 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 items-start">
          {/* Hasło · month */}
          <div>
            <div className="font-ui uppercase tracking-[0.36em] text-[9px] text-gold mb-2.5">
              Hasło · {month.name}
            </div>
            <blockquote className="relative font-serif-body italic text-gold-pale text-[13.5px] leading-snug pl-3">
              <span className="absolute left-0 top-1.5 bottom-1.5 w-px bg-gold/60" />
              &ldquo;{month.motto}&rdquo;
            </blockquote>
          </div>

          {/* Center divider with ∴ */}
          <div className="hidden sm:block relative self-stretch w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent">
            <span
              className="absolute left-1/2 top-1/2 bg-dark text-gold text-sm leading-none px-0 py-1.5"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              ∴
            </span>
          </div>

          {/* Iskra dnia */}
          <div>
            <div className="font-ui uppercase tracking-[0.36em] text-[9px] text-gold mb-2.5">
              Iskra dnia
            </div>
            <blockquote className="relative font-serif-body italic text-parchment text-[13.5px] leading-snug pl-3">
              <span className="absolute left-0 top-1.5 bottom-1.5 w-px bg-gold/60" />
              &ldquo;{spark}&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
