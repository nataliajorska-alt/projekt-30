import { describe, it, expect } from 'vitest'
import {
  getQuarterKey,
  getQuarterMonths,
  getQuarterDateRange,
  previousQuarterKey,
  formatQuarterPL,
} from '@/lib/quarters'

// Kwartały projektu liczone od 2026-04 (Q1 = kwi–cze), niezależne od kalendarzowych.
// Najważniejszy edge: przejście przez granicę roku (Q4 = sty–mar 2027).

describe('getQuarterKey', () => {
  it('maps months to project quarters within the start year', () => {
    expect(getQuarterKey('2026-04')).toBe('Q1')
    expect(getQuarterKey('2026-06')).toBe('Q1')
    expect(getQuarterKey('2026-07')).toBe('Q2')
    expect(getQuarterKey('2026-09')).toBe('Q2')
    expect(getQuarterKey('2026-10')).toBe('Q3')
    expect(getQuarterKey('2026-12')).toBe('Q3')
  })

  it('handles the year boundary (Q4 = sty–mar 2027, Q5 = kwi 2027)', () => {
    expect(getQuarterKey('2027-01')).toBe('Q4')
    expect(getQuarterKey('2027-03')).toBe('Q4')
    expect(getQuarterKey('2027-04')).toBe('Q5')
  })
})

describe('getQuarterMonths', () => {
  it('returns the 3 months of a quarter', () => {
    expect(getQuarterMonths('Q1')).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(getQuarterMonths('Q2')).toEqual(['2026-07', '2026-08', '2026-09'])
    expect(getQuarterMonths('Q3')).toEqual(['2026-10', '2026-11', '2026-12'])
  })

  it('wraps across the year for Q4', () => {
    expect(getQuarterMonths('Q4')).toEqual(['2027-01', '2027-02', '2027-03'])
  })
})

describe('getQuarterDateRange', () => {
  it('spans first-of-first-month to last-of-last-month', () => {
    expect(getQuarterDateRange('Q1')).toEqual({ start: '2026-04-01', end: '2026-06-30' })
  })

  it('uses the correct last day across the year boundary (mar 31)', () => {
    expect(getQuarterDateRange('Q4')).toEqual({ start: '2027-01-01', end: '2027-03-31' })
  })
})

describe('previousQuarterKey', () => {
  it('returns null for Q1, otherwise the previous quarter', () => {
    expect(previousQuarterKey('Q1')).toBeNull()
    expect(previousQuarterKey('Q2')).toBe('Q1')
    expect(previousQuarterKey('Q5')).toBe('Q4')
  })
})

describe('formatQuarterPL', () => {
  it('formats the month range in Polish (incl. year boundary)', () => {
    expect(formatQuarterPL('Q1')).toBe('kwi–cze 2026')
    expect(formatQuarterPL('Q4')).toBe('sty–mar 2027')
  })
})
