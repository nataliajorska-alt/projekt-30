'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
        getDoc(doc(db, 'users', user.uid, 'data', 'ghostLogV2')),
        getDoc(doc(db, 'users', user.uid, 'data', 'honestFailureLog')),
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
    const ref = doc(db, 'users', user.uid, 'data', 'ghostLogV2')
    const snap = await getDoc(ref)
    const existing: GhostLogEntryV2[] = snap.exists() ? (snap.data().entries ?? []) : []
    const updated = [...existing, entry]
    await setDoc(ref, { entries: updated }, { merge: true })
    setEntries(updated)
  }, [user])

  const saveFailureEntry = useCallback(async (entry: HonestFailureEntry) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'data', 'honestFailureLog')
    const snap = await getDoc(ref)
    const existing: HonestFailureEntry[] = snap.exists() ? (snap.data().entries ?? []) : []
    const updated = [...existing, entry]
    await setDoc(ref, { entries: updated }, { merge: true })
    setFailures(updated)
  }, [user])

  return { entries, failures, loading, saveImpulseEntry, saveFailureEntry }
}
