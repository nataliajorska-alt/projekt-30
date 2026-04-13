'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { getRandomSideQuest } from '@/lib/questData'
import { getPillar } from '@/lib/pillars'
import type { Quest } from '@/types'
import { Shuffle, Check, Star, Undo2 } from 'lucide-react'
import QuestSteps from './QuestSteps'
import clsx from 'clsx'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
const DIFFICULTY_COLORS = { easy: 'text-green-600 bg-green-50', medium: 'text-amber-600 bg-amber-50', hard: 'text-red-600 bg-red-50' }

export default function SideQuestPicker() {
  const { todayLog, toggleSideQuest } = useGameData()
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [completed, setCompleted] = useState(false)

  const roll = () => {
    const alreadyDone = todayLog?.completedSideQuests ?? []
    const quest = getRandomSideQuest(alreadyDone)
    setActiveQuest(quest)
    setCompleted(false)
  }

  const handleComplete = async () => {
    if (!activeQuest) return
    await toggleSideQuest(activeQuest.id, activeQuest.pillar, activeQuest.xp)
    setCompleted(true)
  }

  const pillar = activeQuest ? getPillar(activeQuest.pillar) : null

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-dark text-lg">Side Quest</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Coś extra. Nie musisz, ale warto.</p>
          </div>
          {todayLog && todayLog.completedSideQuests.length > 0 && (
            <div className="flex items-center gap-1 bg-gold-pale px-2.5 py-1 rounded-full">
              <Star size={11} className="text-gold fill-gold" />
              <span className="font-sans text-xs text-gold font-medium">
                {todayLog.completedSideQuests.length} dziś
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        {!activeQuest ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <p className="font-serif text-muted text-base mb-4">
              Losuj swój side quest na dziś
            </p>
            <button
              onClick={roll}
              className="inline-flex items-center gap-2 bg-dark text-ivory font-sans text-sm px-6 py-3 rounded-xl hover:bg-forest transition-colors"
            >
              <Shuffle size={15} strokeWidth={1.5} />
              Losuj quest
            </button>
          </div>
        ) : (
          <div className={clsx(
            'rounded-xl border p-5 transition-all',
            completed ? 'border-gold/30 bg-gold-pale' : 'border-border bg-cream/30'
          )}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-base">{pillar?.icon}</span>
                  <span
                    className="text-[10px] font-sans uppercase tracking-widest font-medium"
                    style={{ color: pillar?.color }}
                  >
                    {pillar?.shortName}
                  </span>
                  <span className={clsx(
                    'text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded-full font-medium',
                    DIFFICULTY_COLORS[activeQuest.difficulty]
                  )}>
                    {DIFFICULTY_LABELS[activeQuest.difficulty]}
                  </span>
                </div>
                <h3 className="font-serif text-dark text-lg">{activeQuest.title}</h3>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-sans text-xs text-muted-light block">Nagroda</span>
                <span className="font-serif text-gold text-lg">+{activeQuest.xp}</span>
                <span className="font-sans text-xs text-gold-dark"> XP</span>
              </div>
            </div>

            <p className="font-sans text-sm text-muted leading-relaxed mb-4">
              {activeQuest.description}
            </p>

            {activeQuest.tags && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {activeQuest.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-sans text-muted-light bg-parchment px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {activeQuest.steps && activeQuest.steps.length > 0 && (
              <QuestSteps questId={activeQuest.id} steps={activeQuest.steps} />
            )}

            <div className="flex gap-2 mt-4">
              {!completed ? (
                <>
                  <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-2 bg-dark text-ivory font-sans text-sm py-3 rounded-xl hover:bg-forest transition-colors"
                  >
                    <Check size={14} strokeWidth={2} />
                    Ukończono
                  </button>
                  <button
                    onClick={roll}
                    className="flex items-center justify-center gap-2 border border-border text-muted font-sans text-sm px-4 py-3 rounded-xl hover:border-dark hover:text-dark transition-colors"
                  >
                    <Shuffle size={14} strokeWidth={1.5} />
                    Inny
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-gold font-serif text-base">
                    ✦ Side quest ukończony — +{activeQuest.xp} XP
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await toggleSideQuest(activeQuest.id, activeQuest.pillar, activeQuest.xp)
                        setCompleted(false)
                      }}
                      className="inline-flex items-center gap-2 border border-border text-muted font-sans text-xs px-4 py-2 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <Undo2 size={12} strokeWidth={1.5} />
                      Cofnij
                    </button>
                    <button
                      onClick={roll}
                      className="inline-flex items-center gap-2 border border-border text-muted font-sans text-xs px-4 py-2 rounded-xl hover:border-dark hover:text-dark transition-colors"
                    >
                      <Shuffle size={12} strokeWidth={1.5} />
                      Jeszcze jeden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
