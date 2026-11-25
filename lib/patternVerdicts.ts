// Werdykty „dźwigni" — wspólne dla zakładki Wzorce i Przeglądu w Analizach.
//
// Dźwignia = wgląd kierunkowy z lib/correlations (lift: wzrost nastroju/energii
// w ciągu dnia; carryover: wieczór → poranek). Tu tylko klasyfikacja i język:
// czy coś pomaga, działa odwrotnie, nie ma wyraźnego wpływu albo brak danych.
import type { LiftInsight, CarryoverInsight, CorrelationInsight } from './correlations'

export type Directional = LiftInsight | CarryoverInsight
export type Verdict = 'works' | 'weak' | 'reverse' | 'nodata'

export const LEVER_LABEL: Record<string, string> = {
  lift_morning_mood: 'Rutyna poranna',
  lift_low_start_routine: 'Rutyna po gorszym poranku',
  lift_activity_energy: 'Ruch',
  lift_social_mood: 'Kontakt z ludźmi',
  lift_sidequest_mood: 'Side quest',
  lift_rules_mood: 'Trzymanie zasad',
  lift_dailyquest_mood: 'Quest dnia',
  lift_cbt_mood: 'Praca z myślami',
  carryover_evening_morning: 'Wieczór z rutyną → poranek',
  carryover_evening_energy: 'Wieczór z rutyną → energia rano',
  carryover_activity_energy: 'Ruch wczoraj → energia rano',
  carryover_xp_energy: 'Mocny dzień → energia rano',
}

export function leverLabel(ins: Directional): string {
  return LEVER_LABEL[ins.id] ?? ins.title
}

export function isDirectional(i: CorrelationInsight): i is Directional {
  return i.type === 'lift' || i.type === 'carryover'
}

/** Różnica „z tym" − „bez tego" (pkt na skali 1–5); null gdy brak jednej z grup. */
export function dirDiff(ins: Directional): number | null {
  const w  = ins.type === 'lift' ? ins.withLift    : ins.withMorning
  const wo = ins.type === 'lift' ? ins.withoutLift : ins.withoutMorning
  if (w === null || wo === null) return null
  return w - wo
}

export function dirVerdict(ins: Directional): Verdict {
  if (!ins.hasEnoughData) return 'nodata'
  const d = dirDiff(ins)
  if (d === null) return 'nodata'
  const thr = ins.type === 'carryover' ? 0.15 : 0.2
  if (d > thr) return 'works'
  if (d < -thr) return 'reverse'
  return 'weak'
}

/** 0,4 — bez znaku, z polskim przecinkiem. */
export function fmtPts(v: number): string {
  return Math.abs(v).toFixed(1).replace('.', ',')
}

/**
 * Jedno zdanie zwykłym językiem: co się dzieje w dni „z tym" w porównaniu
 * z dniami „bez tego". Bez znaku liczby w środku zdania (żadnego „o +0,6 mniej").
 */
export function leverSentence(ins: Directional): string {
  const d = dirDiff(ins)
  if (d === null) return 'za mało danych do porównania.'
  const metric = ins.metric === 'mood' ? 'nastrój' : 'energia'
  const x = fmtPts(d)
  if (Math.abs(d) < 0.05) return `${metric} zmienia się tak samo jak w dni bez tego.`
  if (ins.type === 'lift') {
    return d > 0
      ? `w te dni ${metric} rośnie w ciągu dnia o ${x} pkt bardziej niż bez tego.`
      : `w te dni ${metric} rośnie w ciągu dnia o ${x} pkt mniej niż bez tego.`
  }
  const higher = ins.metric === 'mood' ? 'wyższy' : 'wyższa'
  const lower  = ins.metric === 'mood' ? 'niższy' : 'niższa'
  return `następnego ranka ${metric} jest średnio o ${x} pkt ${d > 0 ? higher : lower}.`
}

export interface LeverGroups {
  /** Wszystkie z danymi, od najsilniejszego efektu (|różnica|). */
  ranked: Directional[]
  works: Directional[]
  reverse: Directional[]
  weak: Directional[]
  noData: Directional[]
}

export function groupLevers(insights: CorrelationInsight[]): LeverGroups {
  const directional = insights.filter(isDirectional)
  const ranked = directional
    .filter(i => dirVerdict(i) !== 'nodata')
    .sort((a, b) => Math.abs(dirDiff(b) ?? 0) - Math.abs(dirDiff(a) ?? 0))
  return {
    ranked,
    works:   ranked.filter(i => dirVerdict(i) === 'works'),
    reverse: ranked.filter(i => dirVerdict(i) === 'reverse'),
    weak:    ranked.filter(i => dirVerdict(i) === 'weak'),
    noData:  directional.filter(i => dirVerdict(i) === 'nodata'),
  }
}
