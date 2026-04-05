'use client'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { getAprilQuestsForDate, getOverdueAprilQuests } from '@/lib/aprilData'
import { getPillar } from '@/lib/pillars'
import { todayKey } from '@/lib/gameLogic'
import { Check, Clock, SkipForward } from 'lucide-react'
import clsx from 'clsx'

export default function DailyQuests() {
  const { log, loading, completeQuest, skipQuest } = useAprilQuests()
  const today = todayKey()

  const todayQuests = getAprilQuestsForDate(today)
  const overdueQuests = getOverdueAprilQuests(today, log.completed, log.skipped)

  if (loading) return null
  if (todayQuests.length === 0 && overdueQuests.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-dark text-lg">Questy dnia</h2>
          <div className="flex items-center gap-2">
            {overdueQuests.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Clock size={11} className="text-amber-600" strokeWidth={2} />
                <span className="font-sans text-xs text-amber-700 font-medium">{overdueQuests.length} zaległe</span>
              </div>
            )}
            <span className="font-sans text-[11px] text-muted-light uppercase tracking-wider">
              {today.slice(5).replace('-', '.')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        {/* Zaległe */}
        {overdueQuests.map(quest => {
          const pillar = getPillar(quest.pillar)
          return (
            <div key={quest.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Clock size={10} className="text-amber-600" strokeWidth={2} />
                  <span className="font-sans text-[10px] text-amber-700 font-medium uppercase tracking-wide">zaległe · {quest.date.slice(5).replace('-', '.')}</span>
                </div>
                <span className="text-[10px] font-sans" style={{ color: pillar.color }}>
                  {pillar.icon} {pillar.shortName}
                </span>
              </div>
              <h3 className="font-serif text-dark text-sm mb-1">{quest.title}</h3>
              <p className="font-sans text-xs text-muted leading-relaxed mb-3">{quest.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => completeQuest(quest.id, quest.pillar, quest.xp)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-dark text-ivory font-sans text-xs py-2.5 rounded-xl hover:bg-forest transition-colors"
                >
                  <Check size={12} strokeWidth={2} /> Zrobione · +{quest.xp} XP
                </button>
                <button
                  onClick={() => skipQuest(quest.id)}
                  className="flex items-center gap-1.5 border border-border text-muted-light font-sans text-xs px-3 py-2.5 rounded-xl hover:border-dark hover:text-muted transition-colors"
                  title="Pomiń — nie będzie się powtarzało"
                >
                  <SkipForward size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )
        })}

        {/* Dzisiejsze */}
        {todayQuests.map(quest => {
          const done = log.completed.includes(quest.id)
          const pillar = getPillar(quest.pillar)
          return (
            <div
              key={quest.id}
              className={clsx(
                'rounded-xl border p-4 transition-all',
                done ? 'border-gold/30 bg-gold-pale' : 'border-border bg-cream/30'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{pillar.icon}</span>
                    <span className="text-[10px] font-sans uppercase tracking-widest font-medium" style={{ color: pillar.color }}>
                      {pillar.shortName}
                    </span>
                  </div>
                  <h3 className={clsx('font-serif text-base', done ? 'text-muted line-through' : 'text-dark')}>
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
                  <Check size={13} strokeWidth={2} /> Ukończone
                </div>
              ) : (
                <button
                  onClick={() => completeQuest(quest.id, quest.pillar, quest.xp)}
                  className="w-full flex items-center justify-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 rounded-xl hover:bg-forest transition-colors"
                >
                  <Check size={14} strokeWidth={2} /> Oznacz jako zrobione
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
