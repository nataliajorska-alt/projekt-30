'use client'
import { useMemo } from 'react'
import type { DailyLog } from '@/types'
import { getISOWeekKey, getMonthKey } from '@/lib/gameLogic'

type LogMap = Record<string, DailyLog>

// Bazowa liczba elementów rutyny (bez custom items i daily habits weekday-only)
const NORMAL_ROUTINE_MAX = 16  // 9 morning + 7 evening
const MINIMUM_ROUTINE_MAX = 6  // 3 morning + 3 evening

export interface WeekHabitData {
  weekKey: string
  avgCompletionRate: number   // 0-100
  totalRulesKept: number
  activeDays: number
  activityDays: number
}

export interface MonthHabitData {
  monthKey: string
  avgCompletionRate: number   // 0-100
  totalRulesKept: number
  activeDays: number
  totalSideQuests: number
  totalDailyQuests: number
}

export interface RuleStat {
  ruleId: string
  totalKept: number
  ratePercent: number         // % dni z zalogowaną aktywnością, gdy zasada była dotrzymana
}

export interface HabitAnalytics {
  byWeek: WeekHabitData[]
  byMonth: MonthHabitData[]
  ruleStats: RuleStat[]
  totalDaysLogged: number
  overallAvgCompletion: number
  totalActivityDays: number
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function useHabitAnalytics(logs: LogMap): HabitAnalytics {
  return useMemo(() => {
    const sortedKeys = Object.keys(logs).sort()
    if (sortedKeys.length === 0) {
      return { byWeek: [], byMonth: [], ruleStats: [], totalDaysLogged: 0, overallAvgCompletion: 0, totalActivityDays: 0 }
    }

    // Per-day completion rates
    const dayRates: number[] = []
    const weekMap: Record<string, {
      rateSum: number; count: number; rulesKept: number; activeDays: number; activityDays: number
    }> = {}
    const monthMap: Record<string, {
      rateSum: number; count: number; rulesKept: number; activeDays: number
      sideQuests: number; dailyQuests: number
    }> = {}
    const ruleCounts: Record<string, number> = {}
    let activeDaysTotal = 0
    let activityDaysTotal = 0

    for (const key of sortedKeys) {
      const log = logs[key]
      const mode = log.dayMode ?? 'normal'
      const max = mode === 'minimum' ? MINIMUM_ROUTINE_MAX : NORMAL_ROUTINE_MAX
      const completed = log.completedRoutine?.length ?? 0
      const rate = Math.min(100, Math.round((completed / max) * 100))
      const rulesKept = log.keptRules?.length ?? 0
      const isActive = (log.totalXP ?? 0) > 0
      const hasActivity = log.physicalActivity === true
      if (isActive) activeDaysTotal += 1
      if (hasActivity) activityDaysTotal += 1

      dayRates.push(rate)

      // Week aggregate
      const weekKey = getISOWeekKey(parseKey(key))
      if (!weekMap[weekKey]) weekMap[weekKey] = { rateSum: 0, count: 0, rulesKept: 0, activeDays: 0, activityDays: 0 }
      weekMap[weekKey].rateSum += rate
      weekMap[weekKey].count += 1
      weekMap[weekKey].rulesKept += rulesKept
      if (isActive) weekMap[weekKey].activeDays += 1
      if (hasActivity) weekMap[weekKey].activityDays += 1

      // Month aggregate
      const monthKey = getMonthKey(parseKey(key))
      if (!monthMap[monthKey]) monthMap[monthKey] = { rateSum: 0, count: 0, rulesKept: 0, activeDays: 0, sideQuests: 0, dailyQuests: 0 }
      monthMap[monthKey].rateSum += rate
      monthMap[monthKey].count += 1
      monthMap[monthKey].rulesKept += rulesKept
      monthMap[monthKey].sideQuests += log.completedSideQuests?.length ?? 0
      monthMap[monthKey].dailyQuests += log.completedDailyQuests?.length ?? 0
      if (isActive) monthMap[monthKey].activeDays += 1

      // Rule counts
      for (const ruleId of log.keptRules ?? []) {
        ruleCounts[ruleId] = (ruleCounts[ruleId] ?? 0) + 1
      }
    }

    const byWeek: WeekHabitData[] = Object.entries(weekMap)
      .map(([weekKey, w]) => ({
        weekKey,
        avgCompletionRate: Math.round(w.rateSum / Math.max(1, w.count)),
        totalRulesKept: w.rulesKept,
        activeDays: w.activeDays,
        activityDays: w.activityDays,
      }))
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey))

    const byMonth: MonthHabitData[] = Object.entries(monthMap)
      .map(([monthKey, m]) => ({
        monthKey,
        avgCompletionRate: Math.round(m.rateSum / Math.max(1, m.count)),
        totalRulesKept: m.rulesKept,
        activeDays: m.activeDays,
        totalSideQuests: m.sideQuests,
        totalDailyQuests: m.dailyQuests,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))

    const ruleStats: RuleStat[] = Object.entries(ruleCounts).map(([ruleId, totalKept]) => ({
      ruleId,
      totalKept,
      ratePercent: activeDaysTotal > 0 ? Math.round((totalKept / activeDaysTotal) * 100) : 0,
    })).sort((a, b) => b.totalKept - a.totalKept)

    const overallAvgCompletion = dayRates.length > 0
      ? Math.round(dayRates.reduce((a, b) => a + b, 0) / dayRates.length)
      : 0

    return {
      byWeek,
      byMonth,
      ruleStats,
      totalDaysLogged: sortedKeys.length,
      overallAvgCompletion,
      totalActivityDays: activityDaysTotal,
    }
  }, [logs])
}
