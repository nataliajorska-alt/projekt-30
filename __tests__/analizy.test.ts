import { describe, it, expect } from 'vitest'
import { plainInsight, emphasisParts } from '@/lib/plainInsight'
import {
  summarizePeriod, comparePeriods, addDays, routineCompletionRate, pctChange, trendOf,
} from '@/lib/periodSummary'
import { dirVerdict, leverSentence, groupLevers } from '@/lib/patternVerdicts'
import type { LiftInsight, CarryoverInsight } from '@/lib/correlations'
import type { DailyLog } from '@/types'

function log(date: string, over: Partial<DailyLog> = {}): DailyLog {
  return {
    date,
    completedRoutine: [],
    completedDailyQuests: [],
    completedSideQuests: [],
    keptRules: [],
    totalXP: 0,
    dayMode: 'normal',
    ...over,
  }
}

describe('plainInsight — statystyka na zwykły język', () => {
  it('wycina nawiasy z n=, ρ i ε² oraz „Effect size"', () => {
    expect(plainInsight('W dniach z ruchem średni mood był o 0,3 pkt wyższy (n=120). Effect size 0,23 — słaba. Ruch i mood idą tu w parze.'))
      .toBe('W dniach z ruchem średni nastrój był o 0,3 pkt wyższy. Ruch i nastrój idą tu w parze.')
    expect(plainInsight('Wraz z dłuższą passą Twój średni mood rośnie (ρ=0,19, n=182, słaba siła). To znaczy: rytm.'))
      .toBe('Wraz z dłuższą passą Twój średni nastrój rośnie. To znaczy: rytm.')
    expect(plainInsight('Energia najwyższa w fazie owulacyjnej (3,6), najniższa w lutealnej (2,9, ε²=0,08, n=40 dni). Warto.'))
      .toBe('Energia najwyższa w fazie owulacyjnej (3,6), najniższa w lutealnej. Warto.')
  })

  it('usuwa „Siła efektu …" i „Effect … — …"', () => {
    expect(plainInsight('Nastrój był wyższy (3,4 vs 3,0, n=50). Siła efektu słaba. Może działa.'))
      .toBe('Nastrój był wyższy. Może działa.')
    expect(plainInsight('Następny dzień miał więcej XP (n=30). Effect 0,31 — średnia. Reset czy zapaść?'))
      .toBe('Następny dzień miał więcej XP. Reset czy zapaść?')
  })

  it('zostawia zwykły tekst bez zmian', () => {
    const t = 'Twój nastrój trzyma się stabilnie w okolicy 3,2/5.'
    expect(plainInsight(t)).toBe(t)
  })

  it('rozbija *akcent* na fragmenty', () => {
    expect(emphasisParts('A może to nie *kontakt* w ogóle?')).toEqual([
      { text: 'A może to nie ', em: false },
      { text: 'kontakt', em: true },
      { text: ' w ogóle?', em: false },
    ])
  })
})

describe('periodSummary — okres vs poprzedni okres', () => {
  it('addDays przechodzi przez granice miesięcy', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('rutyna liczona względem trybu dnia', () => {
    expect(routineCompletionRate(log('2026-11-01', { completedRoutine: Array(8).fill('x') }))).toBe(50)
    expect(routineCompletionRate(log('2026-11-01', { dayMode: 'minimum', completedRoutine: Array(6).fill('x') }))).toBe(100)
  })

  it('liczy XP na dzień kalendarzowy, dni z zapisem i nastrój', () => {
    const logs = {
      '2026-11-20': log('2026-11-20', { totalXP: 300, moodCheckIns: [{ mood: 4, energy: 3, state: 'calm', timestamp: 1 }] }),
      '2026-11-22': log('2026-11-22', { totalXP: 100, moodCheckIns: [{ mood: 2, energy: 3, state: 'fog', timestamp: 2 }] }),
    }
    const p = summarizePeriod(logs, '2026-11-23', 7)
    expect(p.from).toBe('2026-11-17')
    expect(p.daysLogged).toBe(2)
    expect(p.xpTotal).toBe(400)
    expect(p.xpPerDay).toBe(57)
    expect(p.mood).toBe(3)
    expect(p.bestDay).toEqual({ date: '2026-11-20', xp: 300 })
    expect(p.dailyXP).toHaveLength(7)
    expect(p.dailyMood.filter(v => v !== null)).toEqual([4, 2])
  })

  it('okno kończy się wczoraj, a poprzedni okres przylega do niego', () => {
    const logs: Record<string, DailyLog> = {}
    for (let i = 0; i < 14; i++) {
      const k = addDays('2026-11-11', i)
      logs[k] = log(k, { totalXP: 100 })
    }
    logs['2026-11-25'] = log('2026-11-25', { totalXP: 5 }) // dziś — niedokończony
    const c = comparePeriods(logs, 7, '2026-11-25')
    expect(c.current.to).toBe('2026-11-24')
    expect(c.current.from).toBe('2026-11-18')
    expect(c.previous.to).toBe('2026-11-17')
    expect(c.current.xpPerDay).toBe(100)
    expect(c.hasPrevious).toBe(true)
  })

  it('bez zapisów przed okresem nie udaje porównania', () => {
    const logs = { '2026-11-24': log('2026-11-24', { totalXP: 50 }) }
    expect(comparePeriods(logs, 7, '2026-11-25').hasPrevious).toBe(false)
  })

  it('pctChange i trendOf', () => {
    expect(pctChange(150, 100)).toBe(50)
    expect(pctChange(10, 0)).toBeNull()
    expect(trendOf(3.4, 3.0, 0.15)).toBe('up')
    expect(trendOf(3.05, 3.0, 0.15)).toBe('flat')
    expect(trendOf(null, 3.0, 0.15)).toBe('flat')
  })
})

describe('patternVerdicts — dźwignie zwykłym językiem', () => {
  const lift = (id: string, w: number | null, wo: number | null, enough = true): LiftInsight => ({
    type: 'lift', id, icon: '', title: id, subtitle: '', metric: 'mood',
    withLabel: 'z', withoutLabel: 'bez', withLift: w, withoutLift: wo,
    withCount: 10, withoutCount: 10, hasEnoughData: enough,
  })
  const carry = (w: number, wo: number): CarryoverInsight => ({
    type: 'carryover', id: 'carryover_evening_energy', icon: '', title: '', subtitle: '', metric: 'energy',
    withLabel: '', withoutLabel: '', withMorning: w, withoutMorning: wo,
    withCount: 10, withoutCount: 10, hasEnoughData: true,
  })

  it('klasyfikuje werdykty', () => {
    expect(dirVerdict(lift('a', 0.6, 0.1))).toBe('works')
    expect(dirVerdict(lift('b', 0.1, 0.7))).toBe('reverse')
    expect(dirVerdict(lift('c', 0.3, 0.2))).toBe('weak')
    expect(dirVerdict(lift('d', 0.6, 0.1, false))).toBe('nodata')
  })

  it('zdania bez znaku w środku i bez podwójnego przeczenia', () => {
    expect(leverSentence(lift('a', 0.6, 0.1))).toBe('w te dni nastrój rośnie w ciągu dnia o 0,5 pkt bardziej niż bez tego.')
    expect(leverSentence(lift('b', 0.2, 0.8))).toBe('w te dni nastrój rośnie w ciągu dnia o 0,6 pkt mniej niż bez tego.')
    expect(leverSentence(carry(3.4, 3.0))).toBe('następnego ranka energia jest średnio o 0,4 pkt wyższa.')
  })

  it('grupuje i sortuje od najsilniejszego efektu', () => {
    const g = groupLevers([lift('a', 0.5, 0.2), lift('b', 0.1, 0.9), lift('c', 1.0, 0.1), lift('d', null, 0.1)])
    expect(g.works.map(i => i.id)).toEqual(['c', 'a'])
    expect(g.reverse.map(i => i.id)).toEqual(['b'])
    expect(g.ranked[0].id).toBe('c')
    expect(g.noData.map(i => i.id)).toEqual(['d'])
  })
})
