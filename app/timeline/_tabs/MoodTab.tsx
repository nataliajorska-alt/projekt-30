'use client'
import { useState, type ReactNode, type MouseEvent } from 'react'
import { MOOD_STATES, type DailyLog, type MoodCheckIn, type MoodState } from '@/types'
import { SmallCaps, Fleuron, CornerBrackets } from '@/components/ui'

const PL_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const PL_DAYS_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
// Locative phrasing ("w …") so the insight band reads grammatically in Polish.
const PL_DAYS_LOC = ['w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę', 'w niedzielę']

// State palette — 1:1 with the design tokens (--st-calm/fog/storm/clear).
const STATE_COLOR: Record<MoodState, string> = {
  calm:    '#4a665d',
  fog:     '#9a8a64',
  storm:   '#8a3a2c',
  clarity: '#b29355',
}

// Engraved line glyphs (replace emoji), keyed by state — straight from the design.
const STATE_GLYPH: Record<MoodState, ReactNode> = {
  calm: <><path d="M2 10c3-3 6-3 9 0s6 3 9 0" /><path d="M2 15c3-3 6-3 9 0s6 3 9 0" /></>,
  fog: <path d="M3 7h18M5 11h14M3 15h18M6 19h12" />,
  storm: <><path d="M7 14a3.5 3.5 0 0 1 .4-7 4.6 4.6 0 0 1 8.8 1.2A3 3 0 0 1 16 14" /><path d="M12.5 13l-2 4h2.5l-1.5 4" /></>,
  clarity: <><circle cx="12" cy="12" r="3.8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" /></>,
}

function MoodGlyph({ state, size = 16 }: { state: MoodState; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} width={size} height={size}>
      {STATE_GLYPH[state]}
    </svg>
  )
}

function avgOrNull(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

interface MoodTabProps {
  logs: Record<string, DailyLog>
}

export default function MoodTab({ logs }: MoodTabProps) {
  const [tip, setTip] = useState<{ x: number; y: number; d: string; v: string } | null>(null)

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
    for (const ci of log.moodCheckIns) allCheckIns.push({ ...ci, dateKey, weekday, weekKey })
  }

  const totalCheckIns = allCheckIns.length

  if (totalCheckIns === 0) {
    return (
      <div className="relative bg-ivory border border-gold-light/40 p-12 text-center">
        <CornerBrackets size={10} tone="gold-light" />
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
  const dominantMeta = MOOD_STATES.find(s => s.value === dominantState)
  const dominantPct = Math.round((stateCounts[dominantState] / totalCheckIns) * 100)

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

  const byDay: Record<number, number[]> = {}
  for (let i = 0; i < 7; i++) byDay[i] = []
  for (const ci of allCheckIns) byDay[ci.weekday].push(ci.mood)
  const dayData = Array.from({ length: 7 }, (_, i) => ({
    idx: i,
    label: PL_DAYS[i],
    labelFull: PL_DAYS_FULL[i],
    avgMood: avgOrNull(byDay[i]),
    count: byDay[i].length,
  }))
  const maxDayMood = Math.max(5, ...dayData.map(d => d.avgMood ?? 0))

  const daysWithData = dayData.filter(d => d.avgMood !== null)
  const bestDay = [...daysWithData].sort((a, b) => b.avgMood! - a.avgMood!)[0]
  const worstDay = [...daysWithData].sort((a, b) => a.avgMood! - b.avgMood!)[0]
  const hasBestWorst = bestDay && worstDay && bestDay.label !== worstDay.label

  // State distribution, sorted by frequency (emotional weather, most frequent first).
  const stateRows = (Object.entries(stateCounts) as [MoodState, number][])
    .map(([value, count]) => ({
      value,
      count,
      meta: MOOD_STATES.find(s => s.value === value),
      pct: Math.round((count / totalCheckIns) * 100),
    }))
    .sort((a, b) => b.count - a.count)
  const maxStateCount = Math.max(1, ...stateRows.map(s => s.count))

  return (
    <div className="space-y-7">
      {/* ===== Summary stat cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Śr. nastrój', value: avgMood.toFixed(1), unit: '/ 5', note: 'w skali pięciostopniowej' },
          { label: 'Śr. energia', value: avgEnergy.toFixed(1), unit: '/ 5', note: avgEnergy >= avgMood ? 'odrobinę wyżej niż nastrój' : 'odrobinę niżej niż nastrój' },
          { label: 'Check-iny', value: totalCheckIns.toString(), unit: undefined, note: 'zapisów emocjonalnych łącznie' },
        ].map(s => (
          <section key={s.label} className="relative bg-ivory border border-gold-light/40 p-5 text-center">
            <CornerBrackets size={9} tone="gold-light" />
            <div className="font-ui uppercase text-[8px] tracking-[0.3em] text-gold-deep">{s.label}</div>
            <div className="font-display text-dark text-[26px] leading-none tracking-tight mt-3">
              {s.value}
              {s.unit && <em className="font-serif-body italic font-normal text-[13px] text-muted-light"> {s.unit}</em>}
            </div>
            <div className="font-serif-body italic text-[12px] text-muted-light mt-2">{s.note}</div>
          </section>
        ))}
      </div>

      {/* ===== Dominant state ===== */}
      {dominantMeta && (
        <Panel eyebrow="Dominujący stan">
          <div className="flex items-center gap-6 mt-4">
            <div
              className="relative shrink-0 w-[54px] h-[54px] border flex items-center justify-center"
              style={{ borderColor: STATE_COLOR[dominantState], color: STATE_COLOR[dominantState] }}
            >
              <MoodGlyph state={dominantState} size={26} />
            </div>
            <div className="flex-1">
              <div className="font-display text-dark text-[19px] leading-none tracking-tight">{dominantMeta.label}</div>
              <p className="font-serif-body italic text-muted text-[13px] mt-2">
                najczęstszy stan w projekcie —{' '}
                <b className="font-display not-italic" style={{ color: STATE_COLOR[dominantState] }}>{stateCounts[dominantState]}</b>{' '}
                z {totalCheckIns} check-inów.
              </p>
            </div>
            <div className="w-[150px] shrink-0">
              <div className="relative h-[5px]" style={{ backgroundColor: '#e9e0c8' }}>
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-700"
                  style={{ width: `${dominantPct}%`, backgroundColor: STATE_COLOR[dominantState] }}
                />
              </div>
              <div className="font-display text-[16px] text-right mt-2 tracking-tight" style={{ color: STATE_COLOR[dominantState] }}>
                {dominantPct}<span className="text-[14px]">%</span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* ===== Weekly dual-line trend ===== */}
      {weeklyData.length >= 2 && (
        <Panel eyebrow="Trend tygodniowy" title="Nastrój i energia" note="średnia z każdego tygodnia, w skali 1–5.">
          <TrendChart data={weeklyData} onTip={setTip} />
          <div className="flex flex-wrap gap-7 mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-2 font-ui uppercase text-[10px] tracking-[0.26em] text-muted">
              <span className="w-[18px] h-[2px]" style={{ backgroundColor: '#8e7338' }} /> Nastrój
              <b className="font-display italic text-[13px] text-dark tracking-normal ml-0.5">śr. {avgMood.toFixed(1)}</b>
            </div>
            <div className="flex items-center gap-2 font-ui uppercase text-[10px] tracking-[0.26em] text-muted">
              <span className="w-[18px] border-t-2 border-dashed" style={{ borderColor: '#4a665d' }} /> Energia
              <b className="font-display italic text-[13px] text-dark tracking-normal ml-0.5">śr. {avgEnergy.toFixed(1)}</b>
            </div>
          </div>
        </Panel>
      )}

      {/* ===== Day-of-week ===== */}
      {daysWithData.length >= 3 && (
        <Panel eyebrow="Wzorce tygodniowe" title="Nastrój po dniach"
          note="średni nastrój według dnia tygodnia. wyróżniony najlepszy i najtrudniejszy.">
          <div className="mt-6">
            {dayData.map(d => {
              const isBest = hasBestWorst && d.label === bestDay.label
              const isWorst = hasBestWorst && d.label === worstDay.label
              const fillColor = isBest ? '#b29355' : isWorst ? '#8a3a2c' : '#b7a787'
              const wkColor = isBest ? 'text-gold-deep' : isWorst ? 'text-wine' : 'text-muted-light'
              return (
                <div
                  key={d.idx}
                  className="grid items-center gap-5 py-2.5 border-t border-border first:border-t-0"
                  style={{ gridTemplateColumns: '52px 1fr 52px 50px' }}
                >
                  <span className={`font-ui uppercase text-[10px] tracking-[0.22em] ${wkColor}`}>{d.label}</span>
                  <div className="relative h-[10px]" style={{ backgroundColor: '#e9e0c8' }}>
                    {d.avgMood !== null && (
                      <div
                        className="absolute left-0 top-0 h-full transition-all duration-700"
                        style={{ width: `${(d.avgMood / maxDayMood) * 100}%`, backgroundColor: fillColor, opacity: isWorst ? 0.8 : 1 }}
                      />
                    )}
                  </div>
                  <span className="font-display text-[17px] text-dark text-right tracking-tight">
                    {d.avgMood !== null ? d.avgMood.toFixed(1) : '—'}
                  </span>
                  <span className="font-ui text-[9px] tracking-[0.14em] text-muted-light text-right">{d.count}×</span>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {/* ===== State distribution ===== */}
      <Panel eyebrow="Rozkład stanów" title="Co czujesz najczęściej"
        note="jak często pojawia się każdy ze stanów — emocjonalna pogoda projektu.">
        <div className="mt-6">
          {stateRows.map(s => (
            <div key={s.value} className="py-4 border-t border-border first:border-t-0" style={{ color: STATE_COLOR[s.value] }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3.5">
                  <span className="w-[30px] h-[30px] border flex items-center justify-center shrink-0" style={{ borderColor: STATE_COLOR[s.value] }}>
                    <MoodGlyph state={s.value} size={16} />
                  </span>
                  <span className="font-ui uppercase text-[11px] tracking-[0.3em] text-dark">{s.meta?.label ?? s.value}</span>
                </div>
                <div className="flex items-baseline gap-[18px]">
                  <span className="font-ui text-[9px] tracking-[0.16em] text-muted-light">{s.count}×</span>
                  <span className="font-display text-[18px] tracking-tight min-w-[52px] text-right">{s.pct}%</span>
                </div>
              </div>
              <div className="relative h-[8px]" style={{ backgroundColor: '#e9e0c8' }}>
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-700"
                  style={{ width: `${(s.count / maxStateCount) * 100}%`, backgroundColor: STATE_COLOR[s.value] }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ===== Pattern insight band ===== */}
      {hasBestWorst && (
        <section className="relative bg-dark text-gold-pale px-8 sm:px-11 py-8 overflow-hidden">
          <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />
          <span aria-hidden className="absolute bottom-3 right-3 w-[10px] h-[10px] border-b border-r border-gold" />
          <div className="font-ui uppercase text-[9px] tracking-[0.4em] text-gold-light mb-4">Twój wzorzec</div>
          <div className="flex flex-col gap-2">
            <p className="font-serif-body italic text-[19px] leading-snug" style={{ color: '#dcd3b5' }}>
              najlepszy nastrój masz {PL_DAYS_LOC[bestDay.idx]}{' '}
              <span className="font-display italic text-[15px] not-italic" style={{ color: '#c9b27f' }}>{bestDay.avgMood!.toFixed(1)} / 5</span>
            </p>
            <p className="font-serif-body italic text-[19px] leading-snug" style={{ color: '#dcd3b5' }}>
              najtrudniej bywa {PL_DAYS_LOC[worstDay.idx]}{' '}
              <span className="font-display italic text-[15px] not-italic" style={{ color: '#c9b27f' }}>{worstDay.avgMood!.toFixed(1)} / 5</span>
            </p>
          </div>
          <div className="h-px my-5" style={{ background: 'linear-gradient(90deg, rgba(201,178,127,.4), transparent)' }} />
          <p className="font-serif-body italic text-[16px] leading-relaxed" style={{ color: '#c9b27f' }}>
            zaplanuj coś dobrego na <em style={{ color: '#f3e9c8' }}>{worstDay.labelFull.toLowerCase()}</em> — mały quest, ruch albo kontakt z kimś bliskim.
          </p>
        </section>
      )}

      {/* Floating tooltip (trend dots) */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none bg-dark border border-gold px-3 py-2"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 12px))' }}
        >
          <div className="font-serif-body italic text-[13px] text-gold-pale whitespace-nowrap">{tip.d}</div>
          <div className="font-display text-[14px] text-gold-light mt-0.5">{tip.v}</div>
        </div>
      )}
    </div>
  )
}

/* ---- weekly dual-line SVG trend chart ---- */
function TrendChart({
  data,
  onTip,
}: {
  data: { label: string; avgMood: number; avgEnergy: number }[]
  onTip: (t: { x: number; y: number; d: string; v: string } | null) => void
}) {
  const W = 940, H = 320, padL = 46, padR = 28, padT = 24, padB = 48
  const plotW = W - padL - padR, plotH = H - padT - padB
  const n = data.length
  const X = (i: number) => padL + (n === 1 ? 0 : i / (n - 1)) * plotW
  const Y = (v: number) => padT + ((5 - v) / 4) * plotH

  const moodPts = data.map((d, i) => `${X(i)},${Y(d.avgMood)}`).join(' ')
  const energyPts = data.map((d, i) => `${X(i)},${Y(d.avgEnergy)}`).join(' ')
  const areaPts = `${moodPts} ${X(n - 1)},${Y(1)} ${X(0)},${Y(1)}`

  let hi = 0, lo = 0
  data.forEach((d, i) => {
    if (d.avgMood > data[hi].avgMood) hi = i
    if (d.avgMood < data[lo].avgMood) lo = i
  })

  const move = (e: MouseEvent, d: string, v: string) =>
    onTip({ x: e.clientX, y: e.clientY, d, v })

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full block overflow-visible">
        {[1, 2, 3, 4, 5].map(g => (
          <g key={g}>
            <line x1={padL} y1={Y(g)} x2={W - padR} y2={Y(g)} stroke={g === 1 ? '#d9cda8' : '#e5dcc1'} strokeWidth={1} />
            <text x={padL - 12} y={Y(g) + 3.5} textAnchor="end" fontFamily="Inter, sans-serif" fontSize={10} fill="#b7a787">{g}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={X(i)} y={H - 22} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={10} fill="#b7a787" letterSpacing="0.14em">{d.label}</text>
        ))}

        <polygon points={areaPts} fill="#b29355" opacity={0.07} />
        <polyline points={energyPts} fill="none" stroke="#4a665d" strokeWidth={1.6} strokeDasharray="4 4" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={moodPts} fill="none" stroke="#8e7338" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={X(i)} cy={Y(d.avgEnergy)} r={3} fill="#4a665d" className="cursor-pointer"
              onMouseEnter={e => move(e, `${d.label} · energia`, `${d.avgEnergy.toFixed(1)} / 5`)}
              onMouseMove={e => move(e, `${d.label} · energia`, `${d.avgEnergy.toFixed(1)} / 5`)}
              onMouseLeave={() => onTip(null)}
            />
            <circle
              cx={X(i)} cy={Y(d.avgMood)} r={4} fill="#f8f3e6" stroke="#8e7338" strokeWidth={2} className="cursor-pointer"
              onMouseEnter={e => move(e, `${d.label} · nastrój`, `${d.avgMood.toFixed(1)} / 5`)}
              onMouseMove={e => move(e, `${d.label} · nastrój`, `${d.avgMood.toFixed(1)} / 5`)}
              onMouseLeave={() => onTip(null)}
            />
          </g>
        ))}

        <text x={X(hi)} y={Y(data[hi].avgMood) - 13} textAnchor="middle" fontFamily="'Bodoni Moda', serif" fontStyle="italic" fontSize={13} fill="#8e7338">
          {data[hi].avgMood.toFixed(1)}
        </text>
        {lo !== hi && (
          <text x={X(lo) - 6} y={Y(data[lo].avgMood) + 6} textAnchor="end" fontFamily="'Bodoni Moda', serif" fontStyle="italic" fontSize={13} fill="#8a3a2c">
            {data[lo].avgMood.toFixed(1)}
          </text>
        )}
      </svg>
    </div>
  )
}

/* ---- shared panel ---- */
function Panel({ eyebrow, title, note, children }: {
  eyebrow: string; title?: string; note?: string; children: ReactNode
}) {
  return (
    <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
      <CornerBrackets size={10} tone="gold-light" />
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">{eyebrow}</SmallCaps>
      {title && <h2 className="font-heading text-dark text-lg mt-1">{title}</h2>}
      {note && <p className="font-serif-body italic text-muted text-[13px] mt-1">{note}</p>}
      {children}
    </section>
  )
}
