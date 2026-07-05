'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { useGameData } from './useGameData'
import { parseSafe, CBTEntrySchema, CBTShieldSchema } from '@/lib/schemas'
import { todayKey } from '@/lib/gameLogic'
import {
  type CBTEntry, type CBTThoughtEntry, type CBTEmotionEntry, type CBTBeliefEntry, type CBTShield, type CBTEmotionTag,
  emptyThought, emptyEmotion, emptyBelief, emptyShield, reframeComplete, restructureComplete, cbtUid,
} from '@/lib/cbt-data'

type NewThought = { situation: string; emotions: CBTEmotionTag[]; thoughts: string; alt: string; altPct: number }
type NewEmotion = Omit<CBTEmotionEntry, 'id' | 'kind' | 'dateKey' | 'timestamp' | 'xpEarned' | 'updatedAt'>
type ThoughtPatch = Partial<Pick<CBTThoughtEntry, 'hot' | 'interro' | 'reframe' | 'reframeFeel'>>
type NewBelief = { trigger: string; ladder: string[]; coreBelief: string }
type BeliefPatch = Partial<Pick<CBTBeliefEntry,
  'behaveWhenActive' | 'ifOpposite' | 'source' | 'axisSelf' | 'axisOthers' | 'axisWorld'
  | 'newBelief' | 'newBeliefPct' | 'evidence' | 'confirmations' | 'pctHistory'>>

export function useCBT() {
  const { user } = useAuth()
  const { awardCBTCapture, awardCBTReframe, awardCBTBelief } = useGameData()
  const [entries, setEntries] = useState<CBTEntry[]>([])
  const [shield, setShield] = useState<CBTShield>(emptyShield())
  const [loading, setLoading] = useState(true)
  // Zapobiega podwójnemu przyznaniu bonusu za reframe w oknie między startem
  // przyznania a odświeżeniem stanu (autozapis potrafi strzelić parę razy).
  const reframingRef = useRef<Set<string>>(new Set())
  // To samo dla bonusu za restrukturyzację przekonania.
  const restructuringRef = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const q = query(collection(db, ...paths.cbtJournalCol(user.uid)), orderBy('timestamp', 'desc'))
    const [snap, shieldSnap] = await Promise.all([
      getDocs(q),
      getDoc(doc(db, ...paths.dataDoc(user.uid, 'cbtShield'))),
    ])
    setEntries(snap.docs.map(d =>
      parseSafe<CBTEntry>(CBTEntrySchema, d.data(), emptyThought(d.id, ''), `CBTEntry ${d.id}`)))
    setShield(shieldSnap.exists()
      ? parseSafe<CBTShield>(CBTShieldSchema, shieldSnap.data(), emptyShield(), 'CBTShield')
      : emptyShield())
    setLoading(false)
  }, [user?.uid])

  useEffect(() => { load() }, [load])

  // ── Myśli ─────────────────────────────────────────────────────────────────

  const createThought = useCallback(async (data: NewThought): Promise<CBTThoughtEntry | null> => {
    if (!user) return null
    const earned = await awardCBTCapture() // +10 raz dziennie (0 jeśli już dziś było)
    const entry: CBTThoughtEntry = {
      ...emptyThought(cbtUid(), todayKey()),
      situation: data.situation,
      emotions: data.emotions,
      thoughts: data.thoughts,
      alt: data.alt,
      altPct: data.altPct,
      xpEarned: earned,
    }
    setEntries(prev => [entry, ...prev])
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, entry.id)),
      { ...entry, _serverUpdatedAt: serverTimestamp() }, { merge: true })
    return entry
  }, [user?.uid, awardCBTCapture])

  // Autozapis wywiadu z gorącą myślą. Gdy hot + reframe wypełnione PIERWSZY raz —
  // przyznaje bonus +20 i stempluje xpEarned (spójnie z recoverStats).
  const updateThought = useCallback(async (id: string, patch: ThoughtPatch) => {
    if (!user) return
    const cur = entries.find(e => e.id === id && e.kind === 'thought') as CBTThoughtEntry | undefined
    if (!cur) return
    const merged: CBTThoughtEntry = { ...cur, ...patch, updatedAt: new Date().toISOString() }

    if (!merged.reframeAwarded && reframeComplete(merged) && !reframingRef.current.has(id)) {
      reframingRef.current.add(id)
      const bonus = await awardCBTReframe() // +20
      if (bonus > 0) {
        merged.reframeAwarded = true
        merged.xpEarned = cur.xpEarned + bonus
      } else {
        reframingRef.current.delete(id) // przyznanie nie weszło — pozwól spróbować ponownie
      }
    }

    setEntries(prev => prev.map(e => (e.id === id ? merged : e)))
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, id)),
      { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid, entries, awardCBTReframe])

  // ── Emocje ──────────────────────────────────────────────────────────────────

  const createEmotion = useCallback(async (data: NewEmotion): Promise<CBTEmotionEntry | null> => {
    if (!user) return null
    const earned = await awardCBTCapture() // dzielona dzienna flaga capture +10
    const entry: CBTEmotionEntry = {
      ...emptyEmotion(cbtUid(), todayKey()),
      ...data,
      xpEarned: earned,
    }
    setEntries(prev => [entry, ...prev])
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, entry.id)),
      { ...entry, _serverUpdatedAt: serverTimestamp() }, { merge: true })
    return entry
  }, [user?.uid, awardCBTCapture])

  // ── Przekonania (strzałka w dół) ────────────────────────────────────────────

  const createBelief = useCallback(async (data: NewBelief): Promise<CBTBeliefEntry | null> => {
    if (!user) return null
    const earned = await awardCBTCapture() // dzielona dzienna flaga capture +10
    const entry: CBTBeliefEntry = {
      ...emptyBelief(cbtUid(), todayKey()),
      trigger: data.trigger,
      ladder: data.ladder,
      coreBelief: data.coreBelief,
      xpEarned: earned,
    }
    setEntries(prev => [entry, ...prev])
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, entry.id)),
      { ...entry, _serverUpdatedAt: serverTimestamp() }, { merge: true })
    return entry
  }, [user?.uid, awardCBTCapture])

  // Autozapis pogłębienia + restrukturyzacji. Gdy przekonanie kluczowe + nowe
  // zdrowe przekonanie wypełnione PIERWSZY raz — bonus +25 i stempel xpEarned.
  const updateBelief = useCallback(async (id: string, patch: BeliefPatch) => {
    if (!user) return
    const cur = entries.find(e => e.id === id && e.kind === 'belief') as CBTBeliefEntry | undefined
    if (!cur) return
    const merged: CBTBeliefEntry = { ...cur, ...patch, updatedAt: new Date().toISOString() }

    if (!merged.restructureAwarded && restructureComplete(merged) && !restructuringRef.current.has(id)) {
      restructuringRef.current.add(id)
      const bonus = await awardCBTBelief() // +25
      if (bonus > 0) {
        merged.restructureAwarded = true
        merged.xpEarned = cur.xpEarned + bonus
      } else {
        restructuringRef.current.delete(id) // przyznanie nie weszło — pozwól spróbować ponownie
      }
    }

    setEntries(prev => prev.map(e => (e.id === id ? merged : e)))
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, id)),
      { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid, entries, awardCBTBelief])

  // ── Wspólne ─────────────────────────────────────────────────────────────────

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return
    setEntries(prev => prev.filter(e => e.id !== id))
    await deleteDoc(doc(db, ...paths.cbtJournalDoc(user.uid, id)))
  }, [user?.uid])

  // ── Tarcza (bez XP) ───────────────────────────────────────────────────────
  const saveShield = useCallback(async (next: CBTShield) => {
    if (!user) return
    const merged = { ...next, updatedAt: new Date().toISOString() }
    setShield(merged)
    await setDoc(doc(db, ...paths.dataDoc(user.uid, 'cbtShield')),
      { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid])

  const thoughts = entries.filter((e): e is CBTThoughtEntry => e.kind === 'thought')
  const emotionEntries = entries.filter((e): e is CBTEmotionEntry => e.kind === 'emotion')
  const beliefs = entries.filter((e): e is CBTBeliefEntry => e.kind === 'belief')
  const todayCount = entries.filter(e => e.dateKey === todayKey()).length

  return {
    loading, entries, thoughts, emotionEntries, beliefs, shield, todayCount,
    createThought, updateThought, createEmotion, createBelief, updateBelief, deleteEntry, saveShield,
  }
}
