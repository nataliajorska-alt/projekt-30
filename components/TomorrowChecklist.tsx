'use client'
import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useTomorrowData } from '@/hooks/useTomorrowData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import {
  getTodayWeeklyHabits,
  getWeeklyStudyItem, getWeeklyStudyLabel,
} from '@/lib/routineData'
import { tomorrowDate } from '@/lib/gameLogic'
import { Sun, Moon, Sparkles } from 'lucide-react'
import { SmallCaps, Diamond, Fleuron, RomanNumeral } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

type Tab = 'morning' | 'daily' | 'evening'

const TABS: { id: Tab; label: string; roman: number }[] = [
  { id: 'morning', label: 'Ranek',   roman: 1 },
  { id: 'daily',   label: 'Dzień',   roman: 2 },
  { id: 'evening', label: 'Wieczór', roman: 3 },
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

  // Zadania przeniesione NA jutro z innego dnia (np. dzisiejsza książka z hiszpańskiego).
  const carriedTomorrow = (tomorrowLog?.carriedRoutine ?? []).filter(c => !allDailyItems.some(i => i.id === c.id))

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
    <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="font-heading text-dark text-xl whitespace-nowrap">Rutyna</h2>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              na zapas
            </SmallCaps>
          </div>
          <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
            {toRoman(completedCount)} / {toRoman(items.length)}
          </SmallCaps>
        </div>

        {/* Hairline progress */}
        <div className="relative mt-2 h-px w-full bg-hairline">
          <div
            className="absolute left-0 top-0 h-px bg-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          {progress > 0 && progress < 100 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `calc(${progress}% - 4px)`,
                top: '-3.5px',
                width: 8,
                height: 8,
                lineHeight: 0,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 10 10" className="text-gold" style={{ display: 'block' }}>
                <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-hairline mt-2">
        {TABS.map(({ id, label, roman }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 group flex flex-col items-center gap-1.5 py-3 transition-colors"
            >
              <span className="flex items-baseline gap-2">
                <RomanNumeral
                  value={roman}
                  className={clsx(
                    'text-sm transition-colors',
                    active ? 'text-gold' : 'text-muted-light group-hover:text-gold-light'
                  )}
                />
                <SmallCaps
                  tone={active ? 'gold' : 'muted'}
                  tracking="luxury"
                  size="sm"
                >
                  {label}
                </SmallCaps>
              </span>
              <span
                className={clsx(
                  'h-px w-10 transition-colors',
                  active ? 'bg-gold' : 'bg-transparent'
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Items */}
      <div className="px-3 py-3 space-y-1">
        {tab === 'daily' && carriedTomorrow.length > 0 && (
          <>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-1">
              przeniesione na jutro
            </SmallCaps>
            {carriedTomorrow.map(c => {
              const done = tomorrowLog?.completedRoutine?.includes(c.id) ?? false
              return (
                <button
                  key={`carried-${c.id}`}
                  onClick={() => toggleTomorrowRoutine(c.id, c.xp)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-3 text-left transition-all group',
                    done ? 'bg-gold-pale/60' : 'hover:bg-cream'
                  )}
                >
                  <span className={clsx('flex-shrink-0 transition-all', done ? 'text-gold' : 'text-hairline group-hover:text-gold-light')}>
                    <Diamond size={10} filled={done} />
                  </span>
                  <p className={clsx('font-serif-body text-[14.5px] leading-snug flex-1', done ? 'text-muted italic line-through decoration-1' : 'text-dark')}>
                    {c.text}
                  </p>
                  <SmallCaps tone={done ? 'gold' : 'muted'} tracking="luxury" size="xs">+ {c.xp}</SmallCaps>
                </button>
              )
            })}
          </>
        )}

        {tab === 'daily' && isWeekday && weeklyTomorrow.length > 0 && (
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-1">
            codzienne
          </SmallCaps>
        )}

        {items.map((item, idx) => {
          const isFirstWeekly = tab === 'daily' && weeklyTomorrow.length > 0 && idx === dailyBase.length
          const isStudyItem   = tab === 'daily' && item.id === studyItem.id
          const done = tomorrowLog?.completedRoutine?.includes(item.id) ?? false

          return (
            <div key={item.id}>
              {isFirstWeekly && (
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-3">
                  {tomorrowName}
                </SmallCaps>
              )}
              {isStudyItem && (
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block px-3 pb-1 pt-3">
                  temat tygodnia · {studyLabel}
                </SmallCaps>
              )}
              <button
                onClick={() => toggleTomorrowRoutine(item.id, item.xp)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-3 text-left transition-all group',
                  done ? 'bg-gold-pale/60' : 'hover:bg-cream'
                )}
              >
                <span
                  className={clsx(
                    'flex-shrink-0 transition-all',
                    done ? 'text-gold' : 'text-hairline group-hover:text-gold-light'
                  )}
                >
                  <Diamond size={10} filled={done} />
                </span>
                <p
                  className={clsx(
                    'font-serif-body text-[14.5px] leading-snug flex-1',
                    done ? 'text-muted italic line-through decoration-1' : 'text-dark'
                  )}
                >
                  {item.text}
                </p>
                <SmallCaps
                  tone={done ? 'gold' : 'muted'}
                  tracking="luxury"
                  size="xs"
                >
                  + {item.xp}
                </SmallCaps>
              </button>
            </div>
          )
        })}
      </div>

      {progress === 100 && (
        <div className="mx-5 mb-5 border border-gold-light/30 px-5 py-3 text-center">
          <Fleuron size={10} className="text-gold inline-block mb-1" />
          <p className="font-serif-body italic text-gold-deep text-[14px] leading-snug">
            rutyna na jutro gotowa — przygotowana w cichym porządku.
          </p>
        </div>
      )}
    </div>
  )
}
