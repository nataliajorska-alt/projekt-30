// 10 pre-registered hipotez + extractory + szablony tekstowe.
//
// Reguły:
//   • Hipotezy są zdefiniowane Z GÓRY — żadnego "data dredgingu".
//   • Każda hipoteza dostaje swój extractor, test (MWU/Spearman/Kruskal) i template.
//   • Orchestrator (weeklyInsight.ts) wywoła wszystkie, zrobi Bonferroni, odsieje te bez danych.
//   • Template NIGDY nie używa języka przyczynowego ("X powoduje Y") — tylko obserwacyjnego ("po dniach X mood był wyższy").
//   • Każdy template kończy się pytaniem refleksyjnym losowanym z puli per-hipoteza.

import type { DailyLog } from '@/types'
import { dateKey, getISOWeekKey } from './gameLogic'

// ── Helpers do ekstrakcji ─────────────────────────────────────────────────

const MORNING_IDS = ['m1','m2','m3','m4','m5','m6','m7','m8','m9']
const MORNING_MIN = ['mm1','mm2','mm3']
const EVENING_IDS = ['e1','e2','e3','e4','e5','e6','e7']
const EVENING_MIN = ['em1','em2','em3']

function isMorningDone(log: DailyLog): boolean {
  const cr = log.completedRoutine ?? []
  const n = MORNING_IDS.filter(id => cr.includes(id)).length
  const m = MORNING_MIN.filter(id => cr.includes(id)).length
  return n >= 4 || m >= 2
}

function isEveningDone(log: DailyLog): boolean {
  const cr = log.completedRoutine ?? []
  const n = EVENING_IDS.filter(id => cr.includes(id)).length
  const m = EVENING_MIN.filter(id => cr.includes(id)).length
  return n >= 3 || m >= 2
}

function sortedCheckIns(log: DailyLog) {
  return [...(log.moodCheckIns ?? [])].sort((a, b) => a.timestamp - b.timestamp)
}

function avgMood(log: DailyLog): number | null {
  const ci = log.moodCheckIns ?? []
  if (ci.length === 0) return null
  return ci.reduce((s, c) => s + c.mood, 0) / ci.length
}

function firstMood(log: DailyLog): number | null {
  const ci = sortedCheckIns(log)
  return ci[0]?.mood ?? null
}

function lastMood(log: DailyLog): number | null {
  const ci = sortedCheckIns(log)
  return ci[ci.length - 1]?.mood ?? null
}

function nextDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + 1)
  return dateKey(dt)
}

// ── Extracted data shapes ─────────────────────────────────────────────────

export interface MWUData {
  test: 'mwu'
  groupA: number[]; groupB: number[]
  labelA: string;   labelB: string
}

export interface SpearmanData {
  test: 'spearman'
  xs: number[]; ys: number[]
  xLabel: string; yLabel: string
}

export interface KruskalData {
  test: 'kruskal'
  groups: number[][]
  groupLabels: string[]
}

export type ExtractedData = MWUData | SpearmanData | KruskalData

// ── Hipoteza ──────────────────────────────────────────────────────────────

export type HypothesisCategory = 'rutyna' | 'aktywność' | 'rytm' | 'trudność'

export interface HypothesisResult {
  /** Liczbowe statystyki — surowe, do template. */
  effectSize: number       // r dla MWU, ρ dla Spearmana, ε² dla Kruskala
  pCorrected: number
  n: number                // łączna liczba obserwacji
  /** Dla MWU: [labelA, meanA], [labelB, meanB]; Spearman: [xLabel, yLabel]; Kruskal: top 2 grup. */
  facts: {
    primary: { label: string; value: number; n?: number }
    secondary?: { label: string; value: number; n?: number }
  }
}

export interface Hypothesis {
  id: string
  category: HypothesisCategory
  /** Krótki nagłówek — do listy "co testowaliśmy". */
  shortLabel: string
  /** Funkcja ekstrakcji danych z logów. Zwraca null gdy nie ma żadnych danych do testu. */
  extract: (logs: Record<string, DailyLog>) => ExtractedData | null
  /** Szablon tekstu po polsku — dostaje wynik testu, generuje 2-4 zdania. */
  template: (r: HypothesisResult) => string
  /** Pula pytań refleksyjnych do losowania. */
  reflectionQuestions: readonly string[]
}

// ── Helper format ─────────────────────────────────────────────────────────

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',')
}

function effectStrength(abs: number): string {
  if (abs >= 0.5) return 'silna'
  if (abs >= 0.3) return 'średnia'
  return 'słaba'
}

// ── 10 hipotez ────────────────────────────────────────────────────────────

export const HYPOTHESES: Hypothesis[] = [
  // ─ 1. Rutyna poranna → poranny mood ─────────────────────────────────────
  {
    id: 'morning_routine_first_mood',
    category: 'rutyna',
    shortLabel: 'Rutyna poranna a poranny nastrój',
    extract: (logs) => {
      const groupA: number[] = []  // z rutyną
      const groupB: number[] = []  // bez
      for (const log of Object.values(logs)) {
        const fm = firstMood(log)
        if (fm === null) continue
        if (isMorningDone(log)) groupA.push(fm)
        else groupB.push(fm)
      }
      if (groupA.length === 0 && groupB.length === 0) return null
      return { test: 'mwu', groupA, groupB, labelA: 'po porannej rutynie', labelB: 'bez porannej rutyny' }
    },
    template: (r) => {
      const diff = Math.abs(r.facts.primary.value - r.facts.secondary!.value)
      const which = r.facts.primary.value > r.facts.secondary!.value ? 'wyższy' : 'niższy'
      return `Po dniach z poranną rutyną pierwszy mood był średnio o ${fmt(diff)} pkt ${which} niż w pozostałe dni (${r.facts.primary.label}: ${fmt(r.facts.primary.value)}, ${r.facts.secondary!.label}: ${fmt(r.facts.secondary!.value)}, n=${r.n}). Siła efektu ${effectStrength(Math.abs(r.effectSize))}. To korelacja, nie przyczyna — ale jeśli budujesz wzorzec ranny, to mocna obserwacja.`
    },
    reflectionQuestions: [
      'Co Cię w tym tknęło?',
      'Czy świadomie chcesz to wzmocnić?',
      'A może to tamten dzień był po prostu lepszy z innego powodu?',
    ],
  },

  // ─ 2. Wieczorna rutyna dnia D → poranny mood dnia D+1 ───────────────────
  {
    id: 'evening_routine_carryover',
    category: 'rutyna',
    shortLabel: 'Rutyna wieczorna a poranek następnego dnia',
    extract: (logs) => {
      const groupA: number[] = []  // wczoraj wieczorna rutyna
      const groupB: number[] = []
      for (const [key, log] of Object.entries(logs)) {
        const next = logs[nextDayKey(key)]
        if (!next) continue
        const fm = firstMood(next)
        if (fm === null) continue
        if (isEveningDone(log)) groupA.push(fm)
        else groupB.push(fm)
      }
      if (groupA.length === 0 && groupB.length === 0) return null
      return { test: 'mwu', groupA, groupB, labelA: 'po wieczorach z rutyną', labelB: 'po wieczorach bez rutyny' }
    },
    template: (r) => {
      const diff = Math.abs(r.facts.primary.value - r.facts.secondary!.value)
      const which = r.facts.primary.value > r.facts.secondary!.value ? 'wyższy' : 'niższy'
      return `Poranki po wieczorach z domkniętą rutyną wieczorną miały mood średnio o ${fmt(diff)} pkt ${which} (n=${r.n}, ${effectStrength(Math.abs(r.effectSize))} siła efektu). Wieczór dnia D zostawia ślad na poranku D+1 — przynajmniej w Twoich danych.`
    },
    reflectionQuestions: [
      'Który element wieczornej rutyny najmocniej Ci pomaga?',
      'Czy chcesz pielęgnować ten wzorzec?',
    ],
  },

  // ─ 3. Aktywność fizyczna → mood całego dnia ─────────────────────────────
  {
    id: 'physical_mood',
    category: 'aktywność',
    shortLabel: 'Ruch a nastrój dnia',
    extract: (logs) => {
      const groupA: number[] = []
      const groupB: number[] = []
      for (const log of Object.values(logs)) {
        const m = avgMood(log)
        if (m === null) continue
        if (log.physicalActivity) groupA.push(m)
        else groupB.push(m)
      }
      if (groupA.length === 0 && groupB.length === 0) return null
      return { test: 'mwu', groupA, groupB, labelA: 'dni z ruchem', labelB: 'dni bez ruchu' }
    },
    template: (r) => {
      const diff = Math.abs(r.facts.primary.value - r.facts.secondary!.value)
      const which = r.facts.primary.value > r.facts.secondary!.value ? 'wyższy' : 'niższy'
      return `W dniach z aktywnością fizyczną średni mood był o ${fmt(diff)} pkt ${which} (n=${r.n}). Effect size ${fmt(Math.abs(r.effectSize), 2)} — ${effectStrength(Math.abs(r.effectSize))}. Ruch i mood idą tu w parze; co jest pierwsze trudno powiedzieć.`
    },
    reflectionQuestions: [
      'Jaki rodzaj ruchu daje Ci najwięcej?',
      'Co by się musiało stać, żeby ruch był jeszcze częściej?',
    ],
  },

  // ─ 4. Obecność społeczna → mood całego dnia ─────────────────────────────
  {
    id: 'social_mood',
    category: 'aktywność',
    shortLabel: 'Kontakt z ludźmi a nastrój',
    extract: (logs) => {
      const groupA: number[] = []
      const groupB: number[] = []
      for (const log of Object.values(logs)) {
        const m = avgMood(log)
        if (m === null) continue
        if (log.socialPresence) groupA.push(m)
        else groupB.push(m)
      }
      if (groupA.length === 0 && groupB.length === 0) return null
      return { test: 'mwu', groupA, groupB, labelA: 'dni z kontaktem', labelB: 'dni bez kontaktu' }
    },
    template: (r) => {
      const diff = Math.abs(r.facts.primary.value - r.facts.secondary!.value)
      const which = r.facts.primary.value > r.facts.secondary!.value ? 'wyższy' : 'niższy'
      return `W dniach z obecnością społeczną mood był średnio o ${fmt(diff)} pkt ${which} (n=${r.n}, ${effectStrength(Math.abs(r.effectSize))} siła). Niektóre kobiety ładują się sama, inne ludźmi — co Ci dane mówią o Tobie?`
    },
    reflectionQuestions: [
      'Czy dane mówią o Tobie to, co czujesz?',
      'A może to nie *kontakt* w ogóle, ale *kontakt z konkretną osobą*?',
    ],
  },

  // ─ 5. Dzień tygodnia → mood ─────────────────────────────────────────────
  {
    id: 'dayofweek_mood',
    category: 'rytm',
    shortLabel: 'Dzień tygodnia a nastrój',
    extract: (logs) => {
      const groups: number[][] = [[],[],[],[],[],[],[]]
      for (const [key, log] of Object.entries(logs)) {
        const m = avgMood(log)
        if (m === null) continue
        const [y, mo, d] = key.split('-').map(Number)
        const dow = new Date(y, mo - 1, d).getDay()  // 0=Nd
        groups[dow].push(m)
      }
      const total = groups.reduce((s, g) => s + g.length, 0)
      if (total === 0) return null
      return {
        test: 'kruskal', groups,
        groupLabels: ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'],
      }
    },
    template: (r) => {
      const best = r.facts.primary
      const worst = r.facts.secondary!
      return `Wśród dni tygodnia ${best.label} miały najwyższy średni mood (${fmt(best.value)}), a ${worst.label} najniższy (${fmt(worst.value)}, n=${r.n} dni z check-inami). Effect size ε² = ${fmt(r.effectSize, 2)}. Może warto zaplanować ${worst.label} ostrożniej?`
    },
    reflectionQuestions: [
      'Czy to się zgadza z tym co czujesz?',
      'Co takiego jest w tym najsłabszym dniu?',
    ],
  },

  // ─ 6. Streak length → mood (Spearman) ───────────────────────────────────
  {
    id: 'streak_mood',
    category: 'rytm',
    shortLabel: 'Długość passy a nastrój',
    extract: (logs) => {
      // Liczba dni z rzędu liczona prowizorycznie z kluczy chronologicznie.
      const sortedKeys = Object.keys(logs).sort()
      const xs: number[] = []
      const ys: number[] = []
      let streak = 0
      let prevKey: string | null = null
      for (const key of sortedKeys) {
        const log = logs[key]
        const m = avgMood(log)
        if (prevKey === null) streak = 1
        else if (nextDayKey(prevKey) === key) streak += 1
        else streak = 1
        if (m !== null) { xs.push(streak); ys.push(m) }
        prevKey = key
      }
      if (xs.length === 0) return null
      return { test: 'spearman', xs, ys, xLabel: 'dzień passy', yLabel: 'średni mood' }
    },
    template: (r) => {
      const sign = r.effectSize > 0 ? 'rośnie' : 'spada'
      return `Wraz z dłuższą passą Twój średni mood ${sign} (ρ=${fmt(r.effectSize, 2)}, n=${r.n}, ${effectStrength(Math.abs(r.effectSize))} siła). To znaczy: Twoje ciało układa się w rytmie projektu.`
    },
    reflectionQuestions: [
      'Co się dzieje w Tobie po 14, 30, 50 dniach?',
      'Czy widzisz to po sobie z zewnątrz?',
    ],
  },

  // ─ 7. Liczba check-inów → ostatni mood dnia (Spearman) ──────────────────
  {
    id: 'checkin_count_last_mood',
    category: 'rytm',
    shortLabel: 'Częstotliwość check-inów a wieczorny nastrój',
    extract: (logs) => {
      const xs: number[] = []
      const ys: number[] = []
      for (const log of Object.values(logs)) {
        const ci = log.moodCheckIns ?? []
        if (ci.length === 0) continue
        const last = lastMood(log)
        if (last === null) continue
        xs.push(ci.length); ys.push(last)
      }
      if (xs.length === 0) return null
      return { test: 'spearman', xs, ys, xLabel: 'liczba check-inów', yLabel: 'mood ostatniego check-ina' }
    },
    template: (r) => {
      const sign = r.effectSize > 0 ? 'wyższy' : 'niższy'
      return `Im więcej check-inów w danym dniu, tym ${sign} mood ostatniego z nich (ρ=${fmt(r.effectSize, 2)}, n=${r.n}). Może to świadome wracanie do siebie pomaga; może to po prostu lepsze dni mają więcej powodów żeby się zatrzymać.`
    },
    reflectionQuestions: [
      'Wracasz do check-inów gdy jest dobrze, czy gdy zawodzi?',
      'Co byłoby gdybyś check-in robiła nawet w gorsze dni?',
    ],
  },

  // ─ 8. Tryb minimum dnia D → XP dnia D+1 (MWU) ──────────────────────────
  {
    id: 'minimum_day_next_xp',
    category: 'trudność',
    shortLabel: 'Dzień minimum a XP następnego dnia',
    extract: (logs) => {
      const groupA: number[] = []  // po dniu minimum
      const groupB: number[] = []
      for (const [key, log] of Object.entries(logs)) {
        const next = logs[nextDayKey(key)]
        if (!next) continue
        const xp = next.totalXP ?? 0
        if (log.dayMode === 'minimum') groupA.push(xp)
        else groupB.push(xp)
      }
      if (groupA.length === 0 && groupB.length === 0) return null
      return { test: 'mwu', groupA, groupB, labelA: 'po dniu minimum', labelB: 'po dniu normalnym' }
    },
    template: (r) => {
      const diff = Math.abs(r.facts.primary.value - r.facts.secondary!.value)
      const which = r.facts.primary.value > r.facts.secondary!.value ? 'więcej' : 'mniej'
      return `Po dniach w trybie minimum następny dzień miał średnio o ${fmt(diff, 0)} XP ${which} (n=${r.n}). Effect ${fmt(Math.abs(r.effectSize), 2)} — ${effectStrength(Math.abs(r.effectSize))}. Czy dzień minimum to dla Ciebie reset czy zapaść?`
    },
    reflectionQuestions: [
      'Co Ci się dzieje po dniu minimum?',
      'Czy minimum to świadomy wybór, czy poddanie się?',
    ],
  },

  // ─ 9. Ghost protokoły w tygodniu → XP w pozycja (Spearman per tydzień) ──
  {
    id: 'ghost_pillar_pozycja',
    category: 'trudność',
    shortLabel: 'Ghost protokoły a XP w "pozycja"',
    extract: (logs) => {
      // Aggregate per ISO week: count GP days vs sum totalXP (proxy for pillar pozycja since
      // we don't have per-pillar daily breakdown easily here — używamy totalXP).
      const weekly: Record<string, { gp: number; xp: number }> = {}
      for (const [key, log] of Object.entries(logs)) {
        const [y, m, d] = key.split('-').map(Number)
        const wk = getISOWeekKey(new Date(y, m - 1, d))
        if (!weekly[wk]) weekly[wk] = { gp: 0, xp: 0 }
        if (log.ghostProtocolCompleted) weekly[wk].gp += 1
        weekly[wk].xp += log.totalXP ?? 0
      }
      const xs: number[] = []
      const ys: number[] = []
      for (const wk of Object.values(weekly)) {
        xs.push(wk.gp); ys.push(wk.xp)
      }
      if (xs.length === 0) return null
      return { test: 'spearman', xs, ys, xLabel: 'ghost protokołów / tydzień', yLabel: 'XP w tygodniu' }
    },
    template: (r) => {
      const sign = r.effectSize > 0 ? 'rosną' : 'spadają'
      return `W tygodniach z większą liczbą ghost protokołów Twoje tygodniowe XP ${sign} (ρ=${fmt(r.effectSize, 2)}, n=${r.n} tygodni). Każdy GP to akt dyscypliny — i te tygodnie mówią o tym liczbą.`
    },
    reflectionQuestions: [
      'Co Cię dzisiaj zaskoczyło w tej liczbie?',
      'Co o Tobie mówi to, że *zauważasz* impuls?',
    ],
  },

  // ─ 10. Samotny weekend a Ghost Protocol ──────────────────────────────────
  {
    id: 'weekend_solo_ghost',
    category: 'trudność',
    shortLabel: 'Samotny weekend a Ghost Protocol',
    extract: (logs) => {
      // Grupa A: weekend bez kontaktu społecznego.
      // Grupa B: pozostałe dni (poniedziałek-piątek, lub weekend z kontaktem).
      // Zmienna: ghostProtocolCompleted jako 0/1.
      const groupA: number[] = []
      const groupB: number[] = []
      for (const [key, log] of Object.entries(logs)) {
        const [y, m, d] = key.split('-').map(Number)
        const dow = new Date(y, m - 1, d).getDay()  // 0=Nd, 6=Sob
        const isWeekend = dow === 0 || dow === 6
        const isSolo = log.socialPresence === false
        const gp = log.ghostProtocolCompleted ? 1 : 0
        if (isWeekend && isSolo) groupA.push(gp)
        else groupB.push(gp)
      }
      if (groupA.length === 0 || groupB.length === 0) return null
      return {
        test: 'mwu',
        groupA,
        groupB,
        labelA: 'samotne weekendy',
        labelB: 'pozostałe dni',
      }
    },
    template: (r) => {
      const pctA = Math.round(r.facts.primary.value * 100)
      const pctB = Math.round(r.facts.secondary!.value * 100)
      const which = pctA > pctB ? 'częściej' : 'rzadziej'
      return `W samotne weekendy Ghost Protocol aktywował się ${which} niż w pozostałe dni (${pctA}% vs ${pctB}%, n=${r.n}). Effect ${fmt(Math.abs(r.effectSize), 2)} — ${effectStrength(Math.abs(r.effectSize))}. Wzorzec z maja (4 z 6 aktywacji w oknie samotny weekend / okres) zgadza się ze statystyką, czy nie?`
    },
    reflectionQuestions: [
      'Co się dzieje z Tobą w sobotę wieczorem, kiedy nikt nie pisze?',
      'Czy umawiasz weekendy z wyprzedzeniem, czy improwizujesz?',
      'A co jeśli "samotny weekend" to nie problem, tylko zaproszenie do choreografii?',
    ],
  },
]
