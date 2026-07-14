import { describe, it, expect } from 'vitest'
import { computeWeeklyInsight } from '../lib/weeklyInsight'
import { benjaminiHochberg, bonferroni, gradeConfidence } from '../lib/statTests'
import { computeCorrelations, type CyclePhaseInsight, type LiftInsight } from '../lib/correlations'
import type { CyclePhaseId, HypothesisContext } from '../lib/weeklyHypotheses'
import type { DailyLog, MoodCheckIn } from '../types'

// ── Pomocniki ──────────────────────────────────────────────────────────────

function dateK(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function checkIns(moods: number[], energies?: number[]): MoodCheckIn[] {
  return moods.map((m, i) => ({
    energy: energies?.[i] ?? 3, mood: m, state: 'calm', timestamp: 1_700_000_000_000 + i * 60_000,
  }))
}

interface Opts {
  moods?: number[]
  energies?: number[]
  cbt?: boolean
  cigs?: number
  physical?: boolean
}

function mkLog(date: string, o: Opts = {}): DailyLog {
  return {
    date,
    completedRoutine: [],
    completedDailyQuests: [],
    completedSideQuests: [],
    keptRules: [],
    totalXP: 100,
    dayMode: 'normal',
    moodCheckIns: o.moods ? checkIns(o.moods, o.energies) : [],
    cbtCaptureAwarded: o.cbt,
    physicalActivity: o.physical,
    cigarettes: o.cigs != null
      ? Array.from({ length: o.cigs }, (_, i) => ({ timestamp: 1_700_000_000_000 + i })) as any
      : undefined,
  }
}

// Buduje N kolejnych dni od 2026-04-05 i zwraca { logs, keys }.
function days(n: number, fn: (i: number, key: string) => Opts): { logs: Record<string, DailyLog>; keys: string[] } {
  const logs: Record<string, DailyLog> = {}
  const keys: string[] = []
  const start = new Date(2026, 3, 5)
  for (let i = 0; i < n; i++) {
    const dt = new Date(start); dt.setDate(dt.getDate() + i)
    const key = dateK(dt)
    keys.push(key)
    logs[key] = mkLog(key, fn(i, key))
  }
  return { logs, keys }
}

// ── Benjamini-Hochberg ──────────────────────────────────────────────────────

describe('benjaminiHochberg', () => {
  it('równomierne p → wszystkie q = m/1 · p_min pod monotonicznością', () => {
    // p=[.01,.02,.03,.04,.05], m=5 → każdy m/rank·p = 0.05 → wszystkie 0.05
    const q = benjaminiHochberg([0.01, 0.02, 0.03, 0.04, 0.05])
    for (const v of q) expect(v).toBeCloseTo(0.05, 6)
  })

  it('zachowuje kolejność wejścia', () => {
    const q = benjaminiHochberg([0.05, 0.01])  // wejście nieposortowane
    // rank: 0.01(1)→2·0.01=0.02, 0.05(2)→0.05. q(input)=[0.05→0.05, 0.01→0.02]... monot.
    expect(q[1]).toBeCloseTo(0.02, 6)  // najmniejsze p
    expect(q[0]).toBeCloseTo(0.05, 6)
  })

  it('q ≥ raw p zawsze (własność BH) i jest łagodniejszy niż Bonferroni', () => {
    const ps = [0.001, 0.02, 0.2, 0.6, 0.9]
    const bh = benjaminiHochberg(ps)
    const bonf = bonferroni(ps)
    ps.forEach((p, i) => {
      expect(bh[i]).toBeGreaterThanOrEqual(p - 1e-9)         // nie zmniejsza
      expect(bh[i]).toBeLessThanOrEqual(bonf[i] + 1e-9)      // łagodniejszy/równy
    })
  })

  it('pusty wektor → pusty', () => {
    expect(benjaminiHochberg([])).toEqual([])
  })
})

// ── gradeConfidence ─────────────────────────────────────────────────────────

describe('gradeConfidence', () => {
  it('pewny wymaga q<0.05 i dużego efektu', () => {
    expect(gradeConfidence('mwu', 0.001, 0.01, 0.4)).toBe('pewny')
  })
  it('wstępny — istotne surowo lub q<0.2, umiarkowany efekt', () => {
    expect(gradeConfidence('mwu', 0.03, 0.1, 0.16)).toBe('wstępny')
  })
  it('słaby — sygnał na granicy', () => {
    expect(gradeConfidence('mwu', 0.12, 0.5, 0.13)).toBe('słaby')
  })
  it('null gdy efekt to szum', () => {
    expect(gradeConfidence('mwu', 0.5, 0.9, 0.05)).toBeNull()
  })
  it('Kruskal używa mniejszej skali ε²', () => {
    expect(gradeConfidence('kruskal', 0.01, 0.03, 0.08)).toBe('pewny')
    expect(gradeConfidence('kruskal', 0.3, 0.6, 0.01)).toBeNull()
  })
})

// ── Faza cyklu → nastrój (nowa oś) ──────────────────────────────────────────

// Stub resolvera fazy: 28-dniowy cykl, faza wg dnia cyklu.
function cyclePhaseStub(keys: string[]): HypothesisContext['cyclePhaseOf'] {
  const idx = new Map(keys.map((k, i) => [k, i]))
  return (key: string) => {
    const i = idx.get(key)
    if (i == null) return null
    const day = (i % 28) + 1
    if (day <= 5) return 'menstruacja'
    if (day <= 13) return 'folikularna'
    if (day <= 17) return 'owulacyjna'
    return 'lutealna'
  }
}

const PHASE_MOOD: Record<CyclePhaseId, number> = {
  menstruacja: 2, folikularna: 3, owulacyjna: 5, lutealna: 2,
}

describe('Faza cyklu → nastrój (silnik tygodniowy)', () => {
  it('wyłuskuje wzorzec fazowy tam, gdzie pojedyncze zachowania są stałe', () => {
    // 56 dni (2 cykle). Nastrój zależy TYLKO od fazy; ruch/kontakt = stałe (brak
    // kontrastu). Dawny silnik nie widziałby nic — nowa oś fazy powinna trafić.
    const { logs, keys } = days(56, (i) => {
      const day = (i % 28) + 1
      const phase: CyclePhaseId =
        day <= 5 ? 'menstruacja' : day <= 13 ? 'folikularna' : day <= 17 ? 'owulacyjna' : 'lutealna'
      return { moods: [PHASE_MOOD[phase]], physical: false }
    })
    const ctx: HypothesisContext = { cyclePhaseOf: cyclePhaseStub(keys) }
    const r = computeWeeklyInsight(logs, '2026-W20', ctx)

    const cyc = r.outcomes.find(o => o.id === 'cycle_phase_mood')!
    expect(cyc.confidence).toBeTruthy()            // pojawia się jakiś sygnał
    expect(cyc.result!.facts.primary.label).toContain('owulacja')     // najlepsza
    expect(cyc.result!.facts.secondary!.label).toMatch(/menstruacja|lutealna/) // najgorsza
    expect(r.hasContent).toBe(true)
  })

  it('bez resolvera fazy hipoteza cyklu jest no_data (brak regresji)', () => {
    const { logs } = days(40, (i) => ({ moods: [3 + (i % 2)] }))
    const r = computeWeeklyInsight(logs, '2026-W20')  // brak ctx
    const cyc = r.outcomes.find(o => o.id === 'cycle_phase_mood')!
    expect(cyc.reason).toBe('no_data')
    expect(cyc.confidence).toBeUndefined()
  })
})

// ── CBT (praca z myślami) → nastrój ─────────────────────────────────────────

describe('CBT capture → nastrój', () => {
  it('dni z wpisem CBT o wyższym nastroju dają sygnał', () => {
    // 30 dni: parzyste = wpis CBT + mood 4, nieparzyste = brak + mood 2.
    const { logs } = days(30, (i) => ({ cbt: i % 2 === 0, moods: [i % 2 === 0 ? 4 : 2] }))
    const r = computeWeeklyInsight(logs, '2026-W20')
    const cbt = r.outcomes.find(o => o.id === 'cbt_capture_mood')!
    expect(cbt.confidence).toBeTruthy()
    expect(cbt.result!.n).toBeGreaterThanOrEqual(20)
  })
})

// ── Papierosy: mniej vs więcej → nastrój ────────────────────────────────────

describe('Papierosy mniej/więcej → nastrój', () => {
  it('split po medianie wykrywa różnicę nastroju w oknie śledzenia', () => {
    // 30 dni z papierosami: parzyste 2 szt + mood 4, nieparzyste 10 szt + mood 2.
    const { logs } = days(30, (i) => ({ cigs: i % 2 === 0 ? 2 : 10, moods: [i % 2 === 0 ? 4 : 2] }))
    const r = computeWeeklyInsight(logs, '2026-W20')
    const cig = r.outcomes.find(o => o.id === 'cigarettes_less_more_mood')!
    expect(cig.confidence).toBeTruthy()
  })
})

// ── Stabilny tydzień — opisowy stan zamiast „ściany" ────────────────────────

describe('Stan „nic się nie wyróżniło" jest osobisty', () => {
  it('stabilny nastrój + brak kontrastu → opisowy profil, nie sam błąd', () => {
    // 20 dni, mood zawsze 3, ruch nigdy → zero kontrastu, zero wzorca.
    const { logs } = days(20, () => ({ moods: [3, 3], physical: false }))
    const r = computeWeeklyInsight(logs, '2026-W20')
    expect(r.hasContent).toBe(false)
    expect(r.headline).toContain('Stabilny')
    expect(r.body).toMatch(/stabilnie|kontrast/)
    expect(r.profile).toBeDefined()
    expect(r.profile!.constants.some(c => c.label === 'ruch' && c.kind === 'nigdy')).toBe(true)
    // topConfidence null, bo nic nie przeszło.
    expect(r.topConfidence ?? null).toBeNull()
  })
})

// ── correlations.ts (zakładka Wzorce) ───────────────────────────────────────

describe('computeCorrelations — nowe osie', () => {
  it('produkuje panel faz cyklu z danymi', () => {
    const { logs, keys } = days(56, (i) => {
      const day = (i % 28) + 1
      const phase: CyclePhaseId =
        day <= 5 ? 'menstruacja' : day <= 13 ? 'folikularna' : day <= 17 ? 'owulacyjna' : 'lutealna'
      return { moods: [PHASE_MOOD[phase]], energies: [PHASE_MOOD[phase]] }
    })
    const ins = computeCorrelations(logs, 1, { cyclePhaseOf: cyclePhaseStub(keys) })
    const cyc = ins.filter((i): i is CyclePhaseInsight => i.type === 'cyclephase')
    expect(cyc.length).toBe(2)  // mood + energy
    const mood = cyc.find(c => c.metric === 'mood')!
    expect(mood.hasEnoughData).toBe(true)
    expect(mood.byPhase.find(p => p.id === 'owulacyjna')!.value).toBeGreaterThan(
      mood.byPhase.find(p => p.id === 'menstruacja')!.value!
    )
  })

  it('bez resolvera fazy — brak paneli cyklu (brak regresji)', () => {
    const { logs } = days(20, () => ({ moods: [3, 4] }))
    const ins = computeCorrelations(logs, 1)
    expect(ins.some(i => i.type === 'cyclephase')).toBe(false)
  })

  it('produkuje dźwignię CBT (lift) przy ≥2 check-inach', () => {
    const { logs } = days(20, (i) => ({ cbt: i % 2 === 0, moods: [i % 2 === 0 ? 3 : 3, i % 2 === 0 ? 5 : 3] }))
    const ins = computeCorrelations(logs, 1)
    const cbt = ins.find((i): i is LiftInsight => i.type === 'lift' && i.id === 'lift_cbt_mood')
    expect(cbt).toBeDefined()
    expect(cbt!.hasEnoughData).toBe(true)
  })
})

// ── Weryfikacja adwersaryjna (statystyka) ───────────────────────────────────

describe('benjaminiHochberg vs referencja brute-force', () => {
  // Referencja: q_i = min_{k: p_(k) ≥ p_(i)} (m · p_(k) / k), liczona wprost.
  function bhReference(ps: number[]): number[] {
    const m = ps.length
    const sorted = ps.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p)
    const q = new Array<number>(m)
    for (let r = 0; r < m; r++) {
      let best = Infinity
      for (let k = r; k < m; k++) best = Math.min(best, (m * sorted[k].p) / (k + 1))
      q[sorted[r].i] = Math.min(1, best)
    }
    return q
  }

  const CASES = [
    [0.001, 0.008, 0.039, 0.041, 0.042, 0.06, 0.074, 0.205],  // klasyczny przykład BH
    [0.9, 0.01, 0.9, 0.01, 0.5],                              // duplikaty + nieposortowane
    [0.03],                                                    // pojedynczy test
    [0.05, 0.05, 0.05],                                        // same wiązania
    [1, 0.0001, 0.5, 0.02, 0.02, 0.99, 0.3],
  ]

  it('zgadza się z referencją na wszystkich wektorach', () => {
    for (const ps of CASES) {
      const got = benjaminiHochberg(ps)
      const want = bhReference(ps)
      got.forEach((g, i) => expect(g).toBeCloseTo(want[i], 10))
    }
  })
})

describe('„pewny" honoruje twardy próg n≥10', () => {
  it('idealna separacja przy 8 vs 8 dniach → najwyżej „wstępny", nie „pewny"', () => {
    // 16 dni: 8 z rutyną+mood 5, 8 bez+mood 1 — efekt maksymalny, ale n<10/grupę.
    const { logs } = days(16, (i) => ({ moods: [i < 8 ? 5 : 1], cbt: i < 8 }))
    const r = computeWeeklyInsight(logs, '2026-W20')
    const cbt = r.outcomes.find(o => o.id === 'cbt_capture_mood')!
    expect(cbt.confidence).toBeDefined()      // sygnał jest…
    expect(cbt.confidence).not.toBe('pewny')  // …ale nie twardy pewnik
    expect(cbt.passed).toBe(false)
  })
})

describe('Kruskal: mapowanie etykiet przy pustej fazie', () => {
  it('best/worst wskazują właściwe fazy, gdy jedna faza nie ma danych', () => {
    // Menstruacja CELOWO bez check-inów; owulacja=5, folikularna=3, lutealna=2.
    const { logs, keys } = days(56, (i) => {
      const day = (i % 28) + 1
      if (day <= 5) return {}  // menstruacja: brak moodCheckIns
      const phase: CyclePhaseId = day <= 13 ? 'folikularna' : day <= 17 ? 'owulacyjna' : 'lutealna'
      return { moods: [PHASE_MOOD[phase]] }
    })
    const ctx: HypothesisContext = { cyclePhaseOf: cyclePhaseStub(keys) }
    const r = computeWeeklyInsight(logs, '2026-W20', ctx)
    const cyc = r.outcomes.find(o => o.id === 'cycle_phase_mood')!
    expect(cyc.result).toBeDefined()
    // Pusta grupa nie może przesunąć indeksów etykiet (nonEmptyIdx mapping).
    expect(cyc.result!.facts.primary.label).toBe('owulacja')
    expect(cyc.result!.facts.secondary!.label).toBe('faza lutealna')
  })
})

describe('Monte Carlo: szum nie produkuje „pewnych" wzorców', () => {
  // mulberry32 — deterministyczny PRNG, seed per run.
  function rng(seed: number) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  it('≤10% losowych 30-dniowych zbiorów kończy z jakimkolwiek „pewnym"', () => {
    const RUNS = 200
    let withPewny = 0
    for (let run = 0; run < RUNS; run++) {
      const rand = rng(run * 7919 + 13)
      const { logs, keys } = days(30, () => ({
        moods: [1 + Math.floor(rand() * 5), 1 + Math.floor(rand() * 5)],
        cbt: rand() < 0.5,
        physical: rand() < 0.5,
        cigs: Math.floor(rand() * 10),
      }))
      const ctx: HypothesisContext = { cyclePhaseOf: cyclePhaseStub(keys) }
      const r = computeWeeklyInsight(logs, '2026-W20', ctx)
      if (r.outcomes.some(o => o.confidence === 'pewny')) withPewny++
    }
    // FDR 0.05 + próg efektu + próg n → rzadkie fałszywe „pewne". 10% to sufit z zapasem.
    expect(withPewny / RUNS).toBeLessThanOrEqual(0.10)
  })
})
