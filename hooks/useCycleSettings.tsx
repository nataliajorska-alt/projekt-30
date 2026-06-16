'use client'
import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from './useAuth'
import { DEFAULT_CYCLE_SETTINGS, type CycleSettings } from '@/lib/cycle-data'

export function useCycleSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, ...paths.dataDoc(user.uid, 'cycleSettings'))
    getDoc(ref)
      .then(snap => {
        if (snap.exists()) setSettings({ ...DEFAULT_CYCLE_SETTINGS, ...snap.data() })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const saveSettings = useCallback(async (s: CycleSettings) => {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(doc(db, ...paths.dataDoc(user.uid, 'cycleSettings')), s)
      setSettings(s)
    } finally {
      setSaving(false)
    }
  }, [user])

  return { settings, loading, saving, saveSettings }
}
