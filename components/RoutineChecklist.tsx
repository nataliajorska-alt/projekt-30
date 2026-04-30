'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import {
  getTodayWeeklyHabits,
  getWeeklyStudyItem, getWeeklyStudyLabel,
  MORNING_ROUTINE, EVENING_ROUTINE,
  MORNING_SKINCARE_STEPS, EVENING_SKINCARE,
} from '@/lib/routineData'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import { MINIMUM_DAY_REASONS } from '@/types'
import { Check, Sun, Moon, Sparkles, BatteryLow, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import MinimumDayModal from '@/components/MinimumDayModal'
import type { MinimumDayReason, RoutineItem } from '@/types'

type Tab = 'morning' | 'daily' | 'evening'

function getNextTab(current: Tab, visible: typeof TABS): Tab | null {
  const ids = visible.map(t => t.id)
  const idx = ids.indexOf(current)
  return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null
}

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'morning', label: 'Ranek',  icon: Sun },
  { id: 'daily',   label: 'Dzień',  icon: Sparkles },
  { id: 'evening', label: 'Wieczór', icon: Moon },
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
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all group',
        done
          ? isMinimum ? 'bg-forest/10' : 'bg-gold-pale'
          : isOptional ? 'hover:bg-cream/60' : 'hover:bg-cream'
      )}
    >
      <div className={clsx(
        'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
        done
          ? isMinimum ? 'bg-forest border-forest' : 'bg-gold border-gold'
          : isOptional
            ? 'border-border/60 group-hover:border-forest/30'
            : 'border-border group-hover:border-gold/50'
      )}>
        {done && <Check size={11} className="text-white" strokeWidth={2.5} />}
      </div>
      <p className={clsx(
        'font-sans text-sm leading-snug flex-1',
        done ? 'text-muted line-through' : isOptional ? 'text-muted' : 'text-dark'
      )}>
        {item.text}
      </p>
      <div className="flex flex-col items-end flex-shrink-0 mt-0.5 gap-0.5">
        <span className={clsx(
          'text-[11px] font-sans',
          done
            ? isMinimum ? 'text-forest' : 'text-gold'
            : 'text-muted-light'
        )}>
          +{isMinimum ? item.xp * 2 : item.xp}
        </span>
        {isMinimum && !done && (
          <span className="text-[9px] font-sans text-forest/60">×2</span>
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
    <div className="ml-11 -mt-0.5 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] font-sans text-muted-light hover:text-muted transition-colors py-0.5"
      >
        {theme && !open && (
          <span className="text-forest/60 font-medium">{theme}</span>
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
        <ol className="mt-1 space-y-1.5 pb-1">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-cream text-[9px] font-sans text-muted flex items-center justify-center">
                {i + 1}
              </span>
              <span className="font-sans text-xs text-dark leading-snug">{step}</span>
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
  const [showOptional, setShowOptional] = useState<Record<Tab, boolean>>({ morning: false, daily: false, evening: false })
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

  // Split items: essential (count toward progress) + optional (bonus, collapsible)
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
    // daily in minimum mode: all optional
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

  return (
    <>
    {showMinimumModal && (
      <MinimumDayModal
        onConfirm={handleMinimumConfirm}
        onClose={() => setShowMinimumModal(false)}
      />
    )}
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      {/* Mode banner — minimum */}
      {isMinimum && (
        <div className="bg-forest/10 border-b border-forest/20 px-5 py-2.5 flex items-center gap-2">
          <BatteryLow size={14} className="text-forest" strokeWidth={1.5} />
          <p className="font-sans text-xs text-forest font-medium flex-1">
            {reasonMeta ? `${reasonMeta.emoji} ${reasonMeta.label} — dasz radę.` : 'Tryb minimum aktywny — dasz radę.'}
          </p>
          <button
            onClick={() => setDayMode('normal')}
            className="font-sans text-[11px] text-forest/70 hover:text-forest underline"
          >
            wróć do normalnej
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-lg">Rutyna</h2>
          <div className="flex items-center gap-2">
            {!isMinimum && (
              <button
                onClick={() => setShowMinimumModal(true)}
                className="flex items-center gap-1.5 text-[11px] font-sans text-muted-light hover:text-muted border border-border rounded-full px-2.5 py-1 transition-colors"
                title="Włącz tryb minimum"
              >
                <BatteryLow size={11} strokeWidth={1.5} />
                minimum
              </button>
            )}
            <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
              {completedCount}/{essential.length}
            </span>
          </div>
        </div>
        {/* Progress bar — only essential items count */}
        <div className="h-1 bg-cream rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              isMinimum ? 'bg-forest' : 'bg-gold'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs — always all 3 */}
      <div className="flex border-b border-border mx-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-sans transition-all border-b-2 -mb-px',
              tab === id
                ? isMinimum
                  ? 'border-forest text-forest font-medium'
                  : 'border-gold text-gold font-medium'
                : 'border-transparent text-muted hover:text-dark'
            )}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
            {isMinimum && id !== 'daily' && (
              <span className="text-[9px] text-forest/60 font-sans">min</span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="px-5 py-3 space-y-1">
        {/* Daily tab label helpers */}
        {tab === 'daily' && !isMinimum && isWeekday && weeklyToday.length > 0 && (
          <div className="pb-1">
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest px-3 pb-1">Codzienne</p>
          </div>
        )}

        {/* Essential items */}
        {essential.map((item, idx) => {
          const isFirstWeekly = tab === 'daily' && !isMinimum && weeklyToday.length > 0 && idx === getEffectiveItems('daily', false).length
          const isStudyItem = tab === 'daily' && item.id === studyItem.id
          const done = todayLog?.completedRoutine?.includes(item.id) ?? false
          return (
            <div key={item.id}>
              {isFirstWeekly && (
                <div className="pt-2 pb-1">
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest px-3 pb-1">{todayName}</p>
                </div>
              )}
              {isStudyItem && (
                <div className="pt-2 pb-1">
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest px-3 pb-1">
                    Temat tygodnia · {studyLabel}
                  </p>
                </div>
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
            </div>
          )
        })}

        {/* Optional collapsible section */}
        {optional.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => toggleOptional(tab)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left group"
            >
              <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest flex-1">
                Opcjonalnie · {optional.filter(i => todayLog?.completedRoutine?.includes(i.id)).length}/{optional.length}
              </p>
              <ChevronDown
                size={12}
                strokeWidth={1.5}
                className={clsx('text-muted-light transition-transform', showOptional[tab] && 'rotate-180')}
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

      {progress === 100 && (
        <div className="mx-5 mb-4">
          <div className={clsx(
            'rounded-xl px-4 py-2.5 text-center',
            isMinimum ? 'bg-forest/10 border border-forest/20' : 'bg-gold-pale'
          )}>
            <p className={clsx(
              'font-serif text-sm',
              isMinimum ? 'text-forest' : 'text-gold'
            )}>
              {isMinimum ? 'Minimum zrobione. To wystarczy. ✦' : 'Rutyna ukończona ✦'}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
