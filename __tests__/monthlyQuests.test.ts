import { describe, it, expect } from 'vitest'
import {
  APRIL_QUESTS,
  getAprilQuestsForDate,
  getOverdueAprilQuests,
  getPostponedQuestsForDate,
  findMonthlyQuest,
  isPlannedMonth,
} from '@/lib/seasonal/aprilData'
import { getEvergreenQuestsForDate } from '@/lib/seasonal/evergreenData'

describe('miesiące z planem i bez', () => {
  it('kwiecień–sierpień mają plan, listopad nie', () => {
    expect(isPlannedMonth('2026-08')).toBe(true)
    expect(isPlannedMonth('2026-11')).toBe(false)
  })

  it('dzień z planem zwraca tylko rozpisane questy', () => {
    const qs = getAprilQuestsForDate('2026-08-04')
    expect(qs.map(q => q.id)).toEqual(['aug_04_1', 'aug_04_2', 'aug_04_3'])
  })

  it('miesiąc bez planu dostaje 2 stałe propozycje dziennie', () => {
    for (const d of ['2026-09-15', '2026-11-03', '2027-01-20']) {
      const qs = getAprilQuestsForDate(d)
      expect(qs).toHaveLength(2)
      expect(qs.every(q => q.date === d && q.id.startsWith(`ev_${d}_`))).toBe(true)
    }
  })

  it('przed startem projektu nic', () => {
    expect(getAprilQuestsForDate('2026-03-30')).toEqual([])
  })
})

describe('stałe propozycje', () => {
  it('rytm 3/3: aktywność w pn, śr, pt', () => {
    // 2.11.2026 to poniedziałek
    const week = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']
    const activity = week.map(d => getEvergreenQuestsForDate(d)[0].title.startsWith('Aktywność'))
    expect(activity).toEqual([true, false, true, false, true])
  })

  it('niedziela = plan tygodnia, ostatni dzień miesiąca = domknięcie', () => {
    expect(getEvergreenQuestsForDate('2026-11-08').map(q => q.title)).toContain('Plan tygodnia na kartce')
    expect(getEvergreenQuestsForDate('2026-11-30').map(q => q.title)).toContain('Domknięcie miesiąca')
  })

  it('drugi quest nie powtarza się dzień po dniu', () => {
    for (let d = 2; d < 28; d++) {
      const a = getEvergreenQuestsForDate(`2026-11-${String(d).padStart(2, '0')}`)[1].id.split('_').pop()
      const b = getEvergreenQuestsForDate(`2026-11-${String(d + 1).padStart(2, '0')}`)[1].id.split('_').pop()
      expect(a).not.toBe(b)
    }
  })

  it('id odtwarza quest (przeniesienia, eksport)', () => {
    const [q] = getEvergreenQuestsForDate('2026-11-03')
    expect(findMonthlyQuest(q.id)).toEqual(q)
    expect(findMonthlyQuest('aug_04_1')?.title).toBe('TELEFON DO BLANKI')
    expect(findMonthlyQuest('ev_2026-11-03_nieistnieje')).toBeUndefined()
  })

  it('przeniesiona stała propozycja pojawia się w dniu docelowym', () => {
    const [q] = getEvergreenQuestsForDate('2026-11-03')
    const moved = getPostponedQuestsForDate('2026-11-05', [
      { questId: q.id, originalDate: q.date, targetDate: '2026-11-05', postponedAt: '' },
    ])
    expect(moved.map(m => m.id)).toEqual([q.id])
  })
})

describe('zaległe', () => {
  it('tylko z ostatnich 7 dni', () => {
    const overdue = getOverdueAprilQuests('2026-08-10', [], [], [])
    expect(overdue.length).toBeGreaterThan(0)
    expect(overdue.every(q => q.date >= '2026-08-03' && q.date < '2026-08-10')).toBe(true)
  })

  it('w listopadzie sierpień już nie wisi', () => {
    expect(getOverdueAprilQuests('2026-11-03', [], [], [])).toEqual([])
  })

  it('termin liczony od daty przeniesienia', () => {
    const old = APRIL_QUESTS.find(q => q.id === 'aug_04_1')!
    const overdue = getOverdueAprilQuests('2026-11-03', [], [], [
      { questId: old.id, originalDate: old.date, targetDate: '2026-11-01', postponedAt: '' },
    ])
    expect(overdue.map(q => q.id)).toEqual([old.id])
  })
})
