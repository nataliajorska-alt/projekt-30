'use client'
import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'

const RETURN_TASKS = [
  { icon: '💧', text: 'Wypiłam szklankę wody', time: '1 min' },
  { icon: '🌬️', text: '3 głębokie oddechy — teraz, zanim pójdziesz dalej', time: '2 min' },
  { icon: '🔥', text: 'Jeden element rutyny porannej — cokolwiek, teraz', time: '5 min' },
]

interface Props {
  daysMissed: number
  onComplete: () => Promise<void>
  onDismiss: () => void
}

export default function ReturnCeremony({ daysMissed, onComplete, onDismiss }: Props) {
  const [checked, setChecked] = useState([false, false, false])
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(false)

  const allChecked = checked.every(Boolean)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onDismiss, 2800)
    return () => clearTimeout(t)
  }, [done, onDismiss])

  const handleComplete = async () => {
    if (!allChecked || completing) return
    setCompleting(true)
    await onComplete()
    setCompleting(false)
    setDone(true)
  }

  const toggle = (i: number) =>
    setChecked(prev => prev.map((v, j) => (j === i ? !v : v)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,36,32,0.97)', backdropFilter: 'blur(4px)' }}>

      {done ? (
        /* ── Success ── */
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-5">✦</div>
          <p className="font-serif text-ivory text-3xl mb-2">+200 XP</p>
          <p className="font-sans text-ivory/50 text-sm tracking-wide">Powrót jest elegancki.</p>
        </div>
      ) : (
        /* ── Ceremony ── */
        <div className="max-w-sm w-full animate-fade-in">

          {/* Label */}
          <p className="font-sans text-gold/60 text-[10px] uppercase tracking-[0.2em] text-center mb-6">
            Ceremonia powrotu · {daysMissed} {daysMissed === 1 ? 'dzień' : daysMissed < 5 ? 'dni' : 'dni'} przerwy
          </p>

          {/* Headline */}
          <h2 className="font-serif text-ivory text-3xl text-center mb-6 leading-tight">
            Wróciłaś.
          </h2>

          {/* Quote from Natalia 30 */}
          <div className="rounded-2xl px-5 py-4 mb-7"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-serif text-ivory/75 text-sm leading-relaxed italic">
              "Przerwa nie definiuje projektu. Powrót go definiuje.
              Ja — Natalia, dzień 365 — wróciłam po każdej przerwie.
              Właśnie dlatego tu jestem. Teraz Twoja kolej."
            </p>
            <p className="font-sans text-gold/40 text-[10px] uppercase tracking-widest mt-3 text-right">
              — Natalia, dzień 365
            </p>
          </div>

          {/* Tasks */}
          <p className="font-sans text-[10px] text-ivory/30 uppercase tracking-widest mb-3">
            3 gesty powrotu · max 15 minut
          </p>
          <div className="space-y-2 mb-6">
            {RETURN_TASKS.map((task, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                  checked[i]
                    ? 'border-gold/30 bg-gold/8'
                    : 'border-white/8 bg-white/3 hover:border-white/20'
                )}
                style={checked[i] ? { backgroundColor: 'rgba(184,150,62,0.08)' } : { backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <div className={clsx(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                  checked[i] ? 'bg-gold border-gold' : 'border-white/25'
                )}>
                  {checked[i] && <Check size={10} className="text-dark" strokeWidth={3} />}
                </div>
                <span className="text-base flex-shrink-0">{task.icon}</span>
                <span className="font-sans text-sm text-ivory/75 flex-1 leading-snug">{task.text}</span>
                <span className="font-sans text-[10px] text-ivory/25 flex-shrink-0">{task.time}</span>
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleComplete}
            disabled={!allChecked || completing}
            className={clsx(
              'w-full py-4 rounded-xl font-sans text-sm font-medium transition-all',
              allChecked
                ? 'bg-gold text-dark hover:opacity-90'
                : 'text-ivory/25 cursor-not-allowed'
            )}
            style={!allChecked ? { backgroundColor: 'rgba(255,255,255,0.07)' } : undefined}
          >
            {completing
              ? 'Zapisuję...'
              : allChecked
                ? 'Powrót ukończony · +200 XP'
                : 'Zaznacz wszystkie gesty'}
          </button>

          {/* Skip */}
          <button
            onClick={onDismiss}
            className="w-full mt-3 py-2 font-sans text-xs text-ivory/20 hover:text-ivory/40 transition-colors"
          >
            Pomiń
          </button>
        </div>
      )}
    </div>
  )
}
