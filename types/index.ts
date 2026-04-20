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

export interface RoutineItem {
  id: string
  text: string
  type: 'morning' | 'evening' | 'daily'
  xp: number
}

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

export type GhostTriggerTag =
  | 'samotnosc'
  | 'nuda'
  | 'social_media'
  | 'alkohol'
  | 'dobry_dzien'
  | 'zly_dzien'

export const GHOST_TRIGGER_TAGS: { value: GhostTriggerTag; label: string; emoji: string }[] = [
  { value: 'samotnosc',   label: 'samotność',           emoji: '🌑' },
  { value: 'nuda',        label: 'nuda',                emoji: '🌀' },
  { value: 'social_media',label: 'scrollowanie sociali', emoji: '📱' },
  { value: 'alkohol',     label: 'alkohol',             emoji: '🍷' },
  { value: 'dobry_dzien', label: 'dobry dzień (relaks)', emoji: '☀️' },
  { value: 'zly_dzien',   label: 'zły dzień (ból)',     emoji: '🌧️' },
]

export interface GhostProtocolEntry {
  timestamp: number
  hour: number      // 0–23
  weekday: number   // 0=Pon … 6=Nd
  dayMode: 'normal' | 'minimum'
  reasonId: string
  triggerTag: GhostTriggerTag
}

// Ghost Protocol V2 — nowy system kategorii
export type GhostCategory =
  | 'social_slady'
  | 'zycie_rownolegla'
  | 'flashback'
  | 'brak_gestu'
  | 'proximity'
  | 'kontakt_zewnetrzny'
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

export interface DailyLog {
  date: string
  completedRoutine: string[]
  completedDailyQuests: string[]
  completedSideQuests: string[]
  keptRules: string[]
  totalXP: number
  dayMode: 'normal' | 'minimum'
  notes?: string
  socialPresence?: boolean
  physicalActivity?: boolean
  ghostProtocolCompleted?: boolean
  moodCheckIns?: MoodCheckIn[]
  keyMoment?: KeyMoment           // oznaczenie dnia jako kluczowego momentu
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
  score: number
  label: string       // np. "Wt 22:00"
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
