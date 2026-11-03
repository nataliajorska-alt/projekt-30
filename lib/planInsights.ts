// Wnioski do planu miesiąca z Twojej historii: kiedy questy naprawdę się
// domykają (faza cyklu, dzień tygodnia, gęstość dnia, filar), co pomijasz
// i dlaczego, nastrój w fazach, rytm ruchu, papierosy, ostatnia ceremonia.
// Wnioski idą w trzy miejsca: panel na /plan, sekcja promptu dla Claude
// i dopasowanie szkicu (DraftAdapt).

import { getPhaseIdForDate, type CycleLog, type CycleSettings } from './cycle-data'
import { getPillar } from './pillars'
import { PHASE_LABEL, type PhaseId } from './monthPlanner'
import type { QuestBook } from './seasonal/aprilData'
import type { QuestSkip } from '@/hooks/useAprilQuests'
import type { DailyLog, MonthlyReview, Pillar } from '@/types'

const LOOKBACK_DAYS = 150
const MIN_DAYS = 8      // minimalna próbka na kubełek dni
const MIN_QUESTS = 10   // minimalna próbka na kubełek questów
const WEEKDAY_FULL = ['niedziele', 'poniedziałki', 'wtorki', 'środy', 'czwartki', 'piątki', 'soboty']
const WEEKDAY_SHORT = ['nd', 'pn', 'wt', 'śr', 'czw', 'pt', 'sob']

export interface DraftAdapt {
  /** Sufit questów dziennie (domyślnie 3). */
  maxPerDay: 2 | 3
  /** Dzień tygodnia (0 = nd), który dostaje o jeden quest mniej. */
  lightWeekday: number | null
  /** Filar, który wypełniacze mają częściej podsuwać. */
  focusPillar: Pillar | null
}

export interface PlanInsights {
  /** Ile dni z planem wzięto pod uwagę. */
  daysAnalyzed: number
  overallRate: number | null
  /** Zdania do panelu „Co mówią Twoje dane". */
  lines: string[]
  /** Zmiany, które szkic wprowadza na podstawie danych (do pokazania pod przyciskiem). */
  adaptNotes: string[]
  adapt: DraftAdapt
  /** Gotowa sekcja do promptu dla Claude. */
  promptSection: string
}

interface Bucket { done: number; total: number }
const add = (m: Map<string, Bucket>, k: string, done: boolean) => {
  const b = m.get(k) ?? { done: 0, total: 0 }
  b.total++; if (done) b.done++
  m.set(k, b)
}
const rate = (b?: Bucket) => (b && b.total > 0 ? b.done / b.total : null)
const pct = (r: number) => `${Math.round(r * 100)}%`

function shift(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
function weekday(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export interface InsightInput {
  today: string
  logs: Record<string, DailyLog>
  completedIds: string[]
  skips: QuestSkip[]
  book: QuestBook
  cycleLogs: CycleLog[]
  cycleSettings: CycleSettings
  monthlyReviews: MonthlyReview[]
}

export function computePlanInsights(input: InsightInput): PlanInsights {
  const { today, logs, completedIds, skips, book, cycleLogs, cycleSettings, monthlyReviews } = input
  // Odhaczone „na zapas" z widoku Jutro lądują w logu dnia — liczą się jak ukończone.
  const completed = new Set([...completedIds, ...Object.values(logs).flatMap(l => l.completedDailyQuests ?? [])])
  const skipped = new Set(skips.map(s => s.questId))

  // Kubełki: questy (ukończone/wszystkie) i dni (≥ połowa questów domknięta).
  const byPhase = new Map<string, Bucket>()
  const byWeekdayDays = new Map<string, Bucket>()
  const byLoad = new Map<string, Bucket>()
  const byPillar = new Map<string, Bucket>()
  const byKind = new Map<string, Bucket>()
  let all: Bucket = { done: 0, total: 0 }
  let daysAnalyzed = 0

  for (let d = shift(today, -LOOKBACK_DAYS); d < today; d = shift(d, 1)) {
    // Tylko miesiące z prawdziwym planem — stałych propozycji wstecz nikt nie widział.
    if (!book.isPlannedMonth(d.slice(0, 7))) continue
    const qs = book.questsForDate(d)
    if (qs.length === 0) continue
    daysAnalyzed++
    const phase = cycleLogs.length > 0 ? getPhaseIdForDate(cycleLogs, d, cycleSettings) : null
    let dayDone = 0
    for (const q of qs) {
      const done = completed.has(q.id)
      if (done) dayDone++
      all = { done: all.done + (done ? 1 : 0), total: all.total + 1 }
      if (phase) add(byPhase, phase, done)
      add(byPillar, q.pillar, done)
      add(byKind, q.xp >= 100 ? 'projekt' : 'lekki', done)
    }
    add(byLoad, String(Math.min(qs.length, 3)), dayDone / qs.length >= 0.5)
    add(byWeekdayDays, String(weekday(d)), dayDone / qs.length >= 0.5)
  }

  const overallRate = rate(all)
  const lines: string[] = []
  const promptLines: string[] = []

  if (overallRate !== null && all.total >= MIN_QUESTS) {
    lines.push(`Domykasz ${pct(overallRate)} questów miesięcznych (${all.done} z ${all.total}, ostatnie ${daysAnalyzed} dni z planem).`)
  }

  // Fazy cyklu
  const phases = (['folikularna', 'owulacyjna', 'lutealna', 'menstruacja'] as PhaseId[])
    .map(id => ({ id, r: rate(byPhase.get(id)), n: byPhase.get(id)?.total ?? 0 }))
    .filter(p => p.r !== null && p.n >= MIN_QUESTS) as { id: PhaseId; r: number; n: number }[]
  if (phases.length >= 2) {
    const best = phases.reduce((a, b) => (b.r > a.r ? b : a))
    const worst = phases.reduce((a, b) => (b.r < a.r ? b : a))
    if (best.r - worst.r >= 0.1) {
      lines.push(`Najlepiej domykasz w fazie ${PHASE_LABEL[best.id]} (${pct(best.r)}), najsłabiej — ${PHASE_LABEL[worst.id]} (${pct(worst.r)}).`)
    }
    promptLines.push(`- domykanie questów wg fazy: ${phases.map(p => `${PHASE_LABEL[p.id]} ${pct(p.r)}`).join(', ')}`)
  }

  // Gęstość dnia
  const load2 = byLoad.get('2'), load3 = byLoad.get('3')
  let maxPerDay: 2 | 3 = 3
  if (load3 && load3.total >= MIN_DAYS) {
    const r3 = rate(load3)!, r2 = rate(load2)
    const line = `Dni z 3 questami domykasz w ${pct(r3)}${r2 !== null && load2!.total >= MIN_DAYS ? `, dni z 2 — w ${pct(r2)}` : ''}.`
    lines.push(line)
    promptLines.push(`- ${line.toLowerCase()}`)
    if (r3 < 0.5 && (r2 === null || r3 < r2 - 0.1)) maxPerDay = 2
  }

  // Dzień tygodnia
  let lightWeekday: number | null = null
  const dayRate = rate(Array.from(byWeekdayDays.values()).reduce((a, b) => ({ done: a.done + b.done, total: a.total + b.total }), { done: 0, total: 0 }))
  const weekdays = Array.from(byWeekdayDays.entries())
    .map(([k, b]) => ({ wd: Number(k), r: rate(b)!, n: b.total }))
    .filter(w => w.n >= 6)
  if (weekdays.length >= 4 && dayRate !== null) {
    const worst = weekdays.reduce((a, b) => (b.r < a.r ? b : a))
    const best = weekdays.reduce((a, b) => (b.r > a.r ? b : a))
    if (dayRate - worst.r >= 0.15) {
      lightWeekday = worst.wd
      lines.push(`Najtrudniejsze są ${WEEKDAY_FULL[worst.wd]} (${pct(worst.r)} dni domkniętych), najłatwiejsze — ${WEEKDAY_FULL[best.wd]} (${pct(best.r)}).`)
    }
    promptLines.push(`- dni domknięte (≥ połowa questów) wg dnia tygodnia: ${weekdays.sort((a, b) => ((a.wd + 6) % 7) - ((b.wd + 6) % 7)).map(w => `${WEEKDAY_SHORT[w.wd]} ${pct(w.r)}`).join(', ')}`)
  }

  // Projekty vs lekkie
  const proj = byKind.get('projekt'), light = byKind.get('lekki')
  if (proj && proj.total >= MIN_QUESTS && light && light.total >= MIN_QUESTS) {
    const line = `„Projekty" (100+ XP) domykasz w ${pct(rate(proj)!)}, lekkie questy w ${pct(rate(light)!)}.`
    lines.push(line)
    promptLines.push(`- ${line.charAt(0).toLowerCase()}${line.slice(1)}`)
  }

  // Filary — z ostatniej ceremonii (Twoja ocena) albo z domykania.
  const lastReview = [...monthlyReviews].sort((a, b) => b.month.localeCompare(a.month))[0]
  let focusPillar: Pillar | null = null
  const rated = lastReview?.pillarsRated
    ? (Object.entries(lastReview.pillarsRated) as [Pillar, number][]).filter(([, v]) => typeof v === 'number' && v > 0)
    : []
  if (rated.length >= 3) {
    const [low, lowV] = rated.reduce((a, b) => (b[1] < a[1] ? b : a))
    focusPillar = low
    lines.push(`W ceremonii ${lastReview!.month} najniżej oceniłaś filar ${getPillar(low).name} (${lowV}/5).`)
    promptLines.push(`- oceny filarów z ostatniej ceremonii (${lastReview!.month}, /5): ${rated.map(([p, v]) => `${getPillar(p).shortName} ${v}`).join(', ')}`)
  }
  const pillars = Array.from(byPillar.entries())
    .map(([p, b]) => ({ p: p as Pillar, r: rate(b)!, n: b.total }))
    .filter(x => x.n >= MIN_QUESTS)
  if (pillars.length >= 3) {
    const worst = pillars.reduce((a, b) => (b.r < a.r ? b : a))
    const best = pillars.reduce((a, b) => (b.r > a.r ? b : a))
    if (!focusPillar) focusPillar = worst.p
    if (best.r - worst.r >= 0.15) {
      lines.push(`Filar ${getPillar(best.p).shortName} domyka się najłatwiej (${pct(best.r)}), ${getPillar(worst.p).shortName} najtrudniej (${pct(worst.r)}).`)
    }
    promptLines.push(`- domykanie wg filaru: ${pillars.map(x => `${getPillar(x.p).shortName} ${pct(x.r)}`).join(', ')}`)
  }

  // Nastrój i energia w fazach
  if (cycleLogs.length > 0) {
    const mood = new Map<PhaseId, { e: number; m: number; n: number }>()
    for (let d = shift(today, -LOOKBACK_DAYS); d < today; d = shift(d, 1)) {
      const cis = logs[d]?.moodCheckIns ?? []
      if (cis.length === 0) continue
      const ph = getPhaseIdForDate(cycleLogs, d, cycleSettings)
      if (!ph) continue
      const acc = mood.get(ph) ?? { e: 0, m: 0, n: 0 }
      for (const ci of cis) { acc.e += ci.energy; acc.m += ci.mood; acc.n++ }
      mood.set(ph, acc)
    }
    const rows = Array.from(mood.entries()).filter(([, v]) => v.n >= 5)
    if (rows.length >= 2) {
      const fmt = (x: number) => x.toFixed(1).replace('.', ',')
      const lowE = rows.reduce((a, b) => (b[1].e / b[1].n < a[1].e / a[1].n ? b : a))
      lines.push(`Energia jest najniższa w fazie ${PHASE_LABEL[lowE[0]]}: średnio ${fmt(lowE[1].e / lowE[1].n)}/5.`)
      promptLines.push(`- energia/nastrój wg fazy (/5): ${rows.map(([p, v]) => `${PHASE_LABEL[p]} ${fmt(v.e / v.n)}/${fmt(v.m / v.n)}`).join(', ')}`)
    }
  }

  // Ruch — ostatnie 8 tygodni
  let activeDays = 0, loggedDays = 0
  for (let d = shift(today, -56); d < today; d = shift(d, 1)) {
    if (!logs[d]) continue
    loggedDays++
    if (logs[d].physicalActivity) activeDays++
  }
  if (loggedDays >= 14) {
    const perWeek = (activeDays / 8).toFixed(1).replace('.', ',')
    const line = `Aktywność fizyczna: średnio ${perWeek} dnia w tygodniu (ostatnie 8 tygodni, cel 3).`
    lines.push(line)
    promptLines.push(`- ${line.charAt(0).toLowerCase()}${line.slice(1)}`)
  }

  // Papierosy — 14 dni vs poprzednie 14
  const cigs = (from: number, to: number) => {
    let sum = 0, n = 0
    for (let i = from; i < to; i++) {
      const l = logs[shift(today, -i - 1)]
      if (!l) continue
      n++; sum += l.cigarettes?.length ?? 0
    }
    return n >= 7 ? sum / n : null
  }
  const recent = cigs(0, 14), prior = cigs(14, 28)
  if (recent !== null && (recent > 0 || (prior ?? 0) > 0)) {
    const fmt = (x: number) => x.toFixed(1).replace('.', ',')
    const trend = prior === null ? '' : recent < prior - 0.3 ? `, w dół z ${fmt(prior)}` : recent > prior + 0.3 ? `, w górę z ${fmt(prior)}` : ', bez zmian'
    const line = `Papierosy: ${fmt(recent)} dziennie w ostatnich 14 dniach${trend}.`
    lines.push(line)
    promptLines.push(`- ${line.charAt(0).toLowerCase()}${line.slice(1)}`)
  }

  // Pominięcia — Twoje własne słowa
  const reasons = [...skips]
    .filter(s => s.reason?.trim())
    .sort((a, b) => b.skippedAt.localeCompare(a.skippedAt))
    .slice(0, 6)
    .map(s => `„${book.findQuest(s.questId)?.title ?? s.questId}" — ${s.reason.trim()}`)
  if (skipped.size > 0) {
    lines.push(`Pominęłaś ${skipped.size} questów; ostatnie powody są niżej w prompcie dla Claude.`)
  }
  if (reasons.length > 0) promptLines.push(`- ostatnie pominięcia (quest — mój powód):`, ...reasons.map(r => `  • ${r}`))

  // Ostatnia ceremonia — intencja i wyzwania
  if (lastReview) {
    if (lastReview.intentionNextMonth?.trim()) promptLines.push(`- moja intencja z ceremonii ${lastReview.month}: ${lastReview.intentionNextMonth.trim()}`)
    if (lastReview.challenges?.trim()) promptLines.push(`- wyzwania z ceremonii ${lastReview.month}: ${lastReview.challenges.trim()}`)
    if (lastReview.highlights?.trim()) promptLines.push(`- co działało (${lastReview.month}): ${lastReview.highlights.trim()}`)
  }

  const adapt: DraftAdapt = { maxPerDay, lightWeekday, focusPillar }
  const adaptNotes: string[] = []
  if (maxPerDay === 2) adaptNotes.push('maksymalnie 2 questy dziennie — dni z trzema rzadko się domykają')
  if (lightWeekday !== null) adaptNotes.push(`${WEEKDAY_FULL[lightWeekday]} o jeden quest lżejsze`)
  if (focusPillar) adaptNotes.push(`wypełniacze częściej z filaru ${getPillar(focusPillar).shortName}`)

  const promptSection = promptLines.length > 0
    ? ['Co mówią moje dane z apki (uwzględnij przy gęstości i doborze questów):', ...promptLines].join('\n')
    : ''

  return { daysAnalyzed, overallRate, lines, adaptNotes, adapt, promptSection }
}
