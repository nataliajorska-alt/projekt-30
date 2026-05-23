'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { ACHIEVEMENTS } from '@/lib/achievements'
import type { Achievement } from '@/types'
import { SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets } from '@/components/ui'

interface AchievementUnlockContextType {
  showAchievementUnlock: (ids: string[]) => void
}

const AchievementUnlockContext = createContext<AchievementUnlockContextType>({
  showAchievementUnlock: () => {},
})

export function useAchievementUnlock() {
  return useContext(AchievementUnlockContext)
}

// Particles spread around the card — gold dust in candlelight
const PARTICLES: { x: number; y: number; delay: string; size: number }[] = [
  { x: -80,  y: -270, delay: '0s',     size: 4 },
  { x: -25,  y: -285, delay: '0.15s',  size: 3 },
  { x:  35,  y: -285, delay: '0.3s',   size: 3 },
  { x:  85,  y: -270, delay: '0.08s',  size: 4 },
  { x: -205, y: -150, delay: '0.2s',   size: 3 },
  { x: -215, y:  -40, delay: '0.4s',   size: 3 },
  { x: -200, y:   60, delay: '0.05s',  size: 4 },
  { x:  205, y: -150, delay: '0.25s',  size: 3 },
  { x:  215, y:  -40, delay: '0.35s',  size: 3 },
  { x:  200, y:   60, delay: '0.12s',  size: 4 },
  { x:  -75, y:  250, delay: '0.18s',  size: 3 },
  { x:   75, y:  250, delay: '0.28s',  size: 3 },
]

// 12 radial diamonds around the medallion (clock positions)
const RADIAL_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30)

export function AchievementUnlockProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Achievement[]>([])
  const [visible, setVisible] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showAchievementUnlock = useCallback((ids: string[]) => {
    const achievements = ids
      .map(id => ACHIEVEMENTS.find(a => a.id === id))
      .filter(Boolean) as Achievement[]
    if (achievements.length === 0) return
    setQueue(prev => [...prev, ...achievements])
    setVisible(true)
  }, [])

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) setVisible(false)
      return next
    })
    setAnimKey(k => k + 1)
  }, [])

  useEffect(() => {
    if (!visible || queue.length === 0) return
    timerRef.current = setTimeout(dismiss, 5500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible, animKey, dismiss])

  const current = queue[0]

  return (
    <AchievementUnlockContext.Provider value={{ showAchievementUnlock }}>
      {children}

      {visible && current && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label={`Osiągnięcie odblokowane: ${current.title}`}
        >
          {/* Ritual backdrop — deep forest, candle-lit */}
          <div className="absolute inset-0 bg-forest-deep/95 grain-linen animate-fade-in" />

          {/* Gold dust particles */}
          {PARTICLES.map((p, i) => (
            <span
              key={`${animKey}-${i}`}
              className="absolute rounded-full bg-gold pointer-events-none animate-sparkle-float"
              style={{
                width: p.size,
                height: p.size,
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
                animationDelay: p.delay,
              }}
            />
          ))}

          {/* Card */}
          <div
            key={animKey}
            className="relative z-10 mx-4 max-w-sm w-full bg-forest-deep grain-linen text-ivory animate-achievement-enter"
            onClick={e => e.stopPropagation()}
          >
            {/* Double gold frame */}
            <div className="pointer-events-none absolute inset-3 border border-gold-light/40" />
            <div className="pointer-events-none absolute inset-[14px] border border-gold-light/15" />
            <div className="pointer-events-none absolute inset-6">
              <CornerBrackets size={14} tone="gold" weight={1} />
            </div>

            <div className="relative px-8 pt-10 pb-9 text-center">
              {/* Eyebrow */}
              <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div">
                {current.hidden ? 'Hidden Devotion · Unlocked' : 'Devotion · Unlocked'}
              </SmallCaps>

              {/* Medallion — concentric circles + radial diamonds + icon in center */}
              <div className="relative mx-auto mt-7 w-32 h-32" key={`medal-${animKey}`}>
                {/* outer ring of diamonds */}
                <div className="absolute inset-0">
                  {RADIAL_ANGLES.map((ang, i) => {
                    const rad = (ang * Math.PI) / 180
                    const r = 70
                    const x = Math.cos(rad) * r
                    const y = Math.sin(rad) * r
                    return (
                      <span
                        key={i}
                        className="absolute text-gold"
                        style={{
                          left: `calc(50% + ${x}px - 3px)`,
                          top: `calc(50% + ${y}px - 3px)`,
                        }}
                      >
                        <Diamond size={6} />
                      </span>
                    )
                  })}
                </div>
                {/* outer circle */}
                <div className="absolute inset-2 rounded-full border border-gold" />
                {/* inner circle */}
                <div className="absolute inset-4 rounded-full border border-gold-light/40" />
                {/* icon */}
                <div
                  key={`icon-${animKey}`}
                  className="absolute inset-0 flex items-center justify-center text-5xl animate-icon-float"
                >
                  {current.icon}
                </div>
              </div>

              {/* Title */}
              <h2 className="font-display text-3xl text-ivory mt-7 leading-tight">
                {current.title}
              </h2>

              {/* Description */}
              <p className="font-serif-body italic text-parchment text-sm leading-relaxed mt-3 px-2">
                {current.description}
              </p>

              {/* Gold rule */}
              <GoldRule variant="diamond" tone="gold" className="mt-6 max-w-[180px] mx-auto" />

              {/* XP — editorial */}
              <div className="mt-5 inline-flex items-center gap-2">
                <Diamond size={5} className="text-gold" />
                <SmallCaps tone="gold" tracking="luxury" size="sm">
                  + {current.xpReward} XP
                </SmallCaps>
                <Diamond size={5} className="text-gold" />
              </div>

              {/* Dismiss */}
              <div className="mt-7">
                <button
                  onClick={dismiss}
                  className="font-ui uppercase tracking-luxury text-[10px] text-parchment hover:text-gold-light transition-colors"
                >
                  {queue.length > 1
                    ? `Dalej  ›  jeszcze ${queue.length - 1}`
                    : 'Świetnie'}
                </button>
              </div>
            </div>

            {/* Queue progress — diamonds, not dots */}
            {queue.length > 1 && (
              <div className="relative flex gap-2 justify-center pb-5">
                {queue.map((_, i) => (
                  <Diamond
                    key={i}
                    size={i === 0 ? 7 : 5}
                    className={i === 0 ? 'text-gold' : 'text-parchment/40'}
                    filled={i === 0}
                  />
                ))}
              </div>
            )}

            {/* Ex libris signature */}
            <div className="relative pb-5 flex items-center justify-center gap-2">
              <Fleuron size={9} className="text-gold-deep" />
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                ex libris · natalia
              </SmallCaps>
              <Fleuron size={9} className="text-gold-deep" />
            </div>
          </div>
        </div>
      )}
    </AchievementUnlockContext.Provider>
  )
}
