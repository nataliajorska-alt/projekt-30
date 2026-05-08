'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useHeartBlock, type HeartBlockRituals } from '@/hooks/useHeartBlock'
import { useGameData } from '@/hooks/useGameData'
import { Heart, Play, Pause, RotateCcw, Check, ChevronLeft, Clock, Sparkles } from 'lucide-react'
import { XP_VALUES } from '@/lib/gameLogic'
import clsx from 'clsx'

// ── Timer mini-component ─────────────────────────────────────────

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

  // Reset gdy zmieni się sekcja
  useEffect(() => {
    setSecondsLeft(minutes * 60)
    setRunning(false)
  }, [sectionId, minutes])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const done = secondsLeft === 0

  return (
    <div className="inline-flex items-center gap-2 text-xs font-sans">
      <Clock size={11} className="text-muted" />
      <span className={clsx('tabular-nums', done ? 'text-gold-dark font-medium' : 'text-muted')}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      {!done && (
        <button
          onClick={() => setRunning(r => !r)}
          className="text-muted hover:text-dark transition-colors"
          aria-label={running ? 'Pauza' : 'Start'}
        >
          {running ? <Pause size={11} /> : <Play size={11} />}
        </button>
      )}
      <button
        onClick={() => { setSecondsLeft(minutes * 60); setRunning(false) }}
        className="text-muted hover:text-dark transition-colors"
        aria-label="Reset"
      >
        <RotateCcw size={11} />
      </button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────

const RITUAL_LABELS: Record<keyof HeartBlockRituals, string> = {
  gratitude: 'Wdzięczność (3 rzeczy)',
  prayer: 'Krótka modlitwa',
  planTomorrow: 'Plan na jutro',
  breath: '10 świadomych oddechów',
}

const CLOSING_PHRASE = 'Nie muszę dziś rozwiązać całego życia. Mam tylko wrócić do siebie o jeden krok.'

export default function HeartBlockPage() {
  const { block, history, loading, weekKey, save, markComplete } = useHeartBlock()
  const { completeHeartBlock, stats } = useGameData()
  const xpAlreadyAwarded = (stats.completedHeartBlocks ?? []).includes(weekKey)
  const [pain, setPain] = useState('')
  const [thoughts, setThoughts] = useState<[string, string, string]>(['', '', ''])
  const [steps, setSteps] = useState<[string, string, string]>(['', '', ''])
  const [closing, setClosing] = useState('')
  const [rituals, setRituals] = useState<HeartBlockRituals>({ gratitude: false, prayer: false, planTomorrow: false, breath: false })
  const [showHistory, setShowHistory] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydratacja po załadowaniu
  useEffect(() => {
    if (block) {
      setPain(block.pain)
      setThoughts(block.thoughts)
      setSteps(block.steps)
      setClosing(block.closing)
      setRituals(block.rituals)
    }
  }, [block?.weekKey])

  // Autosave z debounce
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
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <div className="h-32 bg-cream rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 animate-fade-in">
      {/* Header */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-sans text-muted hover:text-dark mb-4">
        <ChevronLeft size={14} /> Wróć
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={18} className="text-gold-dark" />
          <p className="font-sans text-xs text-muted uppercase tracking-widest">Blok serca · {weekKey}</p>
        </div>
        <h1 className="font-serif text-dark text-2xl mb-2">Raz w tygodniu, 45–60 minut</h1>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Nie codziennie. Nie obsesyjnie. Nie przez pół nocy. W bloku, z ramą, z wyjściem.
          Daj sobie miejsce na ból, ale nie rób z bólu centrum zarządzania całym tygodniem.
        </p>
      </div>

      {isComplete && (
        <div className="bg-gold-pale border border-gold/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
          <Check size={14} className="text-gold-dark" />
          <p className="font-sans text-sm text-gold-dark">Ten tydzień jest zamknięty. Możesz wracać i czytać, ale nie musisz.</p>
        </div>
      )}

      {/* Section 1 — Co boli */}
      <section className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-sans text-[11px] text-muted uppercase tracking-widest mb-1">Sekcja 1 · 10 minut</p>
            <h2 className="font-serif text-dark text-lg">Co boli?</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Pisz bez analizy. Tylko fakty emocjonalne.</p>
          </div>
          <SectionTimer minutes={10} sectionId="pain" />
        </div>
        <textarea
          value={pain}
          onChange={e => setPain(e.target.value)}
          placeholder="Co dziś najbardziej boli? Co wraca? Co nie odpuszcza?"
          rows={6}
          className="w-full bg-cream/50 border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark placeholder:text-muted-light focus:outline-none focus:border-gold/50 transition-colors resize-y"
        />
      </section>

      {/* Section 2 — 3 myśli, które niszczą */}
      <section className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-sans text-[11px] text-muted uppercase tracking-widest mb-1">Sekcja 2 · 15 minut</p>
            <h2 className="font-serif text-dark text-lg">3 myśli, które mnie niszczą</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Nazwij je. Np. „Już nikt mnie tak nie pokocha.", „Zmarnowałam czas.", „Nie byłam wystarczająca."</p>
          </div>
          <SectionTimer minutes={15} sectionId="thoughts" />
        </div>
        <div className="space-y-2">
          {thoughts.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-serif text-gold-dark text-sm mt-2.5 flex-shrink-0 w-4">{i + 1}.</span>
              <textarea
                value={t}
                onChange={e => {
                  const next = [...thoughts] as [string, string, string]
                  next[i] = e.target.value
                  setThoughts(next)
                }}
                placeholder={i === 0 ? 'Pierwsza myśl, która wraca i niszczy…' : 'Kolejna…'}
                rows={2}
                className="flex-1 bg-cream/50 border border-border rounded-xl px-3 py-2 font-sans text-sm text-dark placeholder:text-muted-light focus:outline-none focus:border-gold/50 transition-colors resize-y"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — 3 kroki pod kontrolą */}
      <section className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-sans text-[11px] text-muted uppercase tracking-widest mb-1">Sekcja 3 · 15 minut</p>
            <h2 className="font-serif text-dark text-lg">3 kroki pod moją kontrolą</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Co możesz zrobić w tym tygodniu, co realnie zależy od Ciebie.</p>
          </div>
          <SectionTimer minutes={15} sectionId="steps" />
        </div>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-serif text-gold-dark text-sm mt-2.5 flex-shrink-0 w-4">{i + 1}.</span>
              <textarea
                value={s}
                onChange={e => {
                  const next = [...steps] as [string, string, string]
                  next[i] = e.target.value
                  setSteps(next)
                }}
                placeholder={i === 0 ? 'np. Nie piszę, śpię lepiej, jeden ruch zawodowy…' : 'Kolejny krok…'}
                rows={2}
                className="flex-1 bg-cream/50 border border-border rounded-xl px-3 py-2 font-sans text-sm text-dark placeholder:text-muted-light focus:outline-none focus:border-gold/50 transition-colors resize-y"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Zamknięcie */}
      <section className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-sans text-[11px] text-muted uppercase tracking-widest mb-1">Sekcja 4 · 5–10 minut</p>
            <h2 className="font-serif text-dark text-lg">Zamknięcie</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Wdzięczność, modlitwa, plan jutra, oddech.</p>
          </div>
          <SectionTimer minutes={10} sectionId="closing" />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {(Object.keys(RITUAL_LABELS) as Array<keyof HeartBlockRituals>).map(key => (
            <button
              key={key}
              onClick={() => setRituals(r => ({ ...r, [key]: !r[key] }))}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all',
                rituals[key] ? 'bg-gold-pale border border-gold/20' : 'bg-cream/50 border border-transparent hover:border-border'
              )}
            >
              <div className={clsx(
                'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                rituals[key] ? 'bg-gold border-gold' : 'border-border'
              )}>
                {rituals[key] && <Check size={9} className="text-white" strokeWidth={2.5} />}
              </div>
              <span className={clsx('font-sans text-xs', rituals[key] ? 'text-gold-dark font-medium' : 'text-dark')}>
                {RITUAL_LABELS[key]}
              </span>
            </button>
          ))}
        </div>

        <textarea
          value={closing}
          onChange={e => setClosing(e.target.value)}
          placeholder="Krótka notatka zamknięcia — co zabierasz z tej sesji, za co jesteś wdzięczna…"
          rows={3}
          className="w-full bg-cream/50 border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark placeholder:text-muted-light focus:outline-none focus:border-gold/50 transition-colors resize-y"
        />

        <div className="mt-4 bg-dark rounded-xl px-4 py-3">
          <p className="font-serif text-ivory text-sm leading-relaxed text-center">
            „{CLOSING_PHRASE}"
          </p>
        </div>
      </section>

      {/* Status + complete */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-sans text-[11px] text-muted">
          {savedAt ? `Zapisano · ${savedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}` : 'Autozapis aktywny'}
        </p>
        <p className="font-sans text-[11px] text-muted">
          {filledThoughts}/3 myśli · {filledSteps}/3 kroki · {ritualsKept}/4 rytuały
        </p>
      </div>

      {!isComplete && (
        <button
          onClick={async () => {
            await markComplete()
            await completeHeartBlock(weekKey)
          }}
          disabled={!canComplete}
          className={clsx(
            'w-full py-3 rounded-xl font-sans text-sm transition-all flex items-center justify-center gap-2',
            canComplete
              ? 'bg-dark text-ivory hover:bg-dark/90'
              : 'bg-cream text-muted-light cursor-not-allowed'
          )}
        >
          {canComplete ? (
            <>
              <span>Zamknij blok serca tego tygodnia</span>
              {!xpAlreadyAwarded && (
                <span className="inline-flex items-center gap-1 text-xs bg-gold/20 text-gold-pale px-2 py-0.5 rounded-full">
                  <Sparkles size={10} /> +{XP_VALUES.heartBlock} XP
                </span>
              )}
            </>
          ) : (
            'Wypełnij minimum: ból + 1 myśl + 1 krok'
          )}
        </button>
      )}

      {isComplete && xpAlreadyAwarded && (
        <div className="bg-cream/50 border border-gold/15 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-gold-dark" />
          <p className="font-sans text-xs text-muted">+{XP_VALUES.heartBlock} XP zapisane na filar „pozycja"</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <button
            onClick={() => setShowHistory(s => !s)}
            className="font-sans text-xs text-muted hover:text-dark transition-colors"
          >
            {showHistory ? 'Ukryj' : 'Pokaż'} poprzednie tygodnie ({history.filter(h => h.weekKey !== weekKey).length})
          </button>
          {showHistory && (
            <div className="mt-4 space-y-3">
              {history.filter(h => h.weekKey !== weekKey).map(h => (
                <div key={h.weekKey} className="bg-cream/40 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-sans text-xs text-muted uppercase tracking-wide">{h.weekKey}</p>
                    {h.completedAt && <Check size={12} className="text-gold-dark" />}
                  </div>
                  {h.pain && <p className="font-sans text-xs text-dark/80 leading-relaxed line-clamp-3">{h.pain}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
