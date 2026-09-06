// Wspólne helpery używane przez kilka komponentów review.
import { PROJECT_START_MONTH } from '@/lib/quarters'

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']
export const PL_MONTH_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

export function formatMonthPL(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${PL_MONTH_NAMES[m - 1]} ${y}`
}

/** Nazwa miesiąca bez roku, małą literą — do zdań („uzupełnij sierpień"). */
export function monthNamePL(key: string): string {
  const m = Number(key.split('-')[1])
  return PL_MONTH_NAMES[m - 1].toLowerCase()
}

/** Klucz miesiąca przesunięty o `delta` miesięcy (−1 = poprzedni, +1 = następny). */
export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/**
 * Miesiące projektu od startu do `upTo` włącznie, rosnąco.
 * Używane przez wybór miesiąca w ceremonii miesięcznej — pozwala uzupełnić
 * zaległy miesiąc, nie tylko bieżący.
 */
export function projectMonthKeys(upTo: string): string[] {
  const months: string[] = []
  let cur = PROJECT_START_MONTH
  // Twardy limit na wypadek dziwnej daty systemowej — projekt trwa 12 miesięcy.
  for (let i = 0; i < 24 && cur <= upTo; i++) {
    months.push(cur)
    cur = shiftMonthKey(cur, 1)
  }
  return months.length > 0 ? months : [upTo]
}

/** Etykieta na pigułce wyboru: „sie", a po przełomie roku „sty '27". */
export function formatMonthChipPL(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const startYear = Number(PROJECT_START_MONTH.split('-')[0])
  const short = PL_MONTH_SHORT[m - 1]
  return y === startYear ? short : `${short} ’${String(y).slice(2)}`
}

export function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startMonth = PL_MONTH_SHORT[start.getMonth()]
  const endMonth = PL_MONTH_SHORT[end.getMonth()]
  if (startMonth === endMonth) return `${start.getDate()}–${end.getDate()} ${startMonth}`
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`
}
