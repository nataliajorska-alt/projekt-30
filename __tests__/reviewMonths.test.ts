import { describe, it, expect } from 'vitest'
import {
  projectMonthKeys,
  shiftMonthKey,
  formatMonthChipPL,
  monthNamePL,
  formatMonthPL,
} from '@/app/review/_components/shared'

describe('shiftMonthKey', () => {
  it('przesuwa w przód i w tył w obrębie roku', () => {
    expect(shiftMonthKey('2026-08', 1)).toBe('2026-09')
    expect(shiftMonthKey('2026-08', -1)).toBe('2026-07')
  })

  it('przeskakuje przez przełom roku', () => {
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01')
    expect(shiftMonthKey('2027-01', -1)).toBe('2026-12')
    expect(shiftMonthKey('2026-04', 12)).toBe('2027-04')
  })
})

describe('projectMonthKeys', () => {
  it('daje wszystkie miesiące projektu od startu do wskazanego włącznie', () => {
    expect(projectMonthKeys('2026-09')).toEqual([
      '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09',
    ])
  })

  it('w pierwszym miesiącu projektu zwraca tylko ten miesiąc', () => {
    expect(projectMonthKeys('2026-04')).toEqual(['2026-04'])
  })

  it('obejmuje przełom roku aż do końca projektu', () => {
    const months = projectMonthKeys('2027-03')
    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2026-04')
    expect(months[11]).toBe('2027-03')
  })

  it('dla daty sprzed startu projektu zwraca sam wskazany miesiąc', () => {
    expect(projectMonthKeys('2026-01')).toEqual(['2026-01'])
  })
})

describe('etykiety miesięcy', () => {
  it('skraca miesiąc, a po przełomie roku dokleja rocznik', () => {
    expect(formatMonthChipPL('2026-08')).toBe('sie')
    expect(formatMonthChipPL('2027-01')).toBe('sty ’27')
  })

  it('podaje nazwę do zdania i pełny podpis', () => {
    expect(monthNamePL('2026-08')).toBe('sierpień')
    expect(formatMonthPL('2026-08')).toBe('Sierpień 2026')
  })
})
