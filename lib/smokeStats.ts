// Analityka papierosów — patrz PLAN_PALENIE.md.
// Czyste funkcje na danych z DailyLog.cigarettes. Ton: licznik kilometrów,
// nie sędzia — żadna funkcja nie zwraca ocen, tylko liczby.

import type { CigaretteContext, CigaretteEntry, DailyLog } from '@/types'

// Start fazy 1 (obserwacja) — od tego dnia logowane są papierosy.
export const SMOKE_TRACKING_START = '2026-05-18'

// Minimalna liczba dni z danymi, żeby raport bazowy miał sens.
export const MIN_DAYS_FOR_BASELINE = 14

export interface DayCount {
  date: string
  count: number
}

export function shiftDateKey(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Dni z istniejącym logiem od startu obserwacji, posortowane rosnąco.
 * Zalogowany dzień bez papierosów liczy się jako 0 — to też są dane.
 */
export function dailyCigaretteCounts(
  logs: Record<string, DailyLog>,
  through?: string,
): DayCount[] {
  return Object.values(logs)
    .filter(l => l.date >= SMOKE_TRACKING_START && (!through || l.date <= through))
    .map(l => ({ date: l.date, count: l.cigarettes?.length ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function collectEntries(
  logs: Record<string, DailyLog>,
  through?: string,
): CigaretteEntry[] {
  return Object.values(logs)
    .filter(l => l.date >= SMOKE_TRACKING_START && (!through || l.date <= through))
    .flatMap(l => l.cigarettes ?? [])
}

export interface BaselineReport {
  avgPerDay: number     // średnia na dzień z danymi, zaokrąglona do 0.1
  daysWithData: number
  total: number
}

export function computeBaseline(counts: DayCount[]): BaselineReport | null {
  if (counts.length === 0) return null
  const total = counts.reduce((s, c) => s + c.count, 0)
  return {
    avgPerDay: Math.round((total / counts.length) * 10) / 10,
    daysWithData: counts.length,
    total,
  }
}

/**
 * Cel miękki fazy 2: −15–25% od bazy (PLAN_PALENIE.md, FAZA 2).
 * Przy bazie 20 → 15–17 dziennie.
 */
export function phase2TargetRange(baseline: number): { lo: number; hi: number } {
  return {
    lo: Math.max(0, Math.round(baseline * 0.75)),
    hi: Math.max(0, Math.round(baseline * 0.85)),
  }
}

/**
 * Średnia krocząca z ostatnich `days` dni kalendarzowych kończących się na
 * `through` (włącznie), liczona po dniach z danymi.
 * Null, gdy danych jest mniej niż 3 dni — za mało, żeby liczba coś mówiła.
 */
export function rollingAverage(
  counts: DayCount[],
  through: string,
  days = 7,
): number | null {
  const from = shiftDateKey(through, -(days - 1))
  const slice = counts.filter(c => c.date >= from && c.date <= through)
  if (slice.length < 3) return null
  const total = slice.reduce((s, c) => s + c.count, 0)
  return Math.round((total / slice.length) * 10) / 10
}

export interface WeekAverage {
  /** Poniedziałek danego tygodnia, YYYY-MM-DD. */
  weekStart: string
  avg: number
  days: number
  total: number
}

function mondayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = (date.getDay() + 6) % 7  // 0=Pon … 6=Nd
  return shiftDateKey(dateKey, -weekday)
}

/** Średnia dzienna per tydzień (pon–nd), po dniach z danymi, rosnąco. */
export function weeklyAverages(counts: DayCount[]): WeekAverage[] {
  const byWeek: Record<string, { total: number; days: number }> = {}
  for (const c of counts) {
    const wk = mondayOf(c.date)
    byWeek[wk] = byWeek[wk] ?? { total: 0, days: 0 }
    byWeek[wk].total += c.count
    byWeek[wk].days += 1
  }
  return Object.entries(byWeek)
    .map(([weekStart, { total, days }]) => ({
      weekStart,
      avg: Math.round((total / days) * 10) / 10,
      days,
      total,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

// ── Faza 2 (redukcja): harmonogram sufitów miesięcznych ──────────────────
// Nowy plan ścieżki papierosowej (07.07.2026 → 30. urodziny). Filozofia bez
// zmian: papieros to dane, nie porażka. Zmiana modelu celu:
// „sufit, nie cel" — nie więcej niż X, nie „muszę dobić do X".
// Puls pod spodem: −1 papieros co circa trzy tygodnie (14 → 0 na 05.04).
// Sufit liczony z DATY (nie z bazy) — to źródło prawdy dla celu fazy 2+.
// phase2TargetRange zostaje dla wstecznej zgodności (review/eksport), ale
// przestaje być wiodącym celem.

/** Twarda linia — 30. urodziny. Powolne odstawianie działa tylko z ostateczną datą. */
export const SMOKING_QUIT_DATE = '2027-04-05'

export interface MonthlyCeiling {
  month: string      // 'YYYY-MM'
  ceiling: number    // maks. papierosów/dzień w tym miesiącu
  focus: string      // co zdejmujesz w tym miesiącu (kolumna „co zdejmujesz")
}

// Konteksty schodzą przed emocjami: najpierw to, co papieros nic nie „robi"
// (auto, kawa, nuda), regułą — nie silną wolą. Nagroda i stres zostają na koniec.
export const MONTHLY_CEILINGS: MonthlyCeiling[] = [
  { month: '2026-07', ceiling: 14, focus: 'auto i kawa bez papierosa' },
  { month: '2026-08', ceiling: 12, focus: 'reszta kontekstowych: nuda, część po posiłku' },
  { month: '2026-09', ceiling: 10, focus: 'wieczory z kimś schodzą do maks. 1' },
  { month: '2026-10', ceiling: 9,  focus: 'nagroda tylko po realnym kamieniu milowym' },
  { month: '2026-11', ceiling: 7,  focus: 'nagroda dostaje zamiennik nienikotynowy' },
  { month: '2026-12', ceiling: 6,  focus: 'stres → narzędzie zamiast papierosa' },
  { month: '2027-01', ceiling: 5,  focus: 'stres dalej, ze wsparciem terapii' },
  { month: '2027-02', ceiling: 3,  focus: 'zostają tylko te najbardziej „twoje"' },
  { month: '2027-03', ceiling: 2,  focus: 'ostatnia prosta' },
  { month: '2027-04', ceiling: 1,  focus: 'rzucam na 30. urodziny (5.04)' },
]

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7)
}

/** Sufit obowiązujący danego dnia. Null przed lipcem '26 / po kwietniu '27. */
export function ceilingFor(dateKey: string): MonthlyCeiling | null {
  return MONTHLY_CEILINGS.find(c => c.month === monthKeyOf(dateKey)) ?? null
}

/** Następny sufit po miesiącu danego dnia — do „co dalej". */
export function nextCeilingAfter(dateKey: string): MonthlyCeiling | null {
  const i = MONTHLY_CEILINGS.findIndex(c => c.month === monthKeyOf(dateKey))
  return i >= 0 && i + 1 < MONTHLY_CEILINGS.length ? MONTHLY_CEILINGS[i + 1] : null
}

/** Dni od `fromKey` do twardej linii (ujemne po 05.04.2027). */
export function daysUntilQuit(fromKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number)
  const [y2, m2, d2] = SMOKING_QUIT_DATE.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

// Spokojne lustro, nie alarm (PLAN_PALENIE sekcja 5: zero czerwieni, zero „relapse").
// „over" to zaproszenie do spojrzenia na kontekst, nie nagana.
export type CeilingStatus = 'under' | 'at' | 'over' | 'unknown'

/** Gdzie jest średnia względem sufitu. */
export function ceilingStatus(avg: number | null, ceiling: number | null): CeilingStatus {
  if (avg == null || ceiling == null) return 'unknown'
  if (avg > ceiling) return 'over'
  if (avg >= ceiling - 1) return 'at'
  return 'under'
}

export interface ContextWeekShare {
  weekStart: string    // poniedziałek tygodnia, YYYY-MM-DD
  count: number        // ile papierosów z danym kontekstem w tygodniu
  withContext: number  // wszystkich otagowanych w tygodniu
  share: number        // % (0-100) wśród otagowanych, zaokrąglony
}

/**
 * Udział jednego kontekstu tydzień po tygodniu — sedno „pułapki nagrody".
 * Liczony wśród papierosów Z KONTEKSTEM (tylko one są tagowane). Zwraca tylko
 * tygodnie z min. `minTagged` otagowanymi — inaczej % skacze na szumie.
 */
export function contextShareByWeek(
  logs: Record<string, DailyLog>,
  context: CigaretteContext,
  opts: { through?: string; minTagged?: number } = {},
): ContextWeekShare[] {
  const { through, minTagged = 5 } = opts
  const byWeek: Record<string, { count: number; withContext: number }> = {}
  for (const l of Object.values(logs)) {
    if (l.date < SMOKE_TRACKING_START) continue
    if (through && l.date > through) continue
    for (const e of l.cigarettes ?? []) {
      if (!e.context) continue
      const wk = mondayOf(l.date)
      byWeek[wk] = byWeek[wk] ?? { count: 0, withContext: 0 }
      byWeek[wk].withContext += 1
      if (e.context === context) byWeek[wk].count += 1
    }
  }
  return Object.entries(byWeek)
    .filter(([, v]) => v.withContext >= minTagged)
    .map(([weekStart, v]) => ({
      weekStart,
      count: v.count,
      withContext: v.withContext,
      share: Math.round((v.count / v.withContext) * 100),
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}
