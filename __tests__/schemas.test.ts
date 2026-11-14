import { describe, it, expect } from 'vitest'
import { DailyLogSchema, UserStatsSchema, parseSafe } from '@/lib/schemas'
import type { DailyLog, UserStats } from '@/types'

const EMPTY_LOG: DailyLog = {
  date: 'fallback', completedRoutine: [], completedDailyQuests: [], completedSideQuests: [],
  keptRules: [], totalXP: 0, dayMode: 'normal',
}

const parseLog = (raw: unknown) => parseSafe<DailyLog>(DailyLogSchema, raw, EMPTY_LOG, 'test')

const FULL_DAY = {
  date: '2026-11-13',
  completedRoutine: ['m1', 'm2', 'e3'],
  completedDailyQuests: ['q1'],
  completedSideQuests: [],
  keptRules: ['r1'],
  totalXP: 120,
  dayMode: 'normal',
}

describe('DailyLogSchema — jedno zepsute pole nie zeruje dnia', () => {
  it('keyMoment: null (stare kasowanie momentu) zostawia resztę dnia nietkniętą', () => {
    const log = parseLog({ ...FULL_DAY, keyMoment: null })
    expect(log).not.toBe(EMPTY_LOG)
    expect(log.completedRoutine).toEqual(['m1', 'm2', 'e3'])
    expect(log.totalXP).toBe(120)
    expect(log.keyMoment).toBeUndefined()
  })

  it('minimumReason: null albo nieznany powód ⇒ brak powodu, dzień zostaje', () => {
    expect(parseLog({ ...FULL_DAY, dayMode: 'minimum', minimumReason: null }).completedRoutine).toHaveLength(3)
    const odd = parseLog({ ...FULL_DAY, dayMode: 'minimum', minimumReason: 'kac' })
    expect(odd.dayMode).toBe('minimum')
    expect(odd.minimumReason).toBeUndefined()
    expect(odd.totalXP).toBe(120)
  })

  it('zepsuty element tablicy wypada, pozostałe zostają', () => {
    const log = parseLog({
      ...FULL_DAY,
      cigarettes: [
        { timestamp: 1, hour: 9, weekday: 4, context: 'kawa' },
        'śmieć',
        { timestamp: 2, hour: 13, weekday: 4, context: 'nieznany-kontekst' },
      ],
      customSideQuests: [
        { id: 'csq_1', title: 'Basen', pillar: 'cialo', xp: 100 },
        { id: 'csq_2', title: 'Zły filar', pillar: 'kosmos', xp: 100 },
      ],
    })
    expect(log.cigarettes).toHaveLength(2)
    // Nieznany kontekst nie kasuje papierosa — zostaje wpis bez kontekstu.
    expect(log.cigarettes?.[1]).toEqual({ timestamp: 2, hour: 13, weekday: 4 })
    expect(log.customSideQuests).toEqual([{ id: 'csq_1', title: 'Basen', pillar: 'cialo', xp: 100 }])
    expect(log.completedRoutine).toHaveLength(3)
  })

  it('pola opcjonalne o złym typie znikają pojedynczo', () => {
    const log = parseLog({
      ...FULL_DAY,
      notes: 42, socialPresence: 'tak', externalXP: { cialo: -5, kariera: 30 },
      smokeCeilingXP: 'dużo', rewardsClaimed: null, moodCheckIns: null,
    })
    expect(log.totalXP).toBe(120)
    expect(log.notes).toBeUndefined()
    expect(log.socialPresence).toBeUndefined()
    expect(log.externalXP).toEqual({ kariera: 30 })
    expect(log.smokeCeilingXP).toBeUndefined()
    expect(log.rewardsClaimed).toBeUndefined()
  })

  it('poprawny dokument przechodzi bez zmian', () => {
    const raw = {
      ...FULL_DAY,
      keyMoment: { title: 'Awans', savedAt: 5 },
      smokeLastOfDayAt: null,
      moodCheckIns: [{ energy: 4, mood: 3, state: 'calm', timestamp: 10 }],
    }
    expect(parseLog(raw)).toEqual(raw)
  })

  it('nie dokleja kluczy z undefined (arrayRemove porównuje całe obiekty)', () => {
    const log = parseLog({ ...FULL_DAY, cigarettes: [{ timestamp: 1, hour: 9, weekday: 4 }] })
    expect(Object.keys(log.cigarettes![0]).sort()).toEqual(['hour', 'timestamp', 'weekday'])
    expect('keyMoment' in log).toBe(false)
  })
})

const DEFAULT_STATS: UserStats = {
  totalXP: 0, currentStreak: 0, longestStreak: 0, totalDaysLogged: 0,
  totalRoutinesCompleted: 0, totalQuestsCompleted: 0, totalSideQuestsCompleted: 0, totalRulesKept: 0,
  pillarXP: { pozycja: 0, cialo: 0, styl: 0, kapital: 0, kariera: 0, tozsamosc: 0, milosc: 0 },
  unlockedAchievements: [],
}
const parseStats = (raw: unknown) => parseSafe<UserStats>(UserStatsSchema, raw, DEFAULT_STATS, 'test')

describe('UserStatsSchema', () => {
  // Wszystkie pola UserStats (types/index.ts). Gdy dodajesz pole do typu, dopisz
  // je tutaj — test wymusi dopisanie go także do schematu.
  const EVERY_FIELD: Required<UserStats> = {
    totalXP: 88390, currentStreak: 27, longestStreak: 41, totalDaysLogged: 198,
    totalRoutinesCompleted: 2100, totalQuestsCompleted: 310, totalSideQuestsCompleted: 22, totalRulesKept: 400,
    pillarXP: { pozycja: 1, cialo: 2, styl: 3, kapital: 4, kariera: 5, tozsamosc: 6, milosc: 7 },
    unlockedAchievements: ['first_day'],
    lastStreakDate: '2026-11-13',
    streakFreezeUsedMonths: ['2026-06'],
    reviewedWeeks: ['2026-11-02'],
    reviewedMonths: ['2026-10'],
    reviewedQuarters: ['Q1', 'Q2'],
    completedHeartBlocks: ['2026-W40'],
    pillarBalanceWeeks: ['2026-W41'],
    currentWeekPillars: { weekKey: '2026-W46', pillars: ['cialo'] },
    totalGhostProtocols: 14, consecutiveGhostDays: 0, lastGhostDate: '2026-11-04',
    highestDayXP: 900, consecutiveNormalDays: 4, lastNormalDay: '2026-11-13',
    consecutivePerfectMornings: 2, lastPerfectMorningDate: '2026-11-12',
    lastReturnCeremonyDate: null,
    smokingTrackingEnabled: true, cigarettesBaseline: 14, cigarettesPhase: 3,
    cigarettesPhaseStartDate: '2026-10-01', cigarettesAlarmTriggered: null,
    smokeEmergencyDays: ['2026-11-01'],
  }

  it('żadne pole UserStats nie jest wycinane przez schemat', () => {
    expect(parseStats(EVERY_FIELD)).toEqual(EVERY_FIELD)
  })

  it('reviewedQuarters przeżywa odczyt (wcześniej wycinane ⇒ kwartał dało się zaliczyć wielokrotnie)', () => {
    expect(parseStats({ ...DEFAULT_STATS, reviewedQuarters: ['Q1'] }).reviewedQuarters).toEqual(['Q1'])
  })

  it('zepsute pojedyncze pole nie zeruje statystyk', () => {
    const stats = parseStats({
      ...EVERY_FIELD,
      lastStreakDate: 20261113,
      currentWeekPillars: { weekKey: '2026-W46', pillars: ['kosmos'] },
      cigarettesPhase: 9,
      pillarXP: null,
    })
    expect(stats).not.toBe(DEFAULT_STATS)
    expect(stats.totalXP).toBe(88390)
    expect(stats.currentStreak).toBe(27)
    expect(stats.unlockedAchievements).toEqual(['first_day'])
    expect(stats.lastStreakDate).toBeUndefined()
    expect(stats.currentWeekPillars).toBeUndefined()
    expect(stats.pillarXP.cialo).toBe(0)
  })
})
