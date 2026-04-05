'use client'
import { useGameData } from '@/hooks/useGameData'
import { NEGATIVE_RULES, POSITIVE_RULES } from '@/lib/routineData'
import { Shield, Sparkles, Check } from 'lucide-react'
import clsx from 'clsx'

export default function NegativeChecklist() {
  const { todayLog, toggleRule } = useGameData()

  const negKept = NEGATIVE_RULES.filter(r => todayLog?.keptRules.includes(r.id)).length
  const posKept = POSITIVE_RULES.filter(r => todayLog?.keptRules.includes(r.id)).length
  const allRules = [...NEGATIVE_RULES, ...POSITIVE_RULES]
  const totalKept = allRules.filter(r => todayLog?.keptRules.includes(r.id)).length

  const renderItem = (rule: { id: string; text: string; xp: number }, variant: 'negative' | 'positive') => {
    const kept = todayLog?.keptRules.includes(rule.id) ?? false
    return (
      <button
        key={rule.id}
        onClick={() => toggleRule(rule.id)}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
          kept
            ? variant === 'positive'
              ? 'bg-gold-pale border border-gold/20'
              : 'bg-forest/10 border border-forest/20'
            : 'bg-cream/50 border border-transparent hover:border-border'
        )}
      >
        <div className={clsx(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
          kept
            ? variant === 'positive' ? 'bg-gold border-gold' : 'bg-forest border-forest'
            : 'border-border'
        )}>
          {kept && <Check size={11} className="text-white" strokeWidth={2.5} />}
        </div>
        <p className={clsx(
          'font-sans text-sm flex-1',
          kept
            ? variant === 'positive' ? 'text-gold-dark font-medium' : 'text-forest font-medium'
            : 'text-dark'
        )}>
          {rule.text}
        </p>
        <span className={clsx(
          'font-sans text-[11px] flex-shrink-0',
          kept
            ? variant === 'positive' ? 'text-gold' : 'text-forest'
            : 'text-muted-light'
        )}>
          +{rule.xp}
        </span>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-dark text-lg">Zasady dnia</h2>
          <span className="font-sans text-xs text-muted bg-cream px-2.5 py-1 rounded-full">
            {totalKept}/{allRules.length}
          </span>
        </div>
      </div>

      {/* Czego nie robiłam */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={12} className="text-forest" strokeWidth={1.5} />
          <p className="font-sans text-[10px] text-forest uppercase tracking-widest">Czego nie robiłam</p>
        </div>
        <div className="space-y-1.5">
          {NEGATIVE_RULES.map(r => renderItem(r, 'negative'))}
        </div>
      </div>

      {/* Co zrobiłam */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2 mb-2 mt-1">
          <Sparkles size={12} className="text-gold" strokeWidth={1.5} />
          <p className="font-sans text-[10px] text-gold uppercase tracking-widest">Co zrobiłam</p>
        </div>
        <div className="space-y-1.5">
          {POSITIVE_RULES.map(r => renderItem(r, 'positive'))}
        </div>
      </div>

      {totalKept === allRules.length && (
        <div className="mx-5 mb-5 bg-dark rounded-xl px-4 py-3 text-center">
          <p className="font-serif text-ivory text-sm">Wszystkie zasady ✦</p>
          <p className="font-sans text-xs text-muted-light mt-0.5">Klasa. Zwykła, codzienna klasa.</p>
        </div>
      )}
    </div>
  )
}
