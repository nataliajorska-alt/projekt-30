// Moduł „Myśli i emocje" (/mysli) — narzędzia z terapii poznawczo-behawioralnej.
// Cztery narzędzia z rozdziałów o emocjach, myślach automatycznych i przekonaniach:
//  • Myśli      — tabela myśli automatycznych (ćw. 4) + wywiad sokratejski (ćw. 5)
//  • Emocje     — instrukcja obsługi emocji (ćw. 1): nazwij, zlokalizuj, nadaj kształt,
//                 oceń natężenie przed/po. Spadek natężenia to cały sens.
//  • Przekonania — strzałka w dół (rozdz. „Pułapka przekonań"): myśl → przekonanie
//                 kluczowe (schemat) → restrukturyzacja w nowe, zdrowe przekonanie.
//                 XP TYLKO za domknięcie (przekonanie kluczowe → nowe), nie za sam
//                 zapis bólu. „Nowe przekonanie" można świadomie wysłać na Tarczę.
//  • Style      — style radzenia sobie ze schematem (rozdz. „Radzisz sobie. Tylko
//                 jak?"): unikanie / nadmierna kompensacja / poddanie się. Złap
//                 automat (capture) i przepytaj go pytaniami z ćwiczenia — książka
//                 każe je „zapisać w telefonie" i zadawać sobie, gdy zauważysz,
//                 że używasz nieadaptacyjnego stylu. XP za domknięcie pytań
//                 (praca), nie za samo przyłapanie się.
//  • Tarcza     — wspierające zdania (ćw. 6): wybór z listy + własne. BEZ XP.
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

/** Jedna codzienna sytuacja potwierdzająca nowe przekonanie (pielęgnacja w czasie). */
export interface CBTBeliefConfirmation {
  dateKey: string
  text: string
}

/** Punkt na krzywej % wiary — jeden na tydzień ISO. */
export interface CBTBeliefPctPoint {
  weekKey: string // np. „2026-W28"
  pct: number // 0–100
}

/** Eksperyment behawioralny (rozdz. 11, ćw. 3) — realny test przekonania
 *  kluczowego. Testowane przekonanie = coreBelief wpisu; jeśli test wyjdzie,
 *  jego „nowe przekonanie" można przenieść na newBelief. Wynik to najsilniejszy
 *  możliwy dowód, więc naturalnie przesuwa % wiary. */
export interface CBTBeliefExperiment {
  id: string
  dateKey: string
  task: string // zadanie — co zrobię, żeby przetestować przekonanie
  worry: string // obawy — czego się boję, że się stanie
  results: string // wyniki eksperymentu — co się realnie wydarzyło
  conclusion: string // wniosek — czy obawy się potwierdziły
  awarded: boolean // czy bonus za domknięty eksperyment już przyznany
}

/** Wpis „strzałki w dół" — identyfikacja przekonania kluczowego (ćw. 1)
 *  + restrukturyzacja w nowe, zdrowe przekonanie (ćw. 2). Obiekt DŁUGOŻYJĄCY:
 *  wracasz do niego, przesuwasz % wiary, dopisujesz dowody. */
export interface CBTBeliefEntry {
  id: string
  kind: 'belief'
  dateKey: string
  timestamp: number
  // Ćw. 1 — strzałka w dół (zejście do przekonania kluczowego):
  trigger: string // sytuacja/myśl startowa z silnymi emocjami
  ladder: string[] // kolejne odpowiedzi na „jeśli to prawda, co to o mnie mówi?"
  coreBelief: string // przekonanie kluczowe — dno drabiny
  // Pogłębienie (rozdz. „Pułapka przekonań"):
  behaveWhenActive: string // jak się zachowuję / czuję, gdy to przekonanie działa
  ifOpposite: string // jak zachowałabym się, gdyby było ODWROTNE
  source: string // skąd się wzięło (dzieciństwo, słowa, interpretacje zachowań)
  axisSelf: string // Ja jestem…
  axisOthers: string // Inni ludzie są…
  axisWorld: string // Świat jest…
  // Ćw. 2 — restrukturyzacja:
  newBelief: string // nowe, zdrowe przekonanie
  newBeliefPct: number // 0–100, na ile wierzę w NOWE (przesuwane w czasie)
  evidence: string[] // dowody potwierdzające nowe przekonanie (książka: 5)
  // Codzienna pielęgnacja (rozdz. „codzienna pielęgnacja") — BEZ XP:
  confirmations: CBTBeliefConfirmation[] // codzienne sytuacje potwierdzające nowe przekonanie
  pctHistory: CBTBeliefPctPoint[] // % wiary tydzień-po-tygodniu (krzywa postępu)
  // Eksperymenty behawioralne (rozdz. 11, ćw. 3) — realne testy tego przekonania:
  experiments: CBTBeliefExperiment[]
  // XP / księgowość (jak CBTThoughtEntry — bonus stemplowany na xpEarned):
  xpEarned: number
  restructureAwarded: boolean // czy bonus za domknięcie już przyznany
  updatedAt: string
}

/** Trzy style radzenia sobie ze schematem (rozdz. „Radzisz sobie. Tylko jak?"). */
export type CBTCopingStyle = 'avoid' | 'overcomp' | 'surrender'

/** Wpis „przyłapania się" na nieadaptacyjnym stylu radzenia sobie (ćw. 1–2).
 *  Capture = styl + co robię + jak (to widzisz w momencie). Głębsze pytania
 *  (konfrontacja, źródło, zdrowa alternatywa) dopisywane później w rozwinięciu. */
export interface CBTCopingEntry {
  id: string
  kind: 'coping'
  dateKey: string
  timestamp: number
  style: CBTCopingStyle
  what: string // czego unikam / w czym przesadzam / czemu się poddaję
  ways: string // moje sposoby — jak to wygląda w praktyce
  // Pytania z ćwiczenia (dopisywane później, autozapis):
  confront: string // co by się stało, gdybym się tak nie zachowywała? z czym bym się zmierzyła? jakich emocji unikam?
  source: string // źródło zachowania — czy przypomina sytuację z dzieciństwa?
  healthy: string // jak bym się zachowała, gdyby nie dysfunkcyjne przekonania?
  // XP / księgowość (bonus stemplowany na xpEarned, jak reframe/restrukturyzacja):
  xpEarned: number
  copingAwarded: boolean // czy bonus za przepytanie automatu już przyznany
  updatedAt: string
}

/** Jeden szczebel drabiny lęków (rozdz. 11, ćw. 1) + jego ekspozycja (ćw. 2).
 *  `fear` (0–100) buduje hierarchię; reszta pól to planowanie i log ekspozycji. */
export interface CBTExposureRung {
  id: string
  situation: string // sytuacja związana z lękiem
  fear: number // 0–100 (0 = brak lęku, 100 = panika) — pozycja na drabinie
  helper: string // czynnik pomocniczy (ćw. 2) — co pomoże zrealizować ekspozycję
  // Log ekspozycji (tabela ćw. 2) — przed:
  plan: string // plan ekspozycji: co, kiedy, gdzie, jak
  // …po:
  observations: string // jak przebiegła ekspozycja (obserwacje)
  thoughts: string // jakie myśli pojawiły się w trakcie
  success: string // co mi się udało (docenienie)
  done: boolean // „opanowana" — czuję się już dobrze w tej sytuacji
  awarded: boolean // czy bonus za opanowany szczebel już przyznany
}

/** Drabina lęków + stopniowana ekspozycja (rozdz. 11, ćw. 1–2). Obiekt
 *  DŁUGOŻYJĄCY: wracasz, obniżasz `fear` szczebli, logujesz kolejne ekspozycje. */
export interface CBTExposureLadder {
  id: string
  kind: 'exposure'
  dateKey: string
  timestamp: number
  area: string // obszar lęku (np. „bliskość", „perfekcjonizm", „pająki")
  rungs: CBTExposureRung[]
  xpEarned: number // capture +10 + bonusy za opanowane szczeble (stemplowane)
  updatedAt: string
}

export type CBTEntry = CBTThoughtEntry | CBTEmotionEntry | CBTBeliefEntry | CBTCopingEntry | CBTExposureLadder

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

export function emptyBelief(id: string, dateKey: string): CBTBeliefEntry {
  return {
    id,
    kind: 'belief',
    dateKey,
    timestamp: Date.now(),
    trigger: '',
    ladder: [],
    coreBelief: '',
    behaveWhenActive: '',
    ifOpposite: '',
    source: '',
    axisSelf: '',
    axisOthers: '',
    axisWorld: '',
    newBelief: '',
    newBeliefPct: 0,
    evidence: [],
    confirmations: [],
    pctHistory: [],
    experiments: [],
    xpEarned: 0,
    restructureAwarded: false,
    updatedAt: new Date().toISOString(),
  }
}

export function emptyExperiment(id: string, dateKey: string): CBTBeliefExperiment {
  return { id, dateKey, task: '', worry: '', results: '', conclusion: '', awarded: false }
}

export function emptyExposureRung(id: string): CBTExposureRung {
  return { id, situation: '', fear: 50, helper: '', plan: '', observations: '', thoughts: '', success: '', done: false, awarded: false }
}

export function emptyExposure(id: string, dateKey: string): CBTExposureLadder {
  return {
    id,
    kind: 'exposure',
    dateKey,
    timestamp: Date.now(),
    area: '',
    rungs: [],
    xpEarned: 0,
    updatedAt: new Date().toISOString(),
  }
}

export function emptyCoping(id: string, dateKey: string): CBTCopingEntry {
  return {
    id,
    kind: 'coping',
    dateKey,
    timestamp: Date.now(),
    style: 'avoid',
    what: '',
    ways: '',
    confront: '',
    source: '',
    healthy: '',
    xpEarned: 0,
    copingAwarded: false,
    updatedAt: new Date().toISOString(),
  }
}

/** Wpisuje/aktualizuje % wiary dla danego tygodnia ISO (jeden punkt na tydzień). */
export function upsertPctWeek(history: CBTBeliefPctPoint[], weekKey: string, pct: number): CBTBeliefPctPoint[] {
  const idx = history.findIndex(p => p.weekKey === weekKey)
  if (idx === -1) return [...history, { weekKey, pct }]
  const next = history.slice()
  next[idx] = { weekKey, pct }
  return next
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

// ── Style radzenia sobie ze schematem (rozdz. „Radzisz sobie. Tylko jak?") ──
// Definicje wzięte z książki 1:1. Pytania capture (whatQ/waysQ) lekko dopasowane
// do stylu — głębsze pytania ćwiczenia są wspólne i mieszkają w CopingWork.
export const COPING_STYLES: {
  key: CBTCopingStyle
  label: string
  def: string
  whatQ: string
  whatHint: string
  whatPh: string
  waysQ: string
  waysPh: string
}[] = [
  {
    key: 'avoid',
    label: 'Unikanie',
    def: 'Unikanie schematu to mechanizm, który ma nie dopuścić do konfrontacji z treścią przekonania.',
    whatQ: 'Czego unikam?',
    whatHint: 'Coś, co odkładasz lub omijasz, choć Ci to przeszkadza.',
    whatPh: 'Napisania pracy magisterskiej, rozmów na jej temat z promotorem.',
    waysQ: 'Jakie są moje sposoby na unikanie?',
    waysPh: 'Oglądam seriale, ignoruję maile od promotora.',
  },
  {
    key: 'overcomp',
    label: 'Kompensacja',
    def: 'Nadmierna kompensacja to zachowywanie się wbrew treści przekonania i zastępowanie deficytu — niezaspokojonej potrzeby emocjonalnej — nadmiarem.',
    whatQ: 'W czym przesadzam w drugą stronę?',
    whatHint: 'Nadmiar, który ma zakryć deficyt — zachowanie wbrew przekonaniu.',
    whatPh: 'Muszę być we wszystkim najlepsza. Ostro krytykuję innych, nim ktoś skrytykuje mnie.',
    waysQ: 'Jak to wygląda w praktyce?',
    waysPh: 'Poprawiam każdy szczegół, biorę wszystko na siebie, nie odpuszczam.',
  },
  {
    key: 'surrender',
    label: 'Poddanie się',
    def: 'Poddanie się schematowi sprawia, że zachowujemy się zgodnie z treścią przekonania, a więc potwierdzamy je.',
    whatQ: 'Czemu się poddaję?',
    whatHint: 'Zachowanie zgodne z przekonaniem — takie, które je potwierdza.',
    whatPh: 'Z góry zakładam, że się nie nadaję, więc nawet nie próbuję.',
    waysQ: 'Jak to wygląda w praktyce?',
    waysPh: 'Odpuszczam starania, oddaję decyzje innym, nie zgłaszam się.',
  },
]

export function copingStyle(key: CBTCopingStyle) {
  return COPING_STYLES.find(s => s.key === key) ?? COPING_STYLES[0]
}

// ── Drobne helpery ─────────────────────────────────────────────────────────

/** Czy wywiad z gorącą myślą jest „domknięty" — kwalifikuje się do bonusu XP. */
export function reframeComplete(t: Pick<CBTThoughtEntry, 'hot' | 'reframe'>): boolean {
  return t.hot.trim().length > 0 && t.reframe.trim().length > 0
}

/** Czy praca z przekonaniem jest „domknięta" — dno drabiny + nowe zdrowe
 *  przekonanie. Dopiero to (nie sam zapis bólu) kwalifikuje do bonusu XP. */
export function restructureComplete(b: Pick<CBTBeliefEntry, 'coreBelief' | 'newBelief'>): boolean {
  return b.coreBelief.trim().length > 0 && b.newBelief.trim().length > 0
}

/** Czy praca ze stylem radzenia sobie jest „domknięta" — nazwane, z czym bym się
 *  zmierzyła (emocje, których unikam) ORAZ jak zachowałabym się bez dysfunkcyjnych
 *  przekonań. Dopiero to (nie samo przyłapanie się) kwalifikuje do bonusu XP. */
export function copingComplete(c: Pick<CBTCopingEntry, 'confront' | 'healthy'>): boolean {
  return c.confront.trim().length > 0 && c.healthy.trim().length > 0
}

/** Czy eksperyment behawioralny jest „domknięty" — zaplanowane zadanie, realny
 *  wynik ORAZ wniosek. Dopiero realne przeprowadzenie testu (nie sam plan)
 *  kwalifikuje do bonusu XP. */
export function experimentComplete(e: Pick<CBTBeliefExperiment, 'task' | 'results' | 'conclusion'>): boolean {
  return e.task.trim().length > 0 && e.results.trim().length > 0 && e.conclusion.trim().length > 0
}

/** Czy szczebel drabiny jest „opanowany" — świadomie zaznaczony jako done
 *  ORAZ z docenieniem („co mi się udało"). Dopiero realna ekspozycja (nie sam
 *  plan) kwalifikuje do bonusu XP. */
export function rungMastered(r: Pick<CBTExposureRung, 'done' | 'success'>): boolean {
  return r.done && r.success.trim().length > 0
}

/** Szczeble uporządkowane od najniższego lęku do najwyższego — drabina rośnie
 *  ku górze (najtrudniejsze na szczycie), jak w książce. Stabilne dla remisów. */
export function sortRungs(rungs: CBTExposureRung[]): CBTExposureRung[] {
  return rungs.map((r, i) => [r, i] as const)
    .sort(([a, ai], [b, bi]) => (a.fear - b.fear) || (ai - bi))
    .map(([r]) => r)
}

export function cbtUid(): string {
  return `cbt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
