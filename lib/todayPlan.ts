// „Co dziś" w jednym miejscu: podział rutyny (ta sama logika co RoutineChecklist),
// postęp dnia i kolejka do trybu „Jedna rzecz". Czyste funkcje — komponenty
// podają getEffectiveItems z useRoutineConfig i log dnia, testy podają atrapy.

import { getTodayWeeklyHabits, getWeeklyStudyItem } from './routineData'
import { filterItemsForMinimumDay } from './minimumDayLogic'
import { dateKey } from './gameLogic'
import type { AprilQuest, QuestBook } from './seasonal/aprilData'
import type { QuestPostpone } from '@/hooks/useAprilQuests'
import type { DailyLog, MinimumDayReason, Pillar, RoutineItem } from '@/types'

export type Slot = 'morning' | 'daily' | 'evening'
export type GetEffectiveItems = (
  category: Slot,
  isMinimum: boolean,
  extraDailyItems?: RoutineItem[],
  minimumReason?: MinimumDayReason,
) => RoutineItem[]

export interface SlotSplit { essential: RoutineItem[]; optional: RoutineItem[] }
export interface TodayRoutine {
  morning: SlotSplit
  daily: SlotSplit
  evening: SlotSplit
  /** Zadania dnia przeniesione NA dziś z innego dnia. */
  carried: RoutineItem[]
  /** Id zadań, które wolno przenieść na jutro (tygodniowe + temat tygodnia). */
  postponableIds: Set<string>
  /** Ile pozycji „Dzień" to stała baza (reszta to tygodniowe + temat). */
  dailyBaseCount: number
}

// „Po wstaniu 30 minut bez telefonu" — da się zrobić tylko zaraz po przebudzeniu.
// Niezrobione nie blokuje postępu ani paska „Teraz" (jak w DashboardNow).
export const PHONE_ITEM_ID = 'm1'

/**
 * Rutyna na dziś — 1:1 z RoutineChecklist: tygodniowe nawyki, temat tygodnia
 * w pn/śr/pt, w weekend tylko własne pozycje „Dzień", przeniesione Z dziś
 * schowane, przeniesione NA dziś dorzucone, dzień minimum zawęża wg powodu.
 */
export function buildTodayRoutine(
  getEffectiveItems: GetEffectiveItems,
  todayLog: Pick<DailyLog, 'dayMode' | 'minimumReason' | 'postponedRoutine' | 'carriedRoutine'> | null,
  forDate: Date,
): TodayRoutine {
  const dow = forDate.getDay()
  const isWeekday = dow >= 1 && dow <= 5
  const weeklyToday = getTodayWeeklyHabits(forDate)
  const studyItem = getWeeklyStudyItem(forDate)
  const extraDaily = [...weeklyToday, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
  const postponedAway = todayLog?.postponedRoutine ?? []
  const allDaily = (isWeekday
    ? getEffectiveItems('daily', false, extraDaily)
    : [...extraDaily, ...getEffectiveItems('daily', false).filter(i => i.id.startsWith('custom_'))]
  ).filter(i => !postponedAway.includes(i.id))
  const carried: RoutineItem[] = (todayLog?.carriedRoutine ?? [])
    .filter(c => !allDaily.some(i => i.id === c.id))
    .map(c => ({ id: c.id, text: c.text, xp: c.xp, type: 'daily' }))

  const isMinimum = (todayLog?.dayMode ?? 'normal') === 'minimum'
  const reason = todayLog?.minimumReason
  const split = (cat: 'morning' | 'evening'): SlotSplit => {
    const full = getEffectiveItems(cat, false)
    if (!isMinimum || !reason) return { essential: full, optional: [] }
    const ess = filterItemsForMinimumDay(full, reason)
    return { essential: ess, optional: full.filter(i => !ess.some(e => e.id === i.id)) }
  }

  return {
    morning: split('morning'),
    evening: split('evening'),
    daily: isMinimum && reason ? { essential: [], optional: allDaily } : { essential: allDaily, optional: [] },
    carried,
    postponableIds: new Set([...weeklyToday.map(i => i.id), studyItem.id]),
    dailyBaseCount: isWeekday && !isMinimum ? getEffectiveItems('daily', false).length : 0,
  }
}

// ── Pora dnia ────────────────────────────────────────────────────────

/** Wieczór 18:00–02:59 (dzień resetuje się o 3:00) — jak w DashboardNow. */
export function isEveningWindow(hour: number): boolean {
  return hour >= 18 || hour < 3
}

// ── Postęp dnia ──────────────────────────────────────────────────────

export interface DayProgress {
  done: number
  total: number
  /** 0–100 */
  pct: number
}

/**
 * Postęp dnia: rutyna „essential" (ranek + dzień + przeniesione + wieczór)
 * + dzisiejsze questy. „Telefon po wstaniu" liczy się tylko, gdy zrobiony —
 * inaczej 100% byłoby po 10:00 nieosiągalne.
 */
export function computeDayProgress(
  routine: TodayRoutine,
  completedRoutine: string[],
  todayQuests: AprilQuest[],
  completedQuests: string[],
): DayProgress {
  const done = new Set(completedRoutine)
  const items = [...routine.morning.essential, ...routine.daily.essential, ...routine.carried, ...routine.evening.essential]
    .filter(i => i.id !== PHONE_ITEM_ID || done.has(i.id))
  const qDone = new Set(completedQuests)
  const total = items.length + todayQuests.length
  const count = items.filter(i => done.has(i.id)).length + todayQuests.filter(q => qDone.has(q.id)).length
  return { done: count, total, pct: total === 0 ? 0 : Math.round((count / total) * 100) }
}

// ── Kolejka „Jedna rzecz" ────────────────────────────────────────────

export interface FocusItem {
  /** Unikalny klucz w kolejce (`r:` rutyna, `q:` quest). */
  key: string
  kind: 'routine' | 'quest'
  id: string
  title: string
  description?: string
  xp: number
  slot: Slot | 'quest'
  pillar?: Pillar
  href?: string
  overdue?: boolean
}

const fromRoutine = (slot: Slot) => (i: RoutineItem): FocusItem => ({
  key: `r:${i.id}`, kind: 'routine', id: i.id, title: i.text, xp: i.xp, slot, href: i.href,
})
const fromQuest = (overdue: boolean) => (q: AprilQuest): FocusItem => ({
  key: `q:${q.id}`, kind: 'quest', id: q.id, title: q.title, description: q.description,
  xp: q.xp, slot: 'quest', pillar: q.pillar, overdue,
})

/**
 * Kolejka na teraz, ułożona wg pory dnia: rano poranek → questy → dzień,
 * w ciągu dnia dzień → questy, wieczorem wieczór → questy. Poranek znika
 * z kolejki od 18:00, wieczór pojawia się od 18:00; zaległe questy na końcu.
 * Bez rzeczy zrobionych — kolejka to wyłącznie „co zostało".
 */
export function buildFocusQueue(input: {
  routine: TodayRoutine
  completedRoutine: string[]
  todayQuests: AprilQuest[]
  overdueQuests: AprilQuest[]
  completedQuests: string[]
  hour: number
  isMinimum?: boolean
}): FocusItem[] {
  const { routine, todayQuests, overdueQuests, hour } = input
  const done = new Set(input.completedRoutine)
  const qDone = new Set(input.completedQuests)
  const evening = isEveningWindow(hour)

  const morning = evening ? [] : routine.morning.essential
    .filter(i => i.id !== PHONE_ITEM_ID || hour < 10)
    .map(fromRoutine('morning'))
  const daily = [...routine.daily.essential, ...routine.carried].map(fromRoutine('daily'))
  const eve = evening ? routine.evening.essential.map(fromRoutine('evening')) : []
  const quests = todayQuests.map(fromQuest(false))
  const overdue = overdueQuests.map(fromQuest(true))

  const ordered = evening
    ? [...eve, ...quests, ...daily]
    : hour < 12
      ? [...morning, ...quests, ...daily]
      : [...morning, ...daily, ...quests]

  const seen = new Set<string>()
  return [...ordered, ...overdue].filter(item => {
    if (seen.has(item.key)) return false
    seen.add(item.key)
    return item.kind === 'routine' ? !done.has(item.id) : !qDone.has(item.id)
  })
}

// ── Seria ────────────────────────────────────────────────────────────

export type StreakState = 'kept' | 'pending' | 'rescuable' | 'none'

/**
 * Stan serii widziany z dziś (te same reguły co applyStreakIfNeeded): zaliczona
 * dziś, czeka na dziś (ostatnia wczoraj) albo do uratowania zamrożeniem —
 * dokładnie jeden dzień przerwy i zamrożenie w tym miesiącu jeszcze wolne.
 */
export function streakState(
  lastStreakDate: string | null | undefined,
  currentStreak: number,
  today: string,
  freezeAvailable: boolean,
): StreakState {
  if (!lastStreakDate || currentStreak <= 0) return 'none'
  const [y, m, d] = today.split('-').map(Number)
  const daysAgo = (n: number) => dateKey(new Date(y, m - 1, d - n))
  if (lastStreakDate === today) return 'kept'
  if (lastStreakDate === daysAgo(1)) return 'pending'
  if (lastStreakDate === daysAgo(2) && freezeAvailable) return 'rescuable'
  return 'none'
}

// ── Questy na dziś ───────────────────────────────────────────────────

/**
 * Questy dnia jak w DailyQuests: natywne na dziś (bez przeniesionych dalej)
 * + przeniesione NA dziś, bez pominiętych; osobno zaległe z okna 7 dni.
 */
export function selectTodayQuests(
  book: QuestBook,
  log: { completed: string[]; postponed: QuestPostpone[] },
  skippedIds: string[],
  today: string,
): { todayQuests: AprilQuest[]; overdueQuests: AprilQuest[] } {
  const native = book.questsForDate(today)
  const moved = book.postponedForDate(today, log.postponed)
  const awayIds = log.postponed.filter(p => p.targetDate > today).map(p => p.questId)
  const todayQuests = [
    ...native.filter(q => !awayIds.includes(q.id)),
    ...moved.filter(q => !native.some(n => n.id === q.id)),
  ].filter(q => !skippedIds.includes(q.id))
  return { todayQuests, overdueQuests: book.overdue(today, log.completed, skippedIds, log.postponed) }
}
