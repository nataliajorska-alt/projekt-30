'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { LogOut, Lock, Mail, Download, Printer, Sun, Moon, Sparkles, Plus, X, RotateCcw, Bell, Phone, ShieldAlert } from 'lucide-react'
import { useNominatedContacts } from '@/hooks/useNominatedContacts'
import type { NominatedContact } from '@/types'
import { exportLogsAsCSV, exportQuestsAsCSV, exportReviewsAsCSV } from '@/lib/exportData'
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

export default function SettingsPage() {
  const { user, logOut } = useAuth()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <h1 className="font-serif text-2xl text-dark mb-6">Ustawienia</h1>

      <div className="space-y-6">
        <AccountSection email={user?.email ?? ''} user={user} logOut={logOut} />
        <SparkScheduleSection />
        <ExportSection uid={user?.uid ?? ''} />
        <NotificationsSection />
        <NominatedContactsSection />
        <RoutineEditSection />
        <XPRecoverySection />
      </div>
    </div>
  )
}

/* ─── Iskry tygodnia ─── */

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

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

function SparkScheduleSection() {
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

function AccountSection({
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

function ExportSection({ uid }: { uid: string }) {
  const router = useRouter()
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [exportingLogs, setExportingLogs] = useState(false)
  const [exportingQuests, setExportingQuests] = useState(false)
  const [exportingReviews, setExportingReviews] = useState(false)
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
        <p className="font-sans text-xs text-muted-light">• <strong>Logi</strong> — każdy dzień: XP, rutyna, zasady, nastrój, notatki, XP per filar</p>
        <p className="font-sans text-xs text-muted-light">• <strong>Questy</strong> — historia side questów i questów dziennych z tytułem, filarem i XP</p>
        <p className="font-sans text-xs text-muted-light">• <strong>Przeglądy</strong> — tygodniowe i miesięczne: oceny filarów, refleksje, intencje</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleCSV} disabled={exportingLogs}
          className={`${btnBase} bg-dark text-ivory hover:bg-forest`}>
          {exportingLogs
            ? <><div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Pobierz logi CSV</>}
        </button>

        <button onClick={handleQuestsCSV} disabled={exportingQuests}
          className={`${btnBase} border border-border text-dark hover:border-dark`}>
          {exportingQuests
            ? <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Pobierz questy CSV</>}
        </button>

        <button onClick={handleReviewsCSV} disabled={exportingReviews}
          className={`${btnBase} border border-border text-dark hover:border-dark`}>
          {exportingReviews
            ? <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />Eksportuję...</>
            : <><Download size={14} strokeWidth={1.5} />Pobierz przeglądy CSV</>}
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

function NotificationsSection() {
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

function RoutineEditSection() {
  const {
    getDefaultItems, getCustomItems, isItemDisabled,
    toggleItemEnabled, addCustomItem, removeCustomItem, resetToDefaults,
  } = useRoutineConfig()

  const [tab, setTab] = useState<RoutineTab>('morning')
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newXP, setNewXP] = useState(10)

  const defaults = getDefaultItems(tab)
  const customs = getCustomItems(tab)

  const handleAdd = () => {
    if (!newText.trim()) return
    addCustomItem(newText.trim(), tab, newXP)
    setNewText('')
    setNewXP(10)
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-lg text-dark flex items-center gap-2">
            <Sparkles size={18} strokeWidth={1.5} className="text-gold" />
            Rutyna
          </h2>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-[11px] font-sans text-muted-light hover:text-muted transition-colors"
          >
            <RotateCcw size={11} strokeWidth={1.5} />
            Przywróć domyślne
          </button>
        </div>
        <p className="text-muted font-sans text-xs">
          Wyłącz elementy, których nie potrzebujesz, lub dodaj własne.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mx-6">
        {ROUTINE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setAdding(false) }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-sans transition-all border-b-2 -mb-px',
              tab === id
                ? 'border-gold text-gold font-medium'
                : 'border-transparent text-muted hover:text-dark'
            )}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="px-6 py-3 space-y-1">
        {defaults.length === 0 && customs.length === 0 && (
          <p className="text-muted font-sans text-xs py-4 text-center">Brak elementów w tej kategorii.</p>
        )}

        {/* Default items with toggle */}
        {defaults.map((item) => {
          const disabled = isItemDisabled(item.id)
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            >
              <button
                onClick={() => toggleItemEnabled(item.id)}
                role="switch"
                aria-checked={!disabled}
                className={clsx(
                  'flex-shrink-0 w-9 h-5 rounded-full transition-colors relative',
                  disabled ? 'bg-border' : 'bg-gold'
                )}
              >
                <div
                  className={clsx(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    disabled ? 'left-0.5' : 'left-[18px]'
                  )}
                />
              </button>
              <span className={clsx(
                'font-sans text-sm flex-1',
                disabled ? 'text-muted line-through' : 'text-dark'
              )}>
                {item.text}
              </span>
              <span className="text-[11px] font-sans text-muted-light">+{item.xp}</span>
            </div>
          )
        })}

        {/* Custom items with delete */}
        {customs.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gold-pale"
          >
            <span className="font-sans text-sm text-dark flex-1">{item.text}</span>
            <span className="text-[11px] font-sans text-muted-light">+{item.xp}</span>
            <button
              onClick={() => removeCustomItem(item.id)}
              className="text-muted hover:text-red-500 transition-colors"
              aria-label="Usuń element"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* Add custom item */}
      <div className="px-6 pb-5">
        {adding ? (
          <div className="border border-border rounded-xl p-3 space-y-3">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
              placeholder="Nazwa elementu..."
              autoFocus
            />
            <div className="flex items-center gap-3">
              <label className="font-sans text-xs text-muted">XP:</label>
              <select
                value={newXP}
                onChange={(e) => setNewXP(Number(e.target.value))}
                className="border border-border rounded-lg px-2 py-1.5 font-sans text-xs text-dark bg-ivory focus:outline-none focus:border-gold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={() => setAdding(false)}
                className="font-sans text-xs text-muted hover:text-dark transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleAdd}
                disabled={!newText.trim()}
                className="bg-dark text-ivory font-sans text-xs py-2 px-4 rounded-lg hover:bg-forest transition-colors disabled:opacity-60 font-medium"
              >
                Dodaj
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-xs font-sans text-muted hover:text-gold transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
            Dodaj własny element
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Nominated Contacts ─── */

function NominatedContactsSection() {
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
  unknownSideQuestCount: number; unknownSideQuestXP: number
}

const PILLAR_NAMES: Record<string, string> = {
  pozycja: 'Pozycja', cialo: 'Ciało', styl: 'Styl',
  kapital: 'Kapitał', kariera: 'Kariera', tozsamosc: 'Tożsamość', milosc: 'Miłość',
}

function XPRecoverySection() {
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
          {breakdown.unknownSideQuestCount > 0 && (
            <p className="font-sans text-xs text-amber-600 mt-1">
              ⚠ {breakdown.unknownSideQuestCount} side questów z nierozpoznanym ID (~{breakdown.unknownSideQuestXP} XP) — XP rozdzielone po równo między filary
            </p>
          )}
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
