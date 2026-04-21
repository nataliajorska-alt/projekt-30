'use client'
import { useState, useMemo } from 'react'
import { useCycleData } from '@/hooks/useCycleData'
import { useTimelineData } from '@/hooks/useTimelineData'
import {
  CYCLE_PHASES, getPhaseForDate, getPhaseIdForDate,
  type CyclePhase,
} from '@/lib/cycle-data'
import { PILLARS } from '@/lib/pillars'
import clsx from 'clsx'

const PL_DAYS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// ── Karta fazy ───────────────────────────────────────────────────

function PhaseCard({ phase, cycleDay }: { phase: CyclePhase; cycleDay: number }) {
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
            {phase.days[0]}–{phase.days[1]} dzień
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

function CycleTimeline({ cycleDay }: { cycleDay: number }) {
  const clampedDay = Math.min(cycleDay, 28)
  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4">
      <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">Gdzie jesteś w cyklu</p>
      <div className="relative h-3 rounded-full overflow-hidden flex mb-2">
        {CYCLE_PHASES.map(p => {
          const width = ((p.days[1] - p.days[0] + 1) / 28) * 100
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
          style={{ left: `${Math.min((clampedDay / 28) * 100, 98)}%` }}
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

function Insights({ logs, dailyLogs }: {
  logs: ReturnType<typeof useCycleData>['logs']
  dailyLogs: Record<string, any>
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
      const phaseId = getPhaseIdForDate(logs, dateKey)
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

// ── Historia cykli ────────────────────────────────────────────────

function CycleHistory({ logs }: { logs: ReturnType<typeof useCycleData>['logs'] }) {
  if (logs.length === 0) return null
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
          return (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-cream last:border-0">
              <p className="font-sans text-sm text-dark">{label}</p>
              {length && (
                <span className="font-sans text-xs text-muted-light">{length} dni cyklu</span>
              )}
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
  const { logs, loading, logCycleStart } = useCycleData()
  const { logs: dailyLogs, loading: logsLoading } = useTimelineData()
  const [tab, setTab] = useState<Tab>('faza')
  const [showLogForm, setShowLogForm] = useState(false)

  const today = todayKey()
  const currentCycle = logs[0] ?? null
  const currentData = currentCycle ? getPhaseForDate(currentCycle.startDate, today) : null

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
              <PhaseCard phase={currentData.phase} cycleDay={currentData.cycleDay} />
              <CycleTimeline cycleDay={currentData.cycleDay} />
              <CycleHistory logs={logs} />
            </>
          )}

          {tab === 'insights' && (
            <Insights logs={logs} dailyLogs={dailyLogs} />
          )}
        </>
      )}
    </div>
  )
}
