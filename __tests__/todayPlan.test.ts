import { describe, it, expect } from 'vitest'
import {
  buildTodayRoutine, computeDayProgress, buildFocusQueue, selectTodayQuests, streakState, PHONE_ITEM_ID,
  type GetEffectiveItems,
} from '@/lib/todayPlan'
import { getTodayWeeklyHabits, getWeeklyStudyItem } from '@/lib/routineData'
import { createQuestBook, getAprilQuestsForDate } from '@/lib/seasonal/aprilData'
import type { RoutineItem } from '@/types'

const item = (id: string, type: RoutineItem['type'], extra: Partial<RoutineItem> = {}): RoutineItem =>
  ({ id, text: `Pozycja ${id}`, type, xp: 10, ...extra })

const MORNING = [item(PHONE_ITEM_ID, 'morning'), item('m2', 'morning'), item('m3', 'morning')]
const EVENING = [item('e1', 'evening'), item('e2', 'evening')]
const DAILY = [item('d1', 'daily'), item('d2', 'daily'), item('custom_1', 'daily')]
const getItems: GetEffectiveItems = (cat, _min, extra) =>
  cat === 'morning' ? MORNING : cat === 'evening' ? EVENING : [...DAILY, ...(extra ?? [])]

const WED = new Date(2026, 10, 4, 9)  // środa 4.11.2026
const SAT = new Date(2026, 10, 7, 9)  // sobota 7.11.2026
const normal = { dayMode: 'normal' as const }

describe('rutyna na dziś — jak w RoutineChecklist', () => {
  it('dzień roboczy: baza + tygodniowe + temat tygodnia (pn/śr/pt)', () => {
    const r = buildTodayRoutine(getItems, normal, WED)
    const ids = r.daily.essential.map(i => i.id)
    expect(ids.slice(0, 3)).toEqual(['d1', 'd2', 'custom_1'])
    for (const w of getTodayWeeklyHabits(WED)) expect(ids).toContain(w.id)
    expect(ids).toContain(getWeeklyStudyItem(WED).id)
    expect(r.dailyBaseCount).toBe(3)
    expect(r.postponableIds.has(getWeeklyStudyItem(WED).id)).toBe(true)
  })

  it('weekend: bez stałej bazy, tylko tygodniowe i własne pozycje', () => {
    const ids = buildTodayRoutine(getItems, normal, SAT).daily.essential.map(i => i.id)
    expect(ids).not.toContain('d1')
    expect(ids).toContain('custom_1')
    expect(ids).not.toContain(getWeeklyStudyItem(SAT).id)
  })

  it('przeniesione Z dziś znikają, przeniesione NA dziś dochodzą (bez duplikatów)', () => {
    const r = buildTodayRoutine(getItems, {
      ...normal,
      postponedRoutine: ['d2'],
      carriedRoutine: [
        { id: 'x9', text: 'Z wczoraj', xp: 20, fromDate: '2026-11-03' },
        { id: 'd1', text: 'Dubel', xp: 10, fromDate: '2026-11-03' },
      ],
    }, WED)
    expect(r.daily.essential.map(i => i.id)).not.toContain('d2')
    expect(r.carried.map(i => i.id)).toEqual(['x9'])
  })

  it('dzień minimum: „Dzień" w opcjonalnych, ranek zawężony', () => {
    const r = buildTodayRoutine(getItems, { dayMode: 'minimum', minimumReason: 'okres' }, WED)
    expect(r.daily.essential).toEqual([])
    expect(r.daily.optional.length).toBeGreaterThan(0)
    const all = [...r.morning.essential, ...r.morning.optional].map(i => i.id).sort()
    expect(all).toEqual(MORNING.map(i => i.id).sort())
  })
})

describe('postęp dnia', () => {
  const r = buildTodayRoutine(getItems, normal, WED)
  const quests = getAprilQuestsForDate('2026-08-04')

  it('telefon po wstaniu liczy się tylko, gdy zrobiony', () => {
    const without = computeDayProgress(r, [], quests, [])
    const withPhone = computeDayProgress(r, [PHONE_ITEM_ID], quests, [])
    expect(withPhone.total).toBe(without.total + 1)
    expect(withPhone.done).toBe(1)
  })

  it('wszystko zrobione = 100%', () => {
    const allIds = [...r.morning.essential, ...r.daily.essential, ...r.evening.essential].map(i => i.id)
    expect(computeDayProgress(r, allIds, quests, quests.map(q => q.id)).pct).toBe(100)
    expect(computeDayProgress(r, [], [], []).pct).toBe(0)
  })
})

describe('kolejka „Jedna rzecz"', () => {
  const r = buildTodayRoutine(getItems, normal, WED)
  const quests = getAprilQuestsForDate('2026-08-04')
  const overdue = getAprilQuestsForDate('2026-08-03')
  const q = (hour: number, done: string[] = [], qDone: string[] = []) => buildFocusQueue({
    routine: r, completedRoutine: done, todayQuests: quests, overdueQuests: overdue, completedQuests: qDone, hour,
  })

  it('rano: poranek → questy → dzień, zaległe na końcu', () => {
    const items = q(8)
    expect(items[0].id).toBe(PHONE_ITEM_ID)
    expect(items.findIndex(i => i.kind === 'quest')).toBe(MORNING.length)
    expect(items.findIndex(i => i.id === 'd1')).toBeGreaterThan(MORNING.length + quests.length - 1)
    expect(items.slice(-overdue.length).every(i => i.overdue)).toBe(true)
  })

  it('po 10:00 bez telefonu, w ciągu dnia „Dzień" przed questami', () => {
    const items = q(14)
    expect(items.some(i => i.id === PHONE_ITEM_ID)).toBe(false)
    expect(items.findIndex(i => i.id === 'd1')).toBeLessThan(items.findIndex(i => i.kind === 'quest'))
  })

  it('wieczorem: wieczór najpierw, poranka już nie ma', () => {
    const items = q(20)
    expect(items[0].id).toBe('e1')
    expect(items.some(i => i.slot === 'morning')).toBe(false)
    expect(q(1)[0].id).toBe('e1') // 1:00 to wciąż wieczór poprzedniego dnia
  })

  it('bez rzeczy zrobionych', () => {
    const items = q(8, ['m2', 'd1'], [quests[0].id])
    expect(items.map(i => i.id)).not.toContain('m2')
    expect(items.map(i => i.id)).not.toContain('d1')
    expect(items.map(i => i.id)).not.toContain(quests[0].id)
  })
})

describe('seria widziana z dziś', () => {
  it('dziś zaliczona; wczoraj — czeka; przedwczoraj z wolnym zamrożeniem — do uratowania', () => {
    expect(streakState('2026-11-04', 12, '2026-11-04', true)).toBe('kept')
    expect(streakState('2026-11-03', 12, '2026-11-04', true)).toBe('pending')
    expect(streakState('2026-11-02', 12, '2026-11-04', true)).toBe('rescuable')
    expect(streakState('2026-11-02', 12, '2026-11-04', false)).toBe('none')
    expect(streakState('2026-11-01', 12, '2026-11-04', true)).toBe('none')
    expect(streakState(null, 0, '2026-11-04', true)).toBe('none')
    expect(streakState('2026-11-03', 0, '2026-11-04', true)).toBe('none')
  })

  it('przełom miesiąca i roku', () => {
    expect(streakState('2026-10-31', 5, '2026-11-01', false)).toBe('pending')
    expect(streakState('2026-12-31', 5, '2027-01-02', true)).toBe('rescuable')
  })
})

describe('questy na dziś', () => {
  it('przeniesione dalej znikają, przeniesione na dziś dochodzą, pominięte odpadają', () => {
    const book = createQuestBook()
    const { todayQuests } = selectTodayQuests(book, {
      completed: [],
      postponed: [
        { questId: 'aug_04_1', originalDate: '2026-08-04', targetDate: '2026-08-10', postponedAt: '' },
        { questId: 'aug_03_1', originalDate: '2026-08-03', targetDate: '2026-08-04', postponedAt: '' },
      ],
    }, ['aug_04_3'], '2026-08-04')
    expect(todayQuests.map(q => q.id)).toEqual(['aug_04_2', 'aug_03_1'])
  })
})
