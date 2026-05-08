'use client'
import type { GhostLogEntryV2, HonestFailureEntry } from '@/types'
import { GHOST_CATEGORIES } from '@/lib/ghost-data'

const PL_DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const PL_DAYS_FULL_GP = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

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

export default function ProtocolTab({ entries, failures, loading }: ProtocolTabProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-elegant p-12 text-center">
        <p className="font-sans text-sm text-muted-light">Wczytuję dane...</p>
      </div>
    )
  }

  const total = entries.length

  if (total === 0) {
    return (
      <div className="bg-dark rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🛡️</div>
        <p className="font-serif text-ivory text-lg mb-2">Brak wpisów</p>
        <p className="font-sans text-sm text-ivory/50 leading-relaxed">
          Każde uruchomienie Ghost Protocol jest tu zapisywane.<br />
          Mapa podatności pojawi się po {MIN_FOR_BASIC} wpisach.
        </p>
      </div>
    )
  }

  // Kategorie
  const catCounts: Record<string, number> = {}
  for (const c of GHOST_CATEGORIES) catCounts[c.id] = 0
  for (const e of entries) catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  const topCat = GHOST_CATEGORIES
    .map(c => ({ ...c, count: catCounts[c.id] }))
    .sort((a, b) => b.count - a.count)[0]

  // Średnia intensywność
  const avgIntensity = entries.length
    ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1)
    : '—'

  // Wyniki: bez kontaktu / był kontakt
  const noContactCount = entries.filter(e => !e.hadContact).length

  // Heatmapa
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
    <div className="space-y-6">

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark rounded-2xl p-5 text-center">
          <p className="font-sans text-[10px] text-ivory/40 uppercase tracking-widest mb-2">Impulsy</p>
          <p className="font-serif text-ivory text-3xl">{total}</p>
          {total < MIN_FOR_FULL_MAP && (
            <p className="font-sans text-[10px] text-ivory/30 mt-1">pełna mapa od {MIN_FOR_FULL_MAP}</p>
          )}
        </div>
        <div className="bg-dark rounded-2xl p-5 text-center">
          <p className="font-sans text-[10px] text-ivory/40 uppercase tracking-widest mb-2">Główna kategoria</p>
          <p className="text-2xl mb-1">{topCat.icon}</p>
          <p className="font-sans text-xs text-ivory/70">{topCat.label}</p>
        </div>
        <div className="bg-dark rounded-2xl p-5 text-center">
          <p className="font-sans text-[10px] text-ivory/40 uppercase tracking-widest mb-2">Bez kontaktu</p>
          <p className="font-serif text-ivory text-3xl">{noContactCount}</p>
          <p className="font-sans text-[10px] text-ivory/30 mt-1">
            {total > 0 ? Math.round((noContactCount / total) * 100) : 0}% wytrwałości
          </p>
        </div>
        <div className="bg-dark rounded-2xl p-5 text-center">
          <p className="font-sans text-[10px] text-ivory/40 uppercase tracking-widest mb-2">Śr. intensywność</p>
          <p className="font-serif text-ivory text-3xl">{avgIntensity}</p>
          <p className="font-sans text-[10px] text-ivory/30 mt-1">skala 1–5</p>
        </div>
      </div>

      {/* Heatmapa */}
      {total >= MIN_FOR_BASIC && (
        <div className="bg-dark rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif text-ivory text-base mb-1">Mapa podatności</h2>
          <p className="font-sans text-xs text-ivory/40 mb-5">
            Kiedy konkretnie najczęściej uruchamiasz protokół.
            {total < MIN_FOR_FULL_MAP && ` (dane wstępne — ${MIN_FOR_FULL_MAP - total} wpisów do pełnej mapy)`}
          </p>
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <div className="flex mb-2 ml-16">
                {PL_DAYS_SHORT.map(d => (
                  <div key={d} className="flex-1 text-center font-sans text-[10px] text-ivory/30">{d}</div>
                ))}
              </div>
              {TIME_SLOTS.map((slot, si) => (
                <div key={slot.label} className="flex items-center mb-1.5">
                  <div className="w-16 flex-shrink-0">
                    <p className="font-sans text-[10px] text-ivory/40 leading-tight">{slot.label}</p>
                    <p className="font-sans text-[9px] text-ivory/20">{slot.range}</p>
                  </div>
                  {grid[si].map((count, di) => {
                    const intensity = count / maxCell
                    return (
                      <div key={di} className="flex-1 mx-0.5">
                        <div
                          className="h-7 rounded-md"
                          style={{
                            backgroundColor: count === 0
                              ? 'rgba(255,255,255,0.04)'
                              : `rgba(184,150,62,${0.2 + intensity * 0.8})`,
                          }}
                          title={`${PL_DAYS_FULL_GP[di]} ${slot.label}: ${count}×`}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 ml-16">
                <span className="font-sans text-[10px] text-ivory/30">rzadko</span>
                <div className="flex gap-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map(o => (
                    <div key={o} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(184,150,62,${o})` }} />
                  ))}
                </div>
                <span className="font-sans text-[10px] text-ivory/30">często</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podatność per dzień */}
      {total >= MIN_FOR_BASIC && (
        <div className="bg-dark rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif text-ivory text-base mb-1">Podatność według dnia</h2>
          <p className="font-sans text-xs text-ivory/40 mb-5">Łączna liczba impulsów per dzień tygodnia.</p>
          <div className="space-y-2">
            {PL_DAYS_SHORT.map((d, i) => {
              const count = dayTotals[i]
              const pct = Math.round((count / maxDayTotal) * 100)
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="font-sans text-[11px] text-ivory/40 w-7 flex-shrink-0">{d}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.7)' }}
                    />
                  </div>
                  <span className="font-sans text-[11px] text-ivory/40 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Kategorie */}
      <div className="bg-dark rounded-2xl p-5 sm:p-6">
        <h2 className="font-serif text-ivory text-base mb-1">Kategorie impulsów</h2>
        <p className="font-sans text-xs text-ivory/40 mb-5">Co najczęściej poprzedza impuls.</p>
        <div className="space-y-3">
          {GHOST_CATEGORIES.map(cat => {
            const count = catCounts[cat.id] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            if (count === 0) return null
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="font-sans text-sm text-ivory/70">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-ivory/40">{count}×</span>
                    <span className="font-sans text-xs text-ivory/50 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.6)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Honest Failure Log */}
      {failures.length > 0 && (
        <div className="bg-dark rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif text-ivory text-base mb-1">Uczciwy Log</h2>
          <p className="font-sans text-xs text-ivory/40 mb-4">Odwaga przyznania się jest też danymi.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="font-serif text-ivory text-2xl">{failures.length}</p>
              <p className="font-sans text-[10px] text-ivory/40 mt-1">uczciwe logi</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-ivory text-2xl">
                {total + failures.length > 0
                  ? Math.round((failures.length / (total + failures.length)) * 100)
                  : 0}%
              </p>
              <p className="font-sans text-[10px] text-ivory/40 mt-1">udział trudnych chwil</p>
            </div>
          </div>
        </div>
      )}

      {/* Szczyt podatności */}
      {total >= MIN_FOR_FULL_MAP && hasPeak && (
        <div className="bg-gold/10 border border-gold/20 rounded-2xl p-5">
          <p className="font-sans text-[10px] text-gold/70 uppercase tracking-widest mb-2">Dane operacyjne</p>
          <p className="font-serif text-ivory text-base leading-relaxed">
            Najczęściej narażona:{' '}
            <span className="text-gold">{PL_DAYS_FULL_GP[peakDay].toLowerCase()}</span>{' '}
            {TIME_SLOTS[peakSlot].label} ({TIME_SLOTS[peakSlot].range}).
          </p>
          <p className="font-sans text-xs text-ivory/50 mt-2 leading-relaxed">
            Zaplanuj konkretne działanie na ten moment — quest, ruch, telefon do kogoś bliskiego.
            Pasywne czekanie na impuls to stara strategia.
          </p>
        </div>
      )}

      {total < MIN_FOR_FULL_MAP && total >= MIN_FOR_BASIC && (
        <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-sans text-xs text-ivory/30">
            Pełna analiza wzorców po {MIN_FOR_FULL_MAP} wpisach · teraz masz {total}
          </p>
        </div>
      )}

    </div>
  )
}
