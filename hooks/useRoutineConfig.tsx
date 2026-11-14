'use client'

import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from '@/lib/db'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from '@/hooks/useAuth'
import {
  MORNING_ROUTINE, EVENING_ROUTINE, DAILY_HABITS,
  MORNING_MINIMUM, EVENING_MINIMUM,
} from '@/lib/routineData'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import type { RoutineItem, RoutineConfig, MinimumDayReason } from '@/types'

const DEFAULT_CONFIG: RoutineConfig = {
  disabledItems: [],
  customItems: [],
  updatedAt: '',
}

export function useRoutineConfig() {
  const { user } = useAuth()
  const [config, setConfig] = useState<RoutineConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, ...paths.configDoc(user.uid, 'routines'))
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as RoutineConfig)
      } else {
        setConfig(DEFAULT_CONFIG)
      }
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return unsub
  }, [user])

  // Każda zmiana zapisuje WYŁĄCZNIE swój element (arrayUnion / arrayRemove), a nie
  // całą konfigurację ze stanu Reacta. Stan bywa pusty — zanim dojdzie nasłuch,
  // po błędzie odczytu albo gdy apka wstała bez zasięgu — i zapis „całości"
  // kasował wtedy własne pozycje rutyny i listę wyłączonych.
  // `local` to natychmiastowy podgląd w UI; prawdę i tak dosyła nasłuch.
  const write = useCallback(async (local: Partial<RoutineConfig>, remote: Record<string, unknown>) => {
    if (!user) return
    const ref = doc(db, ...paths.configDoc(user.uid, 'routines'))
    const updatedAt = new Date().toISOString()
    setConfig(prev => ({ ...prev, ...local, updatedAt }))
    await setDoc(ref, { ...remote, updatedAt }, { merge: true })
  }, [user])

  const toggleItemEnabled = useCallback((itemId: string) => {
    const isDisabled = config.disabledItems.includes(itemId)
    write(
      { disabledItems: isDisabled ? config.disabledItems.filter((id) => id !== itemId) : [...config.disabledItems, itemId] },
      { disabledItems: isDisabled ? arrayRemove(itemId) : arrayUnion(itemId) },
    )
  }, [config.disabledItems, write])

  const addCustomItem = useCallback((text: string, type: 'morning' | 'evening' | 'daily', xp: number) => {
    const item: RoutineItem = {
      id: `custom_${Date.now()}`,
      text,
      type,
      xp,
    }
    write({ customItems: [...config.customItems, item] }, { customItems: arrayUnion(item) })
  }, [config.customItems, write])

  const removeCustomItem = useCallback((itemId: string) => {
    const item = config.customItems.find((i) => i.id === itemId)
    if (!item) return
    write({ customItems: config.customItems.filter((i) => i.id !== itemId) }, { customItems: arrayRemove(item) })
  }, [config.customItems, write])

  const resetToDefaults = useCallback(() => {
    // Świadomy pełny reset — tu nadpisanie obu list jest celem. Bez
    // `itemOrder: undefined`: Firestore odrzucał undefined i „Przywróć domyślne"
    // po cichu się nie zapisywało (po odświeżeniu własne pozycje wracały).
    const cleared = { disabledItems: [], customItems: [] }
    write(cleared, cleared)
  }, [write])

  /** Returns the effective routine list for a given category and mode. */
  const getEffectiveItems = useCallback((
    category: 'morning' | 'evening' | 'daily',
    isMinimum: boolean,
    extraDailyItems?: RoutineItem[],
    minimumReason?: MinimumDayReason,
  ): RoutineItem[] => {
    let defaults: RoutineItem[]
    if (isMinimum && minimumReason) {
      // New: filter normal routine by reason
      if (category === 'morning') {
        defaults = filterItemsForMinimumDay(MORNING_ROUTINE, minimumReason)
      } else if (category === 'evening') {
        defaults = filterItemsForMinimumDay(EVENING_ROUTINE, minimumReason)
      } else {
        defaults = []
      }
    } else if (category === 'morning') {
      defaults = isMinimum ? MORNING_MINIMUM : MORNING_ROUTINE
    } else if (category === 'evening') {
      defaults = isMinimum ? EVENING_MINIMUM : EVENING_ROUTINE
    } else {
      defaults = isMinimum ? [] : [...DAILY_HABITS, ...(extraDailyItems ?? [])]
    }

    // Filter out disabled default items
    const filtered = defaults.filter((i) => !config.disabledItems.includes(i.id))

    // Add custom items for this category (not in minimum mode)
    const customs = isMinimum ? [] : config.customItems.filter((i) => i.type === category)

    return [...filtered, ...customs]
  }, [config.disabledItems, config.customItems])

  /** Returns all default items for a category (for settings display). */
  const getDefaultItems = useCallback((category: 'morning' | 'evening' | 'daily'): RoutineItem[] => {
    if (category === 'morning') return MORNING_ROUTINE
    if (category === 'evening') return EVENING_ROUTINE
    return DAILY_HABITS
  }, [])

  const getCustomItems = useCallback((category: 'morning' | 'evening' | 'daily'): RoutineItem[] => {
    return config.customItems.filter((i) => i.type === category)
  }, [config.customItems])

  const isItemDisabled = useCallback((itemId: string) => {
    return config.disabledItems.includes(itemId)
  }, [config.disabledItems])

  return {
    config,
    loading,
    getEffectiveItems,
    getDefaultItems,
    getCustomItems,
    isItemDisabled,
    toggleItemEnabled,
    addCustomItem,
    removeCustomItem,
    resetToDefaults,
  }
}
