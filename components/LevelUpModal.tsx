'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { LEVELS } from '@/lib/gameLogic'

interface LevelUpContextType {
  showLevelUp: (levelNumber: number) => void
}

const LevelUpContext = createContext<LevelUpContextType>({
  showLevelUp: () => {},
})

export function useLevelUp() {
  return useContext(LevelUpContext)
}

const PARTICLES: { x: number; y: number; delay: string; size: number }[] = [
  { x: -90,  y: -280, delay: '0s',     size: 5 },
  { x: -20,  y: -295, delay: '0.1s',   size: 3 },
  { x:  45,  y: -290, delay: '0.25s',  size: 4 },
  { x:  100, y: -270, delay: '0.05s',  size: 5 },
  { x: -220, y: -160, delay: '0.18s',  size: 4 },
  { x: -225, y:  -35, delay: '0.38s',  size: 3 },
  { x: -210, y:   70, delay: '0.08s',  size: 5 },
  { x:  220, y: -160, delay: '0.22s',  size: 3 },
  { x:  225, y:  -35, delay: '0.32s',  size: 4 },
  { x:  210, y:   70, delay: '0.12s',  size: 5 },
  { x:  -85, y:  260, delay: '0.15s',  size: 4 },
  { x:   85, y:  260, delay: '0.28s',  size: 3 },
  { x:    0, y: -300, delay: '0.42s',  size: 4 },
  { x: -150, y:  200, delay: '0.06s',  size: 3 },
  { x:  150, y:  200, delay: '0.35s',  size: 5 },
]

// Emoji per level tier
function getLevelEmoji(level: number): string {
  if (level <= 3)  return '🌱'
  if (level <= 6)  return '🌿'
  if (level <= 9)  return '🌸'
  if (level <= 12) return '🌺'
  if (level <= 15) return '✨'
  if (level <= 18) return '💎'
  if (level <= 21) return '🔮'
  if (level <= 24) return '👑'
  if (level <= 27) return '⭐'
  return '🌟'
}

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<number[]>([])
  const [visible, setVisible] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showLevelUp = useCallback((levelNumber: number) => {
    setQueue(prev => [...prev, levelNumber])
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
    timerRef.current = setTimeout(dismiss, 6000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible, animKey, dismiss])

  const currentLevel = queue[0]
  const levelData = LEVELS.find(l => l.level === currentLevel)

  return (
    <LevelUpContext.Provider value={{ showLevelUp }}>
      {children}

      {visible && levelData && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center"
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label={`Nowy poziom: ${levelData.name}`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-dark/90 backdrop-blur-sm animate-fade-in" />

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
            <div className="h-1.5 w-full bg-gold-gradient" />

            <div className="px-8 pt-7 pb-8 text-center">
              {/* Label */}
              <p className="text-gold text-[10px] font-sans font-semibold tracking-[0.22em] uppercase mb-5">
                ✦ Nowy poziom ✦
              </p>

              {/* Level number badge */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-pale border-2 border-gold/40 mb-4">
                <span className="font-serif text-gold font-bold text-lg leading-none">
                  {currentLevel}
                </span>
              </div>

              {/* Emoji icon */}
              <div
                key={`icon-${animKey}`}
                className="text-5xl mb-4 inline-block animate-icon-float block"
              >
                {getLevelEmoji(currentLevel)}
              </div>

              {/* Level name */}
              <h2 className="font-serif text-3xl text-dark mb-2 leading-snug">
                {levelData.name}
              </h2>

              {/* Subtitle */}
              <p className="font-sans text-sm text-muted leading-relaxed mb-7">
                Osiągasz nowy poziom w Projekcie 30.<br />
                Każdy krok przybliża Cię do siebie.
              </p>

              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="font-sans text-sm text-muted-light hover:text-dark transition-colors tracking-wide"
              >
                Dziękuję ✦
              </button>
            </div>
          </div>
        </div>
      )}
    </LevelUpContext.Provider>
  )
}
