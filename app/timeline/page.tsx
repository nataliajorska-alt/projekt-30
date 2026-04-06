'use client'
import { useMemo } from 'react'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useGameData } from '@/hooks/useGameData'
import YearHeatmap from '@/components/YearHeatmap'
import WeeklyXPChart from '@/components/WeeklyXPChart'
import { computeStreaks, findBestDay, findWorstActiveDay, aggregateXpByMonth } from '@/lib/analytics'

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
          Cały projekt w jednym kadrze. Każdy dzień się liczy.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
          <p className="font-sans text-sm text-muted-light">Wczytuję twoją historię...</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
