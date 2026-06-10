'use client'
// Zakładka „Oddech" — papierosy jako dane, nie wyrok (PLAN_PALENIE.md).
// Zasady tonu: zero czerwieni, zero języka porażki, spokojny licznik kilometrów.
import { useState } from 'react'
import type { DailyLog, SmokingPhase } from '@/types'
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
  { label: 'noc',      range: '0–6',   hours: [0,1,2,3,4,5] },
  { label: 'rano',     range: '7–11',  hours: [6,7,8,9,10,11] },
  { label: 'południe', range: '12–16', hours: [12,13,14,15,16] },
  { label: 'wieczór',  range: '17–20', hours: [17,18,19,20] },
  { label: 'późny w.', range: '21–23', hours: [21,22,23] },
]

const MIN_FOR_HEATMAP = 10

interface OddechTabProps {
  logs: Record<string, DailyLog>
  loading: boolean
}

function DarkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-forest-deep grain-linen text-ivory border border-gold-light/30 ${className}`}>
      {children}
    </div>
  )
}

function formatDayMonth(dateKey: string): string {
  const [, m, d] = dateKey.split('-').map(Number)
  return `${d}.${String(m).padStart(2, '0')}`
}

export default function OddechTab({ logs, loading }: OddechTabProps) {
  const { stats, startSmokingPhase } = useGameData()
  const { addToast } = useToast()
  const [confirmingPhase, setConfirmingPhase] = useState<SmokingPhase | null>(null)
  const [saving, setSaving] = useState(false)

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

  const phase: SmokingPhase = stats.cigarettesPhase ?? 1
  const phaseMeta = SMOKING_PHASE_META[phase]
  const yesterday = shiftDateKey(todayKey(), -1)

  // Baza liczona do wczoraj (dzisiejszy dzień jest w toku); wykresy biorą całość.
  const baselineCounts = dailyCigaretteCounts(logs, yesterday)
  const allCounts = dailyCigaretteCounts(logs)
  const entries = collectEntries(logs)
  const baselineReport = computeBaseline(baselineCounts)
  const rolling7 = rollingAverage(allCounts, yesterday, 7)
  const weeks = weeklyAverages(allCounts)

  if (allCounts.length === 0) {
    return (
      <DarkCard className="p-10 text-center">
        <CornerBrackets size={16} tone="gold" weight={1} />
        <Fleuron size={20} className="text-gold mx-auto mb-5 inline-block" />
        <h3 className="font-display text-ivory text-2xl">Spokojny licznik</h3>
        <p className="font-serif-body italic text-parchment text-[14px] mt-3 leading-relaxed">
          każdy zalogowany papieros trafia tutaj.
          <br />
          to są dane, nie ocena — wzorce pojawią się same.
        </p>
      </DarkCard>
    )
  }

  const total = entries.length
  const withContext = entries.filter(e => e.context).length

  // Konteksty
  const ctxCounts: Record<string, number> = {}
  for (const e of entries) {
    const key = e.context ?? '__none'
    ctxCounts[key] = (ctxCounts[key] ?? 0) + 1
  }
  const noContextCount = ctxCounts['__none'] ?? 0
  const contextRows = CIGARETTE_CONTEXTS
    .map(c => ({ id: c.id as string, icon: c.icon, label: c.label, count: ctxCounts[c.id] ?? 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const topCtx = contextRows[0] ?? null

  // Heatmapa pora dnia × dzień tygodnia
  const grid: number[][] = Array.from({ length: TIME_SLOTS.length }, () => Array(7).fill(0))
  for (const e of entries) {
    const slotIdx = TIME_SLOTS.findIndex(s => s.hours.includes(e.hour))
    if (slotIdx >= 0 && e.weekday >= 0 && e.weekday <= 6) grid[slotIdx][e.weekday]++
  }
  const maxCell = Math.max(1, ...grid.flat())

  const maxWeekAvg = Math.max(1, ...weeks.map(w => w.avg))
  const targetRange = stats.cigarettesBaseline != null
    ? phase2TargetRange(stats.cigarettesBaseline)
    : baselineReport
      ? phase2TargetRange(baselineReport.avgPerDay)
      : null

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
      {/* Faza — gdzie jesteś w planie */}
      <DarkCard className="p-5 sm:p-6">
        <CornerBrackets size={12} tone="gold" weight={1} />
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
              Plan w pięciu fazach
            </SmallCaps>
            <h2 className="font-display text-ivory text-xl mt-1">
              Faza {toRoman(phase)} — {phaseMeta.label}
            </h2>
          </div>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
            {phaseMeta.period}
          </SmallCaps>
        </div>
        <p className="font-serif-body italic text-parchment text-[13.5px] mt-3 leading-relaxed">
          {PHASE_GENTLE_HINT[phase]}
        </p>

        {phase >= 2 && (
          <div className="mt-5 pt-4 border-t border-ivory/10 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-ivory text-2xl leading-none">
                {stats.cigarettesBaseline ?? '—'}
              </p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">
                baza z fazy I
              </SmallCaps>
            </div>
            <div>
              <p className="font-display text-ivory text-2xl leading-none">
                {targetRange ? `${targetRange.lo}–${targetRange.hi}` : '—'}
              </p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">
                cel miękki / dzień
              </SmallCaps>
            </div>
            <div>
              <p className="font-display text-gold-pale text-2xl leading-none">
                {rolling7 ?? '—'}
              </p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-60">
                średnia 7 dni
              </SmallCaps>
            </div>
          </div>
        )}

        {stats.cigarettesPhaseStartDate && (
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-4 block opacity-40">
            w tej fazie od {formatDayMonth(stats.cigarettesPhaseStartDate)}
          </SmallCaps>
        )}
      </DarkCard>

      {/* Zamknięcie fazy I — raport bazowy + przejście */}
      {phase === 1 && baselineReport && (
        baselineReport.daysWithData >= MIN_DAYS_FOR_BASELINE ? (
          <div className="relative bg-gold/10 border border-gold/40 p-5 sm:p-6">
            <SmallCaps tone="gold-deep" tracking="editorial" size="xs" as="div" className="mb-2">
              Raport bazowy
            </SmallCaps>
            <h3 className="font-display text-dark text-xl">Zamknięcie fazy I</h3>
            <p className="font-serif-body italic text-muted text-[13.5px] mt-2 leading-relaxed">
              {toRoman(baselineReport.daysWithData)} dni obserwacji (do wczoraj), łącznie{' '}
              {baselineReport.total} zalogowanych. to jest twoja waluta — dane bazowe całego planu.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-ivory border border-gold-light/40 p-4 text-center">
                <p className="font-display text-dark text-3xl leading-none tabular-nums">
                  {baselineReport.avgPerDay}
                </p>
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">
                  średnia / dzień — baza
                </SmallCaps>
              </div>
              <div className="bg-ivory border border-gold-light/40 p-4 text-center">
                <p className="font-display text-dark text-3xl leading-none tabular-nums">
                  {targetRange ? `${targetRange.lo}–${targetRange.hi}` : '—'}
                </p>
                <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block">
                  cel miękki fazy II
                </SmallCaps>
              </div>
            </div>
            <p className="font-serif-body italic text-muted text-[12.5px] mt-3 leading-relaxed">
              faza II („{SMOKING_PHASE_META[2].label.toLowerCase()}", {SMOKING_PHASE_META[2].period}):
              −15–25% od bazy, mikro-eliminacje pojedynczo. papieros zostaje w grze,
              ale przestaje być jedyną kartą.
            </p>

            {confirmingPhase === 2 ? (
              <div className="mt-5">
                <p className="font-serif-body italic text-dark text-[13.5px] mb-3">
                  zapisuję bazę {baselineReport.avgPerDay} / dzień i otwieram fazę II — na pewno?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartPhase(2, baselineReport.avgPerDay)}
                    disabled={saving}
                    className="flex-1 py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-all disabled:opacity-50"
                  >
                    <SmallCaps tone="ivory" tracking="luxury" size="xs">
                      {saving ? 'zapisuję…' : 'tak — rozpoczynam fazę II'}
                    </SmallCaps>
                  </button>
                  <button
                    onClick={() => setConfirmingPhase(null)}
                    disabled={saving}
                    className="px-5 py-3 border border-hairline text-dark hover:border-gold transition-colors"
                  >
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      jeszcze nie
                    </SmallCaps>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingPhase(2)}
                className="mt-5 w-full py-3.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-all flex items-center justify-center gap-2"
              >
                <Diamond size={5} className="text-gold" />
                <SmallCaps tone="ivory" tracking="luxury" size="xs">
                  Rozpoczynam fazę II
                </SmallCaps>
              </button>
            )}
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-3 block text-center opacity-60">
              planowy start: lipiec 2026 · decyzja należy do ciebie
            </SmallCaps>
          </div>
        ) : (
          <div className="border border-ivory/15 bg-ivory/5 p-4 text-center">
            <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-50">
              raport bazowy od {toRoman(MIN_DAYS_FOR_BASELINE)} dni danych · teraz masz{' '}
              {toRoman(baselineReport.daysWithData)}
            </SmallCaps>
          </div>
        )
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Średnia / dzień
          </SmallCaps>
          <p className="font-display text-ivory text-3xl leading-none tabular-nums">
            {baselineReport?.avgPerDay ?? '—'}
          </p>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
            cały okres obserwacji
          </SmallCaps>
        </DarkCard>
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Średnia 7 dni
          </SmallCaps>
          <p className="font-display text-ivory text-3xl leading-none tabular-nums">
            {rolling7 ?? '—'}
          </p>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
            trend, nie pojedynczy dzień
          </SmallCaps>
        </DarkCard>
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Dni z danymi
          </SmallCaps>
          <p className="font-display text-ivory text-3xl leading-none tabular-nums">
            {allCounts.length}
          </p>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
            od {formatDayMonth(allCounts[0].date)}
          </SmallCaps>
        </DarkCard>
        <DarkCard className="p-5 text-center">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2 opacity-70">
            Główny kontekst
          </SmallCaps>
          {topCtx ? (
            <>
              <p className="text-2xl mb-1 leading-none">{topCtx.icon}</p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs">
                {topCtx.label}
              </SmallCaps>
            </>
          ) : (
            <>
              <p className="font-display text-ivory text-3xl leading-none">—</p>
              <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-2 block opacity-50">
                loguj z kontekstem
              </SmallCaps>
            </>
          )}
        </DarkCard>
      </div>

      {/* Trend tygodniowy */}
      {weeks.length >= 2 && (
        <DarkCard className="p-5 sm:p-6">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
            Trend tygodniowy
          </SmallCaps>
          <h2 className="font-display text-ivory text-xl mt-1">Średnia dzienna per tydzień</h2>
          <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5">
            patrz na linię, nie na pojedyncze dni.
          </p>
          <div className="space-y-2.5">
            {weeks.map(w => {
              const pct = Math.round((w.avg / maxWeekAvg) * 100)
              return (
                <div key={w.weekStart} className="flex items-center gap-3">
                  <SmallCaps tone="parchment" tracking="luxury" size="xs" className="w-12 shrink-0 opacity-70 tabular-nums">
                    {formatDayMonth(w.weekStart)}
                  </SmallCaps>
                  <div className="flex-1 h-px relative" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="absolute left-0 top-0 h-px transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: 'rgba(184,150,62,0.7)' }}
                    />
                  </div>
                  <span className="font-ui text-[11px] text-parchment/70 w-9 text-right tabular-nums">
                    {w.avg}
                  </span>
                </div>
              )
            })}
          </div>
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-4 block opacity-40">
            tydzień oznaczony datą poniedziałku · średnia po dniach z danymi
          </SmallCaps>
        </DarkCard>
      )}

      {/* Heatmapa pora dnia × dzień tygodnia */}
      {total >= MIN_FOR_HEATMAP && (
        <DarkCard className="p-5 sm:p-6">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
            Mapa wzorca
          </SmallCaps>
          <h2 className="font-display text-ivory text-xl mt-1">Kiedy najczęściej</h2>
          <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5 leading-relaxed">
            najmocniejsze pasy to twoje konteksty do mikro-eliminacji w fazie II–III.
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

      {/* Konteksty */}
      {contextRows.length > 0 && (
        <DarkCard className="p-5 sm:p-6">
          <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div">
            Konteksty
          </SmallCaps>
          <h2 className="font-display text-ivory text-xl mt-1">Po czym sięgasz</h2>
          <p className="font-serif-body italic text-parchment text-[13px] mt-1 mb-5">
            największy słupek = pierwszy kandydat do mikro-eliminacji.
          </p>
          <div className="space-y-3">
            {contextRows.map(ctx => {
              const pct = withContext > 0 ? Math.round((ctx.count / withContext) * 100) : 0
              return (
                <div key={ctx.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{ctx.icon}</span>
                      <SmallCaps tone="parchment" tracking="luxury" size="xs">
                        {ctx.label}
                      </SmallCaps>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
                        {ctx.count}×
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
          {noContextCount > 0 && (
            <SmallCaps tone="parchment" tracking="luxury" size="xs" className="mt-4 block opacity-40">
              {noContextCount}× bez kontekstu ({Math.round((noContextCount / total) * 100)}% wszystkich) ·
              procenty liczone wśród zalogowanych z kontekstem
            </SmallCaps>
          )}
        </DarkCard>
      )}

      {/* Przejście do kolejnej fazy (II→III, III→IV, …) — dyskretnie, bez presji */}
      {phase >= 2 && nextPhase && (
        <div className="border border-ivory/15 bg-ivory/5 p-4">
          {confirmingPhase === nextPhase ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                rozpocząć fazę {toRoman(nextPhase)} — {SMOKING_PHASE_META[nextPhase].label.toLowerCase()}?
              </SmallCaps>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartPhase(nextPhase)}
                  disabled={saving}
                  className="px-4 py-2 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-all disabled:opacity-50"
                >
                  <SmallCaps tone="ivory" tracking="luxury" size="xs">
                    {saving ? 'zapisuję…' : 'tak'}
                  </SmallCaps>
                </button>
                <button
                  onClick={() => setConfirmingPhase(null)}
                  disabled={saving}
                  className="px-4 py-2 border border-hairline text-dark hover:border-gold transition-colors"
                >
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    nie
                  </SmallCaps>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingPhase(nextPhase)}
              className="w-full text-center group"
            >
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
