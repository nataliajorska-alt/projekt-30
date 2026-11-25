'use client'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Footprints, Users, Check } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import { todayKey } from '@/lib/gameLogic'
import { addDays } from '@/lib/periodSummary'
import { SmallCaps } from '@/components/ui'

// „Ruch" i „Ludzie" jednym stuknięciem — tam, gdzie i tak się bywa:
// pod szybkimi akcjami na „Dziś" (z poprawką za wczoraj), w check-inie
// nastroju i w wieczornym domknięciu. Wcześniej oba przełączniki siedziały
// tylko w rozwiniętym Magnetyzmie na dnie zakładki „Stan" — a to z nich
// Analizy liczą, co realnie pomaga, więc niezaznaczony dzień psuł porównania.

type Field = 'physicalActivity' | 'socialPresence'
type Variant = 'strip' | 'compact' | 'dark'

const FLAGS: { field: Field; label: string; hint: string; icon: React.ElementType }[] = [
  { field: 'physicalActivity', label: 'Ruch',   hint: 'trening, spacer', icon: Footprints },
  { field: 'socialPresence',   label: 'Ludzie', hint: 'spotkanie, wyjście', icon: Users },
]

function FlagChip({ on, label, hint, icon: Icon, variant, onToggle }: {
  on: boolean
  label: string
  hint: string
  icon: React.ElementType
  variant: Variant
  onToggle: () => void
}) {
  const dark = variant === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={clsx(
        'flex items-center gap-2.5 px-3 border text-left transition-colors',
        variant === 'compact' ? 'min-h-[46px]' : 'min-h-[54px]',
        dark
          ? on ? 'bg-gold/10 border-gold/60 text-gold-light' : 'bg-forest/20 border-ivory/15 text-parchment hover:border-gold/40'
          : on ? 'bg-dark border-dark text-gold-pale' : 'bg-cream/30 border-hairline text-dark hover:border-gold-light active:bg-cream',
      )}
    >
      <span
        className={clsx(
          'shrink-0 w-7 h-7 flex items-center justify-center border',
          dark
            ? on ? 'border-gold text-gold' : 'border-ivory/25 text-parchment/80'
            : on ? 'border-gold text-gold-light' : 'border-hairline text-gold-deep',
        )}
      >
        {on ? <Check size={15} strokeWidth={2} /> : <Icon size={15} strokeWidth={1.5} />}
      </span>
      <span className="min-w-0">
        <span className="block font-ui uppercase tracking-[0.14em] text-[11px] leading-none">{label}</span>
        {variant !== 'compact' && (
          <span className={clsx('block font-serif-body italic text-[13px] leading-tight mt-1 truncate', dark ? 'text-parchment/60' : on ? 'text-parchment/70' : 'text-muted')}>
            {on ? 'zaznaczone' : hint}
          </span>
        )}
      </span>
    </button>
  )
}

export default function DayFlags({ variant = 'strip', className }: { variant?: Variant; className?: string }) {
  const { todayLog, setDayFlag } = useGameData()
  const today = todayLog?.date ?? todayKey()
  const yKey = addDays(today, -1)

  // Wczoraj tylko na pasku „Dziś" i tylko, gdy wczoraj w apce coś było.
  const { logs } = useTimelineData()
  const yLog = variant === 'strip' ? logs[yKey] : undefined
  const [day, setDay] = useState<'today' | 'yesterday'>('today')
  // Wczorajszy log nie ma nasłuchu na żywo — zmiany trzymamy lokalnie od razu.
  const [yOverride, setYOverride] = useState<Partial<Record<Field, boolean>>>({})

  const values = useMemo<Record<Field, boolean>>(() => {
    if (day === 'yesterday' && yLog) {
      return {
        physicalActivity: yOverride.physicalActivity ?? yLog.physicalActivity === true,
        socialPresence: yOverride.socialPresence ?? yLog.socialPresence === true,
      }
    }
    return {
      physicalActivity: todayLog?.physicalActivity === true,
      socialPresence: todayLog?.socialPresence === true,
    }
  }, [day, yLog, yOverride, todayLog])

  if (!todayLog) return null

  const showYesterday = variant === 'strip' && !!yLog
  const activeDay = showYesterday ? day : 'today'

  const toggle = (field: Field) => {
    const next = !values[field]
    if (activeDay === 'yesterday') {
      setYOverride(o => ({ ...o, [field]: next }))
      setDayFlag(yKey, field, next).catch(() => setYOverride(o => ({ ...o, [field]: !next })))
    } else {
      setDayFlag(today, field, next).catch(err => console.error('day flag error:', err))
    }
  }

  const title = activeDay === 'yesterday' ? 'Wczoraj było' : 'Dziś było'
  const dark = variant === 'dark'

  return (
    <section
      aria-label={title}
      className={clsx(
        variant === 'strip' && 'mb-5 border border-hairline bg-ivory px-3 pt-2.5 pb-3',
        variant === 'dark' && 'border border-ivory/15 px-4 py-4',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <SmallCaps tone={dark ? 'gold-light' : 'gold-deep'} tracking="luxury" size="sm">{title}</SmallCaps>
          <span className={clsx('font-serif-body italic text-[13px] truncate', dark ? 'text-parchment/60' : 'text-muted')}>
            stuknij, jeśli tak
          </span>
        </div>
        {showYesterday && (
          <div role="group" aria-label="Który dzień" className="flex shrink-0 border border-hairline">
            {(['today', 'yesterday'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                aria-pressed={day === d}
                className={clsx(
                  'font-ui uppercase tracking-[0.12em] text-[10px] px-2.5 py-1.5 transition-colors',
                  day === d ? 'bg-dark text-ivory' : 'text-muted hover:text-dark',
                )}
              >
                {d === 'today' ? 'dziś' : 'wczoraj'}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FLAGS.map(f => (
          <FlagChip
            key={f.field}
            on={values[f.field]}
            label={f.label}
            hint={f.hint}
            icon={f.icon}
            variant={variant}
            onToggle={() => toggle(f.field)}
          />
        ))}
      </div>
    </section>
  )
}
