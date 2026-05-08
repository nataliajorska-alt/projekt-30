// Lokalne testy statystyczne — czyste funkcje, deterministyczne, bez API.
//
// Wybrane metody:
//   • Mann-Whitney U  — porównanie 2 grup, dane porządkowe (mood 1-5), bez założenia normalności.
//   • Spearman ρ      — korelacja monotoniczna, też non-parametric.
//   • Kruskal-Wallis  — porównanie >2 grup (np. day-of-week).
//   • Effect sizes:
//       rank-biserial r dla MWU
//       ρ samo w sobie jest effect size
//       ε² dla Kruskala
//   • Bonferroni      — korekta na multiple comparisons.
//
// p-values liczymy z normalnej aproksymacji (z-score), valid dla n ≥ 8.
// Nie liczymy bootstrapów — niepotrzebny narzut przy naszej skali.

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Dystrybuanta standardowego rozkładu normalnego (Abramowitz & Stegun 7.1.26, ε ≈ 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp(-z * z / 2)
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return z >= 0 ? 1 - p : p
}

/** Two-tailed p-value z |z|. */
export function twoSidedP(z: number): number {
  return 2 * (1 - normalCdf(Math.abs(z)))
}

/** Średnia rang z obsługą wiązań (ties get average rank). */
function rankWithTies(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)
  const ranks = new Array<number>(values.length)
  let i = 0
  while (i < indexed.length) {
    let j = i
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++
    const avgRank = (i + j) / 2 + 1  // ranks są 1-based
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank
    i = j + 1
  }
  return ranks
}

// ── Mann-Whitney U ───────────────────────────────────────────────────────────

export interface MannWhitneyResult {
  /** Liczba obserwacji w grupie A. */
  nA: number
  nB: number
  /** U = mniejsza z dwóch statystyk Manna-Whitneya. */
  U: number
  /** z-score po korekcie na wiązania. */
  z: number
  /** Two-sided p-value z aproksymacji normalnej. */
  p: number
  /** Effect size: rank-biserial correlation r ∈ [-1, 1]. |r|≥0.3 średni, ≥0.5 duży. */
  effectSize: number
  meanA: number
  meanB: number
  /** Czy A ma wyższe rangi niż B (medianalnie). */
  direction: 'A>B' | 'A<B' | 'tie'
}

/**
 * Mann-Whitney U test (dwustronny, z aproksymacją normalną i korektą wiązań).
 * Zwraca null gdy któraś grupa pusta.
 */
export function mannWhitneyU(a: number[], b: number[]): MannWhitneyResult | null {
  if (a.length === 0 || b.length === 0) return null
  const nA = a.length, nB = b.length
  const all = [...a, ...b]
  const ranks = rankWithTies(all)

  const sumA = ranks.slice(0, nA).reduce((s, r) => s + r, 0)
  const U_A = sumA - nA * (nA + 1) / 2
  const U_B = nA * nB - U_A
  const U = Math.min(U_A, U_B)

  // Korekta na wiązania w wariancji
  const tieCounts = countTies(all)
  const tieCorrection = tieCounts.reduce((s, t) => s + (t ** 3 - t), 0)
  const N = nA + nB
  const meanU = (nA * nB) / 2
  const stdU = Math.sqrt(
    (nA * nB / 12) * ((N + 1) - tieCorrection / (N * (N - 1)))
  )

  if (stdU === 0) {
    // Wszystkie wartości identyczne — brak różnicy.
    return {
      nA, nB, U, z: 0, p: 1, effectSize: 0,
      meanA: a.reduce((s, x) => s + x, 0) / nA,
      meanB: b.reduce((s, x) => s + x, 0) / nB,
      direction: 'tie',
    }
  }

  // Continuity correction (±0.5)
  const z = (U - meanU + (U > meanU ? -0.5 : 0.5)) / stdU
  const p = twoSidedP(z)

  // rank-biserial r = 2*U_A/(nA*nB) - 1, znak wskazuje która grupa wyżej.
  // r ∈ [-1, 1]: +1 gdy A całkowicie dominuje, -1 gdy B całkowicie dominuje, 0 przy braku różnicy.
  const r = (2 * U_A) / (nA * nB) - 1
  const meanA = a.reduce((s, x) => s + x, 0) / nA
  const meanB = b.reduce((s, x) => s + x, 0) / nB

  return {
    nA, nB, U, z, p, effectSize: r,
    meanA, meanB,
    direction: r > 0.05 ? 'A>B' : r < -0.05 ? 'A<B' : 'tie',
  }
}

function countTies(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const counts: number[] = []
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]) run++
    else { if (run > 1) counts.push(run); run = 1 }
  }
  if (run > 1) counts.push(run)
  return counts
}

// ── Spearman ρ ───────────────────────────────────────────────────────────────

export interface SpearmanResult {
  n: number
  /** Spearman rank correlation, równocześnie effect size. */
  rho: number
  z: number
  p: number
}

/**
 * Spearman rank correlation. Zwraca null dla n<3.
 * p-value z aproksymacji normalnej z = ρ * sqrt(n-1), valid dla n ≥ 10.
 */
export function spearman(xs: number[], ys: number[]): SpearmanResult | null {
  if (xs.length !== ys.length) throw new Error('spearman: arrays must have same length')
  const n = xs.length
  if (n < 3) return null

  const rx = rankWithTies(xs)
  const ry = rankWithTies(ys)
  const meanX = (n + 1) / 2
  const meanY = (n + 1) / 2

  let num = 0, dx2 = 0, dy2 = 0
  for (let i = 0; i < n; i++) {
    const a = rx[i] - meanX
    const b = ry[i] - meanY
    num += a * b
    dx2 += a * a
    dy2 += b * b
  }
  const denom = Math.sqrt(dx2 * dy2)
  if (denom === 0) return { n, rho: 0, z: 0, p: 1 }
  const rho = num / denom

  // Fisher transformation gives more accurate p; for simplicity use ρ * sqrt(n-1).
  const z = rho * Math.sqrt(n - 1)
  const p = twoSidedP(z)
  return { n, rho, z, p }
}

// ── Kruskal-Wallis H ─────────────────────────────────────────────────────────

export interface KruskalResult {
  k: number          // liczba grup
  N: number          // liczba wszystkich obserwacji
  H: number          // statystyka H (≈ chi² o k-1 dof)
  p: number
  /** ε² ∈ [0,1] — effect size dla Kruskala. */
  epsilonSquared: number
  /** Średnie rang per grupa, ułatwia interpretację. */
  meanRanks: number[]
  /** Średnie wartości per grupa, do template. */
  groupMeans: number[]
  groupSizes: number[]
}

/** Kruskal-Wallis H test. Zwraca null gdy <2 niepuste grupy lub n<6 łącznie. */
export function kruskalWallis(groups: number[][]): KruskalResult | null {
  const nonEmpty = groups.filter(g => g.length > 0)
  if (nonEmpty.length < 2) return null

  const N = nonEmpty.reduce((s, g) => s + g.length, 0)
  if (N < 6) return null

  const flat: number[] = []
  for (const g of nonEmpty) for (const v of g) flat.push(v)
  const ranks = rankWithTies(flat)

  let pos = 0
  const sumRanks: number[] = []
  const meanRanks: number[] = []
  const groupMeans: number[] = []
  const groupSizes: number[] = []
  for (const g of nonEmpty) {
    let s = 0
    for (let i = 0; i < g.length; i++) s += ranks[pos + i]
    sumRanks.push(s)
    meanRanks.push(s / g.length)
    groupMeans.push(g.reduce((a, b) => a + b, 0) / g.length)
    groupSizes.push(g.length)
    pos += g.length
  }

  const k = nonEmpty.length
  let H = 0
  for (let i = 0; i < k; i++) H += (sumRanks[i] ** 2) / nonEmpty[i].length
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1)

  // Korekta na wiązania
  const tieCounts = countTies(flat)
  const C = 1 - tieCounts.reduce((s, t) => s + (t ** 3 - t), 0) / (N ** 3 - N)
  if (C > 0) H = H / C

  const dof = k - 1
  const p = chiSquareP(H, dof)
  // ε² = (H - k + 1) / (N - k), klipowane do [0,1]
  const epsilon = Math.max(0, Math.min(1, (H - k + 1) / (N - k)))

  return { k, N, H, p, epsilonSquared: epsilon, meanRanks, groupMeans, groupSizes }
}

/** P-value z testu chi-kwadrat (Wilson-Hilferty approximation). */
function chiSquareP(x: number, dof: number): number {
  if (x <= 0 || dof <= 0) return 1
  // Wilson-Hilferty: ((x/dof)^(1/3) − (1 − 2/(9dof))) / sqrt(2/(9dof)) ~ N(0,1)
  const a = 2 / (9 * dof)
  const z = (Math.cbrt(x / dof) - (1 - a)) / Math.sqrt(a)
  return 1 - normalCdf(z)
}

// ── Multiple comparisons correction ──────────────────────────────────────────

/**
 * Bonferroni correction: zwraca p_adjusted = min(1, p * K) dla każdego testu.
 * K to liczba testów które rzeczywiście były wykonane (nie wszystkie zaplanowane).
 */
export function bonferroni(pValues: number[]): number[] {
  const K = pValues.length
  return pValues.map(p => Math.min(1, p * K))
}

// ── Test result envelope ─────────────────────────────────────────────────────

export interface SignificanceCheck {
  passed: boolean
  reason?: 'n_too_small' | 'effect_too_small' | 'p_too_high' | 'no_data'
}

export const THRESHOLDS = {
  MIN_PER_GROUP: 10,    // minimum n per grupa dla MWU
  MIN_TOTAL: 10,        // minimum n dla Spearmana / Kruskala
  MIN_EFFECT: 0.3,      // |effect size| ≥ 0.3 (medium)
  MAX_P: 0.05,          // przed korektą Bonferroniego
} as const

export function checkMWU(r: MannWhitneyResult | null, pCorrected: number): SignificanceCheck {
  if (!r) return { passed: false, reason: 'no_data' }
  if (r.nA < THRESHOLDS.MIN_PER_GROUP || r.nB < THRESHOLDS.MIN_PER_GROUP) {
    return { passed: false, reason: 'n_too_small' }
  }
  if (Math.abs(r.effectSize) < THRESHOLDS.MIN_EFFECT) {
    return { passed: false, reason: 'effect_too_small' }
  }
  if (pCorrected > THRESHOLDS.MAX_P) {
    return { passed: false, reason: 'p_too_high' }
  }
  return { passed: true }
}

export function checkSpearman(r: SpearmanResult | null, pCorrected: number): SignificanceCheck {
  if (!r) return { passed: false, reason: 'no_data' }
  if (r.n < THRESHOLDS.MIN_TOTAL) return { passed: false, reason: 'n_too_small' }
  if (Math.abs(r.rho) < THRESHOLDS.MIN_EFFECT) return { passed: false, reason: 'effect_too_small' }
  if (pCorrected > THRESHOLDS.MAX_P) return { passed: false, reason: 'p_too_high' }
  return { passed: true }
}

export function checkKruskal(r: KruskalResult | null, pCorrected: number): SignificanceCheck {
  if (!r) return { passed: false, reason: 'no_data' }
  if (r.N < THRESHOLDS.MIN_TOTAL) return { passed: false, reason: 'n_too_small' }
  if (r.epsilonSquared < THRESHOLDS.MIN_EFFECT * 0.3) return { passed: false, reason: 'effect_too_small' }
  if (pCorrected > THRESHOLDS.MAX_P) return { passed: false, reason: 'p_too_high' }
  return { passed: true }
}
