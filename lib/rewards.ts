// Silnik nagród — natychmiastowy feedback pod ADHD: każde odhaczenie daje
// widoczne +XP, kolejne odhaczenia w krótkim odstępie budują „rozpęd",
// a co któreś trafia losowe „znalezisko" (zmienny harmonogram nagród —
// najmocniejszy dopaminowo). Pierwsze otwarcie dnia: pieczęć do złamania.
//
// Losowanie jest DETERMINISTYCZNE (hash daty i id), a każda nagroda ma swoje
// id w logu dnia (rewardsClaimed) — odznaczenie i ponowne odhaczenie tej samej
// rzeczy nie losuje drugi raz i nie nalicza XP podwójnie.

import { DAILY_SPARKS } from './routineData'
import type { FocusItem } from './todayPlan'

// ── Losowość z ziarnem ───────────────────────────────────────────────

/** FNV-1a → [0, 1). Ten sam tekst zawsze daje tę samą liczbę. */
export function seededRandom(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

// ── Rozpęd (combo) ───────────────────────────────────────────────────

/** Ile czasu między odhaczeniami, żeby rozpęd nie wygasł. */
export const COMBO_WINDOW_MS = 4 * 60 * 1000

export const COMBO_MILESTONES: { n: number; xp: number; title: string }[] = [
  { n: 3, xp: 10, title: 'Rozpęd' },
  { n: 5, xp: 20, title: 'Płyniesz' },
  { n: 8, xp: 40, title: 'Nie do zatrzymania' },
]

export interface ComboState {
  /** Unikalne id odhaczone w tej serii — ponowne odhaczenie tego samego nie podbija licznika. */
  ids: string[]
  lastAt: number
}

export const EMPTY_COMBO: ComboState = { ids: [], lastAt: 0 }

export function comboCount(state: ComboState, now: number): number {
  return now - state.lastAt <= COMBO_WINDOW_MS ? state.ids.length : 0
}

export function nextCombo(state: ComboState, id: string, now: number): ComboState {
  const alive = now - state.lastAt <= COMBO_WINDOW_MS
  const ids = alive ? state.ids : []
  return { ids: ids.includes(id) ? ids : [...ids, id], lastAt: now }
}

/** Kamień milowy osiągnięty dokładnie tym odhaczeniem (albo null). */
export function comboMilestone(prev: number, next: number) {
  return COMBO_MILESTONES.find(m => prev < m.n && next >= m.n) ?? null
}

export const comboRewardId = (dateKey: string, n: number) => `combo${n}_${dateKey}`

/** Wysokość dźwięku: pentatonika w górę z każdym krokiem rozpędu. */
export function comboFrequency(step: number): number {
  const PENTA = [0, 2, 4, 7, 9]
  const s = Math.max(0, step - 1)
  const semitones = PENTA[s % 5] + 12 * Math.floor(s / 5)
  return 523.25 * Math.pow(2, Math.min(semitones, 24) / 12) // od C5, max dwie oktawy
}

// ── Znaleziska (loot) ────────────────────────────────────────────────

export type Rarity = 'zwykle' | 'rzadkie' | 'legendarne'

export const LOOT_CHANCE = 0.18
export const LOOT_DAILY_CAP = 5

export const RARITY_META: Record<Rarity, { label: string; xp: number; names: string[] }> = {
  zwykle:     { label: 'znalezisko',              xp: 10, names: ['Złoty liść', 'Iskra', 'Pióro', 'Muszelka'] },
  rzadkie:    { label: 'rzadkie znalezisko',      xp: 25, names: ['Perła', 'Złoty klucz', 'Bursztyn', 'Róża w laku'] },
  legendarne: { label: 'legendarne znalezisko',   xp: 75, names: ['Korona', 'Gwiazda polarna', 'Złote runo'] },
}

export interface Loot {
  rewardId: string
  rarity: Rarity
  name: string
  line: string
  xp: number
}

export const lootRewardId = (dateKey: string, id: string) => `loot_${dateKey}_${id}`

export function countClaimed(claimed: string[] | undefined, prefix: string): number {
  return (claimed ?? []).filter(c => c.startsWith(prefix)).length
}

/**
 * Czy to odhaczenie coś „wyrzuca". ~18% szans, w tym 25% rzadkich i 5%
 * legendarnych; najwyżej 5 znalezisk dziennie. Wynik zależy tylko od daty
 * i id, więc nie da się go „przelosować" odznaczając rzecz.
 */
export function rollLoot(dateKey: string, id: string, claimed: string[] | undefined): Loot | null {
  const rewardId = lootRewardId(dateKey, id)
  if ((claimed ?? []).includes(rewardId)) return null
  if (countClaimed(claimed, `loot_${dateKey}_`) >= LOOT_DAILY_CAP) return null
  if (seededRandom(`drop|${dateKey}|${id}`) >= LOOT_CHANCE) return null
  const r = seededRandom(`rarity|${dateKey}|${id}`)
  const rarity: Rarity = r < 0.05 ? 'legendarne' : r < 0.30 ? 'rzadkie' : 'zwykle'
  const meta = RARITY_META[rarity]
  const name = meta.names[Math.floor(seededRandom(`name|${dateKey}|${id}`) * meta.names.length)]
  const line = DAILY_SPARKS[Math.floor(seededRandom(`line|${dateKey}|${id}`) * DAILY_SPARKS.length)]
  return { rewardId, rarity, name, line, xp: meta.xp }
}

// ── Pieczęć dnia ─────────────────────────────────────────────────────

export const sealRewardId = (dateKey: string) => `seal_${dateKey}`

/** XP z pieczęci: 10 (50%), 20 (30%), 40 (15%), 100 — złota pieczęć (5%). */
export function rollSeal(dateKey: string): { xp: number; golden: boolean } {
  const r = seededRandom(`seal|${dateKey}`)
  const xp = r < 0.5 ? 10 : r < 0.8 ? 20 : r < 0.95 ? 40 : 100
  return { xp, golden: xp === 100 }
}

// Pod pieczęcią — mała przyjemność na dziś (nowość co dzień, zero presji).
export const DAILY_JOYS = [
  'Wypij pierwszą kawę bez telefonu, przy oknie.',
  'Puść jedną piosenkę, którą kochasz — i nie rób przy niej nic innego.',
  'Kup sobie jeden kwiat.',
  'Wyjdź na 10 minut na światło dnia.',
  'Napisz jedno zdanie do Skarbca.',
  'Załóż dziś to, w czym czujesz się najlepiej.',
  'Zrób jedno zdjęcie czegoś pięknego.',
  'Zjedz coś pysznego powoli, bez ekranu.',
  'Wyślij komuś bliskiemu jedną ciepłą wiadomość.',
  'Pięć minut rozciągania przy ulubionej muzyce.',
  'Zapal wieczorem świecę.',
  'Przeczytaj jedną stronę książki tylko dla przyjemności.',
  'Zrób herbatę w najładniejszym kubku, jaki masz.',
  'Posłuchaj ciszy przez dwie minuty.',
  'Pozwól sobie dziś na jedno spokojne „nie".',
  'Weź dłuższy prysznic niż zwykle.',
  'Wróć do domu inną trasą niż zwykle.',
  'Zapisz trzy rzeczy, które dziś były dobre.',
  'Ogarnij jedną małą półkę — tylko jedną.',
  'Zatańcz do jednej piosenki, nawet w kuchni.',
]

export function pickJoy(dateKey: string): string {
  return DAILY_JOYS[Math.floor(seededRandom(`joy|${dateKey}`) * DAILY_JOYS.length)]
}

// ── Kamienie milowe dnia ─────────────────────────────────────────────

export const DAY_MILESTONES = [50, 100] as const

/** Próg postępu dnia przekroczony między dwoma odczytami (albo null). */
export function crossedDayMilestone(prevPct: number, pct: number): 50 | 100 | null {
  for (const m of [...DAY_MILESTONES].reverse()) if (prevPct < m && pct >= m) return m
  return null
}

// ── Magistrala zdarzeń (tylko w przeglądarce) ────────────────────────

export interface RewardEvent {
  source: 'routine' | 'quest' | 'side' | 'rule'
  id: string
  xp: number
  /** Podgląd (/design-system, „Jedna rzecz" na przykładach): cały feedback, zero zapisu. */
  preview?: boolean
}
/** kicker — linijka nad tytułem (domyślnie „✦ ✦ ✦"). */
export interface CelebrateEvent { title: string; sub?: string; kicker?: string; big?: boolean }

/** focus.preview — przykładowa kolejka bez zapisu (podgląd w /design-system). */
type Events = { reward: RewardEvent; celebrate: CelebrateEvent; focus: { preview?: FocusItem[] } | undefined }
type Listener<K extends keyof Events> = (e: Events[K]) => void
const listeners: { [K in keyof Events]: Set<Listener<K>> } = {
  reward: new Set(), celebrate: new Set(), focus: new Set(),
}

export function emit<K extends keyof Events>(type: K, e: Events[K]): void {
  listeners[type].forEach(l => {
    try { (l as Listener<K>)(e) } catch { /* nagroda nie może wywrócić akcji */ }
  })
}

export function on<K extends keyof Events>(type: K, l: Listener<K>): () => void {
  listeners[type].add(l)
  return () => { listeners[type].delete(l) }
}

/** Otwiera tryb „Jedna rzecz" z dowolnego miejsca (dashboard, „+"). */
export const openFocus = () => emit('focus', undefined)

// Ostatni dotyk/klik — stąd wylatuje „+XP".
let lastPointer: { x: number; y: number; t: number } | null = null
export function trackPointer(x: number, y: number) { lastPointer = { x, y, t: Date.now() } }
export function recentPointer(maxAgeMs = 1500) {
  return lastPointer && Date.now() - lastPointer.t <= maxAgeMs ? lastPointer : null
}
