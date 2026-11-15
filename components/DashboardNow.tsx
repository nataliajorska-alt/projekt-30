'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
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
import { getEffectiveNow, todayKey, getLevelFromXP, getLevelProgress } from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'
import GardenArt from '@/components/GardenArt'
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
  const streakHint = s < 2 ? null
    : st === 'pending' ? 'podtrzymaj serię — wystarczy jedna rzecz'
    : st === 'rescuable' ? 'serię uratujesz jeszcze dziś'
    : null
  const level = getLevelFromXP(stats.totalXP)

  const { progress, next } = view
  return (
    <>
      <NowCard
        pct={progress.pct}
        label={label}
        next={next ? { title: next.title, xp: next.xp * (isMinimum ? 2 : 1) } : null}
        done={progress.done}
        total={progress.total}
        streak={st === 'none' ? 0 : s}
        streakHint={streakHint}
        xpToday={todayLog.totalXP ?? 0}
        level={{ num: level.level, name: level.name, pct: getLevelProgress(stats.totalXP) }}
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
  /** Długość serii (0 = brak) i ewentualna zachęta pod statystykami. */
  streak?: number
  streakHint?: string | null
  xpToday?: number
  level?: { num: number; name: string; pct: number }
  lootToday: number
  eveningWindow: boolean
  onFocus: () => void
  onClosing: () => void
}

/**
 * Serce ekranu „Dziś": roślina z ogrodu w pierścieniu postępu dnia, następny
 * krok i jeden duży przycisk. Wszystko, co odpowiada na „gdzie jestem i co
 * teraz", mieści się na jednym ekranie telefonu — reszta dnia jest pod spodem
 * w zakładkach. DashboardNow liczy dane, /design-system pokazuje przykład.
 */
export function NowCard({
  pct, label, next, done, total, streak = 0, streakHint = null, xpToday = 0,
  level = { num: 1, name: 'Seed', pct: 0 }, lootToday, eveningWindow, onFocus, onClosing,
}: NowCardProps) {
  const R = 54
  const C = 2 * Math.PI * R
  const full = pct >= 100
  return (
    <section className="relative bg-dark text-ivory grain-linen panel-frame px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5 mb-4 overflow-hidden">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-ui uppercase tracking-luxury text-[10px] text-gold-light shrink-0">Teraz</span>
        <span className="text-gold text-[9px] leading-none shrink-0" aria-hidden="true">◆</span>
        <span className="font-serif-body italic text-[15px] text-parchment leading-snug truncate">{label}</span>
      </div>

      <div className="mt-4 flex items-center gap-5 sm:gap-7">
        {/* Roślina rośnie z poziomem, pierścień domyka się z dniem. */}
        <Link
          href="/progress"
          className="relative shrink-0 w-[118px] h-[118px] sm:w-[136px] sm:h-[136px]"
          aria-label={`Postęp dnia ${pct}%. Poziom ${level.num}, ${level.name} — otwórz ogród.`}
        >
          <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(243,233,200,0.13)" strokeWidth="4.5" />
            <circle
              cx="60" cy="60" r={R} fill="none"
              stroke={full ? '#9DB087' : '#C9B27F'} strokeWidth="4.5" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(100, pct) / 100)}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), stroke 0.4s' }}
            />
          </svg>
          <span className="absolute inset-[12px] rounded-full bg-cream overflow-hidden flex items-end justify-center">
            <GardenArt levelStage={Math.floor((level.num - 1) / 3)} viewBox="25 5 110 140" className="w-[88%] h-[88%]" />
          </span>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-dark border border-gold/50 px-2 py-0.5 font-display italic text-[13px] leading-none text-gold-pale tabular-nums">
            {pct}%
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          {next ? (
            <>
              <div className="font-ui uppercase tracking-luxury text-[9px] text-gold-light/80">następne</div>
              <p className="font-display text-ivory text-[20px] sm:text-[23px] leading-[1.22] mt-1.5 line-clamp-3">
                {next.title}
              </p>
              <p className="font-display italic text-gold text-[15px] mt-1.5">+{next.xp} XP</p>
            </>
          ) : (
            <>
              <p className="font-display text-ivory text-[20px] sm:text-[23px] leading-[1.22]">
                Wszystko na teraz odhaczone.
              </p>
              <p className="font-serif-body italic text-parchment text-[14.5px] mt-1.5">na tę porę dnia nic nie czeka</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-stretch gap-2.5">
        {next && (
          <button
            onClick={onFocus}
            className="flex-1 inline-flex items-center justify-center gap-2.5 bg-gold text-dark hover:bg-gold-light active:bg-gold-light transition-colors py-3.5"
          >
            <Play size={14} strokeWidth={2} />
            <span className="font-ui uppercase tracking-luxury text-[11px] font-medium">Jedna rzecz</span>
          </button>
        )}
        {/* Wieczorne domknięcie: rutyna e1–e7 + „ostatni papieros dnia" na jednym
            ekranie. Przez całe okno wieczoru — także po domknięciu rutyny. */}
        {eveningWindow && (
          <button
            onClick={onClosing}
            className={`${next ? 'shrink-0 px-4' : 'flex-1'} border border-gold/50 hover:border-gold py-3.5 font-ui uppercase tracking-[0.26em] text-[10px] text-gold-pale transition-colors`}
          >
            domknij dzień ◆
          </button>
        )}
      </div>

      <dl className="mt-4 pt-3.5 border-t border-gold/15 grid grid-cols-3 text-center">
        <HeroStat label="z listy" value={`${done}/${total}`} />
        <HeroStat label="XP dziś" value={`+${xpToday}`} mid />
        <HeroStat label={streak === 1 ? 'dzień serii' : 'dni serii'} value={streak > 0 ? String(streak) : '—'} />
      </dl>
      {(streakHint || lootToday > 0) && (
        <p className="mt-2.5 text-center font-serif-body italic text-[13px] text-parchment/85">
          {streakHint}
          {streakHint && lootToday > 0 && ' · '}
          {lootToday > 0 && <>✦ {lootToday} {lootToday === 1 ? 'znalezisko' : lootToday < 5 ? 'znaleziska' : 'znalezisk'}</>}
        </p>
      )}

      <div className="mt-3.5">
        <div className="flex items-baseline justify-between gap-3 font-ui uppercase tracking-luxury text-[9px] text-parchment/70">
          <span className="truncate">
            Level {toRoman(level.num)} <span className="text-gold/70 mx-1">·</span>
            <span className="text-gold-pale">{level.name}</span>
          </span>
          <span className="tabular-nums shrink-0">{level.pct}%</span>
        </div>
        <div className="mt-1.5 h-[3px] bg-ivory/10" aria-hidden>
          <div className="h-full bg-gold" style={{ width: `${level.pct}%`, transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
        </div>
      </div>
    </section>
  )
}

function HeroStat({ label, value, mid = false }: { label: string; value: string; mid?: boolean }) {
  return (
    <div className={mid ? 'border-x border-gold/15' : undefined}>
      <dd className="font-display text-gold-pale text-[19px] leading-none tabular-nums">{value}</dd>
      <dt className="mt-1.5 font-ui uppercase tracking-luxury text-[8.5px] text-parchment/65">{label}</dt>
    </div>
  )
}
