'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { LogOut, Lock, Mail, Download, Printer, Sun, Moon, Sparkles, Plus, X, RotateCcw, Bell, Phone, ShieldAlert, Swords, BrainCircuit } from 'lucide-react'
import { useNominatedContacts } from '@/hooks/useNominatedContacts'
import { useCustomQuestLibrary } from '@/hooks/useCustomQuestLibrary'
import type { NominatedContact } from '@/types'
import { exportLogsAsCSV, exportQuestsAsCSV, exportReviewsAsCSV, exportStatsAsCSV, exportAllAsCSV, exportAsMarkdown } from '@/lib/exportData'
import type { DateRange } from '@/lib/exportData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { useSparkSchedule } from '@/hooks/useSparkSchedule'
import { useGameData } from '@/hooks/useGameData'
import {
  loadPreferences,
  savePreferences,
  requestPermission,
  getPermissionStatus,
  scheduleWithTimeout,
  scheduleRemindersViaSW,
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type ReminderType,
} from '@/lib/notifications'
import clsx from 'clsx'

type RecoveryBreakdown = {
  fromLogs: number; fromWeeklyReviews: number; fromMonthlyReviews: number
  fromAchievements: number; total: number; weeklyCount: number; monthlyCount: number; achievementsCount: number
}

const PILLAR_NAMES: Record<string, string> = {
  pozycja: 'Pozycja', cialo: 'Ciało', styl: 'Styl',
  kapital: 'Kapitał', kariera: 'Kariera', tozsamosc: 'Tożsamość', milosc: 'Miłość',
}

export default function XPRecoverySection() {
  const { stats, recoverStats, applyRecoveredStats } = useGameData()
  const [breakdown, setBreakdown] = useState<RecoveryBreakdown | null>(null)
  const [recoveredStats, setRecoveredStats] = useState<import('@/types').UserStats | null>(null)
  const [scanning, setScanning] = useState(false)
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState(false)
  const handleScan = async () => {
    setScanning(true)
    setBreakdown(null)
    setRecoveredStats(null)
    setDone(false)
    try {
      const r = await recoverStats()
      if (r) {
        setBreakdown(r.breakdown)
        setRecoveredStats(r.reconstructedStats)
      }
    } finally {
      setScanning(false)
    }
  }

  const handleApply = async () => {
    if (!recoveredStats) return
    setApplying(true)
    try {
      await applyRecoveredStats(recoveredStats)
      setDone(true)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-1 flex items-center gap-2">
        <ShieldAlert size={18} strokeWidth={1.5} className="text-muted" />
        Odzyskiwanie danych
      </h2>
      <p className="font-sans text-xs text-muted mb-4">
        Jeśli XP lub osiągnięcia zniknęły — użyj tego narzędzia. Przeskanuje wszystkie wpisy, przeglądy i osiągnięcia od nowa.
      </p>

      <p className="font-sans text-sm text-dark mb-4">
        Aktualne XP: <span className="font-semibold text-gold">{stats.totalXP}</span>
      </p>

      {breakdown !== null && !done && (
        <div className="bg-cream/60 rounded-xl p-4 mb-4 space-y-1">
          <p className="font-sans text-sm font-semibold text-dark mb-2">Odzyskane łącznie: {breakdown.total} XP</p>
          <p className="font-sans text-xs text-muted">Dzienne wpisy (rutyna, questy, zasady, check-iny): {breakdown.fromLogs}</p>
          <p className="font-sans text-xs text-muted">Przeglądy tygodniowe ({breakdown.weeklyCount} × 150): {breakdown.fromWeeklyReviews}</p>
          <p className="font-sans text-xs text-muted">Przeglądy miesięczne ({breakdown.monthlyCount} × 300): {breakdown.fromMonthlyReviews}</p>
          <p className="font-sans text-xs text-muted">Osiągnięcia ({breakdown.achievementsCount} odblokowanych): {breakdown.fromAchievements}</p>
          {recoveredStats && (
            <div className="mt-3 pt-3 border-t border-muted/10">
              <p className="font-sans text-xs text-muted font-semibold mb-1">Rekonstrukcja pillarXP:</p>
              {Object.entries(recoveredStats.pillarXP).map(([p, xp]) => (
                <p key={p} className="font-sans text-xs text-muted">
                  {PILLAR_NAMES[p] ?? p}: <span className="text-dark font-medium">{xp} XP</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {done && (
        <p className="font-sans text-sm text-forest mb-4">Dane zostały przywrócone ✓</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="font-sans text-sm px-4 py-2 rounded-xl border border-muted/30 text-dark hover:bg-cream/60 transition-colors disabled:opacity-50"
        >
          {scanning ? 'Skanowanie…' : 'Skanuj dane'}
        </button>

        {breakdown !== null && !done && (
          <button
            onClick={handleApply}
            disabled={applying}
            className="font-sans text-sm px-4 py-2 rounded-xl bg-forest text-ivory hover:bg-forest/90 transition-colors disabled:opacity-50"
          >
            {applying ? 'Przywracam…' : `Przywróć ${breakdown.total} XP + ${breakdown.achievementsCount} osiągnięć`}
          </button>
        )}
      </div>
    </div>
  )
}
