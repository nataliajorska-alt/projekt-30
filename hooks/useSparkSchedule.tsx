'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, deleteField } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from '@/hooks/useAuth'

export function useSparkSchedule() {
  const { user } = useAuth()
  const [sparks, setSparks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, ...paths.dataDoc(user.uid, 'sparkSchedule'))
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
      const ref = doc(db, ...paths.dataDoc(user.uid, 'sparkSchedule'))
      // Tylko dni, które się zmieniły (merge), usunięte przez deleteField.
      // Wcześniej szła cała mapa bez merge — po nieudanym odczycie zapis jednego
      // tygodnia kasował iskry zaplanowane na wszystkie pozostałe.
      const patch: Record<string, unknown> = {}
      for (const [day, text] of Object.entries(updated)) if (sparks[day] !== text) patch[day] = text
      for (const day of Object.keys(sparks)) if (!(day in updated)) patch[day] = deleteField()
      if (Object.keys(patch).length > 0) await setDoc(ref, { sparks: patch }, { merge: true })
      setSparks(updated)
    } finally {
      setSaving(false)
    }
  }

  return { sparks, loading, saving, saveSparks }
}
