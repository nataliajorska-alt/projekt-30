'use client'
import { useGameData } from '@/hooks/useGameData'
import { NEGATIVE_RULES } from '@/lib/routineData'
import { Shield, Check } from 'lucide-react'
import clsx from 'clsx'

export default function NegativeChecklist() {
  const { todayLog, toggleRule } = useGameData()

  const keptCount = NEGATIVE_RULES.filter(r => todayLog?.keptRules.includes(r.id)).length

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-forest" strokeWidth={1.5} />
            <h2 className="font-serif text-dark text-lg">Zasady dziś</h2>
          </div>
          <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
            {keptCount}/{NEGATIVE_RULES.length} dotrzymane
          </span>
        </div>
        <p className="font-sans text-xs text-muted mt-1 ml-6">
          Co dziś <em>nie</em> robiłaś — bo jesteś powyżej tego.
        </p>
      </div>

      <div className="px-5 pb-5 space-y-2">
        {NEGATIVE_RULES.map((rule) => {
          const kept = todayLog?.keptRules.includes(rule.id) ?? false
          return (
            <button
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                kept ? 'bg-forest/10 border border-forest/20' : 'bg-cream/50 border border-transparent hover:border-border'
              )}
            >
              <div className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                kept ? 'bg-forest border-forest' : 'border-border'
              )}>
                {kept && <Check size={11} className="text-white" strokeWidth={2.5} />}
              </div>
              <p className={clsx(
                'font-sans text-sm flex-1',
                kept ? 'text-forest font-medium' : 'text-dark'
              )}>
                {rule.text}
              </p>
              <span className={clsx(
                'font-sans text-[11px] flex-shrink-0',
                kept ? 'text-forest' : 'text-muted-light'
              )}>
                +{rule.xp}
              </span>
            </button>
          )
        })}
      </div>

      {keptCount === NEGATIVE_RULES.length && (
        <div className="mx-5 mb-5 bg-forest/10 rounded-xl px-4 py-3 text-center border border-forest/20">
          <p className="font-serif text-forest text-sm">Wszystkie zasady dotrzymane ✦</p>
          <p className="font-sans text-xs text-forest/70 mt-0.5">Klasa. Zwykła, codzienna klasa.</p>
        </div>
      )}
    </div>
  )
}
