'use client'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import {
  computeCorrelations, MIN_LIFT_GROUP,
  type ComparisonInsight, type DayOfWeekInsight, type LiftInsight, type CarryoverInsight,
  type CyclePhaseInsight,
} from '@/lib/correlations'
import {
  type Directional, dirDiff, dirVerdict, groupLevers, leverLabel, leverSentence, fmtPts,
} from '@/lib/patternVerdicts'
import type { CyclePhaseId } from '@/lib/weeklyHypotheses'
import type { DailyLog } from '@/types'
import WeeklyInsightCard from '@/components/WeeklyInsightCard'
import { SmallCaps, Fleuron, CornerBrackets } from '@/components/ui'

// ── Helpers ──────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(1).replace('.', ',')
}

// „w środę", „we wtorek" — indeks jak Date.getDay() (0 = niedziela).
const DOW_LOC = ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę']
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
  if (ins.metric === 'energy') {
    return `energii masz najwięcej ${DOW_LOC[best.dow]} (śr. ${fmt(best.value)}/5), najmniej ${DOW_LOC[worst.dow]} (śr. ${fmt(worst.value)}/5).`
  }
  return `nastrój jest najlepszy ${DOW_LOC[best.dow]} (śr. ${fmt(best.value)}/5), najsłabszy ${DOW_LOC[worst.dow]} (śr. ${fmt(worst.value)}/5).`
}
function liftNarrative(ins: LiftInsight): string {
  const { withLift, withoutLift, metric } = ins
  if (withLift === null || withoutLift === null) return 'za mało danych do porównania.'
  const m = metric === 'mood' ? 'nastrój' : 'energia'
  const diff = withLift - withoutLift
  if (withLift > 0.2 && withoutLift <= 0) {
    return `kiedy to robisz, ${m} rośnie w ciągu dnia o ${fmtPts(withLift)} pkt; kiedy nie — ${withoutLift < -0.05 ? `spada o ${fmtPts(withoutLift)} pkt` : 'stoi w miejscu'}. wyraźny sygnał w obie strony.`
  }
  if (Math.abs(diff) < 0.2) {
    return `nie widać różnicy — ${m} zmienia się w ciągu dnia podobnie. efekt jest słaby albo potrzeba więcej dni.`
  }
  if (diff > 0) {
    return `kiedy to robisz, ${m} rośnie w ciągu dnia o ${fmtPts(diff)} pkt bardziej. to sugeruje realny wpływ, nie tylko zbieg okoliczności.`
  }
  return `kiedy to robisz, ${m} rośnie w ciągu dnia o ${fmtPts(diff)} pkt mniej. to nie musi znaczyć, że szkodzi — sprawdź, co jeszcze dzieje się w takie dni.`
}
function carryoverNarrative(ins: CarryoverInsight): string {
  const { withMorning, withoutMorning } = ins
  if (withMorning === null || withoutMorning === null) return 'za mało danych do porównania.'
  const diff = withMorning - withoutMorning
  if (Math.abs(diff) < 0.15) return 'wieczór nie wpływa wyraźnie na poranek następnego dnia.'
  const absPct = Math.round((Math.abs(diff) / Math.max(withoutMorning, 0.1)) * 100)
  if (diff > 0) {
    return `po wieczorach z rutyną poranek jest średnio o ${fmtPts(diff)} pkt lepszy (${absPct}%). wieczór kształtuje następny ranek.`
  }
  return `po wieczorach z rutyną poranek bywa o ${fmtPts(diff)} pkt gorszy (${absPct}%). może rutyna wieczorna kończy się zbyt późno?`
}

// ── Werdykty (lib/patternVerdicts) ────────────────────────────────

type Verdict = ReturnType<typeof dirVerdict>

const BADGE_LABEL: Record<Exclude<Verdict, 'nodata'> | 'obs', string> = {
  works:   'Pomaga',
  weak:    'Bez wyraźnego wpływu',
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

// ── W skrócie: co pomaga, a co nie ────────────────────────────────

function LeverRow({ ins }: { ins: Directional }) {
  const d = dirDiff(ins) ?? 0
  const neg = d < 0
  const width = Math.min(100, (Math.abs(d) / 0.8) * 100)
  return (
    <li className="py-3.5 border-t border-border first:border-t-0">
      <div className="flex items-baseline gap-3">
        <span className="flex-1 min-w-0 font-display text-dark text-[17px] leading-tight">{leverLabel(ins)}</span>
        <span className={clsx('font-display text-[22px] leading-none tracking-tight tabular-nums', neg ? 'text-wine' : 'text-gold-deep')}>
          {neg ? '−' : '+'}{fmtPts(d)}
          <span className="font-serif-body italic text-muted text-[13px] ml-1">pkt</span>
        </span>
      </div>
      <p className="font-serif-body text-dark/80 text-[15px] leading-snug mt-1">{leverSentence(ins)}</p>
      <div className="relative h-1.5 mt-2.5" style={{ background: TRACK }}>
        <span className={clsx('absolute top-0 left-0 h-full transition-all duration-700', neg ? 'bg-wine/80' : 'bg-gold')} style={{ width: `${width}%` }} />
      </div>
    </li>
  )
}

function GroupHead({ tone, title, count }: { tone: 'pos' | 'neg' | 'quiet'; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5 mt-6 first:mt-4">
      <span className={clsx('w-2 h-2 rotate-45', tone === 'pos' ? 'bg-forest' : tone === 'neg' ? 'bg-wine' : 'border border-muted-light')} />
      <SmallCaps tone={tone === 'quiet' ? 'muted' : 'dark'} tracking="luxury" size="sm">{title}</SmallCaps>
      <span className="font-ui text-[11px] text-muted-light tabular-nums">{count}</span>
      <span className="flex-1 h-px bg-hairline" />
    </div>
  )
}

function VerdictSummary({ works, reverse, weak, noData }: {
  works: Directional[]; reverse: Directional[]; weak: Directional[]; noData: Directional[]
}) {
  return (
    <Panel
      eyebrow="W skrócie"
      title="Co pomaga, a co nie"
      note="porównuję, jak zmienia się nastrój i energia w dni, kiedy coś robisz, i w dni, kiedy nie. skala 1–5, więc 0,5 pkt to już wyraźna różnica."
    >
      {works.length > 0 && (
        <>
          <GroupHead tone="pos" title="Pomaga" count={works.length} />
          <ul>{works.map(i => <LeverRow key={i.id} ins={i} />)}</ul>
        </>
      )}

      {reverse.length > 0 && (
        <>
          <GroupHead tone="neg" title="Odwrotnie, niż można by sądzić" count={reverse.length} />
          <ul>{reverse.map(i => <LeverRow key={i.id} ins={i} />)}</ul>
          <p className="font-serif-body italic text-muted text-[14px] leading-snug mt-1">
            to nie musi znaczyć, że szkodzi. mierzę wzrost w ciągu dnia — jeśli coś podnosi Ci
            nastrój już przed pierwszym check-inem, na dalszy wzrost zostaje mniej miejsca.
          </p>
        </>
      )}

      {works.length === 0 && reverse.length === 0 && weak.length > 0 && (
        <p className="font-serif-body text-dark/80 text-[15px] leading-snug mt-4">
          na razie nic nie odróżnia się wyraźnie. to częste, gdy nawyki robisz prawie codziennie —
          brakuje dni „bez”, z którymi można porównać.
        </p>
      )}

      {weak.length > 0 && (
        <>
          <GroupHead tone="quiet" title="Bez wyraźnego wpływu" count={weak.length} />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {weak.map(i => (
              <span key={i.id} className="font-serif-body text-[14px] text-dark/80 border border-hairline bg-cream/50 px-2.5 py-1">
                {leverLabel(i)}
              </span>
            ))}
          </div>
        </>
      )}

      {noData.length > 0 && (
        <>
          <GroupHead tone="quiet" title="Za mało danych" count={noData.length} />
          <ul className="mt-2.5 space-y-1.5">
            {noData.map(i => (
              <li key={i.id} className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                <span className="font-serif-body text-[15px] text-dark">{leverLabel(i)}</span>
                <span className="font-serif-body italic text-muted text-[14px]">— {noDataReason(i)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
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
            'font-ui uppercase tracking-[0.14em] text-[9.5px] border px-2 py-1 whitespace-nowrap',
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

      <div className="flex justify-between mt-3 mb-4 font-ui uppercase tracking-[0.14em] text-[9px] text-muted">
        {axis}
      </div>

      <div
        className={clsx(
          'mt-auto px-4 py-2.5 border font-serif-body italic text-[14px] leading-snug',
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
              <div className={clsx('font-ui uppercase tracking-[0.12em] text-[10px] mt-2', isBest ? 'text-gold-deep' : isWorst ? 'text-wine' : 'text-muted')}>
                {d.short}
              </div>
              <div className="font-display text-[14px] text-dark tracking-tight mt-1">{fmt(d.value)}</div>
            </div>
          )
        })}
      </div>
      <p className="font-serif-body italic text-muted text-[14px] mt-4 pt-3.5 border-t border-border leading-snug">
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
              <div className="font-ui uppercase tracking-[0.12em] text-[10px] mt-2" style={{ color: has ? acc : undefined }}>
                {PHASE_SHORT[p.id]}
              </div>
              <div className="font-display text-[14px] text-dark tracking-tight mt-1">{fmt(p.value)}</div>
            </div>
          )
        })}
      </div>
      <p className="font-serif-body italic text-muted text-[14px] mt-4 pt-3.5 border-t border-border leading-snug">
        {spread
          ? `${metricPL.toLowerCase()} — najwyżej w fazie: ${best!.label.toLowerCase()} (śr. ${fmt(best!.value)}/5), najniżej: ${worst!.label.toLowerCase()} (śr. ${fmt(worst!.value)}/5). to rytm, nie ocena — mapa, którą można zaplanować.`
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
  const [showTests, setShowTests] = useState(false)

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
  const { ranked, works, reverse, weak, noData } = groupLevers(insights)

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
      {/* 1. Najpierw odpowiedź: co pomaga, a co nie */}
      {ranked.length > 0 || noData.length > 0 ? (
        <VerdictSummary works={works} reverse={reverse} weak={weak} noData={noData} />
      ) : (
        <Panel eyebrow="W skrócie" title="Co pomaga, a co nie">
          <p className="font-serif-body italic text-muted text-[14px] mt-3 leading-relaxed">
            jeszcze za mało danych, żeby to ocenić — rób check-iny nastroju
            (najlepiej 2 w ciągu dnia), a wnioski pojawią się same.
          </p>
        </Panel>
      )}

      {/* 2. Wzorzec tygodnia — test statystyczny na świeżych danych */}
      <WeeklyInsightCard moodDays={logsWithMood.length} />

      {/* 3. Szczegóły porównań — dla ciekawych, domyślnie schowane */}
      {ranked.length > 0 && (
        <div>
          <button
            onClick={() => setShowTests(v => !v)}
            aria-expanded={showTests}
            className="w-full flex items-center gap-3 bg-ivory border border-gold-light/40 hover:border-gold px-5 py-4 text-left transition-colors"
          >
            <span className="flex-1 min-w-0">
              <span className="block font-display text-dark text-[17px] leading-tight">Szczegóły porównań</span>
              <span className="block font-serif-body italic text-muted text-[14px] mt-0.5">
                {ranked.length} {ranked.length === 1 ? 'porównanie' : ranked.length < 5 ? 'porównania' : 'porównań'} dzień po dniu — liczby dni i wykresy
              </span>
            </span>
            <ChevronDown size={18} strokeWidth={1.5} className={clsx('text-gold-deep transition-transform', showTests && 'rotate-180')} />
          </button>
          {showTests && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {ranked.map(ins =>
                ins.type === 'lift'
                  ? <LiftCard key={ins.id} ins={ins} />
                  : <CarryoverCard key={ins.id} ins={ins} />
              )}
            </div>
          )}
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
