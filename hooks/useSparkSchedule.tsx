'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export function useSparkSchedule() {
  const { user } = useAuth()
  const [sparks, setSparks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'data', 'sparkSchedule')
    getDoc(ref)
      .then(snap => {
        if (snap.exists()) setSparks(snap.data().sparks ?? {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const saveSparks = async (updated: Record<string, string>) => {
    if (!user) return
    setSaving(true)
    try {
      const ref = doc(db, 'users', user.uid, 'data', 'sparkSchedule')
      await setDoc(ref, { sparks: updated })
      setSparks(updated)
    } finally {
      setSaving(false)
    }
  }

  return { sparks, loading, saving, saveSparks }
}
