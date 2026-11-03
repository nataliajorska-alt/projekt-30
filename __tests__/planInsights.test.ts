import { describe, it, expect } from 'vitest'
import { computePlanInsights, type InsightInput } from '@/lib/planInsights'
import { APRIL_QUESTS, createQuestBook } from '@/lib/seasonal/aprilData'
import { draftMonth, projectPhase, monthDays, weekdayOf } from '@/lib/monthPlanner'
import type { DailyLog, MonthlyReview } from '@/types'

const book = createQuestBook()
const TODAY = '2026-09-01'
const SETTINGS = { cycleLength: 25, periodLength: 5 }

function base(over: Partial<InsightInput> = {}): InsightInput {
  return {
    today: TODAY, logs: {}, completedIds: [], skips: [], book,
    cycleLogs: [], cycleSettings: SETTINGS, monthlyReviews: [], ...over,
  }
}

const perDay = new Map<string, number>()
for (const q of APRIL_QUESTS) perDay.set(q.date, (perDay.get(q.date) ?? 0) + 1)
const wd = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay()

describe('wnioski do planu', () => {
  it('bez danych — brak zdań i reguły domyślne', () => {
    const r = computePlanInsights(base())
    expect(r.adapt).toEqual({ maxPerDay: 3, lightWeekday: null, focusPillar: expect.anything() })
    expect(r.lines.some(l => l.startsWith('Domykasz 0%'))).toBe(true)
  })

  it('dni z 3 questami się nie domykają → sufit 2', () => {
    const completed = APRIL_QUESTS.filter(q => (perDay.get(q.date) ?? 0) <= 2).map(q => q.id)
    const r = computePlanInsights(base({ completedIds: completed }))
    expect(r.adapt.maxPerDay).toBe(2)
    expect(r.lines.some(l => l.startsWith('Dni z 3 questami domykasz w 0%'))).toBe(true)
    expect(r.adaptNotes[0]).toMatch(/maksymalnie 2/)
  })

  it('najsłabszy dzień tygodnia dostaje lżejszy plan', () => {
    const completed = APRIL_QUESTS.filter(q => wd(q.date) !== 1).map(q => q.id)
    const r = computePlanInsights(base({ completedIds: completed }))
    expect(r.adapt.lightWeekday).toBe(1)
    expect(r.lines.some(l => l.startsWith('Najtrudniejsze są poniedziałki (0%'))).toBe(true)
  })

  it('filar z najniższą oceną ceremonii idzie w centrum uwagi', () => {
    const review: MonthlyReview = {
      month: '2026-08', highlights: 'Bali z mamą', challenges: 'sen', intentionNextMonth: 'struktura',
      pillarsRated: { pozycja: 4, cialo: 2, styl: 4, kapital: 3, kariera: 5, tozsamosc: 4, milosc: 3 },
      xpEarned: 0, savedAt: '',
    }
    const r = computePlanInsights(base({ monthlyReviews: [review] }))
    expect(r.adapt.focusPillar).toBe('cialo')
    expect(r.promptSection).toContain('moja intencja z ceremonii 2026-08: struktura')
    expect(r.promptSection).toContain('co działało (2026-08): Bali z mamą')
  })

  it('powody pominięć trafiają do promptu Twoimi słowami', () => {
    const r = computePlanInsights(base({
      skips: [{ questId: 'aug_04_1', reason: 'nie byłam gotowa', skippedAt: '2026-08-04T10:00:00Z' }],
    }))
    expect(r.promptSection).toContain('„TELEFON DO BLANKI" — nie byłam gotowa')
  })

  it('fazy cyklu i papierosy liczą się z logów', () => {
    const logs: Record<string, DailyLog> = {}
    for (let i = 1; i <= 28; i++) {
      const d = new Date(Date.UTC(2026, 7, 4 + i)).toISOString().slice(0, 10)
      logs[d] = {
        date: d, completedRoutine: [], completedDailyQuests: [], completedSideQuests: [], keptRules: [],
        totalXP: 0, dayMode: 'normal', physicalActivity: i % 2 === 0,
        cigarettes: Array.from({ length: i > 14 ? 2 : 6 }, (_, k) => ({ timestamp: k, hour: 9, weekday: 0 })),
      }
    }
    const completed = APRIL_QUESTS.filter(q => q.date >= '2026-08-02' && q.date <= '2026-08-10').map(q => q.id)
    const r = computePlanInsights(base({
      logs, completedIds: completed,
      cycleLogs: [{ id: 'c', startDate: '2026-07-28', savedAt: '' }, { id: 'c2', startDate: '2026-08-22', savedAt: '' }],
    }))
    expect(r.lines.some(l => l.startsWith('Najlepiej domykasz w fazie owulacja (80%), najsłabiej — okres (0%)'))).toBe(true)
    expect(r.promptSection).toContain('domykanie questów wg fazy: folikularna 52%, owulacja 80%, lutealna 11%, okres 0%')
    expect(r.lines.some(l => /^Papierosy: 2,\d dziennie w ostatnich 14 dniach, w dół z 6,0\.$/.test(l))).toBe(true)
    expect(r.promptSection).toMatch(/pn \d+%, wt \d+%, śr/)
  })
})

describe('szkic dopasowany do danych', () => {
  const phaseFor = projectPhase('2026-07-28', SETTINGS)
  const fixed = (d: string) => weekdayOf(d) === 0 || ['01', '15', '29', '30'].includes(d.slice(8))

  it('sufit 2 i lżejszy wtorek', () => {
    const qs = draftMonth({ monthKey: '2026-11', phaseFor, adapt: { maxPerDay: 2, lightWeekday: 2, focusPillar: null } })
    for (const d of monthDays('2026-11').filter(d => !fixed(d))) {
      const n = qs.filter(q => q.date === d).length
      expect(n).toBeLessThanOrEqual(weekdayOf(d) === 2 ? 1 : 2)
    }
  })

  it('filar w centrum uwagi pojawia się częściej', () => {
    const count = (focus: 'styl' | null) =>
      draftMonth({ monthKey: '2026-12', phaseFor: () => null, adapt: { maxPerDay: 3, lightWeekday: null, focusPillar: focus } })
        .filter(q => q.pillar === 'styl').length
    expect(count('styl')).toBeGreaterThan(count(null))
  })
})
