'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useNominatedContacts } from '@/hooks/useNominatedContacts'
import { useVault } from '@/hooks/useVault'
import { SmallCaps, Diamond, Fleuron, GoldRule, CornerBrackets } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

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

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[130] bg-forest-deep grain-linen animate-fade-in">
      <div className="pointer-events-none absolute inset-6 border border-gold-light/40" />
      <div className="pointer-events-none absolute inset-9 border border-gold-light/15" />
      <div className="pointer-events-none absolute inset-12">
        <CornerBrackets size={20} tone="gold" weight={1} />
      </div>
      {children}
    </div>
  )
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
    window.location.href = 'App-Prefs:FOCUS'
  }, [])

  const progress = selectedDuration.seconds > 0
    ? ((selectedDuration.seconds - seconds) / selectedDuration.seconds) * 100
    : 100

  // ── setup ──
  if (phase === 'setup') {
    return (
      <Frame>
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm text-center">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">
              Emergency Lock
            </SmallCaps>
            <Fleuron size={20} className="text-gold mx-auto my-6 inline-block" />
            <h2 className="font-display text-ivory text-4xl leading-tight mb-3">
              Jak długo chcesz się zamknąć?
            </h2>
            <p className="font-serif-body italic text-parchment text-[14px] mb-10 leading-relaxed">
              timer nie da się anulować. po zakończeniu będziesz zapytana o wynik.
            </p>

            <div className="flex gap-3 mb-10">
              {DURATIONS.map(d => {
                const sel = selectedDuration.label === d.label
                return (
                  <button
                    key={d.label}
                    onClick={() => setSelectedDuration(d)}
                    className={clsx(
                      'flex-1 py-4 border transition-all flex flex-col items-center gap-1',
                      sel
                        ? 'bg-forest/60 border-gold'
                        : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                    )}
                  >
                    {sel && <Diamond size={5} className="text-gold" />}
                    <SmallCaps
                      tone={sel ? 'gold-light' : 'parchment'}
                      tracking="luxury"
                      size="sm"
                    >
                      {d.label}
                    </SmallCaps>
                  </button>
                )
              })}
            </div>

            <button
              onClick={startLock}
              className="w-full py-4 bg-gold text-dark-deep hover:bg-gold-light transition-all mb-4 flex items-center justify-center gap-3"
            >
              <Diamond size={5} className="text-dark-deep" filled />
              <SmallCaps tracking="luxury" size="sm" className="!text-dark-deep">
                Aktywuj Emergency Lock
              </SmallCaps>
              <Diamond size={5} className="text-dark-deep" filled />
            </button>
            <button
              onClick={onClose}
              className="font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors"
            >
              zamknij
            </button>
          </div>
        </div>
      </Frame>
    )
  }

  // ── locked ──
  if (phase === 'locked') {
    return (
      <Frame>
        <div className="relative h-full flex flex-col items-center justify-between px-6 py-12">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Emergency Lock · aktywne
          </SmallCaps>

          {/* Timer ring */}
          <div className="flex flex-col items-center gap-7">
            <div className="relative flex items-center justify-center">
              <svg width="240" height="240" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(184,150,62,0.12)" strokeWidth="1.5" />
                <circle
                  cx="120" cy="120" r="108"
                  fill="none"
                  stroke="rgba(184,150,62,0.60)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 108}`}
                  strokeDashoffset={`${2 * Math.PI * 108 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-display text-ivory text-5xl tabular-nums leading-none">
                  {formatTime(seconds)}
                </p>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-3 block opacity-60">
                  pozostało
                </SmallCaps>
              </div>
            </div>

            <div className="relative max-w-xs text-center px-6">
              <span className="absolute -left-1 top-0 text-gold-light text-2xl font-display leading-none opacity-40">
                „
              </span>
              <p className="font-serif-body italic text-parchment text-[14px] leading-relaxed">
                {ROTATING_PHRASES[phraseIdx]}
              </p>
              <span className="absolute -right-1 bottom-0 text-gold-light text-2xl font-display leading-none opacity-40">
                "
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full max-w-sm space-y-3">
            {contacts.length > 0 && (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Diamond size={5} className="text-gold" />
                  <SmallCaps tone="parchment" tracking="luxury" size="xs">
                    Zadzwoń zamiast pisać
                  </SmallCaps>
                </div>
                <div className="flex gap-2">
                  {contacts.map(c => (
                    <a
                      key={c.phone}
                      href={`tel:${c.phone}`}
                      className="flex-1 py-3 border border-gold/30 bg-forest/30 hover:bg-forest/50 transition-all text-center"
                    >
                      <SmallCaps tone="parchment" tracking="luxury" size="xs">
                        {c.name}
                      </SmallCaps>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setPhase('save_thought')}
              className="w-full py-3 border border-ivory/15 bg-forest/20 hover:bg-forest/40 transition-all"
            >
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                zapisz myśl  ›  skarbiec
              </SmallCaps>
            </button>

            <button
              onClick={tryFocusMode}
              className="w-full py-3 border border-ivory/10 bg-transparent hover:opacity-80 transition-all"
            >
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-50">
                aktywuj focus mode  ·  iphone
              </SmallCaps>
            </button>
          </div>
        </div>
      </Frame>
    )
  }

  // ── save_thought ──
  if (phase === 'save_thought') {
    return (
      <Frame>
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div" className="text-center mb-6">
              Zapisz myśl · Skarbiec
            </SmallCaps>
            {thoughtSaved ? (
              <div className="text-center">
                <Fleuron size={18} className="text-gold mx-auto mb-4 inline-block" />
                <p className="font-serif-body italic text-ivory/85 text-base">
                  zapisano w skarbcu.
                </p>
              </div>
            ) : (
              <>
                <textarea
                  value={thoughtText}
                  onChange={e => setThoughtText(e.target.value)}
                  rows={5}
                  autoFocus
                  placeholder="co teraz czujesz? co chciałaś powiedzieć?…"
                  className="w-full bg-forest/20 border border-ivory/15 px-4 py-3 font-serif-body italic text-[14px] text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/50 resize-none mb-6"
                />
                <button
                  onClick={handleSaveThought}
                  className="w-full py-3.5 bg-gold text-dark-deep hover:bg-gold-light transition-all flex items-center justify-center gap-3 mb-3"
                >
                  <Diamond size={5} className="text-dark-deep" filled />
                  <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
                    zapisz
                  </SmallCaps>
                </button>
                <button
                  onClick={() => setPhase('locked')}
                  className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors"
                >
                  ‹  wróć do timera
                </button>
              </>
            )}
          </div>
        </div>
      </Frame>
    )
  }

  // ── outcome ──
  if (phase === 'outcome') {
    return (
      <Frame>
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm text-center">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">
              Emergency Lock · koniec
            </SmallCaps>
            <GoldRule variant="diamond" tone="gold" className="my-8 max-w-xs mx-auto" />
            <p className="font-display text-ivory text-3xl mb-10 leading-tight">
              Timer skończony.
              <br />
              <span className="font-serif-body italic text-2xl text-parchment">czy był kontakt?</span>
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleOutcome(false)}
                className="py-5 border border-gold bg-forest/30 hover:bg-forest/50 transition-all flex flex-col items-center gap-2"
              >
                <Diamond size={6} className="text-gold" filled />
                <p className="font-display text-ivory text-xl leading-none">Nie był</p>
                <SmallCaps tone="gold-light" tracking="luxury" size="xs">+ 60 XP</SmallCaps>
              </button>
              <button
                onClick={() => handleOutcome(true)}
                className="py-5 border border-ivory/15 bg-forest/20 hover:bg-forest/30 transition-all flex flex-col items-center gap-2"
              >
                <Diamond size={6} className="text-parchment/60" />
                <p className="font-display text-ivory/85 text-xl leading-none">Był</p>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
                  + 10 XP za uczciwość
                </SmallCaps>
              </button>
            </div>
          </div>
        </div>
      </Frame>
    )
  }

  // ── done ──
  if (phase === 'done') {
    const noContact = hadContact === false
    return (
      <Frame>
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm text-center">
            <Fleuron size={20} className="text-gold mx-auto mb-6 inline-block" />
            <p className="font-display text-ivory text-3xl leading-tight mb-4">
              {noContact ? 'Natalia 30 już to wiedziała.' : 'Uczciwe zalogowanie to odwaga.'}
            </p>
            <p className="font-serif-body italic text-parchment text-[14px] mb-8 leading-relaxed">
              {noContact
                ? 'emergency lock ukończony. każda minuta wytrwałości buduje kogoś nowego.'
                : 'dane z trudnych chwil są cenniejsze niż każdy sukces.'}
            </p>
            <GoldRule variant="diamond" tone="gold" className="mb-6 max-w-xs mx-auto" />
            <div className="inline-flex items-center gap-3 border border-gold-light/40 px-5 py-2 mb-8">
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="gold-light" tracking="luxury" size="sm">
                + {toRoman(xpEarned)} XP Pozycja
              </SmallCaps>
              <Diamond size={5} className="text-gold" />
            </div>
            <button
              onClick={onClose}
              className="w-full font-ui uppercase tracking-luxury text-[10px] text-parchment/70 hover:text-parchment transition-colors py-2"
            >
              zamknij  ◆
            </button>
          </div>
        </div>
      </Frame>
    )
  }

  return null
}
