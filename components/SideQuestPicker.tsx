'use client'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { getRandomSideQuest, countSideQuests, type QuestScale } from '@/lib/questData'
import { useCustomQuestLibrary } from '@/hooks/useCustomQuestLibrary'
import { useHiddenSideQuests } from '@/hooks/useHiddenSideQuests'
import { useEverCompletedSideQuests } from '@/hooks/useEverCompletedSideQuests'
import { getPillar, PILLARS } from '@/lib/pillars'
import type { Quest, Pillar } from '@/types'
import { Shuffle, Check, Undo2, Plus } from 'lucide-react'
import QuestSteps from './QuestSteps'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
const DIFFICULTY_DIAMONDS: Record<keyof typeof DIFFICULTY_LABELS, number> = {
  easy: 1, medium: 2, hard: 3,
}

const XP_OPTIONS = [
  { label: 'Małe', xp: 60 },
  { label: 'Średnie', xp: 120 },
  { label: 'Duże', xp: 180 },
]

function DifficultyMarks({ d }: { d: keyof typeof DIFFICULTY_LABELS }) {
  const filled = DIFFICULTY_DIAMONDS[d]
  return (
    <span className="inline-flex items-center gap-0.5 text-gold">
      {[1, 2, 3].map(i => (
        <Diamond key={i} size={5} filled={i <= filled} className={i <= filled ? 'text-gold' : 'text-gold/30'} />
      ))}
    </span>
  )
}

function CustomQuestForm({ onClose }: { onClose: () => void }) {
  const { logCustomSideQuest } = useGameData()
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
    <div className="border border-dashed border-gold/40 bg-gold-pale/30 p-4 mt-3">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
        Własny side quest
      </SmallCaps>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="co zrobiłaś?"
        maxLength={80}
        className="w-full font-serif-body text-[14px] text-dark bg-ivory border border-hairline px-3 py-2.5 outline-none focus:border-gold transition-colors placeholder:text-muted-light/60 mb-3"
      />

      <div className="grid grid-cols-2 gap-2 mb-3">
        {PILLARS.map(p => {
          const sel = pillar === p.id
          return (
            <button
              key={p.id}
              onClick={() => setPillar(p.id as Pillar)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 border text-left transition-all',
                sel ? 'border-gold bg-ivory' : 'border-hairline text-muted hover:border-gold-light'
              )}
              style={sel ? { color: p.color } : {}}
            >
              <Diamond size={5} filled={sel} />
              <span className="font-ui uppercase tracking-luxury text-[10px]">
                {p.shortName}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mb-4">
        {XP_OPTIONS.map(opt => {
          const sel = xp === opt.xp
          return (
            <button
              key={opt.xp}
              onClick={() => setXp(opt.xp)}
              className={clsx(
                'flex-1 py-2 border transition-all',
                sel
                  ? 'bg-dark-deep text-ivory border-gold'
                  : 'border-hairline text-muted hover:border-gold'
              )}
            >
              <SmallCaps
                tone={sel ? 'ivory' : 'muted'}
                tracking="luxury"
                size="xs"
              >
                {opt.label} · + {opt.xp}
              </SmallCaps>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving || saved}
          className="flex-1 flex items-center justify-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 hover:bg-forest transition-colors disabled:opacity-50"
        >
          {saved ? (
            <>
              <Diamond size={5} className="text-gold" filled />
              <SmallCaps tone="ivory" tracking="luxury" size="xs">zapisano</SmallCaps>
            </>
          ) : saving ? (
            <Fleuron size={12} className="text-gold animate-pulse" />
          ) : (
            <>
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="ivory" tracking="luxury" size="xs">zapisz</SmallCaps>
            </>
          )}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 border border-hairline text-muted hover:border-gold hover:text-dark transition-colors"
        >
          <SmallCaps tone="muted" tracking="luxury" size="xs">anuluj</SmallCaps>
        </button>
      </div>
    </div>
  )
}

export default function SideQuestPicker() {
  const { todayLog, toggleSideQuest } = useGameData()
  const { quests: libraryQuests } = useCustomQuestLibrary()
  const { hidden: hiddenSideQuests, loading: hiddenLoading } = useHiddenSideQuests()
  const { markDone, unmarkDone } = useEverCompletedSideQuests()
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [completed, setCompleted] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterPillar, setFilterPillar] = useState<Pillar | null>(null)
  const [filterScale, setFilterScale] = useState<QuestScale>('all')

  useEffect(() => () => { if (drawTimer.current) clearTimeout(drawTimer.current) }, [])

  const noFilter = filterPillar === null && filterScale === 'all'

  const pickQuest = (): Quest | null => {
    // Poczekaj aż wczytają się ukryte questy — inaczej w pierwszych ~chwilach po
    // wejściu hiddenSideQuests jest jeszcze [] i mogłoby wpaść ukryte do losowania.
    if (hiddenLoading) return null
    const alreadyDone = todayLog?.completedSideQuests ?? []

    // Własne questy z biblioteki dorzucamy tylko gdy nie ma aktywnego filtra
    // (mają stały filar i XP, więc nie pasują do filtrowania po filarze/skali)
    if (noFilter) {
      const customAsQuests: Quest[] = libraryQuests.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description ?? 'Twój własny side quest.',
        pillar: 'pozycja' as Pillar,
        type: 'side' as const,
        xp: 150,
        difficulty: 'medium' as const,
        tags: ['własny'],
      }))
      const available = customAsQuests.filter(q => !alreadyDone.includes(q.id))
      if (available.length > 0 && Math.random() < 0.3) {
        return available[Math.floor(Math.random() * available.length)]
      }
    }

    return getRandomSideQuest(alreadyDone, { pillar: filterPillar, scale: filterScale, hiddenIds: hiddenSideQuests })
  }

  const roll = () => {
    const quest = pickQuest()
    if (!quest) return
    // Ceremonia dobrania karty (~0,9 s). Globalny prefers-reduced-motion spłaszcza
    // same animacje, ale timer trzeba pominąć ręcznie — quest ma się pojawić od razu.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setActiveQuest(quest)
      setCompleted(false)
      return
    }
    setDrawing(true)
    if (drawTimer.current) clearTimeout(drawTimer.current)
    drawTimer.current = setTimeout(() => {
      setActiveQuest(quest)
      setCompleted(false)
      setDrawing(false)
    }, 900)
  }

  const handleComplete = async () => {
    if (!activeQuest) return
    await toggleSideQuest(activeQuest.id, activeQuest.pillar, activeQuest.xp)
    // Trwały status „ukończono" w bibliotece (tylko questy z biblioteki, nie własne cqi_*)
    if (activeQuest.id.startsWith('sq_')) markDone(activeQuest.id)
    setCompleted(true)
  }

  const pillar = activeQuest ? getPillar(activeQuest.pillar) : null
  const customDone = todayLog?.customSideQuests ?? []
  const totalDone = (todayLog?.completedSideQuests?.length ?? 0) + customDone.length
  const matchingCount = countSideQuests({ pillar: filterPillar, scale: filterScale, hiddenIds: hiddenSideQuests })

  return (
    <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-4">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <h2 className="font-heading text-dark text-xl whitespace-nowrap">Side Quest</h2>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="hidden sm:inline">
                coś extra
              </SmallCaps>
            </div>
            <p className="font-serif-body italic text-muted text-[13px] mt-1">
              nie musisz — ale warto.
            </p>
          </div>
          {totalDone > 0 && (
            <div className="flex items-center gap-1.5 border border-gold-light/40 px-2.5 py-1 shrink-0">
              <Diamond size={5} className="text-gold" filled />
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                {totalDone} dziś
              </SmallCaps>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Custom done */}
        {customDone.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {customDone.map(q => {
              const p = PILLARS.find(p => p.id === q.pillar)
              return (
                <div
                  key={q.id}
                  className="flex items-center gap-3 bg-gold-pale/40 border border-gold-light/30 px-3 py-2.5"
                >
                  <span className="shrink-0" style={{ color: p?.color }}>
                    <Diamond size={6} filled />
                  </span>
                  <p className="font-serif-body italic text-muted text-[13px] line-through flex-1 min-w-0">
                    {q.title}
                  </p>
                  <SmallCaps tone="gold" tracking="luxury" size="xs">
                    + {q.xp} XP
                  </SmallCaps>
                </div>
              )
            })}
          </div>
        )}

        {/* Roll trigger */}
        {drawing ? (
          /* Ceremonia: wachlarz trzech rewersów tasuje się, po ~0,9 s środkowa karta
             odsłania quest (flip-in na karcie poniżej). */
          <div className="border border-dashed border-hairline px-6 py-8 text-center" aria-live="polite">
            <div className="flex items-end justify-center gap-2 mb-4" aria-hidden>
              {[-1, 0, 1].map(pos => (
                <div
                  key={pos}
                  className="w-14 h-20 bg-ivory border border-gold-light/60 flex items-center justify-center animate-shuffle"
                  style={{
                    transform: `rotate(${pos * 7}deg) translateY(${Math.abs(pos) * 4}px)`,
                    animationDelay: `${(pos + 1) * 110}ms`,
                  }}
                >
                  <span className="border border-hairline/70 w-10 h-16 flex items-center justify-center">
                    <Fleuron size={11} className="text-gold" />
                  </span>
                </div>
              ))}
            </div>
            <p className="font-serif-body italic text-muted text-[13px]">los wybiera…</p>
          </div>
        ) : !activeQuest ? (
          <div className="border border-dashed border-hairline px-6 py-8 text-center">
            <Fleuron size={12} className="text-gold-deep mx-auto mb-3 inline-block" />
            <p className="font-serif-body italic text-muted text-[14px] mb-2">
              wylosuj swój side quest na dziś
            </p>
            <p className="font-ui uppercase tracking-luxury text-[9px] text-muted-light mb-5">
              {matchingCount} {matchingCount === 1 ? 'quest pasuje' : 'questów pasuje'}
            </p>
            <button
              onClick={roll}
              className="inline-flex items-center gap-3 bg-dark-deep text-ivory border border-gold px-6 py-3 hover:bg-forest transition-colors"
            >
              <Shuffle size={13} strokeWidth={1.5} />
              <SmallCaps tone="ivory" tracking="luxury" size="xs">
                losuj quest
              </SmallCaps>
              <Shuffle size={13} strokeWidth={1.5} />
            </button>
            <div className="mt-5">
              <button
                onClick={() => setShowFilters(v => !v)}
                className="inline-flex items-center gap-1.5 text-muted-light hover:text-gold-deep transition-colors"
              >
                <Diamond size={4} filled={!noFilter} className={noFilter ? 'text-gold/40' : 'text-gold'} />
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  {showFilters ? 'ukryj filtry' : noFilter ? 'dostosuj losowanie' : 'filtr aktywny — dostosuj'}
                </SmallCaps>
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 border border-hairline/70 bg-cream/20 px-3 py-3 text-left">
                <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
                  skala
                </SmallCaps>
                <div className="flex gap-1.5 mb-3">
                  {([
                    { id: 'all', label: 'Wszystko' },
                    { id: 'quick', label: 'Szybkie' },
                    { id: 'epic', label: 'Wielkie' },
                  ] as const).map(opt => {
                    const sel = filterScale === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setFilterScale(opt.id)}
                        className={clsx(
                          'flex-1 py-1.5 border transition-all',
                          sel ? 'bg-dark-deep border-gold' : 'border-hairline hover:border-gold-light'
                        )}
                      >
                        <SmallCaps tone={sel ? 'ivory' : 'muted'} tracking="luxury" size="xs">
                          {opt.label}
                        </SmallCaps>
                      </button>
                    )
                  })}
                </div>

                <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
                  filar
                </SmallCaps>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterPillar(null)}
                    className={clsx(
                      'px-2.5 py-1 border transition-all',
                      filterPillar === null ? 'border-gold bg-ivory' : 'border-hairline text-muted hover:border-gold-light'
                    )}
                  >
                    <span className="font-ui uppercase tracking-luxury text-[10px]">Wszystkie</span>
                  </button>
                  {PILLARS.map(p => {
                    const sel = filterPillar === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setFilterPillar(sel ? null : (p.id as Pillar))}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 border transition-all',
                          sel ? 'border-gold bg-ivory' : 'border-hairline text-muted hover:border-gold-light'
                        )}
                        style={sel ? { color: p.color } : {}}
                      >
                        <Diamond size={4} filled={sel} />
                        <span className="font-ui uppercase tracking-luxury text-[10px]">{p.shortName}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={clsx(
              'border p-5 transition-all animate-flip-in',
              completed ? 'border-gold bg-gold-pale/40' : 'border-hairline bg-cream/30'
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={pillar ? { color: pillar.color } : undefined}
                  >
                    <Diamond size={5} />
                    <span className="font-ui uppercase tracking-luxury text-[10px]">
                      {pillar?.shortName}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DifficultyMarks d={activeQuest.difficulty as keyof typeof DIFFICULTY_LABELS} />
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      {DIFFICULTY_LABELS[activeQuest.difficulty as keyof typeof DIFFICULTY_LABELS]}
                    </SmallCaps>
                  </span>
                </div>
                <h3 className="font-heading text-dark text-lg leading-snug">
                  {activeQuest.title}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  nagroda
                </SmallCaps>
                <p className="font-display text-gold text-2xl leading-none mt-1">
                  +{activeQuest.xp}
                </p>
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                  XP
                </SmallCaps>
              </div>
            </div>

            <p className="font-serif-body italic text-muted text-[14px] leading-relaxed mb-4">
              {activeQuest.description}
            </p>

            {activeQuest.tags && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {activeQuest.tags.map(tag => (
                  <span
                    key={tag}
                    className="font-ui uppercase tracking-luxury text-[9px] text-muted border border-hairline px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {activeQuest.steps && activeQuest.steps.length > 0 && (
              <QuestSteps questId={activeQuest.id} steps={activeQuest.steps} />
            )}

            <div className="flex gap-2 mt-5">
              {!completed ? (
                <>
                  <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-2 bg-dark-deep text-ivory border border-gold py-3 hover:bg-forest transition-colors"
                  >
                    <Diamond size={5} className="text-gold" />
                    <SmallCaps tone="ivory" tracking="luxury" size="xs">
                      ukończono
                    </SmallCaps>
                  </button>
                  <button
                    onClick={roll}
                    className="flex items-center justify-center gap-2 border border-hairline text-muted px-4 py-3 hover:border-gold hover:text-dark transition-colors"
                  >
                    <Shuffle size={13} strokeWidth={1.5} />
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      inny
                    </SmallCaps>
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Diamond size={6} className="text-gold" filled />
                    <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
                      side quest ukończony · + {activeQuest.xp} XP
                    </SmallCaps>
                    <Diamond size={6} className="text-gold" filled />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await toggleSideQuest(activeQuest.id, activeQuest.pillar, activeQuest.xp)
                        // symetrycznie do handleComplete: cofnięcie zdejmuje też trwały status
                        if (activeQuest.id.startsWith('sq_')) unmarkDone(activeQuest.id)
                        setCompleted(false)
                      }}
                      className="inline-flex items-center gap-2 border border-hairline text-muted px-4 py-2 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      <Undo2 size={11} strokeWidth={1.5} />
                      <SmallCaps tone="muted" tracking="luxury" size="xs">
                        cofnij
                      </SmallCaps>
                    </button>
                    <button
                      onClick={roll}
                      className="inline-flex items-center gap-2 border border-hairline text-muted px-4 py-2 hover:border-gold hover:text-dark transition-colors"
                    >
                      <Shuffle size={11} strokeWidth={1.5} />
                      <SmallCaps tone="muted" tracking="luxury" size="xs">
                        jeszcze jeden
                      </SmallCaps>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-hairline text-muted-light hover:border-gold/60 hover:text-gold-deep py-2.5 transition-colors"
          >
            <Plus size={11} strokeWidth={1.5} />
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              zrobiłam coś spoza listy
            </SmallCaps>
          </button>
        ) : (
          <CustomQuestForm onClose={() => setShowCustomForm(false)} />
        )}
      </div>
    </div>
  )
}
