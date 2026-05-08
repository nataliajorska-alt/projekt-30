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

const REMINDER_DEFS: { type: ReminderType; label: string; desc: string; icon: typeof Sun }[] = [
  { type: 'morning', label: 'Rutyna poranna', desc: 'Przypomnienie o porannym rytuale', icon: Sun },
  { type: 'evening', label: 'Rutyna wieczorna', desc: 'Przypomnienie o wieczornym rytuale', icon: Moon },
  { type: 'quest',   label: 'Quest dnia', desc: 'Przypomnienie o dzisiejszym queście', icon: Sparkles },
]

export default function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [permission, setPermission] = useState<string>('default')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPrefs(loadPreferences())
    setPermission(getPermissionStatus())
  }, [])

  const handleToggle = (type: ReminderType, enabled: boolean) => {
    setPrefs(p => ({ ...p, [type]: { ...p[type], enabled } }))
    setSaved(false)
  }

  const handleTime = (type: ReminderType, value: string) => {
    const [h, m] = value.split(':').map(Number)
    setPrefs(p => ({ ...p, [type]: { ...p[type], hour: h, minute: m } }))
    setSaved(false)
  }

  const handleEnable = async () => {
    const perm = await requestPermission()
    setPermission(perm)
  }

  const handleSave = async () => {
    savePreferences(prefs)
    await scheduleRemindersViaSW(prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isUnsupported = permission === 'unsupported'
  const isDenied = permission === 'denied'
  const isGranted = permission === 'granted'

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-2 flex items-center gap-2">
        <Bell size={18} strokeWidth={1.5} className="text-gold" />
        Przypomnienia
      </h2>

      {isUnsupported && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <p className="font-sans text-xs text-amber-700">
            Twoja przeglądarka nie obsługuje powiadomień. Spróbuj w Chrome lub Edge.
          </p>
        </div>
      )}

      {isDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <p className="font-sans text-xs text-amber-700">
            Powiadomienia są zablokowane. Zmień ustawienia w przeglądarce (ikona kłódki przy adresie strony).
          </p>
        </div>
      )}

      {!isGranted && !isDenied && !isUnsupported && (
        <div className="mb-5">
          <p className="font-sans text-xs text-muted mb-3">
            Włącz powiadomienia, żeby otrzymywać przypomnienia o rutynie i questach.
            Działają gdy karta przeglądarki jest otwarta lub aplikacja jest zainstalowana jako PWA.
          </p>
          <button
            onClick={handleEnable}
            className="flex items-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 px-5 rounded-xl hover:bg-forest transition-colors font-medium"
          >
            <Bell size={14} strokeWidth={1.5} />
            Włącz powiadomienia
          </button>
        </div>
      )}

      {isGranted && (
        <>
          <p className="font-sans text-xs text-muted mb-5">
            Ustaw godziny przypomnień. Powiadomienia działają gdy karta jest otwarta lub aplikacja jest zainstalowana jako PWA na ekranie.
          </p>

          <div className="space-y-4 mb-5">
            {REMINDER_DEFS.map(({ type, label, desc, icon: Icon }) => {
              const cfg = prefs[type]
              const timeStr = `${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')}`
              return (
                <div key={type} className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggle(type, !cfg.enabled)}
                    role="switch"
                    aria-checked={cfg.enabled}
                    className={clsx(
                      'flex-shrink-0 w-9 h-5 rounded-full transition-colors relative',
                      cfg.enabled ? 'bg-gold' : 'bg-border'
                    )}
                  >
                    <div
                      className={clsx(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        cfg.enabled ? 'left-[18px]' : 'left-0.5'
                      )}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon size={13} strokeWidth={1.5} className="text-muted" />
                      <span className={clsx('font-sans text-sm', cfg.enabled ? 'text-dark' : 'text-muted')}>
                        {label}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-muted-light">{desc}</p>
                  </div>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={e => handleTime(type, e.target.value)}
                    disabled={!cfg.enabled}
                    className="border border-border rounded-lg px-2 py-1.5 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 px-5 rounded-xl hover:bg-forest transition-colors font-medium"
            >
              <Bell size={13} strokeWidth={1.5} />
              Zapisz i zaplanuj
            </button>
            {saved && (
              <p className="font-sans text-xs text-forest animate-fade-in">
                Zapisano ✓
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Edycja rutyny ─── */

type RoutineTab = 'morning' | 'daily' | 'evening'

const ROUTINE_TABS: { id: RoutineTab; label: string; icon: typeof Sun }[] = [
  { id: 'morning', label: 'Ranek',   icon: Sun },
  { id: 'daily',   label: 'Dzień',   icon: Sparkles },
  { id: 'evening', label: 'Wieczór', icon: Moon },
]
