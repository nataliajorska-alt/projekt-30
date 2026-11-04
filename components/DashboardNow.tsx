'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { useQuestBook } from '@/hooks/useMonthPlans'
import {
  buildTodayRoutine, buildFocusQueue, computeDayProgress, selectTodayQuests,
  isEveningWindow, streakState, PHONE_ITEM_ID, type SlotSplit,
} from '@/lib/todayPlan'
import { crossedDayMilestone, countClaimed, emit, openFocus } from '@/lib/rewards'
import { getEffectiveNow, todayKey } from '@/lib/gameLogic'
import { SmallCaps, Diamond } from '@/components/ui'
import EveningClosing from '@/components/EveningClosing'

// Karta „Teraz" — jedna odpowiedź na „co teraz zrobić" i jeden przycisk, żeby
// to zrobić: pierścień postępu dnia, podgląd następnej rzeczy i wejście
// w tryb „Jedna rzecz". Priorytet etykiety: niedokończony poranek →
// niedokończony wieczór → dzień domknięty. Ta sama lista co RoutineChecklist
// i Questy dnia (lib/todayPlan), więc procenty zgadzają się z tym, co niżej.
export default function DashboardNow() {
  const { todayLog, stats, loading, streakFreezeAvailable } = useGameData()
  const { getEffectiveItems, loading: configLoading } = useRoutineConfig()
  const { log, skippedIds, loading: questsLoading } = useAprilQuests()
  const { book, loading: bookLoading } = useQuestBook()
  const [showClosing, setShowClosing] = useState(false)
  // Zegar co minutę i po powrocie do apki z tła — etykieta i „następne" zależą
  // od godziny, więc o 18:00 karta sama przechodzi w wieczór.
  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setClock(Date.now())
    const t = setInterval(tick, 60_000)
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  const today = todayKey()
  const ready = !loading && !!todayLog && !configLoading && !questsLoading && !bookLoading

  const view = useMemo(() => {
    if (!todayLog) return null
    const routine = buildTodayRoutine(getEffectiveItems, todayLog, getEffectiveNow())
    const { todayQuests, overdueQuests } = selectTodayQuests(book, log, skippedIds, today)
    const done = todayLog.completedRoutine ?? []
    const hour = new Date(clock).getHours()
    return {
      routine,
      progress: computeDayProgress(routine, done, todayQuests, log.completed),
      next: buildFocusQueue({
        routine, completedRoutine: done, todayQuests, overdueQuests, completedQuests: log.completed, hour,
      })[0] ?? null,
      hour,
    }
  }, [todayLog, getEffectiveItems, book, log, skippedIds, today, clock])

  // Połowa i całość dnia → świętowanie. Tylko gdy próg pęka w trakcie sesji
  // (nie przy otwarciu apki na 100%) i raz dziennie na urządzenie.
  const prevPct = useRef<number | null>(null)
  const pct = view?.progress.pct ?? 0
  useEffect(() => {
    if (!ready) return
    if (prevPct.current === null) { prevPct.current = pct; return }
    const m = crossedDayMilestone(prevPct.current, pct)
    prevPct.current = pct
    if (!m) return
    const key = `p30.dayMilestone.${today}`
    let best = 0
    try { best = Number(localStorage.getItem(key) ?? 0) } catch { /* prywatne okno */ }
    if (m <= best) return
    try { localStorage.setItem(key, String(m)) } catch { /* prywatne okno */ }
    emit('celebrate', m === 100
      ? { title: 'Dzień domknięty', sub: 'Wszystko z listy zrobione. Odpocznij z czystym sumieniem.', big: true }
      : { title: 'Połowa dnia za Tobą', sub: 'Jeszcze jedna rzecz z rozpędu?' })
  }, [ready, pct, today])

  if (!ready || !todayLog || !view) return null

  const done = todayLog.completedRoutine ?? []
  const isMinimum = todayLog.dayMode === 'minimum'
  // Mirror RoutineChecklist: pusty zbiór w trybie minimum = domknięty.
  // „Telefon po wstaniu" nie blokuje poranka — po fakcie i tak go nie będzie.
  const isDone = (split: SlotSplit, morning: boolean) => {
    let essential = split.essential
    if (morning) {
      const withoutPhone = essential.filter(i => i.id !== PHONE_ITEM_ID)
      if (withoutPhone.length > 0) essential = withoutPhone
    }
    return essential.length === 0 ? isMinimum : essential.every(i => done.includes(i.id))
  }
  const morningDone = isDone(view.routine.morning, true)
  const eveningDone = isDone(view.routine.evening, false)
  const eveningWindow = isEveningWindow(view.hour)

  let label: string
  if (!morningDone && !eveningWindow) label = 'dokończ poranny rytuał'
  else if (!eveningDone) label = eveningWindow ? 'czas na wieczorny rytuał' : 'poranek zrobiony — wróć wieczorem'
  else label = 'dzień domknięty — możesz odpocząć'

  // Seria: zaliczona dziś, czeka na dziś albo do uratowania zamrożeniem —
  // rano, przed pierwszym odhaczeniem, widać, o co gra się dzisiaj.
  const s = stats.currentStreak ?? 0
  const st = streakState(stats.lastStreakDate, s, today, streakFreezeAvailable)
  const streakNote = s < 2 ? null
    : st === 'kept' ? `seria ${s} dni`
    : st === 'pending' ? `seria ${s} dni · podtrzymaj ją`
    : st === 'rescuable' ? `seria ${s} dni · uratujesz ją dziś`
    : null

  const { progress, next } = view
  return (
    <>
      <NowCard
        pct={progress.pct}
        label={label}
        next={next ? { title: next.title, xp: next.xp * (isMinimum ? 2 : 1) } : null}
        done={progress.done}
        total={progress.total}
        streakNote={streakNote}
        lootToday={countClaimed(todayLog.rewardsClaimed, `loot_${today}_`)}
        eveningWindow={eveningWindow}
        onFocus={openFocus}
        onClosing={() => setShowClosing(true)}
      />
      {showClosing && <EveningClosing onClose={() => setShowClosing(false)} />}
    </>
  )
}

export interface NowCardProps {
  pct: number
  label: string
  next: { title: string; xp: number } | null
  done: number
  total: number
  streakNote: string | null
  lootToday: number
  eveningWindow: boolean
  onFocus: () => void
  onClosing: () => void
}

/** Sam wygląd karty — DashboardNow liczy dane, /design-system pokazuje przykład. */
export function NowCard({ pct, label, next, done, total, streakNote, lootToday, eveningWindow, onFocus, onClosing }: NowCardProps) {
  const R = 22
  const C = 2 * Math.PI * R
  return (
    <section className="border border-gold-light/50 bg-ivory px-4 py-4 sm:px-5 mb-5">
      <div className="flex items-center gap-4">
        {/* Pierścień postępu dnia */}
        <div className="relative shrink-0 w-[58px] h-[58px]" aria-label={`Postęp dnia ${pct}%`}>
          <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90" aria-hidden>
            <circle cx="26" cy="26" r={R} fill="none" stroke="#E5DCC1" strokeWidth="4" />
            <circle cx="26" cy="26" r={R} fill="none" stroke={pct >= 100 ? '#6B7D59' : '#B29355'}
              strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display italic text-[15px] text-dark tabular-nums">
            {pct}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">Teraz</SmallCaps>
            <span className="text-gold text-[9px] leading-none" aria-hidden="true">◆</span>
            <span className="font-serif-body italic text-[14.5px] text-dark leading-snug truncate">{label}</span>
          </div>
          {next ? (
            <p className="font-display text-dark text-[16px] leading-snug mt-1 line-clamp-2">
              <span className="font-ui uppercase tracking-luxury text-[9px] text-muted mr-1.5">następne</span>
              {next.title}
              <span className="font-display italic text-gold-deep text-[13px] ml-1.5">+{next.xp}</span>
            </p>
          ) : (
            <p className="font-serif-body italic text-muted text-[14px] mt-1">na tę porę dnia nic nie czeka</p>
          )}
          <p className="font-ui uppercase tracking-luxury text-[9px] text-muted-light mt-1.5">
            {done}/{total} dziś
            {streakNote && <> · {streakNote}</>}
            {lootToday > 0 && <> · ✦ {lootToday} {lootToday === 1 ? 'znalezisko' : lootToday < 5 ? 'znaleziska' : 'znalezisk'}</>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3.5">
        {next ? (
          <button
            onClick={onFocus}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-dark text-ivory border border-dark hover:bg-gold-deep hover:border-gold-deep transition-colors py-3"
          >
            <Play size={13} className="text-gold" />
            <span className="font-ui uppercase tracking-luxury text-[10.5px]">Jedna rzecz</span>
          </button>
        ) : (
          <span className="flex-1 inline-flex items-center gap-2 font-serif-body italic text-[14px] text-muted">
            <Diamond size={5} className="text-gold" filled /> wszystko na teraz odhaczone
          </span>
        )}
        {/* Wieczorne domknięcie: rutyna e1–e7 + „ostatni papieros dnia" na jednym
            ekranie. Przez całe okno wieczoru — także po domknięciu rutyny. */}
        {eveningWindow && (
          <button
            onClick={onClosing}
            className="shrink-0 border border-hairline hover:border-gold px-3.5 py-3 font-ui uppercase tracking-[0.28em] text-[9.5px] text-gold-deep hover:text-dark transition-colors"
          >
            domknij ◆
          </button>
        )}
      </div>
    </section>
  )
}
