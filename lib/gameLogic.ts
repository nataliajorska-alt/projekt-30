export const PROJECT_START = new Date('2026-04-05T00:00:00')
export const PROJECT_END = new Date('2027-04-05T00:00:00')
export const TOTAL_DAYS = 365

// Nowy dzień zaczyna się o tej godzinie (np. 3 = 3:00 w nocy).
// Dzięki temu wieczorna rutyna po północy nadal liczy się do poprzedniego dnia.
export const DAY_START_HOUR = 3

/**
 * Zwraca "efektywną" datę bieżącego momentu.
 * Jeśli jest przed DAY_START_HOUR, cofamy się o dobę —
 * czyli np. 1:30 w nocy z czwartku na piątek traktujemy jako czwartek.
 */
export function getEffectiveNow(): Date {
  const now = new Date()
  if (now.getHours() < DAY_START_HOUR) {
    now.setDate(now.getDate() - 1)
  }
  return now
}

export const XP_VALUES = {
  routine: 10,
  dailyQuest: 50,
  sideQuest: 120,
  rulekept: 20,
  weeklyReview: 150,
  monthlyReview: 300,
  pillarBalance: 30,
  moodCheckIn: 5,
  returnCeremony: 200,
}

export const LEVELS: { level: number; name: string; xpRequired: number }[] = [
  { level: 1,  name: 'Ziarnko',         xpRequired: 0 },
  { level: 2,  name: 'Pąk',             xpRequired: 700 },
  { level: 3,  name: 'Budująca',        xpRequired: 1700 },
  { level: 4,  name: 'Przebudzająca',   xpRequired: 3000 },
  { level: 5,  name: 'Rozwijająca',     xpRequired: 4600 },
  { level: 6,  name: 'Wznosząca',       xpRequired: 6400 },
  { level: 7,  name: 'Klarowna',        xpRequired: 8600 },
  { level: 8,  name: 'Zdyscyplinowana', xpRequired: 11100 },
  { level: 9,  name: 'Skupiona',        xpRequired: 14000 },
  { level: 10, name: 'Pewna',           xpRequired: 17200 },
  { level: 11, name: 'Silna',           xpRequired: 20700 },
  { level: 12, name: 'Świadoma',        xpRequired: 24600 },
  { level: 13, name: 'Magnetyczna',     xpRequired: 28900 },
  { level: 14, name: 'Klasyczna',       xpRequired: 33600 },
  { level: 15, name: 'Elegancka',       xpRequired: 38600 },
  { level: 16, name: 'Strategiczna',    xpRequired: 44300 },
  { level: 17, name: 'Dojrzała',        xpRequired: 50700 },
  { level: 18, name: 'Wyrafinowana',    xpRequired: 57900 },
  { level: 19, name: 'Niezależna',      xpRequired: 65700 },
  { level: 20, name: 'Wartościowa',     xpRequired: 74300 },
  { level: 21, name: 'Premium',         xpRequired: 83600 },
  { level: 22, name: 'Nieodparta',      xpRequired: 93600 },
  { level: 23, name: 'Legendarna',      xpRequired: 104300 },
  { level: 24, name: 'Wybitna',         xpRequired: 115700 },
  { level: 25, name: 'Ponadprzeciętna', xpRequired: 127900 },
  { level: 26, name: 'Wyjątkowa',       xpRequired: 140700 },
  { level: 27, name: 'Ikona',           xpRequired: 154300 },
  { level: 28, name: 'Mistrzyni',       xpRequired: 168600 },
  { level: 29, name: 'Królowa',         xpRequired: 184300 },
  { level: 30, name: 'Natalia 30',      xpRequired: 200000 },
]

export function getLevelFromXP(xp: number): typeof LEVELS[0] {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl
    else break
  }
  return current
}

export function getNextLevel(xp: number): typeof LEVELS[0] | null {
  const current = getLevelFromXP(xp)
  return LEVELS.find(l => l.level === current.level + 1) ?? null
}

export function getLevelProgress(xp: number): number {
  const current = getLevelFromXP(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  const range = next.xpRequired - current.xpRequired
  const earned = xp - current.xpRequired
  return Math.round((earned / range) * 100)
}

export function getDaysElapsed(): number {
  const now = getEffectiveNow()
  const diff = now.getTime() - PROJECT_START.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function getDaysRemaining(): number {
  const now = getEffectiveNow()
  const diff = PROJECT_END.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getProjectProgress(): number {
  const elapsed = getDaysElapsed()
  return Math.min(100, Math.round((elapsed / TOTAL_DAYS) * 100))
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function todayKey(): string {
  const d = getEffectiveNow()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns ISO week key like "2026-W15". Week starts on Monday per ISO 8601.
export function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
