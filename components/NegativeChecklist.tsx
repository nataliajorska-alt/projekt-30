'use client'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { DAILY_RULES } from '@/lib/routineData'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'
import GhostProtocolV2 from './GhostProtocolV2'
import SoothingPicker from './SoothingPicker'

export default function NegativeChecklist() {
  const { todayLog, toggleRule } = useGameData()
  const kept = DAILY_RULES.filter(r => todayLog?.keptRules?.includes(r.id)).length
  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'

  return (
    <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="font-heading text-dark text-xl whitespace-nowrap">Zasady dnia</h2>
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="hidden sm:inline">
              the daily restraint
            </SmallCaps>
          </div>
          <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
            {toRoman(kept)} / {toRoman(DAILY_RULES.length)}
          </SmallCaps>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {DAILY_RULES.map(rule => {
          const done = todayLog?.keptRules?.includes(rule.id) ?? false
          return (
            <div key={rule.id}>
              <button
                onClick={() => toggleRule(rule.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-3 text-left transition-all group',
                  done ? 'bg-gold-pale/60' : 'hover:bg-cream'
                )}
              >
                <span
                  className={clsx(
                    'flex-shrink-0 transition-all',
                    done ? 'text-gold' : 'text-hairline group-hover:text-gold-light'
                  )}
                >
                  <Diamond size={10} filled={done} />
                </span>
                <p
                  className={clsx(
                    'font-serif-body text-[14.5px] leading-snug flex-1',
                    done ? 'text-gold-deep italic' : 'text-dark'
                  )}
                >
                  {rule.text}
                </p>
                <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                  <SmallCaps
                    tone={done ? 'gold' : 'muted'}
                    tracking="luxury"
                    size="xs"
                  >
                    + {isMinimum ? rule.xp * 2 : rule.xp}
                  </SmallCaps>
                  {isMinimum && !done && (
                    <SmallCaps tone="muted" size="xs" className="opacity-70">
                      × II
                    </SmallCaps>
                  )}
                </div>
              </button>
              {rule.id === 'r1' && <GhostProtocolV2 />}
              {rule.id === 'r3' && <SoothingPicker />}
            </div>
          )
        })}
      </div>

      {kept === DAILY_RULES.length && (
        <div className="mx-5 mb-5 border border-gold-light/30 px-5 py-3 text-center">
          <Fleuron size={10} className="text-gold inline-block mb-1" />
          <p className="font-serif-body italic text-gold-deep text-[14px] leading-snug">
            wszystkie zasady — dzień w cichym porządku.
          </p>
        </div>
      )}
    </div>
  )
}
