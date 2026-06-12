'use client'
// Zakładka „Oddech" — papierosy jako dane, nie wyrok (PLAN_PALENIE.md).
// Ton: zero czerwieni, zero języka porażki. Redesign wg makiety Claude Design
// (jasny system Historii + pasek faz + wykres trendu) — logika faz bez zmian.
import { useState } from 'react'
import clsx from 'clsx'
import type { DailyLog, SmokingPhase, CigaretteContext } from '@/types'
import { SMOKING_PHASE_META } from '@/types'
import { CIGARETTE_CONTEXTS, PHASE_GENTLE_HINT } from '@/lib/smoke-data'
import {
  dailyCigaretteCounts, collectEntries, computeBaseline,
  phase2TargetRange, rollingAverage, weeklyAverages,
  shiftDateKey, MIN_DAYS_FOR_BASELINE,
} from '@/lib/smokeStats'
import { todayKey } from '@/lib/gameLogic'
import { useGameData } from '@/hooks/useGameData'
import { useToast } from '@/components/ToastProvider'
import { SmallCaps, Diamond, Fleuron, CornerBrackets } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const PL_DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const PL_DAYS_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

const TIME_SLOTS = [
  { label: 'Noc',      range: '0–6',   hours: [0,1,2,3,4,5] },
  { label: 'Rano',     range: '7–11',  hours: [6,7,8,9,10,11] },
  { label: 'Południe', range: '12–16', hours: [12,13,14,15,16] },
  { label: 'Wieczór',  range: '17–20', hours: [17,18,19,20] },
  { label: 'Późny w.', range: '21–23', hours: [21,22,23] },
]

const MIN_FOR_HEATMAP = 10
const HEAT = ['#E9E0C8', '#D6BD84', '#BD9C56', '#94793B', '#5A4B22']

// liniowe ikony kontekstów (styl mocka). Partial — fallback dla nieobsłużonych.
const CTX_FALLBACK = (<><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></>)
const CONTEXT_ICON: Partial<Record<CigaretteContext, React.ReactNode>> = {
  quest:          <><rect x="4" y="4" width="16" height="16"/><polyline points="8.5 12.5 11 15 16 9.5"/></>,
  stres:          <><path d="M7 16a4 4 0 1 1 .6-7.96A5.5 5.5 0 0 1 18 9.5 3.5 3.5 0 0 1 17.5 16z"/><line x1="9" y1="19.5" x2="8" y2="21.5"/><line x1="13" y1="19.5" x2="12" y2="21.5"/><line x1="17" y1="19.5" x2="16" y2="21.5"/></>,
  posilek:        <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/></>,
  samochod:       <><path d="M4 16v-3.5L6 7h12l2 5.5V16"/><path d="M4 16h16"/><circle cx="7.5" cy="16.5" r="1.6"/><circle cx="16.5" cy="16.5" r="1.6"/></>,
  wieczor_z_kims: <path d="M20 13.2A8 8 0 1 1 10.8 4 6.3 6.3 0 0 0 20 13.2z"/>,
  kawa:           <><path d="M5 18v-7a7 7 0 0 1 14 0v7"/><path d="M3.5 18h17"/><line x1="12" y1="4" x2="12" y2="5.5"/></>,
  nuda:           <path d="M4 12a8 8 0 1 1 8 8"/>,
  impreza:        <><path d="M7 4h10l-4 8v6"/><path d="M9.5 18h5"/></>,
  inne:           CTX_FALLBACK,
}

interface OddechTabProps {
  logs: Record<string, DailyLog>
  loading: boolean
}

function formatDayMonth(dateKey: string): string {
  const [, m, d] = dateKey.split('-').map(Number)
  return `${d}.${String(m).padStart(2, '0')}`
}

function comma(v: number | null | undefined): string {
  if (v == null) return '—'
  return String(v).replace('.', ',')
}

// ── Prymitywy ────────────────────────────────────────────────────

function Panel({ eyebrow, title, note, children }: {
  eyebrow: string; title: string; note?: React.ReactNode; children?: React.ReactNode
}) {
  return (
    <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
      <CornerBrackets size={10} tone="gold-light" />
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">{eyebrow}</SmallCaps>
      <h2 className="font-heading text-dark text-lg mt-1">{title}</h2>
      {note && <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">{note}</p>}
      {children}
    </section>
  )
}

function MetricCell({ idx, hero, heroSuffix, heroText, eyebrow, note, feature }: {
  idx: string; hero?: string; heroSuffix?: string; heroText?: string; eyebrow: string; note: string; feature?: boolean
}) {
  return (
    <div className={clsx('p-5 flex flex-col', feature ? 'bg-forest-deep' : 'bg-ivory')}>
      <div className="flex items-center gap-2 h-3">
        <span className={clsx('font-display italic font-medium text-[12px]', feature ? 'text-gold' : 'text-gold-deep')}>{idx}</span>
        <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${feature ? 'rgba(178,147,85,.55)' : 'rgba(201,178,127,1)'} 0%, transparent 90%)` }} />
      </div>
      {heroText ? (
        <div className={clsx('font-display italic font-medium text-[19px] leading-tight tracking-tight mt-3', feature ? 'text-gold-pale' : 'text-dark')}>{heroText}</div>
      ) : (
        <div className={clsx('font-display font-medium text-[32px] leading-[0.9] tracking-tight mt-3 tabular-nums', feature ? 'text-gold-pale' : 'text-dark')}>
          {hero}
          {heroSuffix && <em className={clsx('font-serif-body not-italic text-[14px] ml-1', feature ? 'text-gold-light' : 'text-muted-light')}>{heroSuffix}</em>}
        </div>
      )}
      <div className="mt-3 flex flex-col gap-1">
        <SmallCaps tone={feature ? 'gold-light' : 'gold-deep'} tracking="luxury" size="xs" as="div" className="whitespace-nowrap">{eyebrow}</SmallCaps>
        <span className={clsx('font-serif-body italic text-[13px]', feature ? 'text-parchment' : 'text-muted')}>{note}</span>
      </div>
    </div>
  )
}

// ── Wykres trendu tygodniowego (SVG) ─────────────────────────────

function OddechTrendChart({ weeks, baseline, target }: {
  weeks: { weekStart: string; avg: number }[]
  baseline: number | null
  target: { lo: number; hi: number } | null
}) {
  const W = 940, H = 330, padL = 50, padR = 30, padT = 30, padB = 46
  const plotW = W - padL - padR, plotH = H - padT - padB, n = weeks.length

  const vals = [
    ...weeks.map(w => w.avg),
    ...(baseline != null ? [baseline] : []),
    ...(target ? [target.lo, target.hi] : []),
  ]
  let dmin = Math.floor(Math.min(...vals) - 0.5)
  let dmax = Math.ceil(Math.max(...vals) + 0.5)
  if (dmax - dmin < 2) dmax = dmin + 2
  const step = Math.max(1, Math.ceil((dmax - dmin) / 5))
  const ticks: number[] = []
  for (let g = dmin; g <= dmax; g += step) ticks.push(g)

  const X = (i: number) => padL + (n === 1 ? 0 : (i / (n - 1)) * plotW)
  const Y = (v: number) => padT + ((dmax - v) / (dmax - dmin)) * plotH

  const linePts = weeks.map((w, i) => `${X(i)},${Y(w.avg)}`).join(' ')
  const areaPts = `${linePts} ${X(n - 1)},${Y(dmin)} ${X(0)},${Y(dmin)}`

  return (
    <div className="mt-6 w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full block" style={{ minWidth: 300 }}>
        {/* strefa celu */}
        {target && (
          <>
            <rect x={padL} y={Y(target.hi)} width={plotW} height={Y(target.lo) - Y(target.hi)} fill="#6B7D59" opacity={0.1} />
            <text x={padL + 6} y={Y(target.lo) - 8} fontSize={10} letterSpacing="0.16em" fill="#4F5F42" fontFamily="Inter, sans-serif">
              CEL FAZY II · {target.lo}–{target.hi}
            </text>
          </>
        )}
        {/* siatka + oś Y */}
        {ticks.map(g => (
          <g key={g}>
            <line x1={padL} y1={Y(g)} x2={W - padR} y2={Y(g)} stroke={g === dmin ? '#D9CDA8' : '#E5DCC1'} strokeWidth={1} />
            <text x={padL - 12} y={Y(g) + 3.5} textAnchor="end" fontSize={10} fill="#B7A787" fontFamily="Inter, sans-serif">{g}</text>
          </g>
        ))}
        {/* etykiety osi X */}
        {weeks.map((w, i) => (
          <text key={w.weekStart} x={X(i)} y={H - 20} textAnchor="middle" fontSize={10} fill="#B7A787" fontFamily="Inter, sans-serif">
            {formatDayMonth(w.weekStart)}
          </text>
        ))}
        {/* linia bazy */}
        {baseline != null && (
          <>
            <line x1={padL} y1={Y(baseline)} x2={W - padR} y2={Y(baseline)} stroke="#B29355" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.8} />
            <text x={W - padR} y={Y(baseline) - 8} textAnchor="end" fontSize={13} fontStyle="italic" fill="#8E7338" fontFamily="'Bodoni Moda', serif">
              baza {comma(baseline)}
            </text>
          </>
        )}
        {/* obszar + linia */}
        <polygon points={areaPts} fill="#B29355" opacity={0.07} />
        <polyline points={linePts} fill="none" stroke="#8E7338" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {/* punkty + wartości */}
        {weeks.map((w, i) => {
          const cur = i === n - 1
          return (
            <g key={w.weekStart}>
              <circle cx={X(i)} cy={Y(w.avg)} r={cur ? 5 : 4} fill={cur ? '#8E7338' : '#FAF8F4'} stroke="#8E7338" strokeWidth={2}>
                <title>{`tydzień ${formatDayMonth(w.weekStart)}: ${comma(w.avg)} / dzień`}</title>
              </circle>
              <text x={X(i)} y={Y(w.avg) - 14} textAnchor={i === 0 ? 'start' : cur ? 'end' : 'middle'} fontSize={13} fontStyle="italic" fill="#8E7338" fontFamily="'Bodoni Moda', serif">
                {comma(w.avg)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Komponent ────────────────────────────────────────────────────

export default function OddechTab({ logs, loading }: OddechTabProps) {
  const { stats, startSmokingPhase } = useGameData()
  const { addToast } = useToast()
  const [confirmingPhase, setConfirmingPhase] = useState<SmokingPhase | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="relative bg-ivory border border-gold-light/40 p-12 text-center">
        <CornerBrackets size={10} tone="gold-light" />
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block animate-pulse" />
        <SmallCaps tone="muted" tracking="luxury" size="xs">Wczytuję dane</SmallCaps>
      </div>
    )
  }

  const phase: SmokingPhase = stats.cigarettesPhase ?? 1
  const phaseMeta = SMOKING_PHASE_META[phase]
  const yesterday = shiftDateKey(todayKey(), -1)

  const baselineCounts = dailyCigaretteCounts(logs, yesterday)
  const allCounts = dailyCigaretteCounts(logs)
  const entries = collectEntries(logs)
  const baselineReport = computeBaseline(baselineCounts)
  const rolling7 = rollingAverage(allCounts, yesterday, 7)
  const weeks = weeklyAverages(allCounts)

  if (allCounts.length === 0) {
    return (
      <div className="relative bg-forest-deep grain-linen text-ivory border border-gold-light/30 p-10 text-center">
        <CornerBrackets size={16} tone="gold" weight={1} />
        <Fleuron size={20} className="text-gold mx-auto mb-5 inline-block" />
        <h3 className="font-display text-ivory text-2xl">Spokojny licznik</h3>
        <p className="font-serif-body italic text-parchment text-[14px] mt-3 leading-relaxed">
          każdy zalogowany papieros trafia tutaj.
          <br />
          to są dane, nie ocena — wzorce pojawią się same.
        </p>
      </div>
    )
  }

  const total = entries.length
  const withContext = entries.filter(e => e.context).length

  const ctxCounts: Record<string, number> = {}
  for (const e of entries) {
    const key = e.context ?? '__none'
    ctxCounts[key] = (ctxCounts[key] ?? 0) + 1
  }
  const noContextCount = ctxCounts['__none'] ?? 0
  const contextRows = CIGARETTE_CONTEXTS
    .map(c => ({ id: c.id as CigaretteContext, label: c.label, count: ctxCounts[c.id] ?? 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const topCtx = contextRows[0] ?? null
  const maxCtx = Math.max(1, ...contextRows.map(c => c.count))
  const cheapest = contextRows.length > 1 ? contextRows[contextRows.length - 1] : null

  const grid: number[][] = Array.from({ length: TIME_SLOTS.length }, () => Array(7).fill(0))
  for (const e of entries) {
    const slotIdx = TIME_SLOTS.findIndex(s => s.hours.includes(e.hour))
    if (slotIdx >= 0 && e.weekday >= 0 && e.weekday <= 6) grid[slotIdx][e.weekday]++
  }
  const maxCell = Math.max(1, ...grid.flat())
  const heatLevel = (count: number) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCell) * 4)))
  let peakSlot = 0, peakDay = 0
  for (let s = 0; s < TIME_SLOTS.length; s++)
    for (let d = 0; d < 7; d++)
      if (grid[s][d] > grid[peakSlot][peakDay]) { peakSlot = s; peakDay = d }
  const hasPeak = grid[peakSlot][peakDay] > 0

  const baselineVal = stats.cigarettesBaseline ?? baselineReport?.avgPerDay ?? null
  const targetRange = baselineVal != null ? phase2TargetRange(baselineVal) : null

  const handleStartPhase = async (next: SmokingPhase, baseline?: number) => {
    setSaving(true)
    try {
      await startSmokingPhase(next, baseline)
      setConfirmingPhase(null)
      addToast({ message: `Faza ${toRoman(next)} rozpoczęta. Spokojnie, swoim tempem.`, type: 'success' })
    } finally {
      setSaving(false)
    }
  }

  const nextPhase = phase < 5 ? ((phase + 1) as SmokingPhase) : null

  return (
    <div className="space-y-5">
      {/* Pasek faz — inked */}
      <section className="relative bg-forest-deep grain-linen text-ivory p-6 sm:p-8 overflow-hidden">
        <CornerBrackets size={11} tone="gold" weight={1} />
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">Plan w pięciu fazach</SmallCaps>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-70">{phaseMeta.period}</SmallCaps>
        </div>
        <h2 className="font-display text-gold-pale text-[23px] leading-tight tracking-tight mt-3">
          Faza {toRoman(phase)} — {phaseMeta.label}
        </h2>
        <p className="font-serif-body italic text-parchment text-[14px] mt-2 leading-relaxed">{PHASE_GENTLE_HINT[phase]}</p>

        {/* Rail I–V */}
        <div className="grid grid-cols-5 mt-7 pt-5 border-t border-gold-light/20">
          {([1, 2, 3, 4, 5] as SmokingPhase[]).map(p => {
            const on = p === phase
            const named = p === phase + 1
            return (
              <div key={p} className="relative text-center">
                <span
                  className={clsx('block mx-auto w-[9px] h-[9px] rotate-45 relative z-10', on ? 'bg-gold' : 'bg-forest-deep')}
                  style={{ border: on ? '1px solid #B29355' : '1px solid rgba(201,178,127,.55)', boxShadow: on ? '0 0 0 4px #1E2A25, 0 0 0 5px rgba(178,147,85,.45)' : undefined }}
                />
                <span className={clsx('block mt-3 font-display italic font-medium text-[12px]', on || named ? 'text-gold-light' : 'text-gold-light/50')}>{toRoman(p)}</span>
                {(on || named) && (
                  <>
                    <span className={clsx('block mt-1.5 font-ui uppercase text-[8px] tracking-[0.22em]', on ? 'text-gold-pale' : 'text-parchment')}>
                      {SMOKING_PHASE_META[p].label}
                    </span>
                    <span className="block mt-1 font-serif-body italic text-[11px] text-parchment/60">{SMOKING_PHASE_META[p].period}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {phase >= 2 && (
          <div className="mt-6 pt-5 border-t border-gold-light/20 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-ivory text-2xl leading-none tabular-nums">{comma(stats.cigarettesBaseline ?? null)}</p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">baza z fazy I</SmallCaps>
            </div>
            <div>
              <p className="font-display text-ivory text-2xl leading-none tabular-nums">{targetRange ? `${targetRange.lo}–${targetRange.hi}` : '—'}</p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">cel miękki / dzień</SmallCaps>
            </div>
            <div>
              <p className="font-display text-gold-pale text-2xl leading-none tabular-nums">{comma(rolling7)}</p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">średnia 7 dni</SmallCaps>
            </div>
          </div>
        )}
        {stats.cigarettesPhaseStartDate && (
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-4 block opacity-40">
            w tej fazie od {formatDayMonth(stats.cigarettesPhaseStartDate)}
          </SmallCaps>
        )}
      </section>

      {/* Kwartet metryk */}
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-gold-light/40">
        <CornerBrackets size={11} tone="gold-light" />
        <MetricCell feature idx="I" hero={comma(baselineReport?.avgPerDay ?? null)} heroSuffix="/ dzień" eyebrow="Średnia — baza" note="cały okres obserwacji" />
        <MetricCell idx="II" hero={comma(rolling7)} eyebrow="Średnia 7 dni" note="trend, nie pojedynczy dzień" />
        <MetricCell idx="III" hero={String(allCounts.length)} eyebrow="Dni z danymi" note={`od ${formatDayMonth(allCounts[0].date)}`} />
        {topCtx
          ? <MetricCell idx="IV" heroText={topCtx.label} eyebrow="Główny kontekst" note={`${withContext > 0 ? Math.round((topCtx.count / withContext) * 100) : 0}% zalogowanych`} />
          : <MetricCell idx="IV" hero="—" eyebrow="Główny kontekst" note="loguj z kontekstem" />}
      </div>

      {/* Raport bazowy — zamknięcie fazy I + przejście */}
      {phase === 1 && baselineReport && (
        baselineReport.daysWithData >= MIN_DAYS_FOR_BASELINE ? (
          <Panel
            eyebrow="Raport bazowy · Faza I"
            title="Zamknięcie fazy I"
            note={<>{toRoman(baselineReport.daysWithData)} dni obserwacji (do wczoraj), łącznie {baselineReport.total} zalogowanych — to twoja waluta. dane bazowe całego planu.</>}
          >
            <div className="mt-6 grid items-stretch border border-border bg-cream-warm" style={{ gridTemplateColumns: '1fr 56px 1fr' }}>
              <div className="p-6 text-center">
                <div className="font-display font-medium text-dark text-[36px] leading-[0.9] tracking-tight tabular-nums">{comma(baselineReport.avgPerDay)}</div>
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="mt-3 block">Średnia / dzień — baza</SmallCaps>
                <p className="font-serif-body italic text-muted text-[12px] mt-1.5">punkt odniesienia, nie wyrok</p>
              </div>
              <div className="flex items-center justify-center text-gold text-[17px]">→</div>
              <div className="p-6 text-center">
                <div className="font-display font-medium text-gold-deep text-[36px] leading-[0.9] tracking-tight tabular-nums">{targetRange ? `${targetRange.lo}–${targetRange.hi}` : '—'}</div>
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="mt-3 block">Cel miękki fazy II</SmallCaps>
                <p className="font-serif-body italic text-muted text-[12px] mt-1.5">−15–25% od bazy</p>
              </div>
            </div>

            <p className="font-serif-body italic text-muted text-[13.5px] mt-5 pt-4 border-t border-border leading-relaxed">
              faza II <b className="font-display not-italic font-medium text-gold-deep">(„{SMOKING_PHASE_META[2].label}", {SMOKING_PHASE_META[2].period})</b>:
              mikro-eliminacje pojedynczo, kontekst po kontekście. papieros zostaje w grze, ale przestaje być jedyną kartą.
            </p>

            {confirmingPhase === 2 ? (
              <div className="mt-6">
                <p className="font-serif-body italic text-dark text-[13.5px] mb-3">
                  zapisuję bazę {comma(baselineReport.avgPerDay)} / dzień i otwieram fazę II — na pewno?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleStartPhase(2, baselineReport.avgPerDay)} disabled={saving}
                    className="flex-1 py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-all disabled:opacity-50">
                    <SmallCaps tone="ivory" tracking="luxury" size="xs">{saving ? 'zapisuję…' : 'tak — rozpoczynam fazę II'}</SmallCaps>
                  </button>
                  <button onClick={() => setConfirmingPhase(null)} disabled={saving}
                    className="px-5 py-3 border border-hairline text-dark hover:border-gold transition-colors">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">jeszcze nie</SmallCaps>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <button onClick={() => setConfirmingPhase(2)}
                  className="inline-flex items-center gap-3.5 bg-dark-deep text-ivory border border-gold px-12 py-3.5 hover:bg-forest transition-all">
                  <Diamond size={5} className="text-gold" />
                  <SmallCaps tone="ivory" tracking="luxury" size="xs">Rozpoczynam fazę II</SmallCaps>
                  <Diamond size={5} className="text-gold" />
                </button>
                <p className="font-serif-body italic text-muted-light text-[12.5px] mt-3">planowy start: lipiec 2026 · decyzja należy do ciebie.</p>
              </div>
            )}
          </Panel>
        ) : (
          <div className="border border-hairline bg-cream/50 p-4 text-center">
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="opacity-80">
              raport bazowy od {toRoman(MIN_DAYS_FOR_BASELINE)} dni danych · teraz masz {toRoman(baselineReport.daysWithData)}
            </SmallCaps>
          </div>
        )
      )}

      {/* Trend tygodniowy — wykres */}
      {weeks.length >= 2 && (
        <Panel eyebrow="Trend tygodniowy" title="Średnia dzienna per tydzień" note="patrz na linię, nie na pojedyncze dni.">
          <OddechTrendChart weeks={weeks} baseline={baselineVal} target={targetRange} />
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-2.5">
              <span className="w-[18px] border-t-2 border-dashed" style={{ borderColor: '#B29355' }} />
              <SmallCaps tone="muted" tracking="luxury" size="xs">Baza <b className="font-display italic text-dark ml-1">{comma(baselineVal)}</b></SmallCaps>
            </div>
            {targetRange && (
              <div className="flex items-center gap-2.5">
                <span className="w-[18px] h-[11px]" style={{ background: '#6B7D59', opacity: 0.35 }} />
                <SmallCaps tone="muted" tracking="luxury" size="xs">Cel fazy II <b className="font-display italic text-dark ml-1">{targetRange.lo}–{targetRange.hi}</b></SmallCaps>
              </div>
            )}
          </div>
          <p className="font-ui uppercase text-[8px] tracking-[0.24em] text-muted-light mt-4 pt-4 border-t border-border">
            tydzień oznaczony datą poniedziałku · średnia po dniach z danymi
          </p>
        </Panel>
      )}

      {/* Mapa wzorca — heatmapa */}
      {total >= MIN_FOR_HEATMAP && (
        <Panel eyebrow="Mapa wzorca" title="Kiedy najczęściej" note="najmocniejsze pasy to twoje konteksty do mikro-eliminacji w fazie II–III.">
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[340px]">
              <div className="grid gap-y-1.5 gap-x-1.5" style={{ gridTemplateColumns: '78px repeat(7, 1fr)' }}>
                <span />
                {PL_DAYS_SHORT.map(d => (
                  <span key={d} className="font-ui uppercase text-[8px] tracking-[0.18em] text-muted-light text-center self-end pb-1">{d}</span>
                ))}
                {TIME_SLOTS.map((slot, si) => (
                  <div key={slot.label} className="contents">
                    <span className="font-ui uppercase text-[8px] tracking-[0.16em] text-muted self-center leading-tight">
                      {slot.label}
                      <span className="block text-[7px] tracking-[0.12em] text-muted-light mt-0.5">{slot.range}</span>
                    </span>
                    {grid[si].map((count, di) => {
                      const isPeak = hasPeak && si === peakSlot && di === peakDay
                      return (
                        <div key={di} className={clsx('h-[30px]', isPeak && 'ring-2 ring-gold ring-offset-1 ring-offset-ivory relative z-10')}
                          style={{ background: HEAT[heatLevel(count)] }}
                          title={`${PL_DAYS_FULL[di]} ${slot.label.toLowerCase()}: ${count}×`} />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-2">
              <SmallCaps tone="muted" tracking="luxury" size="xs">Rzadko</SmallCaps>
              {HEAT.map(c => <span key={c} className="w-3.5 h-3.5" style={{ background: c }} />)}
              <SmallCaps tone="muted" tracking="luxury" size="xs">Często</SmallCaps>
            </div>
            {hasPeak && (
              <p className="font-serif-body italic text-muted text-[13px]">
                <b className="font-display not-italic font-medium text-gold-deep">{PL_DAYS_FULL[peakDay].toLowerCase()}</b>{' '}
                {TIME_SLOTS[peakSlot].label.toLowerCase()} — najmocniejszy pas
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* Konteksty */}
      {contextRows.length > 0 && (
        <Panel eyebrow="Konteksty" title="Po czym sięgasz" note="największy słupek = pierwszy kandydat do mikro-eliminacji.">
          <div className="mt-5">
            {contextRows.map(ctx => {
              const pct = withContext > 0 ? Math.round((ctx.count / withContext) * 100) : 0
              const width = Math.round((ctx.count / maxCtx) * 100)
              return (
                <div key={ctx.id} className="grid items-center gap-4 py-2.5 border-t border-border first:border-t-0" style={{ gridTemplateColumns: '30px minmax(0,1fr) 1fr 44px 48px' }}>
                  <span className="w-[30px] h-[30px] border border-hairline flex items-center justify-center text-gold-deep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-[15px] h-[15px]">
                      {CONTEXT_ICON[ctx.id] ?? CTX_FALLBACK}
                    </svg>
                  </span>
                  <span className="font-serif-body text-[15px] text-dark leading-snug min-w-0">{ctx.label}</span>
                  <span className="relative h-2" style={{ background: HEAT[0] }}>
                    <span className="absolute left-0 top-0 h-full bg-gold transition-all duration-700" style={{ width: `${width}%` }} />
                  </span>
                  <span className="font-ui text-[9px] tracking-[0.16em] text-muted-light text-right tabular-nums">{ctx.count}×</span>
                  <span className="font-display font-medium text-[17px] text-gold-deep text-right tracking-tight tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>
          {noContextCount > 0 && (
            <p className="font-ui uppercase text-[8px] tracking-[0.24em] text-muted-light mt-4 pt-4 border-t border-border">
              procenty wśród zalogowanych z kontekstem · <b className="text-muted">bez kontekstu</b> = {noContextCount}× ({Math.round((noContextCount / total) * 100)}% wszystkich)
            </p>
          )}
        </Panel>
      )}

      {/* Dane operacyjne — wstęga inked */}
      {topCtx && withContext >= MIN_FOR_HEATMAP && (
        <section className="relative bg-forest-deep grain-linen text-ivory p-7 sm:p-9 overflow-hidden">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />
          <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div" className="mb-4">Dane operacyjne</SmallCaps>
          <div className="flex flex-col gap-2">
            <p className="font-serif-body italic text-parchment text-[17px] leading-relaxed">
              najmocniejszy kontekst: <b className="font-display not-italic font-medium text-gold-pale">{topCtx.label.toLowerCase()}</b>{' '}
              <span className="font-display text-gold-light text-[14px]">{withContext > 0 ? Math.round((topCtx.count / withContext) * 100) : 0}%</span>
            </p>
            {cheapest && (
              <p className="font-serif-body italic text-parchment text-[17px] leading-relaxed">
                najtańsza wygrana na start fazy II: <b className="font-display not-italic font-medium text-gold-pale">{cheapest.label.toLowerCase()}</b>{' '}
                <span className="font-display text-gold-light text-[14px]">{cheapest.count}×</span>
              </p>
            )}
          </div>
          <span className="block h-px my-5 bg-gradient-to-r from-gold-light/40 to-transparent" />
          <p className="font-serif-body italic text-gold-light text-[15px] leading-relaxed">
            w fazie II odbieraj papierosowi jeden kontekst naraz — od najmniejszego.{' '}
            <em className="text-gold-pale">baza {comma(baselineVal)} to punkt odniesienia, nie wyrok.</em>
          </p>
        </section>
      )}

      {/* Przejście do kolejnej fazy (II→III…) */}
      {phase >= 2 && nextPhase && (
        <div className="border border-hairline bg-cream/50 p-4">
          {confirmingPhase === nextPhase ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                rozpocząć fazę {toRoman(nextPhase)} — {SMOKING_PHASE_META[nextPhase].label.toLowerCase()}?
              </SmallCaps>
              <div className="flex gap-2">
                <button onClick={() => handleStartPhase(nextPhase)} disabled={saving}
                  className="px-4 py-2 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-all disabled:opacity-50">
                  <SmallCaps tone="ivory" tracking="luxury" size="xs">{saving ? 'zapisuję…' : 'tak'}</SmallCaps>
                </button>
                <button onClick={() => setConfirmingPhase(null)} disabled={saving}
                  className="px-4 py-2 border border-hairline text-dark hover:border-gold transition-colors">
                  <SmallCaps tone="muted" tracking="luxury" size="xs">nie</SmallCaps>
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmingPhase(nextPhase)} className="w-full text-center group">
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="group-hover:text-dark transition-colors">
                gotowa na fazę {toRoman(nextPhase)}? · {SMOKING_PHASE_META[nextPhase].period}
              </SmallCaps>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
