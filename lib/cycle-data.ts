export interface CyclePhase {
  id: 'menstruacja' | 'folikularna' | 'owulacyjna' | 'lutealna'
  name: string
  days: [number, number]  // [od, do] — przybliżone
  emoji: string
  color: string
  bgColor: string
  energy: 'niska' | 'rosnąca' | 'szczyt' | 'opadająca'
  description: string
  tips: string[]
  questHint: string
  suggestMinimum: boolean
}

export const CYCLE_PHASES: CyclePhase[] = [
  {
    id: 'menstruacja',
    name: 'Menstruacja',
    days: [1, 5],
    emoji: '🌑',
    color: '#8B3A3A',
    bgColor: '#F5EAEA',
    energy: 'niska',
    description: 'Czas na odpoczynek i regenerację. Ciało pracuje intensywnie — daj mu na to przestrzeń.',
    tips: [
      'Aktywuj tryb minimum bez wyrzutów sumienia',
      'Ciepłe napoje, komfort, spokój',
      'Nie planuj trudnych rozmów ani decyzji',
    ],
    questHint: 'Wybieraj łatwe side questy lub odpuść zupełnie.',
    suggestMinimum: true,
  },
  {
    id: 'folikularna',
    name: 'Folikularna',
    days: [6, 13],
    emoji: '🌱',
    color: '#3D5247',
    bgColor: '#EBF2EE',
    energy: 'rosnąca',
    description: 'Energia rośnie. Świetny czas na naukę, nowe projekty i realizację planów.',
    tips: [
      'Zacznij coś, co odkładałaś',
      'Dobry czas na trudne rozmowy i decyzje',
      'Twórcze projekty, kursy, czytanie',
    ],
    questHint: 'Idealna faza na nowe wyzwania i questy z filaru Tożsamość/Kariera.',
    suggestMinimum: false,
  },
  {
    id: 'owulacyjna',
    name: 'Owulacyjna',
    days: [14, 17],
    emoji: '☀️',
    color: '#B8963E',
    bgColor: '#FDF6E8',
    energy: 'szczyt',
    description: 'Szczyt energii, magnetyzmu i pewności siebie. Twój najbardziej "wyjściowy" czas.',
    tips: [
      'Trudne questy — teraz możesz więcej',
      'Spotkania, networking, randki, prezentacje',
      'Aktywność fizyczna na wyższym poziomie',
    ],
    questHint: 'Czas na najtrudniejsze questy i aktywności społeczne. Magnetyzm jest najwyższy.',
    suggestMinimum: false,
  },
  {
    id: 'lutealna',
    name: 'Lutealna',
    days: [18, 28],
    emoji: '🌘',
    color: '#5A3E6B',
    bgColor: '#F0EAF5',
    energy: 'opadająca',
    description: 'Energia opada, wrażliwość rośnie. Czas na refleksję, nie na nowe inicjatywy.',
    tips: [
      'Kończ rzeczy, nie zaczynaj nowych',
      'Dbaj szczególnie o rutynę wieczorną',
      'Bądź łagodna dla siebie w drugiej połowie tej fazy',
    ],
    questHint: 'Side questy z filaru Miłość i Pozycja wewnętrzna. Pod koniec fazy — minimum mode.',
    suggestMinimum: false,
  },
]

export interface CycleSettings {
  cycleLength: number   // długość cyklu w dniach (domyślnie 28)
  periodLength: number  // długość okresu w dniach (domyślnie 5)
}

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  cycleLength: 28,
  periodLength: 5,
}

export function computePhaseRanges(s: CycleSettings): Record<CyclePhase['id'], [number, number]> {
  const ovulation = Math.max(s.periodLength + 3, s.cycleLength - 14)
  return {
    menstruacja: [1, s.periodLength],
    folikularna: [s.periodLength + 1, Math.max(s.periodLength + 1, ovulation - 2)],
    owulacyjna:  [Math.max(s.periodLength + 2, ovulation - 1), ovulation + 2],
    lutealna:    [ovulation + 3, s.cycleLength],
  }
}

export interface CycleLog {
  id: string
  startDate: string  // YYYY-MM-DD
  savedAt: string
  docId?: string     // Firestore document ID (do usuwania)
}

export function getCycleDay(startDate: string, today?: string): number {
  const start = new Date(startDate)
  const now = today ? new Date(today) : new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff + 1  // dzień 1 = pierwszy dzień
}

export function getPhaseForDay(cycleDay: number, settings?: CycleSettings): CyclePhase {
  const s = settings ?? DEFAULT_CYCLE_SETTINGS
  const ranges = computePhaseRanges(s)
  for (const phase of CYCLE_PHASES) {
    const [from, to] = ranges[phase.id]
    if (cycleDay >= from && cycleDay <= to) return phase
  }
  return CYCLE_PHASES[3]
}

export function getPhaseForDate(
  startDate: string,
  date?: string,
  settings?: CycleSettings
): { phase: CyclePhase; cycleDay: number } | null {
  const day = getCycleDay(startDate, date)
  if (day < 1 || day > (settings?.cycleLength ?? 28) + 7) return null
  return { phase: getPhaseForDay(day, settings), cycleDay: day }
}

export function getPhaseIdForDate(
  cycleLogs: CycleLog[],
  dateKey: string,
  settings?: CycleSettings
): CyclePhase['id'] | null {
  const sorted = [...cycleLogs].sort((a, b) => b.startDate.localeCompare(a.startDate))
  const active = sorted.find(c => c.startDate <= dateKey)
  if (!active) return null
  const result = getPhaseForDate(active.startDate, dateKey, settings)
  return result?.phase.id ?? null
}
