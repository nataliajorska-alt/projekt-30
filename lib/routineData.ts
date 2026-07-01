import type { RoutineItem } from '@/types'
import { PROJECT_START, getISOWeekKey, getEffectiveNow } from './gameLogic'

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
  { id: 'm9', text: 'Witaminy',                          type: 'morning', xp: 10, priority: 'essential', category: 'hygiene'   },
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
  { id: 'd1', text: 'Godzina przy biurku', type: 'daily', xp: 10, priority: 'normal',   category: 'mental'    },
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
    { id: 'w1_supp', text: 'Suplementy: Cynk 50 mg + Selen (przy obiedzie, z dala od kreatyny)', type: 'daily', xp: 10 },
    { id: 'w1_1', text: 'Ćw. od fizjo', type: 'daily', xp: 10, href: '/cwiczenia.html#fizjo' },
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
    { id: 'w3_1', text: 'Ćw. od fizjo', type: 'daily', xp: 10, href: '/cwiczenia.html#fizjo' },
    { id: 'w3_2', text: 'Pre-back', type: 'daily', xp: 10 },
    { id: 'w3_3', text: 'Duolingo ×3', type: 'daily', xp: 10 },
    { id: 'w3_4', text: 'ELSA aplikacja', type: 'daily', xp: 10 },
    { id: 'w3_5', text: 'Podlewanie', type: 'daily', xp: 10 },
  ],
  4: [ // Czwartek
    { id: 'w4_1', text: 'Ćw. core', type: 'daily', xp: 10, href: '/cwiczenia.html#core' },
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
  id: 'w2_knee', text: 'Ćwiczenia na kolana (co drugi wtorek)', type: 'daily', xp: 10, href: '/cwiczenia.html#kolana',
}

export function getTodayWeeklyHabits(forDate?: Date): RoutineItem[] {
  const now = forDate ?? getEffectiveNow()
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
  { id: 'r1', text: 'Nie wróciłam do starych wzorców', xp: 20 },
  { id: 'r2', text: 'Zrobiłam coś dla swojej przyszłości', xp: 20 },
  { id: 'r3', text: 'Zrobiłam jedną rzecz dla siebie, bez czekania na reakcję', xp: 20 },
]

// Mała pula podpowiedzi pod zasadę 3 — gdy nie wiesz, co zrobić dla siebie.
// Mały gest, nie wielki rytuał.
export const SOOTHING_SUGGESTIONS: string[] = [
  '10 minut spaceru bez celu',
  '5 minut oddechu, modlitwy albo ciszy',
  'Telefon odłożony 30 minut przed snem',
  'Wieczorna pielęgnacja bez scrolla',
  'Jedno zdanie journalingu: „Dziś ukoiło mnie…"',
  'Normalny posiłek zamiast chaosu',
  'Łagodny prysznic albo kąpiel',
  '10 minut rozciągania',
  'Rozmowa z kimś stabilnym',
  'Wcześniejsze pójście spać',
  'Minimum dnia zamiast karania się za brak perfekcji',
  'Cztery długie wydechy, świadomie',
  'Świeże powietrze przy otwartym oknie, 5 minut',
  'Gorąca herbata bez robienia niczego przy okazji',
  'Ulubiona piosenka, słuchana w pełni',
  'Zapalenie świecy i 10 minut ciszy',
  'Mały porządek w jednym miejscu — biurko, torba, łazienka',
  'Krótka modlitwa wieczorna',
  'Jedna strona książki zamiast feedu',
  'Powiedzenie sobie „Dziś już wystarczy" i odpoczynek',
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
  // ── MAJ 2026 — UKOJENIE ─────────────────────────────────────
  '2026-05-01': 'Wchodzę w maj bez pretensji do siebie. Kwiecień zrobił to, co umiał.',
  '2026-05-02': 'Moje ciało jest moim domem, nie projektem do naprawy.',
  '2026-05-03': 'Cisza też jest formą powrotu do siebie.',
  '2026-05-04': 'Mam ster, nawet jeśli wody są jeszcze niespokojne.',
  '2026-05-05': 'Buduję przyszłość, nie uciekam od przeszłości.',
  '2026-05-06': 'Spokojny wieczór jest aktem szacunku do siebie.',
  '2026-05-07': 'Buduję własny obieg, nie pukam do drzwi czyjegoś świata.',
  '2026-05-08': 'Karmię głowę czymś lepszym niż analiza ciszy.',
  '2026-05-09': 'Wchodzę w świat ze spokojem, nie z udowadnianiem.',
  '2026-05-10': 'Domykam tydzień bez przemocy wobec siebie.',
  '2026-05-11': 'Patrzę na liczby bez wstydu i bez paniki.',
  '2026-05-12': 'Każda wysłana wiadomość zawodowa to cegła w moim świecie.',
  '2026-05-13': 'Mój wygląd ma mi służyć, nie mną rządzić.',
  '2026-05-14': 'Nie gonię za cudzym środowiskiem. Buduję własne.',
  '2026-05-15': 'Mogę tęsknić i jednocześnie wybierać siebie.',
  '2026-05-16': 'Życie nadal może być moje, jeśli mu pozwolę.',
  '2026-05-17': 'W połowie maja widzę, że już nie jestem tylko bólem.',
  '2026-05-18': 'Postęp nie wymaga karania siebie.',
  '2026-05-19': 'Odwaga to czasem jedna wysłana wiadomość.',
  '2026-05-20': 'Dziś chronię siebie, nie wyciskam siebie.',
  '2026-05-21': 'Zaproszenie wysłane to mała rewolucja przeciwko izolacji.',
  '2026-05-22': 'Inteligencja i lekkość mogą iść razem.',
  '2026-05-23': 'Moja widoczność dziś płynie z pełni, nie z braku.',
  '2026-05-24': 'Wiem o sobie więcej, niż wiedziałam miesiąc temu.',
  '2026-05-25': 'Finansowa godność buduje się decyzja po decyzji.',
  '2026-05-26': 'Następny poziom zawodowy zaczyna się od dzisiejszego ruchu.',
  '2026-05-27': 'Klasa to spokój widoczny w postawie i prostocie.',
  '2026-05-28': 'Czerwiec już szykuję, ale nie uciekam z maja.',
  '2026-05-29': 'Standard buduje się w ciszy, nie w awanturze.',
  '2026-05-30': 'Wychodzę dziś z energii „mam życie", a nie „patrz, co straciłeś".',
  '2026-05-31': 'Nadal mnie boli, ale już nie jestem tylko bólem. To jest pozycja.',

  // ── CZERWIEC 2026 — ZAKORZENIENIE ─────────────────────────────

  '2026-06-08': 'Nazywam emocje, zanim one zaczną nazywać mnie.',
  '2026-06-09': 'Telefon do bliskiej osoby też jest aktem zakorzenienia.',
  '2026-06-10': 'Mniej w okres to nie ustępstwo. To mądrość.',
  '2026-06-11': 'Wersja minimum dnia to nadal wybór siebie.',
  '2026-06-12': 'Idę na wesele z miłością do siebie, nie z lękiem.',
  '2026-06-13': 'Godność nie męczy. Negocjowanie miłości tak.',
  '2026-06-14': 'Dom rodzinny też ma miejsce na mój slot Wnętrza.',
  '2026-06-15': 'Po okresie wracam do siebie, nie do ścigania się.',
  '2026-06-16': 'Daję sobie dziś to, co Natalia z 30. urodzin chciałaby mieć już teraz.',
  '2026-06-17': 'Trenuję dla siebie, nie dla widowni.',
  '2026-06-18': 'Trzecia aktywność tygodnia to dowód, że ciało jest priorytetem.',
  '2026-06-19': 'Oddech głębiej, sen wcześniej, zaufanie do ciała.',
  '2026-06-20': 'Występuję dla siebie. Moja wartość nie zależy od reakcji widowni.',
  '2026-06-21': 'Spokój po występie to moja nagroda, nie kolejny sprint.',
  '2026-06-22': 'Po szczycie wracam ze świadomością, nie z porażką.',
  '2026-06-23': 'Krok po kroku, oddech po oddechu.',
  '2026-06-24': 'Energia owulacji idzie w to, co buduję, nie w to, co udowadniam.',
  '2026-06-25': 'Dokumentuję swoją historię, bo jestem jej główną bohaterką.',
  '2026-06-26': 'Kontakt twarzą w twarz uziemia mocniej niż dziesięć wiadomości.',
  '2026-06-27': 'Moje standardy są definicją mojej wartości, nie atakiem.',
  '2026-06-28': 'Czterotygodniowa lekcja jest mądrzejsza niż jeden dzień zachwytu.',
  '2026-06-29': 'Dane czerwca to dane, nie ocena mnie.',
  '2026-06-30': 'Kończę fazę 1 jako kobieta z pozycją, nie z głodem.',
  // ── LIPIEC 2026 — ODDECH ──────────────────────────────────────
  '2026-07-01': 'Zaczynam lipiec od oddechu, nie od fajerwerków.',
  '2026-07-02': 'Każda domknięta zakładka oddaje mi kawałek mojej energii.',
  '2026-07-03': 'Umawiam terapię, bo daję sobie grunt, którego nikt mi nie da.',
  '2026-07-04': 'Daję ciału miękkość, bez negocjacji.',
  '2026-07-05': 'Slot dla siebie to nie przywilej, tylko fundament oddechu.',
  '2026-07-06': 'Łagodnie. Dziś jeden krok wystarczy.',
  '2026-07-07': 'Nazywam emocje, zanim one zaczną nazywać mnie.',
  '2026-07-08': 'Mniej w okres to nie ustępstwo. To mądrość.',
  '2026-07-09': 'Energia wraca. Nie ścigam się, wracam do siebie.',
  '2026-07-10': 'Idę do ludzi z pełni, nie z głodu.',
  '2026-07-11': 'Wieczór z ludźmi, gdzie się śmieję, nie analizuję.',
  '2026-07-12': 'Czterotygodniowy oddech jest mądrzejszy niż jeden dzień zrywu.',
  '2026-07-13': 'Po okresie wracam do siebie, nie do ścigania się.',
  '2026-07-14': 'Idę na terapię po grunt, nie po ocenę.',
  '2026-07-15': 'Trenuję i uczę się dla siebie, nie dla widowni.',
  '2026-07-16': 'Trzecia aktywność tygodnia to dowód, że ciało jest priorytetem.',
  '2026-07-17': 'Woda niesie. Nie muszę wszystkiego trzymać.',
  '2026-07-18': 'Lato wywołane jak skarb, jedna klatka na raz.',
  '2026-07-19': 'Spokój po weekendzie to nagroda, nie kolejny sprint.',
  '2026-07-20': 'Wracam do EY na moich warunkach, nie z poczucia winy.',
  '2026-07-21': 'Energia spada, moja wartość nie. To biologia, nie prawda.',
  '2026-07-22': 'EY dotykam, nie wchłaniam. Wychodzę o swojej godzinie.',
  '2026-07-23': 'Praca wraca, fundament zostaje. Slot i oddech nie wypadają.',
  '2026-07-24': 'Zamykam dni EY i oddaję sobie weekend.',
  '2026-07-25': 'Lutealna prosi o łagodność. Słucham, nie forsuję.',
  '2026-07-26': 'Cztery sloty zrobione. Zbudowałam infrastrukturę, której nie miałam.',
  '2026-07-27': 'Świętuję siebie, bo moje istnienie nie potrzebuje powodu.',
  '2026-07-28': 'Krok po kroku, oddech po oddechu.',
  '2026-07-29': 'Domykam zakładki, bo każda otwarta drenuje mi oddech.',
  '2026-07-30': 'Dane lipca to dane, nie ocena mnie.',
  '2026-07-31': 'Kończę lipiec z oddechem i z pozycją, nie z głodem.',
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
  const now = forDate ?? getEffectiveNow()
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
  const now = forDate ?? getEffectiveNow()
  const weeksSinceStart = Math.floor((now.getTime() - PROJECT_START.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const topic = WEEKLY_STUDY_TOPICS[((weeksSinceStart % WEEKLY_STUDY_TOPICS.length) + WEEKLY_STUDY_TOPICS.length) % WEEKLY_STUDY_TOPICS.length]
  return topic.label
}

// ─── ZĘBY ──────────────────────────────────────────────────────
// Kroki pomocnicze dla „Umycie zębów + nitkowanie" (m8) — odhaczane
// osobno, bez osobnego XP. Kolejność jak w tekście pozycji.
export const MORNING_TEETH_STEPS = [
  'Mycie zębów',
  'Nitkowanie',
]

// ─── PIELĘGNACJA CERY ──────────────────────────────────────────

export const MORNING_SKINCARE_STEPS = [
  'mycie',
  'witamina C',
  'Toleriane',
  'SPF',
]

// 4 noce aktywne (azelaina/retinoid/BHA/retinoid), 3 barierowe (śr/pt/niedz).
// Nigdy retinoid + kwas tej samej nocy; bariera = sam krem, nic aktywnego.
export const EVENING_SKINCARE: Record<number, { theme: string; steps: string[] }> = {
  1: { theme: 'azelaina',  steps: ['mycie', 'azelaina (TO Azelaic 10%)', 'Toleriane'] },
  2: { theme: 'retinoid',  steps: ['mycie', 'retinoid (TO Granactive 2%)', 'Cicaplast lub Kloo'] },
  3: { theme: 'bariera',   steps: ['mycie', 'Toleriane (sam krem)'] },
  4: { theme: 'BHA / strefa T', steps: ['mycie', 'BHA (Paula\'s Choice 2%, tylko strefa T)', 'Toleriane'] },
  5: { theme: 'bariera',   steps: ['mycie', 'Toleriane'] },
  6: { theme: 'retinoid',  steps: ['mycie', 'retinoid (TO Granactive 2%)', 'Toleriane'] },
  0: { theme: 'bariera',   steps: ['mycie', 'Toleriane (lub peeling Tołpa gdy skóra szorstka)'] },
}

// ─── SUPLEMENTY (dzień tygodnia: 0=nd, 1=pn ... 6=sb) ──────────
// Rano: po śniadaniu z tłuszczem (D3/K2/omega potrzebują tłuszczu); kawa dopiero po tabletkach.
// B-complex (pn/śr/pt/nd) przeplata się z witaminą C (wt/cz/sb). Atenza tylko w dni robocze.
// note = dawka poza porannym blokiem (np. cynk+selen przy obiedzie, z dala od kreatyny).
const SUPP_MORNING_BASE = ['D3 4000 IU', 'K2 MK-7 1 kaps', 'Omega-3 2 kaps', 'Kreatyna 3–3,5 g']

export const MORNING_SUPPLEMENTS: Record<number, { theme: string; steps: string[]; note?: string }> = {
  1: { theme: 'po śniadaniu z tłuszczem', steps: [...SUPP_MORNING_BASE, 'Atenza', 'B-complex DOZ 1 tabl'] },
  2: { theme: 'po śniadaniu z tłuszczem', steps: [...SUPP_MORNING_BASE, 'Atenza', 'Witamina C 500 mg'] },
  3: { theme: 'po śniadaniu z tłuszczem', steps: [...SUPP_MORNING_BASE, 'Atenza', 'B-complex DOZ 1 tabl'] },
  4: { theme: 'po śniadaniu z tłuszczem', steps: [...SUPP_MORNING_BASE, 'Atenza', 'Witamina C 500 mg'] },
  5: { theme: 'po śniadaniu z tłuszczem', steps: [...SUPP_MORNING_BASE, 'Atenza', 'B-complex DOZ 1 tabl'] },
  6: { theme: 'wolne — bez Atenzy',       steps: [...SUPP_MORNING_BASE, 'Witamina C 500 mg'] },
  0: { theme: 'wolne — bez Atenzy',       steps: [...SUPP_MORNING_BASE, 'B-complex DOZ 1 tabl'] },
}

// Wieczór: 2–3 h po kolacji, przed snem. Ten sam zestaw codziennie.
export const EVENING_SUPPLEMENTS: { theme: string; steps: string[] } = {
  theme: '2–3 h po kolacji',
  steps: ['Duloksetyna', 'Magnez 2 kaps', 'Omega-3 2 kaps'],
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
