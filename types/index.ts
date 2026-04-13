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

export interface DailyLog {
  date: string
  completedRoutine: string[]
  completedDailyQuests: string[]
  completedSideQuests: string[]
  keptRules: string[]
  totalXP: number
  dayMode: 'normal' | 'minimum'
  notes?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
  xpReward: number
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
  reviewedWeeks?: string[]
  reviewedMonths?: string[]
  pillarBalanceWeeks?: string[]
  currentWeekPillars?: {
    weekKey: string
    pillars: Pillar[]
  }
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

export interface MonthlyReview {
  month: string
  highlights: string
  challenges: string
  pillarsRated: Record<Pillar, number>
  intentionNextMonth: string
  xpEarned: number
  savedAt: string
}
