'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, arrayUnion } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import type { GhostLogEntryV2, HonestFailureEntry } from '@/types'

export function useGhostV2() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<GhostLogEntryV2[]>([])
  const [failures, setFailures] = useState<HonestFailureEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const [impulseSnap, failureSnap] = await Promise.all([
        getDoc(doc(db, ...paths.dataDoc(user.uid, 'ghostLogV2'))),
        getDoc(doc(db, ...paths.dataDoc(user.uid, 'honestFailureLog'))),
      ])
      if (impulseSnap.exists()) setEntries((impulseSnap.data().entries ?? []) as GhostLogEntryV2[])
      if (failureSnap.exists()) setFailures((failureSnap.data().entries ?? []) as HonestFailureEntry[])
    } catch (err) {
      console.error('ghostV2 fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const saveImpulseEntry = useCallback(async (entry: GhostLogEntryV2) => {
    if (!user) return
    const ref = doc(db, ...paths.dataDoc(user.uid, 'ghostLogV2'))
    // arrayUnion: dopisuje wpis atomowo. Odczyt→zapis całej tablicy gubił wpis
    // dodany równolegle na drugim urządzeniu, a bez zasięgu w ogóle nie działał
    // (getDoc odrzucał) — impuls w trudnej chwili przepadał.
    setEntries(prev => [...prev, entry])
    await setDoc(ref, { entries: arrayUnion(entry) }, { merge: true })
  }, [user])

  const saveFailureEntry = useCallback(async (entry: HonestFailureEntry) => {
    if (!user) return
    const ref = doc(db, ...paths.dataDoc(user.uid, 'honestFailureLog'))
    setFailures(prev => [...prev, entry])
    await setDoc(ref, { entries: arrayUnion(entry) }, { merge: true })
  }, [user])

  return { entries, failures, loading, saveImpulseEntry, saveFailureEntry }
}
