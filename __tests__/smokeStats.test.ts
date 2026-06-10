import { describe, it, expect } from 'vitest'
import {
  dailyCigaretteCounts,
  computeBaseline,
  phase2TargetRange,
  rollingAverage,
  weeklyAverages,
  shiftDateKey,
  SMOKE_TRACKING_START,
} from '@/lib/smokeStats'
import type { DailyLog, CigaretteEntry } from '@/types'

function makeLog(date: string, cigCount?: number): DailyLog {
  const cigarettes: CigaretteEntry[] | undefined =
    cigCount === undefined
      ? undefined
      : Array.from({ length: cigCount }, (_, i) => ({
          timestamp: Date.parse(`${date}T12:00:00`) + i,
          hour: 12,
          weekday: 0,
        }))
  return {
    date,
    completedRoutine: [],
    completedDailyQuests: [],
    completedSideQuests: [],
    keptRules: [],
    totalXP: 0,
    dayMode: 'normal',
    ...(cigarettes ? { cigarettes } : {}),
  }
}

function logsFrom(...logs: DailyLog[]): Record<string, DailyLog> {
  return Object.fromEntries(logs.map(l => [l.date, l]))
}

describe('shiftDateKey', () => {
  it('przesuwa datę w przód i w tył, też przez granicę miesiąca', () => {
    expect(shiftDateKey('2026-06-10', -1)).toBe('2026-06-09')
    expect(shiftDateKey('2026-06-01', -1)).toBe('2026-05-31')
    expect(shiftDateKey('2026-06-30', 1)).toBe('2026-07-01')
  })
})

describe('dailyCigaretteCounts', () => {
  it('pomija dni sprzed startu obserwacji', () => {
    const logs = logsFrom(makeLog('2026-05-17', 5), makeLog('2026-05-18', 3))
    const counts = dailyCigaretteCounts(logs)
    expect(counts).toEqual([{ date: '2026-05-18', count: 3 }])
  })

  it('zalogowany dzień bez papierosów liczy się jako 0', () => {
    const logs = logsFrom(makeLog('2026-05-20'), makeLog('2026-05-21', 2))
    const counts = dailyCigaretteCounts(logs)
    expect(counts).toEqual([
      { date: '2026-05-20', count: 0 },
      { date: '2026-05-21', count: 2 },
    ])
  })

  it('respektuje granicę `through` (np. wczoraj)', () => {
    const logs = logsFrom(makeLog('2026-06-09', 4), makeLog('2026-06-10', 1))
    const counts = dailyCigaretteCounts(logs, '2026-06-09')
    expect(counts).toEqual([{ date: '2026-06-09', count: 4 }])
  })

  it('sortuje rosnąco po dacie', () => {
    const logs = logsFrom(makeLog('2026-06-02', 1), makeLog('2026-05-30', 2))
    expect(dailyCigaretteCounts(logs).map(c => c.date)).toEqual([
      '2026-05-30',
      '2026-06-02',
    ])
  })
})

describe('computeBaseline', () => {
  it('zwraca null bez danych', () => {
    expect(computeBaseline([])).toBeNull()
  })

  it('liczy średnią po dniach z danymi, zaokrągloną do 0.1', () => {
    const report = computeBaseline([
      { date: '2026-05-18', count: 20 },
      { date: '2026-05-19', count: 17 },
      { date: '2026-05-20', count: 0 },
    ])
    expect(report).toEqual({ avgPerDay: 12.3, daysWithData: 3, total: 37 })
  })
})

describe('phase2TargetRange', () => {
  it('przy bazie 20 daje 15–17 (−15–25%)', () => {
    expect(phase2TargetRange(20)).toEqual({ lo: 15, hi: 17 })
  })

  it('nie schodzi poniżej zera', () => {
    expect(phase2TargetRange(0)).toEqual({ lo: 0, hi: 0 })
  })
})

describe('rollingAverage', () => {
  const counts = [
    { date: '2026-06-03', count: 10 },
    { date: '2026-06-05', count: 14 },
    { date: '2026-06-08', count: 12 },
    { date: '2026-06-09', count: 8 },
  ]

  it('liczy średnią z okna kalendarzowego po dniach z danymi', () => {
    // okno 2026-06-03..2026-06-09 → wszystkie 4 dni
    expect(rollingAverage(counts, '2026-06-09', 7)).toBe(11)
  })

  it('zwraca null przy mniej niż 3 dniach danych w oknie', () => {
    expect(rollingAverage(counts, '2026-06-09', 3)).toBeNull()
  })
})

describe('weeklyAverages', () => {
  it('grupuje pon–nd i liczy średnią po dniach z danymi', () => {
    // 2026-05-18 to poniedziałek
    const weeks = weeklyAverages([
      { date: '2026-05-18', count: 20 },
      { date: '2026-05-20', count: 10 },
      { date: '2026-05-24', count: 12 },  // niedziela — ten sam tydzień
      { date: '2026-05-25', count: 6 },   // poniedziałek — nowy tydzień
    ])
    expect(weeks).toEqual([
      { weekStart: '2026-05-18', avg: 14, days: 3, total: 42 },
      { weekStart: '2026-05-25', avg: 6, days: 1, total: 6 },
    ])
  })
})

describe('SMOKE_TRACKING_START', () => {
  it('zgadza się z PLAN_PALENIE.md (start fazy 1: 18.05.2026)', () => {
    expect(SMOKE_TRACKING_START).toBe('2026-05-18')
  })
})
