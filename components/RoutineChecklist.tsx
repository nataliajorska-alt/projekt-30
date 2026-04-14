'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import {
  getTodayWeeklyHabits,
  getWeeklyStudyItem, getWeeklyStudyLabel,
} from '@/lib/routineData'
import { Check, Sun, Moon, Sparkles, BatteryLow } from 'lucide-react'
import clsx from 'clsx'

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

export default function RoutineChecklist() {
  const { todayLog, toggleRoutine, setDayMode } = useGameData()
  const { getEffectiveItems } = useRoutineConfig()
  const [tab, setTab] = useState<Tab>('morning')
  const prevProgressByTab = useRef<Partial<Record<Tab, number>>>({})

  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'

  const weeklyToday = getTodayWeeklyHabits()
  const studyItem = getWeeklyStudyItem()
  const studyLabel = getWeeklyStudyLabel()
  const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
  const dow = new Date().getDay()
  const todayName = DAY_NAMES[dow]
  const isWeekday = dow >= 1 && dow <= 5

  // W trybie minimum zakładka Dzień jest ukryta
  const visibleTabs = isMinimum
    ? TABS.filter(t => t.id !== 'daily')
    : TABS

  // Jeśli aktywna zakładka to 'daily' a weszłyśmy w minimum — przełącz na ranek
  const activeTab = isMinimum && tab === 'daily' ? 'morning' : tab

  // Extra daily items: weekly habits + study topic (not configurable via settings)
  const extraDaily = [...weeklyToday, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
  // getEffectiveItems includes DAILY_HABITS (filtered by config) + extraDaily + custom items
  // On weekends, skip DAILY_HABITS by passing them as extra only on weekdays
  const dailyBase = isWeekday ? getEffectiveItems('daily', isMinimum) : []
  const allDailyItems = isWeekday
    ? getEffectiveItems('daily', isMinimum, extraDaily)
    : [...extraDaily, ...getEffectiveItems('daily', isMinimum).filter(i => i.id.startsWith('custom_'))]

  const ITEMS_MAP = {
    morning: getEffectiveItems('morning', isMinimum),
    daily:   isMinimum ? [] : allDailyItems,
    evening: getEffectiveItems('evening', isMinimum),
  }

  const items = ITEMS_MAP[activeTab]
  const completedCount = items.filter(i => todayLog?.completedRoutine.includes(i.id)).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  useEffect(() => {
    const prev = prevProgressByTab.current[activeTab] ?? 0
    if (prev < 100 && progress === 100) {
      const next = getNextTab(activeTab, visibleTabs)
      if (next) {
        const t = setTimeout(() => setTab(next), 1500)
        return () => clearTimeout(t)
      }
    }
    prevProgressByTab.current[activeTab] = progress
  }, [progress, activeTab])

  const handleModeToggle = () => {
    setDayMode(isMinimum ? 'normal' : 'minimum')
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      {/* Mode banner — minimum */}
      {isMinimum && (
        <div className="bg-forest/10 border-b border-forest/20 px-5 py-2.5 flex items-center gap-2">
          <BatteryLow size={14} className="text-forest" strokeWidth={1.5} />
          <p className="font-sans text-xs text-forest font-medium flex-1">
            Tryb minimum aktywny — dasz radę.
          </p>
          <button
            onClick={handleModeToggle}
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
            {/* Mode toggle */}
            {!isMinimum && (
              <button
                onClick={handleModeToggle}
                className="flex items-center gap-1.5 text-[11px] font-sans text-muted-light hover:text-muted border border-border rounded-full px-2.5 py-1 transition-colors"
                title="Włącz tryb minimum (choroba, zmęczenie, podróż)"
              >
                <BatteryLow size={11} strokeWidth={1.5} />
                minimum
              </button>
            )}
            <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
              {completedCount}/{items.length}
            </span>
          </div>
        </div>
        {/* Progress bar */}
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

      {/* Tabs */}
      <div className="flex border-b border-border mx-5">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-sans transition-all border-b-2 -mb-px',
              activeTab === id
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
        {activeTab === 'daily' && isWeekday && weeklyToday.length > 0 && (
          <div className="pb-1">
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest px-3 pb-1">Codzienne</p>
          </div>
        )}
        {items.map((item, idx) => {
          const isFirstWeekly = activeTab === 'daily' && weeklyToday.length > 0 && idx === dailyBase.length
          const isStudyItem = activeTab === 'daily' && item.id === studyItem.id
          const done = todayLog?.completedRoutine.includes(item.id) ?? false
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
            <button
              key={item.id}
              onClick={() => toggleRoutine(item.id, item.xp)}
              className={clsx(
                'w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all group',
                done
                  ? isMinimum ? 'bg-forest/10' : 'bg-gold-pale'
                  : 'hover:bg-cream'
              )}
            >
              <div className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
                done
                  ? isMinimum ? 'bg-forest border-forest' : 'bg-gold border-gold'
                  : 'border-border group-hover:border-gold/50'
              )}>
                {done && <Check size={11} className="text-white" strokeWidth={2.5} />}
              </div>
              <p className={clsx(
                'font-sans text-sm leading-snug flex-1',
                done ? 'text-muted line-through' : 'text-dark'
              )}>
                {item.text}
              </p>
              <span className={clsx(
                'text-[11px] font-sans flex-shrink-0 mt-0.5',
                done
                  ? isMinimum ? 'text-forest' : 'text-gold'
                  : 'text-muted-light'
              )}>
                +{item.xp}
              </span>
            </button>
            </div>
          )
        })}
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
  )
}
