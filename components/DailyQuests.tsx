'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { useGameData } from '@/hooks/useGameData'
import Link from 'next/link'
import { useQuestBook } from '@/hooks/useMonthPlans'
import { nextMonthKey } from '@/lib/monthPlanner'
import { QUEST_MUSCLE_LABEL, type QuestBook } from '@/lib/seasonal/aprilData'
import { getPillar } from '@/lib/pillars'
import { todayKey } from '@/lib/gameLogic'
import { Clock } from 'lucide-react'
import { Fleuron } from '@/components/ui'
import PostponeModal from '@/components/PostponeModal'
import SkipModal from '@/components/SkipModal'
import type { AprilQuest } from '@/lib/seasonal/aprilData'

// Ile dni przed końcem miesiąca przypominamy, że następny nie ma planu.
const PLAN_AHEAD_DAYS = 7

/** Notka pod listą: „ten miesiąc bez planu" albo „następny miesiąc bez planu" + link do /plan. */
function planNote(today: string, book: QuestBook): { text: string; month: string } | null {
  const [y, m, d] = today.split('-').map(Number)
  const monthKey = today.slice(0, 7)
  if (!book.isPlannedMonth(monthKey)) {
    const name = book.monthMeta(monthKey)?.name
    return {
      text: `${name ? `„${name}" nie ma` : 'Ten miesiąc nie ma'} jeszcze planu — to stałe propozycje, żeby rytm nie stanął.`,
      month: monthKey,
    }
  }
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const left = daysInMonth - d + 1
  if (left > PLAN_AHEAD_DAYS) return null
  const next = nextMonthKey(monthKey)
  if (book.isPlannedMonth(next)) return null
  const name = book.monthMeta(next)?.name
  const when = left === 1 ? 'Od jutra' : `Za ${left} dni`
  return { text: `${when} ${name ? `„${name}"` : 'nowy miesiąc'} — rozpisz go, zanim się zacznie.`, month: next }
}

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
    // Telefon: tekst na całą szerokość, pod nim rząd „XP — akcje". Wcześniej
    // trzy przyciski stały OBOK tekstu i zostawiały mu ~150 px: tytuł łamał się
    // na dwa–trzy wiersze, opis na cztery. Od `sm` w górę — dwie kolumny jak dotąd.
    <div
      className={clsx(
        'py-4 sm:grid sm:grid-cols-[1fr_auto] sm:gap-5 sm:items-start',
        !isLast && 'border-b border-border/60',
      )}
    >
      {/* Main column */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
          {overdue && (
            <span className="inline-flex items-center gap-1 border border-wine/30 px-1.5 py-0.5">
              <Clock size={9} className="text-wine" strokeWidth={2} />
              <span className="font-ui uppercase tracking-luxury text-[9px] text-wine">
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
          {quest.muscles?.map(m => (
            <span
              key={m}
              title={`Mięsień ${m}: ${QUEST_MUSCLE_LABEL[m]}`}
              className={clsx(
                'inline-flex items-center gap-1 border px-1.5 py-0.5 font-ui uppercase tracking-luxury text-[9px]',
                done ? 'border-hairline text-muted-light' : 'border-gold-light/60 text-gold-deep',
              )}
            >
              <span className="font-medium">{m}</span>
              <span className="hidden sm:inline">· {QUEST_MUSCLE_LABEL[m]}</span>
            </span>
          ))}
        </div>
        <h3
          className={clsx(
            'font-display text-[18px] sm:text-[20px] leading-tight tracking-tight',
            // Natywne line-through: dekoracja rysuje się per linia tekstu, więc
            // działa też na tytułach zawijanych na 2+ wiersze (absolutna kreska nie).
            done ? 'text-muted-light italic line-through decoration-dark/40 decoration-1' : 'text-dark',
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

      {/* XP + akcje (albo „ukończone") — rząd pod tekstem na telefonie, prawa kolumna od sm */}
      <div className="mt-3 flex items-center justify-between gap-3 shrink-0 sm:mt-0 sm:flex-col sm:items-end sm:justify-start sm:gap-2.5 sm:text-right">
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
              className="inline-flex items-center justify-center border border-hairline text-gold-deep px-3 py-2.5 sm:px-2 sm:py-1.5 hover:border-gold hover:text-dark transition-colors"
            >
              <PostponeIcon />
            </button>
            <button
              onClick={onSkip}
              title="Pomiń"
              aria-label="Pomiń quest"
              className="inline-flex items-center justify-center border border-hairline text-gold-deep px-3 py-2.5 sm:px-2 sm:py-1.5 hover:border-gold hover:text-dark transition-colors"
            >
              <SkipIcon />
            </button>
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-1.5 bg-dark text-ivory border border-dark hover:bg-gold-deep hover:border-gold-deep transition-colors px-4 py-2.5 sm:px-3 sm:py-1.5"
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
  const { book, loading: bookLoading } = useQuestBook()
  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'
  const [skipTarget, setSkipTarget] = useState<AprilQuest | null>(null)
  const [postponeTarget, setPostponeTarget] = useState<AprilQuest | null>(null)
  const today = todayKey()

  const nativeToday = book.questsForDate(today)
  const postponedToToday = book.postponedForDate(today, log.postponed)
  const postponedAwayIds = log.postponed.filter(p => p.targetDate > today).map(p => p.questId)

  const todayQuests = [
    ...nativeToday.filter(q => !postponedAwayIds.includes(q.id)),
    ...postponedToToday.filter(q => !nativeToday.some(n => n.id === q.id)),
  ].filter(q => !skippedIds.includes(q.id))
  const overdueQuests = book.overdue(today, log.completed, skippedIds, log.postponed)

  // Czekamy też na plany z apki — inaczej przez chwilę mignęłyby stałe propozycje.
  if (loading || bookLoading) return null

  // Pusto tylko, gdy plan tak chce (dzień bez questów) albo wszystko pominięte.
  if (todayQuests.length === 0 && overdueQuests.length === 0) return null

  const allQuests = [...overdueQuests, ...todayQuests]
  const note = planNote(today, book)
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
              onComplete={() => completeQuest(quest.id, quest.pillar, quest.xp)}
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

        {note && (
          <p className="flex items-center justify-center gap-2 py-4 border-t border-border/60 font-serif-body italic text-muted text-[13px] text-center leading-relaxed">
            <Fleuron size={11} className="text-gold shrink-0" />
            <span>
              {note.text}{' '}
              <Link href={`/plan?month=${note.month}`} className="not-italic font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:text-dark whitespace-nowrap">
                Rozpisz →
              </Link>
            </span>
          </p>
        )}
      </section>
    </>
  )
}
