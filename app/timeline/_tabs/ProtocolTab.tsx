'use client'
import clsx from 'clsx'
import type { GhostLogEntryV2, HonestFailureEntry, GhostCategory } from '@/types'
import { GHOST_CATEGORIES } from '@/lib/ghost-data'
import { SmallCaps, Fleuron, CornerBrackets } from '@/components/ui'
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

const MIN_FOR_FULL_MAP = 30
const MIN_FOR_BASIC = 5

// skala intensywności heatmapy (mock --h0…--h4)
const HEAT = ['#E9E0C8', '#D6BD84', '#BD9C56', '#94793B', '#5A4B22']

// liniowe ikony kategorii (styl mocka)
const CATEGORY_ICON: Record<GhostCategory, React.ReactNode> = {
  zastapienie:        <><rect x="3.5" y="5" width="17" height="14"/><circle cx="9" cy="10" r="1.6"/><path d="M3.5 16.5 9 12l4 3.5 3.5-3 4 3.5"/></>,
  flashback:          <><polyline points="3 7 3 12 8 12"/><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/></>,
  nie_do_wybrania:    <><circle cx="12" cy="7.5" r="3.2"/><path d="M5.5 20c.7-3.8 3.4-5.8 6.5-5.8s5.8 2 6.5 5.8"/></>,
  strach_przyszlosc:  <><path d="M7.5 4h9"/><path d="M7.5 20h9"/><path d="M8.5 4v2.5L12 11l3.5-4.5V4"/><path d="M8.5 20v-2.5L12 13l3.5 4.5V20"/></>,
  tesknota_hustawka:  <path d="M3 13c2.5-6 5-6 7.5 0s5 6 7.5 0"/>,
  kontakt_zewnetrzny: <path d="M20 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>,
  chce_sprawdzic:     <><circle cx="10.5" cy="10.5" r="6"/><path d="M20 20l-5.2-5.2"/></>,
}

interface ProtocolTabProps {
  entries: GhostLogEntryV2[]
  failures: HonestFailureEntry[]
  loading: boolean
}

// ── Panele (jasny system Historii) ───────────────────────────────

function Panel({ eyebrow, title, note, children }: {
  eyebrow: string
  title: string
  note?: React.ReactNode
  children?: React.ReactNode
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

function MetricCell({ idx, hero, heroText, eyebrow, note, feature }: {
  idx: string
  hero?: string
  heroText?: string
  eyebrow: string
  note: string
  feature?: boolean
}) {
  return (
    <div className={clsx('p-5 flex flex-col', feature ? 'bg-forest-deep' : 'bg-ivory')}>
      <div className="flex items-center gap-2">
        <span className={clsx('font-display italic font-medium text-[12px]', feature ? 'text-gold' : 'text-gold-deep')}>{idx}</span>
        <span
          className="flex-1 h-px"
          style={{ background: `linear-gradient(90deg, ${feature ? 'rgba(178,147,85,.55)' : 'rgba(201,178,127,1)'} 0%, transparent 90%)` }}
        />
      </div>
      {heroText ? (
        <div className={clsx('font-display italic font-medium text-[19px] leading-tight tracking-tight mt-3', feature ? 'text-gold-pale' : 'text-dark')}>
          {heroText}
        </div>
      ) : (
        <div className={clsx('font-display font-medium text-[32px] leading-[0.9] tracking-tight mt-3', feature ? 'text-gold-pale' : 'text-dark')}>
          {hero}
        </div>
      )}
      <div className="mt-3 flex flex-col gap-1">
        <SmallCaps tone={feature ? 'gold-light' : 'gold-deep'} tracking="luxury" size="xs" as="div" className="whitespace-nowrap">
          {eyebrow}
        </SmallCaps>
        <span className={clsx('font-serif-body italic text-[13px]', feature ? 'text-parchment' : 'text-muted')}>{note}</span>
      </div>
    </div>
  )
}

export default function ProtocolTab({ entries, failures, loading }: ProtocolTabProps) {
  if (loading) {
    return (
      <div className="relative bg-ivory border border-gold-light/40 p-12 text-center">
        <CornerBrackets size={10} tone="gold-light" />
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block animate-pulse" />
        <SmallCaps tone="muted" tracking="luxury" size="xs">Wczytuję dane</SmallCaps>
      </div>
    )
  }

  const total = entries.length

  if (total === 0) {
    return (
      <div className="relative bg-forest-deep grain-linen text-ivory border border-gold-light/30 p-10 text-center">
        <CornerBrackets size={16} tone="gold" weight={1} />
        <Fleuron size={20} className="text-gold mx-auto mb-5 inline-block" />
        <h3 className="font-display text-ivory text-2xl">Brak wpisów</h3>
        <p className="font-serif-body italic text-parchment text-[14px] mt-3 leading-relaxed">
          każde uruchomienie ghost protocol jest tu zapisywane.
          <br />
          mapa podatności pojawi się po {toRoman(MIN_FOR_BASIC)} wpisach.
        </p>
      </div>
    )
  }

  // ── agregaty ──
  const catCounts: Record<string, number> = {}
  for (const c of GHOST_CATEGORIES) catCounts[c.id] = 0
  for (const e of entries) catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  const rankedCats = GHOST_CATEGORIES
    .map(c => ({ ...c, count: catCounts[c.id] }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const topCat = rankedCats[0]
  const maxCatCount = Math.max(1, ...rankedCats.map(c => c.count))

  const avgIntensity = (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1).replace('.', ',')
  const noContactCount = entries.filter(e => !e.hadContact).length
  const noContactPct = Math.round((noContactCount / total) * 100)

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
  const worstDay = dayTotals.indexOf(maxDayTotal)

  const heatLevel = (count: number) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCell) * 4)))

  return (
    <div className="space-y-5">
      {/* Kwartet metryk */}
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-gold-light/40">
        <CornerBrackets size={11} tone="gold-light" />
        <MetricCell feature idx="I" hero={String(noContactCount)} eyebrow="Bez kontaktu" note={`${noContactPct}% wytrwałości`} />
        <MetricCell idx="II" hero={String(total)} eyebrow="Impulsy" note="zauważone i nazwane" />
        <MetricCell idx="III" hero={avgIntensity} eyebrow="Śr. intensywność" note="skala I–V" />
        <MetricCell idx="IV" heroText={topCat.label} eyebrow="Główna kategoria" note={`${Math.round((topCat.count / total) * 100)}% impulsów`} />
      </div>

      {/* Mapa podatności */}
      {total >= MIN_FOR_BASIC && (
        <Panel
          eyebrow="Mapa podatności"
          title="Kiedy najczęściej"
          note={<>kiedy konkretnie najczęściej uruchamiasz protokół. ciemniejsze pole = więcej impulsów.{total < MIN_FOR_FULL_MAP && ` (dane wstępne — ${MIN_FOR_FULL_MAP - total} wpisów do pełnej mapy)`}</>}
        >
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[340px]">
              <div
                className="grid gap-y-1.5 gap-x-1.5"
                style={{ gridTemplateColumns: '78px repeat(7, 1fr)' }}
              >
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
                        <div
                          key={di}
                          className={clsx('h-[30px]', isPeak && 'ring-2 ring-gold ring-offset-1 ring-offset-ivory relative z-10')}
                          style={{ background: HEAT[heatLevel(count)] }}
                          title={`${PL_DAYS_FULL[di]} ${slot.label.toLowerCase()}: ${count}×`}
                        />
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
                {TIME_SLOTS[peakSlot].label.toLowerCase()} ({TIME_SLOTS[peakSlot].range}) — najwrażliwszy moment tygodnia
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* Podatność tygodniowa */}
      {total >= MIN_FOR_BASIC && (
        <Panel eyebrow="Według dnia" title="Podatność tygodniowa" note="łączna liczba impulsów per dzień tygodnia.">
          <div className="mt-5 space-y-1">
            {PL_DAYS_SHORT.map((d, i) => {
              const count = dayTotals[i]
              const pct = Math.round((count / maxDayTotal) * 100)
              const sharePct = Math.round((count / total) * 100)
              const isWorst = i === worstDay && count > 0
              return (
                <div key={d} className="grid items-center gap-4 py-2.5 border-t border-border first:border-t-0" style={{ gridTemplateColumns: '52px 1fr 40px 44px' }}>
                  <span className={clsx('font-ui uppercase text-[10px] tracking-[0.22em]', isWorst ? 'text-wine' : 'text-muted-light')}>{d}</span>
                  <span className="relative h-2" style={{ background: HEAT[0] }}>
                    <span
                      className={clsx('absolute left-0 top-0 h-full transition-all duration-700', isWorst ? 'bg-wine/80' : 'bg-gold')}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="font-display font-medium text-[17px] text-dark text-right tracking-tight tabular-nums">{count}</span>
                  <span className="font-ui text-[9px] tracking-[0.14em] text-muted-light text-right tabular-nums">{sharePct}%</span>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {/* Kategorie impulsów */}
      <Panel eyebrow="Kategorie impulsów" title="Co poprzedza impuls" note="co najczęściej poprzedza impuls — nazwane, policzone, znane.">
        <div className="mt-5">
          {rankedCats.map(cat => {
            const pct = Math.round((cat.count / total) * 100)
            const width = Math.round((cat.count / maxCatCount) * 100)
            return (
              <div key={cat.id} className="grid items-center gap-4 py-2.5 border-t border-border first:border-t-0" style={{ gridTemplateColumns: '30px minmax(0,1fr) 1fr 44px 48px' }}>
                <span className="w-[30px] h-[30px] border border-hairline flex items-center justify-center text-gold-deep">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-[15px] h-[15px]">
                    {CATEGORY_ICON[cat.id]}
                  </svg>
                </span>
                <span className="font-serif-body text-[15px] text-dark leading-snug min-w-0">{cat.label}</span>
                <span className="relative h-2" style={{ background: HEAT[0] }}>
                  <span className="absolute left-0 top-0 h-full bg-gold transition-all duration-700" style={{ width: `${width}%` }} />
                </span>
                <span className="font-ui text-[9px] tracking-[0.16em] text-muted-light text-right tabular-nums">{cat.count}×</span>
                <span className="font-display font-medium text-[17px] text-gold-deep text-right tracking-tight tabular-nums">{pct}%</span>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Uczciwy log */}
      {failures.length > 0 && (
        <Panel eyebrow="Uczciwy log" title="Odwaga przyznania" note="odwaga przyznania się to też dane.">
          <div className="grid grid-cols-2 gap-4 mt-5">
            {[
              { n: String(failures.length), k: 'uczciwych logów' },
              { n: `${Math.round((failures.length / (total + failures.length)) * 100)}%`, k: 'udział trudnych chwil' },
            ].map(c => (
              <div key={c.k} className="relative bg-cream-warm border border-gold-light/30 p-5 text-center">
                <p className="font-display font-medium text-dark text-[21px] leading-none tracking-tight">{c.n}</p>
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2.5 block">{c.k}</SmallCaps>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Dane operacyjne — wstęga inked */}
      {total >= MIN_FOR_FULL_MAP && hasPeak && (
        <section className="relative bg-forest-deep grain-linen text-ivory p-7 sm:p-9 overflow-hidden">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />
          <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div" className="mb-4">Dane operacyjne</SmallCaps>
          <p className="font-serif-body italic text-parchment text-[18px] leading-relaxed">
            najczęściej narażona:{' '}
            <b className="font-display not-italic font-medium text-gold-pale">{PL_DAYS_FULL[peakDay].toLowerCase()} {TIME_SLOTS[peakSlot].label.toLowerCase()}</b>{' '}
            <span className="font-display text-gold-light text-[15px]">{TIME_SLOTS[peakSlot].range}</span>
          </p>
          <span className="block h-px my-5 bg-gradient-to-r from-gold-light/40 to-transparent" />
          <p className="font-serif-body italic text-gold-light text-[15px] leading-relaxed">
            zaplanuj konkretne działanie na ten moment — quest, ruch, telefon do kogoś bliskiego.{' '}
            <em className="text-gold-pale">pasywne czekanie na impuls to stara strategia.</em>
          </p>
        </section>
      )}

      {total < MIN_FOR_FULL_MAP && total >= MIN_FOR_BASIC && (
        <div className="border border-hairline bg-cream/50 p-4 text-center">
          <SmallCaps tone="muted" tracking="luxury" size="xs" className="opacity-80">
            pełna analiza wzorców po {toRoman(MIN_FOR_FULL_MAP)} wpisach · teraz masz {total}
          </SmallCaps>
        </div>
      )}
    </div>
  )
}
