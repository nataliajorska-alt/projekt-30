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
]

export const EVENING_ROUTINE: RoutineItem[] = [
  { id: 'e1', text: '30 minut bez telefonu przed snem', type: 'evening', xp: 10 },
  { id: 'e2', text: 'Zadbanie o twarz', type: 'evening', xp: 10 },
  { id: 'e3', text: 'Umycie zębów', type: 'evening', xp: 10 },
  { id: 'e4', text: '3 rzeczy, z których jestem dumna tego dnia', type: 'evening', xp: 10 },
  { id: 'e5', text: 'Krótka modlitwa wieczorna', type: 'evening', xp: 10 },
  { id: 'e6', text: 'Opcjonalnie: 5 minut czytania', type: 'evening', xp: 10 },
]

export const DAILY_HABITS: RoutineItem[] = [
  { id: 'd1', text: 'Min. 20 min na świeżym powietrzu', type: 'daily', xp: 10 },
  { id: 'd2', text: 'Czytam min. 15 min', type: 'daily', xp: 10 },
  { id: 'd3', text: 'Piję odpowiednią ilość wody', type: 'daily', xp: 10 },
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

// ─── ZASADY ────────────────────────────────────────────────────

export const NEGATIVE_RULES = [
  { id: 'r1', text: 'Nie napisałam impulsywnie do byłego', xp: 20 },
  { id: 'r2', text: 'Nie analizowałam jego lajków ani sygnałów', xp: 20 },
  { id: 'r3', text: 'Nie wydałam pieniędzy emocjonalnie', xp: 20 },
  { id: 'r4', text: 'Nie robiłam kilku rzeczy naraz bez planu', xp: 20 },
  { id: 'r5', text: 'Nie działałam z lęku ani z braku', xp: 20 },
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
