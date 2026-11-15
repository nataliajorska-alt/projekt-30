'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { X, Check, ArrowRight, Play, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { useQuestBook } from '@/hooks/useMonthPlans'
import { buildTodayRoutine, buildFocusQueue, selectTodayQuests, type FocusItem } from '@/lib/todayPlan'
import { getEffectiveNow, todayKey } from '@/lib/gameLogic'
import { getPillar } from '@/lib/pillars'
import { emit, trackPointer } from '@/lib/rewards'
import { getRewardPrefs, setRewardPrefs, playFanfare, buzz } from '@/lib/rewardFx'

// „Jedna rzecz" — tryb pod ADHD: zamiast listy 30 pozycji jedna karta naraz,
// ułożona wg pory dnia. Zrobione → następna; później → na koniec kolejki;
// „tylko 2 minuty" obniża próg startu (start to najtrudniejszy moment).
// Przesunięcie karty w prawo = zrobione, w lewo = później.

const SLOT_LABEL: Record<FocusItem['slot'], string> = {
  morning: 'Ranek', daily: 'Dzień', evening: 'Wieczór', quest: 'Quest dnia',
}
const STARTER_MS = 2 * 60 * 1000
const SWIPE_PX = 90

export default function FocusFlow({ onClose, preview }: { onClose: () => void; preview?: FocusItem[] }) {
  const { todayLog, toggleRoutine, loading: gameLoading } = useGameData()
  const { getEffectiveItems, loading: configLoading } = useRoutineConfig()
  const { log, skippedIds, completeQuest, loading: questsLoading } = useAprilQuests()
  const { book, loading: bookLoading } = useQuestBook()

  const [queue, setQueue] = useState<FocusItem[] | null>(null)
  const [total, setTotal] = useState(0)
  const [leaving, setLeaving] = useState<'done' | 'later' | null>(null)
  const [doneCount, setDoneCount] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [deferredInRow, setDeferredInRow] = useState(0)
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [sound, setSound] = useState(() => getRewardPrefs().sound)
  const [dx, setDx] = useState(0)
  const drag = useRef<{ x0: number; id: number } | null>(null)
  const celebrated = useRef(false)

  // Kolejka powstaje raz, przy otwarciu — potem tylko ubywa (i przesuwa się „później").
  useEffect(() => {
    if (queue) return
    if (preview) { setQueue(preview); setTotal(preview.length); return }
    if (!todayLog || gameLoading || configLoading || questsLoading || bookLoading) return
    const today = todayKey()
    const routine = buildTodayRoutine(getEffectiveItems, todayLog, getEffectiveNow())
    const { todayQuests, overdueQuests } = selectTodayQuests(book, log, skippedIds, today)
    const q = buildFocusQueue({
      routine,
      completedRoutine: todayLog.completedRoutine ?? [],
      todayQuests,
      overdueQuests,
      completedQuests: log.completed,
      hour: new Date().getHours(),
    })
    setQueue(q)
    setTotal(q.length)
  }, [queue, preview, todayLog, gameLoading, configLoading, questsLoading, bookLoading, getEffectiveItems, book, log, skippedIds])

  // Blokada przewijania tła, póki tryb jest otwarty.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Zegar „tylko 2 minuty" — tyka do zera, potem stoi.
  useEffect(() => {
    if (!timerEnd) return
    const t = setInterval(() => {
      const n = Date.now()
      setNow(n)
      if (n >= timerEnd) clearInterval(t)
    }, 250)
    return () => clearInterval(t)
  }, [timerEnd])
  const timerLeft = timerEnd ? Math.max(0, timerEnd - now) : 0
  const timerDone = !!timerEnd && timerLeft === 0
  const timerRang = useRef(false)
  useEffect(() => {
    if (timerDone && !timerRang.current) {
      timerRang.current = true
      playFanfare(2)
      buzz([20, 60, 20])
    }
  }, [timerDone])

  const current = queue?.[0] ?? null
  const finished = !!queue && (queue.length === 0 || deferredInRow >= queue.length)
  const isMinimum = todayLog?.dayMode === 'minimum'

  const advance = useCallback((kind: 'done' | 'later') => {
    setTimeout(() => {
      setQueue(q => (q ? (kind === 'done' ? q.slice(1) : [...q.slice(1), q[0]]) : q))
      setLeaving(null)
      setDx(0)
      setTimerEnd(null)
      timerRang.current = false
    }, 320)
  }, [])

  // `finished` — na ekranie podsumowania karta jest schowana, a klawisze
  // trafiałyby w pierwszą odłożoną rzecz.
  const markDone = useCallback(() => {
    if (!current || leaving || finished) return
    setLeaving('done')
    setDoneCount(c => c + 1)
    setXpGained(x => x + current.xp * (isMinimum ? 2 : 1))
    setDeferredInRow(0)
    // Podgląd: sam feedback, bez zapisu.
    if (preview) emit('reward', { source: current.kind === 'routine' ? 'routine' : 'quest', id: `preview_${current.key}_${Date.now()}`, xp: current.xp, preview: true })
    else if (current.kind === 'routine') {
      // toggleRoutine przełącza — rzecz odhaczona w międzyczasie (np. na drugim
      // urządzeniu) zostałaby odznaczona. completeQuest pilnuje tego sam.
      if (!todayLog?.completedRoutine?.includes(current.id)) void toggleRoutine(current.id, current.xp)
    }
    else void completeQuest(current.id, current.pillar ?? 'pozycja', current.xp)
    advance('done')
  }, [current, leaving, finished, isMinimum, preview, todayLog, toggleRoutine, completeQuest, advance])

  const markLater = useCallback(() => {
    if (!current || leaving || finished) return
    setLeaving('later')
    setDeferredInRow(n => n + 1)
    advance('later')
  }, [current, leaving, finished, advance])

  // Klawiatura: → zrobione, ← później, Esc zamyka.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // Enter na zaznaczonym przycisku i tak go klika — bez podwójnej akcji.
      if (e.key === 'Enter' && (e.target as HTMLElement | null)?.closest('button, a, input, textarea')) return
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') markDone()
      else if (e.key === 'ArrowLeft') markLater()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [markDone, markLater, onClose])

  // Koniec serii — jedno świętowanie, jeśli coś zostało zrobione.
  useEffect(() => {
    if (!finished || celebrated.current || doneCount === 0) return
    celebrated.current = true
    emit('celebrate', {
      title: queue && queue.length === 0 ? 'Wszystko na teraz zrobione' : 'Seria domknięta',
      sub: `${doneCount} ${doneCount === 1 ? 'rzecz' : 'rzeczy'} · +${xpGained} XP`,
      big: true,
    })
  }, [finished, doneCount, xpGained, queue])

  const onPointerDown = (e: React.PointerEvent) => {
    // Przyciski i linki na karcie mają działać — przechwycenie wskaźnika
    // przekierowałoby ich kliknięcie na kartę.
    if (leaving || (e.target as HTMLElement).closest('button, a')) return
    drag.current = { x0: e.clientX, id: e.pointerId }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return
    setDx(e.clientX - drag.current.x0)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    trackPointer(e.clientX, e.clientY)
    if (dx > SWIPE_PX) markDone()
    else if (dx < -SWIPE_PX) markLater()
    else setDx(0)
  }

  const toggleSound = () => setSound(setRewardPrefs({ sound: !sound }).sound)
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const pillar = current?.pillar ? getPillar(current.pillar) : null
  const ringR = 15
  const ringC = 2 * Math.PI * ringR

  return (
    <div className="fixed inset-0 z-[80] bg-dark text-ivory flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] print:hidden" role="dialog" aria-modal="true" aria-label="Jedna rzecz">
      {/* Pasek górny */}
      <div className="px-4 md:px-8 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <span className="font-ui uppercase tracking-luxury text-[10px] text-gold-light">Jedna rzecz</span>
          <span className="flex-1 h-[3px] bg-ivory/10 overflow-hidden">
            <span className="block h-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
          </span>
          <span className="font-display italic text-[15px] text-gold tabular-nums">{doneCount}/{total}</span>
          <button onClick={toggleSound} aria-label={sound ? 'Wycisz dźwięki nagród' : 'Włącz dźwięki nagród'}
            className="p-2 text-ivory/60 hover:text-gold transition-colors">
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button onClick={onClose} aria-label="Zamknij" className="p-2 -mr-2 text-ivory/60 hover:text-ivory transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Przewijanie w pionie na niskich ekranach; wyśrodkowanie, gdy jest miejsce
          (min-h-full + justify-center). overflow-x-hidden — karta wyjeżdża przy przesuwaniu. */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="min-h-full flex flex-col items-center justify-center px-4 md:px-8 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        {!queue ? (
          <p className="font-serif-body italic text-ivory/60">układam, co teraz…</p>
        ) : finished ? (
          <div className="text-center max-w-sm focus-card-in">
            <div className="font-display text-gold text-[44px] leading-none">∴</div>
            <h2 className="font-display text-[30px] leading-tight mt-4">
              {queue.length === 0
                ? (doneCount > 0 ? 'Na teraz wszystko zrobione' : 'Na teraz nic nie czeka')
                : 'Reszta poczeka'}
            </h2>
            <p className="font-serif-body italic text-ivory/70 text-[15px] mt-3 leading-relaxed">
              {doneCount > 0
                ? `${doneCount} zrobione w tej serii · +${xpGained} XP. ${queue.length > 0 ? 'To, co odłożone, wróci w liście dnia.' : 'Odpocznij z czystym sumieniem.'}`
                : queue.length > 0
                  ? 'Odłożone, nie porzucone. Wrócisz, kiedy będzie lżej.'
                  : 'Lista na tę porę dnia jest pusta. Wróć wieczorem albo weź side questa.'}
            </p>
            <div className="flex flex-col gap-2 mt-8">
              {queue.length > 0 && (
                <button onClick={() => setDeferredInRow(0)}
                  className="border border-gold/50 text-gold px-5 py-3 font-ui uppercase tracking-luxury text-[10px] hover:bg-gold/10 transition-colors">
                  Przejrzyj odłożone ({queue.length})
                </button>
              )}
              <button onClick={onClose}
                className="bg-gold text-dark px-5 py-3 font-ui uppercase tracking-luxury text-[10px] hover:bg-gold-light transition-colors">
                Wróć do dnia
              </button>
            </div>
          </div>
        ) : current && (
          <>
            {/* Karta */}
            <div
              key={current.key}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { drag.current = null; setDx(0) }}
              className={clsx(
                'relative w-full max-w-md bg-ivory text-dark border border-gold-light shadow-2xl select-none touch-pan-y',
                leaving === 'done' ? 'focus-card-done' : leaving === 'later' ? 'focus-card-later' : 'focus-card-in',
              )}
              style={!leaving && dx !== 0 ? { transform: `translateX(${dx}px) rotate(${dx / 28}deg)` } : undefined}
            >
              {/* Znacznik kierunku przy przeciąganiu */}
              {dx > 24 && (
                <span className="absolute top-4 right-4 font-ui uppercase tracking-luxury text-[10px] text-sage" style={{ opacity: Math.min(1, dx / SWIPE_PX) }}>
                  zrobione ✓
                </span>
              )}
              {dx < -24 && (
                <span className="absolute top-4 left-4 font-ui uppercase tracking-luxury text-[10px] text-muted" style={{ opacity: Math.min(1, -dx / SWIPE_PX) }}>
                  ← później
                </span>
              )}

              <div className="px-6 pt-7 pb-6 md:px-8 md:pt-9">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-ui uppercase tracking-luxury text-[9.5px] text-gold-deep">{SLOT_LABEL[current.slot]}</span>
                  {pillar && (
                    <span className="font-ui uppercase tracking-[0.3em] text-[9px]" style={{ color: pillar.color }}>◆ {pillar.shortName}</span>
                  )}
                  {current.overdue && (
                    <span className="border border-wine/30 px-1.5 py-0.5 font-ui uppercase tracking-luxury text-[8.5px] text-wine">zaległe</span>
                  )}
                </div>
                <h2 className="font-display text-[clamp(1.6rem,6vw,2.1rem)] leading-[1.12] tracking-tight mt-3">
                  {current.title}
                </h2>
                {current.description && (
                  <p className="font-serif-body italic text-muted text-[15px] leading-relaxed mt-3 max-h-[28vh] overflow-y-auto">
                    {current.description}
                  </p>
                )}
                {current.href && (
                  <a href={current.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:text-dark">
                    otwórz ćwiczenie <ExternalLink size={11} />
                  </a>
                )}

                <div className="flex items-center justify-between gap-3 mt-6">
                  <span className="font-display italic text-[22px] text-gold-deep">
                    +{current.xp * (isMinimum ? 2 : 1)} <span className="font-ui not-italic uppercase tracking-luxury text-[9px] text-muted-light">XP</span>
                  </span>
                  {/* Tylko 2 minuty */}
                  {timerEnd ? (
                    <span className="inline-flex items-center gap-2" aria-live="polite">
                      <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90" aria-hidden>
                        <circle cx="18" cy="18" r={ringR} fill="none" stroke="#E5DCC1" strokeWidth="3" />
                        <circle cx="18" cy="18" r={ringR} fill="none" stroke="#B29355" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={ringC} strokeDashoffset={ringC * (1 - timerLeft / STARTER_MS)} />
                      </svg>
                      <span className="font-display italic text-[17px] tabular-nums text-dark">
                        {timerDone ? 'brawo' : `${Math.floor(timerLeft / 60000)}:${String(Math.floor((timerLeft % 60000) / 1000)).padStart(2, '0')}`}
                      </span>
                    </span>
                  ) : (
                    <button onClick={() => { setTimerEnd(Date.now() + STARTER_MS); setNow(Date.now()) }}
                      className="inline-flex items-center gap-1.5 border border-hairline hover:border-gold px-3 py-2 font-ui uppercase tracking-luxury text-[9.5px] text-dark transition-colors">
                      <Play size={11} className="text-gold-deep" /> tylko 2 minuty
                    </button>
                  )}
                </div>
                {timerEnd && (
                  <p className="font-serif-body italic text-muted text-[13px] mt-2">
                    {timerDone ? 'Start za Tobą. Skończ albo odhacz to, co zrobione — oba się liczą.' : 'Tylko 2 minuty. Potem wolno przestać.'}
                  </p>
                )}
              </div>
            </div>

            {/* Akcje */}
            <div className="w-full max-w-md mt-5 flex flex-col gap-2.5">
              <button onClick={markDone} disabled={!!leaving}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-gold text-dark py-4 font-ui uppercase tracking-luxury text-[11px] hover:bg-gold-light active:scale-[0.99] transition-all disabled:opacity-60">
                <Check size={16} /> Zrobione
              </button>
              <button onClick={markLater} disabled={!!leaving}
                className="w-full inline-flex items-center justify-center gap-2 text-ivory/70 hover:text-ivory py-2.5 font-ui uppercase tracking-luxury text-[10px] transition-colors">
                Później <ArrowRight size={13} />
              </button>
              <p className="text-center font-serif-body italic text-ivory/40 text-[12px] mt-1">
                przesuń kartę w prawo — zrobione, w lewo — później
              </p>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
