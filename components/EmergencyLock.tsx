'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { useNominatedContacts } from '@/hooks/useNominatedContacts'
import { useVault } from '@/hooks/useVault'
import clsx from 'clsx'

// Frazy rotowane co 5 minut
const ROTATING_PHRASES = [
  'To miasto było Twoje zanim był on.',
  'Natalia 30 nie potrzebuje tego, czego chce Natalia teraz.',
  'Każdy raz kiedy nie piszesz, budujesz kogoś, kto nie musi.',
  'Odporność nie jest brakiem uczuć. Jest wyborem — co z nimi zrobić.',
  'Wyobraźnia jest scenarzystką zakochanych na odległość. Nie wierz jej.',
  'Za rok będziesz pamiętać, że tu wytrwałaś.',
  'To nie o nim. To jest Twój stan, który szuka obiektu.',
  'Nie musisz być jutro inna niż dziś. Wystarczy, że jesteś tu i działasz.',
]

const DURATIONS = [
  { label: '30 min', seconds: 30 * 60 },
  { label: '60 min', seconds: 60 * 60 },
  { label: '90 min', seconds: 90 * 60 },
]

type Phase = 'setup' | 'locked' | 'save_thought' | 'outcome' | 'done'

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function EmergencyLock({ onClose }: { onClose: () => void }) {
  const { recordGhostImpulseV2 } = useGameData()
  const { contacts } = useNominatedContacts()
  const { addEntry: addVaultEntry } = useVault()

  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0])
  const [seconds, setSeconds] = useState(DURATIONS[0].seconds)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [thoughtText, setThoughtText] = useState('')
  const [thoughtSaved, setThoughtSaved] = useState(false)
  const [hadContact, setHadContact] = useState<boolean | null>(null)
  const [xpEarned, setXpEarned] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phraseRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (phraseRef.current) clearInterval(phraseRef.current)
  }, [])

  const startLock = useCallback(() => {
    setSeconds(selectedDuration.seconds)
    setPhase('locked')

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          stopTimers()
          setPhase('outcome')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    phraseRef.current = setInterval(() => {
      setPhraseIdx(prev => (prev + 1) % ROTATING_PHRASES.length)
    }, 5 * 60 * 1000)
  }, [selectedDuration, stopTimers])

  useEffect(() => () => stopTimers(), [stopTimers])

  const handleSaveThought = useCallback(async () => {
    if (!thoughtText.trim()) { setPhase('locked'); return }
    await addVaultEntry({
      letterType: 'crisis',
      unlockType: 'immediate',
      title: 'Z Emergency Lock',
      content: thoughtText.trim(),
    })
    setThoughtSaved(true)
    setThoughtText('')
    setTimeout(() => {
      setThoughtSaved(false)
      setPhase('locked')
    }, 1500)
  }, [thoughtText, addVaultEntry])

  const handleOutcome = useCallback(async (contact: boolean) => {
    setHadContact(contact)
    const xp = contact ? 10 : 60
    setXpEarned(xp)
    await recordGhostImpulseV2(contact)
    setPhase('done')
  }, [recordGhostImpulseV2])

  const tryFocusMode = useCallback(() => {
    // iOS: próba otwarcia ustawień Focus Mode
    window.location.href = 'App-Prefs:FOCUS'
    // Fallback info pokazany przez przeglądarkę
  }, [])

  const progress = selectedDuration.seconds > 0
    ? ((selectedDuration.seconds - seconds) / selectedDuration.seconds) * 100
    : 100

  // ── Faza: setup ──────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-dark/97 backdrop-blur-md animate-fade-in px-6">
        <div className="w-full max-w-sm text-center">
          <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] mb-8">
            Emergency Lock
          </p>
          <div className="text-4xl mb-6">🛡️</div>
          <h2 className="font-serif text-ivory text-xl leading-snug mb-2">
            Jak długo chcesz się zamknąć?
          </h2>
          <p className="font-sans text-xs text-ivory/40 mb-10 tracking-wide">
            Timer nie da się anulować. Po zakończeniu będziesz zapytana o wynik.
          </p>

          <div className="flex gap-3 mb-10">
            {DURATIONS.map(d => (
              <button
                key={d.label}
                onClick={() => setSelectedDuration(d)}
                className={clsx(
                  'flex-1 py-4 rounded-xl border font-serif text-sm transition-all',
                  selectedDuration.label === d.label
                    ? 'bg-forest/60 border-gold/50 text-gold'
                    : 'border-ivory/10 bg-forest/20 text-ivory/60 hover:bg-forest/30'
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            onClick={startLock}
            className="w-full py-4 rounded-xl bg-forest border border-gold/30 font-serif text-ivory text-base hover:bg-forest/80 transition-all mb-4"
          >
            Aktywuj Emergency Lock
          </button>
          <button
            onClick={onClose}
            className="font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
          >
            Zamknij
          </button>
        </div>
      </div>
    )
  }

  // ── Faza: locked ─────────────────────────────────────────────────────────────
  if (phase === 'locked') {
    return (
      <div className="fixed inset-0 z-[130] flex flex-col items-center justify-between bg-dark/97 backdrop-blur-md animate-fade-in px-6 py-10">

        {/* Header */}
        <div className="text-center">
          <p className="font-sans text-[11px] text-gold/50 uppercase tracking-[0.2em]">
            Emergency Lock
          </p>
        </div>

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="110" cy="110" r="98" fill="none" stroke="rgba(184,150,62,0.10)" strokeWidth="3" />
              <circle
                cx="110" cy="110" r="98"
                fill="none"
                stroke="rgba(184,150,62,0.50)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 98}`}
                strokeDashoffset={`${2 * Math.PI * 98 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-serif text-ivory/80 text-4xl tabular-nums">
                {formatTime(seconds)}
              </p>
              <p className="font-sans text-xs text-ivory/30 mt-1 tracking-wider">pozostało</p>
            </div>
          </div>

          <p className="font-serif text-ivory/60 text-sm text-center leading-relaxed italic max-w-xs">
            &ldquo;{ROTATING_PHRASES[phraseIdx]}&rdquo;
          </p>
        </div>

        {/* Akcje */}
        <div className="w-full max-w-sm space-y-3">
          {/* Nominated contacts */}
          {contacts.length > 0 && (
            <div>
              <p className="font-sans text-[11px] text-ivory/30 uppercase tracking-wider text-center mb-2">
                Zadzwoń zamiast pisać
              </p>
              <div className="flex gap-2">
                {contacts.map(c => (
                  <a
                    key={c.phone}
                    href={`tel:${c.phone}`}
                    className="flex-1 py-3 rounded-xl border border-gold/20 bg-forest/30 hover:bg-forest/50 transition-all text-center font-sans text-xs text-ivory/80"
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setPhase('save_thought')}
            className="w-full py-3 rounded-xl border border-ivory/10 bg-forest/20 hover:bg-forest/40 transition-all font-sans text-xs text-ivory/60"
          >
            Zapisz myśl → Skarbiec
          </button>

          <button
            onClick={tryFocusMode}
            className="w-full py-3 rounded-xl border border-ivory/10 bg-transparent font-sans text-[11px] text-ivory/30 hover:text-ivory/50 transition-all"
          >
            Aktywuj Focus Mode (iPhone)
          </button>
        </div>
      </div>
    )
  }

  // ── Faza: zapis myśli ─────────────────────────────────────────────────────────
  if (phase === 'save_thought') {
    return (
      <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-dark/97 backdrop-blur-md animate-fade-in px-6">
        <div className="w-full max-w-sm">
          <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] text-center mb-6">
            Zapisz myśl — Skarbiec
          </p>
          {thoughtSaved ? (
            <div className="text-center">
              <div className="text-3xl mb-4">✦</div>
              <p className="font-serif text-ivory/80 text-base">Zapisano w Skarbcu.</p>
            </div>
          ) : (
            <>
              <textarea
                value={thoughtText}
                onChange={e => setThoughtText(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Co teraz czujesz? Co chciałaś powiedzieć?..."
                className="w-full bg-forest/20 border border-ivory/10 rounded-xl px-4 py-3 font-sans text-sm text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/30 resize-none mb-6"
              />
              <button
                onClick={handleSaveThought}
                className="w-full py-3.5 rounded-xl bg-forest/50 border border-gold/20 font-sans text-sm text-ivory hover:bg-forest/70 transition-all mb-3"
              >
                Zapisz
              </button>
              <button
                onClick={() => setPhase('locked')}
                className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
              >
                ← Wróć do timera
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Faza: outcome ─────────────────────────────────────────────────────────────
  if (phase === 'outcome') {
    return (
      <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-dark/97 backdrop-blur-md animate-fade-in px-6">
        <div className="w-full max-w-sm text-center">
          <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] mb-8">
            Emergency Lock — koniec
          </p>
          <p className="font-serif text-ivory text-lg mb-10 leading-snug">
            Timer skończony. Czy był kontakt?
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleOutcome(false)}
              className="py-5 rounded-xl border border-gold/30 bg-forest/30 hover:bg-forest/50 transition-all"
            >
              <p className="font-serif text-ivory text-base mb-1">Nie był</p>
              <p className="font-sans text-gold text-xs">+60 XP</p>
            </button>
            <button
              onClick={() => handleOutcome(true)}
              className="py-5 rounded-xl border border-ivory/10 bg-forest/20 hover:bg-forest/30 transition-all"
            >
              <p className="font-serif text-ivory/80 text-base mb-1">Był</p>
              <p className="font-sans text-ivory/40 text-xs">+10 XP za uczciwość</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Faza: done ────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const noContact = hadContact === false
    return (
      <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-dark/97 backdrop-blur-md animate-fade-in px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-6">{noContact ? '🛡️' : '🤍'}</div>
          <p className="font-serif text-ivory text-xl leading-snug mb-4">
            {noContact ? 'Natalia 30 już to wiedziała.' : 'Uczciwe zalogowanie to odwaga.'}
          </p>
          <p className="font-sans text-ivory/50 text-sm mb-8 leading-relaxed">
            {noContact
              ? 'Emergency Lock ukończony. Każda minuta wytrwałości buduje kogoś nowego.'
              : 'Dane z trudnych chwil są cenniejsze niż każdy sukces.'}
          </p>
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-8">
            <span className="font-sans text-gold text-xs font-semibold tracking-wide">
              +{xpEarned} XP Pozycja
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full font-sans text-sm text-muted-light hover:text-ivory/60 transition-colors tracking-wide py-2"
          >
            Zamknij ✦
          </button>
        </div>
      </div>
    )
  }

  return null
}
