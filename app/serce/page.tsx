'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { useHeartBlock, type HeartBlockRituals } from '@/hooks/useHeartBlock'
import { useGameData } from '@/hooks/useGameData'
import { Play, Pause, RotateCcw, ChevronLeft } from 'lucide-react'
import { XP_VALUES } from '@/lib/gameLogic'
import { RitualSurface, SmallCaps, GoldRule, Fleuron, Diamond } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const ROSE = '#8f4d63'

// ── Timer (rzeczywiste odliczanie) ───────────────────────────────
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
    <div className="inline-flex items-center gap-2.5 font-ui text-[13px]">
      <span
        className="tabular-nums tracking-wide font-display font-medium min-w-[42px] text-center"
        style={{ color: done ? '#8e7338' : running ? ROSE : '#8a7a55' }}
      >
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      {!done && (
        <button onClick={() => setRunning(r => !r)} className="transition-colors" style={{ color: running ? ROSE : '#b7a787' }} aria-label={running ? 'Pauza' : 'Start'}>
          {running ? <Pause size={12} /> : <Play size={12} />}
        </button>
      )}
      <button onClick={() => { setSecondsLeft(minutes * 60); setRunning(false) }} className="text-[#b7a787] hover:text-[#8f4d63] transition-colors" aria-label="Reset">
        <RotateCcw size={12} />
      </button>
    </div>
  )
}

// ── Karta sekcji ─────────────────────────────────────────────────
function Section({ num, duration, title, hint, sectionId, children }: {
  num: number; duration: string; title: string; hint: string; sectionId: string; children: React.ReactNode
}) {
  const mins = parseInt(duration, 10)
  return (
    <section className="serce-card px-7 md:px-10 py-8 mb-5">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-baseline gap-4">
          <span className="font-display italic font-medium text-[42px] leading-[0.8] tracking-[-1px]" style={{ color: ROSE }}>{toRoman(num)}</span>
          <span className="font-ui uppercase tracking-luxury text-[9px] whitespace-nowrap" style={{ color: '#8a7a55' }}>{duration}</span>
        </div>
        <SectionTimer minutes={mins} sectionId={sectionId} />
      </div>
      <h2 className="relative inline-block font-display font-medium text-[18px] text-dark mt-4 pb-2.5 border-b" style={{ borderColor: '#d9cda8' }}>
        {title}
        <span className="absolute left-0 -bottom-px w-9 h-px" style={{ background: ROSE }} />
      </h2>
      <p className="font-serif-body italic text-[13px] mt-3" style={{ color: '#8a7a55' }}>{hint}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

const RITUAL_LABELS: Record<keyof HeartBlockRituals, string> = {
  gratitude: 'Wdzięczność · trzy rzeczy',
  prayer: 'Krótka modlitwa',
  planTomorrow: 'Plan na jutro',
  breath: 'Dziesięć świadomych oddechów',
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
      <style>{`
        .serce-card{position:relative;background:#dcd5bc;color:#2a2a26;border:1px solid rgba(178,147,85,.20);box-shadow:0 14px 34px -28px rgba(0,0,0,.5)}
        .serce-card::before,.serce-card::after{content:"";position:absolute;width:11px;height:11px;border:1px solid #c9b27f;opacity:.85;pointer-events:none}
        .serce-card::before{top:9px;left:9px;border-right:0;border-bottom:0}
        .serce-card::after{bottom:9px;right:9px;border-left:0;border-top:0}
        .serce-ta{width:100%;resize:vertical;color:#2a2a26;font-family:'Cormorant Garamond','EB Garamond',serif;font-size:14px;line-height:28px;padding:7px 18px 14px;outline:none;background-color:#d2cab0;background-image:repeating-linear-gradient(#d2cab0,#d2cab0 27px,#c3b994 27px,#c3b994 28px);border:1px solid #d9cda8;transition:border-color .15s,box-shadow .15s}
        .serce-ta::placeholder{color:#b7a787;font-style:italic}
        .serce-ta:focus{border-color:#b56a82;box-shadow:0 0 0 3px rgba(181,106,130,.12)}
      `}</style>

      <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 pt-10 pb-16">
        <Link href="/" className="inline-flex items-center gap-1 font-ui uppercase tracking-luxury text-[10px] text-parchment hover:text-gold-light transition-colors mb-6">
          <ChevronLeft size={12} /> Wróć
        </Link>

        {/* Header */}
        <header className="text-center">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Library at Dusk · Blok Serca · {weekKey}
          </SmallCaps>
          <h1 className="font-display text-ivory text-[clamp(1.9rem,5vw,2.5rem)] leading-[1.05] mt-4">
            Raz w tygodniu,
            <span className="block font-serif-body italic text-parchment text-[14px] mt-2">
              czterdzieści pięć — sześćdziesiąt minut
            </span>
          </h1>
          <GoldRule variant="fleuron" tone="gold" className="mt-6 max-w-xs mx-auto" />
          <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] mt-6 max-w-md mx-auto">
            nie codziennie. nie obsesyjnie. nie przez pół nocy.
            <br />
            w bloku, z ramą, z wyjściem — daj sobie miejsce na ból,
            <br />
            ale nie czyń z bólu centrum zarządzania tygodniem.
          </p>
        </header>

        {isComplete && (
          <div className="mt-10 flex items-center justify-center gap-3 border border-gold-light/30 bg-forest/40 px-6 py-4">
            <Diamond size={6} className="text-gold-light" />
            <p className="font-serif-body italic text-parchment text-[14px] text-center">
              ten tydzień jest zamknięty. możesz wracać i czytać, ale nie musisz.
            </p>
            <Diamond size={6} className="text-gold-light" />
          </div>
        )}

        <div className="mt-12 mb-6 flex items-center gap-2">
          <Diamond size={6} className="text-gold" />
          <SmallCaps tone="gold-light" tracking="luxury" size="xs">cztery sekcje · pisma tygodnia</SmallCaps>
        </div>

        {/* I — Co boli */}
        <Section num={1} duration="10 minut" title="Co boli?" hint="pisz bez analizy — tylko fakty emocjonalne." sectionId="pain">
          <textarea value={pain} onChange={e => setPain(e.target.value)} placeholder="co dziś najbardziej boli? co wraca? co nie odpuszcza?" rows={7} className="serce-ta min-h-[180px]" />
        </Section>

        {/* II — 3 myśli */}
        <Section num={2} duration="15 minut" title="Trzy myśli, które mnie niszczą" hint={'nazwij je. „już nikt mnie tak nie pokocha." „zmarnowałam czas." „nie byłam wystarczająca."'} sectionId="thoughts">
          {thoughts.map((t, i) => (
            <div key={i} className="grid grid-cols-[34px_1fr] gap-4 items-center mt-4 first:mt-0">
              <span className="font-display italic font-medium text-[16px] text-center" style={{ color: '#8e7338' }}>{toRoman(i + 1)}</span>
              <textarea
                value={t}
                onChange={e => { const next = [...thoughts] as [string, string, string]; next[i] = e.target.value; setThoughts(next) }}
                placeholder={i === 0 ? 'pierwsza myśl, która wraca i niszczy…' : 'kolejna…'}
                rows={2}
                className="serce-ta min-h-[78px]"
              />
            </div>
          ))}
        </Section>

        {/* III — 3 kroki */}
        <Section num={3} duration="15 minut" title="Trzy kroki pod moją kontrolą" hint="co możesz zrobić w tym tygodniu, co realnie zależy od Ciebie." sectionId="steps">
          {steps.map((s, i) => (
            <div key={i} className="grid grid-cols-[34px_1fr] gap-4 items-center mt-4 first:mt-0">
              <span className="font-display italic font-medium text-[16px] text-center" style={{ color: '#8e7338' }}>{toRoman(i + 1)}</span>
              <textarea
                value={s}
                onChange={e => { const next = [...steps] as [string, string, string]; next[i] = e.target.value; setSteps(next) }}
                placeholder={i === 0 ? 'np. nie piszę, śpię lepiej, jeden ruch zawodowy…' : 'kolejny krok…'}
                rows={2}
                className="serce-ta min-h-[78px]"
              />
            </div>
          ))}
        </Section>

        {/* IV — Zamknięcie */}
        <Section num={4} duration="5–10 minut" title="Zamknięcie" hint="wdzięczność · modlitwa · plan jutra · oddech." sectionId="closing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(Object.keys(RITUAL_LABELS) as Array<keyof HeartBlockRituals>).map(key => {
              const on = rituals[key]
              return (
                <button
                  key={key}
                  onClick={() => setRituals(r => ({ ...r, [key]: !r[key] }))}
                  className="flex items-center gap-3.5 border px-5 py-4 text-left transition-colors"
                  style={on ? { borderColor: '#b56a82', background: '#f1ebda' } : { borderColor: '#d9cda8', background: '#d6cfb4' }}
                >
                  <span className="w-4 h-4 shrink-0 rotate-45 relative border" style={{ borderColor: on ? ROSE : '#8e7338' }}>
                    {on && <span className="absolute inset-[3px]" style={{ background: ROSE }} />}
                  </span>
                  <span className="font-serif-body text-[14px]" style={{ color: '#2a2a26' }}>{RITUAL_LABELS[key]}</span>
                </button>
              )
            })}
          </div>

          <textarea value={closing} onChange={e => setClosing(e.target.value)} placeholder="krótka notatka zamknięcia — co zabierasz, za co jesteś wdzięczna…" rows={3} className="serce-ta min-h-[92px] mt-4" />

          {/* Kolofon — cytat */}
          <div className="relative mt-6 px-8 md:px-11 py-7 text-center border" style={{ background: '#d3ccaf', borderColor: '#d9cda8' }}>
            <div className="flex items-center justify-center gap-3.5 mb-3">
              <i className="block w-9 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9b27f)' }} />
              <b className="text-[11px] tracking-[0.25em]" style={{ color: ROSE }}>∴</b>
              <i className="block w-9 h-px" style={{ background: 'linear-gradient(90deg, #c9b27f, transparent)' }} />
            </div>
            <p className="font-serif-body italic text-[16px] leading-[1.55]" style={{ color: '#4a4230' }}>„{CLOSING_PHRASE}"</p>
          </div>
        </Section>

        {/* Status */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <SmallCaps tone="parchment" tracking="luxury" size="xs">
            {savedAt ? `zapisano · ${savedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}` : 'autozapis aktywny'}
          </SmallCaps>
          <SmallCaps tone="parchment" tracking="luxury" size="xs">
            {filledThoughts}/3 myśli · {filledSteps}/3 kroki · {ritualsKept}/4 rytuały
          </SmallCaps>
        </div>

        {/* Complete */}
        {!isComplete && (
          <button
            onClick={async () => { await markComplete(); await completeHeartBlock(weekKey) }}
            disabled={!canComplete}
            className={clsx(
              'mt-5 w-full py-4 transition-all flex items-center justify-center gap-3 border',
              canComplete ? 'bg-dark-deep border-gold text-ivory hover:bg-forest hover:border-gold-light' : 'bg-forest/40 border-hairline/40 text-parchment/60 cursor-not-allowed'
            )}
          >
            {canComplete ? (
              <>
                <Diamond size={6} className="text-gold" />
                <SmallCaps tone="ivory" tracking="luxury" size="sm">zamknij blok serca tego tygodnia</SmallCaps>
                {!xpAlreadyAwarded && <SmallCaps tone="gold-light" tracking="luxury" size="xs">+ {XP_VALUES.heartBlock} XP</SmallCaps>}
                <Diamond size={6} className="text-gold" />
              </>
            ) : (
              <SmallCaps tone="parchment" tracking="luxury" size="xs">wypełnij minimum · ból + jedna myśl + jeden krok</SmallCaps>
            )}
          </button>
        )}

        {isComplete && xpAlreadyAwarded && (
          <div className="mt-5 border border-gold-light/30 px-4 py-3 flex items-center justify-center gap-3">
            <Diamond size={6} className="text-gold-light" />
            <SmallCaps tone="parchment" tracking="luxury" size="xs">+ {XP_VALUES.heartBlock} XP zapisane na filar „pozycja"</SmallCaps>
            <Diamond size={6} className="text-gold-light" />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12 border-t border-gold-deep/30 pt-8">
            <button onClick={() => setShowHistory(s => !s)} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <Diamond size={6} className="text-gold-light" />
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                {showHistory ? 'ukryj' : 'pokaż'} poprzednie tygodnie · {history.filter(h => h.weekKey !== weekKey).length}
              </SmallCaps>
            </button>
            {showHistory && (
              <div className="mt-6 space-y-3">
                {history.filter(h => h.weekKey !== weekKey).map(h => (
                  <div key={h.weekKey} className="border px-5 py-4" style={{ background: 'rgba(244,239,227,0.05)', borderColor: 'rgba(178,147,85,0.18)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <SmallCaps tone="gold-light" tracking="luxury" size="xs">{h.weekKey}</SmallCaps>
                      {h.completedAt && <Diamond size={6} className="text-gold" />}
                    </div>
                    {h.pain && (
                      <p className="font-serif-body italic text-[13px] leading-[1.75] line-clamp-3" style={{ color: '#b6ad8e' }}>{h.pain}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signature */}
        <footer className="mt-16">
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-sm mx-auto opacity-40" />
          <div className="mt-4 flex items-center justify-center gap-3">
            <Fleuron size={10} className="text-gold-deep" />
            <SmallCaps tone="parchment" tracking="editorial" size="xs">ex libris · natalia · {weekKey}</SmallCaps>
            <Fleuron size={10} className="text-gold-deep" />
          </div>
        </footer>
      </div>
    </RitualSurface>
  )
}
