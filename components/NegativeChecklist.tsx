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
          // Only the FIRST rule (r1) gets the Ghost Protocol twin inline.
          // SoothingPicker (r3) keeps its own collapsible below-row treatment
          // because its suggestion card expands and doesn't fit inline.
          const hasInlineGhost = rule.id === 'r1'
          const hasBelowSoothing = rule.id === 'r3'
          return (
            <div key={rule.id}>
              <div
                className={clsx(
                  // flex-wrap + ordering: on mobile twin wraps to a second row
                  // (label + xp stay together on the first row). On sm+: all inline.
                  'flex flex-wrap items-center gap-x-3.5 gap-y-2 py-2.5 transition-colors',
                  idx > 0 && 'border-t border-border/60',
                )}
              >
                <button
                  onClick={() => toggleRule(rule.id)}
                  role="checkbox"
                  aria-checked={done}
                  className="order-1 flex items-center gap-3.5 flex-1 min-w-0 text-left group hover:opacity-95"
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
                </button>
                <span
                  className={clsx(
                    'order-2 sm:order-3 font-ui uppercase tracking-luxury text-[10px] shrink-0',
                    done ? 'text-muted-light' : 'text-gold-deep',
                  )}
                >
                  +{xp}
                  {isMinimum && !done && <span className="ml-1.5 opacity-70">× II</span>}
                </span>
                {hasInlineGhost && (
                  <div className="order-3 sm:order-2 w-full sm:w-auto pl-[26px] sm:pl-0">
                    <GhostProtocolV2 />
                  </div>
                )}
              </div>
              {hasBelowSoothing && <SoothingPicker />}
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
