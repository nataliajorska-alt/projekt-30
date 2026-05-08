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

function fmtDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekDays(offset: number): Date[] {
  const today = new Date()
  const dow = (today.getDay() + 6) % 7 // Mon=0
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

export default function SparkScheduleSection() {
  const { sparks, loading, saving, saveSparks } = useSparkSchedule()
  const [weekOffset, setWeekOffset] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading) setDrafts(sparks)
  }, [loading, sparks])

  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  const weekLabel = () => {
    const s = days[0], e = days[6]
    const fmt = (d: Date) => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    return `${fmt(s)} – ${fmt(e)}.${e.getFullYear()}`
  }

  const todayStr = fmtDateKey(new Date())

  const handleChange = (key: string, value: string) => {
    setDrafts(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    const merged = { ...sparks }
    for (const [k, v] of Object.entries(drafts)) {
      if (v.trim()) merged[k] = v.trim()
      else delete merged[k]
    }
    await saveSparks(merged)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-1 flex items-center gap-2">
        <Sparkles size={18} strokeWidth={1.5} className="text-gold" />
        Iskry tygodnia
      </h2>
      <p className="font-sans text-xs text-muted mb-5">
        Wpisz iskry na kolejne dni — pojawią się jako iskra dnia w odpowiednim momencie.
        Puste dni wrócą do domyślnych afirmacji.
      </p>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-cream/60 transition-colors font-serif text-lg"
        >
          ‹
        </button>
        <span className="font-sans text-xs text-dark font-medium tracking-wide">{weekLabel()}</span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-cream/60 transition-colors font-serif text-lg"
        >
          ›
        </button>
      </div>

      {/* Days */}
      <div className="space-y-3 mb-5">
        {days.map((d, i) => {
          const key = fmtDateKey(d)
          const isToday = key === todayStr
          return (
            <div key={key} className={clsx('rounded-xl', isToday && 'ring-1 ring-gold/50 bg-gold/5 p-2 -mx-2')}>
              <label className="block font-sans text-[11px] text-muted mb-1.5 px-1 uppercase tracking-wider">
                {DAY_NAMES[i]} · {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}
                {isToday && <span className="ml-2 text-gold normal-case tracking-normal font-medium">dziś</span>}
              </label>
              <textarea
                rows={2}
                value={drafts[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                placeholder="Wpisz iskrę dnia..."
                className="w-full border border-border rounded-xl px-4 py-2.5 font-serif text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors resize-none placeholder:text-muted-light/50 placeholder:font-sans placeholder:not-italic italic leading-relaxed"
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-dark text-ivory font-sans text-sm py-2.5 px-5 rounded-xl hover:bg-forest transition-colors font-medium disabled:opacity-60"
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />Zapisuję...</>
            : <><Sparkles size={13} strokeWidth={1.5} />Zapisz iskry</>
          }
        </button>
        {saved && (
          <p className="font-sans text-xs text-forest animate-fade-in">Zapisano ✓</p>
        )}
      </div>
    </div>
  )
}

/* ─── Konto ─── */
