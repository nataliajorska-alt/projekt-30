'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { LEVELS } from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'
import { SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets } from '@/components/ui'

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
  { x: -90,  y: -280, delay: '0s',     size: 4 },
  { x: -20,  y: -295, delay: '0.1s',   size: 3 },
  { x:  45,  y: -290, delay: '0.25s',  size: 4 },
  { x:  100, y: -270, delay: '0.05s',  size: 4 },
  { x: -220, y: -160, delay: '0.18s',  size: 3 },
  { x: -225, y:  -35, delay: '0.38s',  size: 3 },
  { x: -210, y:   70, delay: '0.08s',  size: 4 },
  { x:  220, y: -160, delay: '0.22s',  size: 3 },
  { x:  225, y:  -35, delay: '0.32s',  size: 4 },
  { x:  210, y:   70, delay: '0.12s',  size: 4 },
  { x:  -85, y:  260, delay: '0.15s',  size: 3 },
  { x:   85, y:  260, delay: '0.28s',  size: 4 },
  { x:    0, y: -300, delay: '0.42s',  size: 3 },
  { x: -150, y:  200, delay: '0.06s',  size: 3 },
  { x:  150, y:  200, delay: '0.35s',  size: 4 },
]

// 16 radial diamonds for the level medallion (slightly denser than achievement)
const RADIAL_ANGLES = Array.from({ length: 16 }, (_, i) => (i * 360) / 16)

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
          <div className="absolute inset-0 bg-dark-deep/95 grain-linen animate-fade-in" />

          {/* Gold dust */}
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
            <div className="pointer-events-none absolute inset-3 border border-gold-light/40" />
            <div className="pointer-events-none absolute inset-[14px] border border-gold-light/15" />
            <div className="pointer-events-none absolute inset-6">
              <CornerBrackets size={14} tone="gold" weight={1} />
            </div>

            <div className="relative px-8 pt-10 pb-9 text-center">
              {/* Eyebrow */}
              <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div">
                Nowy stopień · ascensja
              </SmallCaps>

              {/* MEDALLION — denser, with Roman numeral in center */}
              <div className="relative mx-auto mt-7 w-36 h-36" key={`medal-${animKey}`}>
                {/* outer diamonds */}
                <div className="absolute inset-0">
                  {RADIAL_ANGLES.map((ang, i) => {
                    const rad = (ang * Math.PI) / 180
                    const r = 76
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
                <div className="absolute inset-2 rounded-full border border-gold" />
                <div className="absolute inset-4 rounded-full border border-gold-light/40" />
                <div className="absolute inset-6 rounded-full border border-gold-light/20" />
                {/* Roman numeral */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-4xl text-ivory leading-none">
                    {toRoman(currentLevel)}
                  </span>
                </div>
              </div>

              {/* Level name */}
              <h2 className="font-display text-[clamp(2rem,5vw,2.75rem)] text-ivory mt-7 leading-[1.05]">
                {levelData.name}
              </h2>

              {/* Level number subtitle in Arabic */}
              <p className="font-serif-body italic text-gold-light text-sm mt-2">
                stopień {currentLevel}
              </p>

              <GoldRule variant="fleuron" tone="gold" className="mt-6 max-w-[200px] mx-auto" />

              {/* Description */}
              <p className="font-serif-body italic text-parchment text-sm leading-relaxed mt-5 px-2">
                osiągasz nowy stopień w Projekcie 30 —
                <br />
                każdy krok przybliża cię do siebie.
              </p>

              {/* Dismiss */}
              <div className="mt-8">
                <button
                  onClick={dismiss}
                  className="font-ui uppercase tracking-luxury text-[10px] text-parchment hover:text-gold-light transition-colors"
                >
                  Dziękuję
                </button>
              </div>
            </div>

            {/* Ex libris signature */}
            <div className="relative pb-5 flex items-center justify-center gap-2">
              <Fleuron size={9} className="text-gold-deep" />
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                ex libris · natalia · {toRoman(currentLevel)}
              </SmallCaps>
              <Fleuron size={9} className="text-gold-deep" />
            </div>
          </div>
        </div>
      )}
    </LevelUpContext.Provider>
  )
}
