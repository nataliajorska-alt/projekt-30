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
import { todayKey, XP_VALUES } from '@/lib/gameLogic'
import {
  type CBTEntry, type CBTThoughtEntry, type CBTEmotionEntry, type CBTBeliefEntry, type CBTCopingEntry, type CBTCopingStyle, type CBTExposureLadder, type CBTExposureRung, type CBTShield, type CBTEmotionTag,
  emptyThought, emptyEmotion, emptyBelief, emptyCoping, emptyExposure, emptyShield, reframeComplete, restructureComplete, copingComplete, experimentComplete, rungMastered, cbtUid,
} from '@/lib/cbt-data'

type NewThought = { situation: string; emotions: CBTEmotionTag[]; thoughts: string; alt: string; altPct: number }
type NewEmotion = Omit<CBTEmotionEntry, 'id' | 'kind' | 'dateKey' | 'timestamp' | 'xpEarned' | 'updatedAt'>
type ThoughtPatch = Partial<Pick<CBTThoughtEntry, 'hot' | 'interro' | 'reframe' | 'reframeFeel'>>
type NewBelief = { trigger: string; ladder: string[]; coreBelief: string }
type NewCoping = { style: CBTCopingStyle; what: string; ways: string }
type CopingPatch = Partial<Pick<CBTCopingEntry, 'confront' | 'source' | 'healthy'>>
type BeliefPatch = Partial<Pick<CBTBeliefEntry,
  'behaveWhenActive' | 'ifOpposite' | 'source' | 'axisSelf' | 'axisOthers' | 'axisWorld'
  | 'newBelief' | 'newBeliefPct' | 'evidence' | 'confirmations' | 'pctHistory' | 'experiments'>>
type NewExposure = { area: string; rungs: CBTExposureRung[] }
type ExposurePatch = Partial<Pick<CBTExposureLadder, 'area' | 'rungs'>>

export function useCBT() {
  const { user } = useAuth()
  // awardCBTBelief (+25 restrukturyzacja) idzie teraz przez awardCBTBonus — jeden
  // award na zapis, żeby uniknąć nadpisania przy wielu nagrodach naraz.
  const { awardCBTCapture, awardCBTReframe, awardCBTCoping, awardCBTBonus } = useGameData()
  const [entries, setEntries] = useState<CBTEntry[]>([])
  const [shield, setShield] = useState<CBTShield>(emptyShield())
  const [loading, setLoading] = useState(true)
  // Zapobiega podwójnemu przyznaniu bonusu za reframe w oknie między startem
  // przyznania a odświeżeniem stanu (autozapis potrafi strzelić parę razy).
  const reframingRef = useRef<Set<string>>(new Set())
  // To samo dla bonusu za restrukturyzację przekonania.
  const restructuringRef = useRef<Set<string>>(new Set())
  // I dla bonusu za przepytanie stylu radzenia sobie.
  const copingRef = useRef<Set<string>>(new Set())
  // Bonusy stemplowane per-podjednostka (klucz `${entryId}:${subId}`): domknięty
  // eksperyment behawioralny i opanowany szczebel drabiny lęków.
  const experimentRef = useRef<Set<string>>(new Set())
  const exposureRef = useRef<Set<string>>(new Set())

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

  // Autozapis pogłębienia + restrukturyzacji + eksperymentów behawioralnych.
  // Bonusy (stemplowane na xpEarned, spójnie z recoverStats): +25 za restrukturyzację
  // (przekonanie kluczowe + nowe zdrowe wypełnione PIERWSZY raz), +30 za KAŻDY
  // domknięty eksperyment (zadanie + wynik + wniosek).
  //
  // Dwie pułapki, których pilnujemy (inaczej niż siblingi z flagą top-level):
  //  1) `awarded` eksperymentu żyje W TABLICY `experiments`, która JEST w patchu.
  //     Komponent trzyma lokalny stan zainicjowany raz i nie zna świeżego `awarded`,
  //     więc patch cofnąłby już przyznaną nagrodę do false → przy następnej sesji
  //     ponowne +30. Dlatego `awarded` bierzemy zawsze z `cur` (prawda z bazy),
  //     nigdy z patcha — to flaga systemowa, nie treść od użytkownika.
  //  2) Kilka nagród w jednym zapisie czytałoby ten sam nieświeży `stats` i drugi
  //     zapis nadpisałby pierwszy (utrata XP). Dlatego zliczamy CAŁY bonus tego
  //     zapisu i przyznajemy go JEDNYM wywołaniem awardCBTBonus.
  const updateBelief = useCallback(async (id: string, patch: BeliefPatch) => {
    if (!user) return
    const cur = entries.find(e => e.id === id && e.kind === 'belief') as CBTBeliefEntry | undefined
    if (!cur) return
    const merged: CBTBeliefEntry = { ...cur, ...patch, updatedAt: new Date().toISOString() }

    // (1) Zachowaj trwały `awarded` z bazy — patch nie może go wyzerować.
    const awardedExpIds = new Set(cur.experiments.filter(e => e.awarded).map(e => e.id))
    const exps = merged.experiments.map(e => (awardedExpIds.has(e.id) ? { ...e, awarded: true } : e))

    // Zbierz wszystkie nowe nagrody tego zapisu; rezerwuj refy (blokada wewnątrz sesji).
    let bonusXp = 0
    let takeRestructure = false
    const takeExpKeys: string[] = []
    const takeExpIdx: number[] = []
    if (!merged.restructureAwarded && restructureComplete(merged) && !restructuringRef.current.has(id)) {
      restructuringRef.current.add(id); takeRestructure = true; bonusXp += XP_VALUES.cbtRestructure // +25
    }
    exps.forEach((e, i) => {
      const key = `${id}:${e.id}`
      if (!e.awarded && experimentComplete(e) && !experimentRef.current.has(key)) {
        experimentRef.current.add(key); takeExpKeys.push(key); takeExpIdx.push(i); bonusXp += XP_VALUES.cbtExperiment // +30
      }
    })

    let earnedXp = merged.xpEarned // == cur.xpEarned (patch nigdy nie niesie xpEarned)
    if (bonusXp > 0) {
      const got = await awardCBTBonus(bonusXp) // (2) jedno wywołanie na cały bonus
      if (got > 0) {
        if (takeRestructure) merged.restructureAwarded = true
        takeExpIdx.forEach(i => { exps[i] = { ...exps[i], awarded: true } })
        earnedXp += got
      } else {
        // przyznanie nie weszło (stats jeszcze nie gotowe) — zwolnij rezerwacje na retry
        if (takeRestructure) restructuringRef.current.delete(id)
        takeExpKeys.forEach(k => experimentRef.current.delete(k))
      }
    }

    merged.experiments = exps
    merged.xpEarned = earnedXp
    setEntries(prev => prev.map(e => (e.id === id ? merged : e)))
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, id)),
      { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid, entries, awardCBTBonus])

  // ── Style radzenia sobie (rozdz. „Radzisz sobie. Tylko jak?") ───────────────

  const createCoping = useCallback(async (data: NewCoping): Promise<CBTCopingEntry | null> => {
    if (!user) return null
    const earned = await awardCBTCapture() // dzielona dzienna flaga capture +10
    const entry: CBTCopingEntry = {
      ...emptyCoping(cbtUid(), todayKey()),
      style: data.style,
      what: data.what,
      ways: data.ways,
      xpEarned: earned,
    }
    setEntries(prev => [entry, ...prev])
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, entry.id)),
      { ...entry, _serverUpdatedAt: serverTimestamp() }, { merge: true })
    return entry
  }, [user?.uid, awardCBTCapture])

  // Autozapis pytań z ćwiczenia. Gdy konfrontacja + zdrowa alternatywa wypełnione
  // PIERWSZY raz — bonus +20 i stempel xpEarned (spójnie z recoverStats).
  const updateCoping = useCallback(async (id: string, patch: CopingPatch) => {
    if (!user) return
    const cur = entries.find(e => e.id === id && e.kind === 'coping') as CBTCopingEntry | undefined
    if (!cur) return
    const merged: CBTCopingEntry = { ...cur, ...patch, updatedAt: new Date().toISOString() }

    if (!merged.copingAwarded && copingComplete(merged) && !copingRef.current.has(id)) {
      copingRef.current.add(id)
      const bonus = await awardCBTCoping() // +20
      if (bonus > 0) {
        merged.copingAwarded = true
        merged.xpEarned = cur.xpEarned + bonus
      } else {
        copingRef.current.delete(id) // przyznanie nie weszło — pozwól spróbować ponownie
      }
    }

    setEntries(prev => prev.map(e => (e.id === id ? merged : e)))
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, id)),
      { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid, entries, awardCBTCoping])

  // ── Drabina lęków / ekspozycja (rozdz. 11, ćw. 1–2) ─────────────────────────

  const createExposure = useCallback(async (data: NewExposure): Promise<CBTExposureLadder | null> => {
    if (!user) return null
    const earned = await awardCBTCapture() // dzielona dzienna flaga capture +10
    const entry: CBTExposureLadder = {
      ...emptyExposure(cbtUid(), todayKey()),
      area: data.area,
      rungs: data.rungs,
      xpEarned: earned,
    }
    setEntries(prev => [entry, ...prev])
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, entry.id)),
      { ...entry, _serverUpdatedAt: serverTimestamp() }, { merge: true })
    return entry
  }, [user?.uid, awardCBTCapture])

  // Autozapis planowania i logu ekspozycji. Za KAŻDY nowo opanowany szczebel
  // (done + „co mi się udało") bonus +15, stemplowany na xpEarned. Te same dwie
  // pułapki co w updateBelief: (1) `awarded` szczebla żyje w tablicy `rungs`
  // z patcha, więc bierzemy trwały `awarded` z `cur` (inaczej cofnięcie do false
  // → ponowne +15 co sesję i farmienie przez done→undone→done); (2) wiele
  // opanowanych szczebli w jednym zapisie = jeden łączny award.
  const updateExposure = useCallback(async (id: string, patch: ExposurePatch) => {
    if (!user) return
    const cur = entries.find(e => e.id === id && e.kind === 'exposure') as CBTExposureLadder | undefined
    if (!cur) return
    const merged: CBTExposureLadder = { ...cur, ...patch, updatedAt: new Date().toISOString() }

    const awardedRungIds = new Set(cur.rungs.filter(r => r.awarded).map(r => r.id))
    const rungs = merged.rungs.map(r => (awardedRungIds.has(r.id) ? { ...r, awarded: true } : r))

    let bonusXp = 0
    const takeKeys: string[] = []
    const takeIdx: number[] = []
    rungs.forEach((r, i) => {
      const key = `${id}:${r.id}`
      if (!r.awarded && rungMastered(r) && !exposureRef.current.has(key)) {
        exposureRef.current.add(key); takeKeys.push(key); takeIdx.push(i); bonusXp += XP_VALUES.cbtExposure // +15
      }
    })

    let earnedXp = merged.xpEarned
    if (bonusXp > 0) {
      const got = await awardCBTBonus(bonusXp) // jeden łączny award
      if (got > 0) { takeIdx.forEach(i => { rungs[i] = { ...rungs[i], awarded: true } }); earnedXp += got }
      else takeKeys.forEach(k => exposureRef.current.delete(k))
    }

    merged.rungs = rungs
    merged.xpEarned = earnedXp
    setEntries(prev => prev.map(e => (e.id === id ? merged : e)))
    await setDoc(doc(db, ...paths.cbtJournalDoc(user.uid, id)),
      { ...merged, _serverUpdatedAt: serverTimestamp() }, { merge: true })
  }, [user?.uid, entries, awardCBTBonus])

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
  const copings = entries.filter((e): e is CBTCopingEntry => e.kind === 'coping')
  const exposures = entries.filter((e): e is CBTExposureLadder => e.kind === 'exposure')
  const todayCount = entries.filter(e => e.dateKey === todayKey()).length

  return {
    loading, entries, thoughts, emotionEntries, beliefs, copings, exposures, shield, todayCount,
    createThought, updateThought, createEmotion, createBelief, updateBelief, createCoping, updateCoping,
    createExposure, updateExposure, deleteEntry, saveShield,
  }
}
