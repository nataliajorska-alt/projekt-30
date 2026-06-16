import { describe, it, expect } from 'vitest'
import {
  computePhaseRanges,
  getCycleDay,
  getPhaseForDay,
  getPhaseForDate,
  getPhaseIdForDate,
  DEFAULT_CYCLE_SETTINGS,
} from '@/lib/cycle-data'

describe('computePhaseRanges (default 28/5)', () => {
  it('partitions the cycle into 4 contiguous phases', () => {
    const r = computePhaseRanges(DEFAULT_CYCLE_SETTINGS)
    expect(r.menstruacja).toEqual([1, 5])
    expect(r.folikularna).toEqual([6, 12])
    expect(r.owulacyjna).toEqual([13, 16])
    expect(r.lutealna).toEqual([17, 28])
  })

  it('adapts ovulation/phases to a longer cycle', () => {
    // ovulation = max(periodLength+3=9, cycleLength-14=18) = 18
    const r = computePhaseRanges({ cycleLength: 32, periodLength: 6 })
    expect(r.menstruacja).toEqual([1, 6])
    expect(r.owulacyjna[1]).toBe(20) // ovulation + 2
    expect(r.lutealna).toEqual([21, 32])
  })
})

describe('getCycleDay', () => {
  it('is 1 on the start date and counts forward', () => {
    expect(getCycleDay('2026-06-01', '2026-06-01')).toBe(1)
    expect(getCycleDay('2026-06-01', '2026-06-05')).toBe(5)
    expect(getCycleDay('2026-06-01', '2026-06-28')).toBe(28)
  })
})

describe('getPhaseForDay', () => {
  it('maps days to phases (default cycle)', () => {
    expect(getPhaseForDay(1).id).toBe('menstruacja')
    expect(getPhaseForDay(5).id).toBe('menstruacja')
    expect(getPhaseForDay(6).id).toBe('folikularna')
    expect(getPhaseForDay(13).id).toBe('owulacyjna')
    expect(getPhaseForDay(16).id).toBe('owulacyjna')
    expect(getPhaseForDay(17).id).toBe('lutealna')
    expect(getPhaseForDay(28).id).toBe('lutealna')
  })

  it('falls back to lutealna past the cycle length', () => {
    expect(getPhaseForDay(35).id).toBe('lutealna')
  })
})

describe('getPhaseForDate', () => {
  it('returns phase + cycle day inside the window', () => {
    const r = getPhaseForDate('2026-06-01', '2026-06-03')
    expect(r?.phase.id).toBe('menstruacja')
    expect(r?.cycleDay).toBe(3)
  })

  it('returns null before the start or far past the cycle', () => {
    expect(getPhaseForDate('2026-06-01', '2026-05-30')).toBeNull()
    expect(getPhaseForDate('2026-06-01', '2026-08-01')).toBeNull()
  })
})

describe('getPhaseIdForDate', () => {
  const logs = [
    { id: 'a', startDate: '2026-05-01', savedAt: '' },
    { id: 'b', startDate: '2026-06-01', savedAt: '' },
  ]

  it('picks the most recent log on/before the date', () => {
    expect(getPhaseIdForDate(logs, '2026-06-03')).toBe('menstruacja')
    expect(getPhaseIdForDate(logs, '2026-06-10')).toBe('folikularna')
    expect(getPhaseIdForDate(logs, '2026-05-10')).toBe('folikularna')
  })

  it('returns null when no log is on/before the date', () => {
    expect(getPhaseIdForDate([{ id: 'a', startDate: '2026-06-01', savedAt: '' }], '2026-05-01')).toBeNull()
    expect(getPhaseIdForDate([], '2026-06-01')).toBeNull()
  })
})
