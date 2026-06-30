import type { DailyLog, Pillar, WeeklyReview, MonthlyReview } from '@/types'
import { getISOWeekKey, getMonthKey, dateKey, getEffectiveNow } from './gameLogic'

export type LogMap = Record<string, DailyLog>

export interface WeekAggregate {
  weekKey: string
  totalXP: number
  activeDays: number
}

export interface MonthAggregate {
  monthKey: string
  totalXP: number
  activeDays: number
  totalRoutines: number
  totalDailyQuests: number
  totalSideQuests: number
  totalRulesKept: number
}

export interface Streak {
  start: string
  end: string
  length: number
}

export interface StreakSummary {
  currentStreak: number
  longestStreak: number
  allStreaks: Streak[]
}

// Parse YYYY-MM-DD into a local Date (midnight).
function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isActive(log: DailyLog | undefined): boolean {
  if (!log) return false
  return (log.totalXP ?? 0) > 0
}

export function aggregateXpByWeek(logs: LogMap): Record<string, WeekAggregate> {
  const out: Record<string, WeekAggregate> = {}
  for (const [dayKey, log] of Object.entries(logs)) {
    const weekKey = getISOWeekKey(parseKey(dayKey))
    if (!out[weekKey]) out[weekKey] = { weekKey, totalXP: 0, activeDays: 0 }
    out[weekKey].totalXP += log.totalXP ?? 0
    if (isActive(log)) out[weekKey].activeDays += 1
  }
  return out
}

export function aggregateXpByMonth(logs: LogMap): Record<string, MonthAggregate> {
  const out: Record<string, MonthAggregate> = {}
  for (const [dayKey, log] of Object.entries(logs)) {
    const monthKey = getMonthKey(parseKey(dayKey))
    if (!out[monthKey]) {
      out[monthKey] = {
        monthKey,
        totalXP: 0,
        activeDays: 0,
        totalRoutines: 0,
        totalDailyQuests: 0,
        totalSideQuests: 0,
        totalRulesKept: 0,
      }
    }
    const agg = out[monthKey]
    agg.totalXP += log.totalXP ?? 0
    if (isActive(log)) agg.activeDays += 1
    agg.totalRoutines += log.completedRoutine?.length ?? 0
    agg.totalDailyQuests += log.completedDailyQuests?.length ?? 0
    agg.totalSideQuests += log.completedSideQuests?.length ?? 0
    agg.totalRulesKept += log.keptRules?.length ?? 0
  }
  return out
}

export function getMonthAggregate(logs: LogMap, monthKey: string): MonthAggregate {
  const all = aggregateXpByMonth(logs)
  return (
    all[monthKey] ?? {
      monthKey,
      totalXP: 0,
      activeDays: 0,
      totalRoutines: 0,
      totalDailyQuests: 0,
      totalSideQuests: 0,
      totalRulesKept: 0,
    }
  )
}

export function findBestDay(logs: LogMap): { date: string; xp: number } | null {
  let best: { date: string; xp: number } | null = null
  for (const [dayKey, log] of Object.entries(logs)) {
    const xp = log.totalXP ?? 0
    if (!best || xp > best.xp) best = { date: dayKey, xp }
  }
  return best && best.xp > 0 ? best : null
}

export function findWorstActiveDay(logs: LogMap): { date: string; xp: number } | null {
  let worst: { date: string; xp: number } | null = null
  for (const [dayKey, log] of Object.entries(logs)) {
    const xp = log.totalXP ?? 0
    if (xp <= 0) continue
    if (!worst || xp < worst.xp) worst = { date: dayKey, xp }
  }
  return worst
}

// Walks chronologically from the earliest date to today, grouping consecutive active days into streaks.
export function computeStreaks(logs: LogMap): StreakSummary {
  const activeDates = Object.entries(logs)
    .filter(([, log]) => isActive(log))
    .map(([key]) => key)
    .sort()

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, allStreaks: [] }
  }

  const streaks: Streak[] = []
  let streakStart = activeDates[0]
  let streakEnd = activeDates[0]
  let length = 1

  for (let i = 1; i < activeDates.length; i++) {
    const prev = parseKey(activeDates[i - 1])
    const cur = parseKey(activeDates[i])
    const diff = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      streakEnd = activeDates[i]
      length += 1
    } else {
      streaks.push({ start: streakStart, end: streakEnd, length })
      streakStart = activeDates[i]
      streakEnd = activeDates[i]
      length = 1
    }
  }
  streaks.push({ start: streakStart, end: streakEnd, length })

  const longestStreak = streaks.reduce((m, s) => Math.max(m, s.length), 0)

  // Current streak = last streak iff it ends today or yesterday.
  const today = dateKey(getEffectiveNow())
  const yesterdayDate = getEffectiveNow()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = dateKey(yesterdayDate)
  const last = streaks[streaks.length - 1]
  const currentStreak = last && (last.end === today || last.end === yesterday) ? last.length : 0

  return { currentStreak, longestStreak, allStreaks: streaks }
}

// Best pillar by XP in a given month aggregate (reads directly from per-day log breakdowns).
// Since DailyLog does not store per-pillar XP, we return null if nothing can be computed.
// Callers can fall back to overall stats.pillarXP.
export function topPillarOfMonth(_logs: LogMap, _monthKey: string): null {
  return null
}

// Returns how many times each routine item ID was completed in a given month.
export function getRoutineItemCounts(logs: LogMap, monthKey: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [dayKey, log] of Object.entries(logs)) {
    if (!dayKey.startsWith(monthKey)) continue
    for (const id of log.completedRoutine ?? []) {
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return counts
}

// Returns list of completed side quest IDs with the dates they were completed in a given month.
export function getCompletedSideQuestDates(
  logs: LogMap,
  monthKey: string
): { questId: string; date: string }[] {
  const result: { questId: string; date: string }[] = []
  const sortedKeys = Object.keys(logs)
    .filter((k) => k.startsWith(monthKey))
    .sort()
  for (const dayKey of sortedKeys) {
    const log = logs[dayKey]
    for (const questId of log.completedSideQuests ?? []) {
      result.push({ questId, date: dayKey })
    }
  }
  return result
}

// Computes pillar rating deltas between consecutive reviews (weekly or monthly).
// Returns a map of pillar → { current, previous, delta } for the two most recent entries.
export function computePillarTrends(
  reviews: (WeeklyReview | MonthlyReview)[]
): Record<Pillar, { current: number; previous: number; delta: number }> | null {
  if (reviews.length < 2) return null
  const current = reviews[0].pillarsRated
  const previous = reviews[1].pillarsRated
  const pillars: Pillar[] = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc']
  const result = {} as Record<Pillar, { current: number; previous: number; delta: number }>
  for (const p of pillars) {
    const c = current[p] ?? 0
    const prev = previous[p] ?? 0
    result[p] = { current: c, previous: prev, delta: c - prev }
  }
  return result
}

// Returns how many times each rule ID was kept in a given month.
export function getRuleKeptCounts(logs: LogMap, monthKey: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [dayKey, log] of Object.entries(logs)) {
    if (!dayKey.startsWith(monthKey)) continue
    for (const id of log.keptRules ?? []) {
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return counts
}
