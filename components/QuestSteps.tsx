'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SmallCaps, Diamond, RomanNumeral } from '@/components/ui'

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
    <div className="mt-3 border-t border-hairline pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            Droga do celu
          </SmallCaps>
          <span
            className={clsx(
              'font-ui uppercase tracking-luxury text-[10px] border px-2 py-0.5',
              doneCount === total ? 'border-gold text-gold' : 'border-hairline text-muted'
            )}
          >
            {doneCount}/{total}
          </span>
        </div>
        {open ? (
          <ChevronUp size={12} className="text-muted" strokeWidth={1.5} />
        ) : (
          <ChevronDown size={12} className="text-muted" strokeWidth={1.5} />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-1.5">
          {steps.map((step, idx) => {
            const done = completed.has(idx)
            return (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                className={clsx(
                  'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all',
                  done ? 'bg-gold-pale/60' : 'bg-cream/40 hover:bg-cream'
                )}
              >
                <RomanNumeral
                  value={idx + 1}
                  className={clsx(
                    'text-[12px] mt-0.5 w-5 shrink-0 text-center',
                    done ? 'text-gold' : 'text-muted'
                  )}
                />
                <Diamond
                  size={5}
                  filled={done}
                  className={clsx('mt-1.5 shrink-0', done ? 'text-gold' : 'text-hairline')}
                />
                <span
                  className={clsx(
                    'font-serif-body text-[13px] leading-snug flex-1',
                    done ? 'text-muted line-through decoration-1 italic' : 'text-dark'
                  )}
                >
                  {step}
                </span>
              </button>
            )
          })}
          {doneCount === total && (
            <p className="font-serif-body italic text-gold-deep text-[12.5px] text-center pt-2">
              ◆ wszystkie etapy zaliczone — możesz oznaczyć quest jako ukończony
            </p>
          )}
        </div>
      )}
    </div>
  )
}
