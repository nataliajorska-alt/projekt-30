'use client'
import { useMemo, useRef, useState } from 'react'
import type { DailyLog } from '@/types'
import {
  dateKey,
  dayAngle,
  getEffectiveNow,
  PROJECT_START,
  TOTAL_DAYS,
  MONTH_STARTS,
  MONTH_ROMANS,
} from '@/lib/gameLogic'
import { HEAT, levelForXp, PAPER_SOFT } from '@/components/YearHeatmap'
import { SmallCaps } from '@/components/ui'
import DayReadout from '@/components/DayReadout'

interface Props {
  logs: Record<string, DailyLog>
  // interactive=false: wariant do druku (raport roczny) — bez tapania,
  // nakładki wyboru i kursora; zamiast wiersza księgi statyczna legenda.
  interactive?: boolean
}

const VB = 320          // viewBox (kwadrat)
const C = VB / 2        // środek tarczy
const R0 = 74           // promień bazowy (start kresek)
const LEN_BASE = 10     // długość kreski przy 0 XP
const LEN_STEP = 7      // przyrost na poziom heat (0..4 → 10..38)
const FUTURE_LEN = 5    // zapowiedź dnia, który dopiero przyjdzie

const MONTH_START_SET = new Set(MONTH_STARTS)

interface DayRay {
  idx: number
  key: string
  xp: number
  lvl: number
  moment?: string
}

// Jedno źródło wzoru długości promienia — używane przez pierścień,
// romby momentów, romb „dziś" i nakładkę wyboru.
function rayLen(ray: DayRay, todayIdx: number): number {
  return ray.idx > todayIdx ? FUTURE_LEN : LEN_BASE + ray.lvl * LEN_STEP
}

export default function YearRosette({ logs, interactive = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  // Trzymamy indeks, nie snapshot obiektu — żywa aktualizacja logs
  // (Firestore) ma być widoczna też w odczycie wybranego dnia.
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const rays = useMemo(() => {
    const rays: DayRay[] = []
    const d = new Date(PROJECT_START)
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const key = dateKey(d)
      const log = logs[key]
      const xp = log?.totalXP ?? 0
      rays.push({ idx: i, key, xp, lvl: levelForXp(xp), moment: log?.keyMoment?.title || undefined })
      d.setDate(d.getDate() + 1)
    }
    return rays
  }, [logs])

  // „Dziś" liczone per render z getEffectiveNow (granica dnia 3:00) i
  // dopasowane do promieni PO KLUCZU dnia, nie przez dzielenie milisekund —
  // ms-arytmetyka rozjeżdża się o godzinę po zmianie czasu (DST).
  const todayStr = dateKey(getEffectiveNow())
  const todayIdx = todayStr < rays[0].key
    ? -1
    : todayStr > rays[TOTAL_DAYS - 1].key
      ? TOTAL_DAYS - 1
      : rays.findIndex(r => r.key === todayStr)

  const activeDays = useMemo(
    () => rays.filter(r => r.xp > 0 && r.key <= todayStr).length,
    [rays, todayStr]
  )

  // Tap gdziekolwiek na tarczy → kąt wskazuje dzień. Przy 365 promieniach
  // pojedyncza kreska ma ~1px — celowanie palcem byłoby loterią, więc
  // cały pierścień jest jednym celem, a wybór liczy się z geometrii.
  // click (nie pointerdown): rozpoczęcie scrolla na tarczy nie może
  // przestawiać wyboru dnia.
  const pickDay = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VB - C
    const y = ((e.clientY - rect.top) / rect.height) * VB - C
    const r = Math.hypot(x, y)
    if (r < 40) return // środek to metryka, nie dni
    const a = Math.atan2(y, x)
    const norm = (a + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)
    const idx = Math.round((norm / (Math.PI * 2)) * TOTAL_DAYS) % TOTAL_DAYS
    setSelectedIdx(s => (s === idx ? null : idx))
  }

  // Statyczny pierścień (365 promieni + tiki + numery + momenty + dziś)
  // memoizowany osobno — tap zmienia tylko małą nakładkę wyboru, więc
  // nie ma po co rekonsyliować ~400 elementów SVG przy każdym dotknięciu.
  const ring = useMemo(() => (
    <g>
      {/* Pierścień bazowy — nić, z której wyrastają promienie */}
      <circle cx={C} cy={C} r={R0 - 1.5} fill="none" stroke="#826933" strokeWidth="0.6" opacity="0.35" strokeDasharray="1 2.6" />

      {/* Tiki granic miesięcy do wewnątrz od pierścienia */}
      {MONTH_STARTS.map(start => {
        const a = dayAngle(start)
        return (
          <line
            key={`m-${start}`}
            x1={C + Math.cos(a) * (R0 - 8)}
            y1={C + Math.sin(a) * (R0 - 8)}
            x2={C + Math.cos(a) * (R0 - 2.5)}
            y2={C + Math.sin(a) * (R0 - 2.5)}
            stroke="#826933" strokeWidth="1" opacity="0.5"
          />
        )
      })}

      {/* Rzymskie numery miesięcy na zewnątrz tarczy */}
      {MONTH_ROMANS.map((roman, m) => {
        const start = MONTH_STARTS[m]
        const end = m < 11 ? MONTH_STARTS[m + 1] : TOTAL_DAYS
        const a = dayAngle((start + end) / 2)
        return (
          <text
            key={roman}
            x={C + Math.cos(a) * 124}
            y={C + Math.sin(a) * 124}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8.5"
            letterSpacing="1"
            fill="#826933"
            opacity="0.6"
          >
            {roman}
          </text>
        )
      })}

      {/* 365 promieni */}
      {rays.map(ray => {
        const a = dayAngle(ray.idx)
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        const isFuture = ray.idx > todayIdx
        const len = rayLen(ray, todayIdx)
        const isBoundary = MONTH_START_SET.has(ray.idx)
        return (
          <line
            key={ray.idx}
            x1={C + cos * R0}
            y1={C + sin * R0}
            x2={C + cos * (R0 + len)}
            y2={C + sin * (R0 + len)}
            stroke={isFuture ? '#D9CDA8' : HEAT[ray.lvl]}
            strokeWidth={isFuture ? 0.8 : 1.1}
            opacity={isFuture ? (isBoundary ? 0.7 : 0.45) : 1}
            strokeLinecap="butt"
          />
        )
      })}

      {/* Kluczowe momenty — romby na koniuszkach promieni */}
      {rays.filter(r => r.moment && r.idx <= todayIdx).map(ray => {
        const a = dayAngle(ray.idx)
        const x = C + Math.cos(a) * (R0 + rayLen(ray, todayIdx) + 3.6)
        const y = C + Math.sin(a) * (R0 + rayLen(ray, todayIdx) + 3.6)
        return (
          <path
            key={`km-${ray.idx}`}
            d={`M${x},${y - 2.5} L${x + 2.5},${y} L${x},${y + 2.5} L${x - 2.5},${y} Z`}
            fill={PAPER_SOFT}
            stroke="#826933"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Dziś — romb w kolorze wine tuż za promieniem */}
      {todayIdx >= 0 && (() => {
        const ray = rays[todayIdx]
        const a = dayAngle(todayIdx)
        const len = rayLen(ray, todayIdx)
        const x = C + Math.cos(a) * (R0 + len + 4.2)
        const y = C + Math.sin(a) * (R0 + len + 4.2)
        return (
          <path
            d={`M${x},${y - 3} L${x + 3},${y} L${x},${y + 3} L${x - 3},${y} Z`}
            fill="#8a3a2c"
          />
        )
      })()}
    </g>
  ), [rays, todayIdx])

  const selected = selectedIdx !== null ? rays[selectedIdx] : null

  return (
    <div className="w-full">
      <div className="relative max-w-[340px] mx-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB} ${VB}`}
          className={interactive ? 'w-full h-auto cursor-pointer touch-manipulation' : 'w-full h-auto'}
          role="img"
          aria-label={
            interactive
              ? `Rozeta roku: 365 promieni, po jednym na każdy dzień projektu — długość i kolor oddają zebrane XP. Dotknij tarczy, by odczytać dzień; pełny kalendarz dzień po dniu znajduje się poniżej. Dni zapisanych: ${activeDays}.`
              : `Rozeta roku: 365 promieni, po jednym na każdy dzień projektu — długość i kolor oddają zebrane XP. Dni zapisanych: ${activeDays}.`
          }
          onClick={interactive ? pickDay : undefined}
        >
          {ring}

          {/* Wybrany dzień — nadrysowany promień z kropką */}
          {interactive && selected && (() => {
            const a = dayAngle(selected.idx)
            const cos = Math.cos(a)
            const sin = Math.sin(a)
            const len = rayLen(selected, todayIdx)
            return (
              <g>
                <line
                  x1={C + cos * (R0 - 1)}
                  y1={C + sin * (R0 - 1)}
                  x2={C + cos * (R0 + len + 1)}
                  y2={C + sin * (R0 + len + 1)}
                  stroke="#826933" strokeWidth="2" strokeLinecap="round"
                />
                <circle
                  cx={C + cos * (R0 + len + 5.5)}
                  cy={C + sin * (R0 + len + 5.5)}
                  r="2"
                  fill="#826933"
                />
              </g>
            )
          })()}
        </svg>

        {/* Metryka w sercu rozety */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-dark text-4xl leading-none">{activeDays}</span>
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1.5">
            dni zapisanych
          </SmallCaps>
        </div>
      </div>

      {interactive ? (
        /* Wiersz księgi — wspólny odczyt dnia (DayReadout) */
        <DayReadout
          day={selected ? { date: selected.key, xp: selected.xp, moment: selected.moment, future: selected.idx > todayIdx } : null}
          placeholder="dotknij tarczy, by odczytać dzień"
        />
      ) : (
        /* Wariant do druku — statyczna legenda skali (jak pod heatmapą) */
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-4 pt-3 border-t border-border/60">
          <SmallCaps tone="muted" tracking="luxury" size="xs">krótszy dzień</SmallCaps>
          {HEAT.map((c, i) => (
            <span key={i} className="w-3.5 h-3.5" style={{ backgroundColor: c }} />
          ))}
          <SmallCaps tone="muted" tracking="luxury" size="xs">pełniejszy</SmallCaps>
          <span className="inline-flex items-center gap-1.5 ml-2">
            <span
              aria-hidden
              className="w-[6px] h-[6px] rotate-45"
              style={{ backgroundColor: PAPER_SOFT, outline: '1px solid #826933' }}
            />
            <SmallCaps tone="muted" tracking="luxury" size="xs">kluczowy moment</SmallCaps>
          </span>
        </div>
      )}
    </div>
  )
}
