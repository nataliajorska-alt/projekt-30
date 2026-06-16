'use client'

// Mostek — rozładowanie ładunku z układu nerwowego.
// Pięć etapów, jeden tap wejścia, nic nie zapisywane. Wszystkie losowania
// liczone raz na wejście (useState z leniwą inicjalizacją), żaden stan nie
// idzie do storage — po wyjściu z ekranu przepada. Tak ma być: brak logu,
// licznika, oceny.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SmallCaps, GoldRule, Fleuron, Diamond } from '@/components/ui'
import {
  MOSTEK_KOTWICE, MOSTEK_ODDECHY, MOSTEK_OBSERWACJE,
  MOSTEK_RUCH, MOSTEK_RUCH_STALA, MOSTEK_ZAMKNIECIA,
  pickMostek, pickMostekN, type MostekBreath,
} from '@/lib/mostek-data'

type Stage = 'kotwica' | 'oddech' | 'obserwacja' | 'ruch' | 'zamkniecie'

// ─── Oddech ───────────────────────────────────────────────────────
// Sekwencja faz skompilowana z wariantu. Niezmiennik: wydech > wdech.
// Tryb westchnienia dzieli wdech na dwa kroki (drugi krótki, dobierający).

type BreathPhase = { label: string; scale: number; dur: number }

function buildSequence(b: MostekBreath): BreathPhase[] {
  if (b.sigh) {
    const first = Math.max(2, Math.round(b.inhale * 0.6))
    const second = Math.max(1, b.inhale - first)
    return [
      { label: 'wdech', scale: 1.24, dur: first },
      { label: 'dobierz', scale: 1.42, dur: second },
      { label: 'wydech', scale: 1, dur: b.exhale },
    ]
  }
  return [
    { label: 'wdech', scale: 1.42, dur: b.inhale },
    { label: 'wydech', scale: 1, dur: b.exhale },
  ]
}

// Próg odsłonięcia przejścia dalej — żeby nie przeklikać oddechu w 3 sekundy.
const REVEAL_NEXT_CYCLES = 6
// Próg cichego wyjścia — Mostek nie trzyma, ale i nie pozwala kliknąć od razu.
const REVEAL_SKIP_CYCLES = 2

function BreathStage({ breath, onAdvance }: { breath: MostekBreath; onAdvance: () => void }) {
  const seq = useMemo(() => buildSequence(breath), [breath])

  const [stepIdx, setStepIdx] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [remaining, setRemaining] = useState(seq[0].dur)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Reduced motion: skala stoi, rytm niesie słowo fazy + odliczanie.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  // Start pierwszego wdechu z pozycji spoczynkowej (skala 1 → cel), żeby
  // pierwsza animacja się odegrała, a nie wskoczyła na gotowo.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Krok po kroku przez sekwencję, w kółko. Po zawinięciu liczymy cykl.
  // Następny krok liczony poza updaterem stanu (żeby StrictMode nie podwoił cykli).
  useEffect(() => {
    const step = seq[stepIdx]
    const t = setTimeout(() => {
      const next = (stepIdx + 1) % seq.length
      setStepIdx(next)
      if (next === 0) setCycles(c => c + 1)
    }, step.dur * 1000)
    return () => clearTimeout(t)
  }, [stepIdx, seq])

  // Odliczanie sekund w bieżącej fazie.
  useEffect(() => {
    setRemaining(seq[stepIdx].dur)
    const iv = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    return () => clearInterval(iv)
  }, [stepIdx, seq])

  const step = seq[stepIdx]
  const scale = mounted ? step.scale : 1

  return (
    <div className="w-full flex flex-col items-center">
      {/* Koło oddechu */}
      <div className="relative flex items-center justify-center h-64 w-64 mb-2" aria-hidden>
        {/* poświata */}
        <div
          className="absolute rounded-full"
          style={{
            width: 150,
            height: 150,
            background: 'radial-gradient(circle, rgba(178,147,85,0.16), rgba(178,147,85,0) 70%)',
            transform: `scale(${scale})`,
            transition: reduceMotion ? 'none' : `transform ${step.dur}s ease-in-out`,
          }}
        />
        {/* obrys */}
        <div
          className="absolute rounded-full border"
          style={{
            width: 130,
            height: 130,
            borderColor: '#b29355',
            transform: `scale(${reduceMotion ? 1.18 : scale})`,
            transition: reduceMotion ? 'none' : `transform ${step.dur}s ease-in-out`,
            opacity: reduceMotion ? (step.label === 'wydech' ? 0.5 : 1) : 0.85,
          }}
        />
        {/* środek — słowo fazy + odliczanie */}
        <div className="relative text-center">
          <div className="font-display italic text-dark text-2xl leading-none">{step.label}</div>
          <div className="font-ui tabular-nums text-gold-deep text-sm mt-1.5">{remaining}</div>
        </div>
      </div>

      <p className="font-serif-body italic text-muted text-[13px] leading-relaxed text-center max-w-xs mt-4">
        {breath.hint}
      </p>

      {/* Sterowanie — odsłaniane stopniowo, Mostek nie trzyma, ale i nie pozwala przeklikać */}
      <div className="mt-8 h-12 flex items-center justify-center">
        {cycles >= REVEAL_NEXT_CYCLES ? (
          <button
            onClick={onAdvance}
            className="inline-flex items-center gap-2.5 border border-hairline hover:border-gold transition-colors px-6 py-3 group"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="dark" tracking="luxury" size="xs">dalej · obserwacja</SmallCaps>
          </button>
        ) : cycles >= REVEAL_SKIP_CYCLES ? (
          <button
            onClick={onAdvance}
            className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-gold-deep transition-colors py-2"
          >
            wystarczy · dalej
          </button>
        ) : (
          <SmallCaps tone="muted-light" tracking="luxury" size="xs">zostań chwilę przy oddechu</SmallCaps>
        )}
      </div>
    </div>
  )
}

// ─── Pojedyncze zdanie (kotwica / zamknięcie) ─────────────────────
function Sentence({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif-body italic text-dark text-[19px] leading-[1.7] text-center max-w-sm">
      {children}
    </p>
  )
}

// ─── Cichy przycisk „dalej" ───────────────────────────────────────
function NextButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 border border-hairline hover:border-gold transition-colors px-6 py-3"
    >
      <Diamond size={5} className="text-gold" />
      <SmallCaps tone="dark" tracking="luxury" size="xs">{label}</SmallCaps>
    </button>
  )
}

// ─── Komponent ────────────────────────────────────────────────────
export default function Mostek() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('kotwica')
  const [obsIdx, setObsIdx] = useState(0)

  // Losowania raz na wejście — leniwa inicjalizacja stanu, nigdy do storage.
  // Po wyjściu z ekranu przepada; przy ponownym wejściu losuje od nowa.
  const [picks] = useState(() => ({
    kotwica: pickMostek(MOSTEK_KOTWICE, 'kotwica', s => s),
    oddech: pickMostek(MOSTEK_ODDECHY, 'oddech', (b: MostekBreath) => b.id),
    obserwacje: pickMostekN(MOSTEK_OBSERWACJE, 3),
    ruch: pickMostek(MOSTEK_RUCH, 'ruch', s => s),
    zamkniecie: pickMostek(MOSTEK_ZAMKNIECIA, 'zamkniecie', s => s),
  }))

  const close = useCallback(() => router.push('/'), [router])

  const advanceObservation = useCallback(() => {
    if (obsIdx + 1 < picks.obserwacje.length) setObsIdx(obsIdx + 1)
    else setStage('ruch')
  }, [obsIdx, picks.obserwacje.length])

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-28 min-h-[100dvh] flex flex-col">
      {/* Wróć */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-ui uppercase tracking-luxury text-[10px] text-muted hover:text-gold-deep transition-colors self-start"
      >
        <ChevronLeft size={12} /> Wróć
      </Link>

      {/* Nagłówek — cichy, bez liczb */}
      <header className="text-center mt-6">
        <SmallCaps tone="gold-deep" tracking="editorial" size="xs">
          Mostek · rozładowanie
        </SmallCaps>
        <GoldRule variant="fleuron" tone="gold" className="mt-4 max-w-[160px] mx-auto" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-10">
        {stage === 'kotwica' && (
          <>
            <Sentence>{picks.kotwica}</Sentence>
            <NextButton label="oddech" onClick={() => setStage('oddech')} />
          </>
        )}

        {stage === 'oddech' && (
          <BreathStage breath={picks.oddech} onAdvance={() => setStage('obserwacja')} />
        )}

        {stage === 'obserwacja' && (
          <>
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              gdzie i jakie — nie dlaczego
            </SmallCaps>
            <p className="font-serif-body italic text-dark text-[20px] leading-[1.65] max-w-sm min-h-[5.5rem] flex items-center">
              {picks.obserwacje[obsIdx]}
            </p>
            {/* postęp — kropki, nie liczby */}
            <div className="flex items-center gap-2" aria-hidden>
              {picks.obserwacje.map((_, i) => (
                <span
                  key={i}
                  className={`block w-1.5 h-1.5 rotate-45 ${i === obsIdx ? 'bg-gold' : 'border border-hairline'}`}
                />
              ))}
            </div>
            <NextButton
              label={obsIdx + 1 < picks.obserwacje.length ? 'dalej' : 'dalej · ruch'}
              onClick={advanceObservation}
            />
          </>
        )}

        {stage === 'ruch' && (
          <>
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              most do ruchu
            </SmallCaps>
            <Sentence>{picks.ruch}</Sentence>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <span className="flex-1 h-px bg-hairline" />
              <span className="text-gold text-xs leading-none">albo</span>
              <span className="flex-1 h-px bg-hairline" />
            </div>
            <p className="font-serif-body italic text-muted text-[15px] leading-relaxed max-w-xs">
              {MOSTEK_RUCH_STALA}
            </p>
            <NextButton label="domknij" onClick={() => setStage('zamkniecie')} />
          </>
        )}

        {stage === 'zamkniecie' && (
          <>
            <Fleuron size={18} className="text-gold-deep" />
            <Sentence>{picks.zamkniecie}</Sentence>
            <button
              onClick={close}
              className="font-ui uppercase tracking-luxury text-[10px] text-muted hover:text-gold-deep transition-colors py-2"
            >
              to wszystko  ◆
            </button>
          </>
        )}
      </main>
    </div>
  )
}
