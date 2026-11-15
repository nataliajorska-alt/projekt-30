'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { useGameData } from './useGameData'
import { emit } from '@/lib/rewards'
import type { Pillar } from '@/types'

export interface QuestSkip {
  questId: string
  reason: string
  skippedAt: string
}

export interface QuestPostpone {
  questId: string
  originalDate: string
  targetDate: string
  postponedAt: string
}

interface AprilQuestLog {
  completed: string[]
  skips: QuestSkip[]
  postponed: QuestPostpone[]
}

const DEFAULT_LOG: AprilQuestLog = { completed: [], skips: [], postponed: [] }

export function useAprilQuests() {
  const { user } = useAuth()
  const { toggleDailyQuest, todayLog } = useGameData()
  const [log, setLog] = useState<AprilQuestLog>(DEFAULT_LOG)
  const [loading, setLoading] = useState(true)

  const logRef = user ? doc(db, ...paths.dataDoc(user.uid, 'aprilQuestLog')) : null

  useEffect(() => {
    if (!user || !logRef) { setLoading(false); return }
    const unsub = onSnapshot(logRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          // backwards compat: old postponed was string[], migrate to QuestPostpone[]
          const rawPostponed = data.postponed ?? []
          const migratedPostponed: QuestPostpone[] = rawPostponed.filter(
            (p: any) => typeof p === 'object' && p.questId && p.targetDate
          )
          setLog({
            completed: data.completed ?? [],
            skips: data.skips ?? [],
            postponed: migratedPostponed,
          })
        } else {
          setLog(DEFAULT_LOG)
        }
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [user?.uid])

  // Guardy niżej czytają snapshoty stanu Reacta, więc drugie tapnięcie
  // w trakcie zapisu (setDoc + XP trwa setki ms) przechodziłoby oba i XP
  // naliczałoby się podwójnie — ref-owy lock trzyma questy „w locie".
  const inFlightRef = useRef<Set<string>>(new Set())

  const completeQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !logRef || log.completed.includes(questId) || inFlightRef.current.has(questId)) return
    inFlightRef.current.add(questId)
    // If quest was already pre-completed "na zapas" (sits in todayLog.completedDailyQuests),
    // XP was already awarded yesterday — skip toggleDailyQuest to prevent double-counting.
    const alreadyInTodayLog = todayLog?.completedDailyQuests?.includes(questId) ?? false
    // Nagroda (RewardLayer) od razu — setDoc niżej czeka na serwer, a offline
    // aż do powrotu sieci. XP jak w toggleDailyQuest: dzień minimum ×2.
    if (!alreadyInTodayLog) {
      emit('reward', { source: 'quest', id: questId, xp: todayLog?.dayMode === 'minimum' ? xp * 2 : xp })
    }
    try {
      // Oba zapisy startują od razu, obok siebie. Wcześniej naliczenie XP czekało
      // na potwierdzenie pierwszego zapisu z serwera — przy słabej sieci quest był
      // „ukończony", ale XP dochodziło po sekundach albo (po zamknięciu apki) wcale.
      await Promise.all([
        // arrayUnion zamiast rozlewania snapshotu — zapis całej tablicy gubił
        // quest odhaczony równolegle chwilę wcześniej (lock jest per-questId).
        setDoc(logRef, { completed: arrayUnion(questId) }, { merge: true }),
        // Przekazujemy realną wartość questa (q.xp), nie płaskie 50.
        alreadyInTodayLog ? Promise.resolve() : toggleDailyQuest(questId, pillar, xp),
      ])
    } finally {
      inFlightRef.current.delete(questId)
    }
  }, [user, logRef, log, todayLog, toggleDailyQuest])

  // Cofnięcie omyłkowego „Zrobione". Rutynę i zasady da się odhaczyć z powrotem,
  // a quest po jednym stuknięciu był zaliczony na stałe — z XP, którego nie dało
  // się oddać. XP wraca tylko wtedy, gdy quest został zaliczony DZIŚ (siedzi
  // w dzisiejszym logu); dawniejszego zaliczenia nie rozliczamy z dzisiejszych punktów.
  const uncompleteQuest = useCallback(async (questId: string, pillar: Pillar, xp: number) => {
    if (!user || !logRef || !log.completed.includes(questId) || inFlightRef.current.has(questId)) return
    inFlightRef.current.add(questId)
    const inTodayLog = todayLog?.completedDailyQuests?.includes(questId) ?? false
    try {
      await Promise.all([
        setDoc(logRef, { completed: arrayRemove(questId) }, { merge: true }),
        // toggleDailyQuest na queście z dzisiejszego logu = zdjęcie go i odjęcie XP.
        inTodayLog ? toggleDailyQuest(questId, pillar, xp) : Promise.resolve(),
      ])
    } finally {
      inFlightRef.current.delete(questId)
    }
  }, [user, logRef, log.completed, todayLog, toggleDailyQuest])

  // Pominięcie i przeniesienie zapisują WYŁĄCZNIE swoje pole (arrayUnion /
  // arrayRemove). Wcześniej szedł tu cały `log` ze stanu Reacta — gdy stan był
  // pusty (nasłuch jeszcze nie doszedł, błąd odczytu, apka otwarta bez zasięgu),
  // zapis `completed: []` kasował po powrocie sieci całą historię ukończonych
  // questów, a zapis z drugiego urządzenia ginął.
  const skipQuest = useCallback(async (questId: string, reason: string) => {
    if (!user || !logRef) return
    const skip: QuestSkip = { questId, reason, skippedAt: new Date().toISOString() }
    await setDoc(logRef, { skips: arrayUnion(skip) }, { merge: true })
  }, [user, logRef])

  const postponeQuest = useCallback(async (questId: string, originalDate: string, targetDate: string) => {
    if (!user || !logRef) return
    const entry: QuestPostpone = {
      questId,
      originalDate,
      targetDate,
      postponedAt: new Date().toISOString(),
    }
    // Quest ma mieć jeden termin — poprzednie przeniesienie tego samego questa
    // wypada. Dwa zapisy idą do serwera w tej kolejności, w jakiej je wołamy.
    const previous = log.postponed.filter(p => p.questId === questId)
    if (previous.length > 0) {
      void setDoc(logRef, { postponed: arrayRemove(...previous) }, { merge: true })
    }
    await setDoc(logRef, { postponed: arrayUnion(entry) }, { merge: true })
  }, [user, logRef, log.postponed])

  const skippedIds = log.skips.map(s => s.questId)

  return { log, skippedIds, loading, completeQuest, uncompleteQuest, skipQuest, postponeQuest }
}
