'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'

/**
 * Trwały („na zawsze") status ukończenia side questów z biblioteki — niezależny
 * od dziennego completedSideQuests (które resetuje się co dobę) i od XP.
 *
 * Trzymany w appSettings.everCompletedSideQuests (osobny zbiór, jak hiddenSideQuests).
 * Ukończenie GDZIEKOLWIEK — na /quests albo w losowaniu na Dziś — dorzuca id tutaj,
 * więc status jest spójny między ekranami. arrayUnion/arrayRemove są atomowe, więc
 * zapisy z dwóch miejsc się nie depczą. Raz oznaczony quest zostaje „ukończony",
 * dopóki świadomie go nie odznaczysz („cofnij" na karcie).
 *
 * Uwaga: zaczyna zliczać OD WDROŻENIA — nie ma retro-backfillu z historii logów.
 */
export function useEverCompletedSideQuests() {
  const { user } = useAuth()
  const [everDone, setEverDone] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchDone = async () => {
      if (!user) { setEverDone([]); setLoading(false); return }
      try {
        const snap = await getDoc(doc(db, ...paths.dataDoc(user.uid, 'appSettings')))
        if (!cancelled && snap.exists()) setEverDone(snap.data().everCompletedSideQuests ?? [])
      } catch (err) {
        console.error('everCompletedSideQuests fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDone()
    return () => { cancelled = true }
  }, [user?.uid])

  const markDone = useCallback(async (id: string) => {
    if (!user || everDone.includes(id)) return
    setEverDone(prev => (prev.includes(id) ? prev : [...prev, id])) // optymistycznie
    try {
      await setDoc(
        doc(db, ...paths.dataDoc(user.uid, 'appSettings')),
        { everCompletedSideQuests: arrayUnion(id) },
        { merge: true },
      )
    } catch (err) {
      console.error('markDone error:', err)
      setEverDone(prev => prev.filter(x => x !== id)) // cofnij optymistyczną zmianę
    }
  }, [user, everDone])

  const unmarkDone = useCallback(async (id: string) => {
    if (!user) return
    const prev = everDone
    setEverDone(p => p.filter(x => x !== id)) // optymistycznie
    try {
      await setDoc(
        doc(db, ...paths.dataDoc(user.uid, 'appSettings')),
        { everCompletedSideQuests: arrayRemove(id) },
        { merge: true },
      )
    } catch (err) {
      console.error('unmarkDone error:', err)
      setEverDone(prev)
    }
  }, [user, everDone])

  return { everDone, loading, markDone, unmarkDone }
}
