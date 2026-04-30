'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
      const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'appSettings'))
      if (snap.exists()) setQuests(snap.data().customQuestIdeas ?? [])
    } catch (err) {
      console.error('customQuestLibrary fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const saveQuests = useCallback(async (updated: CustomQuestIdea[]) => {
    if (!user) return
    await setDoc(
      doc(db, 'users', user.uid, 'data', 'appSettings'),
      { customQuestIdeas: updated },
      { merge: true }
    )
    setQuests(updated)
  }, [user])

  const addQuest = useCallback(async (title: string, description?: string) => {
    const newQuest: CustomQuestIdea = {
      id: `cqi_${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || undefined,
      createdAt: Date.now(),
    }
    const updated = [...quests, newQuest]
    await saveQuests(updated)
    return newQuest
  }, [quests, saveQuests])

  const removeQuest = useCallback(async (id: string) => {
    await saveQuests(quests.filter(q => q.id !== id))
  }, [quests, saveQuests])

  return { quests, loading, addQuest, removeQuest }
}
