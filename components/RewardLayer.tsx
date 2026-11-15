'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { todayKey } from '@/lib/gameLogic'
import {
  on, trackPointer, recentPointer,
  nextCombo, comboCount, comboMilestone, comboFrequency, comboRewardId,
  rollLoot, countClaimed, COMBO_WINDOW_MS, EMPTY_COMBO, LOOT_DAILY_CAP, RARITY_META,
  type ComboState, type Loot, type CelebrateEvent,
} from '@/lib/rewards'
import { getRewardPrefs, playChime, playFanfare, buzz } from '@/lib/rewardFx'
import FocusFlow from './FocusFlow'
import type { FocusItem } from '@/lib/todayPlan'

// Jedna, globalna warstwa nagród (montowana raz w layoucie). Słucha magistrali
// z lib/rewards: każde odhaczenie w apce → „+XP" w miejscu dotyku, dzwoneczek
// coraz wyżej przy rozpędzie, czasem znalezisko; świętowanie kamieni milowych.

interface Float { id: number; x: number; y: number; text: string; sub?: string; gold?: boolean }
interface Piece { dx: number; dy: number; rot: number; color: string; dur: number; w: number; h: number }
interface Burst { id: number; x: number; y: number; pieces: Piece[] }
/** onShow — dźwięk i konfetti w chwili, gdy baner naprawdę wchodzi (po kolejce). */
interface Banner extends CelebrateEvent { id: number; onShow?: () => void }
type QueuedLoot = Loot & { preview?: boolean }

const CONFETTI = ['#B29355', '#C9B27F', '#6B7D59', '#B56A6A', '#F3E9C8', '#3D5247', '#826933']
const LOOT_AUTO_COLLECT_MS = 8000
const BANNER_QUEUE_MAX = 4
let seq = 0

function makeBurst(x: number, y: number, n: number, power: number): Burst {
  const pieces: Piece[] = Array.from({ length: n }, () => {
    const angle = Math.random() * Math.PI * 2
    const dist = (60 + Math.random() * 140) * power
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 40 * power + Math.random() * 120 * power, // łuk w górę, potem opada
      rot: (Math.random() - 0.5) * 720,
      color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
      dur: 0.9 + Math.random() * 0.8,
      w: 4 + Math.random() * 5,
      h: 6 + Math.random() * 8,
    }
  })
  return { id: ++seq, x, y, pieces }
}

function fallbackPoint() {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.62 }
}

const lootFanfare = (r: Loot['rarity']) => (r === 'legendarne' ? 5 : r === 'rzadkie' ? 4 : 3)
const lootBuzz = (r: Loot['rarity']) => (r === 'zwykle' ? 15 : [15, 40, 15])

export default function RewardLayer() {
  const { todayLog, claimReward } = useGameData()
  // Handlery magistrali żyją dłużej niż render — czytają najświeższy log przez ref.
  const logRef = useRef(todayLog)
  logRef.current = todayLog
  const claimRef = useRef(claimReward)
  claimRef.current = claimReward
  // Podgląd nie zapisuje — „przyznaje" od ręki, żeby było widać cały feedback.
  const claim = useCallback((rewardId: string, xp: number, preview?: boolean) =>
    (preview ? Promise.resolve(true) : claimRef.current(rewardId, xp)), [])
  const comboRef = useRef<ComboState>(EMPTY_COMBO)

  const [floats, setFloats] = useState<Float[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [combo, setCombo] = useState<{ n: number; lastAt: number } | null>(null)
  const [lootQueue, setLootQueue] = useState<QueuedLoot[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [focusOpen, setFocusOpen] = useState(false)
  const focusOpenRef = useRef(focusOpen)
  focusOpenRef.current = focusOpen
  const [focusPreview, setFocusPreview] = useState<FocusItem[] | undefined>()

  const spawnFloat = useCallback((x: number, y: number, text: string, sub?: string, gold?: boolean) => {
    if (!getRewardPrefs().fx) return
    const f = { id: ++seq, x, y, text, sub, gold }
    setFloats(fs => [...fs.slice(-12), f])
    setTimeout(() => setFloats(fs => fs.filter(o => o.id !== f.id)), 1200)
  }, [])

  const spawnBurst = useCallback((x: number, y: number, n = 26, power = 1) => {
    if (!getRewardPrefs().fx) return
    const b = makeBurst(x, y, n, power)
    setBursts(bs => [...bs.slice(-4), b])
    setTimeout(() => setBursts(bs => bs.filter(o => o.id !== b.id)), 1900)
  }, [])

  // Kolejka banerów: dwa świętowania naraz (np. koniec serii i domknięty dzień)
  // lecą po sobie, każde ze swoim dźwiękiem, zamiast nadpisywać się w pół słowa.
  const showBanner = useCallback((e: CelebrateEvent, onShow?: () => void) => {
    setBanners(bs => (bs.length >= BANNER_QUEUE_MAX ? bs : [...bs, { ...e, id: ++seq, onShow }]))
  }, [])
  const banner = banners[0] ?? null
  useEffect(() => {
    if (!banner) return
    banner.onShow?.()
    const t = setTimeout(() => setBanners(bs => bs.slice(1)), banner.big ? 4200 : 3000)
    return () => clearTimeout(t)
  }, [banner])

  // Ostatni dotyk — stąd wylatuje „+XP".
  useEffect(() => {
    const h = (e: PointerEvent) => trackPointer(e.clientX, e.clientY)
    window.addEventListener('pointerdown', h, { capture: true, passive: true })
    return () => window.removeEventListener('pointerdown', h, { capture: true })
  }, [])

  useEffect(() => on('focus', e => { setFocusPreview(e?.preview); setFocusOpen(true) }), [])

  useEffect(() => on('celebrate', e => {
    showBanner(e, () => {
      playFanfare(e.big ? 5 : 3)
      buzz(e.big ? [15, 50, 15, 50, 30] : [12, 40, 12])
      spawnBurst(window.innerWidth / 2, 120, e.big ? 60 : 30, e.big ? 1.6 : 1.1)
    })
  }), [showBanner, spawnBurst])

  // Znalezisko w trybie „Jedna rzecz": bez karty do kliknięcia — XP od razu,
  // nazwa i zdanie na banerze (nie łapie dotyku), żeby nie wybijać z rytmu.
  const collectInFlow = useCallback((loot: QueuedLoot) => {
    void claim(loot.rewardId, loot.xp, loot.preview).then(ok => {
      if (!ok) return
      const c = fallbackPoint()
      spawnFloat(c.x, c.y, `+${loot.xp}`, RARITY_META[loot.rarity].label, true)
      showBanner({
        kicker: `✦ ${RARITY_META[loot.rarity].label} · +${loot.xp} XP`,
        title: loot.name,
        sub: loot.line,
        big: loot.rarity === 'legendarne',
      }, () => {
        playFanfare(lootFanfare(loot.rarity))
        buzz(lootBuzz(loot.rarity))
        spawnBurst(window.innerWidth / 2, 120, loot.rarity === 'legendarne' ? 50 : 22, loot.rarity === 'legendarne' ? 1.5 : 0.9)
      })
    })
  }, [claim, spawnFloat, spawnBurst, showBanner])

  useEffect(() => on('reward', e => {
    const now = Date.now()
    const prev = comboCount(comboRef.current, now)
    const next = nextCombo(comboRef.current, e.id, now)
    comboRef.current = next
    const n = next.ids.length
    const p = recentPointer() ?? fallbackPoint()

    spawnFloat(p.x, p.y, `+${e.xp}`, n >= 2 ? `rozpęd ×${n}` : undefined)
    playChime(comboFrequency(n))
    buzz(10)
    setCombo({ n, lastAt: now })

    const date = todayKey()
    const claimed = logRef.current?.rewardsClaimed ?? []
    const m = comboMilestone(prev, n)
    if (m && !claimed.includes(comboRewardId(date, m.n))) {
      void claim(comboRewardId(date, m.n), m.xp, e.preview).then(ok => {
        if (!ok) return
        showBanner({ title: `${m.title} ×${m.n}`, sub: `+${m.xp} XP za serię bez przerwy` }, () => {
          playFanfare(3)
          spawnBurst(p.x, p.y, 18, 0.8)
        })
      })
    }

    const rolled = rollLoot(date, e.id, claimed)
    if (!rolled) return
    const loot: QueuedLoot = { ...rolled, preview: e.preview }
    setTimeout(() => {
      const claimedLoot = countClaimed(logRef.current?.rewardsClaimed, `loot_${date}_`)
      if (focusOpenRef.current) {
        if (claimedLoot < LOOT_DAILY_CAP) collectInFlow(loot)
        return
      }
      setLootQueue(q => {
        if (q.some(l => l.rewardId === loot.rewardId)) return q
        // Limit dzienny liczy też znaleziska czekające w kolejce.
        if (claimedLoot + q.length >= LOOT_DAILY_CAP) return q
        return [...q, loot]
      })
    }, 550)
  }), [claim, spawnFloat, spawnBurst, showBanner, collectInFlow])

  // Rozpęd gaśnie po oknie bez odhaczenia.
  useEffect(() => {
    if (!combo) return
    const t = setTimeout(() => setCombo(null), Math.max(0, combo.lastAt + COMBO_WINDOW_MS - Date.now()))
    return () => clearTimeout(t)
  }, [combo])

  const currentLoot = lootQueue[0] ?? null
  const collect = useCallback((loot: QueuedLoot, el?: HTMLElement | null) => {
    setLootQueue(q => q.filter(l => l.rewardId !== loot.rewardId))
    const r = el?.getBoundingClientRect()
    const x = r ? r.left + r.width / 2 : fallbackPoint().x
    const y = r ? r.top + r.height / 3 : fallbackPoint().y
    void claim(loot.rewardId, loot.xp, loot.preview).then(ok => {
      if (!ok) return
      spawnFloat(x, y, `+${loot.xp}`, RARITY_META[loot.rarity].label, true)
      spawnBurst(x, y, loot.rarity === 'legendarne' ? 50 : 22, loot.rarity === 'legendarne' ? 1.5 : 0.9)
      playFanfare(lootFanfare(loot.rarity))
      buzz(lootBuzz(loot.rarity))
    })
  }, [claim, spawnFloat, spawnBurst])

  const lootRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!currentLoot) return
    playChime(1318.5)
    const t = setTimeout(() => collect(currentLoot, lootRef.current), LOOT_AUTO_COLLECT_MS)
    return () => clearTimeout(t)
  }, [currentLoot, collect])

  // W „Jednej rzeczy" bez licznika: rozpęd widać w „+XP" i słychać w dzwoneczku,
  // a pasek przy dolnej krawędzi wchodziłby na przyciski karty.
  const showCombo = combo && combo.n >= 2 && !focusOpen && getRewardPrefs().fx

  return (
    <>
      {/* „+XP" */}
      {floats.map(f => (
        <div
          key={f.id}
          className="xp-float pointer-events-none fixed z-[120] text-center select-none"
          style={{ left: f.x, top: f.y }}
          aria-hidden
        >
          <div className={clsx(
            'font-display italic font-semibold leading-none drop-shadow-sm',
            f.gold ? 'text-[30px] text-gold' : 'text-[24px] text-gold-deep',
          )}>
            {f.text}
          </div>
          {f.sub && (
            <div className="mt-1 font-ui uppercase tracking-luxury text-[9px] text-gold-deep whitespace-nowrap">{f.sub}</div>
          )}
        </div>
      ))}

      {/* Konfetti */}
      {bursts.map(b => (
        <div key={b.id} className="pointer-events-none fixed z-[119]" style={{ left: b.x, top: b.y }} aria-hidden>
          {b.pieces.map((pc, i) => (
            <span
              key={i}
              className="confetti-piece absolute block"
              style={{
                width: pc.w, height: pc.h, background: pc.color,
                ['--dx' as string]: `${pc.dx}px`, ['--dy' as string]: `${pc.dy}px`,
                ['--rot' as string]: `${pc.rot}deg`, ['--dur' as string]: `${pc.dur}s`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Rozpęd i znalezisko — jeden stos nad dolną nawigacją, licznik nad kartą,
          żeby karta go nie zasłaniała. Klikalna jest tylko karta, nie cały pas. */}
      {(showCombo || currentLoot) && (
        <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-6 md:left-[280px] z-[95] px-4 md:px-6 flex flex-col items-center gap-2 pointer-events-none print:hidden">
          {showCombo && (
            <div key={combo.lastAt} className="self-start" role="status">
              <div className="reward-pop bg-dark text-ivory border border-gold/60 px-3.5 py-2 shadow-lg min-w-[132px]">
                <div className="flex items-baseline gap-2">
                  <span className="font-ui uppercase tracking-luxury text-[9px] text-gold-light">Rozpęd</span>
                  <span className="font-display italic text-[22px] leading-none text-gold">×{combo.n}</span>
                </div>
                <div className="mt-1.5 h-[2px] bg-ivory/15 overflow-hidden">
                  <div className="combo-drain h-full bg-gold" style={{ animationDuration: `${COMBO_WINDOW_MS}ms` }} />
                </div>
              </div>
            </div>
          )}

          {currentLoot && (
            <button
              ref={lootRef}
              key={currentLoot.rewardId}
              onClick={e => collect(currentLoot, e.currentTarget)}
              className={clsx(
                'loot-in pointer-events-auto relative w-full max-w-sm text-left px-5 py-4 border shadow-2xl overflow-hidden',
                currentLoot.rarity === 'legendarne'
                  ? 'bg-gradient-to-br from-gold-pale via-gold-light to-gold text-dark border-gold-deep'
                  : currentLoot.rarity === 'rzadkie'
                    ? 'bg-dark text-ivory border-gold'
                    : 'bg-ivory text-dark border-gold-light',
              )}
            >
              {currentLoot.rarity !== 'zwykle' && (
                <span className="loot-shine absolute inset-y-0 left-0 w-1/3 pointer-events-none bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden />
              )}
              <span className={clsx(
                'block font-ui uppercase tracking-luxury text-[9px]',
                currentLoot.rarity === 'rzadkie' ? 'text-gold-light' : 'text-gold-deep',
              )}>
                ✦ {RARITY_META[currentLoot.rarity].label}
              </span>
              <span className="flex items-baseline justify-between gap-3 mt-1">
                <span className="font-display text-[22px] leading-tight">{currentLoot.name}</span>
                <span className={clsx('font-display italic text-[22px] shrink-0', currentLoot.rarity === 'rzadkie' ? 'text-gold' : 'text-gold-deep')}>
                  +{currentLoot.xp}
                </span>
              </span>
              <span className={clsx(
                'block font-serif-body italic text-[13.5px] leading-snug mt-1.5',
                currentLoot.rarity === 'rzadkie' ? 'text-ivory/80' : 'text-muted',
              )}>
                {currentLoot.line}
              </span>
              <span className={clsx(
                'block mt-3 font-ui uppercase tracking-luxury text-[10px]',
                currentLoot.rarity === 'rzadkie' ? 'text-gold' : 'text-dark',
              )}>
                Zbierz ◆
              </span>
            </button>
          )}
        </div>
      )}

      {/* Świętowanie */}
      {banner && (
        <div
          key={banner.id}
          className="banner-in fixed left-1/2 top-[max(env(safe-area-inset-top),24px)] z-[96] w-[min(92vw,420px)] pointer-events-none print:hidden"
          role="status"
        >
          <div className={clsx(
            'border shadow-2xl px-6 py-4 text-center',
            banner.big ? 'bg-dark text-ivory border-gold' : 'bg-ivory text-dark border-gold-light',
          )}>
            <div className={clsx('font-ui uppercase tracking-luxury text-[9px]', banner.big ? 'text-gold-light' : 'text-gold-deep')}>
              {banner.kicker ?? '✦ ✦ ✦'}
            </div>
            <div className="font-display text-[24px] leading-tight mt-1">{banner.title}</div>
            {banner.sub && (
              <div className={clsx('font-serif-body italic text-[14px] mt-1', banner.big ? 'text-ivory/80' : 'text-muted')}>
                {banner.sub}
              </div>
            )}
          </div>
        </div>
      )}

      {focusOpen && <FocusFlow preview={focusPreview} onClose={() => setFocusOpen(false)} />}
    </>
  )
}
