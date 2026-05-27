'use client'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { DAILY_RULES } from '@/lib/routineData'
import { toRoman } from '@/lib/romanNumerals'
import GhostProtocolV2 from './GhostProtocolV2'
import SoothingPicker from './SoothingPicker'

/* ── Rotated-square check matching the design ─────────────────────── */
function CheckSquare({ done }: { done: boolean }) {
  return (
    <span
      className={clsx(
        'inline-block w-[14px] h-[14px] rotate-45 border shrink-0 transition-colors',
        done ? 'bg-gold border-gold' : 'border-gold/70',
      )}
    />
  )
}

export default function NegativeChecklist() {
  const { todayLog, toggleRule } = useGameData()
  const kept = DAILY_RULES.filter(r => todayLog?.keptRules?.includes(r.id)).length
  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'

  return (
    <section className="mt-5 mb-4 border-t border-b border-hairline py-4">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="font-display text-dark text-[22px] leading-none tracking-tight whitespace-nowrap">
            Zasady dnia
          </h2>
          <span className="hidden sm:inline font-serif-body italic text-muted text-[13px]">
            the daily restraint
          </span>
        </div>
        <span className="font-display italic text-gold-deep text-lg leading-none">
          {toRoman(kept)} / {toRoman(DAILY_RULES.length)}
        </span>
      </div>

      {/* Rules */}
      <div>
        {DAILY_RULES.map((rule, idx) => {
          const done = todayLog?.keptRules?.includes(rule.id) ?? false
          const xp = isMinimum ? rule.xp * 2 : rule.xp
          return (
            <div key={rule.id}>
              <button
                onClick={() => toggleRule(rule.id)}
                className={clsx(
                  'w-full flex items-center gap-3.5 py-2.5 text-left transition-colors group hover:bg-cream/30',
                  idx > 0 && 'border-t border-border/60',
                )}
              >
                <CheckSquare done={done} />
                <span
                  className={clsx(
                    'font-serif-body italic text-[15px] leading-snug flex-1',
                    done ? 'text-muted-light' : 'text-dark',
                  )}
                >
                  {rule.text}
                </span>
                <span
                  className={clsx(
                    'font-ui uppercase tracking-luxury text-[10px] shrink-0',
                    done ? 'text-muted-light' : 'text-gold-deep',
                  )}
                >
                  +{xp}
                  {isMinimum && !done && <span className="ml-1.5 opacity-70">× II</span>}
                </span>
              </button>
              {rule.id === 'r1' && <GhostProtocolV2 />}
              {rule.id === 'r3' && <SoothingPicker />}
            </div>
          )
        })}
      </div>

      {kept === DAILY_RULES.length && (
        <p className="mt-4 text-center font-serif-body italic text-muted text-[15px] leading-snug">
          wszystkie zasady — dzień w cichym porządku.
        </p>
      )}
    </section>
  )
}
