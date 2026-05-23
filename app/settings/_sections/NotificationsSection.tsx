'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Sun, Moon, Sparkles, Bell } from 'lucide-react'
import {
  loadPreferences, savePreferences, requestPermission, getPermissionStatus,
  scheduleRemindersViaSW, DEFAULT_PREFERENCES,
  type NotificationPreferences, type ReminderType,
} from '@/lib/notifications'
import { SmallCaps, Diamond } from '@/components/ui'

const REMINDER_DEFS: { type: ReminderType; label: string; desc: string; icon: typeof Sun }[] = [
  { type: 'morning', label: 'Rutyna poranna', desc: 'przypomnienie o porannym rytuale', icon: Sun },
  { type: 'evening', label: 'Rutyna wieczorna', desc: 'przypomnienie o wieczornym rytuale', icon: Moon },
  { type: 'quest',   label: 'Quest dnia', desc: 'przypomnienie o dzisiejszym queście', icon: Sparkles },
]

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={clsx(
        'flex-shrink-0 w-9 h-5 transition-colors relative border',
        on ? 'bg-gold border-gold' : 'bg-cream/50 border-hairline'
      )}
    >
      <div
        className={clsx(
          'absolute top-0.5 w-3.5 h-3.5 transition-transform',
          on ? 'bg-ivory left-[18px]' : 'bg-muted-light left-0.5'
        )}
      />
    </button>
  )
}

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
    <section className="bg-ivory border border-gold-light/40 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Bell size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Przypomnienia
        </SmallCaps>
      </div>
      <h2 className="font-heading text-dark text-xl mb-4">Powiadomienia</h2>

      {isUnsupported && (
        <div className="flex items-start gap-2 border border-amber-300 bg-amber-50/40 px-4 py-3 mb-4">
          <Diamond size={5} className="text-amber-700 mt-1.5 shrink-0" />
          <p className="font-serif-body italic text-amber-900 text-[13px] leading-snug">
            twoja przeglądarka nie obsługuje powiadomień. spróbuj w chrome lub edge.
          </p>
        </div>
      )}

      {isDenied && (
        <div className="flex items-start gap-2 border border-amber-300 bg-amber-50/40 px-4 py-3 mb-4">
          <Diamond size={5} className="text-amber-700 mt-1.5 shrink-0" />
          <p className="font-serif-body italic text-amber-900 text-[13px] leading-snug">
            powiadomienia są zablokowane. zmień ustawienia w przeglądarce (ikona kłódki przy adresie).
          </p>
        </div>
      )}

      {!isGranted && !isDenied && !isUnsupported && (
        <div className="mb-5">
          <p className="font-serif-body italic text-muted text-[13px] mb-4 leading-relaxed">
            włącz powiadomienia, żeby otrzymywać przypomnienia o rutynie i questach.
            działają gdy karta przeglądarki jest otwarta lub aplikacja jest zainstalowana jako pwa.
          </p>
          <button
            onClick={handleEnable}
            className="flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-5 hover:bg-forest transition-colors"
          >
            <Bell size={12} strokeWidth={1.5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              włącz powiadomienia
            </SmallCaps>
          </button>
        </div>
      )}

      {isGranted && (
        <>
          <p className="font-serif-body italic text-muted text-[13px] mb-5 leading-relaxed">
            ustaw godziny przypomnień. powiadomienia działają gdy karta jest otwarta lub apka jest zainstalowana jako pwa.
          </p>

          <div className="space-y-4 mb-5">
            {REMINDER_DEFS.map(({ type, label, desc, icon: Icon }) => {
              const cfg = prefs[type]
              const timeStr = `${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')}`
              return (
                <div key={type} className="flex items-center gap-4">
                  <Toggle on={cfg.enabled} onClick={() => handleToggle(type, !cfg.enabled)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={12} strokeWidth={1.5} className="text-gold-deep" />
                      <span className={clsx(
                        'font-heading text-[14px]',
                        cfg.enabled ? 'text-dark' : 'text-muted'
                      )}>
                        {label}
                      </span>
                    </div>
                    <p className="font-serif-body italic text-muted-light text-[12px] mt-0.5">{desc}</p>
                  </div>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={e => handleTime(type, e.target.value)}
                    disabled={!cfg.enabled}
                    className="border border-hairline bg-cream/40 px-2 py-1.5 font-serif-body text-[13px] text-dark focus:outline-none focus:border-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-5 hover:bg-forest transition-colors"
            >
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="ivory" tracking="luxury" size="xs">
                zapisz i zaplanuj
              </SmallCaps>
            </button>
            {saved && (
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="animate-fade-in">
                zapisano ◆
              </SmallCaps>
            )}
          </div>
        </>
      )}
    </section>
  )
}
