// Logika odblokowywania listów Vault.
//
// Reguły per typ:
//   • future (quarterly) — listy typu future odblokowują się falami:
//       5.07.2026 → najstarszy 1 list, 5.10.2026 → 2 najstarsze, 5.01.2027 → 3,
//       5.04.2027 → wszystkie. Indeks liczony tylko wewnątrz puli future.
//   • crisis (immediate) — zawsze otwarty.
//   • gratitude (date) — unlockDate ustawiany przy zapisie (createdAt + 30 dni).
//   • date (date) — unlockDate ustawiany ręcznie przez użytkowniczkę (datepicker).
//   • vent (never) — nigdy nie odblokowuje treści (treść i tak nie jest zapisywana).
import type { VaultEntry } from '@/types'

export interface QuarterlyUnlock {
  date: Date
  /** Ile listów future jest odblokowanych po tej dacie. -1 = wszystkie pozostałe (finał). */
  cumulativeCount: number
  label: string
}

export const QUARTERLY_UNLOCKS: QuarterlyUnlock[] = [
  { date: new Date('2026-07-05T00:00:00'), cumulativeCount: 1,  label: '5 lipca 2026' },
  { date: new Date('2026-10-05T00:00:00'), cumulativeCount: 2,  label: '5 października 2026' },
  { date: new Date('2027-01-05T00:00:00'), cumulativeCount: 3,  label: '5 stycznia 2027' },
  { date: new Date('2027-04-05T00:00:00'), cumulativeCount: -1, label: '5 kwietnia 2027 — finał' },
]

export interface UnlockStatus {
  /** Czy treść może być wyświetlona. */
  unlocked: boolean
  /** Czy treść NIE istnieje (vent — content jest pusty z założenia). */
  contentHidden: boolean
  /** Najbliższe wydarzenie odblokowujące (jeśli zablokowany). */
  nextUnlockDate?: Date
  nextUnlockLabel?: string
}

/**
 * Zwraca status odblokowania listu w kontekście całej kolekcji.
 * `entry` — list do oceny.
 * `allEntries` — wszystkie listy użytkowniczki (potrzebne dla quarterly do wyznaczenia indeksu chronologicznego).
 * `now` — opcjonalna nadpisana "teraz" (do testów).
 */
export function getUnlockStatus(
  entry: VaultEntry,
  allEntries: VaultEntry[],
  now: Date = new Date(),
): UnlockStatus {
  switch (entry.unlockType) {
    case 'never':
      // Vent — content nie istnieje, nigdy nie pokazujemy.
      return { unlocked: false, contentHidden: true }

    case 'immediate':
      return { unlocked: true, contentHidden: false }

    case 'date': {
      if (!entry.unlockDate) {
        // Brak daty — zachowawczo: zablokowany, ale bez data wskaźnika.
        return { unlocked: false, contentHidden: false }
      }
      const target = new Date(entry.unlockDate + 'T00:00:00')
      if (now >= target) return { unlocked: true, contentHidden: false }
      return {
        unlocked: false,
        contentHidden: false,
        nextUnlockDate: target,
        nextUnlockLabel: formatPolishDate(target),
      }
    }

    case 'quarterly': {
      // Indeks chronologiczny tego listu spośród wszystkich future (najstarszy = 0).
      const futureEntries = allEntries
        .filter(e => e.letterType === 'future')
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const indexAsc = futureEntries.findIndex(e => e.id === entry.id)
      if (indexAsc < 0) return { unlocked: false, contentHidden: false }

      // Najnowszy aktywny próg.
      let activeCount = 0
      let nextUnlock: QuarterlyUnlock | null = null
      for (const u of QUARTERLY_UNLOCKS) {
        if (now >= u.date) {
          activeCount = u.cumulativeCount
        } else if (!nextUnlock) {
          nextUnlock = u
        }
      }
      const unlocked = activeCount === -1 || indexAsc < activeCount
      if (unlocked) return { unlocked: true, contentHidden: false }

      // Najbliższy próg który ten konkretny list odblokuje.
      const targetUnlock = QUARTERLY_UNLOCKS.find(u => {
        if (now >= u.date) return false
        if (u.cumulativeCount === -1) return true
        return indexAsc < u.cumulativeCount
      }) ?? nextUnlock
      return {
        unlocked: false,
        contentHidden: false,
        nextUnlockDate: targetUnlock?.date,
        nextUnlockLabel: targetUnlock?.label,
      }
    }
  }
}

/** Najbliższe odblokowanie *jakiegokolwiek* listu w kolekcji (do globalnego bannera). */
export function getNextGlobalUnlock(
  allEntries: VaultEntry[],
  now: Date = new Date(),
): { date: Date; label: string } | null {
  let best: { date: Date; label: string } | null = null
  for (const e of allEntries) {
    const s = getUnlockStatus(e, allEntries, now)
    if (s.unlocked || !s.nextUnlockDate) continue
    if (!best || s.nextUnlockDate < best.date) {
      best = { date: s.nextUnlockDate, label: s.nextUnlockLabel ?? formatPolishDate(s.nextUnlockDate) }
    }
  }
  return best
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000))
}

/** Liczba listów aktualnie odblokowanych (do treści). Vent nie liczy się jako "do odczytu". */
export function countUnlocked(allEntries: VaultEntry[], now: Date = new Date()): number {
  return allEntries.filter(e => {
    const s = getUnlockStatus(e, allEntries, now)
    return s.unlocked && !s.contentHidden
  }).length
}

function formatPolishDate(d: Date): string {
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Dla 'gratitude' — domyślna data odblokowania to dziś + 30 dni. */
export function gratitudeUnlockDate(now: Date = new Date()): string {
  const d = new Date(now)
  d.setDate(d.getDate() + 30)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
