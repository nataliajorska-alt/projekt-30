import { describe, it, expect, vi } from 'vitest'
import {
  seededRandom, rollLoot, lootRewardId, LOOT_CHANCE, LOOT_DAILY_CAP,
  EMPTY_COMBO, nextCombo, comboCount, comboMilestone, comboFrequency, COMBO_WINDOW_MS,
  rollSeal, crossedDayMilestone, pickJoy, DAILY_JOYS, emit, on,
} from '@/lib/rewards'

const DATE = '2026-11-04'

describe('losowość z ziarnem', () => {
  it('ten sam tekst → ta sama liczba z [0, 1)', () => {
    expect(seededRandom('a')).toBe(seededRandom('a'))
    expect(seededRandom('a')).not.toBe(seededRandom('b'))
    for (let i = 0; i < 200; i++) {
      const r = seededRandom(`x${i}`)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThan(1)
    }
  })
})

describe('znaleziska', () => {
  const ids = Array.from({ length: 3000 }, (_, i) => `item_${i}`)
  const drops = ids.map(id => rollLoot(DATE, id, [])).filter(Boolean)

  it('wynik zależy tylko od daty i id — odznaczenie nie przelosowuje', () => {
    for (const id of ids.slice(0, 50)) expect(rollLoot(DATE, id, [])).toEqual(rollLoot(DATE, id, []))
  })

  it(`wypada w ~${LOOT_CHANCE * 100}% odhaczeń, rzadkie ~25%, legendarne ~5%`, () => {
    const rate = drops.length / ids.length
    expect(rate).toBeGreaterThan(0.14)
    expect(rate).toBeLessThan(0.22)
    const rare = drops.filter(d => d!.rarity === 'rzadkie').length / drops.length
    const legend = drops.filter(d => d!.rarity === 'legendarne').length / drops.length
    expect(rare).toBeGreaterThan(0.17)
    expect(rare).toBeLessThan(0.33)
    expect(legend).toBeGreaterThan(0.01)
    expect(legend).toBeLessThan(0.1)
    expect(drops.every(d => d!.xp === { zwykle: 10, rzadkie: 25, legendarne: 75 }[d!.rarity])).toBe(true)
  })

  it('raz zebrane nie wypada drugi raz, a po 5 dziennie — koniec', () => {
    const d = drops[0]!
    expect(rollLoot(DATE, d.rewardId.replace(`loot_${DATE}_`, ''), [d.rewardId])).toBeNull()
    const full = Array.from({ length: LOOT_DAILY_CAP }, (_, i) => lootRewardId(DATE, `x${i}`))
    const anyDropId = ids.find(id => rollLoot(DATE, id, []))!
    expect(rollLoot(DATE, anyDropId, full)).toBeNull()
    // Znaleziska z innego dnia nie liczą się do dzisiejszego limitu.
    const yesterday = full.map(r => r.replace(DATE, '2026-11-03'))
    expect(rollLoot(DATE, anyDropId, yesterday)).not.toBeNull()
  })
})

describe('rozpęd', () => {
  it('liczy unikalne odhaczenia w oknie i gaśnie po nim', () => {
    let s = EMPTY_COMBO
    s = nextCombo(s, 'a', 1000)
    s = nextCombo(s, 'b', 2000)
    s = nextCombo(s, 'a', 3000) // to samo drugi raz nie podbija
    expect(comboCount(s, 3000)).toBe(2)
    expect(comboCount(s, 3000 + COMBO_WINDOW_MS + 1)).toBe(0)
    s = nextCombo(s, 'c', 3000 + COMBO_WINDOW_MS + 1)
    expect(s.ids).toEqual(['c'])
  })

  it('kamienie milowe ×3, ×5, ×8 — każdy dokładnie raz po drodze', () => {
    const hits = []
    for (let n = 1; n <= 9; n++) {
      const m = comboMilestone(n - 1, n)
      if (m) hits.push(m.n)
    }
    expect(hits).toEqual([3, 5, 8])
    expect(comboMilestone(2, 6)?.n).toBe(3) // skok przez dwa progi daje pierwszy
  })

  it('dzwoneczek idzie w górę z każdym krokiem, do dwóch oktaw', () => {
    for (let n = 1; n < 11; n++) expect(comboFrequency(n + 1)).toBeGreaterThan(comboFrequency(n))
    expect(comboFrequency(1)).toBeCloseTo(523.25)
    expect(comboFrequency(30)).toBe(comboFrequency(11)) // sufit: C7, żeby nie piszczało
  })
})

describe('pieczęć dnia', () => {
  it('deterministyczna, z puli 10/20/40/100; złota tylko przy 100', () => {
    expect(rollSeal(DATE)).toEqual(rollSeal(DATE))
    const xs = Array.from({ length: 2000 }, (_, i) => rollSeal(`2027-${i}`))
    expect(new Set(xs.map(x => x.xp))).toEqual(new Set([10, 20, 40, 100]))
    expect(xs.every(x => x.golden === (x.xp === 100))).toBe(true)
    const golden = xs.filter(x => x.golden).length / xs.length
    expect(golden).toBeGreaterThan(0.02)
    expect(golden).toBeLessThan(0.09)
  })

  it('mała przyjemność — ta sama przez cały dzień', () => {
    expect(pickJoy(DATE)).toBe(pickJoy(DATE))
    expect(DAILY_JOYS).toContain(pickJoy(DATE))
  })
})

describe('kamienie milowe dnia i magistrala', () => {
  it('50% i 100%', () => {
    expect(crossedDayMilestone(40, 55)).toBe(50)
    expect(crossedDayMilestone(90, 100)).toBe(100)
    expect(crossedDayMilestone(40, 100)).toBe(100)
    expect(crossedDayMilestone(55, 80)).toBeNull()
    expect(crossedDayMilestone(100, 100)).toBeNull()
  })

  it('błąd jednego słuchacza nie zatrzymuje pozostałych', () => {
    const ok = vi.fn()
    const off1 = on('reward', () => { throw new Error('x') })
    const off2 = on('reward', ok)
    emit('reward', { source: 'routine', id: 'm2', xp: 10 })
    expect(ok).toHaveBeenCalledWith({ source: 'routine', id: 'm2', xp: 10 })
    off1(); off2()
    emit('reward', { source: 'routine', id: 'm3', xp: 10 })
    expect(ok).toHaveBeenCalledTimes(1)
  })
})
