'use client'
import { MOOD_STATES, type DailyLog, type MoodCheckIn, type MoodState } from '@/types'

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
  logs: Record<string, DailyLog>
}

export default function MoodTab({ logs }: MoodTabProps) {
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
