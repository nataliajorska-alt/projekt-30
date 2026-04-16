'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameData } from '@/hooks/useGameData'
import { useGhostLog } from '@/hooks/useGhostLog'
import { GHOST_TRIGGER_TAGS, type GhostTriggerTag } from '@/types'

const TIMER_SECONDS = 5 * 60 // 5 minut

const REASONS = [
  {
    id: 'attention',
    label: 'Chcę uwagi',
    reflection: 'Zasługujesz na uwagę — najpierw własną. Jesteś tu i robisz coś ważnego dla siebie każdego dnia.',
    action: null,
  },
  {
    id: 'lonely',
    label: 'Czuję się samotna',
    reflection: 'Samotność to sygnał, nie wyrok. Czy jest ktoś bliski, do kogo mogłabyś teraz zadzwonić — nie pisać?',
    action: null,
  },
  {
    id: 'bored',
    label: 'Jestem znudzona',
    reflection: 'Nuda to zaproszenie. Masz nieodkryte side questy które czekają tylko na Ciebie.',
    action: { label: 'Idź do side questów', href: '/quests' },
  },
  {
    id: 'forget',
    label: 'Boję się zapomnieć',
    reflection: 'To co było prawdziwe, nie znika — zmienia tylko kształt. Pamiętasz, bo to miało znaczenie. I nadal jesteś Ty.',
    action: null,
  },
]

type Phase = 'idle' | 'breathing' | 'question' | 'trigger' | 'done'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function GhostProtocol() {
  const { completeGhostProtocol, todayLog } = useGameData()
  const { saveEntry } = useGhostLog()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(TIMER_SECONDS)
  const [breathIn, setBreathIn] = useState(true)
  const [selectedReason, setSelectedReason] = useState<typeof REASONS[0] | null>(null)
  const [xpGranted, setXpGranted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const breathRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (breathRef.current) clearInterval(breathRef.current)
  }, [])

  const startBreathing = useCallback(() => {
    setPhase('breathing')
    setSeconds(TIMER_SECONDS)
    setBreathIn(true)

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearTimers()
          setPhase('question')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    breathRef.current = setInterval(() => {
      setBreathIn(prev => !prev)
    }, 4000)
  }, [clearTimers])

  const cancel = useCallback(() => {
    clearTimers()
    setPhase('idle')
    setSeconds(TIMER_SECONDS)
    setBreathIn(true)
    setSelectedReason(null)
    setXpGranted(false)
  }, [clearTimers])

  const pickReason = useCallback((reason: typeof REASONS[0]) => {
    setSelectedReason(reason)
    setPhase('trigger')
  }, [])

  const pickTrigger = useCallback(async (tag: GhostTriggerTag) => {
    setPhase('done')
    if (!xpGranted) {
      setXpGranted(true)
      await completeGhostProtocol()
    }

    const now = new Date()
    const weekday = (now.getDay() + 6) % 7 // 0=Pon … 6=Nd
    await saveEntry({
      timestamp: now.getTime(),
      hour: now.getHours(),
      weekday,
      dayMode: todayLog?.dayMode ?? 'normal',
      reasonId: selectedReason?.id ?? 'unknown',
      triggerTag: tag,
    })
  }, [completeGhostProtocol, saveEntry, xpGranted, todayLog, selectedReason])

  useEffect(() => () => clearTimers(), [clearTimers])

  const progress = ((TIMER_SECONDS - seconds) / TIMER_SECONDS) * 100

  return (
    <>
      {phase === 'idle' && (
        <button
          onClick={startBreathing}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-muted-light/40 text-muted-light hover:border-muted hover:text-muted transition-all font-sans text-xs tracking-wide"
        >
          <span>◇</span>
          <span>Chcę napisać do byłego</span>
        </button>
      )}

      {phase !== 'idle' && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-dark/95 backdrop-blur-md animate-fade-in px-6">

          {/* Breathing phase */}
          {phase === 'breathing' && (
            <div className="flex flex-col items-center gap-8 w-full max-w-sm">
              <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em]">
                Ghost Protocol
              </p>

              <div className="relative flex items-center justify-center">
                <svg className="absolute" width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(184,150,62,0.15)" strokeWidth="2" />
                  <circle
                    cx="100" cy="100" r="90"
                    fill="none"
                    stroke="rgba(184,150,62,0.6)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>

                <div
                  className="rounded-full bg-forest/60 border border-gold/20 flex items-center justify-center transition-all duration-[4000ms] ease-in-out"
                  style={{ width: breathIn ? 140 : 100, height: breathIn ? 140 : 100 }}
                >
                  <span className="font-serif text-ivory/80 text-sm">
                    {breathIn ? 'wdech' : 'wydech'}
                  </span>
                </div>
              </div>

              <p className="font-sans text-3xl text-ivory/60 tabular-nums">
                {formatTime(seconds)}
              </p>

              <p className="font-serif text-ivory/50 text-sm text-center leading-relaxed italic">
                &ldquo;Poczekaj tylko tyle.&rdquo;
              </p>

              <button
                onClick={cancel}
                className="font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide mt-2"
              >
                Zrezygnuj
              </button>
            </div>
          )}

          {/* Question phase */}
          {phase === 'question' && (
            <div className="w-full max-w-sm animate-fade-in">
              <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] text-center mb-6">
                Ghost Protocol
              </p>
              <h2 className="font-serif text-ivory text-xl text-center leading-snug mb-2">
                Czy naprawdę chcesz napisać,
              </h2>
              <p className="font-serif text-ivory/60 text-base text-center mb-8 italic">
                czy czegoś innego?
              </p>

              <div className="space-y-3">
                {REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => pickReason(r)}
                    className="w-full text-left px-5 py-3.5 rounded-xl border border-ivory/10 bg-forest/30 hover:bg-forest/50 hover:border-gold/30 transition-all font-sans text-sm text-ivory/80"
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                onClick={cancel}
                className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide mt-6"
              >
                Zamknij
              </button>
            </div>
          )}

          {/* Trigger tag phase */}
          {phase === 'trigger' && (
            <div className="w-full max-w-sm animate-fade-in">
              <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] text-center mb-6">
                Ghost Protocol
              </p>
              <h2 className="font-serif text-ivory text-lg text-center leading-snug mb-2">
                Skąd to przyszło?
              </h2>
              <p className="font-sans text-xs text-ivory/40 text-center mb-8 tracking-wide">
                Dane tylko dla Ciebie. Nie ma złej odpowiedzi.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {GHOST_TRIGGER_TAGS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => pickTrigger(t.value)}
                    className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl border border-ivory/10 bg-forest/20 hover:bg-forest/40 hover:border-gold/30 transition-all"
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="font-sans text-xs text-ivory/70 text-center leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={cancel}
                className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide mt-6"
              >
                Zamknij
              </button>
            </div>
          )}

          {/* Done phase */}
          {phase === 'done' && selectedReason && (
            <div className="w-full max-w-sm animate-fade-in text-center">
              <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] mb-8">
                Ghost Protocol
              </p>

              <div className="text-4xl mb-6">🛡️</div>

              <p className="font-serif text-ivory text-lg leading-relaxed mb-6 italic">
                &ldquo;{selectedReason.reflection}&rdquo;
              </p>

              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-8">
                <span className="font-sans text-gold text-xs font-semibold tracking-wide">+50 XP Tożsamość</span>
              </div>

              <p className="font-serif text-gold/80 text-base mb-8">
                Natalia 30 już to wiedziała.
              </p>

              <div className="space-y-3">
                {selectedReason.action && (
                  <button
                    onClick={() => { cancel(); router.push(selectedReason.action!.href) }}
                    className="w-full py-3 rounded-xl bg-forest/50 border border-gold/20 font-sans text-sm text-ivory hover:bg-forest/70 transition-all"
                  >
                    {selectedReason.action.label}
                  </button>
                )}
                <button
                  onClick={cancel}
                  className="w-full font-sans text-sm text-muted-light hover:text-ivory/60 transition-colors tracking-wide py-2"
                >
                  Zamknij ✦
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  )
}
