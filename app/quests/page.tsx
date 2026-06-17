'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { X, RotateCcw, ChevronDown } from 'lucide-react'
import { SIDE_QUESTS } from '@/lib/questData'
import { PILLARS, getPillar } from '@/lib/pillars'
import { useGameData } from '@/hooks/useGameData'
import { useHiddenSideQuests } from '@/hooks/useHiddenSideQuests'
import { useEverCompletedSideQuests } from '@/hooks/useEverCompletedSideQuests'
import { Pillar, Quest } from '@/types'
import QuestSteps from '@/components/QuestSteps'
import { SmallCaps, Fleuron } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const DIFFICULTY_LABELS = { easy: 'Łatwy', medium: 'Średni', hard: 'Wymagający' }
const DIFFICULTY_FILLED = { easy: 1, medium: 2, hard: 3 }
type Filter = Pillar | 'all'
type Diff = keyof typeof DIFFICULTY_LABELS
type StatusFilter = 'all' | 'todo' | 'done'

// Romby trudności — wypełnione/puste, jak w redesignie (rotowane kwadraty)
function DifficultyPips({ d, onDark = false }: { d: Diff; onDark?: boolean }) {
  const filled = DIFFICULTY_FILLED[d]
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[1, 2, 3].map(i => (
        <i
          key={i}
          className={clsx(
            'w-[5px] h-[5px] rotate-45 border',
            i <= filled ? 'bg-gold border-gold' : onDark ? 'border-cream/40' : 'border-gold-light'
          )}
        />
      ))}
    </span>
  )
}

type FilterOption = { value: string; label: string; count?: number }

// Kompaktowy filtr-dropdown: przycisk (etykieta + wybrana wartość) + lista do wyboru.
// `searchable` dodaje pole szukania (dla Tematu — jest ~160 tagów).
function FilterSelect({
  label, value, options, onSelect, searchable = false,
}: {
  label: string
  value: string
  options: FilterOption[]
  onSelect: (v: string) => void
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [alignRight, setAlignRight] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Zamknięcie: klik poza listą albo Escape.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => { if (!open) setQuery('') }, [open])

  // Przy otwarciu: jeśli lista wyszłaby poza prawą krawędź (na wąskich ekranach
  // z overflow-x:hidden i tak by się obcięła) — wyrównaj ją do prawej.
  useEffect(() => {
    if (!open || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setAlignRight(rect.left + 260 > window.innerWidth - 8)
  }, [open])

  const active = value !== 'all'
  // Aktualnie wybrana opcja zawsze na liście (tag mógł wypaść z fasety po innych filtrach).
  const opts = active && !options.some(o => o.value === value)
    ? [...options, { value, label: value }]
    : options
  const currentLabel = opts.find(o => o.value === value)?.label ?? value
  const q = query.trim().toLowerCase()
  const shown = searchable && q ? opts.filter(o => o.label.toLowerCase().includes(q)) : opts

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          'inline-flex items-center gap-2 border px-3 py-1.5 transition-colors',
          active ? 'border-gold-light bg-gold-pale/40 text-dark' : 'border-hairline text-muted hover:text-dark hover:border-gold-light',
        )}
      >
        <span className="font-ui uppercase tracking-luxury text-[8px] text-muted-light">{label}</span>
        <span className="font-serif-body italic text-[13px] leading-none whitespace-nowrap">{currentLabel}</span>
        <ChevronDown size={12} strokeWidth={1.5} className={clsx('text-muted-light transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className={clsx(
            'absolute top-full mt-1.5 z-30 w-max min-w-[170px] max-w-[min(260px,calc(100vw-2rem))] bg-ivory border border-hairline shadow-lg shadow-dark/10',
            alignRight ? 'right-0' : 'left-0',
          )}
        >
          {searchable && (
            <div className="p-2 border-b border-hairline">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="szukaj tematu…"
                className="w-full bg-cream/40 border border-hairline px-2.5 py-1.5 font-serif-body italic text-[13px] text-dark outline-none focus:border-gold transition-colors placeholder:text-muted-light/60"
              />
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {shown.map(o => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => { onSelect(o.value); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center justify-between gap-4 px-3 py-1.5 text-left transition-colors',
                  o.value === value ? 'bg-cream text-dark' : 'text-muted hover:bg-cream/50 hover:text-dark',
                )}
              >
                <span className="font-serif-body text-[13px]">{o.label}</span>
                {typeof o.count === 'number' && (
                  <span className="font-display italic text-[12px] text-muted-light shrink-0">{o.count}</span>
                )}
              </button>
            ))}
            {shown.length === 0 && (
              <div className="px-3 py-2 font-serif-body italic text-[12px] text-muted-light">brak tematów</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuestsPage() {
  const { todayLog, toggleSideQuest } = useGameData()
  const { hidden, hide, unhide } = useHiddenSideQuests()
  const { everDone, markDone, unmarkDone } = useEverCompletedSideQuests()
  const [filter, setFilter] = useState<Filter>('all')
  const [diffFilter, setDiffFilter] = useState<Diff | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
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

  // Cztery wymiary filtrów łączą się (AND): kategoria (filar) + temat (tag) +
  // trudność + status. Status „ukończone" = TRWAŁY (everDone), nie tylko dzisiejszy.
  const okPillar = (q: Quest) => filter === 'all' || q.pillar === filter
  const okTag = (q: Quest) => tagFilter === 'all' || (q.tags ?? []).includes(tagFilter)
  const okDiff = (q: Quest) => diffFilter === 'all' || q.difficulty === diffFilter
  const okStatus = (q: Quest) =>
    statusFilter === 'all' || (statusFilter === 'done' ? everDone.includes(q.id) : !everDone.includes(q.id))

  const filtered = useMemo(() => {
    const base = visibleQuests.filter(q => okPillar(q) && okTag(q) && okDiff(q) && okStatus(q))
    return sortByReward ? [...base].sort((a, b) => b.xp - a.xp) : base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleQuests, filter, tagFilter, diffFilter, statusFilter, sortByReward, everDone])

  const completedInView = filtered.filter(q => everDone.includes(q.id)).length

  // Liczniki fasetowane: każda opcja pokazuje, ile zobaczysz po jej wyborze przy
  // POZOSTAŁYCH aktywnych filtrach. Każdy licznik fasetuje po trzech innych wymiarach.
  const pillarCounts: Record<string, number> = {}
  for (const q of visibleQuests) if (okTag(q) && okDiff(q) && okStatus(q)) pillarCounts[q.pillar] = (pillarCounts[q.pillar] ?? 0) + 1

  const diffCounts: Record<string, number> = { easy: 0, medium: 0, hard: 0 }
  for (const q of visibleQuests) if (okPillar(q) && okTag(q) && okStatus(q)) diffCounts[q.difficulty] += 1

  let statusTodo = 0, statusDone = 0
  for (const q of visibleQuests) if (okPillar(q) && okTag(q) && okDiff(q)) { everDone.includes(q.id) ? (statusDone += 1) : (statusTodo += 1) }

  // Temat: faseta po pillar+diff+status; quest może mieć kilka tagów.
  const tagCounts: Record<string, number> = {}
  for (const q of visibleQuests) if (okPillar(q) && okDiff(q) && okStatus(q)) for (const t of q.tags ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1

  // Opcje dropdownów
  const pillarOptions: FilterOption[] = [
    { value: 'all', label: 'Wszystkie' },
    ...PILLARS.map(p => ({ value: p.id, label: p.shortName, count: pillarCounts[p.id] ?? 0 })),
  ]
  const diffOptions: FilterOption[] = [
    { value: 'all', label: 'Wszystkie' },
    ...(['easy', 'medium', 'hard'] as Diff[]).map(d => ({ value: d, label: DIFFICULTY_LABELS[d], count: diffCounts[d] ?? 0 })),
  ]
  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'todo', label: 'Do zrobienia', count: statusTodo },
    { value: 'done', label: 'Ukończone', count: statusDone },
  ]
  // Tematy: najpierw najczęstsze, potem alfabetycznie (PL). Tylko z liczbą > 0.
  const tagOptions: FilterOption[] = [
    { value: 'all', label: 'Wszystkie tematy' },
    ...Object.keys(tagCounts)
      .sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b, 'pl'))
      .map(t => ({ value: t, label: t, count: tagCounts[t] })),
  ]

  const anyFilterActive = filter !== 'all' || tagFilter !== 'all' || diffFilter !== 'all' || statusFilter !== 'all'
  const clearFilters = () => { setFilter('all'); setTagFilter('all'); setDiffFilter('all'); setStatusFilter('all') }

  // Podejmij: nalicz XP (raz — tylko jeśli nie zaliczony dziś) i oznacz TRWALE.
  const handleComplete = async (quest: Quest) => {
    setCompleting(quest.id)
    if (!completedIds.includes(quest.id)) {
      await toggleSideQuest(quest.id, quest.pillar, quest.xp)
    }
    await markDone(quest.id)
    setCompleting(null)
  }

  // Cofnij: zdejmij trwały status; jeśli był zaliczony DZIŚ — cofnij też dzisiejsze XP.
  // (XP zdobyte w poprzednie dni zostają — to były realne ukończenia.)
  const handleUncomplete = async (quest: Quest) => {
    setCompleting(quest.id)
    if (completedIds.includes(quest.id)) {
      await toggleSideQuest(quest.id, quest.pillar, quest.xp)
    }
    await unmarkDone(quest.id)
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

      {/* ── Filtry: dropdowny (Kategoria · Temat · Trudność · Status) ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FilterSelect label="Kategoria" value={filter} options={pillarOptions} onSelect={v => setFilter(v as Filter)} />
        <FilterSelect label="Temat" value={tagFilter} options={tagOptions} onSelect={setTagFilter} searchable />
        <FilterSelect label="Trudność" value={diffFilter} options={diffOptions} onSelect={v => setDiffFilter(v as Diff | 'all')} />
        <FilterSelect label="Status" value={statusFilter} options={statusOptions} onSelect={v => setStatusFilter(v as StatusFilter)} />
        {anyFilterActive && (
          <button
            onClick={clearFilters}
            className="ml-0.5 font-serif-body italic text-[13px] text-muted hover:text-wine transition-colors whitespace-nowrap"
          >
            Wyczyść ×
          </button>
        )}
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
          const done = everDone.includes(quest.id) // status trwały, nie tylko dziś
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
                    onClick={() => handleUncomplete(quest)}
                    disabled={isCompleting}
                    className="group inline-flex items-center gap-2.5 shrink-0 disabled:opacity-60"
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
                    onClick={() => handleComplete(quest)}
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

      {/* ── Empty state (filtry nic nie zwracają / wszystko ukryte) ── */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="font-serif-body italic text-[15px] text-muted">
            {anyFilterActive
              ? 'Brak questów dla wybranych filtrów.'
              : hidden.length > 0
                ? 'Wszystko jest ukryte — przywróć questy przyciskiem „Ukryte" powyżej.'
                : 'Brak questów w tym widoku.'}
          </p>
          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="mt-3 font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:text-dark transition-colors"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
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
