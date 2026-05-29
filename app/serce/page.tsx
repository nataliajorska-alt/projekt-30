'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { useHeartBlock, type HeartBlockRituals } from '@/hooks/useHeartBlock'
import { useGameData } from '@/hooks/useGameData'
import { Play, Pause, RotateCcw, ChevronLeft } from 'lucide-react'
import { XP_VALUES } from '@/lib/gameLogic'
import {
  RitualSurface,
  SmallCaps,
  GoldRule,
  Fleuron,
  Diamond,
  RomanNumeral,
} from '@/components/ui'

// ── Timer ────────────────────────────────────────────────────────

function SectionTimer({ minutes, sectionId }: { minutes: number; sectionId: string }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            setRunning(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  useEffect(() => {
    setSecondsLeft(minutes * 60)
    setRunning(false)
  }, [sectionId, minutes])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const done = secondsLeft === 0

  return (
    <div className="inline-flex items-center gap-2 font-ui text-[11px]">
      <span className={clsx('tabular-nums tracking-wide', done ? 'text-gold' : 'text-muted')}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      {!done && (
        <button
          onClick={() => setRunning(r => !r)}
          className="text-muted hover:text-gold transition-colors"
          aria-label={running ? 'Pauza' : 'Start'}
        >
          {running ? <Pause size={11} /> : <Play size={11} />}
        </button>
      )}
      <button
        onClick={() => { setSecondsLeft(minutes * 60); setRunning(false) }}
        className="text-muted hover:text-gold transition-colors"
        aria-label="Reset"
      >
        <RotateCcw size={11} />
      </button>
    </div>
  )
}

// ── Section frame ────────────────────────────────────────────────

function Section({
  num,
  duration,
  title,
  hint,
  sectionId,
  children,
}: {
  num: number
  duration: string
  title: string
  hint: string
  sectionId: string
  children: React.ReactNode
}) {
  const mins = parseInt(duration, 10)
  return (
    <section className="relative bg-ivory border border-gold-light/40 px-6 py-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <RomanNumeral value={num} className="text-gold-deep text-sm" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              {duration}
            </SmallCaps>
          </div>
          <h2 className="font-heading text-dark text-xl mt-1.5">{title}</h2>
          <p className="font-serif-body italic text-muted text-[13px] mt-1">{hint}</p>
        </div>
        <SectionTimer minutes={mins} sectionId={sectionId} />
      </div>
      {children}
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────

const RITUAL_LABELS: Record<keyof HeartBlockRituals, string> = {
  gratitude: 'Wdzięczność · trzy rzeczy',
  prayer: 'Krótka modlitwa',
  planTomorrow: 'Plan na jutro',
  breath: 'Dziesięć świadomych oddechów',
}

const CLOSING_PHRASE = 'Nie muszę dziś rozwiązać całego życia. Mam tylko wrócić do siebie o jeden krok.'

const TEXTAREA = 'w-full bg-cream/40 border border-hairline px-4 py-3 font-serif-body text-[14px] text-dark placeholder:text-muted-light/70 focus:outline-none focus:border-gold transition-colors resize-y'
const TEXTAREA_SM = 'flex-1 bg-cream/40 border border-hairline px-3 py-2 font-serif-body text-[14px] text-dark placeholder:text-muted-light/70 focus:outline-none focus:border-gold transition-colors resize-y'

export default function HeartBlockPage() {
  const { block, history, loading, weekKey, save, markComplete } = useHeartBlock()
  const { completeHeartBlock, stats } = useGameData()
  const xpAlreadyAwarded = (stats.completedHeartBlocks ?? []).includes(weekKey)
  const [pain, setPain] = useState('')
  const [thoughts, setThoughts] = useState<[string, string, string]>(['', '', ''])
  const [steps, setSteps] = useState<[string, string, string]>(['', '', ''])
  const [closing, setClosing] = useState('')
  const [rituals, setRituals] = useState<HeartBlockRituals>({
    gratitude: false, prayer: false, planTomorrow: false, breath: false,
  })
  const [showHistory, setShowHistory] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (block) {
      setPain(block.pain)
      setThoughts(block.thoughts)
      setSteps(block.steps)
      setClosing(block.closing)
      setRituals(block.rituals)
    }
  }, [block?.weekKey])

  useEffect(() => {
    if (loading || !block) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await save({ pain, thoughts, steps, closing, rituals })
      setSavedAt(new Date())
    }, 1000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [pain, thoughts, steps, closing, rituals, loading])

  const isComplete = !!block?.completedAt
  const filledThoughts = thoughts.filter(t => t.trim()).length
  const filledSteps = steps.filter(s => s.trim()).length
  const ritualsKept = Object.values(rituals).filter(Boolean).length
  const canComplete = pain.trim().length > 20 && filledThoughts >= 1 && filledSteps >= 1

  if (loading) {
    return (
      <RitualSurface tone="forest-deep" frame="double">
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-12">
          <div className="h-32 bg-forest/40 animate-pulse" />
        </div>
      </RitualSurface>
    )
  }

  return (
    <RitualSurface tone="forest-deep" frame="double" className="animate-fade-in">
      <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 pt-10 pb-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-ui uppercase tracking-luxury text-[10px] text-parchment hover:text-gold-light transition-colors mb-6"
        >
          <ChevronLeft size={12} /> Wróć
        </Link>

        {/* EDITORIAL HEADER */}
        <header className="text-center">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Library at Dusk · Blok Serca · {weekKey}
          </SmallCaps>
          <h1 className="font-display text-ivory text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.05] mt-4">
            Raz w tygodniu,
            <span className="block font-serif-body italic text-parchment text-[clamp(1.1rem,2.3vw,1.35rem)] mt-2">
              czterdzieści pięć — sześćdziesiąt minut
            </span>
          </h1>
          <GoldRule variant="fleuron" tone="gold" className="mt-6 max-w-xs mx-auto" />
          <p className="font-serif-body italic text-parchment text-[15px] leading-relaxed mt-6 max-w-md mx-auto">
            nie codziennie. nie obsesyjnie. nie przez pół nocy.
            <br />
            w bloku, z ramą, z wyjściem — daj sobie miejsce na ból,
            <br />
            ale nie czyń z bólu centrum zarządzania tygodniem.
          </p>
        </header>

        {/* COMPLETE BANNER */}
        {isComplete && (
          <div className="mt-10 flex items-center justify-center gap-3 border border-gold-light/30 bg-forest/40 px-6 py-4">
            <Diamond size={6} className="text-gold-light" />
            <p className="font-serif-body italic text-parchment text-[14px] text-center">
              ten tydzień jest zamknięty. możesz wracać i czytać, ale nie musisz.
            </p>
            <Diamond size={6} className="text-gold-light" />
          </div>
        )}

        {/* THE DOCUMENT LABEL */}
        <div className="mt-12 mb-6 flex items-center gap-2">
          <Diamond size={6} className="text-gold" />
          <SmallCaps tone="gold-light" tracking="luxury" size="xs">
            cztery sekcje · pisma tygodnia
          </SmallCaps>
        </div>

        {/* Section I — Co boli */}
        <Section
          num={1}
          duration="10 minut"
          title="Co boli?"
          hint="pisz bez analizy — tylko fakty emocjonalne."
          sectionId="pain"
        >
          <textarea
            value={pain}
            onChange={e => setPain(e.target.value)}
            placeholder="co dziś najbardziej boli? co wraca? co nie odpuszcza?"
            rows={6}
            className={TEXTAREA}
          />
        </Section>

        {/* Section II — 3 myśli, które niszczą */}
        <Section
          num={2}
          duration="15 minut"
          title="Trzy myśli, które mnie niszczą"
          hint={'nazwij je. „już nikt mnie tak nie pokocha." „zmarnowałam czas." „nie byłam wystarczająca."'}
          sectionId="thoughts"
        >
          <div className="space-y-2">
            {thoughts.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <RomanNumeral
                  value={i + 1}
                  className="text-gold-deep text-sm font-heading mt-2.5 w-5 shrink-0"
                />
                <textarea
                  value={t}
                  onChange={e => {
                    const next = [...thoughts] as [string, string, string]
                    next[i] = e.target.value
                    setThoughts(next)
                  }}
                  placeholder={i === 0 ? 'pierwsza myśl, która wraca i niszczy…' : 'kolejna…'}
                  rows={2}
                  className={TEXTAREA_SM}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Section III — 3 kroki pod kontrolą */}
        <Section
          num={3}
          duration="15 minut"
          title="Trzy kroki pod moją kontrolą"
          hint="co możesz zrobić w tym tygodniu, co realnie zależy od Ciebie."
          sectionId="steps"
        >
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <RomanNumeral
                  value={i + 1}
                  className="text-gold-deep text-sm font-heading mt-2.5 w-5 shrink-0"
                />
                <textarea
                  value={s}
                  onChange={e => {
                    const next = [...steps] as [string, string, string]
                    next[i] = e.target.value
                    setSteps(next)
                  }}
                  placeholder={i === 0 ? 'np. nie piszę, śpię lepiej, jeden ruch zawodowy…' : 'kolejny krok…'}
                  rows={2}
                  className={TEXTAREA_SM}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Section IV — Zamknięcie */}
        <Section
          num={4}
          duration="5–10 minut"
          title="Zamknięcie"
          hint="wdzięczność · modlitwa · plan jutra · oddech."
          sectionId="closing"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {(Object.keys(RITUAL_LABELS) as Array<keyof HeartBlockRituals>).map(key => {
              const on = rituals[key]
              return (
                <button
                  key={key}
                  onClick={() => setRituals(r => ({ ...r, [key]: !r[key] }))}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 border text-left transition-all',
                    on
                      ? 'bg-cream border-gold'
                      : 'bg-cream/30 border-hairline hover:border-gold-light'
                  )}
                >
                  <Diamond
                    size={9}
                    filled={on}
                    className={on ? 'text-gold' : 'text-muted-light'}
                  />
                  <span
                    className={clsx(
                      'font-serif-body text-[13px]',
                      on ? 'text-dark italic' : 'text-dark/80'
                    )}
                  >
                    {RITUAL_LABELS[key]}
                  </span>
                </button>
              )
            })}
          </div>

          <textarea
            value={closing}
            onChange={e => setClosing(e.target.value)}
            placeholder="krótka notatka zamknięcia — co zabierasz, za co jesteś wdzięczna…"
            rows={3}
            className={TEXTAREA}
          />

          {/* Closing inscription */}
          <div className="mt-6 relative bg-forest-deep grain-linen border border-gold-light/30 px-5 py-5">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-ivory px-2">
              <Fleuron size={10} className="text-gold" />
            </div>
            <p className="font-serif-body italic text-parchment text-[14px] leading-relaxed text-center">
              „{CLOSING_PHRASE}"
            </p>
          </div>
        </Section>

        {/* STATUS LINE */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <SmallCaps tone="parchment" tracking="luxury" size="xs">
            {savedAt
              ? `zapisano · ${savedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
              : 'autozapis aktywny'}
          </SmallCaps>
          <SmallCaps tone="parchment" tracking="luxury" size="xs">
            {filledThoughts}/3 myśli · {filledSteps}/3 kroki · {ritualsKept}/4 rytuały
          </SmallCaps>
        </div>

        {/* COMPLETE BUTTON */}
        {!isComplete && (
          <button
            onClick={async () => {
              await markComplete()
              await completeHeartBlock(weekKey)
            }}
            disabled={!canComplete}
            className={clsx(
              'mt-5 w-full py-4 transition-all flex items-center justify-center gap-3 border',
              canComplete
                ? 'bg-dark-deep border-gold text-ivory hover:bg-forest hover:border-gold-light'
                : 'bg-forest/40 border-hairline/40 text-parchment/60 cursor-not-allowed'
            )}
          >
            {canComplete ? (
              <>
                <Diamond size={6} className="text-gold" />
                <SmallCaps tone="ivory" tracking="luxury" size="sm">
                  zamknij blok serca tego tygodnia
                </SmallCaps>
                {!xpAlreadyAwarded && (
                  <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                    + {XP_VALUES.heartBlock} XP
                  </SmallCaps>
                )}
                <Diamond size={6} className="text-gold" />
              </>
            ) : (
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                wypełnij minimum · ból + jedna myśl + jeden krok
              </SmallCaps>
            )}
          </button>
        )}

        {isComplete && xpAlreadyAwarded && (
          <div className="mt-5 border border-gold-light/30 px-4 py-3 flex items-center justify-center gap-3">
            <Diamond size={6} className="text-gold-light" />
            <SmallCaps tone="parchment" tracking="luxury" size="xs">
              + {XP_VALUES.heartBlock} XP zapisane na filar „pozycja"
            </SmallCaps>
            <Diamond size={6} className="text-gold-light" />
          </div>
        )}

        {/* HISTORY */}
        {history.length > 0 && (
          <div className="mt-12 border-t border-gold-deep/30 pt-8">
            <button
              onClick={() => setShowHistory(s => !s)}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <Diamond size={6} className="text-gold-light" />
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                {showHistory ? 'ukryj' : 'pokaż'} poprzednie tygodnie ·{' '}
                {history.filter(h => h.weekKey !== weekKey).length}
              </SmallCaps>
            </button>
            {showHistory && (
              <div className="mt-6 space-y-3">
                {history.filter(h => h.weekKey !== weekKey).map(h => (
                  <div
                    key={h.weekKey}
                    className="bg-ivory/95 border border-gold-light/25 px-4 py-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                        {h.weekKey}
                      </SmallCaps>
                      {h.completedAt && <Diamond size={6} className="text-gold" />}
                    </div>
                    {h.pain && (
                      <p className="font-serif-body italic text-dark/85 text-[13px] leading-relaxed line-clamp-3">
                        {h.pain}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SIGNATURE */}
        <footer className="mt-16">
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-sm mx-auto opacity-40" />
          <div className="mt-4 flex items-center justify-center gap-3">
            <Fleuron size={10} className="text-gold-deep" />
            <SmallCaps tone="parchment" tracking="editorial" size="xs">
              ex libris · natalia · {weekKey}
            </SmallCaps>
            <Fleuron size={10} className="text-gold-deep" />
          </div>
        </footer>
      </div>
    </RitualSurface>
  )
}
