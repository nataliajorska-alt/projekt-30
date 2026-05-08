import { describe, it, expect } from 'vitest'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import type { RoutineItem } from '@/types'

const items: RoutineItem[] = [
  { id: 'ess1', text: 'Niezbędne 1', type: 'morning', xp: 10, priority: 'essential', category: 'hygiene' },
  { id: 'ess2', text: 'Niezbędne mental', type: 'morning', xp: 10, priority: 'essential', category: 'mental' },
  { id: 'hyg',  text: 'Higiena',     type: 'morning', xp: 10, priority: 'normal', category: 'hygiene' },
  { id: 'spi',  text: 'Duchowe',     type: 'morning', xp: 10, priority: 'normal', category: 'spiritual' },
  { id: 'men',  text: 'Mentalne',    type: 'morning', xp: 10, priority: 'normal', category: 'mental' },
  { id: 'phy',  text: 'Fizyczne',    type: 'morning', xp: 10, priority: 'normal', category: 'physical' },
  { id: 'bon',  text: 'Bonus',       type: 'morning', xp: 10, priority: 'bonus', category: 'hygiene' },
  { id: 'nocat',text: 'Bez kategorii',type: 'morning',xp: 10, priority: 'normal' },
]

const ids = (arr: RoutineItem[]) => arr.map(i => i.id).sort()

describe('filterItemsForMinimumDay', () => {
  it('always excludes bonus items regardless of reason', () => {
    for (const reason of ['choroba', 'okres', 'zly_nastroj', 'przemeczenie', 'inne'] as const) {
      const out = filterItemsForMinimumDay(items, reason)
      expect(out.find(i => i.id === 'bon')).toBeUndefined()
    }
  })

  it('always keeps essential items regardless of reason', () => {
    for (const reason of ['choroba', 'okres', 'zly_nastroj', 'przemeczenie', 'inne'] as const) {
      const out = filterItemsForMinimumDay(items, reason)
      expect(out.find(i => i.id === 'ess1')).toBeDefined()
      expect(out.find(i => i.id === 'ess2')).toBeDefined()
    }
  })

  it('choroba: keeps essential + hygiene + spiritual, drops mental and physical', () => {
    expect(ids(filterItemsForMinimumDay(items, 'choroba'))).toEqual(
      ['ess1', 'ess2', 'hyg', 'spi'].sort()
    )
  })

  it('okres: same as choroba — hygiene + spiritual only', () => {
    expect(ids(filterItemsForMinimumDay(items, 'okres'))).toEqual(
      ['ess1', 'ess2', 'hyg', 'spi'].sort()
    )
  })

  it('zly_nastroj: keeps hygiene + spiritual + mental, drops physical', () => {
    expect(ids(filterItemsForMinimumDay(items, 'zly_nastroj'))).toEqual(
      ['ess1', 'ess2', 'hyg', 'spi', 'men', 'nocat'].sort()
    )
  })

  it('przemeczenie: only hygiene (besides essential)', () => {
    expect(ids(filterItemsForMinimumDay(items, 'przemeczenie'))).toEqual(
      ['ess1', 'ess2', 'hyg'].sort()
    )
  })

  it('inne: keeps only essential items (no extra categories)', () => {
    expect(ids(filterItemsForMinimumDay(items, 'inne'))).toEqual(
      ['ess1', 'ess2'].sort()
    )
  })

  it('items without explicit category default to "mental"', () => {
    // 'nocat' jest w wynikach tylko gdy 'mental' jest dozwolone, czyli zly_nastroj
    expect(filterItemsForMinimumDay(items, 'zly_nastroj').find(i => i.id === 'nocat')).toBeDefined()
    expect(filterItemsForMinimumDay(items, 'choroba').find(i => i.id === 'nocat')).toBeUndefined()
    expect(filterItemsForMinimumDay(items, 'przemeczenie').find(i => i.id === 'nocat')).toBeUndefined()
  })

  it('returns an empty array when given an empty input', () => {
    expect(filterItemsForMinimumDay([], 'choroba')).toEqual([])
  })

  it('does not mutate the input array', () => {
    const snapshot = JSON.parse(JSON.stringify(items))
    filterItemsForMinimumDay(items, 'choroba')
    expect(items).toEqual(snapshot)
  })
})
