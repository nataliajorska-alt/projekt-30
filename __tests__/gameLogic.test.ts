import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getLevelFromXP,
  getNextLevel,
  getLevelProgress,
  getISOWeekKey,
  getMonthKey,
  dateKey,
  todayKey,
  tomorrowKey,
  getEffectiveNow,
  getDaysElapsed,
  getDaysRemaining,
  getProjectProgress,
  getGardenStage,
  getNextGardenStage,
  getStageProgress,
  getPace,
  LEVELS,
  TOTAL_DAYS,
  DAY_START_HOUR,
} from '@/lib/gameLogic'

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0).level).toBe(1)
    expect(getLevelFromXP(0).name).toBe(LEVELS[0].name)
  })

  it('returns level 1 just below the level 2 threshold', () => {
    expect(getLevelFromXP(699).level).toBe(1)
  })

  it('jumps to level 2 exactly at threshold (700)', () => {
    expect(getLevelFromXP(700).level).toBe(2)
    expect(getLevelFromXP(700).name).toBe(LEVELS[1].name)
  })

  it('returns level 30 at 200 000 XP', () => {
    expect(getLevelFromXP(200000).level).toBe(30)
    expect(getLevelFromXP(200000).name).toBe(LEVELS[29].name)
  })

  it('caps at level 30 even with absurd XP', () => {
    expect(getLevelFromXP(999999).level).toBe(30)
  })

  it('handles negative XP gracefully — returns level 1', () => {
    expect(getLevelFromXP(-50).level).toBe(1)
  })
})

describe('getNextLevel', () => {
  it('returns level 2 for someone at level 1', () => {
    expect(getNextLevel(0)?.level).toBe(2)
  })

  it('returns null at max level (30)', () => {
    expect(getNextLevel(200000)).toBeNull()
  })

  it('returns level 11 for someone with 17 200 XP (just hit lvl 10)', () => {
    expect(getNextLevel(17200)?.level).toBe(11)
  })
})

describe('getLevelProgress', () => {
  it('is 0 right at the start of a level', () => {
    expect(getLevelProgress(0)).toBe(0)
    expect(getLevelProgress(700)).toBe(0)
  })

  it('is ~50 halfway between thresholds', () => {
    // Level 1 (0) → Level 2 (700), midpoint = 350
    const p = getLevelProgress(350)
    expect(p).toBeGreaterThanOrEqual(49)
    expect(p).toBeLessThanOrEqual(51)
  })

  it('is 100 at max level (level 30)', () => {
    expect(getLevelProgress(200000)).toBe(100)
    expect(getLevelProgress(999999)).toBe(100)
  })

  it('approaches 100 just before next level threshold', () => {
    expect(getLevelProgress(699)).toBeGreaterThanOrEqual(99)
  })
})

describe('LEVELS structure', () => {
  it('has exactly 30 levels', () => {
    expect(LEVELS.length).toBe(30)
  })

  it('has strictly increasing XP requirements', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired)
    }
  })

  it('starts level 1 at 0 XP and ends level 30 at 200 000 XP', () => {
    expect(LEVELS[0]).toMatchObject({ level: 1, xpRequired: 0 })
    expect(LEVELS[29]).toMatchObject({ level: 30, xpRequired: 200000 })
  })

  it('has unique level numbers and unique names', () => {
    const levels = LEVELS.map(l => l.level)
    const names = LEVELS.map(l => l.name)
    expect(new Set(levels).size).toBe(LEVELS.length)
    expect(new Set(names).size).toBe(LEVELS.length)
  })
})

describe('dateKey', () => {
  it('formats with zero-padded month and day', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')   // styczeń = miesiąc 0
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('getMonthKey', () => {
  it('zero-pads single-digit months', () => {
    expect(getMonthKey(new Date(2026, 0, 1))).toBe('2026-01')
    expect(getMonthKey(new Date(2026, 9, 15))).toBe('2026-10')
  })
})

describe('getISOWeekKey', () => {
  it('returns 2026-W01 for early January', () => {
    // 5 stycznia 2026 to poniedziałek — wpada w W02 (W01 zawiera 1-4 stycznia)
    expect(getISOWeekKey(new Date(2026, 0, 5))).toBe('2026-W02')
  })

  it('treats Sunday as end of week, not start (ISO 8601)', () => {
    // 4 stycznia 2026 = niedziela = ostatni dzień W01
    expect(getISOWeekKey(new Date(2026, 0, 4))).toBe('2026-W01')
    // 5 stycznia 2026 = poniedziałek = pierwszy dzień W02
    expect(getISOWeekKey(new Date(2026, 0, 5))).toBe('2026-W02')
  })

  it('returns 2026-W14 for the Sunday before project start (Apr 5, 2026)', () => {
    // 5 kwietnia 2026 = niedziela
    expect(getISOWeekKey(new Date(2026, 3, 5))).toBe('2026-W14')
  })
})

describe('getEffectiveNow / DAY_START_HOUR', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('treats 1:30 AM as previous day (before DAY_START_HOUR)', () => {
    vi.setSystemTime(new Date(2026, 4, 2, 1, 30))   // 2 maja, 1:30
    const eff = getEffectiveNow()
    expect(eff.getDate()).toBe(1)   // cofnięty na 1 maja
  })

  it('treats 2:59 AM as previous day', () => {
    vi.setSystemTime(new Date(2026, 4, 2, 2, 59))
    expect(getEffectiveNow().getDate()).toBe(1)
  })

  it('treats 3:00 AM as current day', () => {
    vi.setSystemTime(new Date(2026, 4, 2, 3, 0))
    expect(getEffectiveNow().getDate()).toBe(2)
  })

  it('treats noon as current day', () => {
    vi.setSystemTime(new Date(2026, 4, 2, 12, 0))
    expect(getEffectiveNow().getDate()).toBe(2)
  })

  it('DAY_START_HOUR is 3', () => {
    expect(DAY_START_HOUR).toBe(3)
  })
})

describe('todayKey / tomorrowKey', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns YYYY-MM-DD for today', () => {
    vi.setSystemTime(new Date(2026, 4, 1, 14, 0))   // 1 maja, 14:00
    expect(todayKey()).toBe('2026-05-01')
  })

  it('returns yesterday-style key when called at 1 AM (before DAY_START_HOUR)', () => {
    vi.setSystemTime(new Date(2026, 4, 2, 1, 30))   // 2 maja, 1:30 → traktowane jako 1 maja
    expect(todayKey()).toBe('2026-05-01')
  })

  it('tomorrowKey is one day after todayKey', () => {
    vi.setSystemTime(new Date(2026, 4, 1, 14, 0))
    expect(todayKey()).toBe('2026-05-01')
    expect(tomorrowKey()).toBe('2026-05-02')
  })

  it('handles month rollover correctly', () => {
    vi.setSystemTime(new Date(2026, 4, 31, 14, 0))  // 31 maja
    expect(tomorrowKey()).toBe('2026-06-01')
  })

  it('handles year rollover correctly', () => {
    vi.setSystemTime(new Date(2026, 11, 31, 14, 0)) // 31 grudnia 2026
    expect(tomorrowKey()).toBe('2027-01-01')
  })
})

describe('project progress', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('TOTAL_DAYS is 365', () => {
    expect(TOTAL_DAYS).toBe(365)
  })

  it('returns 0 elapsed days on the project start date', () => {
    vi.setSystemTime(new Date(2026, 3, 5, 12, 0))   // 5 kwietnia 2026, południe
    expect(getDaysElapsed()).toBe(0)
  })

  it('returns 30 elapsed days a month into the project', () => {
    vi.setSystemTime(new Date(2026, 4, 5, 12, 0))   // 5 maja 2026
    expect(getDaysElapsed()).toBe(30)
  })

  it('clamps remaining days at 0 past the end date', () => {
    vi.setSystemTime(new Date(2027, 5, 1, 12, 0))   // 1 czerwca 2027 — po końcu
    expect(getDaysRemaining()).toBe(0)
  })

  it('progress is 0 at start, ~8% one month in, 100 at/after end', () => {
    vi.setSystemTime(new Date(2026, 3, 5, 12, 0))
    expect(getProjectProgress()).toBe(0)
    vi.setSystemTime(new Date(2026, 4, 5, 12, 0))
    expect(getProjectProgress()).toBeGreaterThanOrEqual(7)
    expect(getProjectProgress()).toBeLessThanOrEqual(9)
    vi.setSystemTime(new Date(2027, 5, 1, 12, 0))
    expect(getProjectProgress()).toBe(100)
  })
})

describe('getGardenStage', () => {
  // Asercje strukturalne, nie po nazwach — stageName zmieniał się już PL→EN,
  // a logika (granice stage'ów) jest tym, co naprawdę testujemy.
  it('keeps level 1-2 in the same first stage', () => {
    expect(getGardenStage(1).stageName).toBe(getGardenStage(2).stageName)
    expect(getGardenStage(2).maxLevel).toBe(2)
  })

  it('moves to a new stage at level 3', () => {
    expect(getGardenStage(3).stageName).not.toBe(getGardenStage(2).stageName)
    expect(getGardenStage(3).stageName).toBe(getGardenStage(4).stageName)
  })

  it('returns the final stage at level 30', () => {
    expect(getGardenStage(30).maxLevel).toBe(30)
    expect(getGardenStage(30).stageName.length).toBeGreaterThan(0)
  })

  it('clamps absurd levels to the last stage', () => {
    expect(getGardenStage(999).stageName).toBe(getGardenStage(30).stageName)
  })
})

describe('getNextGardenStage', () => {
  it('returns the stage that begins after the current one', () => {
    expect(getNextGardenStage(1)?.stageName).toBe(getGardenStage(3).stageName)
  })

  it('returns null at the final stage', () => {
    expect(getNextGardenStage(30)).toBeNull()
  })

  it('points to the level-25 stage when at level 24', () => {
    expect(getNextGardenStage(24)?.stageName).toBe(getGardenStage(25).stageName)
  })
})

describe('getStageProgress', () => {
  it('is 0 at the very start of a stage', () => {
    // Nasienie zaczyna się od level 1 = 0 XP
    expect(getStageProgress(0)).toBe(0)
  })

  it('is 100 once reaching the next stage threshold', () => {
    // Kiełek zaczyna się na level 3 = 1700 XP
    expect(getStageProgress(1700)).toBe(0)   // właśnie wszedł w Kiełek
    expect(getStageProgress(1699)).toBeGreaterThanOrEqual(99)  // tuż przed
  })

  it('is 100 at the final stage', () => {
    expect(getStageProgress(200000)).toBe(100)
    expect(getStageProgress(999999)).toBe(100)
  })

  it('returns value between 0 and 100', () => {
    for (const xp of [0, 100, 1000, 5000, 50000, 150000, 200000]) {
      const p = getStageProgress(xp)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(100)
    }
  })
})

describe('getPace', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns on-track on day 0 with 0 XP', () => {
    vi.setSystemTime(new Date(2026, 3, 5, 12, 0))   // start projektu
    const p = getPace(0)
    expect(p.status).toBe('on-track')
    expect(p.expectedXP).toBe(0)
  })

  it('returns ahead when XP exceeds expected by ≥ 1 day', () => {
    vi.setSystemTime(new Date(2026, 4, 5, 12, 0))   // 30 dni in
    // Oczekiwane: ~16 438 XP (548 * 30). Symulujemy 20 000.
    const p = getPace(20000)
    expect(p.status).toBe('ahead')
    expect(p.diffDays).toBeGreaterThanOrEqual(1)
  })

  it('returns behind when XP is far below expected', () => {
    vi.setSystemTime(new Date(2026, 4, 5, 12, 0))
    const p = getPace(1000)
    expect(p.status).toBe('behind')
    expect(p.diffDays).toBeLessThanOrEqual(-1)
  })

  it('returns on-track for tiny deviation under 1 day', () => {
    vi.setSystemTime(new Date(2026, 4, 5, 12, 0))
    // ~16 438 oczekiwane, daj prawie tyle
    const p = getPace(16438)
    expect(p.status).toBe('on-track')
  })

  it('expectedXP rośnie liniowo z czasem', () => {
    vi.setSystemTime(new Date(2026, 3, 5, 12, 0))
    const day0 = getPace(0).expectedXP
    vi.setSystemTime(new Date(2026, 4, 5, 12, 0))   // +30 dni
    const day30 = getPace(0).expectedXP
    vi.setSystemTime(new Date(2026, 5, 5, 12, 0))   // +30 dni jeszcze
    const day61 = getPace(0).expectedXP
    expect(day30).toBeGreaterThan(day0)
    expect(day61).toBeGreaterThan(day30)
  })
})
