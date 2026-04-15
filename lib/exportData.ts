import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyLog } from '@/types'
import { SIDE_QUESTS } from '@/lib/questData'
import { DAILY_RULES } from '@/lib/routineData'

const PILLAR_KEYS = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc'] as const
const PILLAR_LABELS = ['Pozycja', 'Ciało', 'Styl', 'Kapitał', 'Kariera', 'Tożsamość', 'Miłość']

// Aproksymacja max elementów rutyny per tryb (bez custom items)
const NORMAL_ROUTINE_MAX = 16
const MINIMUM_ROUTINE_MAX = 6

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCSV(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ── Główny eksport logów ─────────────────────────────────────────
export async function exportLogsAsCSV(uid: string) {
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'logs'),
    orderBy('date', 'asc')
  ))

  const headers = [
    'Data',
    'Łączne XP',
    'Tryb dnia',
    '% ukończenia rutyny',
    'Ukończone elementy rutyny',
    'Questy dzienne',
    'Side questy',
    'Zasada 1: Nie pisałam do byłego (0/1)',
    'Zasada 2: Zrobiłam coś dla przyszłości (0/1)',
    'Zasada 3: Zadbałam o wygląd (0/1)',
    'Łącznie zasad dotrzymanych',
    ...PILLAR_LABELS.map(p => `XP: ${p}`),
  ]

  const rows: string[][] = [headers]

  snap.forEach((docSnap) => {
    const d = docSnap.data() as DailyLog & { pillarXP?: Record<string, number> }
    const mode = d.dayMode ?? 'normal'
    const max = mode === 'minimum' ? MINIMUM_ROUTINE_MAX : NORMAL_ROUTINE_MAX
    const routineCount = d.completedRoutine?.length ?? 0
    const completionRate = Math.min(100, Math.round((routineCount / max) * 100))
    const keptRules = d.keptRules ?? []
    const ruleFlags = DAILY_RULES.map(r => keptRules.includes(r.id) ? '1' : '0')
    const pillarXPValues = PILLAR_KEYS.map(p => String((d as any).pillarXP?.[p] ?? 0))

    rows.push([
      d.date,
      String(d.totalXP ?? 0),
      mode,
      String(completionRate),
      String(routineCount),
      String(d.completedDailyQuests?.length ?? 0),
      String(d.completedSideQuests?.length ?? 0),
      ...ruleFlags,
      String(keptRules.length),
      ...pillarXPValues,
    ])
  })

  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-logi-${new Date().toISOString().slice(0, 10)}.csv`)
}

// ── Eksport ukończonych questów ──────────────────────────────────
export async function exportQuestsAsCSV(uid: string) {
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'logs'),
    orderBy('date', 'asc')
  ))

  const headers = ['Data', 'Tytuł questa', 'Filar', 'XP', 'Typ']
  const rows: string[][] = [headers]

  snap.forEach((docSnap) => {
    const d = docSnap.data() as DailyLog
    const date = d.date

    for (const questId of d.completedSideQuests ?? []) {
      const quest = SIDE_QUESTS.find(q => q.id === questId)
      rows.push([
        date,
        quest?.title ?? questId,
        quest?.pillar ?? '',
        String(quest?.xp ?? 0),
        'side quest',
      ])
    }

    for (const questId of d.completedDailyQuests ?? []) {
      rows.push([date, questId, '', '50', 'quest dzienny'])
    }
  })

  if (rows.length === 1) {
    rows.push(['Brak ukończonych questów w historii', '', '', '', ''])
  }

  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-questy-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function printYearSummary() {
  window.print()
}
