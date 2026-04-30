import type { RoutineItem } from '@/types'
import { PROJECT_START, getISOWeekKey } from './gameLogic'

// ─── WERSJA NORMALNA ───────────────────────────────────────────

export const MORNING_ROUTINE: RoutineItem[] = [
  { id: 'm1', text: 'Po wstaniu 30 minut bez telefonu', type: 'morning', xp: 10, priority: 'normal',   category: 'mental'    },
  { id: 'm2', text: 'Krótka modlitwa poranna',          type: 'morning', xp: 10, priority: 'essential', category: 'spiritual' },
  { id: 'm3', text: 'Wypicie ciepłej wody',             type: 'morning', xp: 10, priority: 'essential', category: 'hygiene'   },
  { id: 'm4', text: '2 minuty oddechu',                 type: 'morning', xp: 10, priority: 'normal',   category: 'mental'    },
  { id: 'm5', text: '5–10 minut medytacji',             type: 'morning', xp: 10, priority: 'normal',   category: 'mental'    },
  { id: 'm6', text: 'Afirmacja',                        type: 'morning', xp: 10, priority: 'normal',   category: 'mental'    },
  { id: 'm7', text: 'Zadbanie o twarz',                 type: 'morning', xp: 10, priority: 'normal',   category: 'hygiene'   },
  { id: 'm8', text: 'Umycie zębów + nitkowanie',        type: 'morning', xp: 10, priority: 'essential', category: 'hygiene'   },
  { id: 'm9', text: 'Witaminy + witamina C',            type: 'morning', xp: 10, priority: 'essential', category: 'hygiene'   },
]

export const EVENING_ROUTINE: RoutineItem[] = [
  { id: 'e1', text: '30 minut bez telefonu przed snem',          type: 'evening', xp: 10, priority: 'normal',   category: 'mental'    },
  { id: 'e2', text: 'Zadbanie o twarz',                          type: 'evening', xp: 10, priority: 'normal',   category: 'hygiene'   },
  { id: 'e3', text: 'Umycie zębów',                              type: 'evening', xp: 10, priority: 'essential', category: 'hygiene'   },
  { id: 'e4', text: '3 rzeczy, z których jestem dumna tego dnia', type: 'evening', xp: 10, priority: 'normal',   category: 'spiritual' },
  { id: 'e5', text: 'Krótka modlitwa wieczorna',                 type: 'evening', xp: 10, priority: 'essential', category: 'spiritual' },
  { id: 'e6', text: 'Opcjonalnie: 5 minut czytania',             type: 'evening', xp: 10, priority: 'bonus',    category: 'mental'    },
  { id: 'e7', text: 'Magnez + duloksetyna',                      type: 'evening', xp: 10, priority: 'essential', category: 'hygiene'   },
]

// Tylko dni robocze (pon–pt)
export const DAILY_HABITS: RoutineItem[] = [
  { id: 'd1', text: '30 minut przy biurku', type: 'daily', xp: 10, priority: 'normal',   category: 'mental'    },
  { id: 'd2', text: 'Zadbanie o paznokcie', type: 'daily', xp: 10, priority: 'normal',   category: 'hygiene'   },
  { id: 'd3', text: 'Czytanie Biblii',      type: 'daily', xp: 10, priority: 'normal',   category: 'spiritual' },
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
    { id: 'w1_6', text: 'Uporządkuj powiadomienia', type: 'daily', xp: 10 },
  ],
  2: [ // Wtorek
    { id: 'w2_1', text: 'ELSA aplikacja', type: 'daily', xp: 10 },
    { id: 'w2_2', text: 'Full body stretch', type: 'daily', xp: 10 },
    { id: 'w2_3', text: 'Karteczka do losowania', type: 'daily', xp: 10 },
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
    { id: 'w4_3', text: 'Zadaj sobie pytanie', type: 'daily', xp: 10 },
  ],
  5: [ // Piątek
    { id: 'w5_1', text: 'Both minis', type: 'daily', xp: 10 },
    { id: 'w5_2', text: 'Timesheet', type: 'daily', xp: 10 },
    { id: 'w5_3', text: 'Uporządkuj notatki', type: 'daily', xp: 10 },
  ],
  6: [], // Sobota — brak
}

// Co drugi wtorek: ćwiczenia na kolana
export const BIWEEKLY_TUESDAY: RoutineItem = {
  id: 'w2_knee', text: 'Ćwiczenia na kolana (co drugi wtorek)', type: 'daily', xp: 10,
}

export function getTodayWeeklyHabits(forDate?: Date): RoutineItem[] {
  const now = forDate ?? new Date()
  const dow = now.getDay() // 0=nd ... 6=sb
  const base = WEEKLY_HABITS[dow] ?? []

  if (dow === 2) {
    // Co drugi wtorek — liczymy tygodnie od startu projektu
    const weeksSinceStart = Math.floor((now.getTime() - PROJECT_START.getTime()) / (7 * 24 * 60 * 60 * 1000))
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

// Przypięte iskry na konkretne daty (YYYY-MM-DD). Mają pierwszeństwo przed pulą.
export const PINNED_SPARKS: Record<string, string> = {
  '2026-04-06': 'Nie muszę być już na mecie. Wystarczy, że dziś zrobię jeden krok do siebie.',
  '2026-04-07': 'To, że jest mi ciężko, nie znaczy, że stoję w miejscu. Ja naprawdę się podnoszę.',
  '2026-04-08': 'Nie potrzebuję pośpiechu, żeby iść do przodu. Moje małe kroki też się liczą.',
  '2026-04-09': 'Wybieram siebie nawet wtedy, gdy serce wciąż tęskni za czymś innym.',
  '2026-04-10': 'Mogę być zmęczona, smutna i nadal iść dalej z godnością.',
  '2026-04-11': 'Jestem bliżej siebie niż tydzień temu i to naprawdę ma znaczenie.',
  // Tydzień 13–19 kwietnia
  '2026-04-13': 'Zbieram siebie na nowy tydzień.',
  '2026-04-14': 'Wracam do rytmu, nie do chaosu.',
  '2026-04-15': 'Robię swoje, nawet jeśli nie wszystko jest lekkie.',
  '2026-04-16': 'Wybieram to, co mnie wzmacnia.',
  '2026-04-17': 'Nie muszę być w idealnym stanie, żeby iść do przodu.',
  '2026-04-18': 'Daję sobie trochę życia, nie tylko obowiązków.',
  '2026-04-19': 'Domykam tydzień z czułością i spokojem.',
  // Tydzień 20–26 kwietnia
  '2026-04-20': 'Nie muszę dziś być silna przez cały czas. Wystarczy, że będę po swojej stronie.',
  '2026-04-21': 'Mój ból jest prawdziwy, ale nie musi prowadzić całego mojego dnia.',
  '2026-04-22': 'Nawet mały krok w stronę siebie dalej jest krokiem do przodu.',
  '2026-04-23': 'Mogę tęsknić i jednocześnie wybierać to, co mnie chroni.',
  '2026-04-24': 'Nie porzucam siebie tylko dlatego, że jest mi trudno.',
  '2026-04-25': 'Daję sobie dziś więcej czułości, mniej presji i mniej walki ze sobą.',
  '2026-04-26': 'Przetrwałam kolejny tydzień i nadal mogę łagodnie wracać do siebie.',
}

// ─── TEMAT TYGODNIA (rotacja co 7 dni) ────────────────────────
// Cykl: Filozofia → Sztuka → Historia → Ekonomia i polityka → od nowa

const WEEKLY_STUDY_TOPICS = [
  { label: 'Filozofia',           prompt: 'Przeczytaj artykuł, obejrzyj wykład lub odcinek podcastu o filozofii.' },
  { label: 'Sztuka',              prompt: 'Poczytaj o artyście, obejrzyj film o sztuce lub odwiedź galerię online.' },
  { label: 'Historia',            prompt: 'Przeczytaj o wydarzeniu historycznym, postaci lub epoce, którą chcesz lepiej zrozumieć.' },
  { label: 'Ekonomia i polityka', prompt: 'Przeczytaj analizę ekonomiczną, artykuł o polityce lub obejrzyj dokument.' },
]

export function getWeeklyStudyItem(forDate?: Date): RoutineItem {
  const now = forDate ?? new Date()
  const weekKey = getISOWeekKey(now)
  const weeksSinceStart = Math.floor((now.getTime() - PROJECT_START.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const topic = WEEKLY_STUDY_TOPICS[((weeksSinceStart % WEEKLY_STUDY_TOPICS.length) + WEEKLY_STUDY_TOPICS.length) % WEEKLY_STUDY_TOPICS.length]
  return {
    id: `study_${weekKey}`,
    text: `${topic.label} — ${topic.prompt}`,
    type: 'daily',
    xp: 20,
  }
}

export function getWeeklyStudyLabel(forDate?: Date): string {
  const now = forDate ?? new Date()
  const weeksSinceStart = Math.floor((now.getTime() - PROJECT_START.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const topic = WEEKLY_STUDY_TOPICS[((weeksSinceStart % WEEKLY_STUDY_TOPICS.length) + WEEKLY_STUDY_TOPICS.length) % WEEKLY_STUDY_TOPICS.length]
  return topic.label
}

// ─── PIELĘGNACJA CERY ──────────────────────────────────────────

export const MORNING_SKINCARE_STEPS = [
  'mycie',
  'witamina C',
  'Toleriane',
  'SPF',
]

export const EVENING_SKINCARE: Record<number, { theme: string; steps: string[] }> = {
  1: { theme: 'oczyszczanie + balans',   steps: ['mycie', 'azelaic acid', 'Toleriane'] },
  2: { theme: 'anti-aging / wygładzenie', steps: ['mycie', 'retinoid', 'MoonCall'] },
  3: { theme: 'regeneracja',             steps: ['mycie', 'MoonCall'] },
  4: { theme: 'pory / czoło',            steps: ['mycie', 'BHA (tylko strefa T)', 'Toleriane'] },
  5: { theme: 'balans 2',                steps: ['mycie', 'azelaic acid', 'Toleriane'] },
  6: { theme: 'retinoid 2',              steps: ['mycie', 'retinoid', 'MoonCall'] },
  0: { theme: 'reset',                   steps: ['mycie', 'peeling enzymatyczny', 'Toleriane'] },
}

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
