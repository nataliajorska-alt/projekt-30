'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { useTimelineData } from '@/hooks/useTimelineData'
import {
  CYCLE_PHASES, getPhaseForDate, getPhaseIdForDate, computePhaseRanges,
  type CyclePhase, type CycleSettings,
} from '@/lib/cycle-data'
import { SmallCaps, Diamond, Fleuron, GoldRule, RomanNumeral } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'
import { todayKey } from '@/lib/gameLogic'

// ── Karta fazy ───────────────────────────────────────────────────

function PhaseCard({ phase, cycleDay, settings }: {
  phase: CyclePhase
  cycleDay: number
  settings: CycleSettings
}) {
  const ranges = computePhaseRanges(settings)
  return (
    <div className="bg-ivory border border-gold-light/40 p-6 mb-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <SmallCaps tracking="luxury" size="xs">
            <span style={{ color: phase.color }}>
              Dzień {toRoman(cycleDay)} · energia {phase.energy}
            </span>
          </SmallCaps>
          <h2 className="font-heading text-dark text-2xl leading-tight mt-1 flex items-center gap-3">
            <span style={{ color: phase.color }}>
              <Diamond size={6} filled />
            </span>
            {phase.name}
          </h2>
        </div>
        <div className="text-right shrink-0">
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            Faza
          </SmallCaps>
          <p
            className="font-display text-xl leading-none mt-1"
            style={{ color: phase.color }}
          >
            {ranges[phase.id][0]}–{ranges[phase.id][1]}
          </p>
          <SmallCaps tone="muted" size="xs">
            dzień
          </SmallCaps>
        </div>
      </div>

      <p className="font-serif-body italic text-dark text-[14px] leading-relaxed mb-5">
        {phase.description}
      </p>

      <div className="space-y-2 mb-5">
        {phase.tips.map((tip, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="shrink-0 translate-y-[1px]" style={{ color: phase.color }}>
              <Diamond size={5} />
            </span>
            <p className="font-serif-body italic text-muted text-[13px] leading-relaxed">
              {tip}
            </p>
          </div>
        ))}
      </div>

      <div
        className="relative border px-4 py-3"
        style={{ borderColor: `${phase.color}44`, backgroundColor: `${phase.color}0F` }}
      >
        <SmallCaps tracking="luxury" size="xs" as="div">
          <span style={{ color: phase.color }}>Questy</span>
        </SmallCaps>
        <p className="font-serif-body italic text-muted text-[13px] mt-1.5 leading-relaxed">
          {phase.questHint}
        </p>
      </div>

      {phase.suggestMinimum && (
        <div className="mt-3 border border-forest/30 bg-forest/5 px-4 py-3 flex items-baseline gap-3">
          <Diamond size={5} className="text-forest shrink-0 translate-y-[1px]" />
          <p className="font-serif-body italic text-forest text-[13px] leading-relaxed">
            to dobry czas na tryb minimum — możesz go aktywować w rubryce rutyna.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Oś cyklu ────────────────────────────────────────────────────

function CycleTimeline({ cycleDay, settings }: {
  cycleDay: number
  settings: CycleSettings
}) {
  const clampedDay = Math.min(cycleDay, settings.cycleLength)
  const ranges = computePhaseRanges(settings)
  const markerPct = Math.min((clampedDay / settings.cycleLength) * 100, 98)

  return (
    <div className="bg-ivory border border-gold-light/40 p-5 mb-4">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
        Gdzie jesteś w cyklu
      </SmallCaps>

      <div className="relative h-2 flex mb-3">
        {CYCLE_PHASES.map(p => {
          const [from, to] = ranges[p.id]
          const width = ((to - from + 1) / settings.cycleLength) * 100
          return (
            <div
              key={p.id}
              className="h-full flex-shrink-0"
              style={{ width: `${width}%`, backgroundColor: p.color, opacity: 0.4 }}
            />
          )
        })}
        {/* Diamond marker */}
        <div
          className="absolute -top-1 transition-all duration-700"
          style={{ left: `calc(${markerPct}% - 4px)`, color: '#1A2420' }}
        >
          <Diamond size={9} filled />
        </div>
      </div>

      <div className="flex justify-between">
        {CYCLE_PHASES.map(p => (
          <span
            key={p.id}
            className="font-ui uppercase tracking-luxury text-[9px]"
            style={{ color: p.color }}
          >
            {p.name.slice(0, 3)}.
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Logowanie ────────────────────────────────────────────────────

function LogForm({ onLog }: { onLog: (date: string) => Promise<void> }) {
  const today = todayKey()
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onLog(date)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-ivory border border-gold-light/40 p-5 mb-4">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
        Nowy cykl
      </SmallCaps>
      <h3 className="font-heading text-dark text-lg mt-1">Zaloguj dzień 1 cyklu</h3>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-4 leading-relaxed">
        data pierwszego dnia miesiączki. na tej podstawie obliczam fazę automatycznie.
      </p>
      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          max={today}
          onChange={e => setDate(e.target.value)}
          className="flex-1 font-serif-body text-[14px] text-dark bg-cream/40 border border-hairline px-3 py-2.5 outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="px-5 py-2.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            {saved ? 'zapisano' : saving ? '…' : 'zapisz'}
          </SmallCaps>
        </button>
      </div>
    </div>
  )
}

// ── Insights ─────────────────────────────────────────────────────

function Insights({ logs, dailyLogs, settings }: {
  logs: ReturnType<typeof useCycleData>['logs']
  dailyLogs: Record<string, any>
  settings: CycleSettings
}) {
  const insights = useMemo(() => {
    if (logs.length < 2) return null

    const phaseStats: Record<string, {
      xpSum: number; energySum: number; moodSum: number; count: number; ghostCount: number
    }> = {
      menstruacja: { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
      folikularna: { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
      owulacyjna:  { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
      lutealna:    { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
    }

    for (const [dateKey, log] of Object.entries(dailyLogs)) {
      const phaseId = getPhaseIdForDate(logs, dateKey, settings)
      if (!phaseId) continue
      const stat = phaseStats[phaseId]
      stat.count++
      stat.xpSum += log.totalXP ?? 0
      if (log.ghostProtocolCompleted) stat.ghostCount++
      const checkIns = log.moodCheckIns ?? []
      if (checkIns.length > 0) {
        stat.energySum += checkIns.reduce((s: number, c: any) => s + c.energy, 0) / checkIns.length
        stat.moodSum += checkIns.reduce((s: number, c: any) => s + c.mood, 0) / checkIns.length
      }
    }

    return CYCLE_PHASES.map(p => {
      const s = phaseStats[p.id]
      return {
        phase: p,
        avgXP: s.count > 0 ? Math.round(s.xpSum / s.count) : null,
        avgEnergy: s.count > 0 && s.energySum > 0 ? +(s.energySum / s.count).toFixed(1) : null,
        avgMood: s.count > 0 && s.moodSum > 0 ? +(s.moodSum / s.count).toFixed(1) : null,
        ghostCount: s.ghostCount,
        days: s.count,
      }
    })
  }, [logs, dailyLogs])

  if (!insights) {
    return (
      <div className="bg-ivory border border-gold-light/40 p-7 text-center">
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
        <h3 className="font-heading text-dark text-lg">Dane zbierane</h3>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-2 leading-relaxed">
          po zalogowaniu co najmniej 2 cykli zobaczysz tu wzorce — który tydzień daje ci najwięcej energii,
          kiedy ghost protocol odpala się częściej i w jakiej fazie masz najlepsze wyniki.
        </p>
      </div>
    )
  }

  const maxXP = Math.max(...insights.map(i => i.avgXP ?? 0), 1)

  return (
    <div className="space-y-4">
      {/* XP per phase */}
      <div className="bg-ivory border border-gold-light/40 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-4">
          Średnie XP na dzień według fazy
        </SmallCaps>
        <div className="space-y-3.5">
          {insights.sort((a, b) => (b.avgXP ?? 0) - (a.avgXP ?? 0)).map(item => (
            <div key={item.phase.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ color: item.phase.color }}>
                    <Diamond size={5} />
                  </span>
                  <span className="font-heading text-dark text-[14px]">
                    {item.phase.name}
                  </span>
                  <SmallCaps tone="muted" size="xs" className="opacity-70">
                    {item.days} dni
                  </SmallCaps>
                </div>
                <SmallCaps tracking="luxury" size="xs">
                  <span style={{ color: item.phase.color }}>
                    {item.avgXP !== null ? `${item.avgXP} XP` : '—'}
                  </span>
                </SmallCaps>
              </div>
              <div className="relative h-px w-full bg-hairline">
                <div
                  className="absolute left-0 top-0 h-px transition-all duration-500"
                  style={{
                    width: item.avgXP !== null ? `${(item.avgXP / maxXP) * 100}%` : '0%',
                    backgroundColor: item.phase.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood / energy per phase */}
      <div className="bg-ivory border border-gold-light/40 p-5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-4">
          Nastrój i energia według fazy
        </SmallCaps>
        <div className="grid grid-cols-2 gap-3">
          {insights.map(item => (
            <div
              key={item.phase.id}
              className="border p-4"
              style={{ borderColor: `${item.phase.color}55`, backgroundColor: `${item.phase.color}0A` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: item.phase.color }}>
                  <Diamond size={5} />
                </span>
                <SmallCaps tracking="luxury" size="xs">
                  <span style={{ color: item.phase.color }}>{item.phase.name}</span>
                </SmallCaps>
              </div>
              <div className="space-y-1.5">
                <Stat label="Energia" value={item.avgEnergy !== null ? `${item.avgEnergy}/5` : '—'} />
                <Stat label="Nastrój" value={item.avgMood !== null ? `${item.avgMood}/5` : '—'} />
                <Stat label="Ghost" value={`${item.ghostCount}×`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <SmallCaps tone="muted" size="xs">{label}</SmallCaps>
      <span className="font-display text-dark text-sm">{value}</span>
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────

function CycleSettingsForm({
  settings, saving, onSave,
}: {
  settings: CycleSettings
  saving: boolean
  onSave: (s: CycleSettings) => Promise<void>
}) {
  const [cycleLength, setCycleLength] = useState(settings.cycleLength)
  const [periodLength, setPeriodLength] = useState(settings.periodLength)
  const [saved, setSaved] = useState(false)

  useMemo(() => {
    setCycleLength(settings.cycleLength)
    setPeriodLength(settings.periodLength)
  }, [settings.cycleLength, settings.periodLength])

  const handleSave = async () => {
    await onSave({ cycleLength, periodLength })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const ranges = computePhaseRanges({ cycleLength, periodLength })

  return (
    <div className="bg-ivory border border-gold-light/40 p-5 mt-4">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
        Apparatus · cykl
      </SmallCaps>
      <h3 className="font-heading text-dark text-lg mt-1">Mój cykl</h3>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5 leading-relaxed">
        te dane pozwalają dokładniej obliczać fazy. możesz je zmienić kiedy chcesz.
      </p>

      <div className="space-y-5 mb-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <SmallCaps tone="muted" tracking="luxury" size="xs">Długość cyklu</SmallCaps>
            <span className="font-display text-dark text-xl leading-none">{cycleLength} <span className="text-muted-light text-sm font-serif-body italic">dni</span></span>
          </div>
          <input
            type="range"
            min={21} max={35} step={1}
            value={cycleLength}
            onChange={e => setCycleLength(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between mt-1">
            <SmallCaps tone="muted" size="xs">21</SmallCaps>
            <SmallCaps tone="muted" size="xs">35</SmallCaps>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <SmallCaps tone="muted" tracking="luxury" size="xs">Długość okresu</SmallCaps>
            <span className="font-display text-dark text-xl leading-none">{periodLength} <span className="text-muted-light text-sm font-serif-body italic">dni</span></span>
          </div>
          <input
            type="range"
            min={2} max={8} step={1}
            value={periodLength}
            onChange={e => setPeriodLength(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between mt-1">
            <SmallCaps tone="muted" size="xs">2</SmallCaps>
            <SmallCaps tone="muted" size="xs">8</SmallCaps>
          </div>
        </div>
      </div>

      {/* Phase preview */}
      <div className="bg-cream/50 border border-hairline px-4 py-3 mb-5 space-y-1.5">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-2">
          Twoje fazy
        </SmallCaps>
        {CYCLE_PHASES.map(p => {
          const [from, to] = ranges[p.id]
          if (from > to) return null
          return (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: p.color }}>
                  <Diamond size={5} />
                </span>
                <span className="font-serif-body text-[13px] text-dark">{p.name}</span>
              </div>
              <SmallCaps tone="muted" size="xs">
                dzień {from}–{to} · {to - from + 1} dni
              </SmallCaps>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-5 hover:bg-forest transition-colors disabled:opacity-60"
        >
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            {saving ? '…' : 'zapisz'}
          </SmallCaps>
        </button>
        {saved && (
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="animate-fade-in">
            zapisano ◆
          </SmallCaps>
        )}
      </div>
    </div>
  )
}

// ── History ───────────────────────────────────────────────────────

function CycleHistory({
  logs, onDelete,
}: {
  logs: ReturnType<typeof useCycleData>['logs']
  onDelete: (docId: string) => Promise<void>
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (logs.length === 0) return null

  const handleDelete = async (docId: string) => {
    setDeleting(true)
    await onDelete(docId)
    setConfirmId(null)
    setDeleting(false)
  }

  return (
    <div className="bg-ivory border border-gold-light/40 p-5 mb-4">
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
        Historia cykli
      </SmallCaps>
      <div className="space-y-2">
        {logs.slice(0, 6).map((log, i) => {
          const [y, m, d] = log.startDate.split('-').map(Number)
          const date = new Date(y, m - 1, d)
          const label = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
          const prev = logs[i + 1]
          const length = prev
            ? Math.round((new Date(log.startDate).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24))
            : null
          const isZero = length !== null && length === 0
          const docId = log.docId

          return (
            <div
              key={log.id}
              className={clsx(
                'py-2.5 border-b border-hairline last:border-0',
                isZero && 'bg-red-50/40 px-3 -mx-3 border-red-200'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={clsx('font-serif-body text-[14px]', isZero ? 'text-red-600' : 'text-dark')}>
                  {label}
                  {isZero && (
                    <span className="ml-2 font-ui uppercase tracking-luxury text-[9px] border border-red-300 text-red-500 px-2 py-0.5">
                      0 dni · duplikat?
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  {length !== null && length > 0 && (
                    <SmallCaps tone="muted" size="xs">
                      {length} dni
                    </SmallCaps>
                  )}
                  {docId && confirmId !== docId && (
                    <button
                      onClick={() => setConfirmId(docId)}
                      className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-red-500 transition-colors"
                    >
                      usuń
                    </button>
                  )}
                  {docId && confirmId === docId && (
                    <div className="flex items-center gap-2">
                      <SmallCaps tone="muted" size="xs">na pewno?</SmallCaps>
                      <button
                        onClick={() => handleDelete(docId)}
                        disabled={deleting}
                        className="font-ui uppercase tracking-luxury text-[10px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleting ? '…' : 'tak, usuń'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="font-ui uppercase tracking-luxury text-[10px] text-muted hover:text-dark transition-colors"
                      >
                        anuluj
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────

type Tab = 'faza' | 'insights'

export default function CyclePage() {
  const { logs, loading, logCycleStart, deleteCycleLog } = useCycleData()
  const { settings, loading: settingsLoading, saving: settingsSaving, saveSettings } = useCycleSettings()
  const { logs: dailyLogs } = useTimelineData()
  const [tab, setTab] = useState<Tab>('faza')
  const [showLogForm, setShowLogForm] = useState(false)

  const today = todayKey()
  const currentCycle = logs[0] ?? null
  const currentData = currentCycle ? getPhaseForDate(currentCycle.startDate, today, settings) : null

  const handleLog = async (date: string) => {
    await logCycleStart(date)
    setShowLogForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory grain-parchment flex items-center justify-center">
        <Fleuron size={20} className="text-gold animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fade-in">
      {/* Editorial header */}
      <header className="flex items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <SmallCaps tone="muted" tracking="editorial" size="xs">
            Rytm · Vol. I
          </SmallCaps>
          <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
            Rytm kobiecy
          </h1>
          {currentData && (
            <p className="font-serif-body italic text-muted text-[14px] mt-2">
              dzień {currentData.cycleDay} · {currentData.phase.name.toLowerCase()}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowLogForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors shrink-0"
        >
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            dzień I
          </SmallCaps>
        </button>
      </header>

      <GoldRule variant="diamond" tone="gold-deep" className="mb-6 opacity-50" />

      {showLogForm && <LogForm onLog={handleLog} />}

      {!currentCycle && !showLogForm && (
        <div className="bg-ivory border border-gold-light/40 p-8 text-center mb-4">
          <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
          <h3 className="font-heading text-dark text-xl">Zacznij śledzić cykl</h3>
          <p className="font-serif-body italic text-muted text-[14px] mt-2 mb-5 leading-relaxed">
            zaloguj pierwszy dzień ostatniej miesiączki. aplikacja automatycznie obliczy aktualną fazę
            i będzie śledzić wzorce.
          </p>
          <button
            onClick={() => setShowLogForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              zaloguj dzień I
            </SmallCaps>
          </button>
        </div>
      )}

      {currentData && (
        <>
          {/* Tabs */}
          <nav className="mb-6">
            <div className="flex justify-center gap-10">
              {([
                { key: 'faza' as const, label: 'Bieżąca faza', n: 1 },
                { key: 'insights' as const, label: 'Wzorce', n: 2 },
              ]).map(({ key, label, n }) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <span className="flex items-baseline gap-2">
                      <RomanNumeral
                        value={n}
                        className={clsx(
                          'text-sm transition-colors',
                          active ? 'text-gold' : 'text-muted-light group-hover:text-gold-light'
                        )}
                      />
                      <SmallCaps
                        tone={active ? 'gold' : 'muted'}
                        tracking="luxury"
                        size="sm"
                      >
                        {label}
                      </SmallCaps>
                    </span>
                    <span
                      className={clsx(
                        'h-px w-10 transition-colors',
                        active ? 'bg-gold' : 'bg-transparent'
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </nav>

          {tab === 'faza' && (
            <>
              <PhaseCard phase={currentData.phase} cycleDay={currentData.cycleDay} settings={settings} />
              <CycleTimeline cycleDay={currentData.cycleDay} settings={settings} />
              <CycleHistory logs={logs} onDelete={deleteCycleLog} />
            </>
          )}

          {tab === 'insights' && (
            <Insights logs={logs} dailyLogs={dailyLogs} settings={settings} />
          )}
        </>
      )}

      {!settingsLoading && (
        <CycleSettingsForm settings={settings} saving={settingsSaving} onSave={saveSettings} />
      )}
    </div>
  )
}
