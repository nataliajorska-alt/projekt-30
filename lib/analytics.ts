import type { DailyLog } from '@/types'
import { getISOWeekKey, getMonthKey, dateKey } from './gameLogic'

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
  const today = dateKey(new Date())
  const yesterdayDate = new Date()
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
