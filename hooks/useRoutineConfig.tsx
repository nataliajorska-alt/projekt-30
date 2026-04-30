'use client'

import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
    const ref = doc(db, 'users', user.uid, 'config', 'routines')
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

  const saveConfig = useCallback(async (updates: Partial<RoutineConfig>) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'config', 'routines')
    const next = { ...config, ...updates, updatedAt: new Date().toISOString() }
    setConfig(next)
    await setDoc(ref, next, { merge: true })
  }, [user, config])

  const toggleItemEnabled = useCallback((itemId: string) => {
    const disabled = config.disabledItems.includes(itemId)
      ? config.disabledItems.filter((id) => id !== itemId)
      : [...config.disabledItems, itemId]
    saveConfig({ disabledItems: disabled })
  }, [config.disabledItems, saveConfig])

  const addCustomItem = useCallback((text: string, type: 'morning' | 'evening' | 'daily', xp: number) => {
    const item: RoutineItem = {
      id: `custom_${Date.now()}`,
      text,
      type,
      xp,
    }
    saveConfig({ customItems: [...config.customItems, item] })
  }, [config.customItems, saveConfig])

  const removeCustomItem = useCallback((itemId: string) => {
    saveConfig({ customItems: config.customItems.filter((i) => i.id !== itemId) })
  }, [config.customItems, saveConfig])

  const resetToDefaults = useCallback(() => {
    saveConfig({ disabledItems: [], customItems: [], itemOrder: undefined })
  }, [saveConfig])

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
