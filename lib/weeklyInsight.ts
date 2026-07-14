// Orchestrator weekly insight.
//
// Pipeline:
//   1. Iteruj po hipotezach, każda extractuje swoje dane.
//   2. Odfiltruj te bez wystarczających danych (n_too_small itd. — pre-test gating).
//   3. Wykonaj test na pozostałych. Zbierz surowe p-values.
//   4. Korekta FDR (Benjamini-Hochberg) na podstawie liczby testów które rzeczywiście wykonano.
//   5. gradeConfidence() dla każdego testu — stopień pewności: pewny / wstępny / słaby.
//      „Pewny" dodatkowo honoruje twardy próg n≥10 (mniejsze próby → najwyżej „wstępny").
//   6. Wybierz top 1-3: najpierw po stopniu pewności, potem po istotności (rawP).
//   7. Złóż tekst: nagłówek + 1-3 paragrafy z templatów (z tagiem pewności) + pytanie
//      refleksyjne. Gdy nic nie wyszło — osobisty profil zamiast ściany „brak wzorców".
//
// Outpot zapisywany do Firestore — deterministyczny dla tego samego inputu.
import type { DailyLog } from '@/types'
import {
  mannWhitneyU, spearman, kruskalWallis, benjaminiHochberg,
  gradeConfidence, CONFIDENCE_LABEL, THRESHOLDS, type Confidence,
} from './statTests'
import {
  HYPOTHESES, type Hypothesis, type HypothesisResult, type ExtractedData,
  type HypothesisContext,
} from './weeklyHypotheses'

export type SkipReason = 'n_too_small' | 'effect_too_small' | 'p_too_high' | 'no_data'

export interface HypothesisOutcome {
  id: string
  shortLabel: string
  category: Hypothesis['category']
  /** true = twardy próg („pewny"). Zachowane dla kompatybilności UI. */
  passed: boolean
  /** Stopień pewności gdy test się wykonał i efekt jest zauważalny. */
  confidence?: Confidence
  reason?: SkipReason
  /** Surowy wynik gdy test się wykonał (dowolny confidence lub odrzucony). */
  result?: HypothesisResult
  /** Zrenderowany tekst gdy confidence != null. */
  text?: string
  reflectionQuestion?: string
}

/** Zwięzły, osobisty obraz danych — do stanu „nic się nie wyróżniło". */
export interface InsightProfile {
  moodDays: number
  avgMood: number | null
  /** Zachowania robione niemal zawsze / niemal nigdy → brak kontrastu do porównań. */
  constants: { label: string; kind: 'zawsze' | 'nigdy' }[]
}

export interface WeeklyInsight {
  weekKey: string
  generatedAt: string         // ISO
  totalHypotheses: number
  testsRun: number            // ile faktycznie odpalono (po wstępnej filtracji n)
  passedCount: number
  outcomes: HypothesisOutcome[]
  /** Najwyższy stopień pewności wśród pokazanych sygnałów (null gdy nic nie wyszło). */
  topConfidence?: Confidence | null
  /** Złożony tekst dla UI. */
  headline: string
  body: string
  /** Czy w ogóle warto pokazać — false oznacza "nic ciekawego nie wyszło, ale zachowaj cache". */
  hasContent: boolean
  /** Osobisty obraz danych — pokazywany, gdy nic się nie wyróżniło. */
  profile?: InsightProfile
  /** Podpis danych wejściowych — pozwala wykryć, że logi się zmieniły i przeliczyć cache. */
  inputSig?: number
}

// Podpis wejścia — rośnie z każdym nowym dniem / check-inem / elementem rutyny.
// Hook porównuje go z cache'em, żeby przeliczyć insight gdy dojdą nowe dane
// (codziennie, nie tylko w niedzielę). Uwzględnia też papierosy, CBT i — gdy podano
// resolver fazy — pokrycie cyklem, żeby zmiana tych danych też odświeżała wynik.
export function logsSignature(logs: Record<string, DailyLog>, ctx: HypothesisContext = {}): number {
  let sig = 0
  for (const [key, l] of Object.entries(logs)) {
    sig += 1
    sig += (l.moodCheckIns?.length ?? 0) * 7
    sig += (l.completedRoutine?.length ?? 0)
    sig += (l.cigarettes?.length ?? 0)
    sig += l.cbtCaptureAwarded ? 3 : 0
    if (ctx.cyclePhaseOf && ctx.cyclePhaseOf(key)) sig += 2
  }
  return sig
}

// ── Pure pipeline ─────────────────────────────────────────────────────────

// Progi WŁĄCZENIA testu do stopniowania (i do mianownika FDR). Luźniejsze niż próg
// „pewny": sam stopień pewności (rawP / q / effect) reguluje moc — mały n daje wysokie
// p, więc test co najwyżej wyląduje jako „słaby". Dzięki temu subtelny, ale realny
// sygnał w ogóle ma szansę się pokazać, zamiast wypadać jako „za mało danych".
const INCLUDE_MIN_GROUP = 6   // MWU: min obserwacji w każdej grupie
const INCLUDE_MIN_TOTAL = 8   // Spearman / Kruskal: min łącznie

export function computeWeeklyInsight(
  logs: Record<string, DailyLog>,
  weekKey: string,
  ctx: HypothesisContext = {},
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
    const data = h.extract(logs, ctx)
    if (!data) return { h, data: null, rawP: null, rawResult: null, skipReason: 'no_data' }

    let rawP: number | null = null
    let rawResult: HypothesisResult | null = null
    let skipReason: SkipReason | undefined

    if (data.test === 'mwu') {
      const r = mannWhitneyU(data.groupA, data.groupB)
      if (!r) { skipReason = 'no_data' }
      else if (r.nA < INCLUDE_MIN_GROUP || r.nB < INCLUDE_MIN_GROUP) {
        // Za mało obserwacji nawet na „słaby" sygnał — NIE liczymy go do K
        // (mianownika FDR). Inaczej testy-bez-mocy zawyżałyby korektę i chowały
        // realne wzorce. rawResult/rawP zostają null.
        skipReason = 'n_too_small'
      }
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
      else if (r.n < INCLUDE_MIN_TOTAL) {
        skipReason = 'n_too_small'   // patrz wyżej — out z K
      }
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
      else if (r.N < INCLUDE_MIN_TOTAL) {
        skipReason = 'n_too_small'   // patrz wyżej — out z K
      }
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

  // Step 2: testy które fizycznie wykonano (mają rawP) — to K dla korekty FDR.
  const testedIdx = step1
    .map((s, i) => s.rawP !== null ? i : -1)
    .filter(i => i >= 0)
  const K = testedIdx.length

  // Benjamini-Hochberg zamiast Bonferroniego: kontrolujemy ODSETEK fałszywych
  // odkryć, nie „choćby jedno". Znacznie większa moc przy stabilnych danych
  // osobistych — subtelny, ale realny wzorzec ma szansę przebić.
  let correctedP: number[] = []
  if (K > 0) {
    correctedP = benjaminiHochberg(testedIdx.map(i => step1[i].rawP!))
  }

  // Step 3: zbuduj outcomes ze stopniem pewności (pewny/wstępny/słaby).
  const RANK: Record<Confidence, number> = { pewny: 3, wstępny: 2, słaby: 1 }
  const outcomes: HypothesisOutcome[] = step1.map((s, idx) => {
    const base = { id: s.h.id, shortLabel: s.h.shortLabel, category: s.h.category }
    if (s.skipReason || !s.rawResult || s.rawP === null) {
      return { ...base, passed: false, reason: s.skipReason ?? 'no_data' }
    }

    const correctedIdx = testedIdx.indexOf(idx)
    const qAdj = correctedIdx >= 0 ? correctedP[correctedIdx] : s.rawP
    const result: HypothesisResult = { ...s.rawResult, pCorrected: qAdj }

    const kind = s.data!.test  // 'mwu' | 'spearman' | 'kruskal'
    let confidence = gradeConfidence(kind, s.rawP, qAdj, s.rawResult.effectSize)

    // „Pewny" honoruje twardy próg n z karty (n ≥ 10): dla MWU obie grupy ≥ 10,
    // dla Spearmana/Kruskala n łączne ≥ 10. Luźniejsza bramka WŁĄCZENIA (6/grupę)
    // pozwala małym próbom istnieć jako sygnał — ale nie jako twardy pewnik.
    if (confidence === 'pewny') {
      const nOk = kind === 'mwu'
        ? (s.rawResult.facts.primary.n ?? 0) >= THRESHOLDS.MIN_PER_GROUP
          && (s.rawResult.facts.secondary?.n ?? 0) >= THRESHOLDS.MIN_PER_GROUP
        : s.rawResult.n >= THRESHOLDS.MIN_TOTAL
      if (!nOk) confidence = 'wstępny'
    }

    if (!confidence) {
      // Efekt zbyt mały / nieistotny — pokaż powód w szczegółach.
      const reason: SkipReason = qAdj > THRESHOLDS.MAX_P ? 'p_too_high' : 'effect_too_small'
      return { ...base, passed: false, reason, result }
    }

    const text = s.h.template(result)
    const question = s.h.reflectionQuestions[Math.floor(Math.random() * s.h.reflectionQuestions.length)]
    return { ...base, passed: confidence === 'pewny', confidence, result, text, reflectionQuestion: question }
  })

  // Sygnały do pokazania: cokolwiek z niezerowym stopniem pewności, uszeregowane
  // najpierw po pewności (pewny > wstępny > słaby), potem po istotności (rawP).
  const signals = outcomes.filter(o => o.confidence)
  const testedRawP = new Map<string, number>()
  for (const i of testedIdx) testedRawP.set(step1[i].h.id, step1[i].rawP!)
  const top = [...signals]
    .sort((a, b) => {
      const r = RANK[b.confidence!] - RANK[a.confidence!]
      if (r !== 0) return r
      return (testedRawP.get(a.id) ?? 1) - (testedRawP.get(b.id) ?? 1)
    })
    .slice(0, 3)

  const passedCount = outcomes.filter(o => o.passed).length
  const topConfidence: Confidence | null = top[0]?.confidence ?? null
  const profile = computeProfile(logs)

  const { headline, body, hasContent } = composeText(top, K, hypotheses.length, profile)

  return {
    weekKey,
    generatedAt: new Date().toISOString(),
    totalHypotheses: hypotheses.length,
    testsRun: K,
    passedCount,
    outcomes,
    topConfidence,
    headline,
    body,
    hasContent,
    profile,
    inputSig: logsSignature(logs, ctx),
  }
}

// ── Osobisty profil (do stanu „nic się nie wyróżniło") ─────────────────────

function computeProfile(logs: Record<string, DailyLog>): InsightProfile {
  const withMood = Object.values(logs).filter(l => (l.moodCheckIns?.length ?? 0) > 0)
  let moodSum = 0, moodN = 0
  for (const l of withMood) {
    for (const c of l.moodCheckIns!) { moodSum += c.mood; moodN += 1 }
  }
  const avgMood = moodN > 0 ? moodSum / moodN : null

  // Zachowania robione niemal zawsze (≥85%) albo niemal nigdy (≤15%) — to właśnie
  // one nie dają się porównać, bo brak kontrastu. Nazwij je wprost.
  const constants: InsightProfile['constants'] = []
  const flag = (label: string, pred: (l: DailyLog) => boolean) => {
    const n = withMood.length
    if (n < 5) return
    const yes = withMood.filter(pred).length
    const frac = yes / n
    if (frac >= 0.85) constants.push({ label, kind: 'zawsze' })
    else if (frac <= 0.15) constants.push({ label, kind: 'nigdy' })
  }
  flag('ruch', l => l.physicalActivity === true)
  flag('kontakt z ludźmi', l => l.socialPresence === true)
  flag('Ghost Protocol', l => l.ghostProtocolCompleted === true)

  return { moodDays: withMood.length, avgMood, constants }
}

// ── Composing ─────────────────────────────────────────────────────────────

function composeText(
  top: HypothesisOutcome[],
  K: number,
  total: number,
  profile: InsightProfile,
): { headline: string; body: string; hasContent: boolean } {
  if (top.length === 0) {
    if (K === 0) {
      return {
        headline: 'Za mało danych w tym tygodniu',
        body: 'Żaden z wzorców nie miał wystarczająco obserwacji, żeby cokolwiek policzyć rygorystycznie. To OK — wzorce ujawniają się przy ≥10 dniach z check-inami w każdej porównywanej grupie. Rób check-iny nastroju (najlepiej 2 dziennie), a obraz sam się wypełni.',
        hasContent: false,
      }
    }
    // Nie „ściana błędu" — osobisty, opisowy obraz.
    const parts: string[] = []
    if (profile.avgMood != null) {
      parts.push(`Twój nastrój trzyma się stabilnie w okolicy ${fmt(profile.avgMood)}/5 — a stabilność to nie brak wzorca, tylko powód, dla którego pojedynczy czynnik trudno wyłuskać.`)
    }
    parts.push(`Sprawdziłam ${K} z ${total} wzorców; w tym tygodniu żaden nie wyróżnił się na tyle, by go uczciwie wskazać.`)
    if (profile.constants.length > 0) {
      const list = profile.constants.map(c => `${c.label} (${c.kind})`).join(', ')
      parts.push(`Najbardziej stałe u Ciebie: ${list}. Tego nie da się porównać — bo robisz to niemal zawsze albo niemal nigdy. Wzorzec potrzebuje kontrastu: gdybyś czasem zmieniła jeden z tych elementów, silnik miałby co zestawić.`)
    } else {
      parts.push('Żeby wzorzec dało się policzyć, potrzeba kontrastu między dniami — im bardziej różnorodne dni, tym więcej silnik zobaczy.')
    }
    return { headline: 'Stabilny tydzień — bez wyraźnego wzorca', body: parts.join('\n\n'), hasContent: false }
  }

  // Buduj paragrafy z etykietą pewności przy każdym sygnale.
  const paragraphs: string[] = []
  for (const o of top) {
    if (!o.text) continue
    const tag = o.confidence ? `[${CONFIDENCE_LABEL[o.confidence]}] ` : ''
    const block = `${tag}${o.text}\n\n${o.reflectionQuestion ?? ''}`.trim()
    paragraphs.push(block)
  }

  const strongest = top[0].confidence!
  const headline =
    strongest === 'pewny'
      ? (top.filter(o => o.confidence === 'pewny').length > 1 ? 'Pewne wzorce tygodnia' : 'Pewny wzorzec tygodnia')
      : strongest === 'wstępny'
        ? 'Wstępny sygnał tygodnia'
        : 'Słaby sygnał — warty oka'

  const body = paragraphs.join('\n\n— · —\n\n')

  return { headline, body, hasContent: true }
}

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',')
}
