'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { X, RotateCcw } from 'lucide-react'
import { SIDE_QUESTS } from '@/lib/questData'
import { PILLARS, getPillar } from '@/lib/pillars'
import { useGameData } from '@/hooks/useGameData'
import { useHiddenSideQuests } from '@/hooks/useHiddenSideQuests'
import { Pillar, Quest } from '@/types'
import QuestSteps from '@/components/QuestSteps'
import { SmallCaps, Fleuron } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
const DIFFICULTY_FILLED = { easy: 1, medium: 2, hard: 3 }
type Filter = Pillar | 'all'
type Diff = keyof typeof DIFFICULTY_LABELS

// Romby trudności — wypełnione/puste, jak w redesignie (rotowane kwadraty)
function DifficultyPips({ d }: { d: Diff }) {
  const filled = DIFFICULTY_FILLED[d]
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[1, 2, 3].map(i => (
        <i
          key={i}
          className={clsx(
            'w-[5px] h-[5px] rotate-45 border',
            i <= filled ? 'bg-gold border-gold' : 'border-gold-light'
          )}
        />
      ))}
    </span>
  )
}

export default function QuestsPage() {
  const { todayLog, toggleSideQuest } = useGameData()
  const { hidden, hide, unhide } = useHiddenSideQuests()
  const [filter, setFilter] = useState<Filter>('all')
  const [sortByReward, setSortByReward] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  const completedIds = todayLog?.completedSideQuests ?? []
  const totalCompleted = completedIds.length

  // Biblioteka bez ukrytych — napędza liczniki, grid i nagłówek.
  const visibleQuests = useMemo(
    () => SIDE_QUESTS.filter(q => !hidden.includes(q.id)),
    [hidden],
  )

  // Ukryte odwzorowane na pełne questy do panelu „przywróć" (pomijamy id-ki,
  // których już nie ma w bibliotece, gdyby kiedyś zniknęły z SIDE_QUESTS).
  const hiddenQuests = useMemo(
    () => hidden
      .map(id => SIDE_QUESTS.find(q => q.id === id))
      .filter((q): q is Quest => Boolean(q)),
    [hidden],
  )

  // Liczniki per filar (do chipów filtrów) — z widocznych questów.
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const q of visibleQuests) c[q.pillar] = (c[q.pillar] ?? 0) + 1
    return c
  }, [visibleQuests])

  const filtered = useMemo(() => {
    const base = filter === 'all' ? visibleQuests : visibleQuests.filter(q => q.pillar === filter)
    return sortByReward ? [...base].sort((a, b) => b.xp - a.xp) : base
  }, [filter, sortByReward, visibleQuests])

  const completedInView = filtered.filter(q => completedIds.includes(q.id)).length

  const handleComplete = async (questId: string, pillar: Pillar, xp: number) => {
    setCompleting(questId)
    await toggleSideQuest(questId, pillar, xp)
    setCompleting(null)
  }

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-3 font-ui uppercase tracking-editorial text-[10px] text-muted mb-3.5">
          Biblioteka <span className="text-gold">∴</span> Vol. I
        </div>
        <h1 className="font-display font-medium text-dark leading-tight tracking-[-0.5px] text-[clamp(1.75rem,5vw,2.5rem)]">
          Side <em className="italic font-normal text-gold-deep">Questy</em>
        </h1>
        <p className="mt-2 font-serif-body italic text-[14px] text-muted">
          <strong className="font-display not-italic font-medium text-gold-deep">{toRoman(visibleQuests.length)}</strong> questów w bibliotece
          <span className="text-gold mx-2">·</span>
          <strong className="font-display not-italic font-medium text-gold-deep">{toRoman(totalCompleted)}</strong> {totalCompleted === 1 ? 'ukończony' : 'ukończone'} dziś
        </p>
      </header>

      {/* Ornament */}
      <div className="flex items-center gap-3.5 my-7">
        <span className="flex-1 h-px bg-hairline" />
        <span className="text-gold text-[13px] leading-none">∴</span>
        <span className="flex-1 h-px bg-hairline" />
      </div>

      {/* ── Filters (równy grid z licznikami) ──────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'flex items-center justify-center gap-2 border px-4 py-2.5 font-ui uppercase tracking-[0.3em] text-[10px] transition-colors',
            filter === 'all'
              ? 'bg-dark text-cream border-dark'
              : 'border-hairline text-muted hover:text-dark hover:border-gold-light'
          )}
        >
          Wszystkie
          <span className={clsx('font-display italic text-[12px] ml-0.5', filter === 'all' ? 'text-gold-light' : 'text-muted-light')}>
            {visibleQuests.length}
          </span>
        </button>
        {PILLARS.map(p => {
          const on = filter === p.id
          return (
            <button
              key={p.id}
              onClick={() => setFilter(p.id as Filter)}
              className={clsx(
                'flex items-center justify-center gap-2 border px-4 py-2.5 font-ui uppercase tracking-[0.3em] text-[10px] transition-colors',
                on ? 'bg-dark text-cream border-dark' : 'border-hairline text-muted hover:text-dark hover:border-gold-light'
              )}
            >
              <span className={clsx('text-[8px]', on ? 'text-gold' : 'text-gold-light')}>◇</span>
              {p.shortName}
              <span className={clsx('font-display italic text-[12px] ml-0.5', on ? 'text-gold-light' : 'text-muted-light')}>
                {counts[p.id] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Results meta + sort ────────────────────────────────── */}
      <div className="flex items-baseline justify-between border-t border-hairline pt-3.5 pb-1 mb-6 gap-3">
        <div className="font-ui uppercase tracking-editorial text-[10px] text-muted">
          Pokazuję <strong className="font-display not-italic normal-case italic text-gold-deep text-[14px] mx-0.5">{filtered.length}</strong> z{' '}
          <strong className="font-display not-italic normal-case italic text-gold-deep text-[14px] mx-0.5">{visibleQuests.length}</strong>
          <span className="text-gold mx-1.5">·</span>
          <strong className="font-display not-italic normal-case italic text-gold-deep text-[14px] mx-0.5">{completedInView}</strong> ukończone
        </div>
        <div className="flex items-baseline gap-4 shrink-0">
          {hidden.length > 0 && (
            <button
              onClick={() => setShowHidden(v => !v)}
              className="font-serif-body italic text-[14px] text-muted hover:text-dark transition-colors whitespace-nowrap"
            >
              Ukryte · {hidden.length} {showHidden ? '∨' : '›'}
            </button>
          )}
          <button
            onClick={() => setSortByReward(v => !v)}
            className="font-serif-body italic text-[14px] text-gold-deep hover:text-dark transition-colors whitespace-nowrap"
          >
            Sortuj · {sortByReward ? 'wg nagrody' : 'domyślnie'} ›
          </button>
        </div>
      </div>

      {/* ── Ukryte questy (przywracanie) ───────────────────────── */}
      {showHidden && hiddenQuests.length > 0 && (
        <div className="mb-6 border border-dashed border-hairline bg-cream/40 p-4 animate-fade-in">
          <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-3">
            Ukryte questy · {hiddenQuests.length}
          </SmallCaps>
          <ul className="space-y-1">
            {hiddenQuests.map(q => {
              const p = getPillar(q.pillar)
              return (
                <li key={q.id} className="flex items-center justify-between gap-3 py-1">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-gold text-[8px] shrink-0">◆</span>
                    <span className="font-serif-body text-[14px] text-muted truncate">{q.title}</span>
                    <span className="font-ui uppercase tracking-editorial text-[9px] text-muted-light shrink-0">{p.shortName}</span>
                  </span>
                  <button
                    onClick={() => unhide(q.id)}
                    className="shrink-0 inline-flex items-center gap-1.5 font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:text-dark transition-colors"
                  >
                    <RotateCcw size={11} strokeWidth={1.5} />
                    przywróć
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ── Quest grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        {filtered.map(quest => {
          const done = completedIds.includes(quest.id)
          const pillar = getPillar(quest.pillar)
          const isCompleting = completing === quest.id
          const diff = quest.difficulty as Diff

          return (
            <article
              key={quest.id}
              className={clsx(
                'group/card relative border p-6 pb-5 flex flex-col md:min-h-[232px] transition-colors',
                done ? 'bg-cream border-hairline' : 'bg-ivory border-hairline'
              )}
            >
              {/* corner ornaments — top-left + bottom-right */}
              <span aria-hidden className={clsx('pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l', done ? 'border-gold' : 'border-gold-light/75')} />
              <span aria-hidden className={clsx('pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b border-r', done ? 'border-gold' : 'border-gold-light/75')} />

              {/* hide — chowa quest z biblioteki (odwracalne przez „Ukryte") */}
              <button
                onClick={() => hide(quest.id)}
                aria-label={`Ukryj „${quest.title}" z biblioteki`}
                title="Ukryj z biblioteki"
                className={clsx(
                  'absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-light hover:text-wine transition-all',
                  'opacity-100 md:opacity-0 md:group-hover/card:opacity-100 focus-visible:opacity-100',
                  done ? 'bg-cream/90 hover:bg-cream' : 'bg-ivory/90 hover:bg-cream',
                )}
              >
                <X size={12} strokeWidth={1.5} />
              </button>

              {/* top: taxonomy + reward — na mobile robimy miejsce w rogu na
                  zawsze-widoczny przycisk „×" (na desktopie pojawia się on dopiero
                  na hover, więc nagroda zostaje wyrównana do prawej) */}
              <div className="flex items-start justify-between gap-4 mb-3 max-md:pr-6">
                <div className="flex items-center gap-3.5 flex-wrap min-w-0">
                  <span
                    className="inline-flex items-center gap-2 font-ui uppercase tracking-editorial text-[10px]"
                    style={{ color: done ? undefined : pillar.color }}
                  >
                    <span className="text-gold text-[8px]">◆</span>
                    <span className={done ? 'text-muted' : undefined}>{pillar.shortName}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 font-ui uppercase tracking-[0.3em] text-[9px] text-muted">
                    <DifficultyPips d={diff} />
                    {DIFFICULTY_LABELS[diff]}
                  </span>
                </div>
                <div className="text-right leading-none shrink-0">
                  <div className="font-ui uppercase tracking-editorial text-[8px] text-muted-light">Nagroda</div>
                  <div className="font-display font-medium text-[24px] text-gold-deep tracking-[-0.5px] mt-1.5">
                    <span className="font-serif-body italic font-normal text-[17px] text-gold mr-px">+</span>{quest.xp}
                    <small className="block mt-0.5 font-ui not-italic text-[8px] tracking-editorial text-muted-light uppercase">xp</small>
                  </div>
                </div>
              </div>

              {/* title + desc */}
              <h2 className={clsx('font-display font-medium text-[20px] leading-[1.12] tracking-[-0.4px]', done ? 'text-muted' : 'text-dark')}>
                {quest.title}
              </h2>
              <p className={clsx('font-serif-body italic text-[14px] leading-[1.5] mt-2 max-w-[42ch]', done ? 'text-muted-light' : 'text-muted')}>
                {quest.description}
              </p>

              {quest.steps && quest.steps.length > 0 && (
                <div className="mt-3">
                  <QuestSteps questId={quest.id} steps={quest.steps} />
                </div>
              )}

              {/* footer: tags + action */}
              <div className="mt-auto pt-[18px] flex items-center justify-between gap-3.5">
                <div className="flex flex-wrap gap-[7px]">
                  {(quest.tags ?? []).map(tag => (
                    <span
                      key={tag}
                      className="border border-border px-2.5 py-[5px] font-ui uppercase tracking-[0.26em] text-[9px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {done ? (
                  <button
                    onClick={() => handleComplete(quest.id, quest.pillar, quest.xp)}
                    className="group inline-flex items-center gap-2.5 shrink-0"
                    title="Cofnij ukończenie"
                  >
                    <span className="w-[18px] h-[18px] bg-gold border border-gold rotate-45 inline-flex items-center justify-center shrink-0">
                      <span className="-rotate-45 text-[10px] leading-none text-cream font-ui">✓</span>
                    </span>
                    <span className="font-display italic font-medium text-[16px] text-gold-deep group-hover:hidden">ukończone</span>
                    <span className="hidden group-hover:inline font-ui uppercase tracking-luxury text-[10px] text-wine">cofnij</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleComplete(quest.id, quest.pillar, quest.xp)}
                    disabled={isCompleting}
                    className="shrink-0 inline-flex items-center gap-2.5 bg-dark text-cream border border-dark px-5 py-2.5 hover:bg-gold-deep hover:border-gold-deep transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {isCompleting ? (
                      <Fleuron size={11} className="text-gold animate-pulse" />
                    ) : (
                      <>
                        <span className="text-gold text-[9px]">◆</span>
                        <span className="font-ui uppercase tracking-[0.3em] text-[10px]">Podejmij</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* ── Empty state (np. po ukryciu wszystkiego w filtrze) ──── */}
      {filtered.length === 0 && (
        <p className="text-center font-serif-body italic text-[15px] text-muted py-12">
          {hidden.length > 0
            ? 'Wszystko w tym widoku jest ukryte — przywróć questy przyciskiem „Ukryte" powyżej.'
            : 'Brak questów w tym widoku.'}
        </p>
      )}

      {/* ── Closing ────────────────────────────────────────────── */}
      <div className="mt-14 text-center">
        <div className="flex items-center justify-center gap-3.5 mb-5">
          <span className="w-[180px] max-w-[30%] h-px bg-hairline" />
          <span className="text-gold text-[12px] leading-none">∴ ◆ ∴</span>
          <span className="w-[180px] max-w-[30%] h-px bg-hairline" />
        </div>
        <blockquote className="font-serif-body italic text-[16px] text-muted leading-[1.55] max-w-[540px] mx-auto">
          „questy poboczne to nie obowiązek — to miejsca, w których stajesz się sobą poza planem."
        </blockquote>
        <div className="mt-6">
          <SmallCaps tone="gold-deep" tracking="editorial" size="xs">
            ∴ Projekt 30 · Biblioteka · Vol. I ∴
          </SmallCaps>
        </div>
      </div>
    </div>
  )
}
