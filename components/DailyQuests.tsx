'use client'
import { useState } from 'react'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { getAprilQuestsForDate, getOverdueAprilQuests } from '@/lib/aprilData'
import { getPillar } from '@/lib/pillars'
import { todayKey } from '@/lib/gameLogic'
import { Check, Clock, SkipForward, CalendarClock, X, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import type { AprilQuest } from '@/lib/aprilData'

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
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-elegant-lg w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Pominięcie questa</p>
            <h3 className="font-serif text-dark text-base">{quest.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors ml-3 flex-shrink-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <p className="font-sans text-sm text-muted mb-4">
          Dlaczego pomijasz to zadanie? (opcjonalnie)
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="np. nie miałam czasu, zrobiłam to inaczej, nie pasuje na teraz..."
          className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-dark text-ivory font-sans text-sm py-3 rounded-xl hover:bg-forest transition-colors"
          >
            Pomiń zadanie
          </button>
          <button
            onClick={onClose}
            className="border border-border text-muted font-sans text-sm px-4 py-3 rounded-xl hover:border-dark hover:text-dark transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestCard({ quest, done, overdue, onComplete, onSkip, onPostpone }: {
  quest: AprilQuest
  done: boolean
  overdue: boolean
  onComplete: () => void
  onSkip: () => void
  onPostpone: () => void
}) {
  const pillar = getPillar(quest.pillar)

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-all',
      done ? 'border-gold/30 bg-gold-pale' :
      overdue ? 'border-amber-200 bg-amber-50/60' :
      'border-border bg-cream/30'
    )}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {overdue && (
              <div className="flex items-center gap-1 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                <Clock size={10} className="text-amber-600" strokeWidth={2} />
                <span className="font-sans text-[10px] text-amber-700 font-medium uppercase tracking-wide">
                  zaległe · {quest.date.slice(5).replace('-', '.')}
                </span>
              </div>
            )}
            <span className="text-[10px] font-sans uppercase tracking-widest font-medium" style={{ color: pillar.color }}>
              {pillar.icon} {pillar.shortName}
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
        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 rounded-xl hover:bg-forest transition-colors"
          >
            <Check size={13} strokeWidth={2} /> Zrobione
          </button>
          <button
            onClick={onPostpone}
            title="Przenieś na jutro"
            className="flex items-center gap-1.5 border border-border text-muted font-sans text-xs px-3 py-2.5 rounded-xl hover:border-dark hover:text-dark transition-colors"
          >
            <CalendarClock size={13} strokeWidth={1.5} />
          </button>
          <button
            onClick={onSkip}
            title="Pomiń (podaj powód)"
            className="flex items-center gap-1.5 border border-border text-muted font-sans text-xs px-3 py-2.5 rounded-xl hover:border-dark hover:text-dark transition-colors"
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
  const [skipTarget, setSkipTarget] = useState<AprilQuest | null>(null)
  const [postponedToday, setPostponedToday] = useState<string[]>([])
  const today = todayKey()

  const todayQuests = getAprilQuestsForDate(today)
  const overdueQuests = getOverdueAprilQuests(today, log.completed, skippedIds, log.postponed)

  // Postponed questy z poprzednich dni wracają w overdue automatycznie

  if (loading) return null

  // Po 30 kwietnia: pokazujemy elegancki placeholder zamiast ukrywać sekcję.
  if (todayQuests.length === 0 && overdueQuests.length === 0) {
    if (today > APRIL_LAST_DAY) {
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
                Treść na ten miesiąc jest w przygotowaniu. W międzyczasie skup się na rutynie, zasadach i side questach.
              </p>
            </div>
          </div>
        </div>
      )
    }
    // Przed startem projektu — ukrywamy sekcję jak dotąd.
    if (today < APRIL_FIRST_DAY) return null
    return null
  }

  const handlePostpone = async (quest: AprilQuest) => {
    setPostponedToday(p => [...p, quest.id])
    await postponeQuest(quest.id)
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
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* Zaległe */}
          {overdueQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              done={log.completed.includes(quest.id)}
              overdue={true}
              onComplete={() => completeQuest(quest.id, quest.pillar)}
              onSkip={() => setSkipTarget(quest)}
              onPostpone={() => handlePostpone(quest)}
            />
          ))}

          {/* Dzisiejsze */}
          {todayQuests
            .filter(q => !postponedToday.includes(q.id))
            .map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                done={log.completed.includes(quest.id)}
                overdue={false}
                onComplete={() => completeQuest(quest.id, quest.pillar)}
                onSkip={() => setSkipTarget(quest)}
                onPostpone={() => handlePostpone(quest)}
              />
            ))}

          {/* Info o przeniesionych */}
          {postponedToday.length > 0 && (
            <p className="font-sans text-xs text-muted-light text-center pt-1">
              {postponedToday.length} {postponedToday.length === 1 ? 'quest przeniesiony' : 'questy przeniesione'} na jutro
            </p>
          )}
        </div>
      </div>
    </>
  )
}
