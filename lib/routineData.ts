import type { RoutineItem } from '@/types'

// ─── WERSJA NORMALNA ───────────────────────────────────────────

export const MORNING_ROUTINE: RoutineItem[] = [
  { id: 'm1', text: 'Po wstaniu 30 minut bez telefonu', type: 'morning', xp: 10 },
  { id: 'm2', text: 'Krótka modlitwa poranna', type: 'morning', xp: 10 },
  { id: 'm3', text: 'Wypicie ciepłej wody', type: 'morning', xp: 10 },
  { id: 'm4', text: '2 minuty oddechu', type: 'morning', xp: 10 },
  { id: 'm5', text: '5–10 minut medytacji', type: 'morning', xp: 10 },
  { id: 'm6', text: 'Afirmacja', type: 'morning', xp: 10 },
  { id: 'm7', text: 'Zadbanie o twarz', type: 'morning', xp: 10 },
  { id: 'm8', text: 'Umycie zębów + nitkowanie', type: 'morning', xp: 10 },
  { id: 'm9', text: 'Witaminy + witamina C', type: 'morning', xp: 10 },
]

export const EVENING_ROUTINE: RoutineItem[] = [
  { id: 'e1', text: '30 minut bez telefonu przed snem', type: 'evening', xp: 10 },
  { id: 'e2', text: 'Zadbanie o twarz', type: 'evening', xp: 10 },
  { id: 'e3', text: 'Umycie zębów', type: 'evening', xp: 10 },
  { id: 'e4', text: '3 rzeczy, z których jestem dumna tego dnia', type: 'evening', xp: 10 },
  { id: 'e5', text: 'Krótka modlitwa wieczorna', type: 'evening', xp: 10 },
  { id: 'e6', text: 'Opcjonalnie: 5 minut czytania', type: 'evening', xp: 10 },
  { id: 'e7', text: 'Magnez + duloksetyna', type: 'evening', xp: 10 },
]

// Tylko dni robocze (pon–pt)
export const DAILY_HABITS: RoutineItem[] = [
  { id: 'd1', text: '30 minut przy biurku', type: 'daily', xp: 10 },
  { id: 'd2', text: 'Zadbanie o paznokcie', type: 'daily', xp: 10 },
]

// ─── WERSJA MINIMUM ────────────────────────────────────────────
// Gdy jesteś chora, zmęczona, w podróży, po ciężkim dniu.
// Nie ma być piękne. Ma być wykonalne.

export const MORNING_MINIMUM: RoutineItem[] = [
  { id: 'mm1', text: 'Znak krzyża', type: 'morning', xp: 10 },
  { id: 'mm2', text: 'Kilka łyków ciepłej albo zwykłej wody', type: 'morning', xp: 10 },
  { id: 'mm3', text: 'Umycie zębów i twarzy', type: 'morning', xp: 10 },
]

export const EVENING_MINIMUM: RoutineItem[] = [
  { id: 'em1', text: 'Myję twarz i zęby', type: 'evening', xp: 10 },
  { id: 'em2', text: 'Wymieniam 1 rzecz, z której jestem dumna', type: 'evening', xp: 10 },
  { id: 'em3', text: 'Znak krzyża', type: 'evening', xp: 10 },
]

// ─── TYGODNIOWE (dzień tygodnia: 0=nd, 1=pn, 2=wt, 3=śr, 4=cz, 5=pt, 6=sb) ──

export const WEEKLY_HABITS: Record<number, RoutineItem[]> = {
  0: [ // Niedziela
    { id: 'w0_1', text: 'Kościół — msza', type: 'daily', xp: 10 },
  ],
  1: [ // Poniedziałek
    { id: 'w1_1', text: 'Ćw. od fizjo', type: 'daily', xp: 10 },
    { id: 'w1_2', text: 'Leg warm-up', type: 'daily', xp: 10 },
    { id: 'w1_3', text: 'Duolingo ×3', type: 'daily', xp: 10 },
    { id: 'w1_4', text: 'Książka — hiszpański', type: 'daily', xp: 10 },
    { id: 'w1_5', text: 'Dieta — ustalić posiłki na tydzień', type: 'daily', xp: 10 },
  ],
  2: [ // Wtorek
    { id: 'w2_1', text: 'ELSA aplikacja', type: 'daily', xp: 10 },
    { id: 'w2_2', text: 'Full body stretch', type: 'daily', xp: 10 },
  ],
  3: [ // Środa
    { id: 'w3_1', text: 'Ćw. od fizjo', type: 'daily', xp: 10 },
    { id: 'w3_2', text: 'Pre-back', type: 'daily', xp: 10 },
    { id: 'w3_3', text: 'Duolingo ×3', type: 'daily', xp: 10 },
    { id: 'w3_4', text: 'ELSA aplikacja', type: 'daily', xp: 10 },
    { id: 'w3_5', text: 'Podlewanie', type: 'daily', xp: 10 },
  ],
  4: [ // Czwartek
    { id: 'w4_1', text: 'Ćw. core', type: 'daily', xp: 10 },
    { id: 'w4_2', text: 'Post-back', type: 'daily', xp: 10 },
  ],
  5: [ // Piątek
    { id: 'w5_1', text: 'Both minis', type: 'daily', xp: 10 },
    { id: 'w5_2', text: 'Timesheet', type: 'daily', xp: 10 },
  ],
  6: [], // Sobota — brak
}

// Co drugi wtorek: ćwiczenia na kolana
export const BIWEEKLY_TUESDAY: RoutineItem = {
  id: 'w2_knee', text: 'Ćwiczenia na kolana (co drugi wtorek)', type: 'daily', xp: 10,
}

export function getTodayWeeklyHabits(): RoutineItem[] {
  const now = new Date()
  const dow = now.getDay() // 0=nd ... 6=sb
  const base = WEEKLY_HABITS[dow] ?? []

  if (dow === 2) {
    // Co drugi wtorek — liczymy tygodnie od startu projektu
    const start = new Date('2026-04-05')
    const weeksSinceStart = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
    if (weeksSinceStart % 2 === 0) return [...base, BIWEEKLY_TUESDAY]
  }

  return base
}

// ─── ZASADY ────────────────────────────────────────────────────

export const DAILY_RULES = [
  { id: 'r1', text: 'Nie pisałam do byłego', xp: 20 },
  { id: 'r2', text: 'Zrobiłam coś dla swojej przyszłości', xp: 20 },
  { id: 'r3', text: 'Zadbałam o wygląd i prezencję', xp: 20 },
]

// ─── ISKRY DNIA ────────────────────────────────────────────────

export const DAILY_SPARKS = [
  'Nie gonię za tym, co mnie nie chce. Buduję coś, po co będą przychodziły.',
  'Spokój jest moją luksusową cechą, nie słabością.',
  'Moje życie to projekt, nie improwizacja.',
  'Klasa to milczenie, gdy inni krzyczą. Działanie, gdy inni biadolą.',
  'Buduję kobietę, którą będę zapamiętana jako. To zajmuje czas.',
  'Nie muszę udowadniać niczego nikomu. Moje czyny mówią za mnie.',
  'Każdy poranek to inna okazja, by wybrać siebie.',
  'Elegancja to wewnętrzna decyzja, nie cena metek.',
  'Im mniej tłumaczę, tym więcej ważę.',
  'Mój czas uwagi jest walutą. Inwestuję go mądrze.',
  'Nie jestem dla każdego. Jestem dla wybranych.',
  'Kobiety z klasą nie ścigają — są śledzone.',
  'Cierpliwość jest bronią inteligentnych.',
  'Transformacja to codzienna praktyka, nie jednorazowe postanowienie.',
  'Zamiast pytać czy ktoś mnie kocha, pytam: czy ta relacja mnie buduje?',
  'Moje granice nie są atakiem. Są definicją mojej wartości.',
  'Nie wracam do miejsc, które mnie opuściły.',
  'Lepiej być wolną i sobą, niż zniewolona przez kogoś.',
  'Pieniądze, pozycja, spokój — to buduje się decyzja po decyzji.',
  'Magnetyzm to efekt uboczny bycia naprawdę sobą.',
]
