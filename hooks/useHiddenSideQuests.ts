'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'

/**
 * Per-user lista ukrytych side questów z biblioteki (lib/questData SIDE_QUESTS).
 * Trzymana w appSettings.hiddenSideQuests — ten sam dokument, co customQuestIdeas
 * (useCustomQuestLibrary), więc merge:true nie depcze pozostałych ustawień.
 *
 * „Ukrycie" jest ODWRACALNE: quest znika z biblioteki na /quests i z losowania na
 * Dziś (lib/questData.filterPool wyrzuca hiddenIds), ale można go przywrócić.
 * Nie rusza historii ukończeń — to tylko kuracja tego, co Natalia widzi i losuje.
 */
export function useHiddenSideQuests() {
  const { user } = useAuth()
  const [hidden, setHidden] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchHidden = async () => {
      if (!user) {
        setHidden([])
        setLoading(false)
        return
      }
      try {
        const snap = await getDoc(doc(db, ...paths.dataDoc(user.uid, 'appSettings')))
        if (!cancelled && snap.exists()) setHidden(snap.data().hiddenSideQuests ?? [])
      } catch (err) {
        console.error('hiddenSideQuests fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchHidden()
    return () => { cancelled = true }
  }, [user?.uid])

  const save = useCallback(async (updated: string[]) => {
    if (!user) return
    const prev = hidden
    setHidden(updated) // optymistycznie — karta znika od razu, bez czekania na zapis
    try {
      await setDoc(
        doc(db, ...paths.dataDoc(user.uid, 'appSettings')),
        { hiddenSideQuests: updated },
        { merge: true },
      )
    } catch (err) {
      console.error('hiddenSideQuests save error:', err)
      setHidden(prev) // zapis padł (offline/reguły) — cofnij optymistyczną zmianę
    }
  }, [user, hidden])

  const hide = useCallback(async (id: string) => {
    if (hidden.includes(id)) return
    await save([...hidden, id])
  }, [hidden, save])

  const unhide = useCallback(async (id: string) => {
    await save(hidden.filter(h => h !== id))
  }, [hidden, save])

  return { hidden, loading, hide, unhide }
}
