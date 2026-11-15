'use client'
import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { parseSafe, DailyLogSchema } from '@/lib/schemas'
import type { DailyLog } from '@/types'

type LogMap = Record<string, DailyLog>

// ── Wspólna pamięć historii logów ──────────────────────────────────────
// Cała kolekcja logów (jeden dokument na dzień projektu — z czasem 365) była
// pobierana osobno przez KAŻDY komponent wołający ten hook i jeszcze raz przy
// każdym powrocie do okna. Na „Dziś" robią to cztery komponenty naraz, więc
// jedno otwarcie apki to było ~4× cała historia. Teraz: jedno pobranie na raz,
// wynik współdzielony między komponentami i ważny przez FRESH_MS.
const FRESH_MS = 60_000

let cache: { uid: string; at: number; logs: LogMap } | null = null
let inFlight: { uid: string; promise: Promise<LogMap> } | null = null
const listeners = new Set<(logs: LogMap) => void>()

async function loadLogs(uid: string, force: boolean): Promise<LogMap> {
  if (!force && cache && cache.uid === uid && Date.now() - cache.at < FRESH_MS) return cache.logs
  if (inFlight && inFlight.uid === uid) return inFlight.promise

  const promise = (async () => {
    const snap = await getDocs(collection(db, ...paths.logsCol(uid)))
    const map: LogMap = {}
    snap.forEach(doc => {
      const parsed = parseSafe<DailyLog>(
        DailyLogSchema,
        doc.data(),
        {
          date: doc.id,
          completedRoutine: [],
          completedDailyQuests: [],
          completedSideQuests: [],
          keptRules: [],
          totalXP: 0,
          dayMode: 'normal',
        } as DailyLog,
        `DailyLog ${doc.id}`,
      )
      map[doc.id] = { ...parsed, date: doc.id }   // doc.id jako source of truth dla date
    })
    cache = { uid, at: Date.now(), logs: map }
    listeners.forEach(l => l(map))
    return map
  })()
  inFlight = { uid, promise }
  try {
    return await promise
  } finally {
    if (inFlight?.promise === promise) inFlight = null
  }
}

/**
 * Dzisiejszy log na żywo (z nasłuchu w useGameData) wpisany do wspólnej pamięci:
 * strona otwarta chwilę po odhaczeniu (Historia, Raport) widzi je od razu, mimo
 * że nie pobiera historii ponownie. Celowo NIE budzi już zamontowanych
 * komponentów — silnik wzorców tygodnia przeliczałby się po każdym odhaczeniu.
 */
export function patchTimelineLog(uid: string, dateKey: string, log: DailyLog) {
  if (!cache || cache.uid !== uid) return
  cache = { ...cache, logs: { ...cache.logs, [dateKey]: { ...log, date: dateKey } } }
}

export function useTimelineData() {
  const { user } = useAuth()
  const uid = user?.uid
  const [logs, setLogs] = useState<LogMap>(() => (cache && cache.uid === uid ? cache.logs : {}))
  const [loading, setLoading] = useState(() => !(cache && cache.uid === uid))

  const fetchLogs = useCallback(async (force = false) => {
    if (!uid) { setLoading(false); return }
    try {
      setLogs(await loadLogs(uid, force))
    } catch (err) {
      console.error('timeline fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    // Świeże dane od innego komponentu (albo z refetch) trafiają do wszystkich.
    listeners.add(setLogs)
    fetchLogs()
    return () => { listeners.delete(setLogs) }
  }, [fetchLogs])

  // Refetch when tab regains focus so heatmap stays current after logging activity elsewhere.
  useEffect(() => {
    const onFocus = () => fetchLogs()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchLogs])

  /** Wymusza świeże pobranie (pomija okno ważności). */
  const refetch = useCallback(() => fetchLogs(true), [fetchLogs])

  return { logs, loading, refetch }
}
