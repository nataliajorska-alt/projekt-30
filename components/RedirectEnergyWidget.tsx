'use client'

import { useMemo } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { getDailyRedirectQuests } from '@/lib/redirect-quests'
import clsx from 'clsx'

interface Props {
  compact?: boolean  // wersja do Ghost Protocol (ciemne tło)
}

export default function RedirectEnergyWidget({ compact = false }: Props) {
  const { todayLog, toggleSideQuest } = useGameData()

  const dateKey = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  const quests = useMemo(() => getDailyRedirectQuests(dateKey, compact ? 3 : 4), [dateKey, compact])
  const completed = todayLog?.completedSideQuests ?? []

  if (compact) {
    return (
      <div className="mt-6 pt-5 border-t border-ivory/10">
        <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.15em] text-center mb-4">
          — lub przekieruj energię —
        </p>
        <div className="space-y-2">
          {quests.map(q => {
            const done = completed.includes(q.id)
            return (
              <button
                key={q.id}
                onClick={() => !done && toggleSideQuest(q.id, 'milosc', q.xp)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  done
                    ? 'border-gold/30 bg-gold/10 opacity-70 cursor-default'
                    : 'border-ivory/10 bg-forest/20 hover:bg-forest/40 hover:border-gold/30'
                )}
              >
                <span className="text-lg flex-shrink-0">{q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx('font-sans text-sm leading-tight', done ? 'text-gold/80 line-through' : 'text-ivory/90')}>
                    {q.title}
                  </p>
                  {!done && (
                    <p className="font-sans text-[11px] text-ivory/40 mt-0.5 leading-tight">{q.description}</p>
                  )}
                </div>
                <span className={clsx('font-sans text-[11px] flex-shrink-0', done ? 'text-gold/60' : 'text-ivory/40')}>
                  {done ? '✓' : `+${q.xp} XP`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-cream">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest">
          Przekierowanie energii · dziś
        </p>
        <span className="font-sans text-[10px] text-muted-light">Miłość</span>
      </div>
      <div className="space-y-2">
        {quests.map(q => {
          const done = completed.includes(q.id)
          return (
            <button
              key={q.id}
              onClick={() => !done && toggleSideQuest(q.id, 'milosc', q.xp)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                done
                  ? 'border-[#C27BA0]/20 bg-[#C27BA0]/5 cursor-default'
                  : 'border-[#C27BA0]/15 bg-[#C27BA0]/5 hover:bg-[#C27BA0]/10 hover:border-[#C27BA0]/30'
              )}
            >
              <span className="text-base flex-shrink-0">{q.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'font-sans text-sm leading-tight',
                  done ? 'text-[#C27BA0]/60 line-through' : 'text-dark'
                )}>
                  {q.title}
                </p>
                {!done && (
                  <p className="font-sans text-[11px] text-muted-light mt-0.5 leading-tight">{q.description}</p>
                )}
              </div>
              <span className={clsx(
                'font-sans text-[11px] flex-shrink-0 font-medium',
                done ? 'text-[#C27BA0]/50' : 'text-[#C27BA0]'
              )}>
                {done ? '✓' : `+${q.xp}`}
              </span>
            </button>
          )
        })}
      </div>
      <p className="font-sans text-[10px] text-muted-light text-center mt-3">
        Miłość to też relacja z sobą i ze światem.
      </p>
    </div>
  )
}
