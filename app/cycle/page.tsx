'use client'
import { useState, useMemo } from 'react'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { useTimelineData } from '@/hooks/useTimelineData'
import {
  CYCLE_PHASES, getPhaseForDate, getPhaseIdForDate, computePhaseRanges,
  type CyclePhase, type CycleSettings,
} from '@/lib/cycle-data'
import { PILLARS } from '@/lib/pillars'
import clsx from 'clsx'

const PL_DAYS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// ── Karta fazy ───────────────────────────────────────────────────

function PhaseCard({ phase, cycleDay, settings }: { phase: CyclePhase; cycleDay: number; settings: CycleSettings }) {
  const ranges = computePhaseRanges(settings)
  return (
    <div
      className="rounded-2xl p-6 mb-4"
      style={{ backgroundColor: phase.bgColor, border: `1px solid ${phase.color}20` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest mb-1" style={{ color: phase.color }}>
            Dzień {cycleDay} · Energia {phase.energy}
          </p>
          <h2 className="font-serif text-dark text-2xl flex items-center gap-2">
            <span>{phase.emoji}</span> {phase.name}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-1">Faza</p>
          <p className="font-sans text-xs font-medium" style={{ color: phase.color }}>
            {ranges[phase.id][0]}–{ranges[phase.id][1]} dzień
          </p>
        </div>
      </div>

      <p className="font-sans text-sm text-dark leading-relaxed mb-4">{phase.description}</p>

      <div className="space-y-2 mb-4">
        {phase.tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] mt-1" style={{ color: phase.color }}>✦</span>
            <p className="font-sans text-xs text-muted leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl px-4 py-3 border" style={{ borderColor: `${phase.color}30`, backgroundColor: `${phase.color}08` }}>
        <p className="font-sans text-[10px] uppercase tracking-widest mb-1" style={{ color: phase.color }}>
          Questy
        </p>
        <p className="font-sans text-xs text-muted leading-relaxed">{phase.questHint}</p>
      </div>

      {phase.suggestMinimum && (
        <div className="mt-3 rounded-xl bg-forest/10 border border-forest/20 px-4 py-2.5">
          <p className="font-sans text-xs text-forest">
            💡 To dobry czas na tryb minimum — możesz go aktywować w rubryce rutyna.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Oś cyklu ────────────────────────────────────────────────────

function CycleTimeline({ cycleDay, settings }: { cycleDay: number; settings: CycleSettings }) {
  const clampedDay = Math.min(cycleDay, settings.cycleLength)
  const ranges = computePhaseRanges(settings)
  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
      <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">Gdzie jesteś w cyklu</p>
      <div className="relative h-3 rounded-full overflow-hidden flex mb-2">
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
        {/* Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-dark rounded-full"
          style={{ left: `${Math.min((clampedDay / settings.cycleLength) * 100, 98)}%` }}
        />
      </div>
      <div className="flex justify-between">
        {CYCLE_PHASES.map(p => (
          <span key={p.id} className="font-sans text-[9px] text-muted-light" style={{ color: p.color }}>
            {p.emoji}
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
    <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
      <h3 className="font-serif text-dark text-base mb-1">Zaloguj dzień 1 cyklu</h3>
      <p className="font-sans text-xs text-muted mb-4">
        Data pierwszego dnia miesiączki. Na tej podstawie obliczam fazę automatycznie.
      </p>
      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          max={today}
          onChange={e => setDate(e.target.value)}
          className="flex-1 font-sans text-sm text-dark bg-cream/50 border border-cream rounded-xl px-3 py-2.5 outline-none focus:border-gold/40 transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="px-5 py-2.5 bg-dark text-ivory font-sans text-sm rounded-xl hover:bg-forest transition-colors disabled:opacity-60"
        >
          {saved ? 'Zapisano ✦' : saving ? '...' : 'Zapisz'}
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

    const phaseStats: Record<string, { xpSum: number; energySum: number; moodSum: number; count: number; ghostCount: number }> = {
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
      <div className="bg-white rounded-2xl shadow-elegant p-6 text-center">
        <p className="text-2xl mb-3">🌱</p>
        <p className="font-serif text-dark text-base mb-2">Dane zbierane</p>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Po zalogowaniu co najmniej 2 cykli zobaczysz tu wzorce — który tydzień daje Ci najwięcej energii, kiedy ghost protocol odpala się częściej i w jakiej fazie masz najlepsze wyniki.
        </p>
      </div>
    )
  }

  const maxXP = Math.max(...insights.map(i => i.avgXP ?? 0), 1)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-4">Średnie XP na dzień według fazy</h3>
        <div className="space-y-3">
          {insights.sort((a, b) => (b.avgXP ?? 0) - (a.avgXP ?? 0)).map(item => (
            <div key={item.phase.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{item.phase.emoji}</span>
                  <span className="font-sans text-sm text-dark">{item.phase.name}</span>
                  <span className="font-sans text-[10px] text-muted-light">({item.days} dni)</span>
                </div>
                <span className="font-sans text-xs font-medium" style={{ color: item.phase.color }}>
                  {item.avgXP !== null ? `${item.avgXP} XP` : '—'}
                </span>
              </div>
              <div className="h-2 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
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

      <div className="bg-white rounded-2xl shadow-elegant p-5">
        <h3 className="font-serif text-dark text-base mb-4">Nastrój i energia według fazy</h3>
        <div className="grid grid-cols-2 gap-3">
          {insights.map(item => (
            <div
              key={item.phase.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: item.phase.bgColor }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span>{item.phase.emoji}</span>
                <span className="font-sans text-xs font-medium" style={{ color: item.phase.color }}>
                  {item.phase.name}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-sans text-[10px] text-muted">Energia</span>
                  <span className="font-sans text-[10px] font-medium text-dark">
                    {item.avgEnergy !== null ? `${item.avgEnergy}/5` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[10px] text-muted">Nastrój</span>
                  <span className="font-sans text-[10px] font-medium text-dark">
                    {item.avgMood !== null ? `${item.avgMood}/5` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[10px] text-muted">Ghost Protocol</span>
                  <span className="font-sans text-[10px] font-medium text-dark">{item.ghostCount}×</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Ustawienia cyklu ──────────────────────────────────────────────

function CycleSettingsForm({
  settings,
  saving,
  onSave,
}: {
  settings: CycleSettings
  saving: boolean
  onSave: (s: CycleSettings) => Promise<void>
}) {
  const [cycleLength, setCycleLength] = useState(settings.cycleLength)
  const [periodLength, setPeriodLength] = useState(settings.periodLength)
  const [saved, setSaved] = useState(false)

  // Sync gdy settings załadowane z Firestore
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
    <div className="bg-white rounded-2xl shadow-elegant p-5 mt-4">
      <h3 className="font-serif text-dark text-base mb-1">Mój cykl</h3>
      <p className="font-sans text-xs text-muted mb-5">
        Te dane pozwalają dokładniej obliczać fazy. Możesz je zmienić kiedy chcesz.
      </p>

      <div className="space-y-5 mb-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-sans text-xs text-dark">Długość cyklu</label>
            <span className="font-serif text-dark text-lg">{cycleLength} dni</span>
          </div>
          <input
            type="range"
            min={21} max={35} step={1}
            value={cycleLength}
            onChange={e => setCycleLength(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[10px] text-muted-light">21</span>
            <span className="font-sans text-[10px] text-muted-light">35</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-sans text-xs text-dark">Długość okresu</label>
            <span className="font-serif text-dark text-lg">{periodLength} dni</span>
          </div>
          <input
            type="range"
            min={2} max={8} step={1}
            value={periodLength}
            onChange={e => setPeriodLength(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[10px] text-muted-light">2</span>
            <span className="font-sans text-[10px] text-muted-light">8</span>
          </div>
        </div>
      </div>

      {/* Podgląd faz */}
      <div className="bg-cream rounded-xl p-4 mb-5 space-y-1.5">
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Twoje fazy</p>
        {CYCLE_PHASES.map(p => {
          const [from, to] = ranges[p.id]
          if (from > to) return null
          return (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">{p.emoji}</span>
                <span className="font-sans text-xs text-dark">{p.name}</span>
              </div>
              <span className="font-sans text-xs text-muted">
                dzień {from}–{to} <span className="text-muted-light">({to - from + 1} dni)</span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 px-5 rounded-xl hover:bg-forest transition-colors disabled:opacity-60 font-medium"
        >
          {saving ? '...' : 'Zapisz'}
        </button>
        {saved && <p className="font-sans text-xs text-forest animate-fade-in">Zapisano ✓</p>}
      </div>
    </div>
  )
}

// ── Historia cykli ────────────────────────────────────────────────

function CycleHistory({
  logs,
  onDelete,
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
    <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
      <h3 className="font-serif text-dark text-base mb-3">Historia cykli</h3>
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
            <div key={log.id} className={clsx(
              'py-2 border-b border-cream last:border-0',
              isZero && 'bg-red-50/60 rounded-xl px-3 -mx-3'
            )}>
              <div className="flex items-center justify-between">
                <p className={clsx('font-sans text-sm', isZero ? 'text-red-500' : 'text-dark')}>
                  {label}
                  {isZero && <span className="ml-2 text-[10px] font-sans bg-red-100 text-red-400 px-2 py-0.5 rounded-full">0 dni — duplikat?</span>}
                </p>
                <div className="flex items-center gap-3">
                  {length !== null && length > 0 && (
                    <span className="font-sans text-xs text-muted-light">{length} dni</span>
                  )}
                  {docId && confirmId !== docId && (
                    <button
                      onClick={() => setConfirmId(docId)}
                      className="font-sans text-[10px] text-muted-light hover:text-red-400 transition-colors"
                    >
                      usuń
                    </button>
                  )}
                  {docId && confirmId === docId && (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[10px] text-muted">Na pewno?</span>
                      <button
                        onClick={() => handleDelete(docId)}
                        disabled={deleting}
                        className="font-sans text-[10px] text-red-500 font-medium hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleting ? '...' : 'Tak, usuń'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="font-sans text-[10px] text-muted hover:text-dark transition-colors"
                      >
                        Anuluj
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

// ── Główna strona ─────────────────────────────────────────────────

type Tab = 'faza' | 'insights'

export default function CyclePage() {
  const { logs, loading, logCycleStart, deleteCycleLog } = useCycleData()
  const { settings, loading: settingsLoading, saving: settingsSaving, saveSettings } = useCycleSettings()
  const { logs: dailyLogs, loading: logsLoading } = useTimelineData()
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
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Rytm</p>
          <h1 className="font-serif text-dark text-2xl">Rytm kobiecy</h1>
          {currentData && (
            <p className="font-sans text-sm text-muted mt-0.5">
              Dzień {currentData.cycleDay} · {currentData.phase.name}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowLogForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-dark text-ivory font-sans text-sm rounded-xl hover:bg-forest transition-colors"
        >
          🌑 Dzień 1
        </button>
      </div>

      {/* Log form */}
      {showLogForm && <LogForm onLog={handleLog} />}

      {/* No data */}
      {!currentCycle && !showLogForm && (
        <div className="bg-white rounded-2xl shadow-elegant p-8 text-center mb-4">
          <p className="text-3xl mb-4">🌑</p>
          <p className="font-serif text-dark text-lg mb-2">Zacznij śledzić cykl</p>
          <p className="font-sans text-sm text-muted leading-relaxed mb-5">
            Zaloguj pierwszy dzień ostatniej miesiączki. Aplikacja automatycznie obliczy aktualną fazę i będzie śledzić wzorce.
          </p>
          <button
            onClick={() => setShowLogForm(true)}
            className="px-6 py-3 bg-dark text-ivory font-sans text-sm rounded-xl hover:bg-forest transition-colors"
          >
            Zaloguj dzień 1
          </button>
        </div>
      )}

      {currentData && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-cream rounded-xl p-1 mb-4">
            {(['faza', 'insights'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 py-2 rounded-lg font-sans text-sm transition-all',
                  tab === t ? 'bg-white shadow-sm text-dark font-medium' : 'text-muted hover:text-dark'
                )}
              >
                {t === 'faza' ? 'Bieżąca faza' : 'Wzorce'}
              </button>
            ))}
          </div>

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
