import { describe, it, expect } from 'vitest'
import {
  normalCdf, twoSidedP,
  mannWhitneyU, spearman, kruskalWallis,
  bonferroni, checkMWU, checkSpearman, checkKruskal,
  THRESHOLDS,
} from '../lib/statTests'

// ── normalCdf — sanity ───────────────────────────────────────────────────

describe('normalCdf', () => {
  it('Φ(0) = 0.5', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4)
  })
  it('Φ(1.96) ≈ 0.975', () => {
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3)
  })
  it('symetria: Φ(-z) = 1 - Φ(z)', () => {
    expect(normalCdf(-1.5) + normalCdf(1.5)).toBeCloseTo(1, 4)
  })
})

describe('twoSidedP', () => {
  it('z=1.96 → p ≈ 0.05', () => {
    expect(twoSidedP(1.96)).toBeCloseTo(0.05, 2)
  })
  it('z=0 → p = 1', () => {
    expect(twoSidedP(0)).toBeCloseTo(1, 4)
  })
})

// ── Mann-Whitney U ───────────────────────────────────────────────────────

describe('mannWhitneyU', () => {
  it('zwraca null dla pustych grup', () => {
    expect(mannWhitneyU([], [1, 2])).toBeNull()
    expect(mannWhitneyU([1], [])).toBeNull()
  })

  it('identyczne grupy → effect ~ 0, p ~ 1', () => {
    const a = [3, 3, 3, 3, 3, 3]
    const b = [3, 3, 3, 3, 3, 3]
    const r = mannWhitneyU(a, b)!
    expect(r.effectSize).toBe(0)
    expect(r.p).toBeCloseTo(1, 1)
    expect(r.direction).toBe('tie')
  })

  it('wyraźnie różne grupy → wysoki effect, niski p', () => {
    const a = [5, 5, 5, 4, 5, 4, 5, 5, 4, 5]      // wysoki mood
    const b = [1, 2, 1, 2, 1, 2, 1, 1, 2, 1]      // niski mood
    const r = mannWhitneyU(a, b)!
    expect(Math.abs(r.effectSize)).toBeGreaterThan(0.9)
    expect(r.p).toBeLessThan(0.001)
    expect(r.direction).toBe('A>B')
    expect(r.meanA).toBeGreaterThan(r.meanB)
  })

  it('A < B daje direction A<B i ujemny effect', () => {
    const a = [1, 2, 1, 2, 1, 2, 1, 1, 2, 1]
    const b = [5, 5, 5, 4, 5, 4, 5, 5, 4, 5]
    const r = mannWhitneyU(a, b)!
    expect(r.effectSize).toBeLessThan(-0.9)
    expect(r.direction).toBe('A<B')
  })

  it('zlicza wartości n poprawnie', () => {
    const r = mannWhitneyU([1, 2, 3], [4, 5, 6, 7])!
    expect(r.nA).toBe(3)
    expect(r.nB).toBe(4)
  })
})

// ── Spearman ρ ───────────────────────────────────────────────────────────

describe('spearman', () => {
  it('null dla n<3', () => {
    expect(spearman([1], [2])).toBeNull()
    expect(spearman([1, 2], [3, 4])).toBeNull()
  })

  it('rzuca dla nierównych długości', () => {
    expect(() => spearman([1, 2, 3], [1, 2])).toThrow()
  })

  it('idealna korelacja ρ = 1 (monotoniczna)', () => {
    const r = spearman([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [10, 20, 30, 40, 50, 60, 70, 80, 90, 100])!
    expect(r.rho).toBeCloseTo(1, 4)
    expect(r.p).toBeLessThan(0.01)
  })

  it('idealna anty-korelacja ρ = -1', () => {
    const r = spearman([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [10, 9, 8, 7, 6, 5, 4, 3, 2, 1])!
    expect(r.rho).toBeCloseTo(-1, 4)
  })

  it('losowe dane → ρ blisko 0', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const ys = [5, 3, 8, 1, 9, 4, 7, 2, 6, 10]
    const r = spearman(xs, ys)!
    expect(Math.abs(r.rho)).toBeLessThan(0.5)
  })
})

// ── Kruskal-Wallis ───────────────────────────────────────────────────────

describe('kruskalWallis', () => {
  it('null dla <2 niepustych grup', () => {
    expect(kruskalWallis([[1, 2, 3], []])).toBeNull()
    expect(kruskalWallis([])).toBeNull()
  })

  it('null gdy łącznie n<6', () => {
    expect(kruskalWallis([[1, 2], [3, 4]])).toBeNull()
  })

  it('identyczne grupy → H ~ 0, p ~ 1', () => {
    const r = kruskalWallis([[3, 3, 3, 3], [3, 3, 3, 3], [3, 3, 3, 3]])!
    expect(r.H).toBeCloseTo(0, 1)
    expect(r.p).toBeGreaterThan(0.5)
    expect(r.epsilonSquared).toBe(0)
  })

  it('wyraźnie różne grupy → niskie p', () => {
    const r = kruskalWallis([
      [1, 1, 2, 1, 2, 1],
      [3, 3, 4, 3, 3, 4],
      [5, 5, 5, 5, 4, 5],
    ])!
    expect(r.p).toBeLessThan(0.01)
    expect(r.epsilonSquared).toBeGreaterThan(0.5)
    expect(r.k).toBe(3)
    expect(r.N).toBe(18)
  })

  it('zwraca średnie grup', () => {
    const r = kruskalWallis([[1, 1, 1], [3, 3, 3], [5, 5, 5]])!
    expect(r.groupMeans).toEqual([1, 3, 5])
    expect(r.groupSizes).toEqual([3, 3, 3])
  })
})

// ── Bonferroni ────────────────────────────────────────────────────────────

describe('bonferroni', () => {
  it('mnoży przez K', () => {
    expect(bonferroni([0.01, 0.02, 0.03])).toEqual([0.03, 0.06, 0.09])
  })

  it('klipuje do 1', () => {
    expect(bonferroni([0.5, 0.5])).toEqual([1, 1])
  })

  it('puste wejście', () => {
    expect(bonferroni([])).toEqual([])
  })
})

// ── Checks (significance gates) ──────────────────────────────────────────

describe('checkMWU', () => {
  it('passed=true gdy n≥10 per group, |r|≥0.3, p_adj<0.05', () => {
    const r = {
      nA: 12, nB: 14, U: 0, z: 3, p: 0.001,
      effectSize: 0.5, meanA: 4, meanB: 2, direction: 'A>B' as const,
    }
    expect(checkMWU(r, 0.01).passed).toBe(true)
  })

  it('odrzuca n_too_small', () => {
    const r = {
      nA: 5, nB: 14, U: 0, z: 3, p: 0.001,
      effectSize: 0.5, meanA: 4, meanB: 2, direction: 'A>B' as const,
    }
    expect(checkMWU(r, 0.01)).toEqual({ passed: false, reason: 'n_too_small' })
  })

  it('odrzuca effect_too_small', () => {
    const r = {
      nA: 12, nB: 14, U: 0, z: 3, p: 0.001,
      effectSize: 0.1, meanA: 4, meanB: 3.9, direction: 'A>B' as const,
    }
    expect(checkMWU(r, 0.01)).toEqual({ passed: false, reason: 'effect_too_small' })
  })

  it('odrzuca p_too_high (po korekcie)', () => {
    const r = {
      nA: 12, nB: 14, U: 0, z: 3, p: 0.04,
      effectSize: 0.5, meanA: 4, meanB: 2, direction: 'A>B' as const,
    }
    expect(checkMWU(r, 0.4)).toEqual({ passed: false, reason: 'p_too_high' })
  })

  it('null wynik → no_data', () => {
    expect(checkMWU(null, 0.01)).toEqual({ passed: false, reason: 'no_data' })
  })
})

describe('checkSpearman', () => {
  it('passed wymaga n≥MIN_TOTAL i |ρ|≥0.3', () => {
    expect(checkSpearman({ n: 15, rho: 0.5, z: 2, p: 0.01 }, 0.01).passed).toBe(true)
    expect(checkSpearman({ n: 5, rho: 0.5, z: 2, p: 0.01 }, 0.01).passed).toBe(false)
    expect(checkSpearman({ n: 15, rho: 0.1, z: 2, p: 0.01 }, 0.01).passed).toBe(false)
  })
})

describe('checkKruskal', () => {
  it('thresholds: N i epsilon i p', () => {
    const r = { k: 3, N: 30, H: 10, p: 0.01, epsilonSquared: 0.3, meanRanks: [], groupMeans: [], groupSizes: [] }
    expect(checkKruskal(r, 0.01).passed).toBe(true)
  })
})

describe('THRESHOLDS — sanity', () => {
  it('progi mają rozsądne wartości', () => {
    expect(THRESHOLDS.MIN_PER_GROUP).toBeGreaterThanOrEqual(8)
    expect(THRESHOLDS.MIN_EFFECT).toBeGreaterThanOrEqual(0.2)
    expect(THRESHOLDS.MAX_P).toBeLessThanOrEqual(0.05)
  })
})
