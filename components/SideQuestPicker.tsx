'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { getRandomSideQuest } from '@/lib/questData'
import { getPillar, PILLARS } from '@/lib/pillars'
import type { Quest, Pillar } from '@/types'
import { Shuffle, Check, Star, Undo2, Plus, ChevronDown } from 'lucide-react'
import QuestSteps from './QuestSteps'
import clsx from 'clsx'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
const DIFFICULTY_COLORS = { easy: 'text-green-600 bg-green-50', medium: 'text-amber-600 bg-amber-50', hard: 'text-red-600 bg-red-50' }

const XP_OPTIONS = [
  { label: 'Małe', xp: 60 },
  { label: 'Średnie', xp: 120 },
  { label: 'Duże', xp: 180 },
]

function CustomQuestForm({ onClose }: { onClose: () => void }) {
  const { logCustomSideQuest, todayLog } = useGameData()
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState<Pillar>('pozycja')
  const [xp, setXp] = useState(120)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await logCustomSideQuest(title.trim(), pillar, xp)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setTitle(''); onClose() }, 1200)
  }

  return (
    <div className="border border-dashed border-gold/30 rounded-xl p-4 bg-gold-pale/40 mt-3">
      <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">
        Własny side quest
      </p>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Co zrobiłaś?"
        maxLength={80}
        className="w-full font-sans text-sm text-dark bg-white border border-cream rounded-xl px-3 py-2.5 outline-none focus:border-gold/40 transition-colors placeholder:text-muted-light/60 mb-3"
      />

      {/* Pillar */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {PILLARS.map(p => (
          <button
            key={p.id}
            onClick={() => setPillar(p.id as Pillar)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-sans transition-all',
              pillar === p.id
                ? 'border-gold/50 bg-white font-medium'
                : 'border-border text-muted hover:border-gold/30'
            )}
            style={pillar === p.id ? { color: p.color } : {}}
          >
            <span>{p.icon}</span>
            <span>{p.shortName}</span>
          </button>
        ))}
      </div>

      {/* XP */}
      <div className="flex gap-2 mb-4">
        {XP_OPTIONS.map(opt => (
          <button
            key={opt.xp}
            onClick={() => setXp(opt.xp)}
            className={clsx(
              'flex-1 py-2 rounded-xl border font-sans text-xs transition-all',
              xp === opt.xp
                ? 'bg-dark text-ivory border-dark font-medium'
                : 'border-border text-muted hover:border-dark'
            )}
          >
            {opt.label} · +{opt.xp}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving || saved}
          className="flex-1 flex items-center justify-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 rounded-xl hover:bg-forest transition-colors disabled:opacity-50"
        >
          {saved
            ? <><Check size={13} strokeWidth={2} /> Zapisano ✦</>
            : saving
              ? <div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
              : <><Check size={13} strokeWidth={2} /> Zapisz</>
          }
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-border text-muted font-sans text-sm hover:border-dark transition-colors"
        >
          Anuluj
        </button>
      </div>
    </div>
  )
}

export default function SideQuestPicker() {
  const { todayLog, toggleSideQuest } = useGameData()
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [completed, setCompleted] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)

  const roll = () => {
    const alreadyDone = todayLog?.completedSideQuests ?? []
    const quest = getRandomSideQuest(alreadyDone)
    setActiveQuest(quest)
    setCompleted(false)
  }

  const handleComplete = async () => {
    if (!activeQuest) return
    await toggleSideQuest(activeQuest.id, activeQuest.pillar, activeQuest.xp)
    setCompleted(true)
  }

  const pillar = activeQuest ? getPillar(activeQuest.pillar) : null
  const customDone = todayLog?.customSideQuests ?? []
  const totalDone = (todayLog?.completedSideQuests?.length ?? 0) + customDone.length

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-dark text-lg">Side Quest</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Coś extra. Nie musisz, ale warto.</p>
          </div>
          {totalDone > 0 && (
            <div className="flex items-center gap-1 bg-gold-pale px-2.5 py-1 rounded-full">
              <Star size={11} className="text-gold fill-gold" />
              <span className="font-sans text-xs text-gold font-medium">
                {totalDone} dziś
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Ukończone własne questy */}
        {customDone.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {customDone.map(q => {
              const p = PILLARS.find(p => p.id === q.pillar)
              return (
                <div key={q.id} className="flex items-center gap-3 bg-gold-pale px-3 py-2.5 rounded-xl">
                  <span className="text-base flex-shrink-0">{p?.icon ?? '✦'}</span>
                  <p className="font-sans text-sm text-muted line-through flex-1 min-w-0">{q.title}</p>
                  <span className="font-sans text-xs text-gold flex-shrink-0">+{q.xp} XP</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Losowanie */}
        {!activeQuest ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <p className="font-serif text-muted text-base mb-4">
              Losuj swój side quest na dziś
            </p>
            <button
              onClick={roll}
              className="inline-flex items-center gap-2 bg-dark text-ivory font-sans text-sm px-6 py-3 rounded-xl hover:bg-forest transition-colors"
            >
              <Shuffle size={15} strokeWidth={1.5} />
              Losuj quest
            </button>
          </div>
        ) : (
          <div className={clsx(
            'rounded-xl border p-5 transition-all',
            completed ? 'border-gold/30 bg-gold-pale' : 'border-border bg-cream/30'
          )}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-base">{pillar?.icon}</span>
                  <span
                    className="text-[10px] font-sans uppercase tracking-widest font-medium"
                    style={{ color: pillar?.color }}
                  >
                    {pillar?.shortName}
                  </span>
                  <span className={clsx(
                    'text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded-full font-medium',
                    DIFFICULTY_COLORS[activeQuest.difficulty]
                  )}>
                    {DIFFICULTY_LABELS[activeQuest.difficulty]}
                  </span>
                </div>
                <h3 className="font-serif text-dark text-lg">{activeQuest.title}</h3>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-sans text-xs text-muted-light block">Nagroda</span>
                <span className="font-serif text-gold text-lg">+{activeQuest.xp}</span>
                <span className="font-sans text-xs text-gold-dark"> XP</span>
              </div>
            </div>

            <p className="font-sans text-sm text-muted leading-relaxed mb-4">
              {activeQuest.description}
            </p>

            {activeQuest.tags && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {activeQuest.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-sans text-muted-light bg-parchment px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {activeQuest.steps && activeQuest.steps.length > 0 && (
              <QuestSteps questId={activeQuest.id} steps={activeQuest.steps} />
            )}

            <div className="flex gap-2 mt-4">
              {!completed ? (
                <>
                  <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-2 bg-dark text-ivory font-sans text-sm py-3 rounded-xl hover:bg-forest transition-colors"
                  >
                    <Check size={14} strokeWidth={2} />
                    Ukończono
                  </button>
                  <button
                    onClick={roll}
                    className="flex items-center justify-center gap-2 border border-border text-muted font-sans text-sm px-4 py-3 rounded-xl hover:border-dark hover:text-dark transition-colors"
                  >
                    <Shuffle size={14} strokeWidth={1.5} />
                    Inny
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-gold font-serif text-base">
                    ✦ Side quest ukończony — +{activeQuest.xp} XP
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await toggleSideQuest(activeQuest.id, activeQuest.pillar, activeQuest.xp)
                        setCompleted(false)
                      }}
                      className="inline-flex items-center gap-2 border border-border text-muted font-sans text-xs px-4 py-2 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <Undo2 size={12} strokeWidth={1.5} />
                      Cofnij
                    </button>
                    <button
                      onClick={roll}
                      className="inline-flex items-center gap-2 border border-border text-muted font-sans text-xs px-4 py-2 rounded-xl hover:border-dark hover:text-dark transition-colors"
                    >
                      <Shuffle size={12} strokeWidth={1.5} />
                      Jeszcze jeden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Własny quest */}
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-border text-muted-light hover:border-gold/40 hover:text-muted font-sans text-xs py-2.5 rounded-xl transition-colors"
          >
            <Plus size={12} strokeWidth={1.5} />
            Zrobiłam coś spoza listy
          </button>
        ) : (
          <CustomQuestForm onClose={() => setShowCustomForm(false)} />
        )}
      </div>
    </div>
  )
}
