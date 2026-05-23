'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { SIDE_QUESTS } from '@/lib/questData'
import { PILLARS, getPillar } from '@/lib/pillars'
import { useGameData } from '@/hooks/useGameData'
import { Pillar } from '@/types'
import { Check, Undo2 } from 'lucide-react'
import QuestSteps from '@/components/QuestSteps'
import { SmallCaps, Diamond, GoldRule, Fleuron } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
const DIFFICULTY_DIAMONDS = { easy: 1, medium: 2, hard: 3 }
type Filter = Pillar | 'all'

function DifficultyMarks({ d }: { d: keyof typeof DIFFICULTY_LABELS }) {
  const filled = DIFFICULTY_DIAMONDS[d]
  return (
    <span className="inline-flex items-center gap-0.5 text-gold">
      {[1, 2, 3].map(i => (
        <Diamond key={i} size={5} filled={i <= filled} className={i <= filled ? 'text-gold' : 'text-gold/30'} />
      ))}
    </span>
  )
}

export default function QuestsPage() {
  const { todayLog, toggleSideQuest } = useGameData()
  const [filter, setFilter] = useState<Filter>('all')
  const [completing, setCompleting] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? SIDE_QUESTS
    : SIDE_QUESTS.filter(q => q.pillar === filter)

  const totalCompleted = todayLog?.completedSideQuests?.length ?? 0

  const handleComplete = async (questId: string, pillar: Pillar, xp: number) => {
    setCompleting(questId)
    await toggleSideQuest(questId, pillar, xp)
    setCompleting(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-8">
        <SmallCaps tone="muted" tracking="editorial" size="xs">
          Biblioteka · Vol. I
        </SmallCaps>
        <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
          Side Questy
        </h1>
        <p className="font-serif-body italic text-muted text-[14px] mt-2">
          {toRoman(SIDE_QUESTS.length)} questów w bibliotece · {totalCompleted} ukończonych dziś
        </p>
        <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />
      </header>

      {/* Filter — editorial pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'flex-shrink-0 px-3.5 py-1.5 border transition-all',
            filter === 'all'
              ? 'bg-dark-deep text-ivory border-gold'
              : 'border-hairline text-muted hover:border-gold-light'
          )}
        >
          <SmallCaps tone={filter === 'all' ? 'ivory' : 'muted'} tracking="luxury" size="xs">
            Wszystkie
          </SmallCaps>
        </button>
        {PILLARS.map(p => {
          const sel = filter === p.id
          return (
            <button
              key={p.id}
              onClick={() => setFilter(p.id as Filter)}
              className={clsx(
                'flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 border transition-all',
                sel
                  ? 'bg-dark-deep text-ivory border-gold'
                  : 'border-hairline text-muted hover:border-gold-light'
              )}
            >
              <span style={sel ? undefined : { color: p.color }}>
                <Diamond size={5} filled={sel} />
              </span>
              <SmallCaps
                tone={sel ? 'ivory' : 'muted'}
                tracking="luxury"
                size="xs"
              >
                {p.shortName}
              </SmallCaps>
            </button>
          )
        })}
      </div>

      {/* Quest list */}
      <div className="space-y-3">
        {filtered.map(quest => {
          const done = todayLog?.completedSideQuests?.includes(quest.id) ?? false
          const pillar = getPillar(quest.pillar)
          const isCompleting = completing === quest.id

          return (
            <div
              key={quest.id}
              className={clsx(
                'border bg-ivory p-5 transition-all',
                done ? 'border-gold' : 'border-hairline'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: pillar.color }}
                    >
                      <Diamond size={5} />
                      <span className="font-ui uppercase tracking-luxury text-[10px]">
                        {pillar.shortName}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DifficultyMarks d={quest.difficulty as keyof typeof DIFFICULTY_LABELS} />
                      <SmallCaps tone="muted" tracking="luxury" size="xs">
                        {DIFFICULTY_LABELS[quest.difficulty as keyof typeof DIFFICULTY_LABELS]}
                      </SmallCaps>
                    </span>
                  </div>
                  <h3
                    className={clsx(
                      'font-heading text-lg leading-snug',
                      done ? 'text-muted line-through decoration-1' : 'text-dark'
                    )}
                  >
                    {quest.title}
                  </h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    nagroda
                  </SmallCaps>
                  <p className={clsx('font-display text-2xl leading-none mt-1', done ? 'text-gold' : 'text-dark')}>
                    + {quest.xp}
                  </p>
                  <SmallCaps tone={done ? 'gold-deep' : 'muted'} tracking="luxury" size="xs">
                    XP
                  </SmallCaps>
                </div>
              </div>

              <p className="font-serif-body italic text-muted text-[14px] leading-relaxed mb-3">
                {quest.description}
              </p>

              {quest.tags && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {quest.tags.map(tag => (
                    <span
                      key={tag}
                      className="font-ui uppercase tracking-luxury text-[9px] text-muted border border-hairline px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {quest.steps && quest.steps.length > 0 && (
                <QuestSteps questId={quest.id} steps={quest.steps} />
              )}

              {done ? (
                <button
                  onClick={() => handleComplete(quest.id, quest.pillar, quest.xp)}
                  className="inline-flex items-center gap-2 mt-4 group"
                >
                  <Diamond size={6} className="text-gold group-hover:hidden" filled />
                  <Undo2 size={11} strokeWidth={1.5} className="text-red-500 hidden group-hover:block" />
                  <SmallCaps tone="gold" tracking="luxury" size="xs" className="group-hover:hidden">
                    Ukończone dziś
                  </SmallCaps>
                  <span className="hidden group-hover:inline-block">
                    <SmallCaps tracking="luxury" size="xs" className="!text-red-500">
                      Cofnij ukończenie
                    </SmallCaps>
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => handleComplete(quest.id, quest.pillar, quest.xp)}
                  disabled={isCompleting}
                  className="mt-4 inline-flex items-center gap-2 bg-dark-deep text-ivory border border-gold px-4 py-2.5 hover:bg-forest transition-colors disabled:opacity-60"
                >
                  {isCompleting ? (
                    <Fleuron size={11} className="text-gold animate-pulse" />
                  ) : (
                    <>
                      <Diamond size={5} className="text-gold" />
                      <SmallCaps tone="ivory" tracking="luxury" size="xs">
                        ukończone
                      </SmallCaps>
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
