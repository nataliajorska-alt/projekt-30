'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { getDaysElapsed, todayKey } from '@/lib/gameLogic'
import { VaultEntrySchema, VaultReplySchema, parseSafe } from '@/lib/schemas'
import type { VaultEntry, VaultReply, LetterType, UnlockType, MoodState } from '@/types'

// Stare listy bez letterType są traktowane jako future/quarterly.
const LEGACY_DEFAULTS = { letterType: 'future' as LetterType, unlockType: 'quarterly' as UnlockType }

export interface NewLetterDraft {
  letterType: LetterType
  unlockType: UnlockType
  title: string
  content: string                // dla 'vent' przekaż pełny tekst — hook sam zdecyduje co zapisać
  unlockDate?: string            // YYYY-MM-DD — wymagane dla 'date' i 'gratitude'
  moodAtWriting?: MoodState
  promptUsed?: string
}

export function useVault() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const ref = collection(db, ...paths.vaultCol(user.uid))
      const q = query(ref, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)

      // Ładujemy listy + ich replies równolegle (subkolekcja per list).
      const loaded = await Promise.all(snap.docs.map(async d => {
        const raw = { id: d.id, ...LEGACY_DEFAULTS, ...d.data() }
        const parsed = parseSafe<VaultEntry>(VaultEntrySchema, raw, { ...raw } as VaultEntry, `VaultEntry ${d.id}`)

        const repliesSnap = await getDocs(query(
          collection(db, ...paths.vaultRepliesCol(user.uid, d.id)),
          orderBy('createdAt', 'asc'),
        ))
        const replies: VaultReply[] = repliesSnap.docs.map(r => {
          const rraw = { id: r.id, ...r.data() }
          return parseSafe<VaultReply>(VaultReplySchema, rraw, rraw as VaultReply, `VaultReply ${r.id}`)
        })

        return { ...parsed, replies }
      }))

      setEntries(loaded)
    } catch (err) {
      console.error('vault fetch error:', err)
    } finally {
      // Bez finally jeden odrzucony getDocs zostawiałby loading=true na zawsze,
      // a /report bramkuje cały render na vaultLoading — wieczny spinner
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { load() }, [load])

  const addEntry = useCallback(async (draft: NewLetterDraft) => {
    if (!user) return
    const ref = collection(db, ...paths.vaultCol(user.uid))
    const isVent = draft.letterType === 'vent'
    const dateKey = todayKey()
    const dayOfProject = getDaysElapsed() + 1
    const charCount = draft.content.length

    // Vent — NIE zapisujemy treści. Tylko meta: typ, data, mood, charCount.
    // Tytuł też zostaje pusty, żeby nic nie wyciekało.
    const payload: Record<string, unknown> = {
      letterType:   draft.letterType,
      unlockType:   draft.unlockType,
      title:        isVent ? '' : (draft.title.trim() || 'List bez tytułu'),
      content:      isVent ? '' : draft.content.trim(),
      dateKey,
      dayOfProject,
      createdAt:    serverTimestamp(),
      charCount,
    }
    if (draft.unlockDate)    payload.unlockDate    = draft.unlockDate
    if (draft.moodAtWriting) payload.moodAtWriting = draft.moodAtWriting
    if (draft.promptUsed && !isVent) payload.promptUsed = draft.promptUsed

    const docRef = await addDoc(ref, payload)

    const newEntry: VaultEntry = {
      id:            docRef.id,
      letterType:    draft.letterType,
      unlockType:    draft.unlockType,
      title:         isVent ? '' : (draft.title.trim() || 'List bez tytułu'),
      content:       isVent ? '' : draft.content.trim(),
      dateKey,
      dayOfProject,
      createdAt:     new Date().toISOString(),
      charCount,
      unlockDate:    draft.unlockDate,
      moodAtWriting: draft.moodAtWriting,
      promptUsed:    isVent ? undefined : draft.promptUsed,
      replies:       [],
    }
    setEntries(prev => [newEntry, ...prev])
  }, [user?.uid])

  const removeEntry = useCallback(async (id: string) => {
    if (!user) return
    // Usuwamy najpierw replies, potem sam list.
    const repliesSnap = await getDocs(collection(db, ...paths.vaultRepliesCol(user.uid, id)))
    await Promise.all(repliesSnap.docs.map(r => deleteDoc(r.ref)))
    await deleteDoc(doc(db, ...paths.vaultDoc(user.uid, id)))
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [user?.uid])

  const addReply = useCallback(async (
    letterId: string,
    content: string,
    moodAtWriting?: MoodState,
  ) => {
    if (!user || !content.trim()) return
    const ref = collection(db, ...paths.vaultRepliesCol(user.uid, letterId))
    const dateKey = todayKey()
    const dayOfProject = getDaysElapsed() + 1
    const payload: Record<string, unknown> = {
      content:   content.trim(),
      dateKey,
      dayOfProject,
      createdAt: serverTimestamp(),
    }
    if (moodAtWriting) payload.moodAtWriting = moodAtWriting

    const docRef = await addDoc(ref, payload)
    const newReply: VaultReply = {
      id:        docRef.id,
      content:   content.trim(),
      dateKey,
      dayOfProject,
      moodAtWriting,
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => prev.map(e =>
      e.id === letterId ? { ...e, replies: [...(e.replies ?? []), newReply] } : e
    ))
  }, [user?.uid])

  const removeReply = useCallback(async (letterId: string, replyId: string) => {
    if (!user) return
    await deleteDoc(doc(db, ...paths.vaultReplyDoc(user.uid, letterId, replyId)))
    setEntries(prev => prev.map(e =>
      e.id === letterId ? { ...e, replies: (e.replies ?? []).filter(r => r.id !== replyId) } : e
    ))
  }, [user?.uid])

  return { entries, loading, addEntry, removeEntry, addReply, removeReply }
}
