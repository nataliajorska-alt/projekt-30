'use client'
import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import {
  getTodayWeeklyHabits,
  getWeeklyStudyItem, getWeeklyStudyLabel,
  MORNING_SKINCARE_STEPS, EVENING_SKINCARE,
} from '@/lib/routineData'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import { MINIMUM_DAY_REASONS } from '@/types'
import { Sun, Moon, Sparkles, BatteryLow, ChevronDown } from 'lucide-react'
import MinimumDayModal from '@/components/MinimumDayModal'
import DeskTimer from '@/components/DeskTimer'
import {
  SmallCaps,
  Diamond,
  Fleuron,
  RomanNumeral,
} from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'
import type { MinimumDayReason, RoutineItem } from '@/types'

type Tab = 'morning' | 'daily' | 'evening'

function getNextTab(current: Tab, visible: typeof TABS): Tab | null {
  const ids = visible.map(t => t.id)
  const idx = ids.indexOf(current)
  return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null
}

const TABS: { id: Tab; label: string; icon: typeof Sun; roman: number }[] = [
  { id: 'morning', label: 'Ranek',   icon: Sun,       roman: 1 },
  { id: 'daily',   label: 'Dzień',   icon: Sparkles,  roman: 2 },
  { id: 'evening', label: 'Wieczór', icon: Moon,      roman: 3 },
]

function getDefaultTab(): Tab {
  const now = new Date()
  const totalMinutes = now.getHours() * 60 + now.getMinutes()
  if (totalMinutes >= 21 * 60 + 30) return 'evening'
  return 'morning'
}

interface ItemButtonProps {
  item: RoutineItem
  done: boolean
  isMinimum: boolean
  isOptional: boolean
  onToggle: () => void
}

function ItemButton({ item, done, isMinimum, isOptional, onToggle }: ItemButtonProps) {
  const accentColor = isMinimum ? 'text-forest' : 'text-gold'
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-3 text-left transition-all group',
        done
          ? isMinimum
            ? 'bg-forest/5'
            : 'bg-gold-pale/60'
          : isOptional
            ? 'hover:bg-cream/60'
            : 'hover:bg-cream'
      )}
    >
      <span
        className={clsx(
          'flex-shrink-0 transition-all',
          done
            ? accentColor
            : isOptional
              ? 'text-muted-light/60 group-hover:text-gold-light'
              : 'text-hairline group-hover:text-gold-light'
        )}
      >
        <Diamond size={10} filled={done} />
      </span>
      <p
        className={clsx(
          'font-serif-body text-[14.5px] leading-snug flex-1',
          done ? 'text-muted italic line-through decoration-1' : isOptional ? 'text-muted' : 'text-dark'
        )}
      >
        {item.text}
      </p>
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
        <SmallCaps
          tone={done ? (isMinimum ? 'dark' : 'gold') : 'muted'}
          tracking="luxury"
          size="xs"
        >
          + {isMinimum ? item.xp * 2 : item.xp}
        </SmallCaps>
        {isMinimum && !done && (
          <SmallCaps tone="muted" size="xs" className="opacity-70">
            × II
          </SmallCaps>
        )}
      </div>
    </button>
  )
}

function SkincareGuide({ itemId, dow }: { itemId: 'm7' | 'e2'; dow: number }) {
  const [open, setOpen] = useState(false)
  const isEvening = itemId === 'e2'
  const steps = isEvening ? (EVENING_SKINCARE[dow]?.steps ?? []) : MORNING_SKINCARE_STEPS
  const theme = isEvening ? EVENING_SKINCARE[dow]?.theme : undefined

  return (
    <div className="ml-9 -mt-0.5 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] font-ui uppercase tracking-luxury text-muted-light hover:text-gold-deep transition-colors py-0.5"
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
        <ol className="mt-2 space-y-1.5 pb-1">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2">
              <RomanNumeral
                value={i + 1}
                className="text-gold-deep text-[11px] w-5 shrink-0 text-center"
              />
              <span className="font-serif-body text-[13px] text-dark leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function RoutineChecklist() {
  const { todayLog, toggleRoutine, setDayMode } = useGameData()
  const { getEffectiveItems } = useRoutineConfig()
  const [tab, setTab] = useState<Tab>(getDefaultTab)
  const [showMinimumModal, setShowMinimumModal] = useState(false)
  const [showOptional, setShowOptional] = useState<Record<Tab, boolean>>({
    morning: false, daily: false, evening: false,
  })
  const prevProgressByTab = useRef<Partial<Record<Tab, number>>>({})

  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'
  const minimumReason = todayLog?.minimumReason
  const reasonMeta = minimumReason ? MINIMUM_DAY_REASONS.find(r => r.value === minimumReason) : null

  const weeklyToday = getTodayWeeklyHabits()
  const studyItem = getWeeklyStudyItem()
  const studyLabel = getWeeklyStudyLabel()
  const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
  const dow = new Date().getDay()
  const todayName = DAY_NAMES[dow]
  const isWeekday = dow >= 1 && dow <= 5

  const extraDaily = [...weeklyToday, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
  const allDailyItems = isWeekday
    ? getEffectiveItems('daily', false, extraDaily)
    : [...extraDaily, ...getEffectiveItems('daily', false).filter(i => i.id.startsWith('custom_'))]

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
      const next = getNextTab(tab, TABS)
      if (next) {
        const t = setTimeout(() => setTab(next), 1500)
        return () => clearTimeout(t)
      }
    }
    prevProgressByTab.current[tab] = progress
  }, [progress, tab])

  const handleMinimumConfirm = (reason: MinimumDayReason) => {
    setShowMinimumModal(false)
    setDayMode('minimum', reason)
  }

  const toggleOptional = (t: Tab) => setShowOptional(prev => ({ ...prev, [t]: !prev[t] }))

  const accentLine = isMinimum ? 'bg-forest' : 'bg-gold'

  return (
    <>
      {showMinimumModal && (
        <MinimumDayModal
          onConfirm={handleMinimumConfirm}
          onClose={() => setShowMinimumModal(false)}
        />
      )}

      <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-4">
        {/* Minimum banner */}
        {isMinimum && (
          <div className="bg-forest/8 border-b border-forest/20 px-5 py-3 flex items-center gap-3">
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
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <h2 className="font-heading text-dark text-xl whitespace-nowrap">Rutyna</h2>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="hidden sm:inline">
                today's practice
              </SmallCaps>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!isMinimum && (
                <button
                  onClick={() => setShowMinimumModal(true)}
                  className="flex items-center gap-1.5 border border-hairline px-3 py-1 transition-colors hover:border-gold"
                  title="Włącz tryb minimum"
                >
                  <BatteryLow size={10} strokeWidth={1.5} className="text-muted" />
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    minimum
                  </SmallCaps>
                </button>
              )}
              <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
                {toRoman(completedCount)} / {toRoman(essential.length)}
              </SmallCaps>
            </div>
          </div>

          {/* Hairline progress with diamond head */}
          <div className="relative mt-2 h-px w-full bg-hairline">
            <div
              className={clsx('absolute left-0 top-0 h-px transition-all duration-500', accentLine)}
              style={{ width: `${progress}%` }}
            />
            {progress > 0 && progress < 100 && (
              <div
                className="absolute leading-none transition-all duration-500"
                style={{
                  left: `${progress}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Diamond
                  size={7}
                  filled
                  className={clsx('block', isMinimum ? 'text-forest' : 'text-gold')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabs — editorial */}
        <div className="flex border-t border-hairline mt-2">
          {TABS.map(({ id, label, roman }) => {
            const active = tab === id
            const activeColor = isMinimum ? 'text-forest' : 'text-gold'
            const activeLine = isMinimum ? 'bg-forest' : 'bg-gold'
            return (
              <button
                key={id}
                onClick={() => setTab(id as Tab)}
                className="flex-1 group flex flex-col items-center gap-1.5 py-3 transition-colors"
              >
                <span className="flex items-baseline gap-2">
                  <RomanNumeral
                    value={roman}
                    className={clsx(
                      'text-sm transition-colors',
                      active ? activeColor : 'text-muted-light group-hover:text-gold-light'
                    )}
                  />
                  <SmallCaps
                    tone={active ? (isMinimum ? 'dark' : 'gold') : 'muted'}
                    tracking="luxury"
                    size="sm"
                    className={clsx('transition-colors', !active && 'group-hover:text-gold-deep')}
                  >
                    {label}
                  </SmallCaps>
                  {isMinimum && id !== 'daily' && (
                    <SmallCaps tone="muted" size="xs" className="opacity-50">
                      min
                    </SmallCaps>
                  )}
                </span>
                <span
                  className={clsx(
                    'h-px w-10 transition-colors',
                    active ? activeLine : 'bg-transparent'
                  )}
                />
              </button>
            )
          })}
        </div>

        {/* Items */}
        <div className="px-3 py-3 space-y-1">
          {tab === 'daily' && !isMinimum && isWeekday && weeklyToday.length > 0 && (
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-1">
              codzienne
            </SmallCaps>
          )}

          {essential.map((item, idx) => {
            const isFirstWeekly =
              tab === 'daily' && !isMinimum && weeklyToday.length > 0 &&
              idx === getEffectiveItems('daily', false).length
            const isStudyItem = tab === 'daily' && item.id === studyItem.id
            const done = todayLog?.completedRoutine?.includes(item.id) ?? false
            return (
              <div key={item.id}>
                {isFirstWeekly && (
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-3">
                    {todayName}
                  </SmallCaps>
                )}
                {isStudyItem && (
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-3">
                    temat tygodnia · {studyLabel}
                  </SmallCaps>
                )}
                <ItemButton
                  item={item}
                  done={done}
                  isMinimum={isMinimum}
                  isOptional={false}
                  onToggle={() => toggleRoutine(item.id, item.xp)}
                />
                {(item.id === 'm7' || item.id === 'e2') && (
                  <SkincareGuide itemId={item.id as 'm7' | 'e2'} dow={dow} />
                )}
                {item.id === 'd1' && (
                  <DeskTimer
                    done={done}
                    onComplete={() => toggleRoutine(item.id, item.xp)}
                  />
                )}
              </div>
            )
          })}

          {/* Optional */}
          {optional.length > 0 && (
            <div className="pt-2 border-t border-hairline mt-3">
              <button
                onClick={() => toggleOptional(tab)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left group"
              >
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="flex-1 text-left">
                  opcjonalnie · {optional.filter(i => todayLog?.completedRoutine?.includes(i.id)).length}
                  /{optional.length}
                </SmallCaps>
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
                <div className="space-y-1 mt-1">
                  {optional.map(item => {
                    const done = todayLog?.completedRoutine?.includes(item.id) ?? false
                    return (
                      <ItemButton
                        key={item.id}
                        item={item}
                        done={done}
                        isMinimum={isMinimum}
                        isOptional={true}
                        onToggle={() => toggleRoutine(item.id, item.xp)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Celebration */}
        {progress === 100 && (
          <div className="mx-5 mb-5 border border-gold-light/30 px-5 py-3 text-center">
            <Fleuron
              size={10}
              className={clsx('inline-block mb-1', isMinimum ? 'text-forest' : 'text-gold')}
            />
            <p
              className={clsx(
                'font-serif-body italic text-[14px] leading-snug',
                isMinimum ? 'text-forest' : 'text-gold-deep'
              )}
            >
              {isMinimum
                ? 'minimum zrobione. to wystarczy.'
                : 'rutyna ukończona — dzień w cichym porządku.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
