export type Pillar =
  | 'pozycja'
  | 'cialo'
  | 'styl'
  | 'kapital'
  | 'kariera'
  | 'tozsamosc'
  | 'milosc'

export interface PillarMeta {
  id: Pillar
  name: string
  shortName: string
  icon: string
  color: string
  bgColor: string
  description: string
}

export type RoutineItemCategory = 'hygiene' | 'spiritual' | 'mental' | 'physical'
export type RoutineItemPriority = 'essential' | 'normal' | 'bonus'

export interface RoutineItem {
  id: string
  text: string
  type: 'morning' | 'evening' | 'daily'
  xp: number
  priority?: RoutineItemPriority
  category?: RoutineItemCategory
  /** Opcjonalny link (np. do apki ćwiczeń w /public/cwiczenia.html). Otwiera się w nowej karcie. */
  href?: string
}

export type MinimumDayReason = 'choroba' | 'okres' | 'zly_nastroj' | 'przemeczenie' | 'inne'

export const MINIMUM_DAY_REASONS: { value: MinimumDayReason; label: string; emoji: string; description: string }[] = [
  { value: 'choroba',      label: 'Choroba',       emoji: '🤒', description: 'Czuję się fizycznie źle' },
  { value: 'okres',        label: 'Okres',         emoji: '🌸', description: 'Okres lub ból' },
  { value: 'zly_nastroj',  label: 'Zły nastrój',   emoji: '🌧️', description: 'Trudny dzień emocjonalnie' },
  { value: 'przemeczenie', label: 'Przemęczenie',   emoji: '😴', description: 'Jestem wyczerpana' },
  { value: 'inne',         label: 'Inny powód',    emoji: '💫', description: 'Potrzebuję minimum' },
]

export interface Quest {
  id: string
  title: string
  description: string
  pillar: Pillar
  type: 'daily' | 'side' | 'main'
  xp: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
  steps?: string[]  // opcjonalne etapy dla złożonych questów
}

// Ghost Protocol — kategorie po zablokowaniu (rdzeń: nie sprawdzać)
export type GhostCategory =
  // aktywne kategorie (widoczne w GHOST_CATEGORIES)
  | 'chce_sprawdzic'
  | 'zastapienie'
  | 'nie_do_wybrania'
  | 'strach_przyszlosc'
  | 'tesknota_hustawka'
  | 'flashback'
  | 'kontakt_zewnetrzny'
  // quick-log — lekka fala (intensywność 2) zapisana jednym tapem, bez nazywania;
  // celowo poza GHOST_CATEGORIES, więc nie występuje w rankingu kategorii
  | 'chmurka'
  // legacy — stare wpisy z maja, niewidoczne w UI, zachowane dla zgodności logów
  | 'social_slady'
  | 'zycie_rownolegla'
  | 'brak_gestu'
  | 'proximity'
  | 'chce_podzielic'
  | 'stan_wewnetrzny'

export type GhostOutcome = 'better' | 'same' | 'worse'

export interface GhostLogEntryV2 {
  version: 2
  timestamp: number
  hour: number
  weekday: number
  dayMode: 'normal' | 'minimum'
  category: GhostCategory
  subcategory: string
  intensity: number       // 1–5
  outcome?: GhostOutcome
  hadContact: boolean
  xpEarned: number
}

export interface HonestFailureEntry {
  timestamp: number
  hour: number
  weekday: number
  category: GhostCategory
  subcategory: string
  intensity: number
  whatWouldHaveStoppedYou: string
  howYouFeelNow: string
  planForNextTime: string
  xpEarned: number
}

export type MoodState = 'calm' | 'storm' | 'fog' | 'clarity'

export const MOOD_STATES: { value: MoodState; emoji: string; label: string }[] = [
  { value: 'calm',    emoji: '🌊', label: 'spokój' },
  { value: 'storm',   emoji: '🌩️', label: 'burza' },
  { value: 'fog',     emoji: '🌫️', label: 'mgła' },
  { value: 'clarity', emoji: '☀️', label: 'klarowność' },
]

export interface MoodCheckIn {
  energy: number   // 1-5
  mood: number     // 1-5
  state: MoodState
  timestamp: number
}

export interface KeyMoment {
  title: string       // "Pierwsza randka z sobą", "Awans", "Przełom"
  note?: string       // krótki opis — max 280 znaków
  savedAt: number     // timestamp
}

export interface PhotoEntry {
  id: string
  url: string         // Firebase Storage download URL
  caption?: string
  dateKey: string     // YYYY-MM-DD
  dayOfProject: number
  createdAt: string
}

export interface AnnualReflection {
  wordOfTheYear: string           // jedno słowo podsumowujące rok
  biggestLesson: string           // największa lekcja
  proudestMoment: string          // z czego jesteś najbardziej dumna
  whatChanged: string             // co się realnie zmieniło
  letterToNext: string            // list do Natalii 31
  savedAt: string
}

export interface CustomSideQuestEntry {
  id: string
  title: string
  pillar: Pillar
  xp: number
}

// Pozycja rutyny (zadanie dnia, np. „Książka — hiszpański", ćwiczenia)
// przeniesiona Z innego dnia NA ten dzień. Snapshot z własnym tekstem/xp, bo
// szablony rutyny są per-dzień-tygodnia — pozycja przeniesiona na wtorek nie
// istnieje w szablonie wtorku.
export interface CarriedRoutineItem {
  id: string
  text: string
  xp: number
  fromDate: string   // YYYY-MM-DD — z którego dnia przyszła
}

// ── Vault — listy do siebie z różnych emocjonalnych miejsc ──────────
// future:    list do siebie z przyszłości — quarterly unlock (jak teraz)
// crisis:    list na trudną chwilę — zawsze otwarty, surface gdy mood ≤2 przez 3 dni
// gratitude: kapsuła wdzięczności — odblokowuje się 30 dni po napisaniu
// vent:      czysta terapia — content NIE jest zapisywany do Firestore, tylko meta
// date:      list na konkretną datę (urodziny, rocznica) — odblokowuje się tego dnia
export type LetterType = 'future' | 'crisis' | 'gratitude' | 'vent' | 'date'
export type UnlockType = 'quarterly' | 'date' | 'immediate' | 'never'

export const LETTER_TYPES: { value: LetterType; label: string; emoji: string; description: string; unlockType: UnlockType }[] = [
  { value: 'future',    label: 'Do siebie z przyszłości', emoji: '🌿', description: 'Piszesz jako Natalia 30. Otwiera się co kwartał.',                  unlockType: 'quarterly' },
  { value: 'crisis',    label: 'Na trudną chwilę',         emoji: '🕯️', description: 'Zawsze otwarty. Pojawi się gdy będziesz tego potrzebować.',         unlockType: 'immediate' },
  { value: 'gratitude', label: 'Wdzięczność',              emoji: '✨', description: 'Mała kapsuła czasu — otwiera się za 30 dni.',                      unlockType: 'date' },
  { value: 'vent',      label: 'Vent — bez powrotu',       emoji: '🌪️', description: 'Piszesz, znika. Treść nigdy nie jest zapisywana. Czysta terapia.', unlockType: 'never' },
  { value: 'date',      label: 'Na konkretną datę',        emoji: '🗓️', description: 'Urodziny, rocznica, "za rok od dziś" — sama wybierasz dzień.',     unlockType: 'date' },
]

// Reply do odblokowanego listu — można dodać wiele, każda z własnym mood.
export interface VaultReply {
  id: string
  content: string
  dateKey: string        // YYYY-MM-DD
  dayOfProject: number
  moodAtWriting?: MoodState
  createdAt: string      // ISO
}

export interface VaultEntry {
  id: string
  letterType: LetterType
  unlockType: UnlockType
  title: string
  content: string             // pusty string dla vent (nie zapisujemy treści)
  dateKey: string             // YYYY-MM-DD — kiedy napisany
  dayOfProject: number
  createdAt: string           // ISO
  unlockDate?: string         // YYYY-MM-DD — używane dla 'date' i 'gratitude'
  moodAtWriting?: MoodState
  promptUsed?: string         // tekst prompta (jeśli użyty)
  charCount?: number          // długość oryginału — dla vent zachowujemy ślad bez treści
  replies?: VaultReply[]      // ładowane z subkolekcji
}

// ── Papierosy — obserwacja, nie walka ─────────────────────────────────────
// Filozofia: każdy papieros to dane, nie porażka. Nie ma streaku „X dni bez",
// nie ma czerwonych alertów. Patrz PLAN_PALENIE.md.
export type CigaretteContext =
  | 'kawa'
  | 'posilek'
  | 'quest'
  | 'stres'
  | 'nuda'
  | 'impreza'
  | 'wieczor_z_kims'
  | 'samochod'
  | 'inne'

export interface CigaretteEntry {
  timestamp: number          // ms epoch
  hour: number               // 0-23 — dla heatmapy godzinowej
  weekday: number            // 0=Pon … 6=Nd
  context?: CigaretteContext
  intensity?: 1 | 2 | 3 | 4 | 5  // opcjonalne — gdy używasz Smoke Protocol
}

export type SmokingPhase = 1 | 2 | 3 | 4 | 5

// Uwaga: od 07.07.2026 realnym celem jest SUFIT MIESIĘCZNY liczony z daty
// (lib/smokeStats.ts → MONTHLY_CEILINGS), nie pasmo „−15–25%". Te etykiety to
// makro-łuk (tło paska faz); operacyjny cel podaje ceilingFor(dzień).
export const SMOKING_PHASE_META: Record<SmokingPhase, { label: string; period: string; softTarget: string }> = {
  1: { label: 'Obserwacja',     period: '18.05 – 06.07.2026',       softTarget: 'bez limitu — tylko liczymy' },
  2: { label: 'Redukcja',       period: '07.07.2026 → 5.04.2027',   softTarget: 'sufit miesięczny, w dół po jednym (14 → 0)' },
  3: { label: 'Kompresja',      period: 'październik–grudzień 2026', softTarget: 'sufit 9 → 6 / dzień, kontekst przed liczbą' },
  4: { label: 'Transfer',       period: 'styczeń–luty 2027',        softTarget: 'sufit 5 → 3, coraz więcej dni 0' },
  5: { label: 'Ostatnia prosta',period: 'marzec–kwiecień 2027',     softTarget: 'sufit 2 → 0, rzucam 5.04' },
}

export interface DailyLog {
  date: string
  completedRoutine: string[]
  completedDailyQuests: string[]
  completedSideQuests: string[]
  customSideQuests?: CustomSideQuestEntry[]
  /** Zadania dnia (rutyna „Dzień") przeniesione NA ten dzień z innego dnia. */
  carriedRoutine?: CarriedRoutineItem[]
  /** Id zadań dnia przeniesionych Z tego dnia na inny — chowane z listy. */
  postponedRoutine?: string[]
  keptRules: string[]
  totalXP: number
  dayMode: 'normal' | 'minimum'
  minimumReason?: MinimumDayReason
  notes?: string
  socialPresence?: boolean
  physicalActivity?: boolean
  ghostProtocolCompleted?: boolean
  moodCheckIns?: MoodCheckIn[]
  keyMoment?: KeyMoment
  cigarettes?: CigaretteEntry[]
  /**
   * Odhaczone pojedyncze kroki w rozwijanych przewodnikach (pielęgnacja,
   * suplementy) — czysto pomocnicze „co już zrobione", bez XP. Klucz w
   * formacie `${itemId}-${index}` (np. 'm9-4'). Resetuje się z nowym dniem,
   * bo żyje w logu danego dnia.
   */
  checkedSubSteps?: string[]
  /**
   * Jednorazowa korekta XP questów dnia: wyrównanie wartości naliczonych jako
   * płaskie 50 do realnego q.xp (po naprawie naliczania questów sezonowych).
   * Flaga per-dzień — gdy true, korekta już zaszła i nie jest powtarzana.
   */
  questXpAdjusted?: boolean
  /**
   * Dzienny „capture" CBT (moduł /mysli): pierwszy wpis tego dnia (myśl lub
   * emocja) przyznał +10 XP. Gdy true — dzienny bonus zaliczony, kolejne wpisy
   * naliczają już tylko bonus za przeformułowanie. Źródło prawdy dla flagi.
   */
  cbtCaptureAwarded?: boolean
  /**
   * Suma XP wpisana w tym dniu przez zewnętrzne aplikacje (na razie tylko
   * The Learning Vault), rozbita per filar. Endpoint /api/external/xp
   * inkrementuje to pole atomowo. recoverStats czyta to pole, żeby pillarXP
   * po odzyskaniu zawierał Vault XP — bez tego rebuild by go gubił.
   */
  externalXP?: Partial<Record<Pillar, number>>
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
  xpReward: number
  hidden?: boolean          // ukryte — nie pokazuj tytułu/opisu przed odblokowaniem
  streakBased?: boolean     // postęp = 1 jednostka / dzień (do mikro-celu)
  progress?: (stats: UserStats) => { current: number; target: number; label: string }
}

export interface UserStats {
  totalXP: number
  currentStreak: number
  longestStreak: number
  totalDaysLogged: number
  totalRoutinesCompleted: number
  totalQuestsCompleted: number
  totalSideQuestsCompleted: number
  totalRulesKept: number
  pillarXP: Record<Pillar, number>
  unlockedAchievements: string[]
  lastStreakDate?: string | null
  streakFreezeUsedMonths?: string[]
  reviewedWeeks?: string[]
  reviewedMonths?: string[]
  reviewedQuarters?: string[]
  completedHeartBlocks?: string[]            // weekKey list — idempotentne nagradzanie
  pillarBalanceWeeks?: string[]
  currentWeekPillars?: {
    weekKey: string
    pillars: Pillar[]
  }
  // Behavioral tracking
  totalGhostProtocols?: number              // łączna liczba aktywacji GP
  consecutiveGhostDays?: number             // GP aktywne X dni z rzędu
  lastGhostDate?: string | null             // ostatni dzień GP
  highestDayXP?: number                     // rekord XP w jednym dniu
  consecutiveNormalDays?: number            // dni z rzędu bez trybu minimum
  lastNormalDay?: string | null             // ostatni dzień w trybie normal
  consecutivePerfectMornings?: number       // dni z rzędu z pełną rutyną poranną
  lastPerfectMorningDate?: string | null    // data ostatniego idealnego poranka
  lastReturnCeremonyDate?: string | null    // kiedy ostatnio pokazano Return Ceremony
  // Papierosy — patrz PLAN_PALENIE.md. Brak `totalCigarettes` celowo: demotywujący licznik.
  smokingTrackingEnabled?: boolean          // toggle w settings; domyślnie true gdy w fazie ≥1
  cigarettesBaseline?: number               // średnia z fazy 1 (obliczana po ~6 tyg)
  cigarettesPhase?: SmokingPhase            // aktualna faza planu
  cigarettesPhaseStartDate?: string | null  // YYYY-MM-DD startu fazy
  cigarettesAlarmTriggered?: string | null  // ostatnia data alarmu rolling 30-day avg
  smokeEmergencyDays?: string[]             // dni „awaryjne" (YYYY-MM-DD): sufit zdjęty, bez presji; limit/miesiąc
}

export interface UserProfile {
  uid: string
  email: string | null
  stats: UserStats
  monthlyGoals: Record<string, MonthlyGoal[]>
}

export interface MonthlyGoal {
  id: string
  month: string
  pillar: Pillar
  title: string
  completed: boolean
}

export interface WeeklyReview {
  weekStart: string
  highlights: string
  challenges: string
  pillarsRated: Record<Pillar, number>
  nextWeekFocus: string
  xpEarned: number
  savedAt?: string
}

export interface RoutineConfig {
  disabledItems: string[]
  customItems: RoutineItem[]
  itemOrder?: {
    morning?: string[]
    evening?: string[]
    daily?: string[]
  }
  updatedAt: string
}

export interface NominatedContact {
  name: string
  phone: string
}

export interface SafeHoursWindow {
  dayOfWeek: number   // 0=Pon … 6=Nd
  hourStart: number   // 0-23 (2-godzinny bucket)
  cyclePhase?: 'menstruacja' | 'folikularna' | 'owulacyjna' | 'lutealna'  // trzecia oś analizy (opcjonalna)
  score: number
  label: string       // np. "Wt 22:00" lub "Sob 22:00 (okres)"
}

export interface MonthlyReview {
  month: string
  highlights: string
  challenges: string
  pillarsRated: Record<Pillar, number>
  intentionNextMonth: string
  xpEarned: number
  savedAt: string
}

// Kwartalny przegląd — domknięcie 3 miesięcy projektu (np. domknięcie fazy 1 palenia).
export interface QuarterlyReview {
  quarter: string             // klucz kwartału projektu, np. "Q1"
  lessons: string             // lekcje minionego kwartału
  openFronts: string          // otwarte fronty, niedokończone wątki
  bridgeToNext: string        // most do następnego kwartału / fazy
  whatChanged: string         // jedno zdanie: co się zmieniło we mnie
  xpEarned: number
  savedAt: string
}
