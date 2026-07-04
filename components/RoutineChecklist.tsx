'use client'
import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import {
  getTodayWeeklyHabits,
  getWeeklyStudyItem, getWeeklyStudyLabel,
  MORNING_SKINCARE_STEPS, EVENING_SKINCARE,
  MORNING_SUPPLEMENTS, EVENING_SUPPLEMENTS,
  MORNING_TEETH_STEPS,
} from '@/lib/routineData'
import { getEffectiveNow, DAY_START_HOUR } from '@/lib/gameLogic'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import { MINIMUM_DAY_REASONS } from '@/types'
import { BatteryLow, ChevronDown, Check } from 'lucide-react'
import MinimumDayModal from '@/components/MinimumDayModal'
import DeskTimer from '@/components/DeskTimer'
import { SmallCaps, RomanNumeral } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'
import type { MinimumDayReason, RoutineItem } from '@/types'

type Tab = 'morning' | 'daily' | 'evening'

const TABS: { id: Tab; label: string }[] = [
  { id: 'morning', label: 'Ranek' },
  { id: 'daily',   label: 'Dzień' },
  { id: 'evening', label: 'Wieczór' },
]

function getNextTab(current: Tab): Tab | null {
  const ids = TABS.map(t => t.id)
  const idx = ids.indexOf(current)
  return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null
}

function getDefaultTab(): Tab {
  const now = new Date()
  const h = now.getHours()
  // Po północy, ale przed startem nowego dnia (DAY_START_HOUR) — to wciąż ogon
  // poprzedniego dnia, więc otwórz wieczór, nie poranek.
  if (h < DAY_START_HOUR) return 'evening'
  const totalMinutes = h * 60 + now.getMinutes()
  if (totalMinutes >= 21 * 60 + 30) return 'evening'
  return 'morning'
}

/* ── Rotated-square check (matches design .check) ──────────────────── */
function CheckSquare({
  done,
  accent,
  bloom,
  onBloomEnd,
}: {
  done: boolean
  accent: 'gold' | 'forest'
  /** Jednorazowy „rozkwit" tuż po odhaczeniu (keyframe bloom zachowuje rotate-45). */
  bloom?: boolean
  onBloomEnd?: () => void
}) {
  return (
    <span
      onAnimationEnd={bloom ? onBloomEnd : undefined}
      className={clsx(
        'inline-block w-[14px] h-[14px] rotate-45 border shrink-0 transition-colors',
        accent === 'gold'
          ? done ? 'bg-gold border-gold' : 'border-gold/70'
          : done ? 'bg-forest border-forest' : 'border-forest/70',
        bloom && done && 'animate-bloom',
      )}
    />
  )
}

interface ItemRowProps {
  item: RoutineItem
  done: boolean
  isMinimum: boolean
  isOptional: boolean
  onToggle: () => void
  /** Optional inline element rendered between label and XP (e.g. timer pill). */
  inlineExtra?: React.ReactNode
  /** Gdy podane (i pozycja niezrobiona) — pokazuje przycisk „→ jutro". */
  onPostpone?: () => void
}

function ItemRow({ item, done, isMinimum, isOptional, onToggle, inlineExtra, onPostpone }: ItemRowProps) {
  const accent = isMinimum ? 'forest' : 'gold'
  const xp = isMinimum ? item.xp * 2 : item.xp
  const [bloom, setBloom] = useState(false)
  return (
    <div
      className={clsx(
        'flex items-center gap-3.5 py-2.5 transition-colors',
        'border-b border-border/60 last:border-b-0',
        isOptional && 'opacity-90',
      )}
    >
      <button
        onClick={() => {
          if (!done) setBloom(true)
          onToggle()
        }}
        role="checkbox"
        aria-checked={done}
        className="flex items-center gap-3.5 flex-1 min-w-0 text-left group hover:opacity-95"
      >
        <CheckSquare done={done} accent={accent} bloom={bloom} onBloomEnd={() => setBloom(false)} />
        <span
          className={clsx(
            'font-serif-body text-[15px] leading-snug flex-1',
            done ? 'text-muted-light italic' : isOptional ? 'text-muted' : 'text-dark',
          )}
        >
          {item.text}
        </span>
      </button>
      {item.href && (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Otwórz prowadzone ćwiczenia"
          aria-label="Otwórz prowadzone ćwiczenia"
          className="shrink-0 font-ui uppercase tracking-luxury text-[9px] text-forest hover:text-gold-deep border border-forest/40 hover:border-gold px-1.5 py-1 transition-colors"
        >
          ćwicz →
        </a>
      )}
      {inlineExtra}
      {onPostpone && !done && (
        <button
          onClick={onPostpone}
          title="Przenieś na jutro"
          aria-label="Przenieś na jutro"
          className="shrink-0 font-ui uppercase tracking-luxury text-[9px] text-muted-light hover:text-gold-deep border border-hairline hover:border-gold px-1.5 py-1 transition-colors"
        >
          → jutro
        </button>
      )}
      <span
        className={clsx(
          'font-ui uppercase tracking-luxury text-[10px] shrink-0',
          done ? 'text-muted-light' : 'text-gold-deep',
        )}
      >
        +{xp}
        {isMinimum && !done && <span className="ml-1.5 opacity-70">× II</span>}
      </span>
    </div>
  )
}

// Pojedynczy, odhaczany krok przewodnika. Klik przekreśla — pomocnicze
// „co już zrobione" na dziś, bez XP. Stan żyje w todayLog.checkedSubSteps.
function CheckableStep({
  stepKey, label, index, checked, onToggle,
}: {
  stepKey: string; label: string; index: number; checked: boolean; onToggle: (k: string) => void
}) {
  return (
    <li>
      <button
        onClick={() => onToggle(stepKey)}
        className="flex items-center gap-2.5 w-full text-left group py-0.5"
      >
        <span
          className={clsx(
            'w-4 h-4 shrink-0 border flex items-center justify-center transition-colors',
            checked ? 'bg-gold border-gold' : 'border-hairline group-hover:border-gold',
          )}
        >
          {checked
            ? <Check size={11} strokeWidth={2.5} className="text-ivory" />
            : <RomanNumeral value={index + 1} className="text-gold-deep text-[9px]" />}
        </span>
        <span
          className={clsx(
            'font-serif-body text-[13px] leading-snug transition-colors',
            checked ? 'text-muted-light line-through' : 'text-dark',
          )}
        >
          {label}
        </span>
      </button>
    </li>
  )
}

type GuideProps = {
  checkedSteps: string[]
  onToggleStep: (k: string) => void
}

function SkincareGuide({ itemId, dow, checkedSteps, onToggleStep }: GuideProps & { itemId: 'm7' | 'e2'; dow: number }) {
  const [open, setOpen] = useState(false)
  const isEvening = itemId === 'e2'
  const steps = isEvening ? (EVENING_SKINCARE[dow]?.steps ?? []) : MORNING_SKINCARE_STEPS
  const theme = isEvening ? EVENING_SKINCARE[dow]?.theme : undefined

  return (
    <div className="ml-[26px] -mt-1 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] font-serif-body italic text-forest/70 hover:text-gold-deep transition-colors py-0.5"
      >
        {theme && !open && (
          <span className="text-forest/70 italic font-serif-body text-[11px] normal-case tracking-normal">
            {theme}
          </span>
        )}
        {!theme && !open && <span>pokaż kroki</span>}
        {open && <span>ukryj</span>}
        <ChevronDown
          size={10}
          strokeWidth={1.5}
          className={clsx('transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ol className="mt-2 space-y-1 pb-1">
          {steps.map((step, i) => (
            <CheckableStep
              key={i}
              stepKey={`${itemId}-${i}`}
              label={step}
              index={i}
              checked={checkedSteps.includes(`${itemId}-${i}`)}
              onToggle={onToggleStep}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

function TeethGuide({ checkedSteps, onToggleStep }: GuideProps) {
  const [open, setOpen] = useState(false)
  const steps = MORNING_TEETH_STEPS

  return (
    <div className="ml-[26px] -mt-1 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] font-serif-body italic text-forest/70 hover:text-gold-deep transition-colors py-0.5"
      >
        {!open && <span>pokaż kroki</span>}
        {open && <span>ukryj</span>}
        <ChevronDown
          size={10}
          strokeWidth={1.5}
          className={clsx('transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ol className="mt-2 space-y-1 pb-1">
          {steps.map((step, i) => (
            <CheckableStep
              key={i}
              stepKey={`m8-${i}`}
              label={step}
              index={i}
              checked={checkedSteps.includes(`m8-${i}`)}
              onToggle={onToggleStep}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

function SupplementGuide({ itemId, dow, checkedSteps, onToggleStep }: GuideProps & { itemId: 'm9' | 'e7'; dow: number }) {
  const [open, setOpen] = useState(false)
  const isEvening = itemId === 'e7'
  const data = isEvening ? EVENING_SUPPLEMENTS : MORNING_SUPPLEMENTS[dow]
  const steps = data?.steps ?? []
  const theme = data?.theme
  const note = isEvening ? undefined : MORNING_SUPPLEMENTS[dow]?.note

  return (
    <div className="ml-[26px] -mt-1 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] font-serif-body italic text-forest/70 hover:text-gold-deep transition-colors py-0.5"
      >
        {theme && !open && (
          <span className="text-forest/70 italic font-serif-body text-[11px] normal-case tracking-normal">
            {theme}
          </span>
        )}
        {!theme && !open && <span>pokaż dawki</span>}
        {open && <span>ukryj</span>}
        <ChevronDown
          size={10}
          strokeWidth={1.5}
          className={clsx('transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <>
          <ol className="mt-2 space-y-1 pb-1">
            {steps.map((step, i) => (
              <CheckableStep
                key={i}
                stepKey={`${itemId}-${i}`}
                label={step}
                index={i}
                checked={checkedSteps.includes(`${itemId}-${i}`)}
                onToggle={onToggleStep}
              />
            ))}
          </ol>
          {note && (
            <p className="font-serif-body italic text-[12px] text-forest/80 leading-snug pl-7 pb-1">
              {note}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function RoutineChecklist() {
  const { todayLog, toggleRoutine, toggleSubStep, setDayMode, postponeRoutineToTomorrow } = useGameData()
  const checkedSubSteps = todayLog?.checkedSubSteps ?? []
  const { getEffectiveItems } = useRoutineConfig()
  const [tab, setTab] = useState<Tab>(getDefaultTab)
  const [showMinimumModal, setShowMinimumModal] = useState(false)
  const [showOptional, setShowOptional] = useState<Record<Tab, boolean>>({
    morning: false, daily: false, evening: false,
  })
  const prevProgressByTab = useRef<Partial<Record<Tab, number>>>({})
  const [sparks, setSparks] = useState(false)

  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'
  const minimumReason = todayLog?.minimumReason
  const reasonMeta = minimumReason ? MINIMUM_DAY_REASONS.find(r => r.value === minimumReason) : null

  const weeklyToday = getTodayWeeklyHabits()
  const studyItem = getWeeklyStudyItem()
  const studyLabel = getWeeklyStudyLabel()
  const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
  const dow = getEffectiveNow().getDay()
  const todayName = DAY_NAMES[dow]
  const isWeekday = dow >= 1 && dow <= 5

  const extraDaily = [...weeklyToday, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
  // Zadania dnia przeniesione Z dziś (chowamy z listy) i NA dziś (carried — dorenderujemy).
  const postponedAway = todayLog?.postponedRoutine ?? []
  const allDailyItems = (isWeekday
    ? getEffectiveItems('daily', false, extraDaily)
    : [...extraDaily, ...getEffectiveItems('daily', false).filter(i => i.id.startsWith('custom_'))]
  ).filter(i => !postponedAway.includes(i.id))
  // Przenosić można tylko zadania DNIA-SPECYFICZNE (tygodniowe + temat tygodnia),
  // nie codzienne d1/d2/d3 — te i tak wracają każdego dnia.
  const postponableIds = new Set<string>([...weeklyToday.map(i => i.id), studyItem.id])
  const carried = (todayLog?.carriedRoutine ?? []).filter(c => !allDailyItems.some(i => i.id === c.id))

  const getItemSplit = (catTab: Tab): { essential: RoutineItem[]; optional: RoutineItem[] } => {
    if (!isMinimum || !minimumReason) {
      if (catTab === 'morning') return { essential: getEffectiveItems('morning', false), optional: [] }
      if (catTab === 'evening') return { essential: getEffectiveItems('evening', false), optional: [] }
      return { essential: allDailyItems, optional: [] }
    }
    if (catTab === 'morning') {
      const full = getEffectiveItems('morning', false)
      const ess = filterItemsForMinimumDay(full, minimumReason)
      return { essential: ess, optional: full.filter(i => !ess.find(e => e.id === i.id)) }
    }
    if (catTab === 'evening') {
      const full = getEffectiveItems('evening', false)
      const ess = filterItemsForMinimumDay(full, minimumReason)
      return { essential: ess, optional: full.filter(i => !ess.find(e => e.id === i.id)) }
    }
    return { essential: [], optional: allDailyItems }
  }

  const { essential, optional } = getItemSplit(tab)
  const completedCount = essential.filter(i => todayLog?.completedRoutine?.includes(i.id)).length
  const progress = essential.length > 0 ? Math.round((completedCount / essential.length) * 100) : (isMinimum ? 100 : 0)

  useEffect(() => {
    const prev = prevProgressByTab.current[tab] ?? 0
    if (prev < 100 && progress === 100) {
      // Złote iskry na końcu paska — sparkle-float jest 'forwards', więc znikają same;
      // po 2 s zdejmujemy je z DOM (reduced-motion spłaszcza animację do 1 klatki).
      setSparks(true)
      const s = setTimeout(() => setSparks(false), 2000)
      const next = getNextTab(tab)
      if (next) {
        const t = setTimeout(() => setTab(next), 1500)
        return () => { clearTimeout(t); clearTimeout(s) }
      }
      return () => clearTimeout(s)
    }
    prevProgressByTab.current[tab] = progress
  }, [progress, tab])

  const handleMinimumConfirm = (reason: MinimumDayReason) => {
    setShowMinimumModal(false)
    setDayMode('minimum', reason)
  }

  const toggleOptional = (t: Tab) => setShowOptional(prev => ({ ...prev, [t]: !prev[t] }))

  const accentLine = isMinimum ? 'bg-forest' : 'bg-gold'
  const accentText = isMinimum ? 'text-forest' : 'text-gold'

  // Group base daily items vs weekly+study (only on daily tab, non-minimum)
  const isDailyTab = tab === 'daily' && !isMinimum
  const dailyBaseCount = isDailyTab ? getEffectiveItems('daily', false).length : 0

  return (
    <>
      {showMinimumModal && (
        <MinimumDayModal
          onConfirm={handleMinimumConfirm}
          onClose={() => setShowMinimumModal(false)}
        />
      )}

      <section className="mb-4 border-t border-b border-hairline/70 py-1">
        {/* Minimum banner */}
        {isMinimum && (
          <div className="bg-forest/8 border-b border-forest/20 px-1 py-2.5 flex items-center gap-3">
            <BatteryLow size={13} className="text-forest shrink-0" strokeWidth={1.5} />
            <p className="font-serif-body italic text-forest text-[13px] flex-1">
              {reasonMeta ? `${reasonMeta.label} — dasz radę.` : 'Tryb minimum aktywny — dasz radę.'}
            </p>
            <button
              onClick={() => setDayMode('normal')}
              className="font-ui uppercase tracking-luxury text-[10px] text-forest/70 hover:text-forest"
            >
              wróć
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-baseline justify-between gap-3 py-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="font-display text-dark text-2xl sm:text-[26px] leading-none tracking-tight whitespace-nowrap">
              Rutyna
            </h2>
            <span className="hidden sm:inline font-serif-body italic text-muted text-[13px]">
              today&apos;s practice
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!isMinimum && (
              <button
                onClick={() => setShowMinimumModal(true)}
                className="inline-flex items-center gap-1.5 border border-hairline px-3 py-1.5 transition-colors hover:border-gold"
                title="Włącz tryb minimum"
              >
                <span className="text-gold text-[10px] leading-none">◇</span>
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  Minimum
                </SmallCaps>
              </button>
            )}
            <span className="font-ui uppercase tracking-luxury text-[10px] text-muted">
              {toRoman(completedCount)} / {toRoman(essential.length)}
            </span>
          </div>
        </div>

        {/* Hairline progress */}
        <div className="relative h-px w-full bg-border/60 mb-1">
          <div
            className={clsx('absolute left-0 -top-px h-[3px] transition-all duration-500', accentLine)}
            style={{ width: `${progress}%` }}
          />
          {progress > 0 && progress < 100 && (
            <span
              className={clsx(
                'absolute top-1/2 w-[6px] h-[6px] rotate-45 transition-all duration-500',
                accentLine,
              )}
              style={{ left: `${progress}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}
            />
          )}
          {sparks && (
            <span aria-hidden className="absolute right-0 top-0 pointer-events-none">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className={clsx('absolute w-[5px] h-[5px] rotate-45 animate-sparkle-float', accentLine)}
                  style={{ right: `${i * 14}px`, top: '-2px', animationDelay: `${i * 160}ms` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Tabs — clean: Ranek / Dzień / Wieczór with gold underline */}
        <div className="flex border-b border-border/60">
          {TABS.map(({ id, label }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={clsx(
                  'flex-1 py-2.5 text-center relative font-ui uppercase tracking-[0.32em] text-[11px] transition-colors',
                  active ? 'text-dark' : 'text-muted hover:text-dark',
                )}
              >
                {label}
                {active && (
                  <span
                    className={clsx(
                      'absolute left-1/2 -bottom-px h-[2px] w-7 -translate-x-1/2',
                      accentLine,
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Items */}
        <div className="pt-3">
          {/* Zadania przeniesione NA dziś z innego dnia */}
          {isDailyTab && carried.length > 0 && (
            <div className="mb-3">
              <div className="font-ui uppercase tracking-[0.36em] text-[9px] text-gold-deep mb-1.5 mt-1">
                przeniesione na dziś
              </div>
              {carried.map(c => (
                <ItemRow
                  key={`carried-${c.id}`}
                  item={{ id: c.id, text: c.text, xp: c.xp, type: 'daily' }}
                  done={todayLog?.completedRoutine?.includes(c.id) ?? false}
                  isMinimum={isMinimum}
                  isOptional={false}
                  onToggle={() => toggleRoutine(c.id, c.xp)}
                />
              ))}
            </div>
          )}

          {/* Group label for daily tab on weekdays */}
          {isDailyTab && weeklyToday.length > 0 && (
            <div className="font-ui uppercase tracking-[0.36em] text-[9px] text-gold-deep mb-1.5 mt-1">
              Codzienne
            </div>
          )}

          {essential.map((item, idx) => {
            const isFirstWeekly =
              isDailyTab && weeklyToday.length > 0 && idx === dailyBaseCount
            const isStudyItem = isDailyTab && item.id === studyItem.id
            const done = todayLog?.completedRoutine?.includes(item.id) ?? false
            return (
              <div key={item.id}>
                {isFirstWeekly && (
                  <div className="font-ui uppercase tracking-[0.36em] text-[9px] text-gold-deep mt-4 mb-1.5">
                    {todayName}
                  </div>
                )}
                {isStudyItem && (
                  <div className="font-ui uppercase tracking-[0.36em] text-[9px] text-gold-deep mt-4 mb-1.5">
                    temat tygodnia · {studyLabel}
                  </div>
                )}
                <ItemRow
                  item={item}
                  done={done}
                  isMinimum={isMinimum}
                  isOptional={false}
                  onToggle={() => toggleRoutine(item.id, item.xp)}
                  onPostpone={
                    isDailyTab && postponableIds.has(item.id) && !done
                      ? () => postponeRoutineToTomorrow({ id: item.id, text: item.text, xp: item.xp })
                      : undefined
                  }
                  inlineExtra={
                    item.id === 'd1' ? (
                      <DeskTimer
                        done={done}
                        onComplete={() => toggleRoutine(item.id, item.xp)}
                      />
                    ) : undefined
                  }
                />
                {(item.id === 'm7' || item.id === 'e2') && (
                  <SkincareGuide
                    itemId={item.id as 'm7' | 'e2'}
                    dow={dow}
                    checkedSteps={checkedSubSteps}
                    onToggleStep={toggleSubStep}
                  />
                )}
                {item.id === 'm8' && (
                  <TeethGuide
                    checkedSteps={checkedSubSteps}
                    onToggleStep={toggleSubStep}
                  />
                )}
                {(item.id === 'm9' || item.id === 'e7') && (
                  <SupplementGuide
                    itemId={item.id as 'm9' | 'e7'}
                    dow={dow}
                    checkedSteps={checkedSubSteps}
                    onToggleStep={toggleSubStep}
                  />
                )}
              </div>
            )
          })}

          {/* Optional */}
          {optional.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border/60">
              <button
                onClick={() => toggleOptional(tab)}
                className="w-full flex items-center gap-2 py-1 text-left group"
              >
                <span className="flex-1 text-left font-ui uppercase tracking-luxury text-[10px] text-muted">
                  opcjonalnie ·{' '}
                  {optional.filter(i => todayLog?.completedRoutine?.includes(i.id)).length}
                  /{optional.length}
                </span>
                <ChevronDown
                  size={12}
                  strokeWidth={1.5}
                  className={clsx(
                    'text-muted-light transition-transform',
                    showOptional[tab] && 'rotate-180'
                  )}
                />
              </button>
              {showOptional[tab] && (
                <div className="mt-1">
                  {optional.map(item => {
                    const done = todayLog?.completedRoutine?.includes(item.id) ?? false
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        done={done}
                        isMinimum={isMinimum}
                        isOptional
                        onToggle={() => toggleRoutine(item.id, item.xp)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przeniesione na jutro — cicha informacja */}
        {isDailyTab && postponedAway.length > 0 && (
          <p className="text-center pt-3 font-serif-body italic text-muted-light text-[13px]">
            — przeniesione na jutro: {postponedAway.length} —
          </p>
        )}

        {/* Celebration */}
        {progress === 100 && (
          <div className="mt-4 border border-gold-light/30 px-5 py-3 text-center animate-slide-up">
            <svg
              viewBox="0 0 120 22"
              className={clsx('inline-block w-[110px] h-[20px]', accentText)}
              aria-hidden
            >
              {/* Dwie gałązki laurowe spotykające się na rombie — pathLength=1 + animate-draw */}
              <path
                d="M6,16 Q24,15 42,11 M13,15.5 Q11,11 7,9.5 M13,15.5 Q17,17.5 21,16.5 M23,14 Q21,9.5 17,8 M23,14 Q27,16 31,15 M33,12.5 Q31,8 27,6.5 M33,12.5 Q37,14.5 41,13.5"
                fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"
                pathLength={1} strokeDasharray="1" className="animate-draw"
              />
              <path
                d="M114,16 Q96,15 78,11 M107,15.5 Q109,11 113,9.5 M107,15.5 Q103,17.5 99,16.5 M97,14 Q99,9.5 103,8 M97,14 Q93,16 89,15 M87,12.5 Q89,8 93,6.5 M87,12.5 Q83,14.5 79,13.5"
                fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"
                pathLength={1} strokeDasharray="1" className="animate-draw"
              />
              <rect x="57" y="8" width="6" height="6" transform="rotate(45 60 11)" fill="currentColor" />
            </svg>
            <p
              className={clsx(
                'font-serif-body italic text-[14px] leading-snug mt-1',
                isMinimum ? 'text-forest' : 'text-gold-deep'
              )}
            >
              {isMinimum
                ? 'minimum zrobione. to wystarczy.'
                : 'rutyna ukończona — dzień w cichym porządku.'}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
