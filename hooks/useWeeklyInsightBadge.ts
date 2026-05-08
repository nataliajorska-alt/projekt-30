'use client'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { getISOWeekKey } from '@/lib/gameLogic'

const INSIGHT_SEEN_EVENT = 'projekt30:insight-seen'

/** Lekki hook do badge'a w nawigacji — 1 getDoc na mount, custom event do invalidacji. */
export function useWeeklyInsightBadge(): boolean {
  const { user } = useAuth()
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    if (!user) return
    const weekKey = getISOWeekKey(new Date())
    const seenKey = `insight_seen_${weekKey}`

    const refresh = async () => {
      if (typeof window !== 'undefined' && sessionStorage.getItem(seenKey)) {
        setHasNew(false)
        return
      }
      try {
        const ref = doc(db, 'users', user.uid, 'insights', weekKey)
        const snap = await getDoc(ref)
        setHasNew(snap.exists())
      } catch {
        setHasNew(false)
      }
    }
    refresh()

    const handleSeen = () => setHasNew(false)
    window.addEventListener(INSIGHT_SEEN_EVENT, handleSeen)
    return () => window.removeEventListener(INSIGHT_SEEN_EVENT, handleSeen)
  }, [user?.uid])

  return hasNew
}

export function fireInsightSeen() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(INSIGHT_SEEN_EVENT))
}
