'use client'
import { useState, useMemo, useEffect } from 'react'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { useTimelineData } from '@/hooks/useTimelineData'
import {
  CYCLE_PHASES, getPhaseForDate, getPhaseIdForDate, computePhaseRanges,
  type CyclePhase, type CycleSettings,
} from '@/lib/cycle-data'
import { Fleuron } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'
import { todayKey } from '@/lib/gameLogic'

// ── Ciepłe akcenty faz (kierunek „Bloom") — tylko ta strona ──────
const ACCENT: Record<string, { c: string; cd: string }> = {
  menstruacja: { c: '#C66A5E', cd: '#9C4B41' },
  folikularna: { c: '#94A36A', cd: '#61703F' },
  owulacyjna:  { c: '#D3A050', cd: '#94732F' },
  lutealna:    { c: '#C07EA0', cd: '#99547B' },
}
const MAUVE = '#C07EA0'
const MAUVE_D = '#99547B'
const ORDER = ['menstruacja', 'folikularna', 'owulacyjna', 'lutealna'] as const
const ENERGY_WORD: Record<string, string> = {
  menstruacja: 'odpoczynek', folikularna: 'energia rośnie', owulacyjna: 'szczyt mocy', lutealna: 'energia opada',
}

function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function Corners() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l border-gold-light/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold-light/70" />
    </>
  )
}
function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="relative bg-ivory border border-hairline p-6 md:px-8 md:py-7 mb-6">
      <Corners />
      <div className="flex items-center gap-2.5 font-ui uppercase tracking-editorial text-[10px] text-gold-deep mb-5">
        <span className="text-gold text-[8px]">◆</span> {label}
      </div>
      {children}
    </section>
  )
}

// ── Pierścień cyklu ──────────────────────────────────────────────
function CycleRing({ cycleDay, settings, phase }: { cycleDay: number; settings: CycleSettings; phase: CyclePhase }) {
  const ranges = computePhaseRanges(settings)
  const C = settings.cycleLength
  let deg = 0
  const segs = ORDER.map(id => {
    const [from, to] = ranges[id]
    const span = Math.max(0, (to - from + 1)) / C * 360
    const s = `${ACCENT[id].c} ${deg}deg ${deg + span}deg`
    deg += span
    return s
  }).join(', ')

  // znacznik dnia: ułamek cyklu → kąt od góry, zgodnie z ruchem wskazówek
  const frac = Math.min(cycleDay, C) / C
  const angle = frac * 2 * Math.PI
  const r = 100, cx = 116, cy = 116
  const mx = cx + r * Math.sin(angle)
  const my = cy - r * Math.cos(angle)
  const acc = ACCENT[phase.id]

  return (
    <div className="relative w-[232px] h-[232px] max-w-full mx-auto shrink-0">
      <div
        className="w-[232px] h-[232px] rounded-full"
        style={{
          background: `conic-gradient(${segs})`,
          WebkitMask: 'radial-gradient(circle, transparent 0 83px, #000 84px)',
          mask: 'radial-gradient(circle, transparent 0 83px, #000 84px)',
        }}
      />
      <div className="absolute inset-[32px] rounded-full bg-ivory border border-border flex flex-col items-center justify-center text-center">
        <div className="font-ui uppercase tracking-editorial text-[9px]" style={{ color: acc.cd }}>{phase.name}</div>
        <div className="font-display font-medium text-[40px] leading-[0.84] text-dark tracking-[-1.2px] mt-1.5">{cycleDay}</div>
        <div className="font-serif-body italic text-[13px] text-muted-light mt-0.5">z {C} dni</div>
      </div>
      <div
        className="absolute w-4 h-4 rounded-full bg-ivory shadow-[0_2px_7px_rgba(0,0,0,0.22)]"
        style={{ left: mx - 8, top: my - 8, border: `2px solid ${acc.cd}` }}
      >
        <span className="absolute inset-[3.5px] rounded-full" style={{ background: acc.c }} />
      </div>
    </div>
  )
}

// ── Karta bieżącej fazy ──────────────────────────────────────────
function PhaseCard({ phase, settings }: { phase: CyclePhase; settings: CycleSettings }) {
  const [from, to] = computePhaseRanges(settings)[phase.id]
  const acc = ACCENT[phase.id]
  return (
    <div>
      <div className="inline-flex items-center gap-2.5 font-ui uppercase tracking-luxury text-[10px]" style={{ color: acc.cd }}>
        <span className="text-[7px]" style={{ color: acc.c }}>◆</span> Bieżąca faza · dzień {from}–{to}
      </div>
      <h2 className="font-display font-medium text-[24px] text-dark tracking-[-0.4px] mt-2.5">{phase.name}</h2>
      <p className="font-serif-body italic text-[15px] text-dark leading-[1.5] mt-3 max-w-[52ch]">{phase.description}</p>
      <ul className="mt-4">
        {phase.tips.map((tip, i) => (
          <li key={i} className="relative pl-6 py-2.5 border-t border-border font-serif-body italic text-[14px] text-muted">
            <span className="absolute left-0.5 top-3.5 text-[7px]" style={{ color: acc.c }}>◆</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Legenda faz ──────────────────────────────────────────────────
function Legend({ settings, currentId }: { settings: CycleSettings; currentId: string }) {
  const ranges = computePhaseRanges(settings)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {ORDER.map(id => {
        const phase = CYCLE_PHASES.find(p => p.id === id)!
        const [from, to] = ranges[id]
        const acc = ACCENT[id]
        const now = id === currentId
        return (
          <div
            key={id}
            className="relative bg-cream border px-3.5 py-3 overflow-hidden"
            style={{ borderColor: now ? acc.c : undefined }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: acc.c }} />
            {now && (
              <span className="absolute right-2 top-2 font-ui uppercase tracking-[0.22em] text-[7px] text-white px-1.5 py-0.5" style={{ background: acc.cd }}>Teraz</span>
            )}
            <div className="font-display italic font-medium text-[16px] text-dark pl-1.5">{phase.name}</div>
            <div className="font-ui uppercase tracking-[0.22em] text-[8px] text-muted-light mt-1.5 pl-1.5">Dzień {from}–{to} · {to - from + 1} dni</div>
            <div className="font-serif-body italic text-[12.5px] text-muted mt-1.5 pl-1.5">{ENERGY_WORD[id]}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Krzywa energii i nastroju z realnych pomiarów ────────────────
function EnergyCurve({ startDate, cycleDay, settings, dailyLogs }: {
  startDate: string; cycleDay: number; settings: CycleSettings; dailyLogs: Record<string, any>
}) {
  const C = settings.cycleLength
  const ranges = computePhaseRanges(settings)
  const W = 864, H = 210

  const points = useMemo(() => {
    const out: { day: number; energy: number | null; mood: number | null }[] = []
    for (let off = 0; off < cycleDay; off++) {
      const log = dailyLogs[addDays(startDate, off)]
      const ci = log?.moodCheckIns ?? []
      if (ci.length > 0) {
        out.push({
          day: off + 1,
          energy: ci.reduce((s: number, c: any) => s + c.energy, 0) / ci.length,
          mood: ci.reduce((s: number, c: any) => s + c.mood, 0) / ci.length,
        })
      }
    }
    return out
  }, [startDate, cycleDay, dailyLogs])

  // Spójna skala „komórek dni": dzień d → środek komórki; pasma faz pokrywają pełne komórki.
  const x = (day: number) => ((day - 0.5) / C) * W
  const bandX = (from: number) => ((from - 1) / C) * W
  const bandW = (from: number, to: number) => ((to - from + 1) / C) * W
  const y = (val: number) => H - ((val - 1) / 4) * (H - 16)
  const line = (key: 'energy' | 'mood') =>
    points.filter(p => p[key] != null).map(p => `${x(p.day).toFixed(1)},${y(p[key] as number).toFixed(1)}`).join(' ')

  if (points.length < 2) {
    return (
      <p className="font-serif-body italic text-muted-light text-[13.5px] text-center py-4">
        za mało pomiarów w tym cyklu — loguj energię i nastrój, a krzywa pojawi się tutaj.
      </p>
    )
  }

  const todayX = x(cycleDay)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div className="font-display font-medium text-[16px] text-dark">Energia i nastrój w cyklu</div>
        <div className="flex gap-5">
          <span className="flex items-center gap-2 font-ui uppercase tracking-[0.22em] text-[9px] text-muted">
            <i className="inline-block w-4 border-t-2" style={{ borderColor: MAUVE_D }} /> Energia
          </span>
          <span className="flex items-center gap-2 font-ui uppercase tracking-[0.22em] text-[9px] text-muted">
            <i className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: '#B56A6A' }} /> Nastrój
          </span>
        </div>
      </div>
      <p className="font-serif-body italic text-[13px] text-muted mb-3">z Twoich pomiarów · ten cykl · dzień {cycleDay} z {C}</p>
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full h-auto block">
        {ORDER.map(id => {
          const [from, to] = ranges[id]
          return <rect key={id} x={bandX(from)} y={0} width={bandW(from, to)} height={H} fill={ACCENT[id].c} opacity={0.08} />
        })}
        {[50, 100, 150, 205].map(gy => <line key={gy} x1={0} y1={gy} x2={W} y2={gy} stroke="#e5dcc1" strokeWidth={1} />)}
        <line x1={todayX} y1={6} x2={todayX} y2={H} stroke={MAUVE_D} strokeWidth={1.2} strokeDasharray="4 5" />
        <text x={todayX} y={4} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={9} letterSpacing={2} fill={MAUVE_D}>DZIŚ</text>
        <polyline points={line('mood')} fill="none" stroke="#B56A6A" strokeWidth={1.8} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line('energy')} fill="none" stroke={MAUVE_D} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.filter(p => p.energy != null).map(p => (
          <circle key={p.day} cx={x(p.day)} cy={y(p.energy as number)} r={2.6} fill={MAUVE_D} />
        ))}
      </svg>
      <div className="relative h-5 mt-2">
        {ORDER.map(id => {
          const [from, to] = ranges[id]
          const mid = ((from - 1 + to) / 2) / C * 100
          return (
            <span key={id} className="absolute -translate-x-1/2 font-ui uppercase tracking-[0.16em] text-[9px]" style={{ left: `${mid}%`, color: ACCENT[id].cd }}>
              {CYCLE_PHASES.find(p => p.id === id)!.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Insights (Wzorce) ────────────────────────────────────────────
function Insights({ logs, dailyLogs, settings, startDate, cycleDay }: {
  logs: ReturnType<typeof useCycleData>['logs']
  dailyLogs: Record<string, any>
  settings: CycleSettings
  startDate: string | null
  cycleDay: number
}) {
  const insights = useMemo(() => {
    if (logs.length < 2) return null
    const ps: Record<string, { xpSum: number; energySum: number; moodSum: number; count: number; ghostCount: number }> = {
      menstruacja: { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
      folikularna: { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
      owulacyjna:  { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
      lutealna:    { xpSum: 0, energySum: 0, moodSum: 0, count: 0, ghostCount: 0 },
    }
    for (const [dk, log] of Object.entries(dailyLogs)) {
      const phaseId = getPhaseIdForDate(logs, dk, settings)
      if (!phaseId) continue
      const stat = ps[phaseId]
      stat.count++
      stat.xpSum += log.totalXP ?? 0
      if (log.ghostProtocolCompleted) stat.ghostCount++
      const ci = log.moodCheckIns ?? []
      if (ci.length > 0) {
        stat.energySum += ci.reduce((s: number, c: any) => s + c.energy, 0) / ci.length
        stat.moodSum += ci.reduce((s: number, c: any) => s + c.mood, 0) / ci.length
      }
    }
    return CYCLE_PHASES.map(p => {
      const s = ps[p.id]
      return {
        phase: p,
        avgXP: s.count > 0 ? Math.round(s.xpSum / s.count) : null,
        avgEnergy: s.count > 0 && s.energySum > 0 ? +(s.energySum / s.count).toFixed(1) : null,
        avgMood: s.count > 0 && s.moodSum > 0 ? +(s.moodSum / s.count).toFixed(1) : null,
        ghostCount: s.ghostCount,
        days: s.count,
      }
    })
  }, [logs, dailyLogs, settings])

  return (
    <>
      <Panel label="Krzywa energii i nastroju">
        {startDate
          ? <EnergyCurve startDate={startDate} cycleDay={cycleDay} settings={settings} dailyLogs={dailyLogs} />
          : <p className="font-serif-body italic text-muted-light text-[13.5px] text-center py-4">zaloguj cykl, aby zobaczyć krzywą.</p>}
      </Panel>

      {!insights ? (
        <Panel label="Wzorce">
          <p className="font-serif-body italic text-muted text-[13.5px] leading-relaxed">
            po zalogowaniu co najmniej 2 cykli zobaczysz tu średnie XP, energię i nastrój według fazy.
          </p>
        </Panel>
      ) : (
        <>
          <Panel label="Średnie XP na dzień według fazy">
            <div>
              {[...insights].sort((a, b) => (b.avgXP ?? 0) - (a.avgXP ?? 0)).map(item => {
                const max = Math.max(...insights.map(i => i.avgXP ?? 0), 1)
                const acc = ACCENT[item.phase.id]
                return (
                  <div key={item.phase.id} className="grid grid-cols-[minmax(120px,210px)_1fr_auto] gap-4 md:gap-5 items-center py-2.5 border-b border-border last:border-0">
                    <div className="font-display font-medium text-[16px] text-dark flex items-baseline gap-2.5 min-w-0">
                      <span className="text-[9px]" style={{ color: acc.c }}>◆</span>
                      <span className="truncate">{item.phase.name}</span>
                      <small className="font-ui text-[9px] tracking-[0.22em] text-muted-light uppercase whitespace-nowrap">{item.days} dni</small>
                    </div>
                    <div className="relative h-[3px] bg-border">
                      <span className="absolute left-0 top-0 h-[3px]" style={{ width: `${((item.avgXP ?? 0) / max) * 100}%`, background: acc.c }} />
                    </div>
                    <div className="font-display font-medium text-[16px] tracking-[-0.2px] whitespace-nowrap text-right" style={{ color: acc.cd }}>
                      {item.avgXP ?? '—'}<small className="font-ui text-[9px] tracking-[0.22em] text-muted-light uppercase ml-1">XP</small>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel label="Nastrój i energia według fazy">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {insights.map(item => {
                const acc = ACCENT[item.phase.id]
                return (
                  <div key={item.phase.id} className="relative border border-hairline px-5 py-4 overflow-hidden" style={{ background: `${acc.c}0F` }}>
                    <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: acc.c }} />
                    <div className="font-ui uppercase tracking-luxury text-[10px] flex items-center gap-2.5 mb-3" style={{ color: acc.cd }}>
                      <span className="text-[7px]">◆</span> {item.phase.name}
                    </div>
                    <DotRow label="Energia" value={item.avgEnergy} accent={acc.c} />
                    <DotRow label="Nastrój" value={item.avgMood} accent={acc.c} />
                    <div className="flex items-center justify-between py-1.5 border-t border-border">
                      <span className="font-ui uppercase tracking-[0.26em] text-[9px] text-muted">Ghost</span>
                      <span className="font-display font-medium text-[15px] text-dark">{item.ghostCount}<small className="font-serif-body italic text-[11px] text-muted-light">×</small></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </>
      )}
    </>
  )
}

function DotRow({ label, value, accent }: { label: string; value: number | null; accent: string }) {
  const filled = value != null ? Math.round(value) : 0
  return (
    <div className="flex items-center justify-between py-1.5 border-t border-border first:border-t-0">
      <span className="font-ui uppercase tracking-[0.26em] text-[9px] text-muted">{label}</span>
      <span className="flex items-center gap-3.5">
        <span className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <i key={i} className="w-[7px] h-[7px] rotate-45" style={{ background: value != null && i <= filled ? accent : '#d9cda8' }} />
          ))}
        </span>
        <span className="font-display font-medium text-[15px] text-dark w-9 text-right whitespace-nowrap">
          {value != null ? value : '—'}<small className="font-serif-body italic text-[11px] text-muted-light">{value != null ? '/5' : ''}</small>
        </span>
      </span>
    </div>
  )
}

// ── Historia ─────────────────────────────────────────────────────
function CycleHistory({ logs, onDelete }: {
  logs: ReturnType<typeof useCycleData>['logs']
  onDelete: (docId: string) => Promise<void>
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  if (logs.length === 0) return null

  const handleDelete = async (docId: string) => {
    setDeleting(true); await onDelete(docId); setConfirmId(null); setDeleting(false)
  }

  return (
    <Panel label="Historia cykli">
      <div>
        {logs.slice(0, 6).map((log, i) => {
          const [y, m, d] = log.startDate.split('-').map(Number)
          const label = new Date(y, m - 1, d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
          const prev = logs[i + 1]
          const length = prev
            ? Math.round((new Date(log.startDate).getTime() - new Date(prev.startDate).getTime()) / 86400000)
            : null
          const docId = log.docId
          return (
            <div key={log.id} className="flex items-baseline gap-4 py-2.5 border-b border-border last:border-0">
              <span className="font-serif-body text-[14px] text-dark flex-1">{label}</span>
              {length !== null && length > 0 && (
                <span className="font-ui uppercase tracking-[0.3em] text-[9px] text-gold-deep whitespace-nowrap">
                  <b className="font-display font-medium text-[12px]">{length}</b> dni
                </span>
              )}
              {docId && confirmId !== docId && (
                <button onClick={() => setConfirmId(docId)} className="font-ui uppercase tracking-[0.3em] text-[9px] text-muted-light hover:text-wine transition-colors">Usuń</button>
              )}
              {docId && confirmId === docId && (
                <span className="flex items-center gap-2">
                  <button onClick={() => handleDelete(docId)} disabled={deleting} className="font-ui uppercase tracking-[0.3em] text-[9px] text-wine hover:text-red-700 disabled:opacity-50">{deleting ? '…' : 'tak'}</button>
                  <button onClick={() => setConfirmId(null)} className="font-ui uppercase tracking-[0.3em] text-[9px] text-muted hover:text-dark">anuluj</button>
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

// ── Ustawienia (Mój cykl) ────────────────────────────────────────
function CycleSettingsForm({ settings, saving, onSave }: {
  settings: CycleSettings; saving: boolean; onSave: (s: CycleSettings) => Promise<void>
}) {
  const [cycleLength, setCycleLength] = useState(settings.cycleLength)
  const [periodLength, setPeriodLength] = useState(settings.periodLength)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setCycleLength(settings.cycleLength)
    setPeriodLength(settings.periodLength)
  }, [settings.cycleLength, settings.periodLength])

  const ranges = computePhaseRanges({ cycleLength, periodLength })
  const sliderStyle = (val: number, min: number, max: number) => ({
    background: `linear-gradient(to right, ${MAUVE} 0%, ${MAUVE} ${((val - min) / (max - min)) * 100}%, #e5dcc1 ${((val - min) / (max - min)) * 100}%, #e5dcc1 100%)`,
  })

  const handleSave = async () => {
    await onSave({ cycleLength, periodLength })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Panel label="Apparatus · Mój cykl">
      <p className="font-serif-body italic text-[14px] text-muted -mt-2 mb-7">te dane pozwalają dokładniej obliczać fazy. możesz je zmienić, kiedy chcesz.</p>

      <div className="mb-7">
        <div className="flex items-baseline justify-between mb-4">
          <span className="font-ui uppercase tracking-editorial text-[10px] text-muted whitespace-nowrap">Długość cyklu</span>
          <span className="font-display font-medium text-[22px] text-dark tracking-[-0.4px] leading-none">{cycleLength} <em className="font-serif-body italic font-normal text-[14px] text-muted ml-1">dni</em></span>
        </div>
        <input type="range" min={21} max={35} step={1} value={cycleLength} onChange={e => setCycleLength(Number(e.target.value))}
          className="cycle-slider w-full h-0.5 appearance-none outline-none cursor-pointer" style={sliderStyle(cycleLength, 21, 35)} />
        <div className="flex justify-between mt-3 font-ui tracking-[0.24em] text-[10px] text-muted-light"><span>21</span><span>35</span></div>
      </div>

      <div className="mb-7">
        <div className="flex items-baseline justify-between mb-4">
          <span className="font-ui uppercase tracking-editorial text-[10px] text-muted whitespace-nowrap">Długość okresu</span>
          <span className="font-display font-medium text-[22px] text-dark tracking-[-0.4px] leading-none">{periodLength} <em className="font-serif-body italic font-normal text-[14px] text-muted ml-1">dni</em></span>
        </div>
        <input type="range" min={2} max={8} step={1} value={periodLength} onChange={e => setPeriodLength(Number(e.target.value))}
          className="cycle-slider w-full h-0.5 appearance-none outline-none cursor-pointer" style={sliderStyle(periodLength, 2, 8)} />
        <div className="flex justify-between mt-3 font-ui tracking-[0.24em] text-[10px] text-muted-light"><span>2</span><span>8</span></div>
      </div>

      <div className="relative bg-cream border border-hairline px-6 py-5 mt-2">
        <span aria-hidden className="absolute top-[7px] left-[7px] w-[7px] h-[7px] border-t border-l border-gold-light/70" />
        <div className="font-ui uppercase tracking-editorial text-[10px] text-gold-deep mb-3.5">Twoje fazy</div>
        {ORDER.map(id => {
          const phase = CYCLE_PHASES.find(p => p.id === id)!
          const [from, to] = ranges[id]
          if (from > to) return null
          const acc = ACCENT[id]
          return (
            <div key={id} className="flex items-baseline gap-3.5 py-2.5 border-b border-border last:border-0">
              <span className="font-serif-body text-[15px] flex-1 flex items-center gap-3" style={{ color: acc.cd }}>
                <span className="text-[9px]" style={{ color: acc.c }}>◆</span> {phase.name}
              </span>
              <span className="font-ui uppercase tracking-[0.28em] text-[10px] text-muted whitespace-nowrap">
                <b className="font-display font-medium text-[13px] text-dark">{from}–{to}</b> · {to - from + 1} dni
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-7">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-3 bg-dark text-cream border px-7 py-3.5 font-ui uppercase tracking-editorial text-[11px] transition-colors disabled:opacity-60"
          style={{ borderColor: MAUVE }}
          onMouseEnter={e => { e.currentTarget.style.background = MAUVE_D; e.currentTarget.style.borderColor = MAUVE_D }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = MAUVE }}>
          <span style={{ color: MAUVE }}>◆</span> {saving ? '…' : 'Zapisz'}
        </button>
        {saved && <span className="font-ui uppercase tracking-luxury text-[10px] animate-fade-in" style={{ color: MAUVE_D }}>zapisano ◆</span>}
      </div>
    </Panel>
  )
}

// ── Logowanie nowego cyklu ───────────────────────────────────────
function LogForm({ onLog }: { onLog: (date: string) => Promise<void> }) {
  const today = todayKey()
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  return (
    <Panel label="Nowy cykl">
      <p className="font-serif-body italic text-[14px] text-muted -mt-2 mb-4">data pierwszego dnia miesiączki — na tej podstawie obliczam fazę.</p>
      <div className="flex gap-3">
        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
          className="flex-1 font-serif-body text-[14px] text-dark bg-cream border border-hairline px-3 py-2.5 outline-none focus:border-gold transition-colors" />
        <button onClick={async () => { setSaving(true); await onLog(date); setSaving(false) }} disabled={saving}
          className="px-5 py-2.5 bg-dark text-cream border font-ui uppercase tracking-luxury text-[10px] disabled:opacity-60" style={{ borderColor: MAUVE }}>
          {saving ? '…' : 'zapisz'}
        </button>
      </div>
    </Panel>
  )
}

// ── Page ──────────────────────────────────────────────────────────
type Tab = 'faza' | 'wzorce'

export default function CyclePage() {
  const { logs, loading, logCycleStart, deleteCycleLog } = useCycleData()
  const { settings, loading: settingsLoading, saving: settingsSaving, saveSettings } = useCycleSettings()
  const { logs: dailyLogs } = useTimelineData()
  const [tab, setTab] = useState<Tab>('faza')
  const [showLogForm, setShowLogForm] = useState(false)

  const today = todayKey()
  const currentCycle = logs[0] ?? null
  const currentData = currentCycle ? getPhaseForDate(currentCycle.startDate, today, settings) : null

  const handleLog = async (date: string) => { await logCycleStart(date); setShowLogForm(false) }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Fleuron size={20} className="text-gold animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-16 animate-fade-in">
      <style>{`
        .cycle-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;background:#1d231f;border:1px solid ${MAUVE};transform:rotate(45deg);cursor:pointer}
        .cycle-slider::-moz-range-thumb{width:15px;height:15px;background:#1d231f;border:1px solid ${MAUVE};border-radius:0;transform:rotate(45deg);cursor:pointer}
      `}</style>

      {/* Header */}
      <header className="flex items-start justify-between gap-7">
        <div className="min-w-0">
          <div className="flex items-center gap-3 font-ui uppercase tracking-editorial text-[10px] text-muted mb-3.5">
            Rytm <span style={{ color: MAUVE }}>∴</span> Vol. I
          </div>
          <h1 className="font-display font-medium text-dark leading-tight tracking-[-0.5px] text-[clamp(1.75rem,5vw,2.5rem)]">
            <em className="italic font-normal" style={{ color: MAUVE_D }}>Rytm kobiecy</em>
          </h1>
          {currentData && (
            <p className="mt-2 font-serif-body italic text-[14px] text-muted">
              dzień {currentData.cycleDay} · faza {currentData.phase.name.toLowerCase()} · energia {currentData.phase.energy}
            </p>
          )}
        </div>
        <button onClick={() => setShowLogForm(v => !v)}
          className="shrink-0 mt-1.5 inline-flex items-center gap-3 bg-dark border px-5 py-3.5 relative" style={{ borderColor: '#b29355' }}>
          <span style={{ color: MAUVE }} className="text-[9px]">◆</span>
          <span className="font-ui uppercase tracking-editorial text-[11px] text-gold-pale">Dzień</span>
          <span className="font-display font-medium text-[14px] text-gold-light">{currentData ? toRoman(currentData.cycleDay) : 'I'}</span>
        </button>
      </header>

      <div className="flex items-center gap-3.5 my-7">
        <span className="flex-1 h-px bg-hairline" />
        <span className="text-gold text-[13px] leading-none">∴</span>
        <span className="flex-1 h-px bg-hairline" />
      </div>

      {showLogForm && <LogForm onLog={handleLog} />}

      {!currentCycle && !showLogForm && (
        <div className="relative bg-ivory border border-hairline p-8 text-center mb-6">
          <Corners />
          <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
          <h3 className="font-display font-medium text-dark text-[20px]">Zacznij śledzić cykl</h3>
          <p className="font-serif-body italic text-muted text-[14px] mt-2 mb-5 leading-relaxed max-w-md mx-auto">
            zaloguj pierwszy dzień ostatniej miesiączki — aplikacja obliczy aktualną fazę i będzie śledzić wzorce.
          </p>
          <button onClick={() => setShowLogForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-dark text-cream border font-ui uppercase tracking-luxury text-[10px]" style={{ borderColor: MAUVE }}>
            <span style={{ color: MAUVE }}>◆</span> zaloguj dzień I
          </button>
        </div>
      )}

      {currentData && (
        <>
          {/* Tabs */}
          <div className="flex justify-center border-b border-border mb-7">
            {([{ key: 'faza' as const, label: 'Bieżąca faza', n: 1 }, { key: 'wzorce' as const, label: 'Wzorce', n: 2 }]).map(({ key, label, n }) => {
              const on = tab === key
              return (
                <button key={key} onClick={() => setTab(key)}
                  className="relative px-8 py-3 font-ui uppercase tracking-editorial text-[11px] transition-colors"
                  style={{ color: on ? '#1d231f' : '#8a7a55' }}>
                  <span className="font-display italic text-[13px] mr-2" style={{ color: '#b29355' }}>{toRoman(n)}</span>{label}
                  {on && <span className="absolute left-1/2 -translate-x-1/2 -bottom-px w-[30px] h-0.5" style={{ background: MAUVE }} />}
                </button>
              )
            })}
          </div>

          {tab === 'faza' && (
            <>
              <Panel label="Gdzie jesteś w cyklu">
                <div className="grid grid-cols-1 md:grid-cols-[232px_1fr] gap-8 md:gap-10 items-center">
                  <CycleRing cycleDay={currentData.cycleDay} settings={settings} phase={currentData.phase} />
                  <PhaseCard phase={currentData.phase} settings={settings} />
                </div>
                <Legend settings={settings} currentId={currentData.phase.id} />
              </Panel>
              <CycleHistory logs={logs} onDelete={deleteCycleLog} />
              {!settingsLoading && <CycleSettingsForm settings={settings} saving={settingsSaving} onSave={saveSettings} />}
            </>
          )}

          {tab === 'wzorce' && (
            <Insights
              logs={logs}
              dailyLogs={dailyLogs}
              settings={settings}
              startDate={currentCycle?.startDate ?? null}
              cycleDay={currentData.cycleDay}
            />
          )}
        </>
      )}

      {!currentData && !settingsLoading && (
        <CycleSettingsForm settings={settings} saving={settingsSaving} onSave={saveSettings} />
      )}
    </div>
  )
}
