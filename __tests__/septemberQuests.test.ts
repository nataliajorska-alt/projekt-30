import { describe, it, expect } from 'vitest'
import { SEPTEMBER_QUESTS } from '@/lib/seasonal/septemberData'
import {
  APRIL_QUESTS,
  getAprilQuestsForDate,
  getOverdueAprilQuests,
  isNoRollover,
} from '@/lib/seasonal/aprilData'

// Wrzesień '26 (LEKKOŚĆ) ma inną fizykę niż poprzednie miesiące:
// jeden quest dziennie 6–30.09, każdy z literą mięśnia, i zero nadrabiania.

describe('pula wrześniowa', () => {
  it('ma 25 questów, po jednym na dzień od 6 do 30.09', () => {
    expect(SEPTEMBER_QUESTS).toHaveLength(25)
    const dates = SEPTEMBER_QUESTS.map(q => q.date)
    expect(new Set(dates).size).toBe(25)
    expect(dates[0]).toBe('2026-09-06')
    expect(dates[dates.length - 1]).toBe('2026-09-30')
    for (const d of dates) expect(d >= '2026-09-06' && d <= '2026-09-30').toBe(true)
  })

  it('jest podpięta do wspólnej puli i ma unikalne id', () => {
    for (const q of SEPTEMBER_QUESTS) {
      expect(getAprilQuestsForDate(q.date)).toEqual([q])
    }
    const ids = APRIL_QUESTS.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('każdy quest ma literę, a rozkład mięśni zgadza się z planerem (A4 B7 C12 D4)', () => {
    const count = { A: 0, B: 0, C: 0, D: 0 }
    for (const q of SEPTEMBER_QUESTS) {
      expect(q.muscles?.length).toBeGreaterThan(0)
      for (const m of q.muscles!) count[m] += 1
    }
    expect(count).toEqual({ A: 4, B: 7, C: 12, D: 4 })
  })
})

describe('zasada 2 — niezrobiony quest nie przechodzi na jutro', () => {
  it('wrzesień jest miesiącem bez nadrabiania, sierpień nie', () => {
    expect(isNoRollover('2026-09-06')).toBe(true)
    expect(isNoRollover('2026-08-31')).toBe(false)
    expect(isNoRollover('2026-10-01')).toBe(false)
  })

  it('nie zwraca zaległych questów z września, ale nadal zwraca sierpniowe', () => {
    const overdue = getOverdueAprilQuests('2026-09-20', [], [], [])
    expect(overdue.some(q => q.date.startsWith('2026-09'))).toBe(false)
    expect(overdue.some(q => q.date.startsWith('2026-08'))).toBe(true)
  })
})
