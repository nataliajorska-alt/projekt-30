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

export default function CustomQuestLibrarySection() {
  const { quests, loading, addQuest, removeQuest } = useCustomQuestLibrary()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    await addQuest(newTitle, newDesc)
    setNewTitle('')
    setNewDesc('')
    setAdding(false)
    setSaving(false)
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-1 flex items-center gap-2">
        <Swords size={18} strokeWidth={1.5} className="text-gold" />
        Moje side questy
      </h2>
      <p className="font-sans text-xs text-muted mb-5">
        Wpisuj pomysły na side questy gdy coś Ci przyjdzie do głowy. Trafią do losowania obok standardowej biblioteki.
      </p>

      {quests.length > 0 && (
        <div className="space-y-2 mb-4">
          {quests.map(q => (
            <div key={q.id} className="flex items-start gap-3 bg-cream/50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-dark font-medium">{q.title}</p>
                {q.description && (
                  <p className="font-sans text-xs text-muted mt-0.5 leading-relaxed">{q.description}</p>
                )}
              </div>
              <button
                onClick={() => removeQuest(q.id)}
                className="text-muted hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                aria-label="Usuń quest"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {quests.length === 0 && !adding && (
        <p className="font-sans text-xs text-muted-light italic mb-4">
          Brak własnych questów. Dodaj pierwszy pomysł poniżej.
        </p>
      )}

      {adding ? (
        <div className="border border-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nazwa questa..."
            maxLength={80}
            autoFocus
            className="w-full border border-border rounded-xl px-4 py-2.5 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
          />
          <textarea
            rows={2}
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Opis (opcjonalnie)..."
            maxLength={200}
            className="w-full border border-border rounded-xl px-4 py-2.5 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewDesc('') }}
              className="font-sans text-xs text-muted hover:text-dark transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim() || saving}
              className="bg-dark text-ivory font-sans text-xs py-2 px-4 rounded-lg hover:bg-forest transition-colors disabled:opacity-60 font-medium"
            >
              {saving ? '...' : 'Dodaj'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-xs font-sans text-muted hover:text-gold transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
          Dodaj pomysł na quest
        </button>
      )}
    </div>
  )
}

/* ─── Iskry tygodnia ─── */

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
