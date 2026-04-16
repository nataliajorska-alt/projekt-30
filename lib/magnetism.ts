import type { DailyLog } from '@/types'
import { MORNING_ROUTINE } from './routineData'
import { APRIL_QUESTS } from './aprilData'
import { SIDE_QUESTS } from './questData'

export interface MagnetismBreakdown {
  morning: number   // 0–35
  cialo: number     // 0–25
  social: number    // 0–20
  ghost: number     // 0–10
  style: number     // 0–10
  total: number     // 0–100
}

const MORNING_COUNT = MORNING_ROUTINE.length

function hasCialoActivity(log: DailyLog): boolean {
  // Ręczny toggle ma priorytet
  if (log.physicalActivity) return true
  // Fallback: quest z filarem ciało
  const ids = [...log.completedDailyQuests, ...log.completedSideQuests]
  if (ids.length === 0) return false
  const all = [...APRIL_QUESTS, ...SIDE_QUESTS]
  return ids.some(id => all.find(q => q.id === id)?.pillar === 'cialo')
}

export function calcMagnetism(log: DailyLog): MagnetismBreakdown {
  const morningDone = log.completedRoutine.filter(id => id.startsWith('m')).length
  const morning = Math.round((morningDone / MORNING_COUNT) * 35)

  const cialo = hasCialoActivity(log) ? 25 : 0
  const social = log.socialPresence ? 20 : 0
  // Ghost: 10 pkt za samo nie napisanie (r1 kept), niezależnie od użycia Ghost Protocol
  const ghost = log.keptRules.includes('r1') ? 10 : 0
  const style = log.keptRules.includes('r3') ? 10 : 0

  return { morning, cialo, social, ghost, style, total: morning + cialo + social + ghost + style }
}

export function magnetismLabel(score: number): string {
  if (score >= 85) return 'Promieniujesz'
  if (score >= 65) return 'Wysoka energia'
  if (score >= 45) return 'Dobry dzień'
  if (score >= 25) return 'Budujący'
  return 'Spokojny'
}

export function magnetismColor(score: number): string {
  if (score >= 85) return '#B8963E'   // gold
  if (score >= 65) return '#6B9E6B'   // green
  if (score >= 45) return '#8BA8C4'   // blue
  if (score >= 25) return '#C4A882'   // warm
  return '#9B8E84'                    // muted
}
