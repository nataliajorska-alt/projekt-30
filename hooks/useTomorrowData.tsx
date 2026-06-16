'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, onSnapshot, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import type { DailyLog, Pillar } from '@/types'
import { tomorrowKey } from '@/lib/gameLogic'
import { useToast } from '@/components/ToastProvider'

const EMPTY_LOG: DailyLog = {
  date: '', completedRoutine: [], completedDailyQuests: [],
  completedSideQuests: [], keptRules: [], totalXP: 0, dayMode: 'normal',
}

export function useTomorrowData() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [tomorrowLog, setTomorrowLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const dateKey = tomorrowKey()

  const tomorrowRef = user ? doc(db, ...paths.logDoc(user.uid, dateKey)) : null
  const statsRef    = user ? doc(db, ...paths.dataDoc(user.uid, 'stats')) : null

  useEffect(() => {
    if (!user || !tomorrowRef) { setLoading(false); return }
    const unsub = onSnapshot(tomorrowRef, (snap) => {
      setTomorrowLog(snap.exists()
        ? { ...EMPTY_LOG, ...(snap.data() as DailyLog) }
        : { ...EMPTY_LOG, date: dateKey }
      )
      setLoading(false)
    }, () => {
      // Bez handlera błędu listener przy błędzie sieci/uprawnień zostawiał
      // loading=true na zawsze (nieskończony spinner). Tu: toast + odblokuj UI.
      addToast({ message: 'Błąd ładowania jutrzejszego planu. Odśwież stronę.', type: 'error' })
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid, dateKey])

  const toggleTomorrowRoutine = useCallback(async (itemId: string, xp: number) => {
    if (!user || !tomorrowRef || !tomorrowLog || !statsRef) return
    const done = (tomorrowLog.completedRoutine ?? []).includes(itemId)
    const xpDelta = done ? -xp : xp

    // increment/arrayUnion — bez getDoc→setDoc (które gubiło równoległy zapis,
    // m.in. XP z Learning Vault). Tablica i totalXP aktualizują się atomowo.
    await Promise.all([
      setDoc(tomorrowRef, {
        completedRoutine: done ? arrayRemove(itemId) : arrayUnion(itemId),
        totalXP: increment(xpDelta),
        date: dateKey,
      }, { merge: true }),
      setDoc(statsRef, { totalXP: increment(xpDelta) }, { merge: true }),
    ])
  }, [user, tomorrowRef, tomorrowLog, statsRef, dateKey])

  const toggleTomorrowQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !tomorrowRef || !tomorrowLog || !statsRef) return
    const done = (tomorrowLog.completedDailyQuests ?? []).includes(questId)
    const xpDelta = done ? -xp : xp

    // ALSO sync to aprilQuestLog — the canonical store DailyQuests reads from.
    // Bez tego quest zrobiony „na zapas" wczoraj nie wyświetli się dziś jako zrobiony.
    // arrayUnion/arrayRemove jest idempotentne, więc nie trzeba czytać stanu z getDoc.
    const aprilQuestLogRef = doc(db, ...paths.dataDoc(user.uid, 'aprilQuestLog'))

    await Promise.all([
      setDoc(tomorrowRef, {
        completedDailyQuests: done ? arrayRemove(questId) : arrayUnion(questId),
        totalXP: increment(xpDelta),
        date: dateKey,
      }, { merge: true }),
      setDoc(statsRef, {
        totalXP: increment(xpDelta),
        pillarXP: { [pillar]: increment(xpDelta) },
        totalQuestsCompleted: increment(done ? -1 : 1),
      }, { merge: true }),
      setDoc(aprilQuestLogRef, { completed: done ? arrayRemove(questId) : arrayUnion(questId) }, { merge: true }),
    ])
  }, [user, tomorrowRef, tomorrowLog, statsRef, dateKey])

  return { tomorrowLog, tomorrowDateKey: dateKey, loading, toggleTomorrowRoutine, toggleTomorrowQuest }
}
