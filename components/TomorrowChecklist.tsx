'use client'
import { useState, useEffect, useRef } from 'react'
import { useTomorrowData } from '@/hooks/useTomorrowData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import {
  getTodayWeeklyHabits,
  getWeeklyStudyItem, getWeeklyStudyLabel,
} from '@/lib/routineData'
import { tomorrowDate } from '@/lib/gameLogic'
import { Check, Sun, Moon, Sparkles } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'morning' | 'daily' | 'evening'

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'morning', label: 'Ranek',   icon: Sun },
  { id: 'daily',   label: 'Dzień',   icon: Sparkles },
  { id: 'evening', label: 'Wieczór', icon: Moon },
]

export default function TomorrowChecklist() {
  const { tomorrowLog, toggleTomorrowRoutine } = useTomorrowData()
  const { getEffectiveItems } = useRoutineConfig()
  const [tab, setTab] = useState<Tab>('morning')
  const prevProgressByTab = useRef<Partial<Record<Tab, number>>>({})

  const tomorrow = tomorrowDate()
  const dow = tomorrow.getDay()
  const isWeekday = dow >= 1 && dow <= 5
  const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
  const tomorrowName = DAY_NAMES[dow]

  const weeklyTomorrow = getTodayWeeklyHabits(tomorrow)
  const studyItem      = getWeeklyStudyItem(tomorrow)
  const studyLabel     = getWeeklyStudyLabel(tomorrow)

  const extraDaily = [...weeklyTomorrow, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
  const dailyBase  = isWeekday ? getEffectiveItems('daily', false) : []
  const allDailyItems = isWeekday
    ? getEffectiveItems('daily', false, extraDaily)
    : [...extraDaily, ...getEffectiveItems('daily', false).filter(i => i.id.startsWith('custom_'))]

  const ITEMS_MAP = {
    morning: getEffectiveItems('morning', false),
    daily:   allDailyItems,
    evening: getEffectiveItems('evening', false),
  }

  const items = ITEMS_MAP[tab]
  const completedCount = items.filter(i => tomorrowLog?.completedRoutine?.includes(i.id)).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  useEffect(() => {
    const prev = prevProgressByTab.current[tab] ?? 0
    if (prev < 100 && progress === 100) {
      const nextTab = (TABS.find((_, idx) => TABS[idx - 1]?.id === tab))?.id
      if (nextTab) {
        const t = setTimeout(() => setTab(nextTab), 1500)
        return () => clearTimeout(t)
      }
    }
    prevProgressByTab.current[tab] = progress
  }, [progress, tab])

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-lg">Rutyna</h2>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[10px] text-gold/80 bg-gold-pale px-2.5 py-1 rounded-full font-medium tracking-wide uppercase">
              na zapas
            </span>
            <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
              {completedCount}/{items.length}
            </span>
          </div>
        </div>
        <div className="h-1 bg-cream rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gold"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mx-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-sans transition-all border-b-2 -mb-px',
              tab === id
                ? 'border-gold text-gold font-medium'
                : 'border-transparent text-muted hover:text-dark'
            )}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="px-5 py-3 space-y-1">
        {tab === 'daily' && isWeekday && weeklyTomorrow.length > 0 && (
          <div className="pb-1">
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest px-3 pb-1">Codzienne</p>
          </div>
        )}
        {items.map((item, idx) => {
          const isFirstWeekly = tab === 'daily' && weeklyTomorrow.length > 0 && idx === dailyBase.length
          const isStudyItem   = tab === 'daily' && item.id === studyItem.id
          const done = tomorrowLog?.completedRoutine?.includes(item.id) ?? false
          return (
            <div key={item.id}>
              {isFirstWeekly && (
                <div className="pt-2 pb-1">
                  <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest px-3 pb-1">{tomorrowName}</p>
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
                onClick={() => toggleTomorrowRoutine(item.id, item.xp)}
                className={clsx(
                  'w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all group',
                  done ? 'bg-gold-pale' : 'hover:bg-cream'
                )}
              >
                <div className={clsx(
                  'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
                  done ? 'bg-gold border-gold' : 'border-border group-hover:border-gold/50'
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
                  done ? 'text-gold' : 'text-muted-light'
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
          <div className="rounded-xl px-4 py-2.5 text-center bg-gold-pale">
            <p className="font-serif text-sm text-gold">Rutyna na jutro gotowa ✦</p>
          </div>
        </div>
      )}
    </div>
  )
}
