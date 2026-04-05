'use client'
import { useGameData } from '@/hooks/useGameData'
import { getDailyQuests } from '@/lib/questData'
import { todayKey } from '@/lib/gameLogic'
import { getPillar } from '@/lib/pillars'
import { Check } from 'lucide-react'
import clsx from 'clsx'

export default function DailyQuests() {
  const { todayLog, toggleDailyQuest } = useGameData()
  const quests = getDailyQuests(todayKey())

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-dark text-lg">Questy dnia</h2>
          <span className="font-sans text-[11px] text-muted-light uppercase tracking-wider">
            odnawiają się jutro
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        {quests.map((quest) => {
          const done = todayLog?.completedDailyQuests.includes(quest.id) ?? false
          const pillar = getPillar(quest.pillar)

          return (
            <div
              key={quest.id}
              className={clsx(
                'rounded-xl border transition-all',
                done ? 'border-gold/30 bg-gold-pale' : 'border-border bg-cream/50'
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{pillar.icon}</span>
                      <span
                        className="text-[10px] font-sans uppercase tracking-widest font-medium"
                        style={{ color: pillar.color }}
                      >
                        {pillar.shortName}
                      </span>
                    </div>
                    <h3 className={clsx(
                      'font-serif text-base',
                      done ? 'text-muted line-through' : 'text-dark'
                    )}>
                      {quest.title}
                    </h3>
                  </div>
                  <span className={clsx(
                    'font-sans text-xs flex-shrink-0 mt-1',
                    done ? 'text-gold font-medium' : 'text-muted-light'
                  )}>
                    +{quest.xp} XP
                  </span>
                </div>
                <p className="font-sans text-sm text-muted leading-relaxed mb-3">
                  {quest.description}
                </p>
                <button
                  onClick={() => toggleDailyQuest(quest.id, quest.pillar)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-sm transition-all',
                    done
                      ? 'bg-gold text-white'
                      : 'bg-dark text-ivory hover:bg-forest'
                  )}
                >
                  {done ? (
                    <><Check size={14} strokeWidth={2} /> Ukończone</>
                  ) : (
                    'Oznacz jako zrobione'
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
