'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { ACHIEVEMENTS } from '@/lib/achievements'
import type { Achievement } from '@/types'

interface AchievementUnlockContextType {
  showAchievementUnlock: (ids: string[]) => void
}

const AchievementUnlockContext = createContext<AchievementUnlockContextType>({
  showAchievementUnlock: () => {},
})

export function useAchievementUnlock() {
  return useContext(AchievementUnlockContext)
}

// Particles spread around the card center (offsets in px from 50vw / 50vh)
const PARTICLES: { x: number; y: number; delay: string; size: number }[] = [
  { x: -80,  y: -270, delay: '0s',     size: 5 },
  { x: -25,  y: -285, delay: '0.15s',  size: 3 },
  { x:  35,  y: -285, delay: '0.3s',   size: 4 },
  { x:  85,  y: -270, delay: '0.08s',  size: 5 },
  { x: -205, y: -150, delay: '0.2s',   size: 4 },
  { x: -215, y:  -40, delay: '0.4s',   size: 3 },
  { x: -200, y:   60, delay: '0.05s',  size: 5 },
  { x:  205, y: -150, delay: '0.25s',  size: 3 },
  { x:  215, y:  -40, delay: '0.35s',  size: 4 },
  { x:  200, y:   60, delay: '0.12s',  size: 5 },
  { x:  -75, y:  250, delay: '0.18s',  size: 4 },
  { x:   75, y:  250, delay: '0.28s',  size: 3 },
]

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
  }, [visible, animKey, dismiss])  // animKey resets timer for each achievement

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-dark/85 backdrop-blur-sm animate-fade-in" />

          {/* Gold particles */}
          {PARTICLES.map((p, i) => (
            <span
              key={`${animKey}-${i}`}
              className="absolute rounded-full bg-gold pointer-events-none animate-sparkle-float"
              style={{
                width:  p.size,
                height: p.size,
                left:   `calc(50% + ${p.x}px)`,
                top:    `calc(50% + ${p.y}px)`,
                animationDelay: p.delay,
              }}
            />
          ))}

          {/* Card */}
          <div
            key={animKey}
            className="relative z-10 mx-4 bg-ivory rounded-2xl shadow-elegant-lg max-w-sm w-full animate-achievement-enter overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Gold top bar */}
            <div className="h-1 w-full bg-gold-gradient" />

            <div className="px-8 pt-7 pb-8 text-center">
              {/* Label */}
              {current.hidden ? (
                <div className="mb-6">
                  <p className="text-gold text-[10px] font-sans font-semibold tracking-[0.22em] uppercase mb-1">
                    🎁 Ukryte osiągnięcie
                  </p>
                  <p className="text-muted font-sans text-xs">Niespodzianka ✦</p>
                </div>
              ) : (
                <p className="text-gold text-[10px] font-sans font-semibold tracking-[0.22em] uppercase mb-6">
                  ✦ Osiągnięcie odblokowane ✦
                </p>
              )}

              {/* Icon */}
              <div
                key={`icon-${animKey}`}
                className="text-6xl mb-5 inline-block animate-icon-float"
              >
                {current.icon}
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl text-dark mb-2 leading-snug">
                {current.title}
              </h2>

              {/* Description */}
              <p className="font-sans text-sm text-muted leading-relaxed mb-6">
                {current.description}
              </p>

              {/* XP Reward */}
              <div className="inline-flex items-center gap-1.5 bg-gold-pale border border-gold/30 rounded-full px-5 py-1.5 mb-6">
                <span className="text-gold font-sans text-xs font-semibold tracking-wide">
                  +{current.xpReward} XP
                </span>
              </div>

              {/* Dismiss */}
              <div>
                <button
                  onClick={dismiss}
                  className="font-sans text-sm text-muted-light hover:text-dark transition-colors tracking-wide"
                >
                  {queue.length > 1
                    ? `Dalej  ›  jeszcze ${queue.length - 1}`
                    : 'Świetnie ✦'}
                </button>
              </div>
            </div>

            {/* Queue progress dots */}
            {queue.length > 1 && (
              <div className="flex gap-1.5 justify-center pb-5">
                {queue.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === 0 ? 'w-5 bg-gold' : 'w-2 bg-parchment'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AchievementUnlockContext.Provider>
  )
}
