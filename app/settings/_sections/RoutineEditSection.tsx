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

type RoutineTab = 'morning' | 'daily' | 'evening'

const ROUTINE_TABS: { id: RoutineTab; label: string; icon: typeof Sun }[] = [
  { id: 'morning', label: 'Ranek',   icon: Sun },
  { id: 'daily',   label: 'Dzień',   icon: Sparkles },
  { id: 'evening', label: 'Wieczór', icon: Moon },
]

export default function RoutineEditSection() {
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
