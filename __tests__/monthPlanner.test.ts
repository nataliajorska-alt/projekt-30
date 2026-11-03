import { describe, it, expect } from 'vitest'
import {
  projectPhase, draftMonth, buildClaudePrompt, parsePlanText, monthDays, weekdayOf, nextMonthKey,
} from '@/lib/monthPlanner'
import { createQuestBook } from '@/lib/seasonal/aprilData'
import { parseMonthPlan, type MonthPlan } from '@/lib/seasonal/monthPlans'

const SETTINGS = { cycleLength: 25, periodLength: 5 }
// Okres potwierdzony 28.07, cykl 25 dni (nagłówek augustData).
const phaseFor = projectPhase('2026-07-28', SETTINGS)

describe('prognoza cyklu', () => {
  it('odkłada kolejne cykle co cycleLength', () => {
    // 28.07 + 4×25 = 5.11 → dzień 1
    expect(phaseFor('2026-11-05')).toMatchObject({ phase: 'menstruacja', cycleDay: 1, projected: true })
    expect(phaseFor('2026-07-30')).toMatchObject({ cycleDay: 3, projected: false })
  })
  it('przed pierwszym startem i bez danych — null', () => {
    expect(phaseFor('2026-07-01')).toBeNull()
    expect(projectPhase(null, SETTINGS)('2026-11-05')).toBeNull()
  })
})

describe('szkic miesiąca', () => {
  const quests = draftMonth({ monthKey: '2026-11', phaseFor, question: 'Co dziś wymagało hartu?', nextMonthName: 'Domknięcie' })
  const byDay = (d: string) => quests.filter(q => q.date === d)

  it('pokrywa każdy dzień miesiąca, max 3 questy', () => {
    for (const d of monthDays('2026-11')) {
      expect(byDay(d).length).toBeGreaterThanOrEqual(1)
      expect(byDay(d).length).toBeLessThanOrEqual(3)
    }
  })

  it('gęstość wg fazy: folikularna 3, okres ≤ 2', () => {
    const folli = monthDays('2026-11').filter(d => phaseFor(d)?.phase === 'folikularna' && weekdayOf(d) !== 0)
    expect(folli.length).toBeGreaterThan(0)
    for (const d of folli) expect(byDay(d)).toHaveLength(3)
    for (const d of monthDays('2026-11').filter(d => phaseFor(d)?.phase === 'menstruacja')) {
      expect(byDay(d).length).toBeLessThanOrEqual(2)
    }
  })

  it('maksymalnie jeden projekt (100 XP) dziennie poza stałymi punktami', () => {
    for (const d of monthDays('2026-11')) {
      const projects = byDay(d).filter(q => q.xp === 100 && !q.title.startsWith('Slot Wnętrza'))
      expect(projects.length).toBeLessThanOrEqual(1)
    }
  })

  it('stałe punkty: brain dump, rytm 3/3, czwartkowe pytanie, rozpisz następny, domknięcie', () => {
    expect(byDay('2026-11-01').map(q => q.title)).toContain('Brain dump miesiąca + dwie kolumny')
    expect(quests.filter(q => /^(Aktywność|Ruch łagodny)/.test(q.title))).toHaveLength(13) // 13 pn/śr/pt w listopadzie
    expect(byDay('2026-11-05').some(q => q.description.includes('Co dziś wymagało hartu?'))).toBe(true)
    expect(byDay('2026-11-29').map(q => q.title)).toContain('Rozpisz „Domknięcie"')
    expect(byDay('2026-11-30').map(q => q.title)).toContain('Domknięcie miesiąca')
  })

  it('w okresie ruch jest łagodny', () => {
    // 6.11 piątek, dzień cyklu 2
    expect(byDay('2026-11-06').map(q => q.title)).toContain('Ruch łagodny (3/3)')
    // poniedziałek zawsze 1/3, niezależnie od dnia startu miesiąca
    expect(byDay('2026-11-02').some(q => q.title.endsWith('1/3'))).toBe(true)
  })

  it('bez cyklu — 2 dziennie (poza stałymi punktami)', () => {
    const flat = draftMonth({ monthKey: '2026-12', phaseFor: () => null })
    expect(flat.filter(q => q.date === '2026-12-08')).toHaveLength(2)
  })

  it('bez powtórek tytułu w obrębie dnia', () => {
    for (const d of monthDays('2026-11')) {
      const titles = byDay(d).map(q => q.title)
      expect(new Set(titles).size).toBe(titles.length)
    }
  })
})

describe('prompt i wklejka', () => {
  it('prompt niesie hasło, dni z fazą i format odpowiedzi', () => {
    const p = buildClaudePrompt({ monthKey: '2026-11', name: 'Hart', motto: 'Dyscyplina jest moją elegancją.', phaseFor })
    expect(p).toContain('listopada 2026')
    expect(p).toContain('Hasło miesiąca: Hart')
    expect(p).toContain('2026-11-05 (czw) · okres, dzień cyklu 1 (prognoza)')
    expect(p).toContain('RRRR-MM-DD | filar | xp | tytuł | opis')
  })

  it('parser łyka punktory, tabele, sam numer dnia i aliasy filarów', () => {
    const text = [
      'Oto plan:',
      '- 2026-11-03 | kariera | 100 | Blok pracy | Jedno zadanie, telefon w drugim pokoju.',
      '| 4 | Wnętrze | 60 | Slot | cisza |',
      '|---|---|---|---|---|',
      '`2026-11-05 | ciało | 50 | Spacer`',
      '2026-12-01 | kariera | 80 | Poza miesiącem | x',
      '2026-11-06 | magia | 80 | Zły filar | x',
    ].join('\n')
    const { quests, errors } = parsePlanText(text, '2026-11')
    expect(quests.map(q => [q.date, q.pillar, q.xp, q.title])).toEqual([
      ['2026-11-03', 'kariera', 100, 'Blok pracy'],
      ['2026-11-04', 'pozycja', 60, 'Slot'],
      ['2026-11-05', 'cialo', 50, 'Spacer'],
    ])
    expect(errors.map(e => e.reason)).toEqual(['data spoza miesiąca', 'nieznany filar „magia"'])
  })
})

describe('księga questów z planami z apki', () => {
  const plan: MonthPlan = {
    monthKey: '2026-11', name: 'Hart', motto: 'Nowe motto', question: 'Pytanie?',
    quests: [{ id: 'mp_2026-11-03_a', date: '2026-11-03', title: 'Mój quest', description: '', pillar: 'kariera', xp: 80 }],
  }
  const book = createQuestBook([plan])

  it('plan z apki zastępuje stałe propozycje w swoim miesiącu', () => {
    expect(book.isPlannedMonth('2026-11')).toBe(true)
    expect(book.questsForDate('2026-11-03').map(q => q.id)).toEqual(['mp_2026-11-03_a'])
    expect(book.questsForDate('2026-11-04')).toEqual([]) // dzień bez questów to decyzja planu
    expect(book.questsForDate('2026-12-01')[0].id).toMatch(/^ev_/)
  })

  it('questy z planu bywają zaległe, hasło nadpisuje monthData', () => {
    expect(book.overdue('2026-11-05', [], [], []).map(q => q.id)).toEqual(['mp_2026-11-03_a'])
    expect(book.monthMeta('2026-11')).toEqual({ name: 'Hart', motto: 'Nowe motto', question: 'Pytanie?' })
    expect(book.monthMeta('2026-12')?.name).toBe('Domknięcie')
  })

  it('plan nie nadpisuje miesiąca rozpisanego w kodzie', () => {
    const b = createQuestBook([{ ...plan, monthKey: '2026-08', quests: [{ ...plan.quests[0], date: '2026-08-04' }] }])
    expect(b.questsForDate('2026-08-04').map(q => q.id)).toEqual(['aug_04_1', 'aug_04_2', 'aug_04_3'])
  })

  it('parseMonthPlan odsiewa zepsute questy zamiast wywalać plan', () => {
    const p = parseMonthPlan({ monthKey: '2026-11', name: 'Hart', motto: '', quests: [plan.quests[0], { id: 'x' }, null] })
    expect(p?.quests).toHaveLength(1)
    expect(parseMonthPlan({ monthKey: 'zły' })).toBeNull()
  })

  it('nextMonthKey przechodzi przez rok', () => {
    expect(nextMonthKey('2026-12')).toBe('2027-01')
  })
})
