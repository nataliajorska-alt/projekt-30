'use client'
import type { HabitAnalytics } from '@/hooks/useHabitAnalytics'
import { DAILY_RULES } from '@/lib/routineData'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

const PL_MONTH_NAMES_SHORT = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']

function formatWeekLabel(weekKey: string): string {
  return weekKey.replace(/(\d{4})-W(\d+)/, 'T$2')
}
function formatMonthShort(monthKey: string): string {
  const [, m] = monthKey.split('-').map(Number)
  return PL_MONTH_NAMES_SHORT[m - 1] ?? monthKey
}

function rateColor(rate: number): string {
  if (rate >= 80) return '#2C3B35'
  if (rate >= 60) return '#B8963E'
  if (rate >= 40) return '#D4AF6B'
  return '#C9BFB1'
}

export default function HabitsTab({ analytics }: { analytics: HabitAnalytics }) {
  const { byWeek, byMonth, ruleStats, totalDaysLogged, overallAvgCompletion, totalActivityDays } = analytics
  const recentWeeks = byWeek.slice(-12)

  if (totalDaysLogged === 0) {
    return (
      <div className="bg-ivory border border-gold-light/40 p-12 text-center">
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
        <p className="font-serif-body italic text-muted text-[13.5px]">
          brak danych. zacznij logować dni, żeby zobaczyć analizę nawyków.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ivory border border-gold-light/40 p-5">
          <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
            Śr. ukończenie rutyny
          </SmallCaps>
          <p className="font-display text-dark text-3xl leading-none">
            {overallAvgCompletion}
            <span className="text-muted-light text-base font-serif-body italic ml-1">%</span>
          </p>
          <p className="font-serif-body italic text-muted text-[12px] mt-2">
            przez cały projekt
          </p>
        </div>
        <div className="bg-ivory border border-gold-light/40 p-5">
          <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
            Dni zalogowane
          </SmallCaps>
          <p className="font-display text-dark text-3xl leading-none">{totalDaysLogged}</p>
          <p className="font-serif-body italic text-muted text-[12px] mt-2">
            {byWeek.length} {byWeek.length === 1 ? 'tydzień' : 'tygodnie'}
          </p>
        </div>
      </div>

      {/* Konsekwencja */}
      <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Konsekwencja
        </SmallCaps>
        <h2 className="font-heading text-dark text-lg mt-1">Rutyna tygodniami</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
          % ukończenia per tydzień (ostatnie XII). ciemniejszy = lepsza konsekwencja.
        </p>

        {recentWeeks.length === 0 ? (
          <p className="font-serif-body italic text-muted-light text-[13px] text-center py-4">
            brak danych tygodniowych.
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentWeeks.map(w => (
              <div key={w.weekKey} className="flex items-center gap-3">
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-8 shrink-0">
                  {formatWeekLabel(w.weekKey)}
                </SmallCaps>
                <div className="flex-1 h-px bg-hairline relative">
                  <div
                    className="absolute left-0 top-0 h-px transition-all duration-500"
                    style={{
                      width: `${Math.max(2, w.avgCompletionRate)}%`,
                      backgroundColor: rateColor(w.avgCompletionRate),
                    }}
                  />
                </div>
                <span
                  className="font-ui text-[11px] w-10 text-right tabular-nums"
                  style={{ color: rateColor(w.avgCompletionRate) }}
                >
                  {w.avgCompletionRate}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 pt-3 border-t border-hairline">
          {[
            { label: '≥80% świetnie', color: '#2C3B35' },
            { label: '≥60% dobrze', color: '#B8963E' },
            { label: '≥40% przeciętnie', color: '#D4AF6B' },
            { label: '<40% słabo', color: '#C9BFB1' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span style={{ color }}>
                <Diamond size={4} filled />
              </span>
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                {label}
              </SmallCaps>
            </div>
          ))}
        </div>
      </section>

      {/* Miesiące */}
      {byMonth.length > 0 && (
        <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Miesiące
          </SmallCaps>
          <h2 className="font-heading text-dark text-lg mt-1">Nawyki</h2>
          <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
            aktywne dni, średnie ukończenie rutyny i questy per miesiąc.
          </p>
          <div className="space-y-4">
            {byMonth.map(m => (
              <div key={m.monthKey}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-heading text-dark text-[14px]">
                    {formatMonthShort(m.monthKey)}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      {m.activeDays} dni
                    </SmallCaps>
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      {m.totalSideQuests} questów
                    </SmallCaps>
                    <span
                      className="font-ui text-[11px] tabular-nums"
                      style={{ color: rateColor(m.avgCompletionRate) }}
                    >
                      {m.avgCompletionRate}% rutyny
                    </span>
                  </div>
                </div>
                <div className="relative h-px w-full bg-hairline">
                  <div
                    className="absolute left-0 top-0 h-px transition-all duration-500"
                    style={{
                      width: `${Math.max(2, m.avgCompletionRate)}%`,
                      backgroundColor: rateColor(m.avgCompletionRate),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Zasady */}
      <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Zasady
        </SmallCaps>
        <h2 className="font-heading text-dark text-lg mt-1">Statystyki dotrzymania</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
          ile razy każda zasada była dotrzymana (z {totalDaysLogged} zalogowanych dni).
        </p>
        {ruleStats.length === 0 ? (
          <p className="font-serif-body italic text-muted-light text-[13px] text-center py-4">
            zacznij zaznaczać zasady każdego dnia, żeby zobaczyć statystyki.
          </p>
        ) : (
          <div className="space-y-3.5">
            {DAILY_RULES.map(rule => {
              const stat = ruleStats.find(s => s.ruleId === rule.id)
              const kept = stat?.totalKept ?? 0
              const rate = stat?.ratePercent ?? 0
              const barPct = Math.round((kept / totalDaysLogged) * 100)
              return (
                <div key={rule.id}>
                  <div className="flex items-center justify-between mb-1.5 gap-3">
                    <span className="font-serif-body text-[13.5px] text-dark">{rule.text}</span>
                    <div className="flex items-baseline gap-3 shrink-0">
                      <SmallCaps tone="muted" tracking="luxury" size="xs">
                        {kept} razy
                      </SmallCaps>
                      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="w-10 text-right">
                        {rate}%
                      </SmallCaps>
                    </div>
                  </div>
                  <div className="relative h-px w-full bg-hairline">
                    <div
                      className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
                      style={{ width: `${Math.max(barPct > 0 ? 2 : 0, barPct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Aktywność fizyczna */}
      <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Aktywność fizyczna
        </SmallCaps>
        <h2 className="font-heading text-dark text-lg mt-1">Ciało w ruchu</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
          dane z zaznaczenia „ćwiczyłam dziś" w skali magnetyzmu.
        </p>

        {totalActivityDays === 0 ? (
          <p className="font-serif-body italic text-muted-light text-[13px] text-center py-4">
            zaznaczaj aktywność w skali magnetyzmu — pojawi się tu częstotliwość.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-cream/60 border border-hairline p-4 text-center">
                <p className="font-display text-dark text-3xl leading-none">{totalActivityDays}</p>
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">
                  dni aktywnych
                </SmallCaps>
              </div>
              <div className="bg-cream/60 border border-hairline p-4 text-center">
                <p className="font-display text-dark text-3xl leading-none">
                  {totalDaysLogged > 0 ? Math.round((totalActivityDays / totalDaysLogged) * 100) : 0}%
                </p>
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">
                  zalogowanych dni
                </SmallCaps>
              </div>
            </div>

            {byWeek.length > 0 && (
              <div>
                <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-3">
                  Per tydzień
                </SmallCaps>
                <div className="space-y-2.5">
                  {byWeek.slice(-8).map(w => {
                    const pct = w.activeDays > 0 ? Math.round((w.activityDays / w.activeDays) * 100) : 0
                    const label = w.weekKey.replace(/\d{4}-W/, 'T')
                    return (
                      <div key={w.weekKey} className="flex items-center gap-3">
                        <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-8 shrink-0">
                          {label}
                        </SmallCaps>
                        <div className="flex-1 h-px bg-hairline relative">
                          <div
                            className="absolute left-0 top-0 h-px transition-all duration-500"
                            style={{
                              width: `${Math.max(w.activityDays > 0 ? 2 : 0, pct)}%`,
                              backgroundColor: pct >= 60 ? '#2C3B35' : pct >= 30 ? '#B8963E' : '#D4AF6B',
                            }}
                          />
                        </div>
                        <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-14 text-right shrink-0">
                          {w.activityDays}/{w.activeDays}
                        </SmallCaps>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
