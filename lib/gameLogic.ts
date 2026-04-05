export const PROJECT_START = new Date('2026-04-05T00:00:00')
export const PROJECT_END = new Date('2027-04-05T00:00:00')
export const TOTAL_DAYS = 365

export const XP_VALUES = {
  routine: 10,
  dailyQuest: 50,
  sideQuest: 120,
  rulekept: 20,
  weeklyReview: 150,
  pillarBalance: 30,
}

export const LEVELS: { level: number; name: string; xpRequired: number }[] = [
  { level: 1,  name: 'Ziarnko',         xpRequired: 0 },
  { level: 2,  name: 'Pąk',             xpRequired: 500 },
  { level: 3,  name: 'Budująca',        xpRequired: 1200 },
  { level: 4,  name: 'Przebudzająca',   xpRequired: 2100 },
  { level: 5,  name: 'Rozwijająca',     xpRequired: 3200 },
  { level: 6,  name: 'Wznosząca',       xpRequired: 4500 },
  { level: 7,  name: 'Klarowna',        xpRequired: 6000 },
  { level: 8,  name: 'Zdyscyplinowana', xpRequired: 7800 },
  { level: 9,  name: 'Skupiona',        xpRequired: 9800 },
  { level: 10, name: 'Pewna',           xpRequired: 12000 },
  { level: 11, name: 'Silna',           xpRequired: 14500 },
  { level: 12, name: 'Świadoma',        xpRequired: 17200 },
  { level: 13, name: 'Magnetyczna',     xpRequired: 20200 },
  { level: 14, name: 'Klasyczna',       xpRequired: 23500 },
  { level: 15, name: 'Elegancka',       xpRequired: 27000 },
  { level: 16, name: 'Strategiczna',    xpRequired: 31000 },
  { level: 17, name: 'Dojrzała',        xpRequired: 35500 },
  { level: 18, name: 'Wyrafinowana',    xpRequired: 40500 },
  { level: 19, name: 'Niezależna',      xpRequired: 46000 },
  { level: 20, name: 'Wartościowa',     xpRequired: 52000 },
  { level: 21, name: 'Premium',         xpRequired: 58500 },
  { level: 22, name: 'Nieodparta',      xpRequired: 65500 },
  { level: 23, name: 'Legendarna',      xpRequired: 73000 },
  { level: 24, name: 'Wybitna',         xpRequired: 81000 },
  { level: 25, name: 'Ponadprzeciętna', xpRequired: 89500 },
  { level: 26, name: 'Wyjątkowa',       xpRequired: 98500 },
  { level: 27, name: 'Ikona',           xpRequired: 108000 },
  { level: 28, name: 'Mistrzyni',       xpRequired: 118000 },
  { level: 29, name: 'Królowa',         xpRequired: 129000 },
  { level: 30, name: 'Natalia 30',      xpRequired: 140000 },
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
  const now = new Date()
  const diff = now.getTime() - PROJECT_START.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function getDaysRemaining(): number {
  const now = new Date()
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
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
