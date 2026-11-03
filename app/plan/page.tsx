'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { Sparkles, ClipboardCopy, ClipboardPaste, Plus, X, Check } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { SmallCaps, Fleuron, Diamond } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { useMonthPlans } from '@/hooks/useMonthPlans'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { MONTHLY_DATA } from '@/lib/seasonal/monthData'
import { isCodePlannedMonth, type AprilQuest } from '@/lib/seasonal/aprilData'
import { newPlanQuestId, type MonthPlan } from '@/lib/seasonal/monthPlans'
import {
  projectPhase, draftMonth, buildClaudePrompt, parsePlanText,
  monthDays, weekdayLabel, weekdayOf, nextMonthKey, PHASE_LABEL, type ParseResult,
} from '@/lib/monthPlanner'
import { CYCLE_PHASES } from '@/lib/cycle-data'
import { PILLARS, getPillar } from '@/lib/pillars'
import { todayKey } from '@/lib/gameLogic'
import type { Pillar } from '@/types'

// Ostatni miesiąc projektu — urodziny 5.04.2027.
const LAST_MONTH = '2027-04'
const PL_MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return `${PL_MONTHS[m - 1]} ${y}`
}

function emptyPlan(monthKey: string): MonthPlan {
  const base = MONTHLY_DATA[monthKey]
  return { monthKey, name: base?.name ?? '', motto: base?.motto ?? '', question: base?.question ?? '', quests: [] }
}

const inputCls = 'w-full border border-hairline bg-cream/40 px-2.5 py-1.5 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold'

export default function PlanPage() {
  const { plans, loading, savePlan, deletePlan } = useMonthPlans()
  const { logs: cycleLogs } = useCycleData()
  const { settings: cycleSettings } = useCycleSettings()
  const { addToast } = useToast()
  const searchParams = useSearchParams()
  const today = todayKey()
  const thisMonth = today.slice(0, 7)

  const months = useMemo(() => {
    const out: string[] = []
    for (let k = thisMonth; k <= LAST_MONTH; k = nextMonthKey(k)) out.push(k)
    return out
  }, [thisMonth])

  const [monthKey, setMonthKey] = useState(() => {
    const q = searchParams.get('month')
    return q && /^\d{4}-\d{2}$/.test(q) && q >= thisMonth && q <= LAST_MONTH ? q : thisMonth
  })
  const saved = plans.find(p => p.monthKey === monthKey) ?? null
  const [draft, setDraft] = useState<MonthPlan>(() => emptyPlan(monthKey))
  const [dirty, setDirty] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteResult, setPasteResult] = useState<ParseResult | null>(null)
  const [saving, setSaving] = useState(false)

  // Zmiana miesiąca albo świeży snapshot z Firestore — wczytaj, o ile nie ma niezapisanych zmian.
  useEffect(() => {
    if (dirty) return
    setDraft(saved ? { ...saved, question: saved.question ?? '' } : emptyPlan(monthKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, saved?.updatedAt, loading])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const lastStart = cycleLogs[0]?.startDate ?? null
  const phaseFor = useMemo(() => projectPhase(lastStart, cycleSettings), [lastStart, cycleSettings])
  const days = useMemo(() => monthDays(monthKey), [monthKey])
  const byDay = useMemo(() => {
    const m = new Map<string, AprilQuest[]>()
    for (const q of draft.quests) m.set(q.date, [...(m.get(q.date) ?? []), q])
    return m
  }, [draft.quests])

  const update = (patch: Partial<MonthPlan>) => { setDraft(d => ({ ...d, ...patch })); setDirty(true) }
  const updateQuest = (id: string, patch: Partial<AprilQuest>) =>
    update({ quests: draft.quests.map(q => (q.id === id ? { ...q, ...patch } : q)) })
  const removeQuest = (id: string) => update({ quests: draft.quests.filter(q => q.id !== id) })
  const addQuest = (date: string) => {
    const q: AprilQuest = { id: newPlanQuestId(date), date, title: '', description: '', pillar: 'pozycja', xp: 60 }
    update({ quests: [...draft.quests, q] })
    setEditingId(q.id)
  }

  const switchMonth = (k: string) => {
    if (k === monthKey) return
    if (dirty && !confirm('Masz niezapisane zmiany w tym miesiącu. Porzucić je?')) return
    setDirty(false)
    setEditingId(null)
    setPasteResult(null)
    setMonthKey(k)
  }

  // Szkic i wklejka nadpisują tylko dni od dziś — przeszłość (i odhaczone questy) zostaje.
  const replaceFromToday = (incoming: AprilQuest[], label: string) => {
    const keep = draft.quests.filter(q => q.date < today)
    const fresh = incoming
      .filter(q => q.date >= today)
      .map(q => ({ ...q, id: newPlanQuestId(q.date) }))
    const replacing = draft.quests.some(q => q.date >= today)
    if (replacing && !confirm(`${label} zastąpi questy od dziś do końca miesiąca. Kontynuować?`)) return false
    update({ quests: [...keep, ...fresh] })
    setEditingId(null)
    return true
  }

  const handleDraft = () => {
    const next = nextMonthKey(monthKey)
    const quests = draftMonth({
      monthKey,
      phaseFor,
      question: draft.question?.trim() || undefined,
      nextMonthName: MONTHLY_DATA[next]?.name ?? plans.find(p => p.monthKey === next)?.name,
    })
    if (replaceFromToday(quests, 'Szkic')) {
      addToast({ message: 'Szkic gotowy. Przytnij, dopisz swoje stałe punkty i zapisz.', type: 'success' })
    }
  }

  const handleCopyPrompt = async () => {
    const prompt = buildClaudePrompt({
      monthKey, name: draft.name, motto: draft.motto, question: draft.question?.trim() || undefined, phaseFor,
    })
    try {
      await navigator.clipboard.writeText(prompt)
      addToast({ message: 'Prompt skopiowany. Dopisz kontekst miesiąca i wklej odpowiedź tutaj.', type: 'success' })
      setPasteOpen(true)
    } catch {
      addToast({ message: 'Nie udało się skopiować — przeglądarka zablokowała schowek.', type: 'error' })
    }
  }

  const handleParse = () => {
    const res = parsePlanText(pasteText, monthKey)
    setPasteResult(res)
    if (res.quests.length === 0) return
    if (replaceFromToday(res.quests, `Wklejony plan (${res.quests.length} questów)`)) {
      setPasteText('')
      if (res.errors.length === 0) setPasteOpen(false)
    }
  }

  const handleSave = async () => {
    const quests = draft.quests.filter(q => q.title.trim())
    setSaving(true)
    try {
      await savePlan({ ...draft, quests, question: draft.question?.trim() || undefined })
      setDirty(false)
      setEditingId(null)
      addToast({ message: `${monthLabel(monthKey)} zapisany — ${quests.length} questów na dashboardzie.`, type: 'success' })
    } catch {
      addToast({ message: 'Zapis nie wyszedł. Sprawdź połączenie i spróbuj jeszcze raz.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Usunąć plan na ${monthLabel(monthKey)}? Dashboard wróci do stałych propozycji.`)) return
    await deletePlan(monthKey)
    setDirty(false)
    setDraft(emptyPlan(monthKey))
  }

  const pillarCounts = useMemo(() => {
    const c = new Map<Pillar, number>()
    for (const q of draft.quests) c.set(q.pillar, (c.get(q.pillar) ?? 0) + 1)
    return PILLARS.filter(p => c.has(p.id)).map(p => ({ p, n: c.get(p.id)! }))
  }, [draft.quests])
  const totalXP = draft.quests.reduce((s, q) => s + q.xp, 0)
  const codePlanned = isCodePlannedMonth(monthKey)

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 pt-8 pb-32 reveal-stagger">
      <PageHeader
        eyebrow="Plan miesiąca"
        title="Rozpisz miesiąc"
        subtitle="szkic z Twojego cyklu i rytmu, prompt dla Claude albo własne questy — zapisany plan od razu trafia do Questów dnia."
        rule
      />

      {/* Miesiące do urodzin */}
      <nav className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1" aria-label="Miesiąc">
        {months.map(k => {
          const has = plans.some(p => p.monthKey === k && p.quests.length > 0)
          return (
            <button
              key={k}
              onClick={() => switchMonth(k)}
              className={clsx(
                'shrink-0 border px-3 py-2 text-left transition-colors',
                k === monthKey ? 'border-dark bg-dark text-ivory' : 'border-hairline hover:border-gold',
              )}
            >
              <span className="block font-ui uppercase tracking-luxury text-[9px] opacity-70">
                {monthLabel(k)}
              </span>
              <span className="flex items-center gap-1.5 font-display text-[14px] leading-tight mt-0.5">
                {MONTHLY_DATA[k]?.name ?? plans.find(p => p.monthKey === k)?.name ?? '—'}
                {has && <Check size={12} className={k === monthKey ? 'text-gold' : 'text-gold-deep'} />}
              </span>
            </button>
          )
        })}
      </nav>

      {codePlanned ? (
        <p className="font-serif-body italic text-muted text-[14px] text-center py-10">
          Ten miesiąc jest rozpisany w kodzie (lib/seasonal) — tu nie da się go nadpisać.
        </p>
      ) : (
        <>
          {/* I — Hasło */}
          <section className="mb-8">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">I · Hasło miesiąca</SmallCaps>
            <div className="grid gap-3 mt-3">
              <input className={clsx(inputCls, 'font-display text-[20px]')} placeholder="Hasło (np. Hart)"
                value={draft.name} onChange={e => update({ name: e.target.value })} />
              <textarea className={clsx(inputCls, 'italic')} rows={2} placeholder="Motto — zdanie, którym ten miesiąc ma brzmieć"
                value={draft.motto} onChange={e => update({ motto: e.target.value })} />
              <input className={inputCls} placeholder="Pytanie miesiąca (wraca w hero i co czwartek)"
                value={draft.question ?? ''} onChange={e => update({ question: e.target.value })} />
            </div>
          </section>

          {/* II — Szkic */}
          <section className="mb-8">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">II · Szkic</SmallCaps>
            <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
              {lastStart
                ? <>Cykl liczony od {lastStart.slice(8, 10)}.{lastStart.slice(5, 7)} co {cycleSettings.cycleLength} dni — trudna robota ląduje w folikularnej, lutealna domyka, okres jest miękki.</>
                : <>Brak zalogowanego cyklu — szkic będzie po 2 questy dziennie. Zaloguj start okresu w Cyklu, a szkic dopasuje gęstość do faz.</>}
              {' '}Szkic i wklejka zmieniają tylko dni od dziś.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleDraft}
                className="inline-flex items-center gap-2 bg-dark text-ivory border border-dark hover:bg-gold-deep hover:border-gold-deep transition-colors px-4 py-2">
                <Sparkles size={14} className="text-gold" />
                <span className="font-ui uppercase tracking-luxury text-[10px]">Szkic z cyklu</span>
              </button>
              <button onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 border border-hairline text-dark hover:border-gold transition-colors px-4 py-2">
                <ClipboardCopy size={14} className="text-gold-deep" />
                <span className="font-ui uppercase tracking-luxury text-[10px]">Prompt dla Claude</span>
              </button>
              <button onClick={() => setPasteOpen(o => !o)}
                className="inline-flex items-center gap-2 border border-hairline text-dark hover:border-gold transition-colors px-4 py-2">
                <ClipboardPaste size={14} className="text-gold-deep" />
                <span className="font-ui uppercase tracking-luxury text-[10px]">Wklej plan</span>
              </button>
            </div>

            {pasteOpen && (
              <div className="mt-4 border border-gold-light/50 bg-ivory p-4">
                <p className="font-serif-body italic text-muted text-[13px] mb-2">
                  Jedna linia = jeden quest: <code className="not-italic text-dark">RRRR-MM-DD | filar | xp | tytuł | opis</code>
                </p>
                <textarea className={clsx(inputCls, 'font-mono text-[12px]')} rows={8} value={pasteText}
                  onChange={e => setPasteText(e.target.value)} placeholder={`${monthKey}-03 | kariera | 100 | Blok głębokiej pracy | Jedno zadanie, telefon w drugim pokoju.`} />
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={handleParse} disabled={!pasteText.trim()}
                    className="bg-dark text-ivory px-4 py-1.5 font-ui uppercase tracking-luxury text-[10px] disabled:opacity-40">
                    Wczytaj
                  </button>
                  {pasteResult && (
                    <span className="font-serif-body italic text-[13px] text-muted">
                      {pasteResult.quests.length} questów wczytanych
                      {pasteResult.errors.length > 0 && `, ${pasteResult.errors.length} linii pominiętych`}
                    </span>
                  )}
                </div>
                {pasteResult && pasteResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pasteResult.errors.slice(0, 8).map(e => (
                      <li key={e.line} className="font-mono text-[11px] text-amber-700 truncate">
                        l.{e.line} · {e.reason} · {e.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* III — Dni */}
          <section>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs">III · Dni</SmallCaps>
              {draft.quests.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap font-ui uppercase tracking-luxury text-[9px] text-muted">
                  {pillarCounts.map(({ p, n }) => (
                    <span key={p.id} className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rotate-45 inline-block" style={{ background: p.color }} />
                      {p.shortName} {n}
                    </span>
                  ))}
                  <span className="text-gold-deep">· {totalXP} XP</span>
                </div>
              )}
            </div>

            {draft.quests.length === 0 && (
              <div className="border border-gold-light/30 bg-gold-pale/30 p-6 text-center mt-4">
                <Fleuron size={14} className="text-gold mx-auto mb-3 inline-block" />
                <p className="font-serif-body italic text-muted text-[13px] leading-relaxed">
                  Pusto — dashboard pokazuje stałe propozycje. Zacznij od szkicu z cyklu albo dopisz questy do konkretnych dni.
                </p>
              </div>
            )}

            <ol className="mt-3">
              {days.map(date => {
                const ph = phaseFor(date)
                const phaseMeta = ph ? CYCLE_PHASES.find(c => c.id === ph.phase) : null
                const qs = byDay.get(date) ?? []
                const past = date < today
                return (
                  <li key={date} className={clsx(
                    'grid grid-cols-[3.25rem_1fr] gap-3 py-3 border-b border-border/60',
                    weekdayOf(date) === 1 && 'border-t border-t-hairline mt-2',
                    past && 'opacity-55',
                  )}>
                    <div className="pt-0.5">
                      <div className={clsx('font-display text-[20px] leading-none', date === today ? 'text-gold-deep' : 'text-dark')}>
                        {Number(date.slice(8))}
                      </div>
                      <div className="font-ui uppercase tracking-luxury text-[9px] text-muted mt-1">{weekdayLabel(date)}</div>
                      {phaseMeta && ph && (
                        <div className="font-ui text-[9px] mt-1 leading-tight" style={{ color: phaseMeta.color }}
                          title={`Dzień cyklu ${ph.cycleDay}${ph.projected ? ' (prognoza)' : ''}`}>
                          {PHASE_LABEL[ph.phase]}{ph.projected ? '*' : ''}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      {qs.map(q => editingId === q.id ? (
                        <QuestEditor key={q.id} quest={q}
                          onChange={patch => updateQuest(q.id, patch)}
                          onDone={() => setEditingId(null)}
                          onRemove={() => { removeQuest(q.id); setEditingId(null) }} />
                      ) : (
                        <QuestLine key={q.id} quest={q} onEdit={() => setEditingId(q.id)} onRemove={() => removeQuest(q.id)} />
                      ))}
                      <button onClick={() => addQuest(date)}
                        className="inline-flex items-center gap-1 font-ui uppercase tracking-luxury text-[9px] text-muted-light hover:text-gold-deep transition-colors py-1">
                        <Plus size={11} /> quest
                      </button>
                    </div>
                  </li>
                )
              })}
            </ol>
            {lastStart && (
              <p className="font-serif-body italic text-muted-light text-[12px] mt-3">* faza z prognozy — kolejne cykle odłożone co {cycleSettings.cycleLength} dni.</p>
            )}
          </section>

          {/* Pasek zapisu */}
          <div className="fixed bottom-0 inset-x-0 z-30 bg-cream/95 backdrop-blur border-t border-hairline">
            <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 font-serif-body italic text-[13px] text-muted truncate">
                <Diamond size={6} className="inline-block text-gold mr-2 align-middle" />
                {draft.quests.length} questów ·{' '}
                {dirty ? <span className="text-amber-700">niezapisane zmiany</span>
                  : saved && saved.quests.length > 0 ? 'aktywny na dashboardzie' : 'nie zapisany'}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {saved && (
                  <button onClick={handleDelete} className="font-ui uppercase tracking-luxury text-[9px] text-muted-light hover:text-amber-700">
                    Usuń
                  </button>
                )}
                <button onClick={handleSave} disabled={saving || !dirty}
                  className="bg-dark text-ivory border border-dark hover:bg-gold-deep hover:border-gold-deep transition-colors px-4 py-2 font-ui uppercase tracking-luxury text-[10px] disabled:opacity-40">
                  {saving ? 'Zapisuję…' : 'Zapisz plan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function QuestLine({ quest, onEdit, onRemove }: { quest: AprilQuest; onEdit: () => void; onRemove: () => void }) {
  const pillar = getPillar(quest.pillar)
  return (
    <div className="group flex items-start gap-2">
      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className="font-ui uppercase tracking-[0.3em] text-[9px] mr-2" style={{ color: pillar.color }}>
          {pillar.shortName}
        </span>
        <span className="font-display text-dark text-[15px] leading-snug">{quest.title || <em className="text-muted-light">bez tytułu</em>}</span>
        <span className="ml-2 font-display italic text-gold-deep text-[12px]">+{quest.xp}</span>
      </button>
      <button onClick={onRemove} aria-label="Usuń quest"
        className="text-muted-light hover:text-amber-700 sm:opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
        <X size={13} />
      </button>
    </div>
  )
}

function QuestEditor({ quest, onChange, onDone, onRemove }: {
  quest: AprilQuest
  onChange: (patch: Partial<AprilQuest>) => void
  onDone: () => void
  onRemove: () => void
}) {
  return (
    <div className="border border-gold-light/60 bg-ivory p-3 space-y-2">
      <input autoFocus className={clsx(inputCls, 'font-display text-[16px]')} placeholder="Tytuł"
        value={quest.title} onChange={e => onChange({ title: e.target.value })} />
      <textarea className={clsx(inputCls, 'italic text-[13px]')} rows={2} placeholder="Opis — konkret, nie intencja"
        value={quest.description} onChange={e => onChange({ description: e.target.value })} />
      <div className="flex items-center gap-2 flex-wrap">
        <select className={clsx(inputCls, 'w-auto')} value={quest.pillar}
          onChange={e => onChange({ pillar: e.target.value as Pillar })}>
          {PILLARS.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
        </select>
        <input type="number" min={0} step={10} className={clsx(inputCls, 'w-20')} value={quest.xp}
          onChange={e => onChange({ xp: Math.max(0, parseInt(e.target.value, 10) || 0) })} aria-label="XP" />
        <span className="font-ui uppercase tracking-luxury text-[9px] text-muted">XP</span>
        <span className="flex-1" />
        <button onClick={onRemove} className="font-ui uppercase tracking-luxury text-[9px] text-muted-light hover:text-amber-700">Usuń</button>
        <button onClick={onDone} className="bg-dark text-ivory px-3 py-1.5 font-ui uppercase tracking-luxury text-[10px]">Gotowe</button>
      </div>
    </div>
  )
}
