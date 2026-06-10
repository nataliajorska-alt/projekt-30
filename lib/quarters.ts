// Kwartały projektu — okna 3-miesięczne liczone od startu (PROJECT_START_MONTH),
// niezależne od kwartałów kalendarzowych. Q1 = kwiecień–czerwiec 2026 itd.
// Używane przez przegląd kwartalny (/review) — patrz QuarterlyReviewForm.

import { getMonthKey, getEffectiveNow } from './gameLogic'

export const PROJECT_START_MONTH = '2026-04'

const PL_MONTH_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']

function quarterIndex(quarterKey: string): number {
  return Number(quarterKey.slice(1))
}

export function getQuarterKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const [sy, sm] = PROJECT_START_MONTH.split('-').map(Number)
  const monthsSinceStart = (y - sy) * 12 + (m - sm)
  return `Q${Math.floor(monthsSinceStart / 3) + 1}`
}

export function getCurrentQuarterKey(): string {
  return getQuarterKey(getMonthKey(getEffectiveNow()))
}

export function getQuarterMonths(quarterKey: string): string[] {
  const idx = quarterIndex(quarterKey)
  const [sy, sm] = PROJECT_START_MONTH.split('-').map(Number)
  const startOffset = (idx - 1) * 3
  const months: string[] = []
  for (let i = 0; i < 3; i++) {
    const total = sm - 1 + startOffset + i
    const y = sy + Math.floor(total / 12)
    const m = (total % 12) + 1
    months.push(`${y}-${String(m).padStart(2, '0')}`)
  }
  return months
}

function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// Zwraca [pierwszy dzień pierwszego miesiąca, ostatni dzień ostatniego miesiąca] kwartału.
export function getQuarterDateRange(quarterKey: string): { start: string; end: string } {
  const months = getQuarterMonths(quarterKey)
  const first = months[0]
  const last = months[months.length - 1]
  return {
    start: `${first}-01`,
    end: `${last}-${String(getDaysInMonth(last)).padStart(2, '0')}`,
  }
}

export function previousQuarterKey(quarterKey: string): string | null {
  const idx = quarterIndex(quarterKey)
  return idx > 1 ? `Q${idx - 1}` : null
}

export function formatQuarterPL(quarterKey: string): string {
  const months = getQuarterMonths(quarterKey)
  const [, fm] = months[0].split('-').map(Number)
  const [ly, lm] = months[months.length - 1].split('-').map(Number)
  return `${PL_MONTH_SHORT[fm - 1]}–${PL_MONTH_SHORT[lm - 1]} ${ly}`
}
