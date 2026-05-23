'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { useGameData } from '@/hooks/useGameData'
import {
  getAprilQuestsForDate,
  getOverdueAprilQuests,
  getPostponedQuestsForDate,
} from '@/lib/seasonal/aprilData'
import { getPillar } from '@/lib/pillars'
import { todayKey, dateKey } from '@/lib/gameLogic'
import { Clock, SkipForward, CalendarClock, X } from 'lucide-react'
import { SmallCaps, Fleuron, Diamond } from '@/components/ui'
import type { AprilQuest } from '@/lib/seasonal/aprilData'

const APRIL_LAST_DAY = '2026-04-30'
const APRIL_FIRST_DAY = '2026-04-05'

function SkipModal({ quest, onConfirm, onClose }: {
  quest: AprilQuest
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-6 md:pb-0">
      <div
        className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-ivory border border-gold-light/40 w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Pominięcie questa
            </SmallCaps>
            <h3 className="font-heading text-dark text-base mt-1">{quest.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-light hover:text-dark transition-colors ml-3 flex-shrink-0"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <p className="font-serif-body italic text-muted text-[13px] mb-4">
          dlaczego pomijasz to zadanie? (opcjonalnie)
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="np. nie miałam czasu, zrobiłam to inaczej, nie pasuje na teraz…"
          className="w-full border border-hairline px-4 py-3 font-serif-body text-[14px] text-dark bg-cream/40 placeholder:text-muted-light/70 focus:outline-none focus:border-gold transition-colors resize-none mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-dark-deep text-ivory border border-gold py-3 hover:bg-forest transition-colors flex items-center justify-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              Pomiń zadanie
            </SmallCaps>
          </button>
          <button
            onClick={onClose}
            className="border border-hairline text-muted px-4 py-3 hover:border-gold hover:text-dark transition-colors"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              Anuluj
            </SmallCaps>
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestCard({
  quest, done, overdue, isMinimum, onComplete, onSkip, onPostpone,
}: {
  quest: AprilQuest
  done: boolean
  overdue: boolean
  isMinimum: boolean
  onComplete: () => void
  onSkip: () => void
  onPostpone: () => void
}) {
  const pillar = getPillar(quest.pillar)
  const borderClass = done
    ? 'border-gold'
    : overdue
      ? 'border-amber-300/70'
      : 'border-hairline'
  const bgClass = done
    ? 'bg-gold-pale/40'
    : overdue
      ? 'bg-amber-50/40'
      : 'bg-cream/30'

  return (
    <div className={clsx('border p-4 transition-all', borderClass, bgClass)}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {overdue && (
              <div className="flex items-center gap-1 border border-amber-300 px-2 py-0.5">
                <Clock size={9} className="text-amber-700" strokeWidth={2} />
                <SmallCaps tone="dark" tracking="luxury" size="xs" className="text-amber-700">
                  zaległe · {quest.date.slice(5).replace('-', '.')}
                </SmallCaps>
              </div>
            )}
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: pillar.color }}
            >
              <Diamond size={5} />
              <span className="font-ui uppercase tracking-luxury text-[10px]">
                {pillar.shortName}
              </span>
            </span>
          </div>
          <h3
            className={clsx(
              'font-heading text-[17px] leading-snug',
              done ? 'text-muted line-through decoration-1' : 'text-dark'
            )}
          >
            {quest.title}
          </h3>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 mt-1 gap-0.5">
          <SmallCaps
            tone={done ? 'gold' : 'muted'}
            tracking="luxury"
            size="xs"
          >
            + {isMinimum ? quest.xp * 2 : quest.xp} XP
          </SmallCaps>
          {isMinimum && !done && (
            <SmallCaps tone="muted" size="xs" className="opacity-70">
              × II
            </SmallCaps>
          )}
        </div>
      </div>

      <p className="font-serif-body italic text-muted text-[13.5px] leading-relaxed mb-4">
        {quest.description}
      </p>

      {done ? (
        <div className="flex items-center gap-2">
          <Diamond size={6} className="text-gold" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            ukończone
          </SmallCaps>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-2 bg-dark-deep border border-gold text-ivory py-2.5 hover:bg-forest transition-colors"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              zrobione
            </SmallCaps>
          </button>
          <button
            onClick={onPostpone}
            title="Przenieś na jutro"
            className="flex items-center gap-1.5 border border-hairline text-muted px-3 py-2.5 hover:border-gold hover:text-dark transition-colors"
          >
            <CalendarClock size={13} strokeWidth={1.5} />
          </button>
          <button
            onClick={onSkip}
            title="Pomiń (podaj powód)"
            className="flex items-center gap-1.5 border border-hairline text-muted px-3 py-2.5 hover:border-gold hover:text-dark transition-colors"
          >
            <SkipForward size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function DailyQuests() {
  const { log, skippedIds, loading, completeQuest, skipQuest, postponeQuest } = useAprilQuests()
  const { todayLog } = useGameData()
  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'
  const [skipTarget, setSkipTarget] = useState<AprilQuest | null>(null)
  const today = todayKey()

  const nativeToday = getAprilQuestsForDate(today)
  const postponedToToday = getPostponedQuestsForDate(today, log.postponed)
  const postponedAwayIds = log.postponed.filter(p => p.targetDate > today).map(p => p.questId)

  const todayQuests = [
    ...nativeToday.filter(q => !postponedAwayIds.includes(q.id)),
    ...postponedToToday.filter(q => !nativeToday.some(n => n.id === q.id)),
  ].filter(q => !skippedIds.includes(q.id))
  const overdueQuests = getOverdueAprilQuests(today, log.completed, skippedIds, log.postponed)

  if (loading) return null

  if (todayQuests.length === 0 && overdueQuests.length === 0) {
    if (today > APRIL_LAST_DAY) {
      return (
        <div className="bg-ivory border border-gold-light/40 mb-4">
          <div className="px-5 pt-5 pb-3 flex items-baseline gap-3">
            <h2 className="font-heading text-dark text-xl whitespace-nowrap">Questy dnia</h2>
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="hidden sm:inline">
              today's quests
            </SmallCaps>
          </div>
          <div className="px-5 pb-5">
            <div className="border border-gold-light/30 bg-gold-pale/30 p-6 text-center">
              <Fleuron size={14} className="text-gold mx-auto mb-3 inline-block" />
              <h3 className="font-heading text-dark text-lg">Nowy rozdział wkrótce</h3>
              <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
                treść na ten miesiąc jest w przygotowaniu. w międzyczasie skup się na rutynie, zasadach i side questach.
              </p>
            </div>
          </div>
        </div>
      )
    }
    if (today < APRIL_FIRST_DAY) return null
    return null
  }

  const handlePostpone = async (quest: AprilQuest) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowKey = dateKey(tomorrow)
    await postponeQuest(quest.id, quest.date, tomorrowKey)
  }

  return (
    <>
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
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <h2 className="font-heading text-dark text-xl whitespace-nowrap">Questy dnia</h2>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="hidden sm:inline">
                today's quests
              </SmallCaps>
            </div>
            {overdueQuests.length > 0 && (
              <div className="flex items-center gap-1.5 border border-amber-300 px-2.5 py-1 shrink-0">
                <Clock size={10} className="text-amber-700" strokeWidth={2} />
                <SmallCaps tracking="luxury" size="xs" className="!text-amber-700">
                  {overdueQuests.length} zaległe
                </SmallCaps>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {overdueQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              done={log.completed.includes(quest.id)}
              overdue={true}
              isMinimum={isMinimum}
              onComplete={() => completeQuest(quest.id, quest.pillar)}
              onSkip={() => setSkipTarget(quest)}
              onPostpone={() => handlePostpone(quest)}
            />
          ))}

          {todayQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              done={log.completed.includes(quest.id)}
              overdue={false}
              isMinimum={isMinimum}
              onComplete={() => completeQuest(quest.id, quest.pillar)}
              onSkip={() => setSkipTarget(quest)}
              onPostpone={() => handlePostpone(quest)}
            />
          ))}

          {postponedAwayIds.length > 0 && (
            <p className="font-serif-body italic text-muted-light text-[12px] text-center pt-1">
              {postponedAwayIds.length}{' '}
              {postponedAwayIds.length === 1 ? 'quest przeniesiony' : 'questy przeniesione'} na jutro
            </p>
          )}
        </div>
      </div>
    </>
  )
}
