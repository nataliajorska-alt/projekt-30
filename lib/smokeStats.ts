// Analityka papierosów — patrz PLAN_PALENIE.md.
// Czyste funkcje na danych z DailyLog.cigarettes. Ton: licznik kilometrów,
// nie sędzia — żadna funkcja nie zwraca ocen, tylko liczby.

import type { CigaretteEntry, DailyLog } from '@/types'

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
