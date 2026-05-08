'use client'
import type { HabitAnalytics } from '@/hooks/useHabitAnalytics'
import { DAILY_RULES } from '@/lib/routineData'

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

export default function HabitsTab({ analytics }: { analytics: HabitAnalytics }) {
  const { byWeek, byMonth, ruleStats, totalDaysLogged, overallAvgCompletion, totalActivityDays } = analytics

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

      {/* Aktywność fizyczna */}
      <div className="bg-white rounded-2xl shadow-elegant p-5 sm:p-6">
        <h2 className="font-serif text-dark text-base mb-1">Aktywność fizyczna</h2>
        <p className="font-sans text-xs text-muted mb-5">
          Dane z zaznaczenia &quot;Ćwiczyłam dziś&quot; w Skali Magnetyzmu.
        </p>

        {totalActivityDays === 0 ? (
          <p className="font-sans text-xs text-muted-light text-center py-4">
            Zaznaczaj aktywność w Skali Magnetyzmu — pojawi się tu częstotliwość.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-cream rounded-xl p-4 text-center">
                <p className="font-serif text-dark text-2xl">{totalActivityDays}</p>
                <p className="font-sans text-[10px] text-muted uppercase tracking-wide mt-1">dni aktywnych</p>
              </div>
              <div className="bg-cream rounded-xl p-4 text-center">
                <p className="font-serif text-dark text-2xl">
                  {totalDaysLogged > 0 ? Math.round((totalActivityDays / totalDaysLogged) * 100) : 0}%
                </p>
                <p className="font-sans text-[10px] text-muted uppercase tracking-wide mt-1">zalogowanych dni</p>
              </div>
            </div>

            {/* Tygodnie */}
            {byWeek.length > 0 && (
              <div className="space-y-2">
                <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">Per tydzień</p>
                {byWeek.slice(-8).map(w => {
                  const pct = w.activeDays > 0 ? Math.round((w.activityDays / w.activeDays) * 100) : 0
                  const label = w.weekKey.replace(/\d{4}-W/, 'T')
                  return (
                    <div key={w.weekKey} className="flex items-center gap-3">
                      <span className="font-sans text-[11px] text-muted w-8 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-5 bg-cream rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max(w.activityDays > 0 ? 8 : 0, pct)}%`,
                            backgroundColor: pct >= 60 ? '#2C3B35' : pct >= 30 ? '#B8963E' : '#D4AF6B',
                          }}
                        />
                      </div>
                      <span className="font-sans text-xs text-muted w-14 text-right shrink-0">
                        {w.activityDays}/{w.activeDays} dni
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
