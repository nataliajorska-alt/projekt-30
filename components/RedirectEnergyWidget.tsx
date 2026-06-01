'use client'

import { useMemo } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { getDailyRedirectQuests } from '@/lib/redirect-quests'
import { SmallCaps, Diamond, GoldRule, RedirectGlyph } from '@/components/ui'

interface Props {
  compact?: boolean
}

const WINE = '#C27BA0'

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
      <div className="mt-6 pt-5 border-t border-gold-light/15">
        <GoldRule variant="diamond" tone="gold" className="max-w-xs mx-auto mb-4 opacity-60" />
        <p className="font-serif-body italic text-parchment text-[13px] text-center mb-4">
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
                  'w-full flex items-center gap-3 px-4 py-3 border text-left transition-all',
                  done
                    ? 'border-gold/40 bg-gold/10 opacity-70 cursor-default'
                    : 'border-ivory/15 bg-forest/20 hover:bg-forest/40 hover:border-gold/40'
                )}
              >
                <RedirectGlyph
                  id={q.id}
                  size={20}
                  className={clsx('shrink-0', done ? 'text-gold/50' : 'text-gold-light/80')}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      'font-serif-body text-[14px] leading-tight',
                      done ? 'text-gold-light/70 line-through italic' : 'text-ivory'
                    )}
                  >
                    {q.title}
                  </p>
                  {!done && (
                    <p className="font-serif-body italic text-parchment/60 text-[11px] mt-0.5 leading-tight">
                      {q.description}
                    </p>
                  )}
                </div>
                {done ? (
                  <Diamond size={5} className="text-gold shrink-0" filled />
                ) : (
                  <SmallCaps tone="parchment" tracking="luxury" size="xs" className="shrink-0">
                    + {q.xp} XP
                  </SmallCaps>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-hairline">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ color: WINE }}>
          <Diamond size={5} />
          <SmallCaps tracking="luxury" size="xs">
            <span style={{ color: WINE }}>Przekierowanie energii · dziś</span>
          </SmallCaps>
        </div>
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          Miłość
        </SmallCaps>
      </div>
      <div className="space-y-2">
        {quests.map(q => {
          const done = completed.includes(q.id)
          return (
            <button
              key={q.id}
              onClick={() => !done && toggleSideQuest(q.id, 'milosc', q.xp)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 border text-left transition-all'
              )}
              style={
                done
                  ? { borderColor: `${WINE}25`, background: `${WINE}08` }
                  : { borderColor: `${WINE}25`, background: `${WINE}05` }
              }
            >
              <span className="shrink-0" style={{ color: done ? `${WINE}90` : WINE }}>
                <RedirectGlyph id={q.id} size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    'font-serif-body text-[14px] leading-tight',
                    done ? 'line-through italic' : ''
                  )}
                  style={{ color: done ? `${WINE}90` : '#1A2420' }}
                >
                  {q.title}
                </p>
                {!done && (
                  <p className="font-serif-body italic text-muted-light text-[11.5px] mt-0.5 leading-tight">
                    {q.description}
                  </p>
                )}
              </div>
              {done ? (
                <span style={{ color: WINE }} className="shrink-0">
                  <Diamond size={5} filled />
                </span>
              ) : (
                <span
                  className="font-ui uppercase tracking-luxury text-[10px] shrink-0"
                  style={{ color: WINE }}
                >
                  + {q.xp}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="font-serif-body italic text-muted-light text-[12px] text-center mt-3">
        miłość to też relacja z sobą i ze światem.
      </p>
    </div>
  )
}
