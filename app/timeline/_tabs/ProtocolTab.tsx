'use client'
import type { GhostLogEntryV2, HonestFailureEntry } from '@/types'
import { GHOST_CATEGORIES } from '@/lib/ghost-data'
import { SmallCaps, Diamond, Fleuron, CornerBrackets } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const PL_DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const PL_DAYS_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

const TIME_SLOTS = [
  { label: 'noc',      range: '0–6',   hours: [0,1,2,3,4,5] },
  { label: 'rano',     range: '7–11',  hours: [6,7,8,9,10,11] },
  { label: 'południe', range: '12–16', hours: [12,13,14,15,16] },
  { label: 'wieczór',  range: '17–20', hours: [17,18,19,20] },
  { label: 'późny w.', range: '21–23', hours: [21,22,23] },
]

const MIN_FOR_FULL_MAP = 30
const MIN_FOR_BASIC = 5

interface ProtocolTabProps {
  entries: GhostLogEntryV2[]
  failures: HonestFailureEntry[]
  loading: boolean
}

function DarkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-forest-deep grain-linen text-ivory border border-gold-light/30 ${className}`}>
      {children}
    </div>
  )
}

export default function ProtocolTab({ entries, failures, loading }: ProtocolTabProps) {
  if (loading) {
    return (
      <div className="bg-ivory border border-gold-light/40 p-12 text-center">
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block animate-pulse" />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          Wczytuję dane
        </SmallCaps>
      </div>
    )
  }

  const total = entries.length

  if (total === 0) {
    return (
      <DarkCard className="p-10 text-center">
        <CornerBrackets size={16} tone="gold" weight={1} />
        <Fleuron size={20} className="text-gold mx-auto mb-5 inline-block" />
        <h3 className="font-display text-ivory text-2xl">Brak wpisów</h3>
        <p className="font-serif-body italic text-parchment text-[14px] mt-3 leading-relaxed">
          każde uruchomienie ghost protocol jest tu zapisywane.
          <br />
          mapa podatności pojawi się po {toRoman(MIN_FOR_BASIC)} wpisach.
        </p>
      </DarkCard>
    )
  }

  const catCounts: Record<string, number> = {}
  for (const c of GHOST_CATEGORIES) catCounts[c.id] = 0
  for (const e of entries) catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  const topCat = GHOST_CATEGORIES
    .map(c => ({ ...c, count: catCounts[c.id] }))
    .sort((a, b) => b.count - a.count)[0]

  const avgIntensity = entries.length
    ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1)
    : '—'

  const noContactCount = entries.filter(e => !e.hadContact).length

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

  return (
    <div className="space-y-5">
      {/* Stats grid — wszystkie dark karty */}
      <div className="grid grid-cols-2 gap-3">
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Impulsy
          </SmallCaps>
          <p className="font-display text-ivory text-3xl leading-none">{total}</p>
          {total < MIN_FOR_FULL_MAP && (
            <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
              pełna mapa od {toRoman(MIN_FOR_FULL_MAP)}
            </SmallCaps>
          )}
        </DarkCard>
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Główna kategoria
          </SmallCaps>
          <p className="text-2xl mb-1 leading-none">{topCat.icon}</p>
          <SmallCaps tone="parchment" tracking="luxury" size="xs">
            {topCat.label}
          </SmallCaps>
        </DarkCard>
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Bez kontaktu
          </SmallCaps>
          <p className="font-display text-ivory text-3xl leading-none">{noContactCount}</p>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
            {total > 0 ? Math.round((noContactCount / total) * 100) : 0}% wytrwałości
          </SmallCaps>
        </DarkCard>
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Śr. intensywność
          </SmallCaps>
          <p className="font-display text-ivory text-3xl leading-none">{avgIntensity}</p>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
            skala I–V
          </SmallCaps>
        </DarkCard>
      </div>

      {/* Heatmap */}
      {total >= MIN_FOR_BASIC && (
        <DarkCard className="p-5 sm:p-6">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
            Mapa podatności
          </SmallCaps>
          <h2 className="font-display text-ivory text-xl mt-1">Kiedy najczęściej</h2>
          <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5 leading-relaxed">
            kiedy konkretnie najczęściej uruchamiasz protokół.
            {total < MIN_FOR_FULL_MAP && ` (dane wstępne — ${MIN_FOR_FULL_MAP - total} wpisów do pełnej mapy)`}
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <div className="flex mb-2 ml-16">
                {PL_DAYS_SHORT.map(d => (
                  <SmallCaps
                    key={d}
                    tone="parchment"
                    tracking="luxury"
                    size="xs"
                    className="flex-1 text-center opacity-50"
                  >
                    {d}
                  </SmallCaps>
                ))}
              </div>
              {TIME_SLOTS.map((slot, si) => (
                <div key={slot.label} className="flex items-center mb-1.5">
                  <div className="w-16 shrink-0">
                    <SmallCaps tone="parchment" tracking="luxury" size="xs" as="div" className="opacity-70">
                      {slot.label}
                    </SmallCaps>
                    <p className="font-ui text-[9px] text-parchment/30 mt-0.5">{slot.range}</p>
                  </div>
                  {grid[si].map((count, di) => {
                    const intensity = count / maxCell
                    return (
                      <div key={di} className="flex-1 mx-0.5">
                        <div
                          className="h-7"
                          style={{
                            backgroundColor: count === 0
                              ? 'rgba(255,255,255,0.04)'
                              : `rgba(184,150,62,${0.2 + intensity * 0.8})`,
                          }}
                          title={`${PL_DAYS_FULL[di]} ${slot.label}: ${count}×`}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-4 ml-16">
                <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-50">
                  rzadko
                </SmallCaps>
                <div className="flex gap-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map(o => (
                    <div
                      key={o}
                      className="w-4 h-3"
                      style={{ backgroundColor: `rgba(184,150,62,${o})` }}
                    />
                  ))}
                </div>
                <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-50">
                  często
                </SmallCaps>
              </div>
            </div>
          </div>
        </DarkCard>
      )}

      {/* Per-day */}
      {total >= MIN_FOR_BASIC && (
        <DarkCard className="p-5 sm:p-6">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
            Według dnia
          </SmallCaps>
          <h2 className="font-display text-ivory text-xl mt-1">Podatność tygodniowa</h2>
          <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5">
            łączna liczba impulsów per dzień tygodnia.
          </p>
          <div className="space-y-2.5">
            {PL_DAYS_SHORT.map((d, i) => {
              const count = dayTotals[i]
              const pct = Math.round((count / maxDayTotal) * 100)
              return (
                <div key={d} className="flex items-center gap-3">
                  <SmallCaps tone="parchment" tracking="luxury" size="xs" className="w-8 shrink-0 opacity-70">
                    {d}
                  </SmallCaps>
                  <div className="flex-1 h-px relative" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="absolute left-0 top-0 h-px transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.7)' }}
                    />
                  </div>
                  <span className="font-ui text-[11px] text-parchment/70 w-5 text-right tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </DarkCard>
      )}

      {/* Categories */}
      <DarkCard className="p-5 sm:p-6">
        <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
          Kategorie impulsów
        </SmallCaps>
        <h2 className="font-display text-ivory text-xl mt-1">Co poprzedza impuls</h2>
        <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5">
          co najczęściej poprzedza impuls.
        </p>
        <div className="space-y-3">
          {GHOST_CATEGORIES.map(cat => {
            const count = catCounts[cat.id] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            if (count === 0) return null
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <SmallCaps tone="parchment" tracking="luxury" size="xs">
                      {cat.label}
                    </SmallCaps>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
                      {count}×
                    </SmallCaps>
                    <SmallCaps tone="gold-light" tracking="luxury" size="xs" className="w-8 text-right">
                      {pct}%
                    </SmallCaps>
                  </div>
                </div>
                <div className="h-px relative" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="absolute left-0 top-0 h-px transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.7)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </DarkCard>

      {/* Honest log */}
      {failures.length > 0 && (
        <DarkCard className="p-5 sm:p-6">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
            Uczciwy Log
          </SmallCaps>
          <h2 className="font-display text-ivory text-xl mt-1">Odwaga przyznania</h2>
          <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5">
            odwaga przyznania się jest też danymi.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="font-display text-ivory text-3xl leading-none">{failures.length}</p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">
                uczciwe logi
              </SmallCaps>
            </div>
            <div className="text-center">
              <p className="font-display text-ivory text-3xl leading-none">
                {total + failures.length > 0
                  ? Math.round((failures.length / (total + failures.length)) * 100)
                  : 0}%
              </p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">
                udział trudnych chwil
              </SmallCaps>
            </div>
          </div>
        </DarkCard>
      )}

      {/* Peak insight */}
      {total >= MIN_FOR_FULL_MAP && hasPeak && (
        <div className="relative bg-gold/10 border border-gold/40 p-5">
          <SmallCaps tone="gold-deep" tracking="editorial" size="xs" as="div" className="mb-2">
            <span className="!text-gold">Dane operacyjne</span>
          </SmallCaps>
          <p className="font-serif-body italic text-ivory text-[14px] leading-relaxed">
            najczęściej narażona:{' '}
            <span className="not-italic font-heading text-gold">
              {PL_DAYS_FULL[peakDay].toLowerCase()}
            </span>{' '}
            {TIME_SLOTS[peakSlot].label} ({TIME_SLOTS[peakSlot].range}).
          </p>
          <p className="font-serif-body italic text-parchment/80 text-[12.5px] mt-2 leading-relaxed">
            zaplanuj konkretne działanie na ten moment — quest, ruch, telefon do kogoś bliskiego.
            pasywne czekanie na impuls to stara strategia.
          </p>
        </div>
      )}

      {total < MIN_FOR_FULL_MAP && total >= MIN_FOR_BASIC && (
        <div className="border border-ivory/15 bg-ivory/5 p-4 text-center">
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-50">
            pełna analiza wzorców po {toRoman(MIN_FOR_FULL_MAP)} wpisach · teraz masz {total}
          </SmallCaps>
        </div>
      )}
    </div>
  )
}
