'use client'
import { useTomorrowData } from '@/hooks/useTomorrowData'
import { getAprilQuestsForDate } from '@/lib/aprilData'
import { getPillar } from '@/lib/pillars'
import { Check, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import type { AprilQuest } from '@/lib/aprilData'

const APRIL_LAST_DAY  = '2026-04-30'
const APRIL_FIRST_DAY = '2026-04-05'

function QuestCard({ quest, done, onComplete }: {
  quest: AprilQuest
  done: boolean
  onComplete: () => void
}) {
  const pillar = getPillar(quest.pillar)
  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-all',
      done ? 'border-gold/30 bg-gold-pale' : 'border-border bg-cream/30'
    )}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <span className="text-[10px] font-sans uppercase tracking-widest font-medium" style={{ color: pillar.color }}>
            {pillar.icon} {pillar.shortName}
          </span>
          <h3 className={clsx('font-serif text-base mt-0.5', done ? 'text-muted line-through' : 'text-dark')}>
            {quest.title}
          </h3>
        </div>
        <span className={clsx('font-sans text-xs flex-shrink-0 mt-1', done ? 'text-gold font-medium' : 'text-muted-light')}>
          +{quest.xp} XP
        </span>
      </div>
      <p className="font-sans text-sm text-muted leading-relaxed mb-3">{quest.description}</p>
      {done ? (
        <div className="flex items-center gap-2 text-gold font-sans text-xs font-medium">
          <Check size={13} strokeWidth={2} /> Już zrobione
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="flex items-center justify-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 px-4 rounded-xl hover:bg-forest transition-colors"
        >
          <Check size={13} strokeWidth={2} /> Zrobione na zapas
        </button>
      )}
    </div>
  )
}

export default function TomorrowQuests() {
  const { tomorrowLog, tomorrowDateKey, loading, toggleTomorrowQuest } = useTomorrowData()

  if (loading) return null

  const quests = getAprilQuestsForDate(tomorrowDateKey)

  if (quests.length === 0) {
    if (tomorrowDateKey > APRIL_LAST_DAY) {
      return (
        <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-serif text-dark text-lg">Questy dnia</h2>
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-gold/30 bg-gold-pale/60 p-5 text-center">
              <Sparkles size={20} className="text-gold mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-serif text-dark text-base mb-1">Nowy rozdział wkrótce</p>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Treść na ten miesiąc jest w przygotowaniu.
              </p>
            </div>
          </div>
        </div>
      )
    }
    if (tomorrowDateKey < APRIL_FIRST_DAY) return null
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-dark text-lg">Questy dnia</h2>
          <span className="font-sans text-[10px] text-gold/80 bg-gold-pale px-2.5 py-1 rounded-full font-medium tracking-wide uppercase">
            na zapas
          </span>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {quests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            done={tomorrowLog?.completedDailyQuests?.includes(quest.id) ?? false}
            onComplete={() => toggleTomorrowQuest(quest.id, quest.pillar, quest.xp)}
          />
        ))}
      </div>
    </div>
  )
}
