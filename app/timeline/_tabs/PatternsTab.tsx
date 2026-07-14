'use client'
import { useMemo } from 'react'
import clsx from 'clsx'
import {
  computeCorrelations, MIN_LIFT_GROUP,
  type ComparisonInsight, type DayOfWeekInsight, type LiftInsight, type CarryoverInsight,
  type CyclePhaseInsight,
} from '@/lib/correlations'
import type { CyclePhaseId } from '@/lib/weeklyHypotheses'
import type { DailyLog } from '@/types'
import WeeklyInsightCard from '@/components/WeeklyInsightCard'
import { SmallCaps, Fleuron, CornerBrackets } from '@/components/ui'

// ── Helpers ──────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(1)
}
function pctDiff(a: number | null, b: number | null): { text: string; positive: boolean } | null {
  if (a === null || b === null || b === 0) return null
  const diff = Math.round(((a - b) / b) * 100)
  if (Math.abs(diff) < 5) return null
  return { text: diff > 0 ? `+${diff}%` : `−${Math.abs(diff)}%`, positive: diff > 0 }
}
function fmtSigned(v: number | null): string {
  if (v === null) return '—'
  if (Math.abs(v) < 0.05) return '0,0'
  return (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',')
}

// mock --h0: pusty tor paska
const TRACK = '#E9E0C8'

// ── Line-art ikony (z mocka) ─────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  people:  <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><path d="M15 5.6a3.2 3.2 0 0 1 0 5.8"/><path d="M17.5 13.9c2 .7 3.2 2.5 3.6 5.1"/></>,
  rebound: <><polyline points="4 17 10 11 13 14 20 7"/><polyline points="14 7 20 7 20 13"/></>,
  target:  <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></>,
  pulse:   <polyline points="3 12 7 12 10 6 14 18 17 12 21 12"/>,
  sunrise: <><path d="M4 18h16"/><path d="M8 18a4 4 0 0 1 8 0"/><path d="M12 8V5"/><path d="M6.2 10.2 4.8 8.8"/><path d="M17.8 10.2l1.4-1.4"/></>,
  moon:    <path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>,
  bolt:    <path d="M13 2 5 13.5h6L9.5 22 19 9.5h-6z"/>,
  clock:   <><circle cx="12" cy="12" r="8"/><path d="M12 7.5v4.5l3 2"/></>,
  diamond: <path d="M12 3l7 9-7 9-7-9z"/>,
  flag:    <><path d="M5 21V4"/><path d="M5 5h12l-2.5 3.5L17 12H5"/></>,
  smoke:   <><path d="M3 15h13v3H3z"/><path d="M19 15v3"/><path d="M17 9.5c2 0 3.2 1.1 3.2 2.7"/><path d="M14.5 6.5c3 0 5 1.5 5 3.7"/></>,
}

// id wglądu → ikona z mocka (fallback: diamond)
function iconFor(id: string): React.ReactNode {
  if (id.startsWith('cigarettes')) return ICON_PATHS.smoke
  const map: Record<string, keyof typeof ICON_PATHS> = {
    lift_morning_mood: 'sunrise',
    lift_low_start_routine: 'rebound',
    lift_activity_energy: 'pulse',
    lift_social_mood: 'people',
    lift_sidequest_mood: 'target',
    lift_rules_mood: 'target',
    lift_dailyquest_mood: 'flag',
    lift_cbt_mood: 'pulse',
    carryover_evening_morning: 'moon',
    carryover_evening_energy: 'bolt',
    carryover_activity_energy: 'clock',
    carryover_xp_energy: 'diamond',
  }
  return ICON_PATHS[map[id] ?? 'diamond']
}

function WzIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className}>
      {iconFor(id)}
    </svg>
  )
}

// ── Narratives (zachowane) ───────────────────────────────────────

function comparisonNarrative(ins: ComparisonInsight): string {
  const { withValue, withoutValue, withLabel, metric } = ins
  if (withValue === null || withoutValue === null) return 'za mało danych do porównania.'
  const diff = withValue - withoutValue
  const metricPL = metric === 'mood' ? 'nastrój' : 'energia'
  if (Math.abs(diff) < 0.15) return `nie wykryto znaczącej różnicy w ${metricPL === 'nastrój' ? 'nastroju' : 'energii'} między grupami.`
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutValue, 0.1)) * 100)
  const dir = diff > 0 ? 'wyższy' : 'niższy'
  return `${withLabel.toLowerCase()}: twój ${metricPL} jest o ${absPct}% ${dir} niż w pozostałe dni.`
}
function dowNarrative(ins: DayOfWeekInsight): string {
  const withData = ins.byDay.filter(d => d.count >= 2 && d.value !== null)
  if (withData.length < 3) return 'za mało danych — check-iny z co najmniej III różnych dni tygodnia.'
  const sorted = [...withData].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const best  = sorted[0]
  const worst = sorted[sorted.length - 1]
  const metricPL = ins.metric === 'energy' ? 'energia' : 'nastrój'
  return `twoja ${metricPL} jest najwyższa w ${best.full.toLowerCase()} (śr. ${fmt(best.value)}/5), najniższa w ${worst.full.toLowerCase()} (śr. ${fmt(worst.value)}/5).`
}
function liftNarrative(ins: LiftInsight): string {
  const { withLift, withoutLift, metric } = ins
  if (withLift === null || withoutLift === null) return 'za mało danych do porównania.'
  const m = metric === 'mood' ? 'nastrój' : 'energia'
  const diff = withLift - withoutLift
  if (withLift > 0.2 && withoutLift <= 0) {
    return `${m === 'nastrój' ? 'nastrój' : 'energia'} rośnie w ciągu dnia o ${fmtSigned(withLift)} kiedy działasz, a spada o ${fmtSigned(withoutLift)} kiedy nie. mocny dowód: to wpływa w obie strony.`
  }
  if (Math.abs(diff) < 0.2) {
    return `nie wykryto różnicy w zmianie ${m === 'nastrój' ? 'nastroju' : 'energii'} — efekt może być słaby lub potrzeba więcej dni.`
  }
  if (diff > 0) {
    return `${m === 'nastrój' ? 'nastrój' : 'energia'} rośnie o ${fmtSigned(diff)} więcej w dni, kiedy działasz. to sugeruje realny wpływ — nie tylko korelację.`
  }
  return `wzrost ${m === 'nastrój' ? 'nastroju' : 'energii'} jest o ${fmtSigned(Math.abs(diff))} mniejszy gdy działasz — warto sprawdzić co innego dzieje się w te dni.`
}
function carryoverNarrative(ins: CarryoverInsight): string {
  const { withMorning, withoutMorning } = ins
  if (withMorning === null || withoutMorning === null) return 'za mało danych do porównania.'
  const diff = withMorning - withoutMorning
  if (Math.abs(diff) < 0.15) return 'wieczór nie wpływa wyraźnie na poranek następnego dnia.'
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutMorning, 0.1)) * 100)
  if (diff > 0) {
    return `po wieczorach z rutyną budzisz się w lepszym nastroju o ${absPct}% (${fmtSigned(diff)} pkt). wieczór dnia X kształtuje poranek X+1.`
  }
  return `po wieczorach z rutyną poranek bywa o ${absPct}% gorszy. może rutyna wieczorna jest zbyt późno?`
}

// ── Directional verdict (siła i kierunek dźwigni) ────────────────

type Directional = LiftInsight | CarryoverInsight
type Verdict = 'works' | 'weak' | 'reverse' | 'nodata'

const LEVER_LABEL: Record<string, string> = {
  lift_morning_mood: 'Rutyna poranna',
  lift_low_start_routine: 'Rutyna po gorszym poranku',
  lift_activity_energy: 'Ruch',
  lift_social_mood: 'Kontakt z ludźmi',
  lift_sidequest_mood: 'Side quest',
  lift_rules_mood: 'Trzymanie zasad',
  lift_dailyquest_mood: 'Quest dnia',
  lift_cbt_mood: 'Praca z myślami',
  carryover_evening_morning: 'Wieczór z rutyną → poranek',
  carryover_evening_energy: 'Wieczór z rutyną → energia rano',
  carryover_activity_energy: 'Ruch wczoraj → energia rano',
  carryover_xp_energy: 'Mocny dzień → energia rano',
}

function dirDiff(ins: Directional): number | null {
  const w  = ins.type === 'lift' ? ins.withLift    : ins.withMorning
  const wo = ins.type === 'lift' ? ins.withoutLift : ins.withoutMorning
  if (w === null || wo === null) return null
  return w - wo
}

function dirVerdict(ins: Directional): Verdict {
  if (!ins.hasEnoughData) return 'nodata'
  const d = dirDiff(ins)
  if (d === null) return 'nodata'
  const thr = ins.type === 'carryover' ? 0.15 : 0.2
  if (d > thr) return 'works'
  if (d < -thr) return 'reverse'
  return 'weak'
}

const BADGE_LABEL: Record<Exclude<Verdict, 'nodata'> | 'obs', string> = {
  works:   'Działa',
  weak:    'Słaby sygnał',
  reverse: 'Odwrotnie',
  obs:     'Obserwacja',
}

// Konkretny powód, czemu hipoteza jeszcze nie ma danych — która grupa jest pusta
// lub za mała. Lepsze niż generyczne „za mało danych": pokazuje, czego dołożyć.
function noDataReason(ins: Directional): string {
  const need = MIN_LIFT_GROUP
  const wLow  = ins.withCount < need
  const woLow = ins.withoutCount < need
  if (wLow && woLow) return `za mało dni w obu grupach (${ins.withCount}/${need} i ${ins.withoutCount}/${need})`
  if (wLow)  return `tylko ${ins.withCount}/${need} dni, gdy to robisz — dołóż takie dni`
  if (woLow) return `tylko ${ins.withoutCount}/${need} dni bez tego — za mało kontrastu`
  return 'zbiera dane'
}

// ── Section primitives ───────────────────────────────────────────

function Panel({ eyebrow, title, note, children, className }: {
  eyebrow: string
  title?: string
  note?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section className={clsx('relative bg-ivory border border-gold-light/40 p-5 sm:p-7', className)}>
      <CornerBrackets size={10} tone="gold-light" />
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">{eyebrow}</SmallCaps>
      {title && <h2 className="font-heading text-dark text-lg mt-1">{title}</h2>}
      {note && <p className="font-serif-body italic text-muted text-[13px] mt-1">{note}</p>}
      {children}
    </section>
  )
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 mt-2 mb-1">
      <SmallCaps tone="muted" tracking="editorial" size="xs">{children}</SmallCaps>
      <span className="flex-1 h-px bg-hairline" />
    </div>
  )
}

// ── Levers (Twoje dźwignie) ──────────────────────────────────────

function LeversPanel({ items }: { items: Directional[] }) {
  return (
    <Panel
      eyebrow="Wpływ kierunkowy"
      title="Twoje dźwignie"
      note="co realnie rusza Twój nastrój i energię — od najmocniejszej. mierzone wzrostem w ciągu dnia, nie samym współwystępowaniem."
    >
      <div className="mt-5">
        {items.map(ins => {
          const d = dirDiff(ins) ?? 0
          const neg = d < 0
          const width = Math.min(50, Math.abs(d) / 0.6 * 50)
          return (
            <div
              key={ins.id}
              className="grid items-center gap-3 sm:gap-4 py-2.5 border-t border-border first:border-t-0"
              style={{ gridTemplateColumns: '12px minmax(0,1fr) 64px 1fr 56px' }}
            >
              <span className={clsx('text-[8px] text-center', neg ? 'text-wine' : 'text-gold')}>◆</span>
              <span className="font-serif-body text-[14px] text-dark leading-snug min-w-0">
                {LEVER_LABEL[ins.id] ?? ins.title}
              </span>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="whitespace-nowrap">
                {ins.metric === 'mood' ? 'nastrój' : 'energia'}
              </SmallCaps>
              <span className="relative h-[7px]" style={{ background: TRACK }}>
                <span className="absolute -top-[3px] -bottom-[3px] left-1/2 w-px bg-hairline" />
                <span
                  className={clsx('absolute top-0 h-full transition-all duration-700', neg ? 'bg-wine' : 'bg-gold')}
                  style={neg ? { right: '50%', width: `${width}%` } : { left: '50%', width: `${width}%` }}
                />
              </span>
              <span className={clsx('font-display text-[15px] text-right tracking-tight tabular-nums', neg ? 'text-wine' : 'text-gold-deep')}>
                {fmtSigned(d)}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function LeverQuiet({ items }: { items: Directional[] }) {
  return (
    <p className="font-serif-body italic text-muted-light text-[12.5px] leading-relaxed px-1 -mt-1">
      <span className="not-italic text-[9px] mr-2">◇</span>
      bez wyraźnego efektu:{' '}
      {items.map((i, idx) => (
        <span key={i.id} className="text-muted">
          {idx > 0 && ' · '}
          <b className="font-serif-body not-italic font-medium">{LEVER_LABEL[i.id] ?? i.title}</b>
        </span>
      ))}
    </p>
  )
}

// ── Hypothesis card (wz-card) ────────────────────────────────────

type InsTone = 'pos' | 'neg' | 'weak'

function WzCardShell({ id, title, sub, badge, badgeKind, children, axis, insight, insTone }: {
  id: string
  title: string
  sub?: string
  badge: string
  badgeKind: 'works' | 'reverse' | 'weak' | 'obs'
  children: React.ReactNode
  axis: React.ReactNode
  insight: React.ReactNode
  insTone: InsTone
}) {
  return (
    <article className="relative bg-ivory border border-gold-light/40 p-5 sm:p-6 flex flex-col">
      <span className="absolute top-2 left-2 w-2 h-2 border-l border-t border-gold-light/70" />
      <div className="flex items-start gap-3.5">
        <span
          className={clsx(
            'shrink-0 w-[34px] h-[34px] border flex items-center justify-center',
            badgeKind === 'works' ? 'border-gold-light text-gold-deep' :
            badgeKind === 'reverse' ? 'border-wine/45 text-wine' :
            'border-hairline text-muted-light'
          )}
        >
          <WzIcon id={id} className="w-[17px] h-[17px]" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-dark text-[16px] leading-tight tracking-tight">{title}</h3>
          {sub && <p className="font-serif-body italic text-muted text-[12.5px] mt-1 leading-snug">{sub}</p>}
        </div>
        <span
          className={clsx(
            'font-ui uppercase tracking-luxury text-[7px] border px-2 py-1 whitespace-nowrap',
            badgeKind === 'works' ? 'text-forest border-forest/40 bg-forest/5' :
            badgeKind === 'reverse' ? 'text-wine border-wine/35 bg-wine/5' :
            badgeKind === 'obs' ? 'text-muted border-hairline' :
            'text-muted border-hairline'
          )}
        >
          {badge}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3.5">{children}</div>

      <div className="flex justify-between mt-3 mb-4 font-ui uppercase tracking-luxury text-[7px] text-muted-light">
        {axis}
      </div>

      <div
        className={clsx(
          'mt-auto px-4 py-2.5 border font-serif-body italic text-[13px] leading-snug',
          insTone === 'pos' ? 'bg-cream border-border text-dark' :
          insTone === 'neg' ? 'bg-wine/5 border-wine/20 text-dark' :
          'bg-transparent border-dashed border-hairline text-muted'
        )}
      >
        <span className={clsx('not-italic text-[7px] mr-2 align-middle', insTone === 'neg' ? 'text-wine' : insTone === 'weak' ? 'text-muted-light' : 'text-gold')}>
          {insTone === 'weak' ? '◇' : '◆'}
        </span>
        {insight}
      </div>
    </article>
  )
}

// pasek typu „delta" (od środka): wzrost w prawo, spadek w lewo
function DeltaRow({ label, count, delta, primary }: { label: string; count: string; delta: number | null; primary: boolean }) {
  const v = delta ?? 0
  const kind: InsTone | 'zero' = Math.abs(v) < 0.05 ? 'zero' : v > 0 ? 'pos' : 'neg'
  const width = Math.min(50, Math.abs(v) / 0.6 * 50)
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className={clsx('flex-1 font-serif-body text-[14px] min-w-0', primary ? 'text-dark' : 'text-muted italic')}>{label}</span>
        <SmallCaps tone="muted" tracking="luxury" size="xs" className="whitespace-nowrap shrink-0">{count}</SmallCaps>
        <span className={clsx(
          'font-display text-[15px] tracking-tight tabular-nums text-right min-w-[44px]',
          kind === 'pos' ? 'text-gold-deep' : kind === 'neg' ? 'text-wine' : 'text-muted-light'
        )}>
          {fmtSigned(delta)}
        </span>
      </div>
      <div className="relative h-2 mt-[7px]" style={{ background: TRACK }}>
        <span className="absolute -top-[3px] -bottom-[3px] left-1/2 w-px bg-hairline" />
        {kind !== 'zero' && (
          <span
            className={clsx('absolute top-0 h-full transition-all duration-700', kind === 'pos' ? 'bg-gold' : 'bg-wine')}
            style={kind === 'pos' ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
          />
        )}
      </div>
    </div>
  )
}

// pasek typu „skala" (wartość bezwzględna 2–4 → 0–100% wycinka)
function ScaleRow({ label, count, value, annotation, primary }: {
  label: string; count: string; value: number | null; annotation?: { text: string; positive: boolean } | null; primary: boolean
}) {
  const v = value ?? 0
  const width = Math.max(0, Math.min(100, ((v - 2) / 2) * 100))
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className={clsx('flex-1 font-serif-body text-[14px] min-w-0', primary ? 'text-dark' : 'text-muted italic')}>{label}</span>
        <SmallCaps tone="muted" tracking="luxury" size="xs" className="whitespace-nowrap shrink-0">{count}</SmallCaps>
        <span className="font-display text-[15px] tracking-tight tabular-nums text-right min-w-[44px] text-dark">
          {fmt(value)}
          {annotation && (
            <span className={clsx('font-ui text-[9px] ml-1', annotation.positive ? 'text-forest' : 'text-wine')}>{annotation.text}</span>
          )}
        </span>
      </div>
      <div className="relative h-2 mt-[7px]" style={{ background: TRACK }}>
        <span
          className={clsx('absolute top-0 left-0 h-full transition-all duration-700', primary ? 'bg-gold' : 'bg-muted-light')}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

const DELTA_AXIS = (<><span>← spadek</span><span>0</span><span>wzrost →</span></>)
const SCALE_AXIS = (<><span>II</span><span>skala I–V · wycinek II–IV</span><span>IV</span></>)

function LiftCard({ ins }: { ins: LiftInsight }) {
  const v = dirVerdict(ins)
  const badgeKind = v === 'works' ? 'works' : v === 'reverse' ? 'reverse' : 'weak'
  const insTone: InsTone = v === 'works' ? 'pos' : v === 'reverse' ? 'neg' : 'weak'
  return (
    <WzCardShell
      id={ins.id} title={ins.title} sub={ins.subtitle}
      badge={BADGE_LABEL[badgeKind]} badgeKind={badgeKind}
      axis={DELTA_AXIS} insTone={insTone} insight={liftNarrative(ins)}
    >
      <DeltaRow label={ins.withLabel} count={`${ins.withCount} dni`} delta={ins.withLift} primary />
      <DeltaRow label={ins.withoutLabel} count={`${ins.withoutCount} dni`} delta={ins.withoutLift} primary={false} />
    </WzCardShell>
  )
}

function CarryoverCard({ ins }: { ins: CarryoverInsight }) {
  const v = dirVerdict(ins)
  const badgeKind = v === 'works' ? 'works' : v === 'reverse' ? 'reverse' : 'weak'
  const insTone: InsTone = v === 'works' ? 'pos' : v === 'reverse' ? 'neg' : 'weak'
  return (
    <WzCardShell
      id={ins.id} title={ins.title} sub={ins.subtitle}
      badge={BADGE_LABEL[badgeKind]} badgeKind={badgeKind}
      axis={SCALE_AXIS} insTone={insTone} insight={carryoverNarrative(ins)}
    >
      <ScaleRow label={ins.withLabel} count={`${ins.withCount} poranków`} value={ins.withMorning} primary />
      <ScaleRow label={ins.withoutLabel} count={`${ins.withoutCount} poranków`} value={ins.withoutMorning} primary={false} />
    </WzCardShell>
  )
}

function ObservationCard({ ins }: { ins: ComparisonInsight }) {
  const delta = ins.withValue !== null && ins.withoutValue !== null ? ins.withValue - ins.withoutValue : null
  const insTone: InsTone = delta !== null && delta < -0.1 ? 'neg' : 'pos'
  return (
    <WzCardShell
      id={ins.id} title={ins.title} sub={ins.metric === 'mood' ? 'średni nastrój, skala I–V.' : 'średnia energia, skala I–V.'}
      badge={BADGE_LABEL.obs} badgeKind="obs"
      axis={SCALE_AXIS} insTone={insTone} insight={comparisonNarrative(ins)}
    >
      <ScaleRow label={ins.withLabel} count={`${ins.withCount} dni`} value={ins.withValue} annotation={pctDiff(ins.withValue, ins.withoutValue)} primary />
      <ScaleRow label={ins.withoutLabel} count={`${ins.withoutCount} dni`} value={ins.withoutValue} primary={false} />
    </WzCardShell>
  )
}

// ── Weekday rhythm (wk-duo) ──────────────────────────────────────

function WeekdayBlock({ ins }: { ins: DayOfWeekInsight }) {
  const withData = ins.byDay.filter(d => d.value !== null && d.count >= 1)
  const maxVal = withData.length ? Math.max(...withData.map(d => d.value ?? 0)) : 5
  const minVal = withData.length ? Math.min(...withData.map(d => d.value ?? 0)) : 0
  const best  = withData.length ? withData.reduce((a, b) => ((b.value ?? 0) > (a.value ?? 0) ? b : a)) : null
  const worst = withData.length ? withData.reduce((a, b) => ((b.value ?? 0) < (a.value ?? 0) ? b : a)) : null
  const metricPL = ins.metric === 'energy' ? 'Energia' : 'Nastrój'

  return (
    <div>
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
        {metricPL} <span className="font-serif-body italic lowercase tracking-normal text-muted-light ml-1.5 text-[12px]">i–v</span>
      </SmallCaps>
      <div className="flex gap-2 mt-4">
        {ins.byDay.map(d => {
          const has = d.value !== null && d.count >= 1
          const isBest  = has && best  && d.dow === best.dow  && maxVal > minVal
          const isWorst = has && worst && d.dow === worst.dow && maxVal > minVal
          // skala 2.2–3.6 → 0–100% (jak w mocku)
          const h = has ? Math.max(0, Math.min(100, ((d.value! - 2.2) / 1.4) * 100)) : 0
          return (
            <div key={d.dow} className="flex-1 text-center">
              <div className="h-[104px] flex items-end">
                <div
                  className={clsx('w-full transition-all duration-700', isBest ? 'bg-gold' : isWorst ? 'bg-wine/70' : 'bg-gold-light/55')}
                  style={{ height: `${h}%` }}
                  title={has ? `${d.full}: ${fmt(d.value)}/5` : d.full}
                />
              </div>
              <div className={clsx('font-ui uppercase tracking-luxury text-[8px] mt-2', isBest ? 'text-gold-deep' : isWorst ? 'text-wine' : 'text-muted-light')}>
                {d.short}
              </div>
              <div className="font-display text-[13px] text-dark tracking-tight mt-1">{fmt(d.value)}</div>
            </div>
          )
        })}
      </div>
      <p className="font-serif-body italic text-muted text-[13px] mt-4 pt-3.5 border-t border-border leading-snug">
        {dowNarrative(ins)}
      </p>
    </div>
  )
}

// ── Cykl (faza → nastrój / energia) ──────────────────────────────

const PHASE_ACCENT: Record<CyclePhaseId, string> = {
  menstruacja: '#8B3A3A', folikularna: '#3D5247', owulacyjna: '#B8963E', lutealna: '#5A3E6B',
}
const PHASE_SHORT: Record<CyclePhaseId, string> = {
  menstruacja: 'Menstr.', folikularna: 'Folik.', owulacyjna: 'Owul.', lutealna: 'Luteal.',
}

function CyclePhaseBlock({ ins }: { ins: CyclePhaseInsight }) {
  const withData = ins.byPhase.filter(p => p.value !== null && p.count >= 1)
  const best  = withData.length ? withData.reduce((a, b) => ((b.value ?? 0) > (a.value ?? 0) ? b : a)) : null
  const worst = withData.length ? withData.reduce((a, b) => ((b.value ?? 0) < (a.value ?? 0) ? b : a)) : null
  const metricPL = ins.metric === 'energy' ? 'Energia' : 'Nastrój'
  const spread = best && worst && best.id !== worst.id

  return (
    <div>
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">
        {metricPL} <span className="font-serif-body italic lowercase tracking-normal text-muted-light ml-1.5 text-[12px]">i–v</span>
      </SmallCaps>
      <div className="flex gap-2 mt-4">
        {ins.byPhase.map(p => {
          const has = p.value !== null && p.count >= 1
          const isBest  = has && spread && best  && p.id === best.id
          const isWorst = has && spread && worst && p.id === worst.id
          const h = has ? Math.max(0, Math.min(100, ((p.value! - 2.2) / 1.4) * 100)) : 0
          const acc = PHASE_ACCENT[p.id]
          return (
            <div key={p.id} className="flex-1 text-center">
              <div className="h-[104px] flex items-end">
                <div
                  className="w-full transition-all duration-700"
                  style={{ height: `${h}%`, background: acc, opacity: !has ? 0.12 : isBest ? 1 : isWorst ? 0.85 : 0.45 }}
                  title={has ? `${p.label}: ${fmt(p.value)}/5 (${p.count} dni)` : p.label}
                />
              </div>
              <div className="font-ui uppercase tracking-luxury text-[8px] mt-2" style={{ color: has ? acc : undefined }}>
                {PHASE_SHORT[p.id]}
              </div>
              <div className="font-display text-[13px] text-dark tracking-tight mt-1">{fmt(p.value)}</div>
            </div>
          )
        })}
      </div>
      <p className="font-serif-body italic text-muted text-[13px] mt-4 pt-3.5 border-t border-border leading-snug">
        {spread
          ? `twoja ${metricPL.toLowerCase()} jest najwyższa w fazie ${best!.label} (śr. ${fmt(best!.value)}/5), najniższa w ${worst!.label} (śr. ${fmt(worst!.value)}/5). to rytm, nie ocena — mapa, którą można zaplanować.`
          : 'za mało kontrastu między fazami — dołóż check-inów w różnych fazach cyklu.'}
      </p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export default function PatternsTab({ logs, cigarettesPhase, cyclePhaseOf }: {
  logs: Record<string, DailyLog>
  cigarettesPhase?: number
  cyclePhaseOf?: (dateKey: string) => CyclePhaseId | null
}) {
  const insights = useMemo(
    () => computeCorrelations(logs, cigarettesPhase, { cyclePhaseOf }),
    [logs, cigarettesPhase, cyclePhaseOf],
  )
  const logsWithMood = Object.values(logs).filter(l => l.moodCheckIns && l.moodCheckIns.length > 0)

  if (logsWithMood.length === 0) {
    return (
      <div className="relative bg-ivory border border-gold-light/40 p-12 text-center">
        <CornerBrackets size={10} tone="gold-light" />
        <Fleuron size={16} className="text-gold-deep mx-auto mb-4 inline-block" />
        <h3 className="font-display text-dark text-2xl">Wzorce pojawią się z czasem</h3>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-3 max-w-sm mx-auto leading-relaxed">
          uzupełniaj check-iny nastroju (pojawiają się losowo na dashboardzie) —
          po kilku tygodniach zobaczysz tu automatyczne wnioski.
        </p>
      </div>
    )
  }

  // ── Grupowanie wniosków ──────────────────────────────────────────
  const directional = insights.filter(
    (i): i is Directional => i.type === 'lift' || i.type === 'carryover'
  )
  const ranked = directional
    .filter(i => dirVerdict(i) !== 'nodata')
    .sort((a, b) => Math.abs(dirDiff(b) ?? 0) - Math.abs(dirDiff(a) ?? 0))
  const levers  = ranked.filter(i => dirVerdict(i) === 'works' || dirVerdict(i) === 'reverse')
  const weak    = ranked.filter(i => dirVerdict(i) === 'weak')
  const noData  = directional.filter(i => dirVerdict(i) === 'nodata')

  const dowInsights = insights.filter((i): i is DayOfWeekInsight => i.type === 'dow')
  const cycleInsights = insights.filter(
    (i): i is CyclePhaseInsight => i.type === 'cyclephase' && i.hasEnoughData
  )
  const cigInsights = insights.filter(
    (i): i is ComparisonInsight => i.type === 'comparison' && i.id.startsWith('cigarettes')
  )
  const cigWithData = cigInsights.filter(i => i.hasEnoughData)

  return (
    <div className="space-y-5">
      {/* Wzorzec tygodnia — werdykt */}
      <WeeklyInsightCard moodDays={logsWithMood.length} />

      {/* Twoje dźwignie */}
      {ranked.length > 0 ? (
        <>
          {levers.length > 0 && <LeversPanel items={levers} />}
          {weak.length > 0 && <LeverQuiet items={weak} />}
        </>
      ) : (
        <Panel eyebrow="Wpływ kierunkowy" title="Twoje dźwignie">
          <p className="font-serif-body italic text-muted text-[13px] mt-3 leading-relaxed">
            jeszcze za mało danych, żeby wskazać dźwignie — rób check-iny nastroju
            (najlepiej 2 w ciągu dnia), a wnioski pojawią się same.
          </p>
        </Panel>
      )}

      {/* Testy hipotez */}
      {ranked.length > 0 && (
        <div className="space-y-4">
          <SecLabel>Testy hipotez</SecLabel>
          <div className="grid sm:grid-cols-2 gap-4">
            {ranked.map(ins =>
              ins.type === 'lift'
                ? <LiftCard key={ins.id} ins={ins} />
                : <CarryoverCard key={ins.id} ins={ins} />
            )}
          </div>
        </div>
      )}

      {noData.length > 0 && (
        <div className="border border-dashed border-hairline bg-cream/50 px-5 py-3.5">
          <SmallCaps tone="muted" tracking="luxury" size="xs">Jeszcze zbiera dane</SmallCaps>
          <ul className="mt-2.5 space-y-1.5">
            {noData.map(i => (
              <li key={i.id} className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                <span className="font-serif-body text-[14px] text-dark">{LEVER_LABEL[i.id] ?? i.title}</span>
                <span className="font-serif-body italic text-muted-light text-[13px]">— {noDataReason(i)}</span>
              </li>
            ))}
          </ul>
          <p className="font-serif-body italic text-muted-light text-[12px] mt-2.5 pt-2.5 border-t border-hairline">
            każda grupa potrzebuje min. {MIN_LIFT_GROUP} dni z check-inem, żeby było co porównać.
          </p>
        </div>
      )}

      {/* Rytm tygodnia */}
      {dowInsights.length > 0 && (
        <Panel
          eyebrow="Rytm tygodnia"
          title="Energia i nastrój po dniach"
          note="kiedy w tygodniu masz statystycznie lepiej, a kiedy trudniej — do planowania trudnych dni."
        >
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 mt-5 sm:[&>div+div]:border-l sm:[&>div+div]:border-border sm:[&>div+div]:pl-10">
            {[...dowInsights]
              .sort((a) => (a.metric === 'energy' ? -1 : 1))
              .map(ins => <WeekdayBlock key={ins.id} ins={ins} />)}
          </div>
        </Panel>
      )}

      {/* Rytm cyklu — faza → nastrój / energia */}
      {cycleInsights.length > 0 && (
        <Panel
          eyebrow="Rytm cyklu"
          title="Nastrój i energia według fazy"
          note="trzecia oś: naturalny, powtarzalny rytm hormonalny. u Ciebie zwykle najsilniejsze źródło zmienności — bo daje kontrast, którego nawyki robione „zawsze” nie mają."
        >
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 mt-5 sm:[&>div+div]:border-l sm:[&>div+div]:border-border sm:[&>div+div]:pl-10">
            {[...cycleInsights]
              .sort((a) => (a.metric === 'energy' ? -1 : 1))
              .map(ins => <CyclePhaseBlock key={ins.id} ins={ins} />)}
          </div>
        </Panel>
      )}

      {/* Obserwacje (papierosy) */}
      {cigInsights.length > 0 && (
        <div className="space-y-3">
          <SecLabel>Obserwacje</SecLabel>
          <p className="font-serif-body italic text-muted-light text-[13px] -mt-1">
            neutralny ślad, bez oceny — faza obserwacji. tylko patrzymy, co się z czym schodzi.
          </p>
          {cigWithData.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cigWithData.map(ins => <ObservationCard key={ins.id} ins={ins} />)}
            </div>
          ) : (
            <div className="bg-cream/50 border border-hairline px-4 py-3">
              <p className="font-serif-body italic text-muted-light text-[12.5px] leading-relaxed">
                jeszcze zbierasz dane — porównania pojawią się, gdy uzbiera się dość dni z check-inem.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
