'use client'

import { useState, useCallback } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { GHOST_CATEGORIES, INTENSITY_LABELS } from '@/lib/ghost-data'
import type { GhostCategory, GhostLogEntryV2, HonestFailureEntry, GhostOutcome } from '@/types'
import EmergencyLock from './EmergencyLock'
import clsx from 'clsx'

// ─── Flow types ───────────────────────────────────────────────────────────────

type ImpulsePhase =
  | 'category'
  | 'subcategory'
  | 'intensity'
  | 'intervention'
  | 'outcome'
  | 'done'

type HonestPhase =
  | 'honest_start'
  | 'honest_context'
  | 'honest_reflection'
  | 'honest_plan'
  | 'honest_done'

type ActiveFlow = { type: 'impulse'; phase: ImpulsePhase } | { type: 'honest'; phase: HonestPhase }

// ─── Shared overlay wrapper ───────────────────────────────────────────────────

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-dark/95 backdrop-blur-md animate-fade-in px-6 py-8 overflow-y-auto">
      {children}
    </div>
  )
}

function OverlayHeader({ label = 'Ghost Protocol' }: { label?: string }) {
  return (
    <p className="font-sans text-[11px] text-gold/70 uppercase tracking-[0.2em] text-center mb-6">
      {label}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GhostProtocolV2() {
  const { todayLog, recordGhostImpulseV2, recordHonestFailure } = useGameData()
  const { saveImpulseEntry, saveFailureEntry } = useGhostV2()

  const [flow, setFlow] = useState<ActiveFlow | null>(null)
  const [showEmergencyLock, setShowEmergencyLock] = useState(false)

  // Impulse state
  const [selectedCategory, setSelectedCategory] = useState<GhostCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<GhostOutcome | null>(null)
  const [hadContact, setHadContact] = useState<boolean | null>(null)
  const [xpEarned, setXpEarned] = useState(0)

  // Honest failure state
  const [hCategory, setHCategory] = useState<GhostCategory | null>(null)
  const [hSubcategory, setHSubcategory] = useState<string | null>(null)
  const [hIntensity, setHIntensity] = useState<number | null>(null)
  const [hStopped, setHStopped] = useState('')
  const [hFeeling, setHFeeling] = useState('')
  const [hPlan, setHPlan] = useState('')

  const reset = useCallback(() => {
    setFlow(null)
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setSelectedIntensity(null)
    setOutcome(null)
    setHadContact(null)
    setXpEarned(0)
    setHCategory(null)
    setHSubcategory(null)
    setHIntensity(null)
    setHStopped('')
    setHFeeling('')
    setHPlan('')
  }, [])

  const categoryMeta = selectedCategory
    ? GHOST_CATEGORIES.find(c => c.id === selectedCategory) ?? null
    : null

  const hCategoryMeta = hCategory
    ? GHOST_CATEGORIES.find(c => c.id === hCategory) ?? null
    : null

  // ─── Impulse flow handlers ─────────────────────────────────────────────────

  const pickCategory = useCallback((id: GhostCategory) => {
    setSelectedCategory(id)
    setFlow({ type: 'impulse', phase: 'subcategory' })
  }, [])

  const pickSubcategory = useCallback((sub: string) => {
    setSelectedSubcategory(sub)
    setFlow({ type: 'impulse', phase: 'intensity' })
  }, [])

  const pickIntensity = useCallback((val: number) => {
    setSelectedIntensity(val)
    setFlow({ type: 'impulse', phase: 'intervention' })
  }, [])

  const finishIntervention = useCallback(() => {
    setFlow({ type: 'impulse', phase: 'outcome' })
  }, [])

  const submitOutcome = useCallback(async (o: GhostOutcome, contact: boolean) => {
    setOutcome(o)
    setHadContact(contact)
    const xp = contact ? 10 : 40
    setXpEarned(xp)
    await recordGhostImpulseV2(contact)

    if (selectedCategory && selectedSubcategory && selectedIntensity !== null) {
      const now = new Date()
      const entry: GhostLogEntryV2 = {
        version: 2,
        timestamp: now.getTime(),
        hour: now.getHours(),
        weekday: (now.getDay() + 6) % 7,
        dayMode: todayLog?.dayMode ?? 'normal',
        category: selectedCategory,
        subcategory: selectedSubcategory,
        intensity: selectedIntensity,
        outcome: o,
        hadContact: contact,
        xpEarned: xp,
      }
      await saveImpulseEntry(entry)
    }
    setFlow({ type: 'impulse', phase: 'done' })
  }, [selectedCategory, selectedSubcategory, selectedIntensity, todayLog, recordGhostImpulseV2, saveImpulseEntry])

  // ─── Honest failure flow handlers ─────────────────────────────────────────

  const startHonest = useCallback(() => {
    setFlow({ type: 'honest', phase: 'honest_start' })
  }, [])

  const honestPickCategory = useCallback((id: GhostCategory) => {
    setHCategory(id)
  }, [])

  const honestPickSubcategory = useCallback((sub: string) => {
    setHSubcategory(sub)
  }, [])

  const honestPickIntensity = useCallback((val: number) => {
    setHIntensity(val)
  }, [])

  const submitHonest = useCallback(async () => {
    await recordHonestFailure()
    if (hCategory && hSubcategory && hIntensity !== null) {
      const now = new Date()
      const entry: HonestFailureEntry = {
        timestamp: now.getTime(),
        hour: now.getHours(),
        weekday: (now.getDay() + 6) % 7,
        category: hCategory,
        subcategory: hSubcategory ?? '',
        intensity: hIntensity,
        whatWouldHaveStoppedYou: hStopped,
        howYouFeelNow: hFeeling,
        planForNextTime: hPlan,
        xpEarned: 15,
      }
      await saveFailureEntry(entry)
    }
    setFlow({ type: 'honest', phase: 'honest_done' })
  }, [hCategory, hSubcategory, hIntensity, hStopped, hFeeling, hPlan, recordHonestFailure, saveFailureEntry])

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!flow) {
    return (
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setFlow({ type: 'impulse', phase: 'category' })}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-muted-light/40 text-muted-light hover:border-muted hover:text-muted transition-all font-sans text-xs tracking-wide"
        >
          <span className="text-[10px]">◇</span>
          <span>Mam impuls</span>
        </button>
        <button
          onClick={startHonest}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-muted-light/30 text-muted-light/60 hover:border-muted-light/60 hover:text-muted-light transition-all font-sans text-xs tracking-wide"
        >
          <span className="text-[10px]">✦</span>
          <span>Już zrobiłam</span>
        </button>
      </div>
    )
  }

  // ─── Impulse phases ────────────────────────────────────────────────────────

  if (flow.type === 'impulse') {
    const phase = flow.phase

    // Tap 1 — Kategoria
    if (phase === 'category') {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader />
            <h2 className="font-serif text-ivory text-xl text-center leading-snug mb-2">
              Co się dzieje?
            </h2>
            <p className="font-sans text-xs text-ivory/40 text-center mb-8 tracking-wide">
              Jeden tap. Bez myślenia.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GHOST_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => pickCategory(cat.id)}
                  className="flex flex-col items-start gap-1.5 px-4 py-4 rounded-xl border border-ivory/10 bg-forest/20 hover:bg-forest/40 hover:border-gold/30 transition-all text-left"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-serif text-ivory/90 text-sm leading-tight">{cat.label}</span>
                  <span className="font-sans text-ivory/40 text-[11px] leading-tight">{cat.sublabel}</span>
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide mt-6"
            >
              Zamknij
            </button>
          </div>
        </Overlay>
      )
    }

    // Tap 2 — Podkategoria
    if (phase === 'subcategory' && categoryMeta) {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader />
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="text-lg">{categoryMeta.icon}</span>
              <h2 className="font-serif text-ivory text-lg">{categoryMeta.label}</h2>
            </div>
            <p className="font-sans text-xs text-ivory/40 text-center mb-8 tracking-wide">
              Dokładniej — co konkretnie?
            </p>
            <div className="space-y-2.5">
              {categoryMeta.subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => pickSubcategory(sub)}
                  className="w-full text-left px-5 py-3.5 rounded-xl border border-ivory/10 bg-forest/20 hover:bg-forest/40 hover:border-gold/30 transition-all font-sans text-sm text-ivory/80"
                >
                  {sub}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFlow({ type: 'impulse', phase: 'category' })}
              className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide mt-6"
            >
              ← Wróć
            </button>
          </div>
        </Overlay>
      )
    }

    // Tap 3 — Intensywność
    if (phase === 'intensity') {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader />
            <h2 className="font-serif text-ivory text-xl text-center leading-snug mb-2">
              Jak mocno?
            </h2>
            <p className="font-sans text-xs text-ivory/40 text-center mb-8 tracking-wide">
              Uczciwa odpowiedź daje lepszą interwencję.
            </p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(val => {
                const info = INTENSITY_LABELS[val]
                return (
                  <button
                    key={val}
                    onClick={() => pickIntensity(val)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border border-ivory/10 bg-forest/20 hover:bg-forest/40 hover:border-gold/30 transition-all text-left"
                  >
                    <span className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-serif text-sm',
                      val <= 2 ? 'border-ivory/30 text-ivory/50' :
                      val === 3 ? 'border-gold/40 text-gold/70' :
                      'border-gold/70 text-gold'
                    )}>
                      {val}
                    </span>
                    <div>
                      <p className="font-serif text-ivory/90 text-sm">{info.name}</p>
                      <p className="font-sans text-ivory/40 text-[11px] mt-0.5">{info.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setFlow({ type: 'impulse', phase: 'subcategory' })}
              className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide mt-6"
            >
              ← Wróć
            </button>
          </div>
        </Overlay>
      )
    }

    // Interwencja
    if (phase === 'intervention' && categoryMeta && selectedIntensity !== null) {
      const intensityInfo = INTENSITY_LABELS[selectedIntensity]
      return (
        <Overlay>
          <div className="w-full max-w-sm text-center">
            <OverlayHeader />

            <div className={clsx(
              'inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8',
              selectedIntensity <= 2 ? 'bg-forest/30 border border-ivory/10' :
              selectedIntensity === 3 ? 'bg-gold/10 border border-gold/20' :
              'bg-gold/15 border border-gold/30'
            )}>
              <span className="font-sans text-xs text-ivory/50 tracking-wide">
                {intensityInfo.name}
              </span>
            </div>

            <div className="text-3xl mb-6">{categoryMeta.icon}</div>

            <div className="bg-forest/30 border border-ivory/10 rounded-2xl px-6 py-6 mb-8 text-left">
              {categoryMeta.intervention.split('\n\n').map((paragraph, i) => (
                <p
                  key={i}
                  className={clsx(
                    'leading-relaxed',
                    i === 0
                      ? 'font-serif text-ivory/90 text-base italic mb-4'
                      : 'font-sans text-ivory/60 text-sm'
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {selectedIntensity >= 4 && (
              <button
                onClick={() => setShowEmergencyLock(true)}
                className="w-full py-3.5 rounded-xl bg-gold/15 border border-gold/40 font-sans text-sm text-ivory hover:bg-gold/25 transition-all mb-3"
              >
                🛡️ Emergency Lock
              </button>
            )}
            <button
              onClick={finishIntervention}
              className="w-full py-3.5 rounded-xl bg-forest/50 border border-ivory/10 font-sans text-sm text-ivory hover:bg-forest/70 transition-all mb-3"
            >
              Gotowe — poczekałam
            </button>
            <button
              onClick={reset}
              className="font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
            >
              Zamknij
            </button>
          </div>
        </Overlay>
      )
    }

    // Outcome
    if (phase === 'outcome') {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader />
            <h2 className="font-serif text-ivory text-xl text-center leading-snug mb-10">
              Jak teraz?
            </h2>

            <div className="space-y-3 mb-10">
              {([
                { value: 'better', label: 'Lepiej' },
                { value: 'same',   label: 'Tak samo' },
                { value: 'worse',  label: 'Gorzej' },
              ] as const).map(o => (
                <button
                  key={o.value}
                  onClick={() => setOutcome(o.value)}
                  className={clsx(
                    'w-full py-3.5 rounded-xl border font-sans text-sm transition-all',
                    outcome === o.value
                      ? 'bg-forest/50 border-gold/40 text-ivory'
                      : 'border-ivory/10 bg-forest/20 text-ivory/70 hover:bg-forest/30 hover:border-ivory/20'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <p className="font-sans text-xs text-ivory/50 text-center tracking-wide mb-4">
              Był kontakt?
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {([
                { value: false, label: 'Nie był' },
                { value: true,  label: 'Był' },
              ] as const).map(c => (
                <button
                  key={String(c.value)}
                  onClick={() => setHadContact(c.value)}
                  className={clsx(
                    'py-3 rounded-xl border font-sans text-sm transition-all',
                    hadContact === c.value
                      ? 'bg-forest/50 border-gold/40 text-ivory'
                      : 'border-ivory/10 bg-forest/20 text-ivory/70 hover:bg-forest/30'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              disabled={outcome === null || hadContact === null}
              onClick={() => outcome !== null && hadContact !== null && submitOutcome(outcome, hadContact)}
              className="w-full py-3.5 rounded-xl bg-gold/20 border border-gold/30 font-sans text-sm text-ivory disabled:opacity-30 hover:bg-gold/30 transition-all disabled:cursor-not-allowed"
            >
              Zapisz
            </button>
          </div>
        </Overlay>
      )
    }

    // Done
    if (phase === 'done') {
      const noContact = hadContact === false
      return (
        <Overlay>
          <div className="w-full max-w-sm text-center">
            <OverlayHeader />

            <div className="text-4xl mb-6">{noContact ? '🛡️' : '🤍'}</div>

            <p className="font-serif text-ivory text-lg leading-relaxed mb-4">
              {noContact
                ? 'Natalia 30 już to wiedziała.'
                : 'Uczciwe zalogowanie to odwaga.'}
            </p>
            <p className="font-sans text-ivory/50 text-sm mb-8">
              {noContact
                ? 'Każdy raz kiedy nie piszesz, budujesz kogoś, kto nie musi.'
                : 'Dane z porażki są cenniejsze niż każdy sukces.'}
            </p>

            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-8">
              <span className="font-sans text-gold text-xs font-semibold tracking-wide">
                +{xpEarned} XP Pozycja
              </span>
            </div>

            <button
              onClick={reset}
              className="w-full font-sans text-sm text-muted-light hover:text-ivory/60 transition-colors tracking-wide py-2"
            >
              Zamknij ✦
            </button>
          </div>
        </Overlay>
      )
    }
  }

  // ─── Honest failure phases ─────────────────────────────────────────────────

  if (flow.type === 'honest') {
    const phase = flow.phase

    if (phase === 'honest_start') {
      return (
        <Overlay>
          <div className="w-full max-w-sm text-center">
            <OverlayHeader label="Uczciwy Log" />
            <div className="text-4xl mb-6">🤍</div>
            <h2 className="font-serif text-ivory text-xl leading-snug mb-4">
              Napisałaś. Stało się.
            </h2>
            <p className="font-sans text-ivory/60 text-sm leading-relaxed mb-10">
              Nie ma kary, nie ma wstydu. Jest wiedza, którą możemy razem wyciągnąć. Uczciwe zalogowanie daje +15 XP — bo jest źródłem danych cenniejszych niż każdy sukces.
            </p>
            <button
              onClick={() => setFlow({ type: 'honest', phase: 'honest_context' })}
              className="w-full py-3.5 rounded-xl bg-forest/50 border border-ivory/20 font-sans text-sm text-ivory hover:bg-forest/70 transition-all mb-3"
            >
              Zaloguj co się stało
            </button>
            <button
              onClick={reset}
              className="font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
            >
              Zamknij
            </button>
          </div>
        </Overlay>
      )
    }

    if (phase === 'honest_context') {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader label="Uczciwy Log — kontekst" />
            <h2 className="font-serif text-ivory text-lg text-center mb-6">
              Co Cię sprowokowało?
            </h2>

            {/* Kategoria */}
            <p className="font-sans text-[11px] text-ivory/40 uppercase tracking-wider mb-3">Kategoria</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {GHOST_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { honestPickCategory(cat.id); setHSubcategory(null) }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                    hCategory === cat.id
                      ? 'bg-forest/50 border-gold/40 text-ivory'
                      : 'border-ivory/10 bg-forest/20 text-ivory/70 hover:bg-forest/30'
                  )}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="font-sans text-xs leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Podkategoria */}
            {hCategoryMeta && (
              <>
                <p className="font-sans text-[11px] text-ivory/40 uppercase tracking-wider mb-3">Dokładniej</p>
                <div className="space-y-2 mb-6">
                  {hCategoryMeta.subcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => honestPickSubcategory(sub)}
                      className={clsx(
                        'w-full text-left px-4 py-2.5 rounded-xl border font-sans text-xs transition-all',
                        hSubcategory === sub
                          ? 'bg-forest/50 border-gold/40 text-ivory'
                          : 'border-ivory/10 bg-forest/20 text-ivory/70 hover:bg-forest/30'
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Intensywność */}
            {hSubcategory && (
              <>
                <p className="font-sans text-[11px] text-ivory/40 uppercase tracking-wider mb-3">Intensywność</p>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => honestPickIntensity(val)}
                      className={clsx(
                        'flex-1 py-3 rounded-xl border font-serif text-sm transition-all',
                        hIntensity === val
                          ? 'bg-forest/50 border-gold/40 text-gold'
                          : 'border-ivory/10 bg-forest/20 text-ivory/50 hover:bg-forest/30'
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              disabled={!hCategory || !hSubcategory || hIntensity === null}
              onClick={() => setFlow({ type: 'honest', phase: 'honest_reflection' })}
              className="w-full py-3.5 rounded-xl bg-gold/20 border border-gold/30 font-sans text-sm text-ivory disabled:opacity-30 hover:bg-gold/30 transition-all disabled:cursor-not-allowed mb-3"
            >
              Dalej
            </button>
            <button
              onClick={reset}
              className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
            >
              Zamknij
            </button>
          </div>
        </Overlay>
      )
    }

    if (phase === 'honest_reflection') {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader label="Uczciwy Log — refleksja" />

            <div className="space-y-6 mb-8">
              <div>
                <label className="font-sans text-xs text-ivory/50 tracking-wider uppercase block mb-2">
                  Co mogło Cię zatrzymać?
                </label>
                <textarea
                  value={hStopped}
                  onChange={e => setHStopped(e.target.value)}
                  rows={3}
                  placeholder="Czego zabrakło w tym momencie..."
                  className="w-full bg-forest/20 border border-ivory/10 rounded-xl px-4 py-3 font-sans text-sm text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/30 resize-none"
                />
              </div>
              <div>
                <label className="font-sans text-xs text-ivory/50 tracking-wider uppercase block mb-2">
                  Jak się czujesz teraz?
                </label>
                <textarea
                  value={hFeeling}
                  onChange={e => setHFeeling(e.target.value)}
                  rows={3}
                  placeholder="Zanim on odpowie, zanim cokolwiek..."
                  className="w-full bg-forest/20 border border-ivory/10 rounded-xl px-4 py-3 font-sans text-sm text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/30 resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => setFlow({ type: 'honest', phase: 'honest_plan' })}
              className="w-full py-3.5 rounded-xl bg-forest/50 border border-ivory/20 font-sans text-sm text-ivory hover:bg-forest/70 transition-all mb-3"
            >
              Dalej
            </button>
            <button
              onClick={reset}
              className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
            >
              Zamknij
            </button>
          </div>
        </Overlay>
      )
    }

    if (phase === 'honest_plan') {
      return (
        <Overlay>
          <div className="w-full max-w-sm">
            <OverlayHeader label="Uczciwy Log — plan" />
            <h2 className="font-serif text-ivory text-lg text-center mb-2">
              Plan na następny raz
            </h2>
            <p className="font-sans text-xs text-ivory/40 text-center mb-6 tracking-wide">
              Co chcesz zmienić, żeby następnym razem było inaczej?
            </p>

            <textarea
              value={hPlan}
              onChange={e => setHPlan(e.target.value)}
              rows={5}
              placeholder="Następnym razem gdy poczuję tęsknotę bez powodu, zamiast pisać..."
              className="w-full bg-forest/20 border border-ivory/10 rounded-xl px-4 py-3 font-sans text-sm text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/30 resize-none mb-8"
            />

            <button
              onClick={submitHonest}
              className="w-full py-3.5 rounded-xl bg-gold/20 border border-gold/30 font-sans text-sm text-ivory hover:bg-gold/30 transition-all mb-3"
            >
              Zapisz
            </button>
            <button
              onClick={reset}
              className="w-full text-center font-sans text-xs text-muted-light hover:text-ivory/60 transition-colors tracking-wide"
            >
              Zamknij
            </button>
          </div>
        </Overlay>
      )
    }

    if (phase === 'honest_done') {
      return (
        <Overlay>
          <div className="w-full max-w-sm text-center">
            <OverlayHeader label="Uczciwy Log" />
            <div className="text-4xl mb-6">🤍</div>
            <h2 className="font-serif text-ivory text-xl leading-snug mb-4">
              Uczciwość jest siłą.
            </h2>
            <p className="font-sans text-ivory/60 text-sm leading-relaxed mb-8">
              Każdy wpis w tym logu to wzorzec, który kiedyś przestanie się powtarzać. Nie przez wolę — przez rozumienie.
            </p>
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-8">
              <span className="font-sans text-gold text-xs font-semibold tracking-wide">
                +15 XP Pozycja
              </span>
            </div>
            <button
              onClick={reset}
              className="w-full font-sans text-sm text-muted-light hover:text-ivory/60 transition-colors tracking-wide py-2"
            >
              Zamknij ✦
            </button>
          </div>
        </Overlay>
      )
    }
  }

  // Emergency Lock może być aktywowany niezależnie
  if (showEmergencyLock) {
    return <EmergencyLock onClose={() => { setShowEmergencyLock(false); reset() }} />
  }

  return null
}
