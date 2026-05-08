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

export default function AccountSection({
  email,
  user,
  logOut,
}: {
  email: string
  user: any
  logOut: () => Promise<void>
}) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPw.length < 6) {
      setError('Nowe hasło musi mieć co najmniej 6 znaków.')
      return
    }
    if (newPw !== confirmPw) {
      setError('Hasła nie są identyczne.')
      return
    }

    setBusy(true)
    try {
      const credential = EmailAuthProvider.credential(email, currentPw)
      await reauthenticateWithCredential(user!, credential)
      await updatePassword(user!, newPw)
      setSuccess('Hasło zostało zmienione.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err: any) {
      const msg = err?.message ?? ''
      setError(
        msg.includes('wrong-password') || msg.includes('invalid-credential')
          ? 'Obecne hasło jest nieprawidłowe.'
          : msg.includes('requires-recent-login')
            ? 'Sesja wygasła. Wyloguj się i zaloguj ponownie.'
            : `Nie udało się zmienić hasła. (${msg.slice(0, 80)})`
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-5 flex items-center gap-2">
        <Mail size={18} strokeWidth={1.5} className="text-gold" />
        Konto
      </h2>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-xs font-sans text-muted mb-1.5 uppercase tracking-wider">
          E-mail
        </label>
        <p className="font-sans text-sm text-dark bg-ivory border border-border rounded-xl px-4 py-3">
          {email}
        </p>
      </div>

      {/* Zmiana hasła */}
      <div className="border-t border-border pt-5">
        <h3 className="font-sans text-sm font-medium text-dark mb-4 flex items-center gap-2">
          <Lock size={14} strokeWidth={1.5} />
          Zmień hasło
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5 uppercase tracking-wider">
              Obecne hasło
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5 uppercase tracking-wider">
              Nowe hasło
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={6}
              className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
              placeholder="Min. 6 znaków"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5 uppercase tracking-wider">
              Potwierdź nowe hasło
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={6}
              className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs font-sans bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {success && (
            <p className="text-forest text-xs font-sans bg-green-50 px-3 py-2 rounded-lg">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-dark text-ivory font-sans text-sm py-3 px-6 rounded-xl hover:bg-forest transition-colors disabled:opacity-60 font-medium"
          >
            {busy ? '...' : 'Zmień hasło'}
          </button>
        </form>
      </div>

      {/* Wyloguj */}
      <div className="border-t border-border pt-5 mt-6">
        <button
          onClick={logOut}
          className="flex items-center gap-2 border border-border text-muted hover:text-dark hover:border-dark rounded-xl px-4 py-3 font-sans text-sm transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Wyloguj się
        </button>
      </div>
    </div>
  )
}
