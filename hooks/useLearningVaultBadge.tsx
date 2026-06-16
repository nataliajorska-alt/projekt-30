'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { todayKey } from '@/lib/gameLogic'

/**
 * Badge w nawigacji przy „Learning Vault": żółta kropka, gdy DZIŚ nie przyszło
 * jeszcze żadne XP z Vaulta. Jedyny sygnał, jaki P30 dostaje z Vaulta, to XP
 * przez /api/external/xp → logs/{today}.externalXP[filar]. Brak wpisu (albo brak
 * całego dokumentu dnia) = nic dziś nie zrobione → kropka-przypominajka.
 *
 * Realtime listener (onSnapshot) na logu dzisiejszego dnia — ten sam dokument,
 * który live obserwuje useGameData. Dzięki temu kropka znika ~od razu po tym, jak
 * Vault zaksięguje XP, niezależnie od tego czy P30 jest w aktywnej karcie/oknie
 * (Vault chodzi w osobnym tabie, więc nie ma in-app eventu do invalidacji).
 *
 * Domyślnie `false` (bez kropki) zanim listener przyśle pierwszą wartość — żeby
 * przy ładowaniu nie mrugało. Przy powrocie na kartę po 3:00 (nowy dzień)
 * przepinamy listener na log nowego dnia.
 */

function isIdle(data: unknown): boolean {
  const ext = ((data as { externalXP?: Record<string, unknown> } | undefined)
    ?.externalXP ?? {}) as Record<string, unknown>
  const total = Object.values(ext).reduce<number>(
    (sum, v) => sum + (typeof v === 'number' ? v : 0),
    0,
  )
  return total === 0
}

export function useLearningVaultBadge(): boolean {
  const { user } = useAuth()
  const [idleToday, setIdleToday] = useState(false)

  useEffect(() => {
    if (!user) {
      setIdleToday(false)
      return
    }

    let unsub: (() => void) | null = null
    let subscribedKey = ''

    const subscribe = () => {
      const key = todayKey()
      if (unsub && subscribedKey === key) return // już słuchamy dobrego dnia
      unsub?.()
      subscribedKey = key
      unsub = onSnapshot(
        doc(db, ...paths.logDoc(user.uid, key)),
        (snap) => setIdleToday(isIdle(snap.data())),
        () => setIdleToday(false), // błąd/offline — nie nękamy kropką
      )
    }

    subscribe()

    // Po przekroczeniu 3:00 na otwartej karcie todayKey() wskazuje nowy dzień —
    // przy powrocie na kartę przepnij listener na log nowego dnia.
    const onVisible = () => {
      if (document.visibilityState === 'visible') subscribe()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      unsub?.()
    }
  }, [user?.uid])

  return idleToday
}
