'use client'
import type { ReactNode } from 'react'
import type { HabitAnalytics } from '@/hooks/useHabitAnalytics'
import { DAILY_RULES } from '@/lib/routineData'
import { SmallCaps, Fleuron, CornerBrackets, RomanNumeral } from '@/components/ui'

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

// Heatmap intensity scale (1:1 with design tokens --h0…--h4).
const H = { h0: '#e9e0c8', h1: '#d6bd84', h2: '#bd9c56', h3: '#94793b', h4: '#5a4b22' }

function formatWeekLabel(weekKey: string): string {
  return weekKey.replace(/\d{4}-W(\d+)/, 'T$1')
}
function formatMonthName(monthKey: string): string {
  const [, m] = monthKey.split('-').map(Number)
  return PL_MONTH_NAMES[m - 1] ?? monthKey
}

// Consistency tier colour — olive→gold heat scale (better consistency = darker olive).
function tierColor(rate: number): string {
  if (rate >= 80) return H.h4
  if (rate >= 60) return H.h3
  if (rate >= 40) return H.h2
  return H.h1
}

// Polish plural for "tydzień".
function weeksWord(n: number): string {
  if (n === 1) return 'tydzień'
  const last = n % 10
  const last2 = n % 100
  if (last >= 2 && last <= 4 && !(last2 >= 12 && last2 <= 14)) return 'tygodnie'
  return 'tygodni'
}
function questWord(n: number): string {
  if (n === 1) return 'quest'
  const last = n % 10
  const last2 = n % 100
  if (last >= 2 && last <= 4 && !(last2 >= 12 && last2 <= 14)) return 'questy'
  return 'questów'
}

export default function HabitsTab({ analytics }: { analytics: HabitAnalytics }) {
  const { byWeek, byMonth, ruleStats, totalDaysLogged, overallAvgCompletion, totalActivityDays } = analytics

  if (totalDaysLogged === 0) {
    return (
      <div className="relative bg-ivory border border-gold-light/40 p-12 text-center">
        <CornerBrackets size={10} tone="gold-light" />
        <Fleuron size={14} className="text-gold-deep mx-auto mb-3 inline-block" />
        <p className="font-serif-body italic text-muted text-[13.5px]">
          brak danych. zacznij logować dni, żeby zobaczyć analizę nawyków.
        </p>
      </div>
    )
  }

  const consWeeks = byWeek.slice(-6).reverse()   // newest on top
  const bodyWeeks = byWeek.slice(-5).reverse()
  const activityPct = totalDaysLogged > 0 ? Math.round((totalActivityDays / totalDaysLogged) * 100) : 0

  return (
    <div className="space-y-8">
      {/* ===== Metric band ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 bg-ivory border border-gold-light/40">
        <Metric num={overallAvgCompletion} unit="%" eyebrow="Śr. ukończenie rutyny" note="przez cały projekt" />
        <Metric
          num={totalDaysLogged}
          eyebrow="Dni zalogowane"
          note={`w ciągu ${byWeek.length} ${weeksWord(byWeek.length)}`}
          divider
        />
      </div>

      {/* ===== Konsekwencja ===== */}
      <Panel eyebrow="Konsekwencja" title="Rutyna tygodniami"
        note="% ukończenia w każdym tygodniu (ostatnie VI). dłuższy słupek = lepsza konsekwencja.">
        {consWeeks.length === 0 ? (
          <Empty>brak danych tygodniowych.</Empty>
        ) : (
          <div className="mt-6">
            {consWeeks.map(w => (
              <div
                key={w.weekKey}
                className="grid items-center gap-5 py-2.5 border-t border-border first:border-t-0"
                style={{ gridTemplateColumns: '46px 1fr 56px' }}
              >
                <span className="font-ui uppercase text-[9px] tracking-[0.22em] text-muted-light">
                  {formatWeekLabel(w.weekKey)}
                </span>
                <div className="relative h-3" style={{ backgroundColor: H.h0 }}>
                  <div
                    className="absolute left-0 top-0 h-full transition-all duration-700"
                    style={{ width: `${Math.max(2, w.avgCompletionRate)}%`, backgroundColor: tierColor(w.avgCompletionRate) }}
                  />
                </div>
                <span className="font-display text-[15px] text-dark text-right tracking-tight">
                  {w.avgCompletionRate}%
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 pt-4 border-t border-border">
          {[
            { sw: H.h4, label: '≥80% świetnie' },
            { sw: H.h3, label: '≥60% dobrze' },
            { sw: H.h2, label: '≥40% przeciętnie' },
            { sw: H.h1, label: '<40% słabo' },
          ].map(({ sw, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-[13px] h-[13px]" style={{ backgroundColor: sw }} />
              <SmallCaps tone="muted" tracking="luxury" size="xs">{label}</SmallCaps>
            </div>
          ))}
        </div>
      </Panel>

      {/* ===== Miesiące — almanac cards ===== */}
      {byMonth.length > 0 && (
        <Panel eyebrow="Miesiące" title="Nawyki"
          note="aktywne dni, średnie ukończenie rutyny i questy w każdym miesiącu.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {byMonth.map((m, i) => (
              <div key={m.monthKey} className="relative bg-cream-warm border border-gold-light/40 p-5">
                <CornerBrackets size={8} tone="gold-light" />
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[16px] text-dark tracking-tight">
                    {formatMonthName(m.monthKey)}
                  </span>
                  <RomanNumeral value={i + 1} className="font-display italic text-[12px] text-gold-light" />
                </div>
                <div className="font-display text-gold-deep text-[28px] leading-none tracking-tight mt-3">
                  {m.avgCompletionRate}
                  <span className="font-serif-body italic font-normal text-[13px] text-muted-light ml-0.5">%</span>
                </div>
                <div className="font-ui uppercase text-[7px] tracking-[0.26em] text-muted mt-2">
                  ukończenie rutyny
                </div>
                <div className="relative h-[2px] bg-border mt-3.5">
                  <div
                    className="absolute left-0 top-0 h-[2px] bg-gold transition-all duration-700"
                    style={{ width: `${m.avgCompletionRate}%` }}
                  />
                  <span
                    className="absolute top-1/2 w-[6px] h-[6px] bg-gold"
                    style={{ left: `${m.avgCompletionRate}%`, transform: 'translate(-50%,-50%) rotate(45deg)' }}
                  />
                </div>
                <div className="flex gap-6 mt-4 pt-3 border-t border-border">
                  <FootStat n={m.activeDays} label={m.activeDays === 1 ? 'dzień' : 'dni'} />
                  <FootStat n={m.totalSideQuests} label={questWord(m.totalSideQuests)} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== Zasady — retention ledger ===== */}
      <Panel eyebrow="Zasady" title="Statystyki dotrzymania"
        note={`ile razy każda zasada była dotrzymana (z ${totalDaysLogged} zalogowanych dni).`}>
        {ruleStats.length === 0 ? (
          <Empty>zacznij zaznaczać zasady każdego dnia, żeby zobaczyć statystyki.</Empty>
        ) : (
          <div className="mt-5">
            {DAILY_RULES.map(rule => {
              const kept = ruleStats.find(s => s.ruleId === rule.id)?.totalKept ?? 0
              const pct = totalDaysLogged > 0 ? Math.round((kept / totalDaysLogged) * 100) : 0
              return (
                <div key={rule.id} className="py-4 border-t border-border first:border-t-0">
                  <div className="flex items-baseline justify-between gap-6 mb-3.5">
                    <span className="font-serif-body text-[15px] leading-snug text-dark max-w-[66%]">
                      {rule.text}
                    </span>
                    <span className="font-display text-[24px] text-dark leading-none tracking-tight whitespace-nowrap">
                      {pct}
                      <span className="font-serif-body italic font-normal text-[13px] text-muted-light">%</span>
                    </span>
                  </div>
                  <div className="flex items-end gap-[3px] h-[13px]">
                    {Array.from({ length: totalDaysLogged }).map((_, i) => (
                      <span
                        key={i}
                        className="flex-1"
                        style={{
                          height: i < kept ? '13px' : '7px',
                          backgroundColor: i < kept ? '#b29355' : H.h0,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2 font-ui uppercase text-[8px] tracking-[0.24em] text-muted">
                    <b className="font-display italic font-medium text-[12px] text-gold-deep tracking-normal">{kept}</b>
                    z {totalDaysLogged} dni dotrzymane
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {/* ===== Aktywność fizyczna ===== */}
      <Panel eyebrow="Aktywność fizyczna" title="Ciało w ruchu"
        note="dane z zaznaczenia „ćwiczyłam dziś”.">
        <div className="grid grid-cols-2 gap-7 mt-6">
          <div className="relative bg-cream-warm border border-gold-light/40 p-5 text-center">
            <CornerBrackets size={8} tone="gold-light" />
            <div className="font-display text-dark text-[26px] leading-none tracking-tight">{totalActivityDays}</div>
            <div className="font-ui uppercase text-[8px] tracking-[0.28em] text-muted mt-2.5">dni aktywnych</div>
          </div>
          <div className="relative bg-cream-warm border border-gold-light/40 p-5 text-center">
            <CornerBrackets size={8} tone="gold-light" />
            <div className="font-display text-dark text-[26px] leading-none tracking-tight">
              {activityPct}<span className="text-[16px]">%</span>
            </div>
            <div className="font-ui uppercase text-[8px] tracking-[0.28em] text-muted mt-2.5">zalogowanych dni</div>
          </div>
        </div>

        {bodyWeeks.length > 0 && (
          <div className="mt-8">
            <div className="font-ui uppercase text-[9px] tracking-[0.3em] text-gold-deep mb-3.5">Per tydzień</div>
            {bodyWeeks.map(w => (
              <div
                key={w.weekKey}
                className="grid items-center gap-5 py-2.5 border-t border-border first:border-t-0"
                style={{ gridTemplateColumns: '46px 1fr 44px' }}
              >
                <span className="font-ui uppercase text-[9px] tracking-[0.22em] text-muted-light">
                  {formatWeekLabel(w.weekKey)}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: Math.max(w.activeDays, w.activityDays) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[13px] h-[13px] border"
                      style={{
                        backgroundColor: i < w.activityDays ? '#b29355' : 'transparent',
                        borderColor: i < w.activityDays ? '#b29355' : '#d9cda8',
                      }}
                    />
                  ))}
                </div>
                <span className="font-display italic text-[13px] text-muted text-right">
                  {w.activityDays}/{w.activeDays}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ---- small building blocks ---- */

function Metric({ num, unit, eyebrow, note, divider }: {
  num: number; unit?: string; eyebrow: string; note: string; divider?: boolean
}) {
  return (
    <section className={`flex items-center gap-4 px-6 py-5 ${divider ? 'border-t sm:border-t-0 sm:border-l border-border' : ''}`}>
      <div className="font-display text-dark text-[26px] leading-none tracking-tight">
        {num.toLocaleString('pl-PL')}
        {unit && <span className="font-serif-body italic font-normal text-[14px] text-muted-light ml-0.5">{unit}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-ui uppercase text-[8px] tracking-[0.3em] text-gold-deep">
          <span className="text-gold text-[6px]">◆</span>
          {eyebrow}
        </div>
        <div className="font-serif-body italic text-[12px] text-muted">{note}</div>
      </div>
    </section>
  )
}

function Panel({ eyebrow, title, note, children }: {
  eyebrow: string; title: string; note?: string; children: ReactNode
}) {
  return (
    <section className="relative bg-ivory border border-gold-light/40 p-5 sm:p-7">
      <CornerBrackets size={10} tone="gold-light" />
      <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div">{eyebrow}</SmallCaps>
      <h2 className="font-heading text-dark text-lg mt-1">{title}</h2>
      {note && <p className="font-serif-body italic text-muted text-[13px] mt-1">{note}</p>}
      {children}
    </section>
  )
}

function FootStat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <b className="font-display italic font-medium text-[14px] text-dark">{n}</b>
      <span className="font-ui uppercase text-[7px] tracking-[0.24em] text-muted">{label}</span>
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="font-serif-body italic text-muted-light text-[13px] text-center py-4">{children}</p>
  )
}
