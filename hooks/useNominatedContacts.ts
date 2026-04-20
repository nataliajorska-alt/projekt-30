'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { NominatedContact } from '@/types'

export function useNominatedContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<NominatedContact[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'appSettings'))
      if (snap.exists()) setContacts(snap.data().nominatedContacts ?? [])
    } catch (err) {
      console.error('nominatedContacts fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const saveContacts = useCallback(async (updated: NominatedContact[]) => {
    if (!user) return
    await setDoc(
      doc(db, 'users', user.uid, 'data', 'appSettings'),
      { nominatedContacts: updated },
      { merge: true }
    )
    setContacts(updated)
  }, [user])

  return { contacts, loading, saveContacts }
}
