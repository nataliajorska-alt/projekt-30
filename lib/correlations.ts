/**
 * Correlation engine — pure functions on DailyLog[].
 * Computes cross-metric patterns: routine → mood, activity → energy, etc.
 */
import type { DailyLog } from '@/types'

// ── IDs by routine type ──────────────────────────────────────────────────────

const MORNING_IDS  = ['m1','m2','m3','m4','m5','m6','m7','m8','m9']
const MORNING_MIN  = ['mm1','mm2','mm3']
const EVENING_IDS  = ['e1','e2','e3','e4','e5','e6','e7']
const EVENING_MIN  = ['em1','em2','em3']

export const PL_DAYS_SHORT = ['Nd','Pn','Wt','Śr','Cz','Pt','Sb']
export const PL_DAYS_FULL  = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota']

// ── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function isMorningDone(log: DailyLog): boolean {
  const n = MORNING_IDS.filter(id => log.completedRoutine.includes(id)).length
  const m = MORNING_MIN.filter(id => log.completedRoutine.includes(id)).length
  return n >= 4 || m >= 2
}

function isEveningDone(log: DailyLog): boolean {
  const n = EVENING_IDS.filter(id => log.completedRoutine.includes(id)).length
  const m = EVENING_MIN.filter(id => log.completedRoutine.includes(id)).length
  return n >= 3 || m >= 2
}

function logAvgMood(log: DailyLog): number {
  const ci = log.moodCheckIns ?? []
  return ci.reduce((a, c) => a + c.mood, 0) / ci.length
}

function logAvgEnergy(log: DailyLog): number {
  const ci = log.moodCheckIns ?? []
  return ci.reduce((a, c) => a + c.energy, 0) / ci.length
}

function weekday(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// ── Result types ─────────────────────────────────────────────────────────────

export interface ComparisonInsight {
  type: 'comparison'
  id: string
  icon: string
  title: string
  withLabel: string
  withoutLabel: string
  metric: 'mood' | 'energy'
  withValue: number | null
  withoutValue: number | null
  withCount: number
  withoutCount: number
  hasEnoughData: boolean
}

export interface DayOfWeekInsight {
  type: 'dow'
  id: string
  icon: string
  title: string
  metric: 'energy' | 'mood'
  byDay: { dow: number; short: string; full: string; value: number | null; count: number }[]
  hasEnoughData: boolean
}

export type CorrelationInsight = ComparisonInsight | DayOfWeekInsight

// ── Main computation ─────────────────────────────────────────────────────────

const MIN_PER_GROUP = 3    // minimum logs per group to display result
const MIN_TOTAL     = 7    // minimum logs with mood data to run any analysis

export function computeCorrelations(logs: Record<string, DailyLog>): CorrelationInsight[] {
  // Only logs that have at least one mood check-in
  const withMood = Object.values(logs).filter(
    l => l.moodCheckIns && l.moodCheckIns.length > 0
  )

  const insights: CorrelationInsight[] = []

  // ─ 1. Morning routine → mood ─────────────────────────────────────────────
  const mornWith    = withMood.filter(isMorningDone)
  const mornWithout = withMood.filter(l => !isMorningDone(l))
  insights.push({
    type: 'comparison', id: 'morning_mood',
    icon: '🌅', title: 'Rutyna poranna → nastrój',
    withLabel: 'Dni z rutyną poranną', withoutLabel: 'Pozostałe dni',
    metric: 'mood',
    withValue:    avg(mornWith.map(logAvgMood)),
    withoutValue: avg(mornWithout.map(logAvgMood)),
    withCount: mornWith.length, withoutCount: mornWithout.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && mornWith.length >= MIN_PER_GROUP
      && mornWithout.length >= MIN_PER_GROUP,
  })

  // ─ 2. Evening routine → mood ─────────────────────────────────────────────
  const eveWith    = withMood.filter(isEveningDone)
  const eveWithout = withMood.filter(l => !isEveningDone(l))
  insights.push({
    type: 'comparison', id: 'evening_mood',
    icon: '🌙', title: 'Rutyna wieczorna → nastrój',
    withLabel: 'Dni z rutyną wieczorną', withoutLabel: 'Pozostałe dni',
    metric: 'mood',
    withValue:    avg(eveWith.map(logAvgMood)),
    withoutValue: avg(eveWithout.map(logAvgMood)),
    withCount: eveWith.length, withoutCount: eveWithout.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && eveWith.length >= MIN_PER_GROUP
      && eveWithout.length >= MIN_PER_GROUP,
  })

  // ─ 3. Physical activity → energia ────────────────────────────────────────
  const actWith    = withMood.filter(l => l.physicalActivity === true)
  const actWithout = withMood.filter(l => !l.physicalActivity)
  insights.push({
    type: 'comparison', id: 'activity_energy',
    icon: '🏃', title: 'Aktywność fizyczna → energia',
    withLabel: 'Dni z aktywnością', withoutLabel: 'Dni bez aktywności',
    metric: 'energy',
    withValue:    avg(actWith.map(logAvgEnergy)),
    withoutValue: avg(actWithout.map(logAvgEnergy)),
    withCount: actWith.length, withoutCount: actWithout.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && actWith.length >= MIN_PER_GROUP
      && actWithout.length >= MIN_PER_GROUP,
  })

  // ─ 4. Physical activity → nastrój ────────────────────────────────────────
  insights.push({
    type: 'comparison', id: 'activity_mood',
    icon: '💪', title: 'Aktywność fizyczna → nastrój',
    withLabel: 'Dni z aktywnością', withoutLabel: 'Dni bez aktywności',
    metric: 'mood',
    withValue:    avg(actWith.map(logAvgMood)),
    withoutValue: avg(actWithout.map(logAvgMood)),
    withCount: actWith.length, withoutCount: actWithout.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && actWith.length >= MIN_PER_GROUP
      && actWithout.length >= MIN_PER_GROUP,
  })

  // ─ 5. Dzień tygodnia → energia ───────────────────────────────────────────
  insights.push({
    type: 'dow', id: 'dow_energy',
    icon: '📅', title: 'Energia według dnia tygodnia',
    metric: 'energy',
    byDay: [0,1,2,3,4,5,6].map(dow => {
      const dayLogs = withMood.filter(l => weekday(l.date) === dow)
      return {
        dow, short: PL_DAYS_SHORT[dow], full: PL_DAYS_FULL[dow],
        value: avg(dayLogs.map(logAvgEnergy)),
        count: dayLogs.length,
      }
    }),
    hasEnoughData: withMood.length >= MIN_TOTAL,
  })

  // ─ 6. Dzień tygodnia → nastrój ───────────────────────────────────────────
  insights.push({
    type: 'dow', id: 'dow_mood',
    icon: '😊', title: 'Nastrój według dnia tygodnia',
    metric: 'mood',
    byDay: [0,1,2,3,4,5,6].map(dow => {
      const dayLogs = withMood.filter(l => weekday(l.date) === dow)
      return {
        dow, short: PL_DAYS_SHORT[dow], full: PL_DAYS_FULL[dow],
        value: avg(dayLogs.map(logAvgMood)),
        count: dayLogs.length,
      }
    }),
    hasEnoughData: withMood.length >= MIN_TOTAL,
  })

  // ─ 7. Dotrzymane zasady → nastrój ────────────────────────────────────────
  const rulesWith    = withMood.filter(l => (l.keptRules?.length ?? 0) > 0)
  const rulesWithout = withMood.filter(l => (l.keptRules?.length ?? 0) === 0)
  insights.push({
    type: 'comparison', id: 'rules_mood',
    icon: '🛡️', title: 'Dotrzymane zasady → nastrój',
    withLabel: 'Dni, gdy trzymałaś zasady', withoutLabel: 'Pozostałe dni',
    metric: 'mood',
    withValue:    avg(rulesWith.map(logAvgMood)),
    withoutValue: avg(rulesWithout.map(logAvgMood)),
    withCount: rulesWith.length, withoutCount: rulesWithout.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && rulesWith.length >= MIN_PER_GROUP
      && rulesWithout.length >= MIN_PER_GROUP,
  })

  // ─ 8. Wysoki XP → nastrój ────────────────────────────────────────────────
  const allXP = Object.values(logs).map(l => l.totalXP)
  const medianXP = allXP.sort((a,b) => a-b)[Math.floor(allXP.length / 2)] ?? 0
  const highXP = withMood.filter(l => l.totalXP > medianXP)
  const lowXP  = withMood.filter(l => l.totalXP <= medianXP)
  insights.push({
    type: 'comparison', id: 'xp_mood',
    icon: '⚡', title: 'Wysoki XP → nastrój',
    withLabel: `Dni z XP > ${medianXP} (mediana)`, withoutLabel: 'Pozostałe dni',
    metric: 'mood',
    withValue:    avg(highXP.map(logAvgMood)),
    withoutValue: avg(lowXP.map(logAvgMood)),
    withCount: highXP.length, withoutCount: lowXP.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && highXP.length >= MIN_PER_GROUP
      && lowXP.length >= MIN_PER_GROUP,
  })

  return insights
}
