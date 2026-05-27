'use client'

import { useState, useCallback } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useGhostV2 } from '@/hooks/useGhostV2'
import { GHOST_CATEGORIES, INTENSITY_LABELS } from '@/lib/ghost-data'
import type { GhostCategory, GhostLogEntryV2, HonestFailureEntry, GhostOutcome } from '@/types'
import EmergencyLock from './EmergencyLock'
import RedirectEnergyWidget from './RedirectEnergyWidget'
import { SmallCaps, Diamond, Fleuron, GoldRule, CornerBrackets } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

// ─── Types ───────────────────────────────────────────────────────

type ImpulsePhase =
  | 'category' | 'subcategory' | 'intensity'
  | 'intervention' | 'outcome' | 'done'

type HonestPhase =
  | 'honest_start' | 'honest_context' | 'honest_reflection'
  | 'honest_plan' | 'honest_done'

type ActiveFlow = { type: 'impulse'; phase: ImpulsePhase } | { type: 'honest'; phase: HonestPhase }

// ─── Frame ───────────────────────────────────────────────────────

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[120] bg-forest-deep grain-linen animate-fade-in overflow-y-auto">
      <div className="pointer-events-none absolute inset-6 border border-gold-light/40" />
      <div className="pointer-events-none absolute inset-9 border border-gold-light/15" />
      <div className="pointer-events-none absolute inset-12">
        <CornerBrackets size={20} tone="gold" weight={1} />
      </div>
      <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}

function FrameLabel({ children }: { children: React.ReactNode }) {
  return (
    <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div" className="text-center mb-6">
      {children}
    </SmallCaps>
  )
}

function GhostButton({
  children,
  onClick,
  variant = 'secondary',
  className,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'soft'
  className?: string
  disabled?: boolean
}) {
  const cls = clsx(
    'w-full py-3.5 transition-all border flex items-center justify-center gap-3',
    variant === 'primary' && 'bg-gold text-dark-deep border-gold hover:bg-gold-light',
    variant === 'secondary' && 'bg-forest/30 border-ivory/15 hover:bg-forest/50 hover:border-gold/40',
    variant === 'soft' && 'bg-transparent border-ivory/10 hover:border-ivory/25',
    disabled && 'opacity-30 cursor-not-allowed',
    className,
  )
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}

// ─── Component ───────────────────────────────────────────────────

export default function GhostProtocolV2() {
  const { todayLog, recordGhostImpulseV2, recordHonestFailure } = useGameData()
  const { saveImpulseEntry, saveFailureEntry } = useGhostV2()

  const [flow, setFlow] = useState<ActiveFlow | null>(null)
  const [showEmergencyLock, setShowEmergencyLock] = useState(false)

  // Impulse
  const [selectedCategory, setSelectedCategory] = useState<GhostCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<GhostOutcome | null>(null)
  const [hadContact, setHadContact] = useState<boolean | null>(null)
  const [xpEarned, setXpEarned] = useState(0)

  // Honest
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

  const startHonest = useCallback(() => {
    setFlow({ type: 'honest', phase: 'honest_start' })
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

  // ─── Trigger row ────────────────────────────────────────────────

  if (!flow) {
    // Inline twin buttons matching design `.zasada .twin .btn` — solid border, compact, gold glyph
    return (
      <div className="inline-flex items-center gap-2 shrink-0">
        <button
          onClick={() => setFlow({ type: 'impulse', phase: 'category' })}
          className="inline-flex items-center gap-1.5 border border-hairline hover:border-gold transition-colors px-3 py-1.5 font-ui uppercase tracking-[0.32em] text-[10px] text-muted hover:text-dark"
        >
          <span className="text-gold text-[9px] leading-none">◆</span>
          <span>Mam impuls</span>
        </button>
        <button
          onClick={startHonest}
          className="inline-flex items-center gap-1.5 border border-hairline hover:border-gold transition-colors px-3 py-1.5 font-ui uppercase tracking-[0.32em] text-[10px] text-muted hover:text-dark"
        >
          <span className="text-gold text-[9px] leading-none">∴</span>
          <span>Już zrobiłam</span>
        </button>
      </div>
    )
  }

  // ─── IMPULSE FLOW ───────────────────────────────────────────────

  if (flow.type === 'impulse') {
    const phase = flow.phase

    // Category
    if (phase === 'category') {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Ghost Protocol</FrameLabel>
            <h2 className="font-display text-ivory text-3xl text-center leading-tight mb-2">
              Co się dzieje?
            </h2>
            <p className="font-serif-body italic text-parchment text-[14px] text-center mb-8">
              jeden tap. bez myślenia.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GHOST_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => pickCategory(cat.id)}
                  className="flex flex-col items-start gap-2 px-4 py-4 border border-ivory/15 bg-forest/20 hover:bg-forest/40 hover:border-gold/40 transition-all text-left"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <SmallCaps tone="ivory" tracking="luxury" size="xs">
                    {cat.label}
                  </SmallCaps>
                  <p className="font-serif-body italic text-parchment/70 text-[11px] leading-tight">
                    {cat.sublabel}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-7"
            >
              zamknij
            </button>
          </div>
        </Frame>
      )
    }

    // Subcategory
    if (phase === 'subcategory' && categoryMeta) {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Ghost Protocol</FrameLabel>
            <div className="flex items-center gap-2 justify-center mb-2">
              <span className="text-lg">{categoryMeta.icon}</span>
              <h2 className="font-display text-ivory text-2xl">{categoryMeta.label}</h2>
            </div>
            <p className="font-serif-body italic text-parchment text-[14px] text-center mb-8">
              dokładniej — co konkretnie?
            </p>
            <div className="space-y-2.5">
              {categoryMeta.subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => pickSubcategory(sub)}
                  className="w-full flex items-center gap-3 text-left px-5 py-3.5 border border-ivory/15 bg-forest/20 hover:bg-forest/40 hover:border-gold/40 transition-all"
                >
                  <Diamond size={5} className="text-gold-light/50 shrink-0" />
                  <span className="font-serif-body text-[14px] text-ivory/85">{sub}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setFlow({ type: 'impulse', phase: 'category' })}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-7"
            >
              ‹  wróć
            </button>
          </div>
        </Frame>
      )
    }

    // Intensity
    if (phase === 'intensity') {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Ghost Protocol</FrameLabel>
            <h2 className="font-display text-ivory text-3xl text-center leading-tight mb-2">
              Jak mocno?
            </h2>
            <p className="font-serif-body italic text-parchment text-[14px] text-center mb-8">
              uczciwa odpowiedź daje lepszą interwencję.
            </p>
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map(val => {
                const info = INTENSITY_LABELS[val]
                const high = val >= 4
                const mid = val === 3
                return (
                  <button
                    key={val}
                    onClick={() => pickIntensity(val)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 border border-ivory/15 bg-forest/20 hover:bg-forest/40 hover:border-gold/40 transition-all text-left"
                  >
                    <span
                      className={clsx(
                        'flex-shrink-0 w-9 h-9 border flex items-center justify-center',
                        high ? 'border-gold' : mid ? 'border-gold/50' : 'border-ivory/30'
                      )}
                    >
                      <span
                        className={clsx(
                          'font-display text-lg leading-none',
                          high ? 'text-gold' : mid ? 'text-gold/70' : 'text-ivory/60'
                        )}
                      >
                        {toRoman(val)}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-ivory text-[14px] leading-tight">{info.name}</p>
                      <p className="font-serif-body italic text-parchment/70 text-[12px] mt-0.5 leading-snug">
                        {info.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setFlow({ type: 'impulse', phase: 'subcategory' })}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-7"
            >
              ‹  wróć
            </button>
          </div>
        </Frame>
      )
    }

    // Intervention
    if (phase === 'intervention' && categoryMeta && selectedIntensity !== null) {
      const intensityInfo = INTENSITY_LABELS[selectedIntensity]
      return (
        <Frame>
          <div className="w-full max-w-sm text-center">
            <FrameLabel>Ghost Protocol</FrameLabel>

            <div className="inline-flex items-center gap-2 border border-gold-light/30 px-3.5 py-1.5 mb-7">
              <Diamond size={4} className="text-gold" />
              <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                {intensityInfo.name}
              </SmallCaps>
            </div>

            <div className="text-3xl mb-6">{categoryMeta.icon}</div>

            <div className="bg-forest/30 border border-gold-light/20 px-6 py-6 mb-7 text-left relative">
              <Fleuron
                size={11}
                className="text-gold absolute -top-2 left-1/2 -translate-x-1/2 bg-forest-deep px-1"
              />
              {categoryMeta.intervention.split('\n\n').map((paragraph, i) => (
                <p
                  key={i}
                  className={clsx(
                    'leading-relaxed',
                    i === 0
                      ? 'font-serif-body italic text-ivory text-[15px] mb-4'
                      : 'font-serif-body text-parchment text-[13px]'
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <RedirectEnergyWidget compact />

            {selectedIntensity >= 4 && (
              <button
                onClick={() => setShowEmergencyLock(true)}
                className="w-full py-3.5 mt-5 mb-3 bg-gold/15 border border-gold flex items-center justify-center gap-3 hover:bg-gold/25 transition-all"
              >
                <Diamond size={5} className="text-gold" filled />
                <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                  Emergency Lock
                </SmallCaps>
              </button>
            )}
            <GhostButton
              onClick={finishIntervention}
              variant="secondary"
              className={selectedIntensity < 4 ? 'mt-5' : ''}
            >
              <SmallCaps tone="ivory" tracking="luxury" size="xs">
                gotowe — poczekałam
              </SmallCaps>
            </GhostButton>
            <button
              onClick={reset}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-3"
            >
              zamknij
            </button>
          </div>
        </Frame>
      )
    }

    // Outcome
    if (phase === 'outcome') {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Ghost Protocol</FrameLabel>
            <h2 className="font-display text-ivory text-3xl text-center leading-tight mb-8">
              Jak teraz?
            </h2>

            <div className="space-y-2.5 mb-8">
              {([
                { value: 'better' as const, label: 'Lepiej' },
                { value: 'same' as const,   label: 'Tak samo' },
                { value: 'worse' as const,  label: 'Gorzej' },
              ]).map(o => {
                const sel = outcome === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() => setOutcome(o.value)}
                    className={clsx(
                      'w-full py-3.5 border transition-all flex items-center justify-center gap-3',
                      sel
                        ? 'bg-forest/50 border-gold'
                        : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                    )}
                  >
                    {sel && <Diamond size={5} className="text-gold" filled />}
                    <SmallCaps
                      tone={sel ? 'gold-light' : 'parchment'}
                      tracking="luxury"
                      size="xs"
                    >
                      {o.label}
                    </SmallCaps>
                  </button>
                )
              })}
            </div>

            <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="text-center mb-3 opacity-70">
              Był kontakt?
            </SmallCaps>
            <div className="grid grid-cols-2 gap-3 mb-7">
              {([
                { value: false, label: 'Nie był' },
                { value: true,  label: 'Był' },
              ] as const).map(c => {
                const sel = hadContact === c.value
                return (
                  <button
                    key={String(c.value)}
                    onClick={() => setHadContact(c.value)}
                    className={clsx(
                      'py-3 border transition-all flex items-center justify-center gap-2',
                      sel
                        ? 'bg-forest/50 border-gold'
                        : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                    )}
                  >
                    {sel && <Diamond size={4} className="text-gold" filled />}
                    <SmallCaps tone={sel ? 'gold-light' : 'parchment'} tracking="luxury" size="xs">
                      {c.label}
                    </SmallCaps>
                  </button>
                )
              })}
            </div>

            <GhostButton
              disabled={outcome === null || hadContact === null}
              variant="primary"
              onClick={() => outcome !== null && hadContact !== null && submitOutcome(outcome, hadContact)}
            >
              <Diamond size={5} className="text-dark-deep" filled />
              <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
                zapisz
              </SmallCaps>
            </GhostButton>
          </div>
        </Frame>
      )
    }

    // Done
    if (phase === 'done') {
      const noContact = hadContact === false
      return (
        <Frame>
          <div className="w-full max-w-sm text-center">
            <FrameLabel>Ghost Protocol</FrameLabel>
            <Fleuron size={20} className="text-gold mx-auto mb-6 inline-block" />
            <p className="font-display text-ivory text-3xl leading-tight mb-4">
              {noContact ? 'Natalia 30 już to wiedziała.' : 'Uczciwe zalogowanie to odwaga.'}
            </p>
            <p className="font-serif-body italic text-parchment text-[14px] mb-7 leading-relaxed">
              {noContact
                ? 'każdy raz kiedy nie piszesz, budujesz kogoś, kto nie musi.'
                : 'dane z porażki są cenniejsze niż każdy sukces.'}
            </p>
            <GoldRule variant="diamond" tone="gold" className="max-w-xs mx-auto mb-6" />
            <div className="inline-flex items-center gap-3 border border-gold-light/40 px-5 py-2 mb-8">
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="gold-light" tracking="luxury" size="sm">
                + {toRoman(xpEarned)} XP Pozycja
              </SmallCaps>
              <Diamond size={5} className="text-gold" />
            </div>
            <button
              onClick={reset}
              className="w-full font-ui uppercase tracking-luxury text-[10px] text-parchment/70 hover:text-parchment transition-colors py-2"
            >
              zamknij  ◆
            </button>
          </div>
        </Frame>
      )
    }
  }

  // ─── HONEST FLOW ────────────────────────────────────────────────

  if (flow.type === 'honest') {
    const phase = flow.phase

    if (phase === 'honest_start') {
      return (
        <Frame>
          <div className="w-full max-w-sm text-center">
            <FrameLabel>Uczciwy Log</FrameLabel>
            <Fleuron size={20} className="text-gold mx-auto mb-6 inline-block" />
            <h2 className="font-display text-ivory text-3xl leading-tight mb-4">
              Napisałaś. Stało się.
            </h2>
            <p className="font-serif-body italic text-parchment text-[14px] leading-relaxed mb-10">
              nie ma kary, nie ma wstydu. jest wiedza, którą możemy razem wyciągnąć.
              uczciwe zalogowanie daje + 15 XP — bo jest źródłem danych cenniejszych niż każdy sukces.
            </p>
            <GhostButton
              variant="primary"
              onClick={() => setFlow({ type: 'honest', phase: 'honest_context' })}
            >
              <Diamond size={5} className="text-dark-deep" filled />
              <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
                zaloguj co się stało
              </SmallCaps>
            </GhostButton>
            <button
              onClick={reset}
              className="font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-4"
            >
              zamknij
            </button>
          </div>
        </Frame>
      )
    }

    if (phase === 'honest_context') {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Uczciwy Log · kontekst</FrameLabel>
            <h2 className="font-display text-ivory text-2xl text-center mb-7">
              Co Cię sprowokowało?
            </h2>

            <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-3 opacity-70">
              Kategoria
            </SmallCaps>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {GHOST_CATEGORIES.map(cat => {
                const sel = hCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setHCategory(cat.id); setHSubcategory(null) }}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2.5 border text-left transition-all',
                      sel
                        ? 'bg-forest/50 border-gold'
                        : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                    )}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <SmallCaps tone={sel ? 'gold-light' : 'parchment'} tracking="luxury" size="xs">
                      {cat.label}
                    </SmallCaps>
                  </button>
                )
              })}
            </div>

            {hCategoryMeta && (
              <>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-3 opacity-70">
                  Dokładniej
                </SmallCaps>
                <div className="space-y-2 mb-6">
                  {hCategoryMeta.subcategories.map(sub => {
                    const sel = hSubcategory === sub
                    return (
                      <button
                        key={sub}
                        onClick={() => setHSubcategory(sub)}
                        className={clsx(
                          'w-full flex items-center gap-3 text-left px-4 py-2.5 border transition-all',
                          sel
                            ? 'bg-forest/50 border-gold'
                            : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                        )}
                      >
                        <Diamond size={4} className={sel ? 'text-gold' : 'text-gold-light/30'} filled={sel} />
                        <span className={clsx(
                          'font-serif-body text-[13px]',
                          sel ? 'text-ivory italic' : 'text-parchment/85'
                        )}>
                          {sub}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {hSubcategory && (
              <>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-3 opacity-70">
                  Intensywność
                </SmallCaps>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map(val => {
                    const sel = hIntensity === val
                    return (
                      <button
                        key={val}
                        onClick={() => setHIntensity(val)}
                        className={clsx(
                          'flex-1 py-3 border transition-all',
                          sel
                            ? 'bg-forest/50 border-gold'
                            : 'border-ivory/15 bg-forest/20 hover:bg-forest/30'
                        )}
                      >
                        <span className={clsx(
                          'font-display text-base leading-none',
                          sel ? 'text-gold' : 'text-parchment/60'
                        )}>
                          {toRoman(val)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <GhostButton
              variant="primary"
              disabled={!hCategory || !hSubcategory || hIntensity === null}
              onClick={() => setFlow({ type: 'honest', phase: 'honest_reflection' })}
            >
              <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
                dalej  ›
              </SmallCaps>
            </GhostButton>
            <button
              onClick={reset}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-3"
            >
              zamknij
            </button>
          </div>
        </Frame>
      )
    }

    if (phase === 'honest_reflection') {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Uczciwy Log · refleksja</FrameLabel>

            <div className="space-y-6 mb-8">
              <div>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
                  Co mogło Cię zatrzymać?
                </SmallCaps>
                <textarea
                  value={hStopped}
                  onChange={e => setHStopped(e.target.value)}
                  rows={3}
                  placeholder="czego zabrakło w tym momencie…"
                  className="w-full bg-forest/20 border border-ivory/15 px-4 py-3 font-serif-body italic text-[14px] text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
                  Jak się czujesz teraz?
                </SmallCaps>
                <textarea
                  value={hFeeling}
                  onChange={e => setHFeeling(e.target.value)}
                  rows={3}
                  placeholder="zanim on odpowie, zanim cokolwiek…"
                  className="w-full bg-forest/20 border border-ivory/15 px-4 py-3 font-serif-body italic text-[14px] text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
            </div>

            <GhostButton
              variant="primary"
              onClick={() => setFlow({ type: 'honest', phase: 'honest_plan' })}
            >
              <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
                dalej  ›
              </SmallCaps>
            </GhostButton>
            <button
              onClick={reset}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-3"
            >
              zamknij
            </button>
          </div>
        </Frame>
      )
    }

    if (phase === 'honest_plan') {
      return (
        <Frame>
          <div className="w-full max-w-sm">
            <FrameLabel>Uczciwy Log · plan</FrameLabel>
            <h2 className="font-display text-ivory text-2xl text-center mb-2 leading-tight">
              Plan na następny raz
            </h2>
            <p className="font-serif-body italic text-parchment text-[13px] text-center mb-7">
              co chcesz zmienić, żeby następnym razem było inaczej?
            </p>

            <textarea
              value={hPlan}
              onChange={e => setHPlan(e.target.value)}
              rows={5}
              placeholder="następnym razem gdy poczuję tęsknotę bez powodu, zamiast pisać…"
              className="w-full bg-forest/20 border border-ivory/15 px-4 py-3 font-serif-body italic text-[14px] text-ivory placeholder-ivory/30 focus:outline-none focus:border-gold/50 resize-none mb-8"
            />

            <GhostButton variant="primary" onClick={submitHonest}>
              <Diamond size={5} className="text-dark-deep" filled />
              <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
                zapisz
              </SmallCaps>
            </GhostButton>
            <button
              onClick={reset}
              className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors mt-3"
            >
              zamknij
            </button>
          </div>
        </Frame>
      )
    }

    if (phase === 'honest_done') {
      return (
        <Frame>
          <div className="w-full max-w-sm text-center">
            <FrameLabel>Uczciwy Log</FrameLabel>
            <Fleuron size={20} className="text-gold mx-auto mb-6 inline-block" />
            <h2 className="font-display text-ivory text-3xl leading-tight mb-4">
              Uczciwość jest siłą.
            </h2>
            <p className="font-serif-body italic text-parchment text-[14px] leading-relaxed mb-7">
              każdy wpis w tym logu to wzorzec, który kiedyś przestanie się powtarzać.
              nie przez wolę — przez rozumienie.
            </p>
            <GoldRule variant="diamond" tone="gold" className="max-w-xs mx-auto mb-6" />
            <div className="inline-flex items-center gap-3 border border-gold-light/40 px-5 py-2 mb-8">
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="gold-light" tracking="luxury" size="sm">
                + XV XP Pozycja
              </SmallCaps>
              <Diamond size={5} className="text-gold" />
            </div>
            <button
              onClick={reset}
              className="w-full font-ui uppercase tracking-luxury text-[10px] text-parchment/70 hover:text-parchment transition-colors py-2"
            >
              zamknij  ◆
            </button>
          </div>
        </Frame>
      )
    }
  }

  if (showEmergencyLock) {
    return <EmergencyLock onClose={() => { setShowEmergencyLock(false); reset() }} />
  }

  return null
}
