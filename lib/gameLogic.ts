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
  heartBlock: 200,
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

export function tomorrowKey(): string {
  const d = getEffectiveNow()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function tomorrowDate(): Date {
  const d = getEffectiveNow()
  d.setDate(d.getDate() + 1)
  return d
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

// ── Garden stages — botaniczne sceny dopasowane do poziomu ────────
export interface GardenStage {
  emoji: string
  stageName: string
  desc: string
  bg: string
  accentColor: string
  maxLevel: number   // ostatni level w tym stage'u
}

const GARDEN_STAGES: GardenStage[] = [
  { maxLevel: 2,  emoji: '🌰',   stageName: 'Nasienie',       desc: 'Wszystko wielkie zaczyna się od małego ziarnka.',                 bg: 'from-stone-50 to-parchment',      accentColor: '#8B6914' },
  { maxLevel: 4,  emoji: '🌱',   stageName: 'Kiełek',         desc: 'Pierwsze pędy przebijają się przez ziemię.',                      bg: 'from-green-50/60 to-ivory',       accentColor: '#3d6b2b' },
  { maxLevel: 6,  emoji: '🌿',   stageName: 'Łodyżka',        desc: 'Korzenie się ugruntowują, liście złapały słońce.',                bg: 'from-emerald-50/50 to-ivory',     accentColor: '#2d5a20' },
  { maxLevel: 9,  emoji: '🪴',   stageName: 'Roślina',        desc: 'Jesteś silna, zakorzeniona i wyraźna.',                           bg: 'from-green-50/40 to-parchment',   accentColor: '#3d6b2b' },
  { maxLevel: 12, emoji: '🌷',   stageName: 'Pąk',            desc: 'Coś bardzo pięknego właśnie się zbliża.',                         bg: 'from-pink-50/40 to-ivory',        accentColor: '#c06080' },
  { maxLevel: 15, emoji: '🌸',   stageName: 'Pierwszy kwiat', desc: 'Rozkwitasz — i warto było na to czekać.',                         bg: 'from-pink-50/50 to-parchment',    accentColor: '#d4698c' },
  { maxLevel: 18, emoji: '🌺',   stageName: 'Pełen rozkwit',  desc: 'Piękno w pełnej, niepowstrzymanej ekspresji.',                    bg: 'from-rose-50/50 to-ivory',        accentColor: '#c0392b' },
  { maxLevel: 21, emoji: '🌹',   stageName: 'Róża',           desc: 'Klasyczna elegancja, silna i nieodparta.',                        bg: 'from-rose-50/60 to-parchment',    accentColor: '#9b2335' },
  { maxLevel: 24, emoji: '💐',   stageName: 'Bukiet',         desc: 'Otaczasz się pięknem, które sama stworzyłaś.',                    bg: 'from-purple-50/30 to-ivory',      accentColor: '#7c5cbf' },
  { maxLevel: 27, emoji: '🌳',   stageName: 'Drzewo',         desc: 'Głęboko zakorzeniona siła, widoczna z daleka.',                   bg: 'from-emerald-50/40 to-parchment', accentColor: '#1a5c2a' },
  { maxLevel: 29, emoji: '🌿✨', stageName: 'Ogród Eden',     desc: 'Na samym progu finału. Jeden krok dzieli Cię od wszystkiego.',    bg: 'from-gold-pale to-ivory',         accentColor: '#B8963E' },
  { maxLevel: 30, emoji: '✨',   stageName: 'Natalia 30',     desc: 'Osiągnęłaś wszystko, co zaplanowałaś. To jest Ty.',               bg: 'from-gold-pale to-parchment',     accentColor: '#B8963E' },
]

export function getGardenStage(level: number): GardenStage {
  return GARDEN_STAGES.find(s => level <= s.maxLevel) ?? GARDEN_STAGES[GARDEN_STAGES.length - 1]
}

export function getNextGardenStage(level: number): GardenStage | null {
  const idx = GARDEN_STAGES.findIndex(s => level <= s.maxLevel)
  if (idx === -1 || idx === GARDEN_STAGES.length - 1) return null
  return GARDEN_STAGES[idx + 1]
}

// Zwraca % postępu (0-100) do XP wymaganego na PIERWSZY level kolejnego stage'a.
// Liczone od XP poprzedniego "progu stage'a" (czyli pierwszego levelu obecnego stage'a).
// ── Pace vs harmonogram ────────────────────────────────────────────
// Liniowe tempo: 200 000 XP / 365 dni ≈ 548 XP/dzień.
// Pozwala odpowiedzieć na pytanie "czy jestem na track, do tyłu, czy przed planem?"
export interface PaceInfo {
  expectedXP: number
  actualXP: number
  diffXP: number      // dodatnie = przed planem, ujemne = opóźnienie
  diffDays: number    // różnica wyrażona w dniach harmonogramu
  status: 'ahead' | 'on-track' | 'behind'
  pctOfExpected: number  // 0-… ile % oczekiwanego ma zebrane (bez sufitu)
}

const XP_PER_DAY = 200_000 / TOTAL_DAYS

export function getPace(actualXP: number): PaceInfo {
  const elapsed = getDaysElapsed()
  // Pierwszy dzień projektu = elapsed 0; tempo liczymy od dnia 1.
  const expectedXP = Math.round(Math.max(0, elapsed) * XP_PER_DAY)
  const diffXP = actualXP - expectedXP
  const diffDays = Math.round(diffXP / XP_PER_DAY)
  // Tolerancja ±0.5 dnia harmonogramu — żeby drobne wahania nie krzyczały "do tyłu".
  let status: PaceInfo['status'] = 'on-track'
  if (diffDays >= 1) status = 'ahead'
  else if (diffDays <= -1) status = 'behind'
  const pctOfExpected = expectedXP > 0 ? Math.round((actualXP / expectedXP) * 100) : 100
  return { expectedXP, actualXP, diffXP, diffDays, status, pctOfExpected }
}

export function getStageProgress(xp: number): number {
  const current = getLevelFromXP(xp)
  const stage = getGardenStage(current.level)
  const stageIdx = GARDEN_STAGES.indexOf(stage)
  if (stageIdx === GARDEN_STAGES.length - 1) return 100  // ostatni stage

  const stageStartLevel = stageIdx === 0 ? 1 : GARDEN_STAGES[stageIdx - 1].maxLevel + 1
  const nextStageStartLevel = stage.maxLevel + 1

  const stageStartXP = LEVELS.find(l => l.level === stageStartLevel)?.xpRequired ?? 0
  const nextStageStartXP = LEVELS.find(l => l.level === nextStageStartLevel)?.xpRequired ?? 200000

  const range = nextStageStartXP - stageStartXP
  const earned = xp - stageStartXP
  return Math.max(0, Math.min(100, Math.round((earned / range) * 100)))
}
