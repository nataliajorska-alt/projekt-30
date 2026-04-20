import type { GhostLogEntryV2, SafeHoursWindow } from '@/types'

const MIN_ENTRIES = 15

const DAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const DAY_FULL_ACCUSATIVE = [
  'poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę', 'niedzielę',
]

function hourBucket(h: number): number {
  return Math.floor(h / 2) * 2
}

export function analyzeSafeHours(entries: GhostLogEntryV2[]): SafeHoursWindow[] {
  if (entries.length < MIN_ENTRIES) return []

  const counts: Record<string, { count: number; totalIntensity: number }> = {}
  for (const e of entries) {
    const key = `${e.weekday}_${hourBucket(e.hour)}`
    if (!counts[key]) counts[key] = { count: 0, totalIntensity: 0 }
    counts[key].count++
    counts[key].totalIntensity += e.intensity
  }

  const windows: SafeHoursWindow[] = Object.entries(counts).map(([key, val]) => {
    const [day, hour] = key.split('_').map(Number)
    const avgIntensity = val.totalIntensity / val.count
    const score = val.count * avgIntensity
    const hourStr = `${String(hour).padStart(2, '0')}:00`
    return { dayOfWeek: day, hourStart: hour, score, label: `${DAY_SHORT[day]} ${hourStr}` }
  })

  return windows.sort((a, b) => b.score - a.score).slice(0, 3)
}

// Zwraca okno ryzyka pasujące do bieżącej godziny (lub null)
export function getCurrentRiskWindow(windows: SafeHoursWindow[]): SafeHoursWindow | null {
  if (!windows.length) return null
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7
  const currentBucket = hourBucket(now.getHours())
  return windows.find(w => w.dayOfWeek === currentDay && w.hourStart === currentBucket) ?? null
}

// Zwraca true jeśli za < 30 minut zaczyna się okno ryzyka (dla powiadomień Safe Hours)
export function isApproachingRiskWindow(windows: SafeHoursWindow[]): SafeHoursWindow | null {
  if (!windows.length) return null
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7
  const minutesNow = now.getHours() * 60 + now.getMinutes()

  for (const w of windows) {
    if (w.dayOfWeek !== currentDay) continue
    const windowStart = w.hourStart * 60
    const minutesUntil = windowStart - minutesNow
    if (minutesUntil > 0 && minutesUntil <= 30) return w
  }
  return null
}

// Formatuje prognozę tygodniową jako czytelny tekst
export function formatWeeklyForecast(windows: SafeHoursWindow[]): string {
  if (!windows.length) return ''
  return windows
    .map(w => `${DAY_FULL_ACCUSATIVE[w.dayOfWeek]} ${String(w.hourStart).padStart(2, '0')}:00`)
    .join(', ')
}

// Zwraca okna ryzyka dla danego dnia tygodnia (do planowania powiadomień)
export function getWindowsForToday(windows: SafeHoursWindow[]): SafeHoursWindow[] {
  const today = (new Date().getDay() + 6) % 7
  return windows.filter(w => w.dayOfWeek === today)
}
