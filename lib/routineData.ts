import type { RoutineItem } from '@/types'

export const MORNING_ROUTINE: RoutineItem[] = [
  { id: 'm1', text: 'Wstaję o wyznaczonej godzinie (bez snooze)', type: 'morning', xp: 10 },
  { id: 'm2', text: 'Szklanka wody przed kawą', type: 'morning', xp: 10 },
  { id: 'm3', text: 'Poranna pielęgnacja skóry (cleanser, serum, SPF)', type: 'morning', xp: 10 },
  { id: 'm4', text: 'Ruch poranny – minimum 10 min (spacer, stretching, ćwiczenia)', type: 'morning', xp: 10 },
  { id: 'm5', text: 'Ubieram się i wyglądam na wyjście (nawet w domu)', type: 'morning', xp: 10 },
  { id: 'm6', text: 'Przeglądam plan dnia – jedna rzecz dla przyszłej pozycji', type: 'morning', xp: 10 },
]

export const EVENING_ROUTINE: RoutineItem[] = [
  { id: 'e1', text: 'Demakijaż + wieczorna pielęgnacja (toner, serum, krem)', type: 'evening', xp: 10 },
  { id: 'e2', text: 'Odkładam telefon min. 30 min przed snem', type: 'evening', xp: 10 },
  { id: 'e3', text: 'Zapisuję 1 rzecz, z której jestem dziś dumna', type: 'evening', xp: 10 },
  { id: 'e4', text: 'Planuję jutro – jedna konkretna akcja dla projektu', type: 'evening', xp: 10 },
  { id: 'e5', text: 'Kłaść się spać o wyznaczonej porze', type: 'evening', xp: 10 },
]

export const DAILY_HABITS: RoutineItem[] = [
  { id: 'd1', text: 'Min. 20 min na świeżym powietrzu', type: 'daily', xp: 10 },
  { id: 'd2', text: 'Czytam min. 15 min (książka, artykuł, podcast)', type: 'daily', xp: 10 },
  { id: 'd3', text: 'Piję odpowiednią ilość wody', type: 'daily', xp: 10 },
]

export const NEGATIVE_RULES = [
  { id: 'r1', text: 'Nie napisałam impulsywnie do byłego', xp: 20 },
  { id: 'r2', text: 'Nie analizowałam jego lajków ani sygnałów', xp: 20 },
  { id: 'r3', text: 'Nie wydałam pieniędzy emocjonalnie', xp: 20 },
  { id: 'r4', text: 'Nie robiłam kilku rzeczy naraz bez planu', xp: 20 },
  { id: 'r5', text: 'Nie działałam z lęku ani z braku', xp: 20 },
]

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
