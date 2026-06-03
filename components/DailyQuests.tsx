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
import { todayKey } from '@/lib/gameLogic'
import { Clock, X } from 'lucide-react'
import { SmallCaps, Fleuron, Diamond } from '@/components/ui'
import PostponeModal from '@/components/PostponeModal'
import type { AprilQuest } from '@/lib/seasonal/aprilData'

const APRIL_LAST_DAY = '2026-04-30'
const APRIL_FIRST_DAY = '2026-04-05'

/* ── Inline SVG icons matching the design ─────────────────────────── */
function PostponeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5.5" width="17" height="15" rx="0.5" />
      <line x1="3.5" y1="10" x2="20.5" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <path d="M 12 13 L 16 16 L 12 19" />
    </svg>
  )
}
function SkipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 5 6 L 14 12 L 5 18 Z" />
      <line x1="18" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ── Skip modal (unchanged behavior) ───────────────────────────────── */
function SkipModal({
  quest,
  onConfirm,
  onClose,
}: {
  quest: AprilQuest
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-6 md:pb-0">
      <div className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm" onClick={onClose} />
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

/* ── Quest row — editorial, no card-in-card ───────────────────────── */
function QuestRow({
  quest,
  done,
  overdue,
  isMinimum,
  isLast,
  onComplete,
  onSkip,
  onPostpone,
}: {
  quest: AprilQuest
  done: boolean
  overdue: boolean
  isMinimum: boolean
  isLast: boolean
  onComplete: () => void
  onSkip: () => void
  onPostpone: () => void
}) {
  const pillar = getPillar(quest.pillar)
  const xp = isMinimum && !done ? quest.xp * 2 : quest.xp

  return (
    <div
      className={clsx(
        'grid grid-cols-[1fr_auto] gap-4 sm:gap-5 py-4 items-start',
        !isLast && 'border-b border-border/60',
      )}
    >
      {/* Main column */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
          {overdue && (
            <span className="inline-flex items-center gap-1 border border-amber-300/60 px-1.5 py-0.5">
              <Clock size={9} className="text-amber-700" strokeWidth={2} />
              <span className="font-ui uppercase tracking-luxury text-[9px] text-amber-700">
                zaległe · {quest.date.slice(5).replace('-', '.')}
              </span>
            </span>
          )}
          <span
            className={clsx(
              'inline-flex items-center gap-2 font-ui uppercase tracking-[0.36em] text-[10px] before:content-["◆"] before:text-[8px]',
              done ? 'text-muted-light' : '',
            )}
            style={!done ? { color: pillar.color } : undefined}
          >
            <span className="ml-0">{pillar.shortName}</span>
          </span>
        </div>
        <h3
          className={clsx(
            'font-display text-[18px] sm:text-[20px] leading-tight tracking-tight',
            done ? 'text-muted-light italic' : 'text-dark',
          )}
        >
          {quest.title}
        </h3>
        <p
          className={clsx(
            'font-serif-body italic text-[13.5px] leading-relaxed mt-1.5 max-w-[64ch]',
            done ? 'text-muted-light' : 'text-muted',
          )}
        >
          {quest.description}
        </p>
      </div>

      {/* Right column — XP + actions or check-mark */}
      <div className="flex flex-col items-end gap-2.5 text-right shrink-0">
        <div
          className={clsx(
            'font-display italic font-medium text-[18px] tracking-tight',
            done ? 'text-muted-light' : 'text-gold-deep',
          )}
        >
          +{xp}
          <span className="ml-1 font-ui not-italic uppercase tracking-luxury text-[9px] text-muted-light">
            XP
          </span>
          {isMinimum && !done && (
            <span className="ml-1.5 font-ui not-italic uppercase tracking-luxury text-[9px] text-muted-light">
              ×&nbsp;II
            </span>
          )}
        </div>

        {done ? (
          <span className="font-display italic text-gold text-[15px] leading-none">
            ∴ ukończone
          </span>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={onPostpone}
              title="Przenieś na inny dzień"
              aria-label="Przenieś na inny dzień"
              className="inline-flex items-center justify-center border border-hairline text-gold-deep px-2 py-1.5 hover:border-gold hover:text-dark transition-colors"
            >
              <PostponeIcon />
            </button>
            <button
              onClick={onSkip}
              title="Pomiń"
              aria-label="Pomiń quest"
              className="inline-flex items-center justify-center border border-hairline text-gold-deep px-2 py-1.5 hover:border-gold hover:text-dark transition-colors"
            >
              <SkipIcon />
            </button>
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-1.5 bg-dark text-ivory border border-dark hover:bg-gold-deep hover:border-gold-deep transition-colors px-3 py-1.5"
            >
              <span className="text-gold text-[9px] leading-none">◆</span>
              <span className="font-ui uppercase tracking-luxury text-[10px]">Zrobione</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DailyQuests() {
  const { log, skippedIds, loading, completeQuest, skipQuest, postponeQuest } = useAprilQuests()
  const { todayLog } = useGameData()
  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'
  const [skipTarget, setSkipTarget] = useState<AprilQuest | null>(null)
  const [postponeTarget, setPostponeTarget] = useState<AprilQuest | null>(null)
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
              today&apos;s quests
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

  const allQuests = [...overdueQuests, ...todayQuests]
  const completedCount = allQuests.filter(q => log.completed.includes(q.id)).length
  const earnedXP = allQuests
    .filter(q => log.completed.includes(q.id))
    .reduce((s, q) => s + (isMinimum ? q.xp * 2 : q.xp), 0)

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

      {postponeTarget && (
        <PostponeModal
          quest={postponeTarget}
          today={today}
          onConfirm={async (targetDate) => {
            await postponeQuest(postponeTarget.id, postponeTarget.date, targetDate)
            setPostponeTarget(null)
          }}
          onClose={() => setPostponeTarget(null)}
        />
      )}

      <section className="mb-4 border-t border-b border-hairline/70 py-1">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-3 py-4 border-b border-border/60">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="font-display text-dark text-2xl sm:text-[26px] leading-none tracking-tight whitespace-nowrap">
              Questy dnia
            </h2>
            <span className="hidden sm:inline font-serif-body italic text-muted text-[13px]">
              today&apos;s quests
            </span>
          </div>
          <div className="font-ui uppercase tracking-luxury text-[10px] text-muted text-right shrink-0">
            <span className="font-display not-italic text-gold-deep text-sm tracking-normal normal-case mr-1">
              {completedCount} / {allQuests.length}
            </span>
            ukończone
            {earnedXP > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="font-display not-italic text-gold-deep text-sm tracking-normal normal-case">
                  +{earnedXP}
                </span>{' '}
                XP
              </>
            )}
          </div>
        </div>

        {/* Quest rows */}
        <div>
          {allQuests.map((quest, i) => (
            <QuestRow
              key={quest.id}
              quest={quest}
              done={log.completed.includes(quest.id)}
              overdue={overdueQuests.some(o => o.id === quest.id)}
              isMinimum={isMinimum}
              isLast={i === allQuests.length - 1}
              onComplete={() => completeQuest(quest.id, quest.pillar)}
              onSkip={() => setSkipTarget(quest)}
              onPostpone={() => setPostponeTarget(quest)}
            />
          ))}
        </div>

        {postponedAwayIds.length > 0 && (
          <p className="text-center py-4 font-serif-body italic text-muted-light text-[13px]">
            — {postponedAwayIds.length}{' '}
            {postponedAwayIds.length === 1 ? 'quest przeniesiony' : 'questy przeniesione'} na później —
          </p>
        )}
      </section>
    </>
  )
}
