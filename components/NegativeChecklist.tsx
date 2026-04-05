'use client'
import { useGameData } from '@/hooks/useGameData'
import { DAILY_RULES } from '@/lib/routineData'
import { Check } from 'lucide-react'
import clsx from 'clsx'

export default function NegativeChecklist() {
  const { todayLog, toggleRule } = useGameData()
  const kept = DAILY_RULES.filter(r => todayLog?.keptRules.includes(r.id)).length

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-dark text-lg">Zasady dnia</h2>
          <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
            {kept}/{DAILY_RULES.length}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-2">
        {DAILY_RULES.map(rule => {
          const done = todayLog?.keptRules.includes(rule.id) ?? false
          return (
            <button
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                done ? 'bg-gold-pale border border-gold/20' : 'bg-cream/50 border border-transparent hover:border-border'
              )}
            >
              <div className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                done ? 'bg-gold border-gold' : 'border-border'
              )}>
                {done && <Check size={11} className="text-white" strokeWidth={2.5} />}
              </div>
              <p className={clsx(
                'font-sans text-sm flex-1',
                done ? 'text-gold-dark font-medium' : 'text-dark'
              )}>
                {rule.text}
              </p>
              <span className={clsx('font-sans text-[11px] flex-shrink-0', done ? 'text-gold' : 'text-muted-light')}>
                +{rule.xp}
              </span>
            </button>
          )
        })}
      </div>

      {kept === DAILY_RULES.length && (
        <div className="mx-5 mb-5 bg-dark rounded-xl px-4 py-3 text-center">
          <p className="font-serif text-ivory text-sm">Wszystkie zasady ✦</p>
        </div>
      )}
    </div>
  )
}
