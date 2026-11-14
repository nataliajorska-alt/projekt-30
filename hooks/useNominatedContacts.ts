'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import type { NominatedContact } from '@/types'

export function useNominatedContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<NominatedContact[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const snap = await getDoc(doc(db, ...paths.dataDoc(user.uid, 'appSettings')))
      if (snap.exists()) setContacts(snap.data().nominatedContacts ?? [])
    } catch (err) {
      console.error('nominatedContacts fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // Zapisujemy RÓŻNICĘ względem tego, co wczytane (dopisane / usunięte osoby),
  // nie całą listę: po nieudanym odczycie lista w stanie jest pusta, a te
  // kontakty są na czarną godzinę — nie mogą zniknąć przez dodanie jednego.
  const saveContacts = useCallback(async (updated: NominatedContact[]) => {
    if (!user) return
    const ref = doc(db, ...paths.dataDoc(user.uid, 'appSettings'))
    const same = (a: NominatedContact, b: NominatedContact) => a.name === b.name && a.phone === b.phone
    const added = updated.filter(u => !contacts.some(c => same(c, u)))
    const removed = contacts.filter(c => !updated.some(u => same(c, u)))
    const writes: Promise<void>[] = []
    if (removed.length > 0) writes.push(setDoc(ref, { nominatedContacts: arrayRemove(...removed) }, { merge: true }))
    if (added.length > 0) writes.push(setDoc(ref, { nominatedContacts: arrayUnion(...added) }, { merge: true }))
    await Promise.all(writes)
    setContacts(updated)
  }, [user, contacts])

  return { contacts, loading, saveContacts }
}
