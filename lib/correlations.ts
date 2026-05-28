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
  const cr = log.completedRoutine ?? []
  const n = MORNING_IDS.filter(id => cr.includes(id)).length
  const m = MORNING_MIN.filter(id => cr.includes(id)).length
  return n >= 4 || m >= 2
}

function isEveningDone(log: DailyLog): boolean {
  const cr = log.completedRoutine ?? []
  const n = EVENING_IDS.filter(id => cr.includes(id)).length
  const m = EVENING_MIN.filter(id => cr.includes(id)).length
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

function sortedCheckIns(log: DailyLog) {
  return [...(log.moodCheckIns ?? [])].sort((a, b) => a.timestamp - b.timestamp)
}

// Mood/energy lift within a single day (last check-in − first check-in).
// Returns null if fewer than 2 check-ins exist.
function dayLift(log: DailyLog, metric: 'mood' | 'energy'): number | null {
  const ci = sortedCheckIns(log)
  if (ci.length < 2) return null
  return ci[ci.length - 1][metric] - ci[0][metric]
}

function firstCheckIn(log: DailyLog) {
  const ci = sortedCheckIns(log)
  return ci[0] ?? null
}

function weekday(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function questDoneAny(log: DailyLog): boolean {
  return (log.completedDailyQuests?.length ?? 0) > 0
}

function sideQuestDone(log: DailyLog): boolean {
  return (log.completedSideQuests?.length ?? 0) > 0
    || (log.customSideQuests?.length ?? 0) > 0
}

function hasCigarettes(log: DailyLog): boolean {
  return (log.cigarettes?.length ?? 0) > 0
}

function hasSocial(log: DailyLog): boolean {
  return log.socialPresence === true
}

function rulesKept(log: DailyLog): boolean {
  return (log.keptRules?.length ?? 0) > 0
}

// Iterate consecutive (yesterday, today) pairs only — skip gaps in logging.
function consecutivePairs(
  logs: Record<string, DailyLog>
): Array<{ prev: DailyLog; today: DailyLog }> {
  const keys = Object.keys(logs).sort()
  const out: Array<{ prev: DailyLog; today: DailyLog }> = []
  for (let i = 1; i < keys.length; i++) {
    const prevKey = keys[i - 1]
    const todayKey = keys[i]
    const diff = Math.round(
      (new Date(todayKey).getTime() - new Date(prevKey).getTime()) / 86400000
    )
    if (diff === 1) out.push({ prev: logs[prevKey], today: logs[todayKey] })
  }
  return out
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

// Directional insight — does action X actually CAUSE mood/energy to rise during the day?
// Compares within-day lift (last check-in − first check-in) between groups.
// Stronger evidence of causality than ComparisonInsight (which conflates "I felt good → did routine").
export interface LiftInsight {
  type: 'lift'
  id: string
  icon: string
  title: string
  subtitle: string             // what's being controlled / question being asked
  metric: 'mood' | 'energy'
  withLabel: string
  withoutLabel: string
  withLift: number | null      // avg same-day lift (e.g. +0.6 means mood rose by 0.6 on those days)
  withoutLift: number | null
  withCount: number
  withoutCount: number
  hasEnoughData: boolean
}

// Day N's evening routine → Day N+1's morning mood.
// Tests whether yesterday's evening behavior predicts today's morning state.
export interface CarryoverInsight {
  type: 'carryover'
  id: string
  icon: string
  title: string
  subtitle: string
  metric: 'mood' | 'energy'
  withLabel: string            // "Po wieczorach z rutyną"
  withoutLabel: string
  withMorning: number | null   // avg first-of-day check-in value
  withoutMorning: number | null
  withCount: number
  withoutCount: number
  hasEnoughData: boolean
}

export type CorrelationInsight =
  | ComparisonInsight
  | DayOfWeekInsight
  | LiftInsight
  | CarryoverInsight

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
  const allXP = Object.values(logs).map(l => l.totalXP ?? 0)
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

  // ─ 9. Papierosy → nastrój (faza 1 = obserwacja, bez oceny) ──────────────
  const cigsWith    = withMood.filter(hasCigarettes)
  const cigsWithout = withMood.filter(l => !hasCigarettes(l))
  insights.push({
    type: 'comparison', id: 'cigarettes_mood',
    icon: '🚬', title: 'Papierosy → nastrój',
    withLabel: 'Dni z papierosami', withoutLabel: 'Dni bez papierosów',
    metric: 'mood',
    withValue:    avg(cigsWith.map(logAvgMood)),
    withoutValue: avg(cigsWithout.map(logAvgMood)),
    withCount: cigsWith.length, withoutCount: cigsWithout.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && cigsWith.length >= MIN_PER_GROUP
      && cigsWithout.length >= MIN_PER_GROUP,
  })

  // ─ 9b/9c. Mniej vs więcej papierosów → nastrój / energia ───────────────
  // W fazie 1 (obserwacja) zwykle nie ma dni "zero", więc porównanie z/bez
  // się nie odpali. Split po medianie dziennej liczby papierosów daje sygnał
  // już w trakcie fazy 1. Insight #9 zostaje — odpali się sam, gdy pojawią
  // się dni bez papierosów (faza 2+).
  const cigCountsSorted = withMood
    .map(l => l.cigarettes?.length ?? 0)
    .sort((a, b) => a - b)
  const cigMedian = cigCountsSorted[Math.floor(cigCountsSorted.length / 2)] ?? 0
  const cigsLess  = withMood.filter(l => (l.cigarettes?.length ?? 0) <= cigMedian)
  const cigsMore  = withMood.filter(l => (l.cigarettes?.length ?? 0) >  cigMedian)
  insights.push({
    type: 'comparison', id: 'cigarettes_less_more_mood',
    icon: '🚬', title: 'Mniej vs więcej papierosów → nastrój',
    withLabel: `Dni z ≤ ${cigMedian} papierosami`,
    withoutLabel: `Dni z > ${cigMedian} papierosami`,
    metric: 'mood',
    withValue:    avg(cigsLess.map(logAvgMood)),
    withoutValue: avg(cigsMore.map(logAvgMood)),
    withCount: cigsLess.length, withoutCount: cigsMore.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && cigsLess.length >= MIN_PER_GROUP
      && cigsMore.length >= MIN_PER_GROUP,
  })
  insights.push({
    type: 'comparison', id: 'cigarettes_less_more_energy',
    icon: '🚬', title: 'Mniej vs więcej papierosów → energia',
    withLabel: `Dni z ≤ ${cigMedian} papierosami`,
    withoutLabel: `Dni z > ${cigMedian} papierosami`,
    metric: 'energy',
    withValue:    avg(cigsLess.map(logAvgEnergy)),
    withoutValue: avg(cigsMore.map(logAvgEnergy)),
    withCount: cigsLess.length, withoutCount: cigsMore.length,
    hasEnoughData: withMood.length >= MIN_TOTAL
      && cigsLess.length >= MIN_PER_GROUP
      && cigsMore.length >= MIN_PER_GROUP,
  })

  // ── Lift insights — controlled directional comparisons ──────────────────────
  // Only days with ≥2 check-ins (so we can measure within-day lift).
  const withLift = Object.values(logs).filter(
    l => (l.moodCheckIns?.length ?? 0) >= 2
  )
  const MIN_LIFT_TOTAL = 5
  const MIN_LIFT_GROUP = 3

  // ─ L1. Morning routine → mood lift in the same day ───────────────────────
  {
    const wRoutine = withLift.filter(isMorningDone)
    const woRoutine = withLift.filter(l => !isMorningDone(l))
    const wLift  = wRoutine.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    const woLift = woRoutine.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_morning_mood',
      icon: '🌅', title: 'Czy rutyna poranna podnosi nastrój?',
      subtitle: 'Porównuje wzrost nastroju w ciągu dnia (ostatni − pierwszy check-in).',
      metric: 'mood',
      withLabel: 'W dni z rutyną poranną',
      withoutLabel: 'W dni bez rutyny porannej',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: withLift.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ L2. Odbicie z gorszego poranka — kluczowa odpowiedź na pytanie kierunku ─
  // Filtruje do dni, w których pierwszy check-in mood ≤ 3 (poniżej średniej).
  // Czy rutyna poranna podnosi nastrój kiedy zaczynałaś gorzej?
  {
    const lowStart = withLift.filter(l => {
      const f = firstCheckIn(l)
      return f !== null && f.mood <= 3
    })
    const wRoutine = lowStart.filter(isMorningDone)
    const woRoutine = lowStart.filter(l => !isMorningDone(l))
    const wLift  = wRoutine.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    const woLift = woRoutine.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_low_start_routine',
      icon: '🌑→🌤️', title: 'Odbicie z gorszego poranka',
      subtitle: 'Tylko dni, w których pierwszy check-in nastroju ≤ 3. Czy rutyna pomaga się odbić?',
      metric: 'mood',
      withLabel: 'Gorszy poranek + rutyna',
      withoutLabel: 'Gorszy poranek bez rutyny',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: lowStart.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ L3. Aktywność fizyczna → wzrost energii w ciągu dnia ──────────────────
  {
    const wAct  = withLift.filter(l => l.physicalActivity === true)
    const woAct = withLift.filter(l => !l.physicalActivity)
    const wLift  = wAct.map(l => dayLift(l, 'energy')!).filter(v => v !== null)
    const woLift = woAct.map(l => dayLift(l, 'energy')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_activity_energy',
      icon: '🏃', title: 'Czy aktywność realnie podnosi energię?',
      subtitle: 'Wzrost energii w ciągu dnia, gdy wykonałaś aktywność vs gdy nie.',
      metric: 'energy',
      withLabel: 'W dni z aktywnością',
      withoutLabel: 'W dni bez aktywności',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: withLift.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ L4. Obecność społeczna → wzrost nastroju w ciągu dnia ─────────────────
  {
    const wSoc  = withLift.filter(hasSocial)
    const woSoc = withLift.filter(l => !hasSocial(l))
    const wLift  = wSoc.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    const woLift = woSoc.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_social_mood',
      icon: '👥', title: 'Czy obecność ludzi podnosi nastrój?',
      subtitle: 'Wzrost nastroju w ciągu dnia w zależności od tego, czy był kontakt z kimś.',
      metric: 'mood',
      withLabel: 'W dni z kontaktem',
      withoutLabel: 'W dni samotne',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: withLift.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ L5. Side quest → wzrost nastroju w ciągu dnia ─────────────────────────
  {
    const wSq  = withLift.filter(sideQuestDone)
    const woSq = withLift.filter(l => !sideQuestDone(l))
    const wLift  = wSq.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    const woLift = woSq.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_sidequest_mood',
      icon: '🎯', title: 'Czy side quest realnie podnosi nastrój?',
      subtitle: 'Wzrost nastroju w dni, gdy pchnęłaś się poza rutynę vs gdy zostałaś przy minimum.',
      metric: 'mood',
      withLabel: 'Z side questem',
      withoutLabel: 'Bez side questa',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: withLift.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ L6. Dotrzymane zasady → wzrost nastroju w ciągu dnia ──────────────────
  {
    const wR  = withLift.filter(rulesKept)
    const woR = withLift.filter(l => !rulesKept(l))
    const wLift  = wR.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    const woLift = woR.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_rules_mood',
      icon: '🛡️', title: 'Czy trzymanie zasad podnosi nastrój?',
      subtitle: 'Czy nastrój ROŚNIE w dni z dotrzymanymi zasadami — nie tylko czy jest wyższy.',
      metric: 'mood',
      withLabel: 'Z dotrzymanymi zasadami',
      withoutLabel: 'Bez',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: withLift.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ L7. Quest dnia zrobiony → wzrost nastroju ─────────────────────────────
  // Test odwracający kierunek: czy quest podnosi mood, czy mood sprawia że robisz quest?
  {
    const wQ  = withLift.filter(questDoneAny)
    const woQ = withLift.filter(l => !questDoneAny(l))
    const wLift  = wQ.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    const woLift = woQ.map(l => dayLift(l, 'mood')!).filter(v => v !== null)
    insights.push({
      type: 'lift', id: 'lift_dailyquest_mood',
      icon: '◆', title: 'Czy quest dnia realnie podnosi nastrój?',
      subtitle: 'Test odwracający: quest powoduje wzrost — czy robisz go bo masz już dobry dzień?',
      metric: 'mood',
      withLabel: 'Z questem dnia',
      withoutLabel: 'Bez questa dnia',
      withLift: avg(wLift), withoutLift: avg(woLift),
      withCount: wLift.length, withoutCount: woLift.length,
      hasEnoughData: withLift.length >= MIN_LIFT_TOTAL
        && wLift.length >= MIN_LIFT_GROUP
        && woLift.length >= MIN_LIFT_GROUP,
    })
  }

  // ── Carryover — yesterday's evening → today's morning ──────────────────────
  // For each pair of consecutive logged days, compare today's first check-in
  // depending on whether yesterday had evening routine done.
  {
    const sortedKeys = Object.keys(logs).sort()
    const wMornings: number[] = []  // first-of-day mood after evening routine
    const woMornings: number[] = []
    for (let i = 1; i < sortedKeys.length; i++) {
      const prevKey = sortedKeys[i - 1]
      const todayKeyStr = sortedKeys[i]
      const prevDate = new Date(prevKey)
      const todayDate = new Date(todayKeyStr)
      const dayDiff = Math.round(
        (todayDate.getTime() - prevDate.getTime()) / 86400000
      )
      if (dayDiff !== 1) continue  // tylko sąsiednie dni
      const today = logs[todayKeyStr]
      const first = firstCheckIn(today)
      if (!first) continue
      if (isEveningDone(logs[prevKey])) wMornings.push(first.mood)
      else woMornings.push(first.mood)
    }
    insights.push({
      type: 'carryover', id: 'carryover_evening_morning',
      icon: '🌙→🌅', title: 'Wieczór → następny poranek',
      subtitle: 'Czy rutyna wieczorna przekłada się na lepszy nastrój następnego dnia rano?',
      metric: 'mood',
      withLabel: 'Po wieczorach z rutyną',
      withoutLabel: 'Po wieczorach bez rutyny',
      withMorning: avg(wMornings), withoutMorning: avg(woMornings),
      withCount: wMornings.length, withoutCount: woMornings.length,
      hasEnoughData: wMornings.length >= MIN_LIFT_GROUP
        && woMornings.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ C2. Wieczór z rutyną → poranna ENERGIA następnego dnia ────────────────
  {
    const pairs = consecutivePairs(logs)
    const w: number[] = []
    const wo: number[] = []
    for (const { prev, today } of pairs) {
      const first = firstCheckIn(today)
      if (!first) continue
      if (isEveningDone(prev)) w.push(first.energy)
      else wo.push(first.energy)
    }
    insights.push({
      type: 'carryover', id: 'carryover_evening_energy',
      icon: '🌙→⚡', title: 'Wieczór → poranna energia',
      subtitle: 'Czy rutyna wieczorna regeneruje — wpływa na energię, nie tylko nastrój następnego dnia.',
      metric: 'energy',
      withLabel: 'Po wieczorach z rutyną',
      withoutLabel: 'Po wieczorach bez rutyny',
      withMorning: avg(w), withoutMorning: avg(wo),
      withCount: w.length, withoutCount: wo.length,
      hasEnoughData: w.length >= MIN_LIFT_GROUP && wo.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ C3. Aktywność wczoraj → poranna energia dziś ──────────────────────────
  {
    const pairs = consecutivePairs(logs)
    const w: number[] = []
    const wo: number[] = []
    for (const { prev, today } of pairs) {
      const first = firstCheckIn(today)
      if (!first) continue
      if (prev.physicalActivity === true) w.push(first.energy)
      else wo.push(first.energy)
    }
    insights.push({
      type: 'carryover', id: 'carryover_activity_energy',
      icon: '🏃→🌅', title: 'Aktywność wczoraj → energia rano',
      subtitle: 'Czy wczorajszy ruch przekłada się na poranną energię dnia następnego?',
      metric: 'energy',
      withLabel: 'Po dniach z aktywnością',
      withoutLabel: 'Po dniach bez aktywności',
      withMorning: avg(w), withoutMorning: avg(wo),
      withCount: w.length, withoutCount: wo.length,
      hasEnoughData: w.length >= MIN_LIFT_GROUP && wo.length >= MIN_LIFT_GROUP,
    })
  }

  // ─ C4. Wysoki XP wczoraj → poranna energia dziś (sustainable pace) ───────
  {
    const pairs = consecutivePairs(logs)
    const w: number[] = []
    const wo: number[] = []
    for (const { prev, today } of pairs) {
      const first = firstCheckIn(today)
      if (!first) continue
      if ((prev.totalXP ?? 0) > medianXP) w.push(first.energy)
      else wo.push(first.energy)
    }
    insights.push({
      type: 'carryover', id: 'carryover_xp_energy',
      icon: '⚡→🌅', title: 'Mocny dzień wczoraj → energia rano',
      subtitle: `Czy dni z XP > ${medianXP} regenerują, czy zużywają? Test trwałego tempa.`,
      metric: 'energy',
      withLabel: 'Po dniach z wysokim XP',
      withoutLabel: 'Po dniach spokojnych',
      withMorning: avg(w), withoutMorning: avg(wo),
      withCount: w.length, withoutCount: wo.length,
      hasEnoughData: w.length >= MIN_LIFT_GROUP && wo.length >= MIN_LIFT_GROUP,
    })
  }

  return insights
}
