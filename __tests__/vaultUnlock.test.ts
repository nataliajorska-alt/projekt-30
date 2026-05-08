import { describe, it, expect } from 'vitest'
import {
  getUnlockStatus,
  getNextGlobalUnlock,
  countUnlocked,
  gratitudeUnlockDate,
  daysUntil,
  QUARTERLY_UNLOCKS,
} from '../lib/vaultUnlock'
import type { VaultEntry, LetterType, UnlockType } from '../types'

// Lokalny YYYY-MM-DD bez konwersji na UTC (toISOString w PL przesuwa o -2h).
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Minimalna entry — testujemy logikę unlocka, więc title/content nieistotne.
function makeEntry(opts: Partial<VaultEntry> & {
  id: string
  letterType: LetterType
  unlockType: UnlockType
  createdAt: string
}): VaultEntry {
  return {
    title: '',
    content: '',
    dateKey: opts.createdAt.slice(0, 10),
    dayOfProject: 1,
    ...opts,
  }
}

const before_q1 = new Date('2026-06-01T12:00:00')
const just_after_q1 = new Date('2026-07-05T01:00:00')
const between_q1_q2 = new Date('2026-08-01T12:00:00')
const after_q2 = new Date('2026-10-06T12:00:00')
const after_q3 = new Date('2027-01-06T12:00:00')
const after_final = new Date('2027-04-06T12:00:00')

describe('getUnlockStatus — vent', () => {
  it('vent zawsze contentHidden i nigdy nie unlocked', () => {
    const e = makeEntry({ id: '1', letterType: 'vent', unlockType: 'never', createdAt: '2026-04-10T10:00:00Z' })
    const s = getUnlockStatus(e, [e], after_final)
    expect(s.unlocked).toBe(false)
    expect(s.contentHidden).toBe(true)
  })
})

describe('getUnlockStatus — crisis (immediate)', () => {
  it('crisis zawsze unlocked, nawet w pierwszym dniu', () => {
    const e = makeEntry({ id: '1', letterType: 'crisis', unlockType: 'immediate', createdAt: '2026-04-10T10:00:00Z' })
    expect(getUnlockStatus(e, [e], before_q1).unlocked).toBe(true)
    expect(getUnlockStatus(e, [e], after_final).unlocked).toBe(true)
  })
})

describe('getUnlockStatus — date / gratitude', () => {
  it('date: locked przed unlockDate', () => {
    const e = makeEntry({
      id: '1', letterType: 'date', unlockType: 'date',
      createdAt: '2026-04-10T10:00:00Z', unlockDate: '2026-12-25',
    })
    const s = getUnlockStatus(e, [e], new Date('2026-12-24T23:59:00'))
    expect(s.unlocked).toBe(false)
    expect(localDateKey(s.nextUnlockDate!)).toBe('2026-12-25')
  })

  it('date: unlocked w dniu unlockDate (00:00)', () => {
    const e = makeEntry({
      id: '1', letterType: 'date', unlockType: 'date',
      createdAt: '2026-04-10T10:00:00Z', unlockDate: '2026-12-25',
    })
    expect(getUnlockStatus(e, [e], new Date('2026-12-25T00:00:00')).unlocked).toBe(true)
    expect(getUnlockStatus(e, [e], new Date('2027-01-01T12:00:00')).unlocked).toBe(true)
  })

  it('date: locked gdy brak unlockDate (defensive)', () => {
    const e = makeEntry({ id: '1', letterType: 'date', unlockType: 'date', createdAt: '2026-04-10T10:00:00Z' })
    const s = getUnlockStatus(e, [e], after_final)
    expect(s.unlocked).toBe(false)
  })

  it('gratitude: ten sam mechanizm co date', () => {
    const e = makeEntry({
      id: '1', letterType: 'gratitude', unlockType: 'date',
      createdAt: '2026-04-10T10:00:00Z', unlockDate: '2026-05-10',
    })
    expect(getUnlockStatus(e, [e], new Date('2026-05-09T12:00:00')).unlocked).toBe(false)
    expect(getUnlockStatus(e, [e], new Date('2026-05-10T00:00:01')).unlocked).toBe(true)
  })
})

describe('getUnlockStatus — quarterly (future)', () => {
  // 4 listy future, sortowane chronologicznie po createdAt
  const f1 = makeEntry({ id: 'f1', letterType: 'future', unlockType: 'quarterly', createdAt: '2026-04-10T10:00:00Z' })
  const f2 = makeEntry({ id: 'f2', letterType: 'future', unlockType: 'quarterly', createdAt: '2026-05-15T10:00:00Z' })
  const f3 = makeEntry({ id: 'f3', letterType: 'future', unlockType: 'quarterly', createdAt: '2026-06-20T10:00:00Z' })
  const f4 = makeEntry({ id: 'f4', letterType: 'future', unlockType: 'quarterly', createdAt: '2026-07-01T10:00:00Z' })
  const all = [f1, f2, f3, f4]

  it('przed 5.07.2026 — żaden future nie unlocked', () => {
    for (const e of all) expect(getUnlockStatus(e, all, before_q1).unlocked).toBe(false)
  })

  it('po 5.07.2026 — tylko najstarszy (f1) unlocked', () => {
    expect(getUnlockStatus(f1, all, just_after_q1).unlocked).toBe(true)
    expect(getUnlockStatus(f2, all, just_after_q1).unlocked).toBe(false)
    expect(getUnlockStatus(f3, all, just_after_q1).unlocked).toBe(false)
    expect(getUnlockStatus(f4, all, just_after_q1).unlocked).toBe(false)
  })

  it('po 5.10.2026 — pierwsze 2 future unlocked', () => {
    expect(getUnlockStatus(f1, all, after_q2).unlocked).toBe(true)
    expect(getUnlockStatus(f2, all, after_q2).unlocked).toBe(true)
    expect(getUnlockStatus(f3, all, after_q2).unlocked).toBe(false)
    expect(getUnlockStatus(f4, all, after_q2).unlocked).toBe(false)
  })

  it('po 5.01.2027 — pierwsze 3 future unlocked', () => {
    expect(getUnlockStatus(f1, all, after_q3).unlocked).toBe(true)
    expect(getUnlockStatus(f2, all, after_q3).unlocked).toBe(true)
    expect(getUnlockStatus(f3, all, after_q3).unlocked).toBe(true)
    expect(getUnlockStatus(f4, all, after_q3).unlocked).toBe(false)
  })

  it('po finale — wszystkie future unlocked', () => {
    for (const e of all) expect(getUnlockStatus(e, all, after_final).unlocked).toBe(true)
  })

  it('locked future zwraca nextUnlockDate i label', () => {
    const s = getUnlockStatus(f4, all, between_q1_q2)
    expect(s.unlocked).toBe(false)
    // f4 jest 4. chronologicznie — odblokuje się dopiero w finale
    expect(s.nextUnlockLabel).toContain('finał')
  })

  it('mieszane typy w kolekcji nie wpływają na indeks future', () => {
    const c1 = makeEntry({ id: 'c1', letterType: 'crisis', unlockType: 'immediate', createdAt: '2026-04-09T10:00:00Z' })
    const v1 = makeEntry({ id: 'v1', letterType: 'vent', unlockType: 'never', createdAt: '2026-04-08T10:00:00Z' })
    const mixed = [c1, v1, ...all]
    // f1 wciąż jest najstarszym future, niezależnie od starszych crisis/vent
    expect(getUnlockStatus(f1, mixed, just_after_q1).unlocked).toBe(true)
    expect(getUnlockStatus(f2, mixed, just_after_q1).unlocked).toBe(false)
  })
})

describe('countUnlocked', () => {
  it('liczy tylko listy z dostępną treścią — bez vent', () => {
    const v = makeEntry({ id: 'v', letterType: 'vent', unlockType: 'never', createdAt: '2026-04-10T10:00:00Z' })
    const c = makeEntry({ id: 'c', letterType: 'crisis', unlockType: 'immediate', createdAt: '2026-04-10T10:00:00Z' })
    const f = makeEntry({ id: 'f', letterType: 'future', unlockType: 'quarterly', createdAt: '2026-04-10T10:00:00Z' })
    const entries = [v, c, f]
    expect(countUnlocked(entries, before_q1)).toBe(1)        // tylko crisis
    expect(countUnlocked(entries, just_after_q1)).toBe(2)    // crisis + f1 future
  })
})

describe('getNextGlobalUnlock', () => {
  it('zwraca najwcześniejszą datę odblokowania spośród zablokowanych', () => {
    const f = makeEntry({ id: 'f', letterType: 'future', unlockType: 'quarterly', createdAt: '2026-04-10T10:00:00Z' })
    const d = makeEntry({
      id: 'd', letterType: 'date', unlockType: 'date',
      createdAt: '2026-04-10T10:00:00Z', unlockDate: '2026-06-15',
    })
    // Przy 1.06.2026: f unlock to 5.07, d unlock to 15.06 → wybiera d (wcześniejsze)
    const next = getNextGlobalUnlock([f, d], before_q1)
    expect(localDateKey(next!.date)).toBe('2026-06-15')
  })

  it('null gdy wszystko już odblokowane', () => {
    const c = makeEntry({ id: 'c', letterType: 'crisis', unlockType: 'immediate', createdAt: '2026-04-10T10:00:00Z' })
    expect(getNextGlobalUnlock([c], after_final)).toBeNull()
  })

  it('vent nie blokuje globalnego unlocka (jest ignorowany)', () => {
    const v = makeEntry({ id: 'v', letterType: 'vent', unlockType: 'never', createdAt: '2026-04-10T10:00:00Z' })
    expect(getNextGlobalUnlock([v], before_q1)).toBeNull()
  })
})

describe('gratitudeUnlockDate', () => {
  it('zwraca datę dziś + 30 dni w formacie YYYY-MM-DD', () => {
    const now = new Date('2026-05-08T12:00:00')
    expect(gratitudeUnlockDate(now)).toBe('2026-06-07')
  })
})

describe('daysUntil', () => {
  it('0 dla daty w przeszłości', () => {
    expect(daysUntil(new Date('2026-01-01'), new Date('2026-05-08'))).toBe(0)
  })
  it('zaokrągla w górę', () => {
    expect(daysUntil(new Date('2026-05-10T00:00:00'), new Date('2026-05-08T01:00:00'))).toBe(2)
  })
})

describe('QUARTERLY_UNLOCKS — sanity', () => {
  it('ma 4 progi z rosnącymi datami', () => {
    expect(QUARTERLY_UNLOCKS).toHaveLength(4)
    for (let i = 1; i < QUARTERLY_UNLOCKS.length; i++) {
      expect(QUARTERLY_UNLOCKS[i].date.getTime()).toBeGreaterThan(QUARTERLY_UNLOCKS[i - 1].date.getTime())
    }
  })
  it('finał ma cumulativeCount = -1', () => {
    expect(QUARTERLY_UNLOCKS[QUARTERLY_UNLOCKS.length - 1].cumulativeCount).toBe(-1)
  })
})
