'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useTomorrowData } from '@/hooks/useTomorrowData'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { getAprilQuestsForDate, getPostponedQuestsForDate } from '@/lib/seasonal/aprilData'
import { getPillar } from '@/lib/pillars'
import { todayKey } from '@/lib/gameLogic'
import type { AprilQuest } from '@/lib/seasonal/aprilData'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'
import PostponeModal, { addDaysKey } from '@/components/PostponeModal'
import SkipModal from '@/components/SkipModal'

const APRIL_LAST_DAY  = '2026-04-30'
const APRIL_FIRST_DAY = '2026-04-05'

function QuestCard({ quest, done, postponed, onComplete, onPostpone, onSkip }: {
  quest: AprilQuest
  done: boolean
  postponed?: boolean
  onComplete: () => void
  onPostpone: () => void
  onSkip: () => void
}) {
  const pillar = getPillar(quest.pillar)
  return (
    <div
      className={clsx(
        'border p-5 transition-all',
        done ? 'border-gold bg-gold-pale/40' : 'border-hairline bg-cream/30'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: pillar.color }}
            >
              <Diamond size={5} />
              <span className="font-ui uppercase tracking-luxury text-[10px]">
                {pillar.shortName}
              </span>
            </span>
            {postponed && (
              <span className="font-ui uppercase tracking-luxury text-[9px] text-gold-deep border border-gold-light/50 px-1.5 py-0.5">
                przeniesione
              </span>
            )}
          </span>
          <h3
            className={clsx(
              'font-heading text-[17px] leading-snug mt-1.5',
              done ? 'text-muted line-through decoration-1' : 'text-dark'
            )}
          >
            {quest.title}
          </h3>
        </div>
        <SmallCaps tone={done ? 'gold' : 'muted'} tracking="luxury" size="xs" className="shrink-0">
          + {quest.xp} XP
        </SmallCaps>
      </div>

      <p className="font-serif-body italic text-muted text-[13.5px] leading-relaxed mb-4">
        {quest.description}
      </p>

      {done ? (
        <div className="flex items-center gap-2">
          <Diamond size={6} className="text-gold" filled />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            już zrobione
          </SmallCaps>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-4 hover:bg-forest transition-colors"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              zrobione na zapas
            </SmallCaps>
          </button>
          <button
            onClick={onPostpone}
            title="Przenieś na inny dzień"
            aria-label="Przenieś na inny dzień"
            className="inline-flex items-center border border-hairline text-gold-deep py-2.5 px-4 hover:border-gold hover:text-dark transition-colors"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              przenieś
            </SmallCaps>
          </button>
          <button
            onClick={onSkip}
            title="Pomiń to zadanie"
            aria-label="Pomiń to zadanie"
            className="inline-flex items-center border border-hairline text-muted py-2.5 px-4 hover:border-gold hover:text-dark transition-colors"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              pomiń
            </SmallCaps>
          </button>
        </div>
      )}
    </div>
  )
}

export default function TomorrowQuests() {
  const { tomorrowLog, tomorrowDateKey, loading, toggleTomorrowQuest } = useTomorrowData()
  const { log, skippedIds, loading: questsLoading, postponeQuest, skipQuest } = useAprilQuests()
  const [postponeTarget, setPostponeTarget] = useState<AprilQuest | null>(null)
  const [skipTarget, setSkipTarget] = useState<AprilQuest | null>(null)

  if (loading || questsLoading) return null

  const native = getAprilQuestsForDate(tomorrowDateKey)
  const postponedToTomorrow = getPostponedQuestsForDate(tomorrowDateKey, log.postponed)
  // Quest natywnie na jutro, ale przeniesiony jeszcze dalej — nie pokazuj go jutro
  const postponedAwayIds = log.postponed
    .filter(p => p.targetDate > tomorrowDateKey)
    .map(p => p.questId)
  const postponedIds = new Set(postponedToTomorrow.map(q => q.id))

  const quests = [
    ...native.filter(q => !postponedAwayIds.includes(q.id)),
    ...postponedToTomorrow.filter(q => !native.some(n => n.id === q.id)),
  ].filter(q => !skippedIds.includes(q.id))

  if (quests.length === 0) {
    if (tomorrowDateKey > APRIL_LAST_DAY) {
      return (
        <div className="bg-ivory border border-gold-light/40 mb-4">
          <div className="px-5 pt-5 pb-3 flex items-baseline gap-3">
            <h2 className="font-heading text-dark text-xl whitespace-nowrap">Questy dnia</h2>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              na zapas
            </SmallCaps>
          </div>
          <div className="px-5 pb-5">
            <div className="border border-gold-light/30 bg-gold-pale/30 p-6 text-center">
              <Fleuron size={14} className="text-gold mx-auto mb-3 inline-block" />
              <h3 className="font-heading text-dark text-lg">Nowy rozdział wkrótce</h3>
              <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
                treść na ten miesiąc jest w przygotowaniu.
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
    <>
      {postponeTarget && (
        <PostponeModal
          quest={postponeTarget}
          today={todayKey()}
          minDate={addDaysKey(tomorrowDateKey, 1)}
          onConfirm={async (targetDate) => {
            await postponeQuest(postponeTarget.id, postponeTarget.date, targetDate)
            setPostponeTarget(null)
          }}
          onClose={() => setPostponeTarget(null)}
        />
      )}

      {skipTarget && (
        <SkipModal
          quest={skipTarget}
          onConfirm={async (reason) => {
            await skipQuest(skipTarget.id, reason)
            setSkipTarget(null)
          }}
          onClose={() => setSkipTarget(null)}
        />
      )}

      <div className="bg-ivory border border-gold-light/40 mb-4">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <h2 className="font-heading text-dark text-xl whitespace-nowrap">Questy dnia</h2>
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                na zapas
              </SmallCaps>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {quests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              done={tomorrowLog?.completedDailyQuests?.includes(quest.id) ?? false}
              postponed={postponedIds.has(quest.id)}
              onComplete={() => toggleTomorrowQuest(quest.id, quest.pillar, quest.xp)}
              onPostpone={() => setPostponeTarget(quest)}
              onSkip={() => setSkipTarget(quest)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
