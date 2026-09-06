import { describe, it, expect } from 'vitest'
import {
  dailyCigaretteCounts,
  computeBaseline,
  phase2TargetRange,
  rollingAverage,
  weeklyAverages,
  shiftDateKey,
  SMOKE_TRACKING_START,
  SMOKING_QUIT_DATE,
  MONTHLY_CEILINGS,
  ceilingFor,
  nextCeilingAfter,
  daysUntilQuit,
  ceilingStatus,
  contextShareByWeek,
  smokePacing,
  activeWindowFor,
  EMERGENCY_DAYS_PER_MONTH,
  emergencyDaysUsedInMonth,
} from '@/lib/smokeStats'
import type { DailyLog, CigaretteContext, CigaretteEntry } from '@/types'

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

// Log z papierosami o zadanych kontekstach (do testów pułapki nagrody).
function makeCtxLog(date: string, contexts: CigaretteContext[]): DailyLog {
  const cigarettes: CigaretteEntry[] = contexts.map((context, i) => ({
    timestamp: Date.parse(`${date}T12:00:00`) + i,
    hour: 12,
    weekday: 0,
    context,
  }))
  return {
    date,
    completedRoutine: [],
    completedDailyQuests: [],
    completedSideQuests: [],
    keptRules: [],
    totalXP: 0,
    dayMode: 'normal',
    cigarettes,
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

describe('harmonogram sufitów miesięcznych', () => {
  it('twarda linia to 30. urodziny', () => {
    expect(SMOKING_QUIT_DATE).toBe('2027-04-05')
  })

  it('sufit maleje monotonicznie 14 → 1 przez 10 miesięcy', () => {
    expect(MONTHLY_CEILINGS).toHaveLength(10)
    expect(MONTHLY_CEILINGS[0]).toMatchObject({ month: '2026-07', ceiling: 14 })
    expect(MONTHLY_CEILINGS[MONTHLY_CEILINGS.length - 1]).toMatchObject({ month: '2027-04', ceiling: 1 })
    for (let i = 1; i < MONTHLY_CEILINGS.length; i++) {
      expect(MONTHLY_CEILINGS[i].ceiling).toBeLessThan(MONTHLY_CEILINGS[i - 1].ceiling)
    }
  })

  it('wrzesień ma sufit 11 — podniesiony pod stres pierwszego miesiąca w McKinseyu', () => {
    expect(ceilingFor('2026-09-06')?.ceiling).toBe(11)
    expect(ceilingFor('2026-09-30')?.ceiling).toBe(11)
    // Koszt decyzji: październik schodzi o dwa, nie o jeden.
    expect(nextCeilingAfter('2026-09-15')?.ceiling).toBe(9)
  })

  it('ceilingFor bierze sufit z miesiąca daty', () => {
    expect(ceilingFor('2026-07-07')?.ceiling).toBe(14)
    expect(ceilingFor('2026-07-31')?.ceiling).toBe(14)
    expect(ceilingFor('2026-12-24')?.ceiling).toBe(6)
    expect(ceilingFor('2027-04-01')?.ceiling).toBe(1)
  })

  it('ceilingFor jest null przed lipcem i po kwietniu', () => {
    expect(ceilingFor('2026-06-30')).toBeNull()
    expect(ceilingFor('2027-05-01')).toBeNull()
  })

  it('nextCeilingAfter wskazuje kolejny miesiąc, null na końcu', () => {
    expect(nextCeilingAfter('2026-07-15')?.ceiling).toBe(12)
    expect(nextCeilingAfter('2027-04-02')).toBeNull()
  })

  it('daysUntilQuit liczy dni do linii (dodatnie przed, 0 w dniu, ujemne po)', () => {
    expect(daysUntilQuit('2027-04-05')).toBe(0)
    expect(daysUntilQuit('2027-04-04')).toBe(1)
    expect(daysUntilQuit('2027-03-06')).toBe(30)
    expect(daysUntilQuit('2027-04-06')).toBe(-1)
    // stabilne przez granicę roku
    expect(daysUntilQuit('2026-07-07')).toBe(272)
  })
})

describe('ceilingStatus — spokojne lustro', () => {
  it('under gdy średnia wyraźnie pod sufitem', () => {
    expect(ceilingStatus(11, 14)).toBe('under')
  })
  it('at gdy średnia przy suficie (górny papieros)', () => {
    expect(ceilingStatus(13.5, 14)).toBe('at')
    expect(ceilingStatus(14, 14)).toBe('at')
  })
  it('over gdy średnia nad sufitem', () => {
    expect(ceilingStatus(14.5, 14)).toBe('over')
  })
  it('unknown bez danych', () => {
    expect(ceilingStatus(null, 14)).toBe('unknown')
    expect(ceilingStatus(11, null)).toBe('unknown')
  })
})

describe('contextShareByWeek — pułapka nagrody', () => {
  it('liczy udział kontekstu wśród otagowanych, tydzień po tygodniu', () => {
    // tydzień 2026-06-08 (pon): 6 otagowanych, 4× quest → 67%
    const logs = logsFrom(
      makeCtxLog('2026-06-08', ['quest', 'quest', 'stres']),
      makeCtxLog('2026-06-09', ['quest', 'quest', 'kawa']),
    )
    const trend = contextShareByWeek(logs, 'quest')
    expect(trend).toEqual([
      { weekStart: '2026-06-08', count: 4, withContext: 6, share: 67 },
    ])
  })

  it('pomija tygodnie poniżej progu minTagged', () => {
    const logs = logsFrom(makeCtxLog('2026-06-08', ['quest', 'stres']))
    expect(contextShareByWeek(logs, 'quest', { minTagged: 5 })).toEqual([])
  })

  it('rośnie tydzień po tygodniu (sygnał pułapki)', () => {
    const logs = logsFrom(
      makeCtxLog('2026-06-08', ['quest', 'stres', 'kawa', 'nuda', 'stres']),      // 1/5 = 20%
      makeCtxLog('2026-06-15', ['quest', 'quest', 'quest', 'stres', 'kawa']),     // 3/5 = 60%
    )
    const trend = contextShareByWeek(logs, 'quest')
    expect(trend.map(w => w.share)).toEqual([20, 60])
  })
})

describe('activeWindowFor — okno aktywnego dnia', () => {
  it('Pon–Czw 6–22', () => {
    for (const wd of [0, 1, 2, 3]) expect(activeWindowFor(wd)).toEqual({ startHour: 6, endHour: 22 })
  })
  it('Pt 6 do późna (impreza)', () => {
    expect(activeWindowFor(4)).toEqual({ startHour: 6, endHour: 26 })
  })
  it('Sob późna pobudka + do późna', () => {
    expect(activeWindowFor(5)).toEqual({ startHour: 9, endHour: 26 })
  })
  it('Nd późna pobudka, normalne wyciszenie', () => {
    expect(activeWindowFor(6)).toEqual({ startHour: 9, endHour: 22 })
  })
})

describe('smokePacing — tempo dnia', () => {
  const WEEKDAY = { startHour: 6, endHour: 22 }
  it('wolniej niż równe tempo = zapas + odstęp na resztę', () => {
    // 12:00, sufit 14, 2 zapalone. okno 6–22: elapsed=(720-360)/960=0.375 → expected 5.25.
    const p = smokePacing(12, 0, 2, 14, WEEKDAY)
    expect(p.remaining).toBe(12)
    expect(p.over).toBe(false)
    expect(p.pace).toBe('under')
    expect(p.minutesLeftActive).toBe(600)      // do 22:00
    expect(p.intervalMin).toBe(50)             // 600 / 12 = co 50 min
  })

  it('szybciej niż równe tempo = sygnał „ahead"', () => {
    // 12:00, sufit 14, 8 zapalonych. expected 5.25, 8 > 6.25 → ahead.
    const p = smokePacing(12, 0, 8, 14, WEEKDAY)
    expect(p.pace).toBe('ahead')
    expect(p.remaining).toBe(6)
  })

  it('nad sufitem: remaining ujemne, brak odstępu, spokojnie', () => {
    const p = smokePacing(18, 0, 15, 14, WEEKDAY)
    expect(p.over).toBe(true)
    expect(p.remaining).toBe(-1)
    expect(p.pace).toBe('over')
    expect(p.intervalMin).toBeNull()
  })

  it('dokładnie na suficie', () => {
    const p = smokePacing(20, 0, 14, 14, WEEKDAY)
    expect(p.atCeiling).toBe(true)
    expect(p.over).toBe(false)
    expect(p.remaining).toBe(0)
    expect(p.intervalMin).toBeNull()
  })

  it('dzień powszedni po 22:00 = domknięty, zero odstępu', () => {
    const p = smokePacing(1, 0, 12, 14, WEEKDAY)  // 1:00 (logicznie 25:00) > 22:00
    expect(p.minutesLeftActive).toBe(0)
    expect(p.intervalMin).toBeNull()
    expect(p.pace).toBe('under')
  })

  it('piątkowa impreza po północy wciąż liczy się jako aktywny dzień', () => {
    // Pt 1:00 (logicznie 25:00), okno 6–26 → 60 min do wyciszenia.
    const p = smokePacing(1, 0, 12, 14, { startHour: 6, endHour: 26 })
    expect(p.minutesLeftActive).toBe(60)
    expect(p.remaining).toBe(2)
    expect(p.intervalMin).toBe(30)  // 60 / 2 = co 30 min
  })
})

describe('dzień awaryjny — limit miesięczny', () => {
  it('domyślny limit to 2 / miesiąc', () => {
    expect(EMERGENCY_DAYS_PER_MONTH).toBe(2)
  })
  it('liczy zużycie tylko w danym miesiącu', () => {
    const days = ['2026-07-05', '2026-07-20', '2026-08-02']
    expect(emergencyDaysUsedInMonth(days, '2026-07')).toBe(2)
    expect(emergencyDaysUsedInMonth(days, '2026-08')).toBe(1)
    expect(emergencyDaysUsedInMonth(days, '2026-09')).toBe(0)
  })
  it('pusta lista = 0', () => {
    expect(emergencyDaysUsedInMonth([], '2026-07')).toBe(0)
  })
})
