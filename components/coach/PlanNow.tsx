'use client'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useDayPlan } from '@/hooks/useDayPlan'
import { useCoachAvailability, useClock } from '@/hooks/useCoach'
import { todayKey, tomorrowKey, tomorrowDate, getEffectiveNow, DAY_START_HOUR } from '@/lib/gameLogic'
import {
  parsePlanBlocks, locateInPlan, planClockMinutes, formatClock, formatDuration,
  type PlanBlock, type PlanPosition,
} from '@/lib/dayPlan'
import { SmallCaps, Diamond } from '@/components/ui'
import Sheet from '@/components/Sheet'
import DayPlanner from './DayPlanner'
import { takeShortcut } from '@/lib/shortcuts'

// Plan dnia na ekranie „Dziś", tuż pod kartą dnia:
//  • jest plan na dziś → co trwa teraz (z paskiem upływu) i co potem; stuknięcie
//    otwiera całą oś dnia,
//  • nie ma planu → jedno stuknięcie do planu z asystentką (wieczorem: na jutro).
// Bez włączonej asystentki i bez planu — nic, ekran zostaje czysty.

const EVENING_HOUR = 19

function dayLabel(d: Date): string {
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function PlanNow() {
  const now = useClock(30_000)
  const today = todayKey()
  const { plan, loading } = useDayPlan(today)
  const { plan: tomorrowPlan } = useDayPlan(tomorrowKey())
  const availability = useCoachAvailability()
  const [sheet, setSheet] = useState<'today' | 'tomorrow' | null>(null)

  const blocks = useMemo(() => (plan ? parsePlanBlocks(plan.text) : []), [plan])
  const nowMin = planClockMinutes(now)
  const pos = locateInPlan(blocks, nowMin)
  const hour = now.getHours()
  const evening = hour >= EVENING_HOUR || hour < DAY_START_HOUR
  const canAsk = availability?.enabled === true

  // Skrót z ikony aplikacji „Plan dnia" (/?akcja=plan): wieczorem plan na jutro.
  useEffect(() => {
    if (!takeShortcut(['plan'])) return
    const h = new Date().getHours()
    setSheet(h >= EVENING_HOUR || h < DAY_START_HOUR ? 'tomorrow' : 'today')
  }, [])

  const sheetEl = sheet && (
    <Sheet
      eyebrow={sheet === 'today' ? 'Plan dnia' : 'Plan na jutro'}
      title={dayLabel(sheet === 'today' ? getEffectiveNow() : tomorrowDate())}
      onClose={() => setSheet(null)}
    >
      <DayPlanner variant={sheet} view="full" />
    </Sheet>
  )

  return (
    <>
      {!loading && (
        <PlanNowBody
          plan={!!plan}
          blocks={blocks}
          pos={pos}
          nowMin={nowMin}
          evening={evening}
          canAsk={canAsk}
          tomorrowReady={!!tomorrowPlan}
          open={setSheet}
        />
      )}
      {sheetEl}
    </>
  )
}

function PlanNowBody({
  plan, blocks, pos, nowMin, evening, canAsk, tomorrowReady, open,
}: {
  plan: boolean
  blocks: PlanBlock[]
  pos: PlanPosition
  nowMin: number
  evening: boolean
  canAsk: boolean
  tomorrowReady: boolean
  open: (variant: 'today' | 'tomorrow') => void
}): ReactNode {
  // ── Plan na dziś z godzinami, dzień jeszcze trwa ────────────────────
  const focus = pos.current ?? pos.next
  if (plan && focus) {
    const isNow = focus === pos.current
    const pct = isNow ? Math.min(100, Math.max(0, ((nowMin - focus.start) / Math.max(1, focus.end - focus.start)) * 100)) : 0
    const after = isNow ? pos.next : null
    return (
      <button
        onClick={() => open('today')}
        className="group w-full text-left block mb-5 border border-gold-light/60 bg-ivory hover:border-gold transition-colors"
        aria-label={`Plan dnia: ${isNow ? 'teraz' : 'następne'} ${focus.label}. Otwórz cały plan.`}
      >
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rotate-45 bg-gold ${isNow ? 'animate-pulse' : ''}`} />
            <SmallCaps tone="gold-deep" size="xs">{isNow ? 'teraz wg planu' : 'wg planu'}</SmallCaps>
            <span className="ml-auto font-ui tabular-nums text-[11px] text-muted">
              {formatClock(focus.start)}–{formatClock(focus.end)}
            </span>
          </div>
          <p className="font-display text-dark text-[19px] leading-snug mt-1.5 line-clamp-2">{focus.label}</p>
          {isNow ? (
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="relative flex-1 h-[3px] bg-hairline/70 overflow-hidden">
                <span className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </span>
              <span className="font-ui tabular-nums text-[10.5px] text-muted whitespace-nowrap">
                zostało {formatDuration(focus.end - nowMin)}
              </span>
            </div>
          ) : (
            <p className="font-serif-body italic text-muted text-[13.5px] mt-1">
              start za {formatDuration(focus.start - nowMin)} — chwila na wodę i oddech.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-hairline/70 bg-cream/40">
          {after ? (
            <p className="flex-1 min-w-0 font-serif-body text-[14px] text-dark truncate">
              <span className="font-ui uppercase tracking-luxury text-[9px] text-muted mr-2">potem</span>
              <span className="font-ui tabular-nums text-[11px] text-gold-deep mr-1.5">{formatClock(after.start)}</span>
              {after.label}
            </p>
          ) : (
            <p className="flex-1 font-serif-body italic text-[14px] text-muted">
              {isNow ? 'ostatni blok planu na dziś' : `${pos.passed} z ${blocks.length} bloków za Tobą`}
            </p>
          )}
          <span className="flex items-center gap-1 font-ui uppercase tracking-luxury text-[9px] text-gold-deep shrink-0">
            cały plan <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </button>
    )
  }

  // ── Plan na dziś bez godzin (asystentka nie trzymała formatu) ───────
  if (plan && blocks.length === 0) {
    return <PlanLink label="Plan na dziś gotowy" hint="otwórz i jedź po kolei" onClick={() => open('today')} />
  }

  // ── Dzień z planu za Tobą albo wieczór: kolej na jutro ──────────────
  if (plan || evening) {
    if (tomorrowReady) {
      return (
        <PlanLink
          label="Plan na jutro gotowy"
          hint={plan ? 'plan na dziś domknięty · jutro już rozpisane' : 'jutro już rozpisane — zajrzyj przed snem'}
          onClick={() => open('tomorrow')}
        />
      )
    }
    if (evening && canAsk) {
      return (
        <PlanCta
          label="Ułóż plan na jutro z asystentką"
          hint={plan ? 'plan na dziś domknięty — przygotuj jutro w minutę' : 'rutyna, questy i faza cyklu → jutro godzina po godzinie'}
          onClick={() => open('tomorrow')}
        />
      )
    }
    if (plan) {
      return <PlanLink label="Plan na dziś domknięty" hint={`${blocks.length} bloków za Tobą`} onClick={() => open('today')} />
    }
    return null
  }

  // ── Rano/w dzień bez planu ──────────────────────────────────────────
  if (!canAsk) return null
  return (
    <PlanCta
      label="Ułóż plan dnia z asystentką"
      hint="rutyna, questy i faza cyklu → plan godzina po godzinie"
      onClick={() => open('today')}
    />
  )
}

function PlanCta({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3.5 text-left mb-5 px-4 py-3.5 border border-dashed border-gold-light bg-gold-pale/25 hover:bg-gold-pale/50 transition-colors"
    >
      <span className="w-10 h-10 shrink-0 flex items-center justify-center bg-dark text-gold-light">
        <Sparkles size={17} strokeWidth={1.5} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-display text-dark text-[17px] leading-tight">{label}</span>
        <span className="block font-serif-body italic text-muted text-[13.5px] leading-snug mt-0.5">{hint}</span>
      </span>
      <ChevronRight size={16} className="text-gold-deep shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

function PlanLink({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3 text-left mb-5 px-4 py-3 border border-hairline bg-ivory hover:border-gold transition-colors"
    >
      <Diamond size={7} className="text-gold" />
      <span className="flex-1 min-w-0">
        <span className="block font-display text-dark text-[16px] leading-tight">{label}</span>
        <span className="block font-serif-body italic text-muted text-[13px] leading-snug mt-0.5">{hint}</span>
      </span>
      <ChevronRight size={15} className="text-gold-deep shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}
