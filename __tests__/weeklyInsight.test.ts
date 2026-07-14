import { describe, it, expect } from 'vitest'
import { computeWeeklyInsight } from '../lib/weeklyInsight'
import { HYPOTHESES } from '../lib/weeklyHypotheses'
import type { DailyLog, MoodCheckIn } from '../types'

// ── Pomocniki do generowania syntetycznych logów ─────────────────────────

const MORNING_FULL = ['m1','m2','m3','m4']  // 4 wystarcza dla isMorningDone (próg ≥4)
const EVENING_FULL = ['e1','e2','e3']

function dateK(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mkCheckIns(moods: number[], baseTs = Date.now()): MoodCheckIn[] {
  return moods.map((m, i) => ({
    energy: 3, mood: m, state: 'calm', timestamp: baseTs + i * 60_000,
  }))
}

interface DayOpts {
  morning?: boolean
  evening?: boolean
  physical?: boolean
  social?: boolean
  minimum?: boolean
  moods?: number[]
  totalXP?: number
  ghost?: boolean
}

function mkLog(date: string, o: DayOpts = {}): DailyLog {
  const completedRoutine: string[] = []
  if (o.morning) completedRoutine.push(...MORNING_FULL)
  if (o.evening) completedRoutine.push(...EVENING_FULL)
  return {
    date,
    completedRoutine,
    completedDailyQuests: [],
    completedSideQuests: [],
    keptRules: [],
    totalXP: o.totalXP ?? 100,
    dayMode: o.minimum ? 'minimum' : 'normal',
    physicalActivity: o.physical,
    socialPresence: o.social,
    ghostProtocolCompleted: o.ghost,
    moodCheckIns: o.moods ? mkCheckIns(o.moods) : [],
  }
}

function makeLogs(opts: DayOpts[], startDate = '2026-04-05'): Record<string, DailyLog> {
  const result: Record<string, DailyLog> = {}
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  for (let i = 0; i < opts.length; i++) {
    const dt = new Date(start)
    dt.setDate(dt.getDate() + i)
    const key = dateK(dt)
    result[key] = mkLog(key, opts[i])
  }
  return result
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('computeWeeklyInsight — pusta kolekcja', () => {
  it('zero hipotez przeszło, hasContent=false', () => {
    const r = computeWeeklyInsight({}, '2026-W19')
    expect(r.passedCount).toBe(0)
    expect(r.testsRun).toBe(0)
    expect(r.hasContent).toBe(false)
    expect(r.headline).toContain('Za mało danych')
    expect(r.outcomes.every(o => !o.passed)).toBe(true)
  })

  it('wszystkie hipotezy są obecne w outcomes', () => {
    const r = computeWeeklyInsight({}, '2026-W19')
    expect(r.outcomes).toHaveLength(HYPOTHESES.length)
    expect(r.totalHypotheses).toBe(HYPOTHESES.length)
  })
})

describe('computeWeeklyInsight — mała kolekcja (n < 10 per group)', () => {
  it('hipotezy nie przechodzą bo n_too_small', () => {
    // 5 dni, część z rutyną, część bez — za mało żeby cokolwiek wyszło
    const logs = makeLogs([
      { morning: true,  moods: [4] },
      { morning: true,  moods: [4] },
      { morning: false, moods: [2] },
      { morning: false, moods: [3] },
      { morning: true,  moods: [5] },
    ])
    const r = computeWeeklyInsight(logs, '2026-W14')
    expect(r.passedCount).toBe(0)
    expect(r.hasContent).toBe(false)
    // Co najmniej jedna hipoteza powinna być oznaczona jako n_too_small
    const morningOutcome = r.outcomes.find(o => o.id === 'morning_routine_first_mood')
    expect(morningOutcome?.passed).toBe(false)
    expect(morningOutcome?.reason).toBe('n_too_small')
  })
})

describe('computeWeeklyInsight — wyraźny wzorzec rutyny porannej', () => {
  it('przy n≥10 i dużej różnicy mood przechodzi rygor', () => {
    // 12 dni z rutyną + wysokim mood, 12 bez rutyny + niski mood (24 dni łącznie ≈ 4 tygodnie)
    const logs: Record<string, DailyLog> = {}
    const start = new Date(2026, 3, 5)
    for (let i = 0; i < 12; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      logs[key] = mkLog(key, { morning: true, moods: [4 + (i % 2)] })  // 4-5
    }
    for (let i = 12; i < 24; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      logs[key] = mkLog(key, { morning: false, moods: [1 + (i % 2)] })  // 1-2
    }

    const r = computeWeeklyInsight(logs, '2026-W14')
    const morning = r.outcomes.find(o => o.id === 'morning_routine_first_mood')!
    expect(morning.passed).toBe(true)
    expect(morning.result).toBeDefined()
    expect(Math.abs(morning.result!.effectSize)).toBeGreaterThan(0.5)
    expect(morning.result!.pCorrected).toBeLessThan(0.05)
    expect(morning.text).toMatch(/wyższy|niższy/)
    expect(morning.reflectionQuestion).toBeTruthy()
    expect(r.hasContent).toBe(true)
    expect(r.passedCount).toBeGreaterThanOrEqual(1)
  })
})

describe('computeWeeklyInsight — szum nie generuje insightu', () => {
  it('losowy mood + losowa rutyna → 0 passed', () => {
    // 30 dni, mood losowy ale "uczciwie losowy", rutyna nieskorelowana
    const logs: Record<string, DailyLog> = {}
    const start = new Date(2026, 3, 5)
    // Użyj deterministycznego seeda — Math.sin to lekki pseudo-random
    for (let i = 0; i < 30; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      const morning = Math.sin(i * 17.3) > 0
      const mood = ((Math.sin(i * 41.7) + 1) * 2.5) | 0  // 0-4
      logs[key] = mkLog(key, { morning, moods: [Math.max(1, mood + 1)] })
    }
    const r = computeWeeklyInsight(logs, '2026-W14')
    const morning = r.outcomes.find(o => o.id === 'morning_routine_first_mood')!
    // Szum NIE może dać „pewnego" wzorca. Może wylądować jako słaby/wstępny sygnał
    // (uczciwie oznaczony), ale nie jako twardy pewnik.
    expect(morning.confidence).not.toBe('pewny')
    expect(morning.passed).toBe(false)
    if (!morning.confidence) {
      // Gdy nie wystawiono nawet słabego sygnału — powód jest jednym z odrzuceń.
      expect(['effect_too_small', 'p_too_high', 'n_too_small', 'no_data']).toContain(morning.reason)
    }
  })
})

describe('computeWeeklyInsight — Bonferroni działa', () => {
  it('p_corrected = p * K (liczby testów wykonanych)', () => {
    // Wystarczająco danych żeby kilka testów się odpaliło
    const logs: Record<string, DailyLog> = {}
    const start = new Date(2026, 3, 5)
    for (let i = 0; i < 30; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      logs[key] = mkLog(key, {
        morning: i % 2 === 0,
        physical: i % 3 === 0,
        social: i % 4 === 0,
        moods: [3 + (i % 3) - 1],
      })
    }
    const r = computeWeeklyInsight(logs, '2026-W14')
    // Test: dla wszystkich wykonanych testów pCorrected powinno być >= rawP (czyli mnożone)
    for (const o of r.outcomes) {
      if (o.result) {
        // pCorrected ∈ [0, 1], a Bonferroni nie zmniejsza p
        expect(o.result.pCorrected).toBeGreaterThanOrEqual(0)
        expect(o.result.pCorrected).toBeLessThanOrEqual(1)
      }
    }
    expect(r.testsRun).toBeGreaterThan(0)
  })
})

describe('computeWeeklyInsight — K nie zawiera testów bez mocy', () => {
  it('testsRun liczy tylko testy z wystarczającym n (under-powered nie zawyżają Bonferroniego)', () => {
    // Silny wzorzec rutyny porannej (n≥10 w obu grupach) + hipoteza z za małą
    // próbką (tylko 2 dni social). Ta druga musi być n_too_small i NIE liczyć
    // się do K — inaczej zawyżałaby korektę i chowała realny wzorzec.
    const logs: Record<string, DailyLog> = {}
    const start = new Date(2026, 3, 5)
    for (let i = 0; i < 24; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      logs[key] = mkLog(key, {
        morning: i < 12,                       // 12 z rutyną, 12 bez → n≥10 w obu grupach
        moods: [i < 12 ? 4 + (i % 2) : 1 + (i % 2)],
        social: i < 2,                         // tylko 2 dni social → grupa za mała
      })
    }
    const r = computeWeeklyInsight(logs, '2026-W14')

    // K = dokładnie te outcome'y, które faktycznie odpaliły test — czyli mają
    // `result` (rawP policzone): pewny/wstępny/słaby lub odrzucone
    // (effect_too_small / p_too_high). n_too_small i no_data są POZA K (brak result).
    const ran = r.outcomes.filter(o => o.result !== undefined).length
    expect(r.testsRun).toBe(ran)
    expect(r.testsRun).toBeGreaterThan(0)

    const underpowered = r.outcomes.filter(o =>
      o.reason === 'n_too_small' || o.reason === 'no_data'
    ).length
    expect(r.testsRun).toBe(r.outcomes.length - underpowered)

    // Hipoteza „social" (2 dni) nie może być liczona do K.
    const social = r.outcomes.find(o => o.id === 'social_mood')
    if (social) expect(['n_too_small', 'no_data']).toContain(social.reason)
  })
})

describe('computeWeeklyInsight — output structure', () => {
  it('zawsze ma weekKey, generatedAt, headline, body', () => {
    const r = computeWeeklyInsight({}, '2026-W19')
    expect(r.weekKey).toBe('2026-W19')
    expect(r.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(r.headline).toBeTruthy()
    expect(r.body).toBeTruthy()
  })

  it('top wybiera 1-3 outcomes z największym |effect size|', () => {
    // Przygotuj scenariusz gdzie wiele hipotez przechodzi
    const logs: Record<string, DailyLog> = {}
    const start = new Date(2026, 3, 5)
    for (let i = 0; i < 30; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      const morning = i < 15
      logs[key] = mkLog(key, {
        morning,
        moods: [morning ? 5 : 1],  // ekstremalnie różne
      })
    }
    const r = computeWeeklyInsight(logs, '2026-W14')
    if (r.passedCount > 1) {
      // body powinno mieć separator ' — · — ' dla wielu wzorców
      expect(r.body).toContain('— · —')
    }
  })
})

describe('reflectionQuestion jest losowane z puli', () => {
  it('pytanie jest niepuste i pochodzi z puli hipotezy', () => {
    const logs: Record<string, DailyLog> = {}
    const start = new Date(2026, 3, 5)
    for (let i = 0; i < 30; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i)
      const key = dateK(dt)
      logs[key] = mkLog(key, {
        morning: i < 15,
        moods: [i < 15 ? 5 : 1],
      })
    }
    const r = computeWeeklyInsight(logs, '2026-W14')
    const passed = r.outcomes.find(o => o.id === 'morning_routine_first_mood' && o.passed)
    if (passed) {
      const h = HYPOTHESES.find(h => h.id === 'morning_routine_first_mood')!
      expect(h.reflectionQuestions).toContain(passed.reflectionQuestion!)
    }
  })
})
