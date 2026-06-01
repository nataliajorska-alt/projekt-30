'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

// Rytownicze glify liniowe — ten sam język co Diamond / Fleuron / RedirectGlyph
// (cienka kreska, currentColor, viewBox 24). Zastępują kolorowe emoji, które
// rozbijały edytorski styl ceremonii.
type CeremonyIcon = 'woda' | 'oddech' | 'iskra'

function CeremonyGlyph({ name, size = 16 }: { name: CeremonyIcon; size?: number }) {
  const glyphs: Record<CeremonyIcon, JSX.Element> = {
    // Szklanka wody — kropla
    woda: <path d="M12 3.5 C12 3.5 6 10 6 14.5 A6 6 0 0 0 18 14.5 C18 10 12 3.5 12 3.5 Z" />,
    // Trzy głębokie oddechy — trzy strumienie powietrza
    oddech: (
      <>
        <path d="M4 7.5 C9 5.5 13 9.5 18 7.5" />
        <path d="M4 12 C9 10 13 14 18 12" />
        <path d="M4 16.5 C9 14.5 13 18.5 18 16.5" />
      </>
    ),
    // Element rutyny porannej — płomień
    iskra: (
      <path d="M12 3.5 C12.5 7 16 8 15.5 12 C17 11.5 17.5 10 17.5 10 C18.5 12.5 19 14 19 15.5 A7 7 0 0 1 5 15.5 C5 12.5 8 11 9 7.5 C9.5 9.5 11 9.5 11.5 8 C12 6.5 11 5 12 3.5 Z" />
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="inline-block shrink-0"
    >
      {glyphs[name]}
    </svg>
  )
}

const RETURN_TASKS: { icon: CeremonyIcon; text: string; time: string }[] = [
  { icon: 'woda', text: 'Wypiłam szklankę wody', time: '1 min' },
  { icon: 'oddech', text: 'Trzy głębokie oddechy — teraz, zanim pójdziesz dalej', time: '2 min' },
  { icon: 'iskra', text: 'Jeden element rutyny porannej — cokolwiek, teraz', time: '5 min' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-deep grain-linen">
      {/* Outer frame */}
      <div className="pointer-events-none absolute inset-6 border border-gold-light/40" />
      <div className="pointer-events-none absolute inset-9 border border-gold-light/15" />
      <div className="pointer-events-none absolute inset-12">
        <CornerBrackets size={20} tone="gold" weight={1} />
      </div>

      {done ? (
        /* ── Success ── */
        <div className="relative text-center animate-fade-in">
          <Fleuron size={20} className="text-gold mx-auto mb-5 inline-block" />
          <p className="font-display text-ivory text-5xl mb-2 leading-none">
            + 200 XP
          </p>
          <GoldRule variant="diamond" tone="gold" className="mt-5 mb-5 max-w-xs mx-auto" />
          <p className="font-serif-body italic text-parchment text-sm tracking-wide">
            powrót jest elegancki.
          </p>
        </div>
      ) : (
        /* ── Ceremony ── */
        <div className="relative max-w-sm w-full animate-fade-in">
          {/* Label */}
          <div className="text-center mb-6">
            <SmallCaps tone="gold-light" tracking="editorial" size="xs">
              Ceremonia powrotu
            </SmallCaps>
            <p className="font-serif-body italic text-parchment/70 text-[13px] mt-1">
              {toRoman(daysMissed)} {daysMissed === 1 ? 'dzień przerwy' : 'dni przerwy'}
            </p>
          </div>

          {/* Headline */}
          <h2 className="font-display text-ivory text-5xl text-center mb-6 leading-none">
            Wróciłaś.
          </h2>

          <GoldRule variant="fleuron" tone="gold" className="mb-7 max-w-xs mx-auto" />

          {/* Quote */}
          <div className="border border-gold-light/25 bg-ivory/5 px-5 py-5 mb-7 relative">
            <Fleuron size={11} className="text-gold absolute -top-2 left-1/2 -translate-x-1/2 bg-forest-deep px-1" />
            <p className="font-serif-body italic text-ivory/85 text-[14px] leading-relaxed">
              „przerwa nie definiuje projektu. powrót go definiuje.
              ja — natalia, dzień trzysta sześćdziesiąt pięć — wróciłam po każdej przerwie.
              właśnie dlatego tu jestem. teraz twoja kolej."
            </p>
            <div className="flex items-center justify-end gap-2 mt-3">
              <Diamond size={4} className="text-gold/60" />
              <SmallCaps tone="gold-light" tracking="luxury" size="xs" className="opacity-60">
                natalia · dzień CCCLXV
              </SmallCaps>
            </div>
          </div>

          {/* Tasks */}
          <div className="flex items-center gap-2 mb-3">
            <Diamond size={5} className="text-gold-light" />
            <SmallCaps tone="parchment" tracking="luxury" size="xs">
              trzy gesty powrotu · max XV minut
            </SmallCaps>
          </div>
          <div className="space-y-2 mb-7">
            {RETURN_TASKS.map((task, i) => {
              const isOn = checked[i]
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 border transition-all text-left',
                    isOn
                      ? 'border-gold bg-ivory/10'
                      : 'border-ivory/15 bg-ivory/5 hover:border-ivory/25'
                  )}
                >
                  <Diamond
                    size={8}
                    filled={isOn}
                    className={isOn ? 'text-gold' : 'text-ivory/30'}
                  />
                  <span className={clsx('flex-shrink-0', isOn ? 'text-gold' : 'text-parchment/60')}>
                    <CeremonyGlyph name={task.icon} size={16} />
                  </span>
                  <span className={clsx(
                    'font-serif-body text-[13.5px] flex-1 leading-snug',
                    isOn ? 'text-ivory italic' : 'text-parchment'
                  )}>
                    {task.text}
                  </span>
                  <SmallCaps
                    tone="parchment"
                    tracking="luxury"
                    size="xs"
                    className="opacity-50 shrink-0"
                  >
                    {task.time}
                  </SmallCaps>
                </button>
              )
            })}
          </div>

          {/* CTA */}
          <button
            onClick={handleComplete}
            disabled={!allChecked || completing}
            className={clsx(
              'w-full py-4 transition-all flex items-center justify-center gap-3 border',
              allChecked
                ? 'bg-gold text-dark-deep border-gold hover:bg-gold-light'
                : 'border-ivory/15 text-parchment/40 cursor-not-allowed bg-ivory/5'
            )}
          >
            <Diamond
              size={5}
              filled={allChecked}
              className={allChecked ? 'text-dark-deep' : 'text-parchment/40'}
            />
            <SmallCaps
              tracking="luxury"
              size="xs"
              className={allChecked ? '!text-dark-deep' : '!text-parchment/40'}
            >
              {completing
                ? 'zapisuję…'
                : allChecked
                  ? 'powrót ukończony · + 200 XP'
                  : 'zaznacz wszystkie gesty'}
            </SmallCaps>
          </button>

          <button
            onClick={onDismiss}
            className="w-full mt-3 py-2 font-ui uppercase tracking-luxury text-[10px] text-parchment/30 hover:text-parchment/60 transition-colors"
          >
            pomiń
          </button>
        </div>
      )}
    </div>
  )
}
