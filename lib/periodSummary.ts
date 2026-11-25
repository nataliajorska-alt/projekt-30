// Podsumowanie okresu do Przeglądu w Analizach: ostatnie N pełnych dni
// w porównaniu z N dniami tuż przed nimi.
//
// Okno kończy się WCZORAJ — dzisiejszy, niedokończony dzień zaniżałby średnie
// (przy 7 dniach nawet o kilkanaście procent) i każde porównanie wypadałoby
// „gorzej" tylko dlatego, że jest rano.
import type { DailyLog } from '@/types'
import { dateKey, getEffectiveNow } from './gameLogic'

export type LogMap = Record<string, DailyLog>

// Bazowa liczba elementów rutyny — te same progi co w hooks/useHabitAnalytics.
export const NORMAL_ROUTINE_MAX = 16   // 9 rano + 7 wieczorem
export const MINIMUM_ROUTINE_MAX = 6   // 3 rano + 3 wieczorem

/** Odsetek wykonanej rutyny dnia, 0–100. */
export function routineCompletionRate(log: DailyLog): number {
  const max = (log.dayMode ?? 'normal') === 'minimum' ? MINIMUM_ROUTINE_MAX : NORMAL_ROUTINE_MAX
  const completed = log.completedRoutine?.length ?? 0
  return Math.min(100, Math.round((completed / max) * 100))
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + n))
}

export interface PeriodStats {
  from: string
  to: string
  days: number
  xpTotal: number
  /** XP na dzień kalendarzowy okresu (dni bez zapisu liczą się jako 0). */
  xpPerDay: number
  /** Dni z jakimkolwiek XP. */
  daysLogged: number
  /** Średnia rutyna (0–100) w dni z zapisem; null gdy brak zapisów. */
  routineRate: number | null
  /** Średni nastrój / energia ze wszystkich check-inów okresu (1–5). */
  mood: number | null
  energy: number | null
  checkIns: number
  sideQuests: number
  bestDay: { date: string; xp: number } | null
  /** Serie dzień po dniu, od najstarszego — do mini-wykresów. */
  dailyXP: number[]
  dailyRoutine: (number | null)[]
  dailyMood: (number | null)[]
}

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

export function summarizePeriod(logs: LogMap, to: string, days: number): PeriodStats {
  const from = addDays(to, -(days - 1))
  let xpTotal = 0, daysLogged = 0, sideQuests = 0
  const rates: number[] = []
  const moods: number[] = []
  const energies: number[] = []
  const dailyXP: number[] = []
  const dailyRoutine: (number | null)[] = []
  const dailyMood: (number | null)[] = []
  let bestDay: PeriodStats['bestDay'] = null

  for (let i = 0; i < days; i++) {
    const key = addDays(from, i)
    const log = logs[key]
    const xp = log?.totalXP ?? 0
    dailyXP.push(xp)
    if (!log || xp <= 0) {
      dailyRoutine.push(null)
    } else {
      daysLogged += 1
      xpTotal += xp
      const r = routineCompletionRate(log)
      rates.push(r)
      dailyRoutine.push(r)
      sideQuests += (log.completedSideQuests?.length ?? 0) + (log.customSideQuests?.length ?? 0)
      if (!bestDay || xp > bestDay.xp) bestDay = { date: key, xp }
    }
    const ci = log?.moodCheckIns ?? []
    for (const c of ci) { moods.push(c.mood); energies.push(c.energy) }
    dailyMood.push(ci.length ? ci.reduce((a, c) => a + c.mood, 0) / ci.length : null)
  }

  const routineMean = mean(rates)
  return {
    from, to, days,
    xpTotal,
    xpPerDay: Math.round(xpTotal / days),
    daysLogged,
    routineRate: routineMean === null ? null : Math.round(routineMean),
    mood: mean(moods),
    energy: mean(energies),
    checkIns: moods.length,
    sideQuests,
    bestDay,
    dailyXP, dailyRoutine, dailyMood,
  }
}

export interface PeriodComparison {
  current: PeriodStats
  previous: PeriodStats
  /** Czy poprzedni okres ma dość zapisów, by porównanie coś znaczyło. */
  hasPrevious: boolean
}

export function comparePeriods(logs: LogMap, days: number, todayKey = dateKey(getEffectiveNow())): PeriodComparison {
  const to = addDays(todayKey, -1)
  const current = summarizePeriod(logs, to, days)
  const previous = summarizePeriod(logs, addDays(current.from, -1), days)
  return { current, previous, hasPrevious: previous.daysLogged >= Math.max(2, Math.ceil(days / 4)) }
}

export type Trend = 'up' | 'down' | 'flat'

/** Kierunek zmiany z progiem „to jeszcze szum". */
export function trendOf(cur: number | null, prev: number | null, threshold: number): Trend {
  if (cur === null || prev === null) return 'flat'
  const d = cur - prev
  if (d > threshold) return 'up'
  if (d < -threshold) return 'down'
  return 'flat'
}

/** Zmiana procentowa (zaokrąglona); null gdy brak bazy. */
export function pctChange(cur: number, prev: number): number | null {
  if (prev <= 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}
