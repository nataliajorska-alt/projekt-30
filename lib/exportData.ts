import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyLog, WeeklyReview, MonthlyReview } from '@/types'
import { SIDE_QUESTS, getDailyQuests } from '@/lib/questData'
import { DAILY_RULES } from '@/lib/routineData'
import { APRIL_QUESTS } from '@/lib/aprilData'

const PILLAR_KEYS = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc'] as const
const PILLAR_LABELS = ['Pozycja', 'Ciało', 'Styl', 'Kapitał', 'Kariera', 'Tożsamość', 'Miłość']

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

function findQuestTitle(questId: string, dateKey: string): string {
  const side = SIDE_QUESTS.find(q => q.id === questId)
  if (side) return side.title
  const april = APRIL_QUESTS.find(q => q.id === questId)
  if (april) return april.title
  const daily = getDailyQuests(dateKey).find(q => q.id === questId)
  if (daily) return daily.title
  return questId
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
    'Ukończone elementy rutyny',
    'Questy dzienne (liczba)',
    'Side questy (liczba)',
    'Zasada 1: Nie pisałam do byłego (0/1)',
    'Zasada 2: Zrobiłam coś dla przyszłości (0/1)',
    'Zasada 3: Zadbałam o wygląd (0/1)',
    'Łącznie zasad dotrzymanych',
    ...PILLAR_LABELS.map(p => `XP: ${p}`),
    'Aktywność fizyczna (0/1)',
    'Obecność społeczna (0/1)',
    'Ghost Protocol (0/1)',
    'Nastrój — energia (śr. 1–5)',
    'Nastrój — emocje (śr. 1–5)',
    'Kluczowy moment',
    'Notatka',
  ]

  const rows: string[][] = [headers]

  snap.forEach((docSnap) => {
    const d = docSnap.data() as DailyLog & { pillarXP?: Record<string, number> }
    const keptRules = d.keptRules ?? []
    const ruleFlags = DAILY_RULES.map(r => keptRules.includes(r.id) ? '1' : '0')
    const pillarXPValues = PILLAR_KEYS.map(p => String((d as any).pillarXP?.[p] ?? 0))

    const moodCheckIns = d.moodCheckIns ?? []
    const avgEnergy = moodCheckIns.length
      ? (moodCheckIns.reduce((s, m) => s + m.energy, 0) / moodCheckIns.length).toFixed(1)
      : ''
    const avgMood = moodCheckIns.length
      ? (moodCheckIns.reduce((s, m) => s + m.mood, 0) / moodCheckIns.length).toFixed(1)
      : ''

    rows.push([
      d.date,
      String(d.totalXP ?? 0),
      d.dayMode ?? 'normal',
      String(d.completedRoutine?.length ?? 0),
      String(d.completedDailyQuests?.length ?? 0),
      String(d.completedSideQuests?.length ?? 0),
      ...ruleFlags,
      String(keptRules.length),
      ...pillarXPValues,
      d.physicalActivity ? '1' : '0',
      d.socialPresence ? '1' : '0',
      d.ghostProtocolCompleted ? '1' : '0',
      avgEnergy,
      avgMood,
      d.keyMoment?.title ?? '',
      d.notes ?? '',
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
        String(quest?.xp ?? 120),
        'side quest',
      ])
    }

    for (const questId of d.completedDailyQuests ?? []) {
      const title = findQuestTitle(questId, date)
      const april = APRIL_QUESTS.find(q => q.id === questId)
      const pillar = april?.pillar ?? getDailyQuests(date).find(q => q.id === questId)?.pillar ?? ''
      rows.push([date, title, pillar, String(april?.xp ?? 50), april ? 'quest miesięczny' : 'quest dzienny'])
    }
  })

  if (rows.length === 1) {
    rows.push(['Brak ukończonych questów w historii', '', '', '', ''])
  }

  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-questy-${new Date().toISOString().slice(0, 10)}.csv`)
}

// ── Eksport przeglądów tygodniowych i miesięcznych ───────────────
export async function exportReviewsAsCSV(uid: string) {
  const [weeklySnap, monthlySnap] = await Promise.all([
    getDocs(query(collection(db, 'users', uid, 'weeklyReviews'), orderBy('weekStart', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'monthlyReviews'), orderBy('month', 'asc'))),
  ])

  const pillarCols = PILLAR_LABELS.map(p => `Ocena: ${p}`)

  // Weekly
  const weeklyHeaders = ['Typ', 'Okres', 'XP za przegląd', ...pillarCols, 'Highlights', 'Wyzwania', 'Focus na następny tydzień']
  const rows: string[][] = [weeklyHeaders]

  weeklySnap.forEach((docSnap) => {
    const r = docSnap.data() as WeeklyReview
    const pillarRatings = PILLAR_KEYS.map(p => String(r.pillarsRated?.[p] ?? ''))
    rows.push([
      'tygodniowy',
      r.weekStart,
      String(r.xpEarned ?? 0),
      ...pillarRatings,
      r.highlights ?? '',
      r.challenges ?? '',
      r.nextWeekFocus ?? '',
    ])
  })

  monthlySnap.forEach((docSnap) => {
    const r = docSnap.data() as MonthlyReview
    const pillarRatings = PILLAR_KEYS.map(p => String(r.pillarsRated?.[p] ?? ''))
    rows.push([
      'miesięczny',
      r.month,
      String(r.xpEarned ?? 0),
      ...pillarRatings,
      r.highlights ?? '',
      r.challenges ?? '',
      r.intentionNextMonth ?? '',
    ])
  })

  if (rows.length === 1) {
    rows.push(['Brak zapisanych przeglądów', '', '', ...PILLAR_KEYS.map(() => ''), '', '', ''])
  }

  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-przeglady-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function printYearSummary() {
  window.print()
}
