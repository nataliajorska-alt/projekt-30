'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { getDaysElapsed, todayKey } from '@/lib/gameLogic'

export interface VaultEntry {
  id: string
  content: string
  title: string
  dateKey: string
  dayOfProject: number
  createdAt: string
}

export function useVault() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const ref = collection(db, 'users', user.uid, 'vault')
    const q = query(ref, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as VaultEntry)))
    setLoading(false)
  }, [user?.uid])

  useEffect(() => { load() }, [load])

  const addEntry = useCallback(async (title: string, content: string) => {
    if (!user) return
    const ref = collection(db, 'users', user.uid, 'vault')
    const doc_ = await addDoc(ref, {
      title,
      content,
      dateKey: todayKey(),
      dayOfProject: getDaysElapsed() + 1,
      createdAt: serverTimestamp(),
    })
    const newEntry: VaultEntry = {
      id: doc_.id, title, content,
      dateKey: todayKey(),
      dayOfProject: getDaysElapsed() + 1,
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => [newEntry, ...prev])
  }, [user?.uid])

  const removeEntry = useCallback(async (id: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'vault', id))
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [user?.uid])

  return { entries, loading, addEntry, removeEntry }
}
