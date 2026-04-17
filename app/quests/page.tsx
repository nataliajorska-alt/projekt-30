'use client'
import { useState } from 'react'
import { SIDE_QUESTS } from '@/lib/questData'
import { PILLARS, getPillar } from '@/lib/pillars'
import { useGameData } from '@/hooks/useGameData'
import { Pillar } from '@/types'
import { Check, Undo2 } from 'lucide-react'
import QuestSteps from '@/components/QuestSteps'
import clsx from 'clsx'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
type Filter = Pillar | 'all'

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
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Biblioteka</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Side Questy</h1>
        <p className="font-sans text-sm text-muted">
          {SIDE_QUESTS.length} questów · {totalCompleted} ukończonych dziś
        </p>
      </div>

      {/* Pillar filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-full font-sans text-xs transition-all',
            filter === 'all' ? 'bg-dark text-ivory' : 'bg-cream text-muted hover:bg-parchment'
          )}
        >
          Wszystkie
        </button>
        {PILLARS.map(p => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id as Filter)}
            className={clsx(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs transition-all',
              filter === p.id ? 'bg-dark text-ivory' : 'bg-cream text-muted hover:bg-parchment'
            )}
          >
            <span>{p.icon}</span>
            {p.shortName}
          </button>
        ))}
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
                'rounded-2xl border transition-all',
                done ? 'border-gold/20 bg-gold-pale' : 'border-border bg-white shadow-elegant'
              )}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-sm">{pillar.icon}</span>
                      <span
                        className="text-[10px] font-sans uppercase tracking-widest font-medium"
                        style={{ color: pillar.color }}
                      >
                        {pillar.shortName}
                      </span>
                      <span className="text-[10px] font-sans text-muted-light">
                        · {DIFFICULTY_LABELS[quest.difficulty]}
                      </span>
                    </div>
                    <h3 className={clsx(
                      'font-serif text-base',
                      done ? 'text-muted' : 'text-dark'
                    )}>
                      {quest.title}
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={clsx(
                      'font-serif text-lg',
                      done ? 'text-gold' : 'text-dark'
                    )}>
                      +{quest.xp}
                    </span>
                    <span className="font-sans text-xs text-muted-light"> XP</span>
                  </div>
                </div>

                <p className="font-sans text-sm text-muted leading-relaxed mb-3">
                  {quest.description}
                </p>

                {quest.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {quest.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-sans text-muted-light bg-cream px-2 py-0.5 rounded-full">
                        #{tag}
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
                    className="inline-flex items-center gap-2 text-gold font-sans text-xs font-medium mt-3 hover:text-red-400 transition-colors group"
                  >
                    <Check size={13} strokeWidth={2} className="group-hover:hidden" />
                    <Undo2 size={13} strokeWidth={2} className="hidden group-hover:block" />
                    <span className="group-hover:hidden">Ukończone dziś</span>
                    <span className="hidden group-hover:block">Cofnij ukończenie</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleComplete(quest.id, quest.pillar, quest.xp)}
                    disabled={isCompleting}
                    className="inline-flex items-center gap-2 bg-dark text-ivory font-sans text-xs px-4 py-2.5 rounded-xl hover:bg-forest transition-colors disabled:opacity-60"
                  >
                    {isCompleting ? '...' : <><Check size={12} strokeWidth={2} /> Ukończone</>}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
