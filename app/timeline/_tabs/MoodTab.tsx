'use client'
import { MOOD_STATES, type DailyLog, type MoodCheckIn, type MoodState } from '@/types'
import { SmallCaps, Diamond, Fleuron, CornerBrackets } from '@/components/ui'

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
      <div className="bg-ivory border border-gold-light/40 p-12 text-center">
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
        <h3 className="font-display text-dark text-2xl">Brak danych</h3>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-2">
          uzupełnij kilka check-inów nastroju — pojawią się tu wzorce i trendy.
        </p>
      </div>
    )
  }

  const avgMood = avgOrNull(allCheckIns.map(c => c.mood))!
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
  const bestDay = [...daysWithData].sort((a, b) => b.avgMood! - a.avgMood!)[0]
  const worstDay = [...daysWithData].sort((a, b) => a.avgMood! - b.avgMood!)[0]

  const dominantMeta = MOOD_STATES.find(s => s.value === dominantState)

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Śr. nastrój',  value: avgMood.toFixed(1),     sub: '/ 5' },
          { label: 'Śr. energia',  value: avgEnergy.toFixed(1),   sub: '/ 5' },
          { label: 'Check-iny',    value: totalCheckIns.toString(), sub: 'łącznie' },
        ].map(s => (
          <div key={s.label} className="bg-ivory border border-gold-light/40 p-4 text-center">
            <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-2">
              {s.label}
            </SmallCaps>
            <p className="font-display text-dark text-3xl leading-none">{s.value}</p>
            <p className="font-serif-body italic text-muted-light text-[11px] mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Dominant state */}
      {dominantMeta && (
        <div className="bg-ivory border border-gold-light/40 p-5 flex items-center gap-5">
          <span className="text-4xl">{dominantMeta.emoji}</span>
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
              Dominujący stan
            </SmallCaps>
            <h3 className="font-heading text-dark text-lg mt-1">{dominantMeta.label}</h3>
            <p className="font-serif-body italic text-muted text-[13px] mt-0.5">
              {stateCounts[dominantState]} z {totalCheckIns} ·{' '}
              {Math.round(stateCounts[dominantState] / totalCheckIns * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Weekly trend */}
      {weeklyData.length >= 2 && (
        <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Trend tygodniowy
          </SmallCaps>
          <h2 className="font-heading text-dark text-lg mt-1">Nastrój i energia</h2>
          <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
            średnia per tydzień.
          </p>
          <div className="space-y-3">
            {weeklyData.map(w => (
              <div key={w.weekKey} className="flex items-center gap-3">
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-8 shrink-0">
                  {w.label}
                </SmallCaps>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <SmallCaps tone="muted" size="xs" className="w-12">nastrój</SmallCaps>
                    <div className="flex-1 h-px bg-hairline relative">
                      <div className="absolute left-0 top-0 h-px bg-forest transition-all duration-500" style={{ width: `${(w.avgMood / 5) * 100}%` }} />
                    </div>
                    <span className="font-ui text-[11px] text-muted w-7 text-right tabular-nums">{w.avgMood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SmallCaps tone="muted" size="xs" className="w-12">energia</SmallCaps>
                    <div className="flex-1 h-px bg-hairline relative">
                      <div className="absolute left-0 top-0 h-px bg-gold transition-all duration-500" style={{ width: `${(w.avgEnergy / 5) * 100}%` }} />
                    </div>
                    <span className="font-ui text-[11px] text-muted w-7 text-right tabular-nums">{w.avgEnergy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-5 pt-3 border-t border-hairline">
            <div className="flex items-center gap-1.5">
              <Diamond size={4} className="text-forest" filled />
              <SmallCaps tone="muted" tracking="luxury" size="xs">nastrój</SmallCaps>
            </div>
            <div className="flex items-center gap-1.5">
              <Diamond size={4} className="text-gold" filled />
              <SmallCaps tone="muted" tracking="luxury" size="xs">energia</SmallCaps>
            </div>
          </div>
        </section>
      )}

      {/* Day-of-week */}
      {daysWithData.length >= 3 && (
        <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
            Wzorce tygodniowe
          </SmallCaps>
          <h2 className="font-heading text-dark text-lg mt-1">Nastrój po dniach</h2>
          <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
            średni nastrój według dnia tygodnia.
          </p>
          <div className="space-y-3">
            {dayData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="w-8 shrink-0">
                  {d.label}
                </SmallCaps>
                {d.avgMood !== null ? (
                  <>
                    <div className="flex-1 h-px bg-hairline relative">
                      <div
                        className="absolute left-0 top-0 h-px bg-forest transition-all duration-500"
                        style={{ width: `${(d.avgMood / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-ui text-[11px] text-muted w-8 text-right tabular-nums">
                      {d.avgMood.toFixed(1)}
                    </span>
                    <SmallCaps tone="muted" size="xs" className="w-10 text-right shrink-0">
                      {d.count}×
                    </SmallCaps>
                  </>
                ) : (
                  <div className="flex-1 h-px bg-hairline/50" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* State distribution */}
      <section className="bg-ivory border border-gold-light/40 p-5 sm:p-6">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
          Rozkład stanów
        </SmallCaps>
        <h2 className="font-heading text-dark text-lg mt-1">Co czujesz najczęściej</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5">
          jak często pojawia się każdy ze stanów.
        </p>
        <div className="space-y-3">
          {MOOD_STATES.map(({ value, emoji, label }) => {
            const count = stateCounts[value]
            const pct = totalCheckIns > 0 ? Math.round((count / totalCheckIns) * 100) : 0
            return (
              <div key={value}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    <SmallCaps tracking="luxury" size="xs">
                      <span style={{ color: moodStateColor(value) }}>{label}</span>
                    </SmallCaps>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      {count}×
                    </SmallCaps>
                    <span className="font-ui text-[11px] tabular-nums w-10 text-right" style={{ color: moodStateColor(value) }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="relative h-px w-full bg-hairline">
                  <div
                    className="absolute left-0 top-0 h-px transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: moodStateColor(value) }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Insight */}
      {bestDay && worstDay && bestDay.label !== worstDay.label && (
        <div className="relative bg-forest-deep grain-linen text-ivory p-6">
          <CornerBrackets size={14} tone="gold" weight={1} />
          <div className="relative z-10">
            <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-3">
              Twój wzorzec
            </SmallCaps>
            <p className="font-serif-body italic text-ivory text-[14.5px] leading-relaxed">
              najlepszy nastrój w{' '}
              <span className="text-gold-light not-italic font-heading">{bestDay.labelFull.toLowerCase()}</span>{' '}
              ({bestDay.avgMood!.toFixed(1)}/5).
              <br />
              najtrudniejszy w{' '}
              <span className="text-parchment not-italic font-heading">{worstDay.labelFull.toLowerCase()}</span>{' '}
              ({worstDay.avgMood!.toFixed(1)}/5).
            </p>
            {worstDay.avgMood! < 3 && (
              <p className="font-serif-body italic text-parchment/80 text-[13px] mt-3 leading-relaxed">
                zaplanuj coś dobrego na {worstDay.labelFull.toLowerCase()} — quest, ruch, kontakt z kimś bliskim.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
