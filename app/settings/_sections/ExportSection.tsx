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

/* ─── Eksport danych ─── */

type Preset = 'all' | 'year' | 'month' | 'week' | 'custom'

function getPresetRange(preset: Preset): DateRange {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (preset === 'all') return { from: null, to: null }

  if (preset === 'year') {
    return { from: `${today.getFullYear()}-01-01`, to: fmt(today) }
  }

  if (preset === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: fmt(from), to: fmt(today) }
  }

  if (preset === 'week') {
    const dow = (today.getDay() + 6) % 7 // Mon=0
    const from = new Date(today)
    from.setDate(today.getDate() - dow)
    return { from: fmt(from), to: fmt(today) }
  }

  return { from: null, to: null }
}

export default function ExportSection({ uid }: { uid: string }) {
  const router = useRouter()
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [exportingLogs, setExportingLogs] = useState(false)
  const [exportingQuests, setExportingQuests] = useState(false)
  const [exportingReviews, setExportingReviews] = useState(false)
  const [exportingStats, setExportingStats] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportingMd, setExportingMd] = useState(false)
  const [error, setError] = useState('')

  const range = useMemo<DateRange>(() => {
    if (preset === 'custom') return { from: customFrom || null, to: customTo || null }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  const handleCSV = async () => {
    setError('')
    setExportingLogs(true)
    try { await exportLogsAsCSV(uid, range) }
    catch { setError('Nie udało się wyeksportować danych.') }
    finally { setExportingLogs(false) }
  }

  const handleQuestsCSV = async () => {
    setError('')
    setExportingQuests(true)
    try { await exportQuestsAsCSV(uid, range) }
    catch { setError('Nie udało się wyeksportować questów.') }
    finally { setExportingQuests(false) }
  }

  const handleReviewsCSV = async () => {
    setError('')
    setExportingReviews(true)
    try { await exportReviewsAsCSV(uid, range) }
    catch { setError('Nie udało się wyeksportować przeglądów.') }
    finally { setExportingReviews(false) }
  }

  const handleStatsCSV = async () => {
    setError('')
    setExportingStats(true)
    try { await exportStatsAsCSV(uid) }
    catch { setError('Nie udało się wyeksportować statystyk.') }
    finally { setExportingStats(false) }
  }

  const handleExportAll = async () => {
    setError('')
    setExportingAll(true)
    try { await exportAllAsCSV(uid, range) }
    catch { setError('Nie udało się wyeksportować wszystkich danych.') }
    finally { setExportingAll(false) }
  }

  const handleExportMd = async () => {
    setError('')
    setExportingMd(true)
    try { await exportAsMarkdown(uid, range) }
    catch { setError('Nie udało się wyeksportować dziennika.') }
    finally { setExportingMd(false) }
  }

  const PRESETS: { value: Preset; label: string }[] = [
    { value: 'all',    label: 'Cały projekt' },
    { value: 'year',   label: 'Ten rok' },
    { value: 'month',  label: 'Ten miesiąc' },
    { value: 'week',   label: 'Ten tydzień' },
    { value: 'custom', label: 'Własny zakres' },
  ]

  const btnBase = 'flex items-center gap-2 font-sans text-sm py-3 px-5 rounded-xl transition-colors disabled:opacity-60 font-medium'

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-3 flex items-center gap-2">
        <Download size={18} strokeWidth={1.5} className="text-gold" />
        Eksport danych
      </h2>
      <p className="text-muted font-sans text-xs mb-4">
        Pobierz dane do analizy w Google Sheets / Excel.
      </p>

      {/* Preset selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
              preset === p.value
                ? 'bg-dark text-ivory border-dark'
                : 'border-border text-muted hover:border-dark hover:text-dark'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {preset === 'custom' && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="font-sans text-[10px] text-muted uppercase tracking-widest block mb-1">Od</label>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="w-full font-sans text-sm text-dark bg-cream/50 border border-cream rounded-xl px-3 py-2 outline-none focus:border-gold/40 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="font-sans text-[10px] text-muted uppercase tracking-widest block mb-1">Do</label>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="w-full font-sans text-sm text-dark bg-cream/50 border border-cream rounded-xl px-3 py-2 outline-none focus:border-gold/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-1 mb-5">
        <p className="font-sans text-xs text-muted-light">• <strong>Logi</strong> — każdy dzień: XP, rutyna, zasady, nastrój (stany + średnie), notatki, kluczowy moment, XP per filar</p>
        <p className="font-sans text-xs text-muted-light">• <strong>Questy</strong> — historia side questów, własnych side questów i questów dziennych z tytułem, filarem i XP</p>
        <p className="font-sans text-xs text-muted-light">• <strong>Przeglądy</strong> — tygodniowe i miesięczne: oceny filarów, refleksje, intencje</p>
        <p className="font-sans text-xs text-muted-light">• <strong>Statystyki</strong> — globalne podsumowanie: streaki, rekordy, osiągnięcia, XP per filar (nie filtruje zakresu dat)</p>
      </div>

      {/* Eksport dla AI */}
      <button
        onClick={handleExportMd}
        disabled={exportingMd}
        className={`${btnBase} w-full justify-center bg-forest text-ivory hover:bg-forest/90 mb-3`}
      >
        {exportingMd
          ? <><div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />Generuję dziennik...</>
          : <><BrainCircuit size={14} strokeWidth={1.5} />Eksport dla AI — jeden plik Markdown</>}
      </button>
      <p className="font-sans text-[11px] text-muted-light mb-4 -mt-1 px-1">
        Jeden plik .md z całą historią, notatkami i refleksjami — gotowy do wklejenia w Claude lub ChatGPT.
      </p>

      {/* Pobierz wszystko */}
      <button
        onClick={handleExportAll}
        disabled={exportingAll}
        className={`${btnBase} w-full justify-center bg-gold text-ivory hover:bg-gold/90 mb-3`}
      >
        {exportingAll
          ? <><div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />Eksportuję wszystko...</>
          : <><Download size={14} strokeWidth={1.5} />Pobierz wszystko (4 pliki CSV)</>}
      </button>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleCSV} disabled={exportingLogs}
          className={`${btnBase} border border-border text-dark hover:border-dark`}>
          {exportingLogs
            ? <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Logi</>}
        </button>

        <button onClick={handleQuestsCSV} disabled={exportingQuests}
          className={`${btnBase} border border-border text-dark hover:border-dark`}>
          {exportingQuests
            ? <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Questy</>}
        </button>

        <button onClick={handleReviewsCSV} disabled={exportingReviews}
          className={`${btnBase} border border-border text-dark hover:border-dark`}>
          {exportingReviews
            ? <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Przeglądy</>}
        </button>

        <button onClick={handleStatsCSV} disabled={exportingStats}
          className={`${btnBase} border border-border text-dark hover:border-dark`}>
          {exportingStats
            ? <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Statystyki</>}
        </button>

        <button
          onClick={() => router.push('/report')}
          className={`${btnBase} border border-border text-dark hover:border-dark`}
        >
          <Printer size={14} strokeWidth={1.5} />
          Podsumowanie roczne
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-xs font-sans bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>
      )}
    </div>
  )
}

/* ─── Przypomnienia ─── */

const REMINDER_DEFS: { type: ReminderType; label: string; desc: string; icon: typeof Sun }[] = [
  { type: 'morning', label: 'Rutyna poranna', desc: 'Przypomnienie o porannym rytuale', icon: Sun },
  { type: 'evening', label: 'Rutyna wieczorna', desc: 'Przypomnienie o wieczornym rytuale', icon: Moon },
  { type: 'quest',   label: 'Quest dnia', desc: 'Przypomnienie o dzisiejszym queście', icon: Sparkles },
]
