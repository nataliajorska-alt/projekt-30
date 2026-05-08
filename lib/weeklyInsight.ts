// Orchestrator weekly insight.
//
// Pipeline:
//   1. Iteruj po hipotezach, każda extractuje swoje dane.
//   2. Odfiltruj te bez wystarczających danych (n_too_small itd. — pre-test gating).
//   3. Wykonaj test na pozostałych. Zbierz surowe p-values.
//   4. Bonferroni na podstawie liczby testów które rzeczywiście wykonano.
//   5. checkXxx() dla każdego testu — zbierz "passed".
//   6. Wybierz top 1-3 z największym |effect size|.
//   7. Złóż tekst: nagłówek + 1-3 paragrafy z templatów + pytanie refleksyjne.
//
// Outpot zapisywany do Firestore — deterministyczny dla tego samego inputu.
import type { DailyLog } from '@/types'
import {
  mannWhitneyU, spearman, kruskalWallis, bonferroni,
  checkMWU, checkSpearman, checkKruskal,
} from './statTests'
import { HYPOTHESES, type Hypothesis, type HypothesisResult, type ExtractedData } from './weeklyHypotheses'

export type SkipReason = 'n_too_small' | 'effect_too_small' | 'p_too_high' | 'no_data'

export interface HypothesisOutcome {
  id: string
  shortLabel: string
  category: Hypothesis['category']
  passed: boolean
  reason?: SkipReason
  /** Surowy wynik gdy test się wykonał (passed lub p_too_high/effect_too_small). */
  result?: HypothesisResult
  /** Zrenderowany tekst gdy passed=true. */
  text?: string
  reflectionQuestion?: string
}

export interface WeeklyInsight {
  weekKey: string
  generatedAt: string         // ISO
  totalHypotheses: number
  testsRun: number            // ile faktycznie odpalono (po wstępnej filtracji n)
  passedCount: number
  outcomes: HypothesisOutcome[]
  /** Złożony tekst dla UI. */
  headline: string
  body: string
  /** Czy w ogóle warto pokazać — false oznacza "nic ciekawego nie wyszło, ale zachowaj cache". */
  hasContent: boolean
}

// ── Pure pipeline ─────────────────────────────────────────────────────────

export function computeWeeklyInsight(
  logs: Record<string, DailyLog>,
  weekKey: string,
  hypotheses: Hypothesis[] = HYPOTHESES,
): WeeklyInsight {
  // Pre-extract i pre-test gating.
  type Step1 = {
    h: Hypothesis
    data: ExtractedData | null
    rawP: number | null
    rawResult: HypothesisResult | null
    skipReason?: SkipReason
  }

  const step1: Step1[] = hypotheses.map(h => {
    const data = h.extract(logs)
    if (!data) return { h, data: null, rawP: null, rawResult: null, skipReason: 'no_data' }

    let rawP: number | null = null
    let rawResult: HypothesisResult | null = null
    let skipReason: SkipReason | undefined

    if (data.test === 'mwu') {
      const r = mannWhitneyU(data.groupA, data.groupB)
      if (!r) { skipReason = 'no_data' }
      else {
        rawP = r.p
        rawResult = {
          effectSize: r.effectSize,
          pCorrected: r.p,  // nadpisane potem
          n: r.nA + r.nB,
          facts: {
            primary:   { label: data.labelA, value: r.meanA, n: r.nA },
            secondary: { label: data.labelB, value: r.meanB, n: r.nB },
          },
        }
      }
    } else if (data.test === 'spearman') {
      const r = spearman(data.xs, data.ys)
      if (!r) { skipReason = 'no_data' }
      else {
        rawP = r.p
        rawResult = {
          effectSize: r.rho,
          pCorrected: r.p,
          n: r.n,
          facts: {
            primary: { label: data.xLabel, value: r.rho, n: r.n },
          },
        }
      }
    } else if (data.test === 'kruskal') {
      const r = kruskalWallis(data.groups)
      if (!r) { skipReason = 'no_data' }
      else {
        rawP = r.p
        // Znajdź najlepszą i najgorszą grupę po średniej (do template).
        let bestIdx = 0, worstIdx = 0
        for (let i = 1; i < r.groupMeans.length; i++) {
          if (r.groupMeans[i] > r.groupMeans[bestIdx]) bestIdx = i
          if (r.groupMeans[i] < r.groupMeans[worstIdx]) worstIdx = i
        }
        // Mapuj index nonempty → index original groups (z label)
        const nonEmptyIdx: number[] = []
        for (let i = 0; i < data.groups.length; i++) if (data.groups[i].length > 0) nonEmptyIdx.push(i)
        const bestLabel  = data.groupLabels[nonEmptyIdx[bestIdx]] ?? '?'
        const worstLabel = data.groupLabels[nonEmptyIdx[worstIdx]] ?? '?'
        rawResult = {
          effectSize: r.epsilonSquared,
          pCorrected: r.p,
          n: r.N,
          facts: {
            primary:   { label: bestLabel,  value: r.groupMeans[bestIdx],  n: r.groupSizes[bestIdx] },
            secondary: { label: worstLabel, value: r.groupMeans[worstIdx], n: r.groupSizes[worstIdx] },
          },
        }
      }
    }

    return { h, data, rawP, rawResult, skipReason }
  })

  // Step 2: testy które fizycznie wykonano (mają rawP) — to K dla Bonferroniego.
  const testedIdx = step1
    .map((s, i) => s.rawP !== null ? i : -1)
    .filter(i => i >= 0)
  const K = testedIdx.length

  let correctedP: number[] = []
  if (K > 0) {
    correctedP = bonferroni(testedIdx.map(i => step1[i].rawP!))
  }

  // Step 3: zbuduj outcomes.
  const outcomes: HypothesisOutcome[] = step1.map((s, idx) => {
    const base = { id: s.h.id, shortLabel: s.h.shortLabel, category: s.h.category }
    if (s.skipReason || !s.rawResult || s.rawP === null) {
      return { ...base, passed: false, reason: s.skipReason ?? 'no_data' }
    }

    const correctedIdx = testedIdx.indexOf(idx)
    const pAdj = correctedIdx >= 0 ? correctedP[correctedIdx] : s.rawP
    const result: HypothesisResult = { ...s.rawResult, pCorrected: pAdj }

    // Stosuj checker odpowiedni do typu testu.
    let check
    if (s.data!.test === 'mwu') {
      const mwuRaw = mannWhitneyU(s.data!.groupA, s.data!.groupB)
      check = checkMWU(mwuRaw, pAdj)
    } else if (s.data!.test === 'spearman') {
      const spRaw = spearman(s.data!.xs, s.data!.ys)
      check = checkSpearman(spRaw, pAdj)
    } else {
      const krRaw = kruskalWallis(s.data!.groups)
      check = checkKruskal(krRaw, pAdj)
    }

    if (!check.passed) {
      return { ...base, passed: false, reason: check.reason, result }
    }

    const text = s.h.template(result)
    const question = s.h.reflectionQuestions[Math.floor(Math.random() * s.h.reflectionQuestions.length)]
    return { ...base, passed: true, result, text, reflectionQuestion: question }
  })

  const passed = outcomes.filter(o => o.passed)
  // Top 3 po sile efektu
  const top = [...passed]
    .sort((a, b) => Math.abs(b.result!.effectSize) - Math.abs(a.result!.effectSize))
    .slice(0, 3)

  const { headline, body, hasContent } = composeText(passed.length, top, K, hypotheses.length)

  return {
    weekKey,
    generatedAt: new Date().toISOString(),
    totalHypotheses: hypotheses.length,
    testsRun: K,
    passedCount: passed.length,
    outcomes,
    headline,
    body,
    hasContent,
  }
}

// ── Composing ─────────────────────────────────────────────────────────────

function composeText(
  passedCount: number,
  top: HypothesisOutcome[],
  K: number,
  total: number,
): { headline: string; body: string; hasContent: boolean } {
  if (passedCount === 0) {
    if (K === 0) {
      return {
        headline: 'Za mało danych w tym tygodniu',
        body: 'Żaden z wzorców nie miał wystarczająco obserwacji żeby cokolwiek policzyć rygorystycznie. To OK — wzorce ujawniają się przy ≥30 dniach z check-inami i rutyną. Wróć za 1-2 tygodnie.',
        hasContent: false,
      }
    }
    return {
      headline: 'Brak istotnych wzorców',
      body: `Sprawdziłam ${K} z ${total} możliwych wzorców (reszta nie miała wystarczająco danych) — żaden nie przekroczył progu rygoru (n≥10, |effect|≥0.3, p<0.05 po korekcie Bonferroniego). To znaczy: jeszcze nic statystycznie pewnego — albo Twoje dni są bardziej zróżnicowane niż jakikolwiek pojedynczy czynnik. Też wartościowa informacja.`,
      hasContent: false,
    }
  }

  // 1-3 wzorce — buduj paragrafy.
  const paragraphs: string[] = []
  for (const o of top) {
    if (!o.text) continue
    const block = `${o.text}\n\n${o.reflectionQuestion ?? ''}`.trim()
    paragraphs.push(block)
  }

  const headline = passedCount === 1
    ? '1 wzorzec przeszedł próg rygoru'
    : `${passedCount} wzorce przeszły próg rygoru`

  const body = paragraphs.join('\n\n— · —\n\n')

  return { headline, body, hasContent: true }
}
