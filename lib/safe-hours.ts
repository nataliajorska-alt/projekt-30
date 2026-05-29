import type { GhostLogEntryV2, SafeHoursWindow } from '@/types'
import { getPhaseIdForDate, type CycleLog, type CycleSettings } from './cycle-data'

const MIN_ENTRIES_NO_CYCLE = 15
const MIN_ENTRIES_WITH_CYCLE = 8

const DAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const DAY_FULL_ACCUSATIVE = [
  'poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę', 'niedzielę',
]
const PHASE_SHORT: Record<string, string> = {
  menstruacja: 'okres',
  folikularna: 'folik.',
  owulacyjna: 'owul.',
  lutealna: 'lut.',
}

function hourBucket(h: number): number {
  return Math.floor(h / 2) * 2
}

// Wyciąga dateKey YYYY-MM-DD z wpisu GP.
// GhostLogEntryV2.timestamp to liczba (ms epoch) — tak jak w pozostałych miejscach
// (np. eksport) konwertujemy przez Date. Defensywnie obsługujemy też ewentualny
// stringowy timestamp / dateKey ze starszych kształtów danych.
function extractDateKey(e: GhostLogEntryV2): string | null {
  if (typeof e.timestamp === 'number' && Number.isFinite(e.timestamp)) {
    return new Date(e.timestamp).toISOString().slice(0, 10)
  }
  const anyE = e as unknown as { dateKey?: string; timestamp?: string; createdAt?: string }
  if (anyE.dateKey) return anyE.dateKey
  const ts = anyE.timestamp ?? anyE.createdAt
  if (typeof ts === 'string') return ts.slice(0, 10)
  return null
}

export function analyzeSafeHours(
  entries: GhostLogEntryV2[],
  cycleLogs?: CycleLog[],
  cycleSettings?: CycleSettings
): SafeHoursWindow[] {
  const useCycle = !!cycleLogs && cycleLogs.length > 0
  const minEntries = useCycle ? MIN_ENTRIES_WITH_CYCLE : MIN_ENTRIES_NO_CYCLE
  if (entries.length < minEntries) return []

  const counts: Record<string, { count: number; totalIntensity: number; phase?: string }> = {}

  for (const e of entries) {
    let phaseId: string | undefined
    if (useCycle) {
      const dateKey = extractDateKey(e)
      if (dateKey) {
        phaseId = getPhaseIdForDate(cycleLogs!, dateKey, cycleSettings) ?? undefined
      }
    }
    const key = useCycle && phaseId
      ? `${e.weekday}_${hourBucket(e.hour)}_${phaseId}`
      : `${e.weekday}_${hourBucket(e.hour)}`
    if (!counts[key]) counts[key] = { count: 0, totalIntensity: 0, phase: phaseId }
    counts[key].count++
    counts[key].totalIntensity += e.intensity
  }

  const windows: SafeHoursWindow[] = Object.entries(counts).map(([key, val]) => {
    const parts = key.split('_')
    const day = Number(parts[0])
    const hour = Number(parts[1])
    const phase = parts[2] as SafeHoursWindow['cyclePhase'] | undefined
    const avgIntensity = val.totalIntensity / val.count
    const score = val.count * avgIntensity
    const hourStr = `${String(hour).padStart(2, '0')}:00`
    const phaseSuffix = phase ? ` (${PHASE_SHORT[phase] ?? phase})` : ''
    return {
      dayOfWeek: day,
      hourStart: hour,
      cyclePhase: phase,
      score,
      label: `${DAY_SHORT[day]} ${hourStr}${phaseSuffix}`,
    }
  })

  return windows.sort((a, b) => b.score - a.score).slice(0, 3)
}

// Zwraca okno ryzyka pasujące do bieżącej godziny (i fazy, jeśli okno ją ma)
export function getCurrentRiskWindow(
  windows: SafeHoursWindow[],
  currentPhase?: SafeHoursWindow['cyclePhase']
): SafeHoursWindow | null {
  if (!windows.length) return null
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7
  const currentBucket = hourBucket(now.getHours())
  return windows.find(w =>
    w.dayOfWeek === currentDay &&
    w.hourStart === currentBucket &&
    (!w.cyclePhase || !currentPhase || w.cyclePhase === currentPhase)
  ) ?? null
}

// Zwraca okno, jeśli za < 30 minut zaczyna się okno ryzyka (dla powiadomień Safe Hours)
export function isApproachingRiskWindow(
  windows: SafeHoursWindow[],
  currentPhase?: SafeHoursWindow['cyclePhase']
): SafeHoursWindow | null {
  if (!windows.length) return null
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7
  const minutesNow = now.getHours() * 60 + now.getMinutes()

  for (const w of windows) {
    if (w.dayOfWeek !== currentDay) continue
    if (w.cyclePhase && currentPhase && w.cyclePhase !== currentPhase) continue
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
    .map(w => {
      const phasePart = w.cyclePhase ? ` w fazie ${PHASE_SHORT[w.cyclePhase] ?? w.cyclePhase}` : ''
      return `${DAY_FULL_ACCUSATIVE[w.dayOfWeek]} ${String(w.hourStart).padStart(2, '0')}:00${phasePart}`
    })
    .join(', ')
}

// Zwraca okna ryzyka dla dzisiejszego dnia tygodnia (do planowania powiadomień)
export function getWindowsForToday(windows: SafeHoursWindow[]): SafeHoursWindow[] {
  const today = (new Date().getDay() + 6) % 7
  return windows.filter(w => w.dayOfWeek === today)
}
