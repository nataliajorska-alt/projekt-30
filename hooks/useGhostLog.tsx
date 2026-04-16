'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { GhostProtocolEntry } from '@/types'

export function useGhostLog() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<GhostProtocolEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const ref = doc(db, 'users', user.uid, 'data', 'ghostLog')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setEntries((snap.data().entries ?? []) as GhostProtocolEntry[])
      }
    } catch (err) {
      console.error('ghostLog fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const saveEntry = useCallback(async (entry: GhostProtocolEntry) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'data', 'ghostLog')
    const snap = await getDoc(ref)
    const existing: GhostProtocolEntry[] = snap.exists() ? (snap.data().entries ?? []) : []
    const updated = [...existing, entry]
    await setDoc(ref, { entries: updated }, { merge: true })
    setEntries(updated)
  }, [user])

  return { entries, loading, saveEntry }
}
