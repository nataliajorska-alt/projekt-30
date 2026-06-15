import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { LEVELS } from '@/lib/gameLogic'
import type { UserStats, Pillar } from '@/types'

// Progi „poziom N" wyprowadzamy z LEVELS, a nie z literałów — inaczej test
// utrwalałby ewentualny błąd zamiast go łapać (kiedyś pinował 12000/52000/129000).
const lvlXP = (n: number): number => LEVELS.find(l => l.level === n)!.xpRequired

const baseStats: UserStats = {
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalDaysLogged: 0,
  totalRoutinesCompleted: 0,
  totalQuestsCompleted: 0,
  totalSideQuestsCompleted: 0,
  totalRulesKept: 0,
  pillarXP: {
    pozycja: 0, cialo: 0, styl: 0, kapital: 0,
    kariera: 0, tozsamosc: 0, milosc: 0,
  },
  unlockedAchievements: [],
  lastStreakDate: null,
  streakFreezeUsedMonths: [],
  reviewedWeeks: [],
  reviewedMonths: [],
  completedHeartBlocks: [],
  pillarBalanceWeeks: [],
  totalGhostProtocols: 0,
  consecutiveGhostDays: 0,
  lastGhostDate: null,
  highestDayXP: 0,
  consecutiveNormalDays: 0,
  lastNormalDay: null,
  consecutivePerfectMornings: 0,
  lastPerfectMorningDate: null,
  lastReturnCeremonyDate: null,
}

const stats = (overrides: Partial<UserStats>): UserStats => ({ ...baseStats, ...overrides })
const get = (id: string) => {
  const a = ACHIEVEMENTS.find(x => x.id === id)
  if (!a) throw new Error(`Achievement not found: ${id}`)
  return a
}

describe('ACHIEVEMENTS structure', () => {
  it('has 38 achievements', () => {
    expect(ACHIEVEMENTS.length).toBe(38)
  })

  it('all IDs are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all titles are non-empty strings', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.title.length).toBeGreaterThan(0)
      expect(a.description.length).toBeGreaterThan(0)
      expect(a.icon.length).toBeGreaterThan(0)
    }
  })

  it('all xpRewards are positive numbers', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.xpReward).toBeGreaterThan(0)
      expect(Number.isFinite(a.xpReward)).toBe(true)
    }
  })

  it('all conditions are functions returning boolean', () => {
    for (const a of ACHIEVEMENTS) {
      const result = a.condition(baseStats)
      expect(typeof result).toBe('boolean')
    }
  })

  it('no achievement triggers on a fresh empty profile', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.condition(baseStats)).toBe(false)
    }
  })
})

describe('day-based achievements', () => {
  it('first_day unlocks at totalDaysLogged >= 1', () => {
    expect(get('first_day').condition(stats({ totalDaysLogged: 0 }))).toBe(false)
    expect(get('first_day').condition(stats({ totalDaysLogged: 1 }))).toBe(true)
    expect(get('first_day').condition(stats({ totalDaysLogged: 365 }))).toBe(true)
  })

  it('month_1 unlocks at 30 days', () => {
    expect(get('month_1').condition(stats({ totalDaysLogged: 29 }))).toBe(false)
    expect(get('month_1').condition(stats({ totalDaysLogged: 30 }))).toBe(true)
  })

  it('days_60 unlocks at 60 days', () => {
    expect(get('days_60').condition(stats({ totalDaysLogged: 59 }))).toBe(false)
    expect(get('days_60').condition(stats({ totalDaysLogged: 60 }))).toBe(true)
  })
})

describe('streak-based achievements', () => {
  it.each([
    ['streak_3', 3],
    ['week_1', 7],
    ['streak_14', 14],
    ['streak_21', 21],
    ['streak_30', 30],
    ['streak_50', 50],
    ['streak_100', 100],
  ])('%s unlocks exactly at currentStreak >= %i', (id, threshold) => {
    expect(get(id).condition(stats({ currentStreak: threshold - 1 }))).toBe(false)
    expect(get(id).condition(stats({ currentStreak: threshold }))).toBe(true)
  })

  it('streak achievements use currentStreak, not longestStreak', () => {
    // longest 100 ale aktualny 0 — nie powinno odpalić
    expect(get('streak_100').condition(stats({ currentStreak: 0, longestStreak: 100 }))).toBe(false)
  })
})

describe('XP-based achievements', () => {
  it('xp_1000 unlocks at 1000 XP', () => {
    expect(get('xp_1000').condition(stats({ totalXP: 999 }))).toBe(false)
    expect(get('xp_1000').condition(stats({ totalXP: 1000 }))).toBe(true)
  })

  it('xp_5000 unlocks at 5000 XP', () => {
    expect(get('xp_5000').condition(stats({ totalXP: 5000 }))).toBe(true)
  })

  it.each([
    ['level_10', lvlXP(10)],
    ['level_20', lvlXP(20)],
    ['level_29', lvlXP(29)],
    ['level_30', lvlXP(30)],
  ])('%s unlocks at totalXP >= %i', (id, xp) => {
    expect(get(id).condition(stats({ totalXP: xp - 1 }))).toBe(false)
    expect(get(id).condition(stats({ totalXP: xp }))).toBe(true)
  })
})

describe('quest achievements', () => {
  it('quests_10 unlocks at 10 daily quests', () => {
    expect(get('quests_10').condition(stats({ totalQuestsCompleted: 9 }))).toBe(false)
    expect(get('quests_10').condition(stats({ totalQuestsCompleted: 10 }))).toBe(true)
  })

  it('quests_50 unlocks at 50', () => {
    expect(get('quests_50').condition(stats({ totalQuestsCompleted: 50 }))).toBe(true)
  })

  it('side_quest_5 / 20 use totalSideQuestsCompleted', () => {
    expect(get('side_quest_5').condition(stats({ totalSideQuestsCompleted: 5 }))).toBe(true)
    expect(get('side_quest_20').condition(stats({ totalSideQuestsCompleted: 19 }))).toBe(false)
    expect(get('side_quest_20').condition(stats({ totalSideQuestsCompleted: 20 }))).toBe(true)
  })

  it('first_side_quest unlocks at first one', () => {
    expect(get('first_side_quest').condition(stats({ totalSideQuestsCompleted: 1 }))).toBe(true)
  })
})

describe('all_pillars achievement', () => {
  const allFilled: Record<Pillar, number> = {
    pozycja: 10, cialo: 10, styl: 10, kapital: 10,
    kariera: 10, tozsamosc: 10, milosc: 10,
  }

  it('does not unlock if any pillar is at 0', () => {
    expect(get('all_pillars').condition(stats({ pillarXP: { ...allFilled, milosc: 0 } }))).toBe(false)
  })

  it('unlocks when all 7 pillars have any positive XP', () => {
    expect(get('all_pillars').condition(stats({ pillarXP: allFilled }))).toBe(true)
  })

  it('progress reports correct count of active pillars', () => {
    const partial: Record<Pillar, number> = {
      pozycja: 5, cialo: 5, styl: 0, kapital: 5,
      kariera: 0, tozsamosc: 5, milosc: 0,
    }
    const p = get('all_pillars').progress!(stats({ pillarXP: partial }))
    expect(p).toEqual({ current: 4, target: 7, label: 'filarów aktywnych' })
  })
})

describe('routine achievements', () => {
  it('routines_100 unlocks at 100 elements', () => {
    expect(get('routines_100').condition(stats({ totalRoutinesCompleted: 99 }))).toBe(false)
    expect(get('routines_100').condition(stats({ totalRoutinesCompleted: 100 }))).toBe(true)
  })
})

describe('rules / discipline achievements', () => {
  it('no_impulse_7 unlocks at 21 kept rules', () => {
    expect(get('no_impulse_7').condition(stats({ totalRulesKept: 20 }))).toBe(false)
    expect(get('no_impulse_7').condition(stats({ totalRulesKept: 21 }))).toBe(true)
  })

  it('rules_50 / rules_100 thresholds', () => {
    expect(get('rules_50').condition(stats({ totalRulesKept: 50 }))).toBe(true)
    expect(get('rules_100').condition(stats({ totalRulesKept: 99 }))).toBe(false)
    expect(get('rules_100').condition(stats({ totalRulesKept: 100 }))).toBe(true)
  })
})

describe('review achievements', () => {
  it('first_weekly_review unlocks after first week reviewed', () => {
    expect(get('first_weekly_review').condition(stats({ reviewedWeeks: [] }))).toBe(false)
    expect(get('first_weekly_review').condition(stats({ reviewedWeeks: ['2026-W15'] }))).toBe(true)
  })

  it('monthly_review_1 unlocks after first month reviewed', () => {
    expect(get('monthly_review_1').condition(stats({ reviewedMonths: ['2026-04'] }))).toBe(true)
  })
})

describe('behavioral achievements (ghost protocol, perfect mornings, no minimum)', () => {
  it('ghost_5 / 10 / 25 use totalGhostProtocols', () => {
    expect(get('ghost_5').condition(stats({ totalGhostProtocols: 5 }))).toBe(true)
    expect(get('ghost_10').condition(stats({ totalGhostProtocols: 9 }))).toBe(false)
    expect(get('ghost_25').condition(stats({ totalGhostProtocols: 25 }))).toBe(true)
  })

  it('ghost_streak_7 uses consecutiveGhostDays', () => {
    expect(get('ghost_streak_7').condition(stats({ consecutiveGhostDays: 6 }))).toBe(false)
    expect(get('ghost_streak_7').condition(stats({ consecutiveGhostDays: 7 }))).toBe(true)
  })

  it('no_minimum_7 / 30 use consecutiveNormalDays', () => {
    expect(get('no_minimum_7').condition(stats({ consecutiveNormalDays: 7 }))).toBe(true)
    expect(get('no_minimum_30').condition(stats({ consecutiveNormalDays: 29 }))).toBe(false)
    expect(get('no_minimum_30').condition(stats({ consecutiveNormalDays: 30 }))).toBe(true)
  })

  it('day_xp_150 / 250 use highestDayXP', () => {
    expect(get('day_xp_150').condition(stats({ highestDayXP: 149 }))).toBe(false)
    expect(get('day_xp_150').condition(stats({ highestDayXP: 150 }))).toBe(true)
    expect(get('day_xp_250').condition(stats({ highestDayXP: 250 }))).toBe(true)
  })

  it('perfect_morning_3 / 7 use consecutivePerfectMornings', () => {
    expect(get('perfect_morning_3').condition(stats({ consecutivePerfectMornings: 3 }))).toBe(true)
    expect(get('perfect_morning_7').condition(stats({ consecutivePerfectMornings: 6 }))).toBe(false)
    expect(get('perfect_morning_7').condition(stats({ consecutivePerfectMornings: 7 }))).toBe(true)
  })
})

describe('progress functions cap current at target', () => {
  it('first_day progress caps at 1', () => {
    const p = get('first_day').progress!(stats({ totalDaysLogged: 999 }))
    expect(p.current).toBe(1)
    expect(p.target).toBe(1)
  })

  it('streak_30 progress caps at 30', () => {
    const p = get('streak_30').progress!(stats({ currentStreak: 100 }))
    expect(p.current).toBe(30)
    expect(p.target).toBe(30)
  })

  it('xp_1000 progress caps at 1000', () => {
    const p = get('xp_1000').progress!(stats({ totalXP: 50000 }))
    expect(p.current).toBe(1000)
    expect(p.target).toBe(1000)
  })

  it('progress is 0 on a fresh profile', () => {
    for (const a of ACHIEVEMENTS) {
      if (!a.progress) continue
      const p = a.progress(baseStats)
      expect(p.current).toBe(0)
      expect(p.target).toBeGreaterThan(0)
    }
  })
})

describe('full unlock simulation', () => {
  it('a maxed-out profile unlocks every achievement', () => {
    const maxed = stats({
      totalXP: 250000,
      currentStreak: 200,
      longestStreak: 200,
      totalDaysLogged: 365,
      totalRoutinesCompleted: 1000,
      totalQuestsCompleted: 100,
      totalSideQuestsCompleted: 50,
      totalRulesKept: 200,
      pillarXP: {
        pozycja: 100, cialo: 100, styl: 100, kapital: 100,
        kariera: 100, tozsamosc: 100, milosc: 100,
      },
      reviewedWeeks: ['w1', 'w2'],
      reviewedMonths: ['m1'],
      totalGhostProtocols: 50,
      consecutiveGhostDays: 30,
      consecutiveNormalDays: 100,
      highestDayXP: 500,
      consecutivePerfectMornings: 30,
    })
    for (const a of ACHIEVEMENTS) {
      expect(a.condition(maxed), `${a.id} should unlock on maxed profile`).toBe(true)
    }
  })
})
