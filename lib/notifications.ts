// Zarządzanie przypomnieniami przez Web Notifications API + Service Worker.
// Preferencje są zapisywane w localStorage (dane urządzenia, nie Firestore).

export type ReminderType = 'morning' | 'evening' | 'quest'

export interface ReminderConfig {
  enabled: boolean
  hour: number
  minute: number
}

export interface NotificationPreferences {
  morning: ReminderConfig
  evening: ReminderConfig
  quest: ReminderConfig
}

const STORAGE_KEY = 'projekt30_notifications'

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  morning: { enabled: false, hour: 7, minute: 0 },
  evening: { enabled: false, hour: 21, minute: 0 },
  quest:   { enabled: false, hour: 12, minute: 0 },
}

export const REMINDER_LABELS: Record<ReminderType, { title: string; body: string }> = {
  morning: {
    title: '🌅 Rutyna poranna',
    body: 'Czas na poranny rytuał. Każdy dzień zaczyna się od ciebie.',
  },
  evening: {
    title: '🌙 Rutyna wieczorna',
    body: 'Wieczorny rytuał czeka. Zakończ dzień z intencją.',
  },
  quest: {
    title: '✨ Quest dnia',
    body: 'Nie zapomnij o dzisiejszym queście. Transformacja nie ma dnia wolnego.',
  },
}

// ── Odczyt / zapis preferencji ───────────────────────────────────

export function loadPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

// ── Uprawnienia ──────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// ── Harmonogram przypomnień ──────────────────────────────────────
// Używa postMessage do SW aby zaplanować powiadomienia na dziś.
// Jeśli SW nie jest aktywny, fallback do setTimeout w oknie (działa gdy karta jest otwarta).

export async function scheduleRemindersViaSW(prefs: NotificationPreferences): Promise<void> {
  if (typeof window === 'undefined') return

  const sw = await getActiveSW()
  if (sw) {
    sw.postMessage({
      type: 'SCHEDULE_REMINDERS',
      prefs,
      labels: REMINDER_LABELS,
    })
  } else {
    // Fallback: setTimeout w kontekście okna (działa tylko gdy tab otwarty)
    scheduleWithTimeout(prefs)
  }
}

export function scheduleWithTimeout(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return

  const now = new Date()
  const types: ReminderType[] = ['morning', 'evening', 'quest']

  for (const type of types) {
    const cfg = prefs[type]
    if (!cfg.enabled) continue

    const target = new Date()
    target.setHours(cfg.hour, cfg.minute, 0, 0)
    const msUntil = target.getTime() - now.getTime()

    if (msUntil > 0) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          const { title, body } = REMINDER_LABELS[type]
          new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' })
        }
      }, msUntil)
    }
  }
}

async function getActiveSW(): Promise<ServiceWorker | null> {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return reg?.active ?? null
}
