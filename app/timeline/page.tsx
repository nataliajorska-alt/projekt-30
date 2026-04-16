'use client'
import { useMemo, useState } from 'react'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useGameData } from '@/hooks/useGameData'
import { useHabitAnalytics, type HabitAnalytics } from '@/hooks/useHabitAnalytics'
import { useGhostLog } from '@/hooks/useGhostLog'
import YearHeatmap from '@/components/YearHeatmap'
import WeeklyXPChart from '@/components/WeeklyXPChart'
import { computeStreaks, findBestDay, findWorstActiveDay, aggregateXpByMonth } from '@/lib/analytics'
import { computeCorrelations, type CorrelationInsight, type ComparisonInsight, type DayOfWeekInsight } from '@/lib/correlations'
import { PILLARS } from '@/lib/pillars'
import { DAILY_RULES } from '@/lib/routineData'
import { Pillar } from '@/types'
import { MOOD_STATES, GHOST_TRIGGER_TAGS, type DailyLog, type MoodCheckIn, type MoodState, type GhostProtocolEntry, type GhostTriggerTag } from '@/types'
import clsx from 'clsx'

type TimelineMode = 'history' | 'pillars' | 'habits' | 'nastroj' | 'protokol' | 'wzorce'

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatDatePL(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatMonthPL(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${PL_MONTH_NAMES[m - 1]} ${y}`
}

export default function TimelinePage() {
  const { logs, loading } = useTimelineData()
  const { stats } = useGameData()
  const { entries: ghostEntries, loading: ghostLoading } = useGhostLog()
  const [mode, setMode] = useState<TimelineMode>('history')
  const habitAnalytics = useHabitAnalytics(logs)

  const analytics = useMemo(() => {
    const streaks = computeStreaks(logs)
    const best = findBestDay(logs)
    const worst = findWorstActiveDay(logs)
    const monthly = aggregateXpByMonth(logs)
    const months = Object.values(monthly).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    const maxMonthXP = Math.max(1, ...months.map(m => m.totalXP))
    const longStreaks = streaks.allStreaks.filter(s => s.length >= 7).length
    return { streaks, best, worst, months, maxMonthXP, longStreaks }
  }, [logs])

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Twój rok</p>
        <h1 className="font-serif text-dark text-2xl mb-1">Historia</h1>
        <p className="font-sans text-sm text-muted">
          {mode === 'history'
            ? 'Cały projekt w jednym kadrze. Każdy dzień się liczy.'
            : mode === 'pillars'
              ? 'Gdzie kierujesz energię? Dbaj o równowagę.'
              : mode === 'nastroj'
                ? 'Dane, które po miesiącu pokazują prawdziwe wzorce.'
                : mode === 'protokol'
                  ? 'Kiedy konkretnie jesteś najbardziej narażona. Dane operacyjne.'
                  : mode === 'wzorce'
                    ? 'Nie dane — wnioski. Co naprawdę działa na Twój nastrój i energię.'
                    : 'Konsekwencja buduje tożsamość. Śledź swoje nawyki.'}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'history' as TimelineMode, label: 'Historia' },
          { key: 'habits' as TimelineMode, label: 'Nawyki' },
          { key: 'pillars' as TimelineMode, label: 'Filary' },
          { key: 'nastroj' as TimelineMode, label: 'Nastrój' },
          { key: 'protokol' as TimelineMode, label: 'Protokół' },
          { key: 'wzorce' as TimelineMode, label: 'Wzorce' },
        ] as { key: TimelineMode; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex-1 py-2.5 rounded-xl font-sans text-xs transition-all',
              mode === key
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
          <p className="font-sans text-sm text-muted-light">Wczytuję dane...</p>
        </div>
      ) : mode === 'history' ? (
        <div className="space-y-6">
          {/* Heatmap */}
          <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6 overflow-x-auto">
            <h2 className="font-serif text-dark text-base mb-1">Kalendarz 365 dni</h2>
            <p className="font-sans text-xs text-muted mb-5">Każdy kwadrat to jeden dzień. Intensywność koloru = XP.</p>
            <YearHeatmap logs={logs} />
          </div>

          {/* Weekly XP chart */}
          <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
            <h2 className="font-serif text-dark text-base mb-1">Tydzień po tygodniu</h2>
            <p className="font-sans text-xs text-muted mb-5">XP zebrane w każdym tygodniu projektu.</p>
            <WeeklyXPChart logs={logs} />
          </div>

          {/* Monthly breakdown */}
          {analytics.months.length > 0 && (
            <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
              <h2 className="font-serif text-dark text-base mb-1">Miesiące projektu</h2>
              <p className="font-sans text-xs text-muted mb-5">Rozkład aktywności na oś czasu.</p>
              <div className="space-y-3">
                {analytics.months.map(m => {
                  const pct = Math.round((m.totalXP / analytics.maxMonthXP) * 100)
                  return (
                    <div key={m.monthKey}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans text-sm text-dark">{formatMonthPL(m.monthKey)}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-sans text-xs text-muted-light">{m.activeDays} dni</span>
                          <span className="font-sans text-xs text-gold-dark font-medium w-20 text-right">
                            {m.totalXP.toLocaleString('pl-PL')} XP
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-gradient rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Streaks & best/worst day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-elegant p-5">
              <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Serie</p>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-sm text-muted">Aktualna</span>
                  <span className="font-serif text-dark text-xl">
                    {analytics.streaks.currentStreak}
                    <span className="text-muted-light text-xs ml-1">dni</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-sm text-muted">Najdłuższa</span>
                  <span className="font-serif text-dark text-xl">
                    {analytics.streaks.longestStreak}
                    <span className="text-muted-light text-xs ml-1">dni</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-sm text-muted">Serii ≥ 7 dni</span>
                  <span className="font-serif text-dark text-xl">{analytics.longStreaks}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-elegant p-5">
              <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Rekordy</p>
              <div className="space-y-3">
                <div>
                  <p className="font-sans text-xs text-muted mb-0.5">Najlepszy dzień</p>
                  {analytics.best ? (
                    <p className="font-serif text-dark text-sm">
                      {formatDatePL(analytics.best.date)} ·{' '}
                      <span className="text-gold-dark">{analytics.best.xp} XP</span>
                    </p>
                  ) : (
                    <p className="font-sans text-xs text-muted-light italic">jeszcze brak danych</p>
                  )}
                </div>
                <div>
                  <p className="font-sans text-xs text-muted mb-0.5">Najspokojniejszy aktywny dzień</p>
                  {analytics.worst ? (
                    <p className="font-serif text-dark text-sm">
                      {formatDatePL(analytics.worst.date)} ·{' '}
                      <span className="text-muted">{analytics.worst.xp} XP</span>
                    </p>
                  ) : (
                    <p className="font-sans text-xs text-muted-light italic">jeszcze brak danych</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overall stats recap */}
          <div className="bg-cream rounded-2xl p-5">
            <p className="font-serif text-dark text-base mb-2">Łącznie</p>
            <p className="font-sans text-sm text-muted leading-relaxed">
              {stats.totalDaysLogged} dni zalogowanych · {stats.totalXP.toLocaleString('pl-PL')} XP ·{' '}
              {stats.totalRoutinesCompleted} rutyn · {stats.totalSideQuestsCompleted} side questów ·{' '}
              {stats.totalRulesKept} zasad dotrzymanych
            </p>
          </div>
        </div>
      ) : mode === 'habits' ? (
        <HabitsTab analytics={habitAnalytics} />
      ) : mode === 'nastroj' ? (
        <MoodTab logs={logs} />
      ) : mode === 'protokol' ? (
        <GhostProtocolMap entries={ghostEntries} loading={ghostLoading} />
      ) : mode === 'wzorce' ? (
        <PatternsTab logs={logs} />
      ) : (
        <PillarsTab stats={stats} />
      )}
    </div>
  )
}

// ---------- Habits Tab ----------

const PL_MONTH_NAMES_SHORT = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']

function formatWeekLabel(weekKey: string): string {
  // weekKey format: "2026-W15"
  return weekKey.replace(/(\d{4})-W(\d+)/, 'T$2')
}

function formatMonthShort(monthKey: string): string {
  const [, m] = monthKey.split('-').map(Number)
  return PL_MONTH_NAMES_SHORT[m - 1] ?? monthKey
}

function rateColor(rate: number): string {
  if (rate >= 80) return '#2C3B35'  // forest — excellent
  if (rate >= 60) return '#B8963E'  // gold — good
  if (rate >= 40) return '#D4AF6B'  // gold-light — average
  return '#E2D9CE'                  // border — low
}

function HabitsTab({ analytics }: { analytics: HabitAnalytics }) {
  const { byWeek, byMonth, ruleStats, totalDaysLogged, overallAvgCompletion } = analytics

  const recentWeeks = byWeek.slice(-12)  // ostatnie 12 tygodni

  if (totalDaysLogged === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
        <p className="font-sans text-sm text-muted-light">
          Brak danych. Zacznij logować dni, żeby zobaczyć analizę nawyków.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Podsumowanie */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-elegant p-5">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Śr. ukończenie rutyny</p>
          <p className="font-serif text-dark text-3xl">
            {overallAvgCompletion}
            <span className="text-muted-light text-sm ml-1">%</span>
          </p>
          <p className="font-sans text-xs text-muted mt-1">przez cały projekt</p>
        </div>
        <div className="bg-white rounded-2xl shadow-elegant p-5">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Dni zalogowane</p>
          <p className="font-serif text-dark text-3xl">{totalDaysLogged}</p>
          <p className="font-sans text-xs text-muted mt-1">
            {byWeek.length} {byWeek.length === 1 ? 'tydzień' : 'tygodnie'}
          </p>
        </div>
      </div>

      {/* Konsekwencja rutyny tygodniami */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
        <h2 className="font-serif text-dark text-base mb-1">Konsekwencja rutyny</h2>
        <p className="font-sans text-xs text-muted mb-5">
          % ukończenia elementów rutyny per tydzień (ostatnie 12 tygodni).
          Ciemniejszy = lepsza konsekwencja.
        </p>
        {recentWeeks.length === 0 ? (
          <p className="font-sans text-xs text-muted-light text-center py-4">Brak danych tygodniowych.</p>
        ) : (
          <div className="space-y-2">
            {recentWeeks.map(w => (
              <div key={w.weekKey} className="flex items-center gap-3">
                <span className="font-sans text-[11px] text-muted w-8 flex-shrink-0">{formatWeekLabel(w.weekKey)}</span>
                <div className="flex-1 h-6 bg-cream rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(4, w.avgCompletionRate)}%`,
                      backgroundColor: rateColor(w.avgCompletionRate),
                    }}
                  />
                </div>
                <span className="font-sans text-xs font-medium w-10 text-right" style={{ color: rateColor(w.avgCompletionRate) }}>
                  {w.avgCompletionRate}%
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          {[
            { label: '≥80% świetnie', color: '#2C3B35' },
            { label: '≥60% dobrze', color: '#B8963E' },
            { label: '≥40% przeciętnie', color: '#D4AF6B' },
            { label: '<40% słabo', color: '#E2D9CE' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-sans text-[10px] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Miesięczne podsumowanie nawyków */}
      {byMonth.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
          <h2 className="font-serif text-dark text-base mb-1">Miesiące — nawyki</h2>
          <p className="font-sans text-xs text-muted mb-5">
            Aktywne dni, średnie ukończenie rutyny i questy per miesiąc.
          </p>
          <div className="space-y-4">
            {byMonth.map(m => (
              <div key={m.monthKey}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-sm text-dark font-medium">{formatMonthShort(m.monthKey)}</span>
                  <div className="flex items-center gap-4 text-xs font-sans">
                    <span className="text-muted">{m.activeDays} dni</span>
                    <span className="text-muted">{m.totalSideQuests} questów</span>
                    <span className="font-medium" style={{ color: rateColor(m.avgCompletionRate) }}>
                      {m.avgCompletionRate}% rutyny
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, m.avgCompletionRate)}%`,
                      backgroundColor: rateColor(m.avgCompletionRate),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statystyki zasad */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
        <h2 className="font-serif text-dark text-base mb-1">Zasady</h2>
        <p className="font-sans text-xs text-muted mb-5">
          Ile razy każda zasada była dotrzymana (spośród {totalDaysLogged} zalogowanych dni).
        </p>
        {ruleStats.length === 0 ? (
          <p className="font-sans text-xs text-muted-light text-center py-4">
            Zacznij zaznaczać zasady każdego dnia, żeby zobaczyć statystyki.
          </p>
        ) : (
          <div className="space-y-4">
            {DAILY_RULES.map(rule => {
              const stat = ruleStats.find(s => s.ruleId === rule.id)
              const kept = stat?.totalKept ?? 0
              const rate = stat?.ratePercent ?? 0
              const barPct = Math.round((kept / totalDaysLogged) * 100)
              return (
                <div key={rule.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans text-sm text-dark">{rule.text}</span>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="font-sans text-xs text-muted">{kept} razy</span>
                      <span className="font-sans text-xs font-medium text-gold-dark w-10 text-right">{rate}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gold"
                      style={{ width: `${Math.max(barPct > 0 ? 2 : 0, barPct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Pillars Tab ----------

interface PillarsTabProps {
  stats: ReturnType<typeof useGameData>['stats']
}

function PillarsTab({ stats }: PillarsTabProps) {
  const pillarData = PILLARS.map(p => ({
    ...p,
    xp: stats.pillarXP[p.id as Pillar] ?? 0,
  }))

  const totalXP = pillarData.reduce((acc, p) => acc + p.xp, 0) || 1
  const maxXP = Math.max(...pillarData.map(p => p.xp), 1)

  return (
    <div className="space-y-5">
      {/* Pillar distribution bar chart */}
      <div className="bg-white rounded-2xl shadow-elegant p-6">
        <h2 className="font-serif text-dark text-base mb-5">Rozkład XP według filaru</h2>
        <div className="space-y-4">
          {pillarData
            .sort((a, b) => b.xp - a.xp)
            .map(p => {
              const pct = Math.round((p.xp / totalXP) * 100)
              const barPct = Math.round((p.xp / maxXP) * 100)
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-sans text-sm text-dark font-medium">{p.shortName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-xs text-muted">{pct}%</span>
                      <span className="font-sans text-xs text-muted-light w-16 text-right">
                        {p.xp.toLocaleString('pl-PL')} XP
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: p.color,
                        opacity: barPct === 0 ? 0.3 : 1,
                      }}
                    />
                  </div>
                </div>
              )
            })}
        </div>

        {totalXP === 1 && (
          <p className="font-sans text-xs text-muted-light text-center mt-6">
            Zacznij zdobywać XP, aby zobaczyć swój rozkład energii.
          </p>
        )}
      </div>

      {/* Pillar cards */}
      <div className="grid grid-cols-1 gap-4">
        {PILLARS.map(p => {
          const xp = stats.pillarXP[p.id as Pillar] ?? 0
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-elegant p-5 flex items-start gap-4"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: p.bgColor }}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-dark text-base mb-0.5">{p.name}</h3>
                <p className="font-sans text-xs text-muted leading-relaxed mb-2">{p.description}</p>
                <div className="flex items-center gap-2">
                  <span
                    className="font-sans text-xs font-medium"
                    style={{ color: p.color }}
                  >
                    {xp.toLocaleString('pl-PL')} XP
                  </span>
                  {xp === 0 && (
                    <span className="font-sans text-[10px] text-muted-light bg-cream px-2 py-0.5 rounded-full">
                      nieaktywny
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Balance note */}
      <div className="bg-cream rounded-2xl p-5">
        <p className="font-serif text-dark text-base mb-2">O balansie</p>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Transformacja działa najlepiej, gdy żaden filar nie jest całkowicie zaniedbany.
          Nie musisz równo rozkładać energii każdego dnia — ale co tydzień sprawdź, czy
          nie ignorujesz żadnego obszaru przez zbyt długi czas.
        </p>
      </div>
    </div>
  )
}

// ---------- Mood Tab ----------

const PL_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const PL_DAYS_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

function moodStateColor(state: MoodState): string {
  return state === 'calm'    ? '#2C3B35'
       : state === 'clarity' ? '#B8963E'
       : state === 'fog'     ? '#9B8E84'
       :                       '#6B3A4E'
}

function avgOrNull(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

interface MoodTabProps {
  logs: Record<string, import('@/types').DailyLog>
}

function MoodTab({ logs }: MoodTabProps) {
  const allCheckIns: (MoodCheckIn & { dateKey: string; weekday: number; weekKey: string })[] = []

  for (const [dateKey, log] of Object.entries(logs)) {
    if (!log.moodCheckIns?.length) continue
    const [y, m, d] = dateKey.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const weekday = (date.getDay() + 6) % 7
    const du = new Date(Date.UTC(y, m - 1, d))
    const dn = du.getUTCDay() || 7
    du.setUTCDate(du.getUTCDate() + 4 - dn)
    const yearStart = new Date(Date.UTC(du.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((du.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    const weekKey = `${du.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
    for (const ci of log.moodCheckIns) {
      allCheckIns.push({ ...ci, dateKey, weekday, weekKey })
    }
  }

  const totalCheckIns = allCheckIns.length

  if (totalCheckIns === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
        <p className="font-serif text-dark text-lg mb-2">Brak danych</p>
        <p className="font-sans text-sm text-muted-light">
          Uzupełnij kilka check-inów nastroju — pojawią się tu wzorce i trendy.
        </p>
      </div>
    )
  }

  const avgMood   = avgOrNull(allCheckIns.map(c => c.mood))!
  const avgEnergy = avgOrNull(allCheckIns.map(c => c.energy))!

  const stateCounts = { calm: 0, storm: 0, fog: 0, clarity: 0 } as Record<MoodState, number>
  for (const ci of allCheckIns) stateCounts[ci.state]++
  const dominantState = (Object.entries(stateCounts) as [MoodState, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const byWeek: Record<string, { moods: number[]; energies: number[] }> = {}
  for (const ci of allCheckIns) {
    if (!byWeek[ci.weekKey]) byWeek[ci.weekKey] = { moods: [], energies: [] }
    byWeek[ci.weekKey].moods.push(ci.mood)
    byWeek[ci.weekKey].energies.push(ci.energy)
  }
  const weeklyData = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([wk, data]) => ({
      weekKey: wk,
      label: wk.replace(/\d{4}-W/, 'T'),
      avgMood: avgOrNull(data.moods)!,
      avgEnergy: avgOrNull(data.energies)!,
    }))

  const byDay: Record<number, { moods: number[]; energies: number[] }> = {}
  for (let i = 0; i < 7; i++) byDay[i] = { moods: [], energies: [] }
  for (const ci of allCheckIns) {
    byDay[ci.weekday].moods.push(ci.mood)
    byDay[ci.weekday].energies.push(ci.energy)
  }
  const dayData = Array.from({ length: 7 }, (_, i) => ({
    label: PL_DAYS[i],
    labelFull: PL_DAYS_FULL[i],
    avgMood: avgOrNull(byDay[i].moods),
    avgEnergy: avgOrNull(byDay[i].energies),
    count: byDay[i].moods.length,
  }))

  const daysWithData = dayData.filter(d => d.avgMood !== null)
  const bestDay  = [...daysWithData].sort((a, b) => b.avgMood! - a.avgMood!)[0]
  const worstDay = [...daysWithData].sort((a, b) => a.avgMood! - b.avgMood!)[0]

  const dominantMeta = MOOD_STATES.find(s => s.value === dominantState)

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-elegant p-4 text-center">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Śr. nastrój</p>
          <p className="font-serif text-dark text-2xl">{avgMood.toFixed(1)}</p>
          <p className="font-sans text-[10px] text-muted mt-1">/ 5</p>
        </div>
        <div className="bg-white rounded-2xl shadow-elegant p-4 text-center">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Śr. energia</p>
          <p className="font-serif text-dark text-2xl">{avgEnergy.toFixed(1)}</p>
          <p className="font-sans text-[10px] text-muted mt-1">/ 5</p>
        </div>
        <div className="bg-white rounded-2xl shadow-elegant p-4 text-center">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-2">Check-iny</p>
          <p className="font-serif text-dark text-2xl">{totalCheckIns}</p>
          <p className="font-sans text-[10px] text-muted mt-1">łącznie</p>
        </div>
      </div>

      {/* Dominant state */}
      {dominantMeta && (
        <div className="bg-white rounded-2xl shadow-elegant p-5 flex items-center gap-4">
          <span className="text-4xl">{dominantMeta.emoji}</span>
          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-0.5">Dominujący stan</p>
            <p className="font-serif text-dark text-base capitalize">{dominantMeta.label}</p>
            <p className="font-sans text-xs text-muted mt-0.5">
              {stateCounts[dominantState]} z {totalCheckIns} ({Math.round(stateCounts[dominantState] / totalCheckIns * 100)}%)
            </p>
          </div>
        </div>
      )}

      {/* Weekly trend */}
      {weeklyData.length >= 2 && (
        <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
          <h2 className="font-serif text-dark text-base mb-1">Trend tygodniowy</h2>
          <p className="font-sans text-xs text-muted mb-5">Średni nastrój i energia per tydzień.</p>
          <div className="space-y-3">
            {weeklyData.map(w => (
              <div key={w.weekKey} className="flex items-center gap-3">
                <span className="font-sans text-[11px] text-muted w-8 flex-shrink-0">{w.label}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[10px] text-muted w-12">nastrój</span>
                    <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${(w.avgMood / 5) * 100}%` }} />
                    </div>
                    <span className="font-sans text-[11px] text-muted w-6 text-right">{w.avgMood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[10px] text-muted w-12">energia</span>
                    <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${(w.avgEnergy / 5) * 100}%` }} />
                    </div>
                    <span className="font-sans text-[11px] text-muted w-6 text-right">{w.avgEnergy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-forest" />
              <span className="font-sans text-[10px] text-muted">nastrój</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-gold" />
              <span className="font-sans text-[10px] text-muted">energia</span>
            </div>
          </div>
        </div>
      )}

      {/* Day-of-week patterns */}
      {daysWithData.length >= 3 && (
        <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
          <h2 className="font-serif text-dark text-base mb-1">Wzorce tygodniowe</h2>
          <p className="font-sans text-xs text-muted mb-5">Średni nastrój według dnia tygodnia.</p>
          <div className="space-y-3">
            {dayData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-sans text-[11px] text-muted w-7 flex-shrink-0">{d.label}</span>
                {d.avgMood !== null ? (
                  <>
                    <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forest transition-all duration-500"
                        style={{ width: `${(d.avgMood / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-sans text-[11px] text-muted w-6 text-right">{d.avgMood.toFixed(1)}</span>
                    <span className="font-sans text-[10px] text-muted-light w-8 text-right flex-shrink-0">{d.count}×</span>
                  </>
                ) : (
                  <div className="flex-1 h-2 bg-cream/50 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State distribution */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
        <h2 className="font-serif text-dark text-base mb-1">Rozkład stanów</h2>
        <p className="font-sans text-xs text-muted mb-5">Jak często pojawia się każdy ze stanów.</p>
        <div className="space-y-3">
          {MOOD_STATES.map(({ value, emoji, label }) => {
            const count = stateCounts[value]
            const pct = totalCheckIns > 0 ? Math.round((count / totalCheckIns) * 100) : 0
            return (
              <div key={value}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    <span className="font-sans text-sm text-dark capitalize">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-muted">{count}×</span>
                    <span className="font-sans text-xs font-medium text-muted w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: moodStateColor(value) }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insight card */}
      {bestDay && worstDay && bestDay.label !== worstDay.label && (
        <div className="bg-forest rounded-2xl p-5">
          <p className="font-sans text-[10px] text-ivory/60 uppercase tracking-widest mb-2">Twój wzorzec</p>
          <p className="font-serif text-ivory text-base leading-relaxed">
            Najlepszy nastrój w <span className="text-gold-light">{bestDay.labelFull.toLowerCase()}</span>{' '}
            ({bestDay.avgMood!.toFixed(1)}/5).{' '}
            Najtrudniejszy w <span className="text-ivory/70">{worstDay.labelFull.toLowerCase()}</span>{' '}
            ({worstDay.avgMood!.toFixed(1)}/5).
          </p>
          {worstDay.avgMood! < 3 && (
            <p className="font-sans text-xs text-ivory/60 mt-2">
              Zaplanuj coś dobrego na {worstDay.labelFull.toLowerCase()} — quest, ruch, kontakt z kimś bliskim.
            </p>
          )}
        </div>
      )}

    </div>
  )
}

// ---------- Ghost Protocol Map ----------

const PL_DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const PL_DAYS_FULL_GP = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

const TIME_SLOTS = [
  { label: 'noc',      range: '0–6',   hours: [0,1,2,3,4,5] },
  { label: 'rano',     range: '7–11',  hours: [6,7,8,9,10,11] },
  { label: 'południe', range: '12–16', hours: [12,13,14,15,16] },
  { label: 'wieczór',  range: '17–20', hours: [17,18,19,20] },
  { label: 'późny w.', range: '21–23', hours: [21,22,23] },
]

const MIN_FOR_FULL_MAP = 30
const MIN_FOR_BASIC = 5

interface GhostProtocolMapProps {
  entries: GhostProtocolEntry[]
  loading: boolean
}

function GhostProtocolMap({ entries, loading }: GhostProtocolMapProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
        <p className="font-sans text-sm text-muted-light">Wczytuję dane...</p>
      </div>
    )
  }

  const total = entries.length

  if (total === 0) {
    return (
      <div className="bg-dark rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🛡️</div>
        <p className="font-serif text-ivory text-lg mb-2">Brak wpisów</p>
        <p className="font-sans text-sm text-ivory/50 leading-relaxed">
          Każde uruchomienie Ghost Protocol jest tu zapisywane.<br />
          Mapa podatności pojawi się po {MIN_FOR_BASIC} wpisach.
        </p>
      </div>
    )
  }

  const tagCounts = {} as Record<GhostTriggerTag, number>
  for (const t of GHOST_TRIGGER_TAGS) tagCounts[t.value] = 0
  for (const e of entries) tagCounts[e.triggerTag]++

  const topTag = GHOST_TRIGGER_TAGS
    .map(t => ({ ...t, count: tagCounts[t.value] }))
    .sort((a, b) => b.count - a.count)[0]

  const grid: number[][] = Array.from({ length: TIME_SLOTS.length }, () => Array(7).fill(0))
  for (const e of entries) {
    const slotIdx = TIME_SLOTS.findIndex(s => s.hours.includes(e.hour))
    if (slotIdx >= 0) grid[slotIdx][e.weekday]++
  }
  const maxCell = Math.max(1, ...grid.flat())

  let peakSlot = 0, peakDay = 0
  for (let s = 0; s < TIME_SLOTS.length; s++) {
    for (let d = 0; d < 7; d++) {
      if (grid[s][d] > grid[peakSlot][peakDay]) { peakSlot = s; peakDay = d }
    }
  }
  const hasPeak = grid[peakSlot][peakDay] > 0

  const dayTotals = Array(7).fill(0)
  for (const e of entries) dayTotals[e.weekday]++
  const maxDayTotal = Math.max(1, ...dayTotals)

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark rounded-2xl p-5 text-center">
          <p className="font-sans text-[10px] text-ivory/40 uppercase tracking-widest mb-2">Uruchomień</p>
          <p className="font-serif text-ivory text-3xl">{total}</p>
          {total < MIN_FOR_FULL_MAP && (
            <p className="font-sans text-[10px] text-ivory/30 mt-1">pełna mapa od {MIN_FOR_FULL_MAP}</p>
          )}
        </div>
        <div className="bg-dark rounded-2xl p-5 text-center">
          <p className="font-sans text-[10px] text-ivory/40 uppercase tracking-widest mb-2">Główny wyzwalacz</p>
          <p className="text-2xl mb-1">{topTag.emoji}</p>
          <p className="font-sans text-xs text-ivory/70">{topTag.label}</p>
        </div>
      </div>

      {total >= MIN_FOR_BASIC && (
        <div className="bg-dark rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif text-ivory text-base mb-1">Mapa podatności</h2>
          <p className="font-sans text-xs text-ivory/40 mb-5">
            Kiedy konkretnie najczęściej uruchamiasz protokół.
            {total < MIN_FOR_FULL_MAP && ` (dane wstępne — ${MIN_FOR_FULL_MAP - total} wpisów do pełnej mapy)`}
          </p>
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <div className="flex mb-2 ml-16">
                {PL_DAYS_SHORT.map(d => (
                  <div key={d} className="flex-1 text-center font-sans text-[10px] text-ivory/30">{d}</div>
                ))}
              </div>
              {TIME_SLOTS.map((slot, si) => (
                <div key={slot.label} className="flex items-center mb-1.5">
                  <div className="w-16 flex-shrink-0">
                    <p className="font-sans text-[10px] text-ivory/40 leading-tight">{slot.label}</p>
                    <p className="font-sans text-[9px] text-ivory/20">{slot.range}</p>
                  </div>
                  {grid[si].map((count, di) => {
                    const intensity = count / maxCell
                    return (
                      <div key={di} className="flex-1 mx-0.5">
                        <div
                          className="h-7 rounded-md"
                          style={{
                            backgroundColor: count === 0
                              ? 'rgba(255,255,255,0.04)'
                              : `rgba(184,150,62,${0.2 + intensity * 0.8})`,
                          }}
                          title={`${PL_DAYS_FULL_GP[di]} ${slot.label}: ${count}×`}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 ml-16">
                <span className="font-sans text-[10px] text-ivory/30">rzadko</span>
                <div className="flex gap-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map(o => (
                    <div key={o} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(184,150,62,${o})` }} />
                  ))}
                </div>
                <span className="font-sans text-[10px] text-ivory/30">często</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {total >= MIN_FOR_BASIC && (
        <div className="bg-dark rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif text-ivory text-base mb-1">Podatność według dnia</h2>
          <p className="font-sans text-xs text-ivory/40 mb-5">Łączna liczba uruchomień per dzień tygodnia.</p>
          <div className="space-y-2">
            {PL_DAYS_SHORT.map((d, i) => {
              const count = dayTotals[i]
              const pct = Math.round((count / maxDayTotal) * 100)
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="font-sans text-[11px] text-ivory/40 w-7 flex-shrink-0">{d}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.7)' }}
                    />
                  </div>
                  <span className="font-sans text-[11px] text-ivory/40 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-dark rounded-2xl p-5 sm:p-6">
        <h2 className="font-serif text-ivory text-base mb-1">Wyzwalacze</h2>
        <p className="font-sans text-xs text-ivory/40 mb-5">Co najczęściej poprzedza impuls.</p>
        <div className="space-y-3">
          {GHOST_TRIGGER_TAGS.map(({ value, emoji, label }) => {
            const count = tagCounts[value]
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={value}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    <span className="font-sans text-sm text-ivory/70">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-ivory/40">{count}×</span>
                    <span className="font-sans text-xs text-ivory/50 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.6)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {total >= MIN_FOR_FULL_MAP && hasPeak && (
        <div className="bg-gold/10 border border-gold/20 rounded-2xl p-5">
          <p className="font-sans text-[10px] text-gold/70 uppercase tracking-widest mb-2">Dane operacyjne</p>
          <p className="font-serif text-ivory text-base leading-relaxed">
            Najczęściej narażona:{' '}
            <span className="text-gold">{PL_DAYS_FULL_GP[peakDay].toLowerCase()}</span>{' '}
            {TIME_SLOTS[peakSlot].label} ({TIME_SLOTS[peakSlot].range}).
          </p>
          <p className="font-sans text-xs text-ivory/50 mt-2 leading-relaxed">
            Zaplanuj konkretne działanie na ten moment — quest, ruch, telefon do kogoś bliskiego.
            Pasywne czekanie na impuls to stara strategia.
          </p>
        </div>
      )}

      {total < MIN_FOR_FULL_MAP && total >= MIN_FOR_BASIC && (
        <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-sans text-xs text-ivory/30">
            Pełna analiza wzorców po {MIN_FOR_FULL_MAP} wpisach · teraz masz {total}
          </p>
        </div>
      )}

    </div>
  )
}

// ---------- Patterns Tab ----------

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(1)
}

function pctDiff(a: number | null, b: number | null): string | null {
  if (a === null || b === null || b === 0) return null
  const diff = Math.round(((a - b) / b) * 100)
  if (Math.abs(diff) < 5) return null
  return diff > 0 ? `+${diff}%` : `${diff}%`
}

function comparisonNarrative(ins: ComparisonInsight): string {
  const { withValue, withoutValue, withLabel, metric } = ins
  if (withValue === null || withoutValue === null) return 'Za mało danych do porównania.'
  const diff = withValue - withoutValue
  const metricPL = metric === 'mood' ? 'nastrój' : 'energia'
  if (Math.abs(diff) < 0.15) return `Nie wykryto znaczącej różnicy w ${metricPL === 'nastrój' ? 'nastroju' : 'energii'} między grupami.`
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutValue, 0.1)) * 100)
  const dir = diff > 0 ? 'wyższy' : 'niższy'
  return `${withLabel}: Twój ${metricPL} jest o ${absPct}% ${dir} niż w pozostałe dni.`
}

function dowNarrative(ins: DayOfWeekInsight): string {
  const withData = ins.byDay.filter(d => d.count >= 2 && d.value !== null)
  if (withData.length < 3) return 'Za mało danych — check-iny z co najmniej 3 różnych dni tygodnia.'
  const sorted = [...withData].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const best  = sorted[0]
  const worst = sorted[sorted.length - 1]
  const metricPL = ins.metric === 'energy' ? 'energia' : 'nastrój'
  return `Twoja ${metricPL} jest najwyższa w ${best.full} (śr. ${fmt(best.value)}/5), najniższa w ${worst.full} (śr. ${fmt(worst.value)}/5).`
}

function ComparisonCard({ ins }: { ins: ComparisonInsight }) {
  const maxVal = 5
  const narrative = comparisonNarrative(ins)
  const delta = ins.withValue !== null && ins.withoutValue !== null
    ? ins.withValue - ins.withoutValue : null
  const positive = delta !== null && delta > 0.1
  const negative = delta !== null && delta < -0.1

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl leading-none mt-0.5">{ins.icon}</span>
        <div>
          <h3 className="font-serif text-dark text-base leading-snug">{ins.title}</h3>
          <p className="font-sans text-xs text-muted mt-0.5">
            {ins.metric === 'mood' ? 'nastrój 1–5' : 'energia 1–5'}
          </p>
        </div>
      </div>

      {!ins.hasEnoughData ? (
        <div className="bg-cream rounded-xl px-4 py-3">
          <p className="font-sans text-xs text-muted-light leading-relaxed">
            Za mało danych — potrzeba co najmniej 3 dni w każdej grupie i 7 check-inów nastroju.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {/* With condition */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-dark truncate max-w-[70%]">{ins.withLabel}</span>
                <span className={clsx(
                  'font-sans text-xs font-semibold',
                  positive ? 'text-forest' : negative ? 'text-red-400' : 'text-muted'
                )}>
                  {fmt(ins.withValue)}
                  {pctDiff(ins.withValue, ins.withoutValue) && (
                    <span className="ml-1 text-[10px]">({pctDiff(ins.withValue, ins.withoutValue)})</span>
                  )}
                </span>
              </div>
              <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-700', positive ? 'bg-forest' : 'bg-gold')}
                  style={{ width: `${((ins.withValue ?? 0) / maxVal) * 100}%` }}
                />
              </div>
              <span className="font-sans text-[10px] text-muted-light">{ins.withCount} dni</span>
            </div>

            {/* Without condition */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-muted truncate max-w-[70%]">{ins.withoutLabel}</span>
                <span className="font-sans text-xs text-muted-light">{fmt(ins.withoutValue)}</span>
              </div>
              <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-parchment rounded-full transition-all duration-700"
                  style={{ width: `${((ins.withoutValue ?? 0) / maxVal) * 100}%` }}
                />
              </div>
              <span className="font-sans text-[10px] text-muted-light">{ins.withoutCount} dni</span>
            </div>
          </div>

          {/* Narrative */}
          <div className={clsx(
            'rounded-xl px-4 py-3 border',
            positive ? 'bg-forest/5 border-forest/20' : negative ? 'bg-red-50 border-red-100' : 'bg-cream border-transparent'
          )}>
            <p className={clsx(
              'font-sans text-xs leading-relaxed',
              positive ? 'text-forest' : negative ? 'text-red-600' : 'text-muted'
            )}>
              {narrative}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function DayOfWeekCard({ ins }: { ins: DayOfWeekInsight }) {
  const narrative = dowNarrative(ins)
  const withData = ins.byDay.filter(d => d.value !== null)
  const maxVal = withData.length > 0 ? Math.max(...withData.map(d => d.value ?? 0)) : 5
  const minVal = withData.length > 0 ? Math.min(...withData.map(d => d.value ?? 0)) : 0

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl leading-none mt-0.5">{ins.icon}</span>
        <div>
          <h3 className="font-serif text-dark text-base leading-snug">{ins.title}</h3>
          <p className="font-sans text-xs text-muted mt-0.5">
            {ins.metric === 'mood' ? 'nastrój 1–5' : 'energia 1–5'}
          </p>
        </div>
      </div>

      {!ins.hasEnoughData ? (
        <div className="bg-cream rounded-xl px-4 py-3">
          <p className="font-sans text-xs text-muted-light">Za mało danych — potrzeba co najmniej 7 check-inów nastroju.</p>
        </div>
      ) : (
        <>
          {/* 7-day bars */}
          <div className="flex gap-1.5 mb-4 items-end" style={{ height: '72px' }}>
            {ins.byDay.map(day => {
              const hasDat = day.value !== null && day.count >= 1
              const isBest  = hasDat && day.value === maxVal && maxVal > minVal
              const isWorst = hasDat && day.value === minVal && maxVal > minVal
              const heightPct = hasDat ? ((day.value! - 0) / 5) * 100 : 8

              return (
                <div key={day.dow} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: '52px' }}>
                    <div
                      className={clsx(
                        'w-full rounded-md transition-all duration-700',
                        isBest  ? 'bg-forest' :
                        isWorst ? 'bg-parchment' :
                        hasDat  ? 'bg-gold/60' : 'bg-cream'
                      )}
                      style={{ height: `${heightPct}%` }}
                      title={hasDat ? `${day.full}: ${fmt(day.value)}/5 (${day.count} dni)` : day.full}
                    />
                  </div>
                  <span className={clsx(
                    'font-sans text-[9px]',
                    isBest ? 'text-forest font-semibold' : isWorst ? 'text-muted' : 'text-muted-light'
                  )}>
                    {day.short}
                  </span>
                  <span className="font-sans text-[9px] text-muted-light">{fmt(day.value)}</span>
                </div>
              )
            })}
          </div>

          <div className="bg-cream rounded-xl px-4 py-3">
            <p className="font-sans text-xs text-muted leading-relaxed">{narrative}</p>
          </div>
        </>
      )}
    </div>
  )
}

function PatternsTab({ logs }: { logs: Record<string, DailyLog> }) {
  const insights = useMemo(() => computeCorrelations(logs), [logs])
  const logsWithMood = Object.values(logs).filter(l => l.moodCheckIns && l.moodCheckIns.length > 0)
  const MIN_TOTAL = 7

  if (logsWithMood.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p className="font-serif text-dark text-lg mb-2">Wzorce pojawią się z czasem</p>
        <p className="font-sans text-sm text-muted leading-relaxed max-w-sm mx-auto">
          Uzupełniaj check-iny nastroju (pojawiają się losowo na dashboardzie) — po kilku tygodniach zobaczysz tu automatyczne wnioski.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-cream rounded-2xl p-4">
        <p className="font-sans text-xs text-muted leading-relaxed">
          Analiza oparta na <span className="font-medium text-dark">{logsWithMood.length} dniach z check-inem nastroju</span>.
          {logsWithMood.length < MIN_TOTAL
            ? ` Potrzeba co najmniej ${MIN_TOTAL}, żeby uruchomić pełną analizę.`
            : ' Wzorce aktualizują się automatycznie wraz z nowymi danymi.'}
        </p>
      </div>

      {/* Cards */}
      {insights.map(ins => (
        ins.type === 'comparison'
          ? <ComparisonCard key={ins.id} ins={ins as ComparisonInsight} />
          : <DayOfWeekCard key={ins.id} ins={ins as DayOfWeekInsight} />
      ))}
    </div>
  )
}
