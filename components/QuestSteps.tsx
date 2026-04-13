'use client'
import { useState, useEffect } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

interface QuestStepsProps {
  questId: string
  steps: string[]
}

function storageKey(questId: string) {
  return `quest_steps_${questId}`
}

function loadCompleted(questId: string): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(storageKey(questId))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

function saveCompleted(questId: string, completed: Set<number>) {
  try {
    localStorage.setItem(storageKey(questId), JSON.stringify(Array.from(completed)))
  } catch {}
}

export default function QuestSteps({ questId, steps }: QuestStepsProps) {
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCompleted(loadCompleted(questId))
  }, [questId])

  const toggle = (idx: number) => {
    const next = new Set(completed)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setCompleted(next)
    saveCompleted(questId, next)
  }

  const doneCount = completed.size
  const total = steps.length

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs text-muted uppercase tracking-wider">Droga do celu</span>
          <span className={clsx(
            'font-sans text-[10px] px-2 py-0.5 rounded-full',
            doneCount === total ? 'bg-gold-pale text-gold' : 'bg-cream text-muted'
          )}>
            {doneCount}/{total}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-muted" strokeWidth={1.5} />
          : <ChevronDown size={14} className="text-muted" strokeWidth={1.5} />
        }
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {steps.map((step, idx) => {
            const done = completed.has(idx)
            return (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                className={clsx(
                  'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
                  done ? 'bg-gold-pale' : 'bg-cream/60 hover:bg-cream'
                )}
              >
                <div className={clsx(
                  'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
                  done ? 'bg-gold border-gold' : 'border-border'
                )}>
                  {done && <Check size={9} className="text-white" strokeWidth={3} />}
                </div>
                <span className={clsx(
                  'font-sans text-xs leading-snug flex-1',
                  done ? 'text-muted line-through' : 'text-dark'
                )}>
                  {step}
                </span>
              </button>
            )
          })}
          {doneCount === total && (
            <p className="font-serif text-xs text-gold text-center pt-1">
              ✦ Wszystkie etapy zaliczone — możesz oznaczyć quest jako ukończony
            </p>
          )}
        </div>
      )}
    </div>
  )
}
