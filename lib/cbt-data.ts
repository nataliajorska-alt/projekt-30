// Moduł „Myśli i emocje" (/mysli) — narzędzia z terapii poznawczo-behawioralnej.
// Trzy ćwiczenia z rozdziałów o emocjach i myślach automatycznych:
//  • Myśli  — tabela myśli automatycznych (ćw. 4) + wywiad sokratejski (ćw. 5)
//  • Emocje — instrukcja obsługi emocji (ćw. 1): nazwij, zlokalizuj, nadaj kształt,
//             oceń natężenie przed/po. Spadek natężenia to cały sens.
//  • Tarcza — wspierające zdania (ćw. 6): wybór z listy + własne. BEZ XP.
//
// Persystencja: kolekcja users/{uid}/cbtJournal (osobne dokumenty, jak vault),
// każdy wpis nosi własne `xpEarned` — żeby recoverStats odbudowało XP sumując
// wpisy (wzór Ghost Protocol V2), zamiast gubić je przy odtwarzaniu statystyk.
// Tarcza: pojedynczy dokument users/{uid}/data/cbtShield, bez XP.
//
// Filar: WSZYSTKO idzie na „pozycja" (regulacja wewnętrzna) — jak Blok Serca i
// Ghost Protocol. XP nagradza PRACĘ (złapanie myśli, przeformułowanie), nie ból.

// ── Typy wpisów ────────────────────────────────────────────────────────────

/** Jedna emocja z natężeniem w % (sytuacja → emocje % → myśli). */
export interface CBTEmotionTag {
  name: string
  pct: number // 0–100
}

/** Wpis „tabeli myśli automatycznych" + wywiad sokratejski (ćw. 4–5). */
export interface CBTThoughtEntry {
  id: string
  kind: 'thought'
  dateKey: string
  timestamp: number
  situation: string
  emotions: CBTEmotionTag[]
  thoughts: string // myśli automatyczne (tekst)
  alt: string // myśl alternatywna (zrównoważona) — kolumna z klasycznej tabeli myśli
  altPct: number // 0–100 — na ile w nią wierzę
  // Wywiad z gorącą myślą (dopisywane później — dlatego osobna kolekcja, nie tablica dnia):
  hot: string // gorąca myśl
  interro: Record<string, string> // odpowiedzi sokratejskie po id pytania
  reframe: string // przeformułowana myśl
  reframeFeel: string // jak poczuję się z tą myślą
  // XP / księgowość:
  xpEarned: number // ile ten wpis już naliczył (capture + bonus za reframe)
  reframeAwarded: boolean // czy bonus za przeformułowanie już przyznany
  updatedAt: string
}

/** Wpis „instrukcji obsługi emocji" (ćw. 1) z natężeniem przed/po. */
export interface CBTEmotionEntry {
  id: string
  kind: 'emotion'
  dateKey: string
  timestamp: number
  name: string
  before: number // 0–10
  after: number // 0–10
  body: string
  color: string
  shape: string
  texture: string
  smell: string
  sound: string
  metaphor: string
  xpEarned: number
  updatedAt: string
}

export type CBTEntry = CBTThoughtEntry | CBTEmotionEntry

/** Tarcza wspierających myśli — stała kolekcja zdań. Bez XP. */
export interface CBTShield {
  selected: string[]
  custom: string[]
  updatedAt: string
}

// ── Fabryki pustych wpisów ─────────────────────────────────────────────────

export function emptyThought(id: string, dateKey: string): CBTThoughtEntry {
  return {
    id,
    kind: 'thought',
    dateKey,
    timestamp: Date.now(),
    situation: '',
    emotions: [],
    thoughts: '',
    alt: '',
    altPct: 0,
    hot: '',
    interro: {},
    reframe: '',
    reframeFeel: '',
    xpEarned: 0,
    reframeAwarded: false,
    updatedAt: new Date().toISOString(),
  }
}

export function emptyEmotion(id: string, dateKey: string): CBTEmotionEntry {
  return {
    id,
    kind: 'emotion',
    dateKey,
    timestamp: Date.now(),
    name: '',
    before: 5,
    after: 5,
    body: '',
    color: '',
    shape: '',
    texture: '',
    smell: '',
    sound: '',
    metaphor: '',
    xpEarned: 0,
    updatedAt: new Date().toISOString(),
  }
}

export const emptyShield = (): CBTShield => ({ selected: [], custom: [], updatedAt: new Date().toISOString() })

// ── Pytania sokratejskie (ćw. 5) ───────────────────────────────────────────
// Przesłuchanie „gorącej myśli" jak prokurator: dowody, fakty vs uczucia,
// czarno-białość, najgorszy vs prawdopodobny scenariusz, czyja to myśl,
// co powiedziałabyś przyjaciółce.
export const SOCRATIC: { id: string; q: string }[] = [
  { id: 'evFor', q: 'Jakie są dowody potwierdzające tę myśl?' },
  { id: 'evAgainst', q: 'Jakie są dowody przeciw tej myśli?' },
  { id: 'factFeel', q: 'Czy ta myśl opiera się na faktach, czy głównie na uczuciach?' },
  { id: 'bw', q: 'Czy przedstawia świat czarno-biało, choć rzeczywistość taka nie jest?' },
  { id: 'worst', q: 'Czy to scenariusz prawdopodobny, czy najgorszy z możliwych?' },
  { id: 'whose', q: 'Czyja to myśl? Czy źródło jest wiarygodne i czy chcę ją sobie powtarzać?' },
  { id: 'others', q: 'Co innego mogliby pomyśleć inni w takiej sytuacji?' },
  { id: 'friend', q: 'Co powiedziałabym przyjaciółce, która myśli w ten sposób?' },
]

// ── Tarcza — zdania z książki (ćw. 6) ──────────────────────────────────────
export const BOOK_SHIELD: string[] = [
  'Już kiedyś się tak czułam i sobie poradziłam.',
  'Mogę się tak czuć. Mogę mieć takie trudności.',
  'Nie we wszystkim muszę być idealna.',
  'Każdy popełnia błędy.',
  'Mam prawo przeżywać i okazywać emocje.',
  'To, że czuję się źle, nie oznacza od razu, że sobie nie radzę.',
  'Jestem wystarczająca.',
  'Teraz czuję się źle, ale wiem, że to minie.',
  'Mogę sobie dać czas.',
  'Są ludzie, którzy mnie doceniają i dla których jestem ważna.',
  'Żeby dać coś światu, najpierw sama muszę mieć. Potrzebuję priorytetowo dbać o siebie.',
]

// ── Drobne helpery ─────────────────────────────────────────────────────────

/** Czy wywiad z gorącą myślą jest „domknięty" — kwalifikuje się do bonusu XP. */
export function reframeComplete(t: Pick<CBTThoughtEntry, 'hot' | 'reframe'>): boolean {
  return t.hot.trim().length > 0 && t.reframe.trim().length > 0
}

export function cbtUid(): string {
  return `cbt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
