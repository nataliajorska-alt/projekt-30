'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { LogOut, Lock, Mail, Download, Printer, Sun, Moon, Sparkles, Plus, X, RotateCcw, Bell } from 'lucide-react'
import { exportLogsAsCSV, exportQuestsAsCSV, printYearSummary } from '@/lib/exportData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
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
        <ExportSection uid={user?.uid ?? ''} />
        <NotificationsSection />
        <RoutineEditSection />
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

function ExportSection({ uid }: { uid: string }) {
  const [exportingLogs, setExportingLogs] = useState(false)
  const [exportingQuests, setExportingQuests] = useState(false)
  const [error, setError] = useState('')

  const handleCSV = async () => {
    setError('')
    setExportingLogs(true)
    try {
      await exportLogsAsCSV(uid)
    } catch {
      setError('Nie udało się wyeksportować danych.')
    } finally {
      setExportingLogs(false)
    }
  }

  const handleQuestsCSV = async () => {
    setError('')
    setExportingQuests(true)
    try {
      await exportQuestsAsCSV(uid)
    } catch {
      setError('Nie udało się wyeksportować questów.')
    } finally {
      setExportingQuests(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6">
      <h2 className="font-serif text-lg text-dark mb-3 flex items-center gap-2">
        <Download size={18} strokeWidth={1.5} className="text-gold" />
        Eksport danych
      </h2>
      <p className="text-muted font-sans text-xs mb-1">
        Pobierz dane do analizy w Google Sheets / Excel lub wydrukuj podsumowanie roku.
      </p>
      <div className="space-y-1 mb-5">
        <p className="font-sans text-xs text-muted-light">
          • <strong>Logi</strong> — każdy dzień: XP, % rutyny, zasady (0/1), XP per filar
        </p>
        <p className="font-sans text-xs text-muted-light">
          • <strong>Questy</strong> — historia ukończonych side questów z datą, filarem i XP
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCSV}
          disabled={exportingLogs}
          className="flex items-center gap-2 bg-dark text-ivory font-sans text-sm py-3 px-5 rounded-xl hover:bg-forest transition-colors disabled:opacity-60 font-medium"
        >
          {exportingLogs ? (
            <div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={14} strokeWidth={1.5} />
          )}
          {exportingLogs ? 'Eksportuję...' : 'Pobierz logi CSV'}
        </button>

        <button
          onClick={handleQuestsCSV}
          disabled={exportingQuests}
          className="flex items-center gap-2 border border-border text-dark hover:border-dark rounded-xl px-5 py-3 font-sans text-sm transition-colors disabled:opacity-60 font-medium"
        >
          {exportingQuests ? (
            <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={14} strokeWidth={1.5} />
          )}
          {exportingQuests ? 'Eksportuję...' : 'Pobierz questy CSV'}
        </button>

        <button
          onClick={printYearSummary}
          className="flex items-center gap-2 border border-border text-dark hover:border-dark rounded-xl px-5 py-3 font-sans text-sm transition-colors font-medium"
        >
          <Printer size={14} strokeWidth={1.5} />
          Drukuj podsumowanie
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-xs font-sans bg-red-50 px-3 py-2 rounded-lg mt-3">
          {error}
        </p>
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
