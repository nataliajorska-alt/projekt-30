'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { MORNING_ROUTINE, EVENING_ROUTINE, DAILY_HABITS } from '@/lib/routineData'
import { Check, Sun, Moon, Sparkles } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'morning' | 'daily' | 'evening'

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'morning', label: 'Ranek', icon: Sun },
  { id: 'daily',   label: 'Dzień', icon: Sparkles },
  { id: 'evening', label: 'Wieczór', icon: Moon },
]

const ITEMS_MAP = {
  morning: MORNING_ROUTINE,
  daily: DAILY_HABITS,
  evening: EVENING_ROUTINE,
}

export default function RoutineChecklist() {
  const { todayLog, toggleRoutine } = useGameData()
  const [tab, setTab] = useState<Tab>('morning')
  const items = ITEMS_MAP[tab]

  const completedCount = items.filter(i => todayLog?.completedRoutine.includes(i.id)).length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-lg">Rutyna</h2>
          <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
            {completedCount}/{totalCount}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-cream rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
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
        {items.map((item) => {
          const done = todayLog?.completedRoutine.includes(item.id) ?? false
          return (
            <button
              key={item.id}
              onClick={() => toggleRoutine(item.id, item.xp)}
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
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'font-sans text-sm leading-snug',
                  done ? 'text-muted line-through' : 'text-dark'
                )}>
                  {item.text}
                </p>
              </div>
              <span className={clsx(
                'text-[11px] font-sans flex-shrink-0 mt-0.5',
                done ? 'text-gold' : 'text-muted-light'
              )}>
                +{item.xp}
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-5 pb-4">
        {progress === 100 && (
          <div className="bg-gold-pale rounded-xl px-4 py-2.5 text-center">
            <p className="font-serif text-gold text-sm">Rutyna ukończona ✦</p>
          </div>
        )}
      </div>
    </div>
  )
}
