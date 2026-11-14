'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'

export interface CustomQuestIdea {
  id: string
  title: string
  description?: string
  createdAt: number
}

export function useCustomQuestLibrary() {
  const { user } = useAuth()
  const [quests, setQuests] = useState<CustomQuestIdea[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const snap = await getDoc(doc(db, ...paths.dataDoc(user.uid, 'appSettings')))
      if (snap.exists()) setQuests(snap.data().customQuestIdeas ?? [])
    } catch (err) {
      console.error('customQuestLibrary fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // Jeden pomysł na raz (arrayUnion / arrayRemove) zamiast całej listy ze stanu —
  // po nieudanym odczycie lista w stanie jest pusta i zapis „całości" kasował resztę.
  const change = useCallback(async (quest: CustomQuestIdea, add: boolean) => {
    if (!user) return
    await setDoc(
      doc(db, ...paths.dataDoc(user.uid, 'appSettings')),
      { customQuestIdeas: add ? arrayUnion(quest) : arrayRemove(quest) },
      { merge: true }
    )
    setQuests(prev => (add ? [...prev, quest] : prev.filter(q => q.id !== quest.id)))
  }, [user])

  const addQuest = useCallback(async (title: string, description?: string) => {
    // Opis tylko, gdy jest — `description: undefined` wywracało zapis w Firestore
    // (pomysł bez opisu nie dawał się dodać).
    const desc = description?.trim()
    const newQuest: CustomQuestIdea = {
      id: `cqi_${Date.now()}`,
      title: title.trim(),
      ...(desc ? { description: desc } : {}),
      createdAt: Date.now(),
    }
    await change(newQuest, true)
    return newQuest
  }, [change])

  const removeQuest = useCallback(async (id: string) => {
    // arrayRemove porównuje cały obiekt — bierzemy ten wczytany z bazy.
    const quest = quests.find(q => q.id === id)
    if (quest) await change(quest, false)
  }, [quests, change])

  return { quests, loading, addQuest, removeQuest }
}
