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

export default function NominatedContactsSection() {
  const { contacts, loading, saveContacts } = useNominatedContacts()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [saved, setSaved] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim() || !newPhone.trim()) return
    const updated: NominatedContact[] = [...contacts, { name: newName.trim(), phone: newPhone.trim() }]
    await saveContacts(updated)
    setNewName('')
    setNewPhone('')
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRemove = async (phone: string) => {
    await saveContacts(contacts.filter(c => c.phone !== phone))
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-1 flex items-center gap-2">
        <Phone size={18} strokeWidth={1.5} className="text-gold" />
        Nominated Contacts
      </h2>
      <p className="font-sans text-xs text-muted mb-5">
        Osoby, do których dzwonisz zamiast pisać do niego. Widoczne w Emergency Lock.
      </p>

      {contacts.length > 0 && (
        <div className="space-y-2 mb-4">
          {contacts.map(c => (
            <div key={c.phone} className="flex items-center gap-3 bg-cream/50 rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="font-sans text-sm text-dark font-medium">{c.name}</p>
                <p className="font-sans text-xs text-muted">{c.phone}</p>
              </div>
              <button
                onClick={() => handleRemove(c.phone)}
                className="text-muted hover:text-red-500 transition-colors"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {contacts.length < 3 && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 text-xs font-sans text-muted hover:text-gold transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
          Dodaj kontakt (max 3)
        </button>
      )}

      {editing && (
        <div className="border border-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Imię"
            className="w-full border border-border rounded-lg px-3 py-2 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold"
          />
          <input
            type="tel"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            placeholder="+48 123 456 789"
            className="w-full border border-border rounded-lg px-3 py-2 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="font-sans text-xs text-muted hover:text-dark transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newPhone.trim()}
              className="bg-dark text-ivory font-sans text-xs py-2 px-4 rounded-lg hover:bg-forest transition-colors disabled:opacity-60 font-medium"
            >
              Dodaj
            </button>
          </div>
        </div>
      )}

      {saved && (
        <p className="font-sans text-xs text-forest mt-2 animate-fade-in">Zapisano ✓</p>
      )}
    </div>
  )
}

/* ─── Odzyskiwanie XP ─── */

type RecoveryBreakdown = {
  fromLogs: number; fromWeeklyReviews: number; fromMonthlyReviews: number
  fromAchievements: number; total: number; weeklyCount: number; monthlyCount: number; achievementsCount: number
}

const PILLAR_NAMES: Record<string, string> = {
  pozycja: 'Pozycja', cialo: 'Ciało', styl: 'Styl',
  kapital: 'Kapitał', kariera: 'Kariera', tozsamosc: 'Tożsamość', milosc: 'Miłość',
}
