import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyLog, WeeklyReview, MonthlyReview, UserStats } from '@/types'
import { SIDE_QUESTS, getDailyQuests } from '@/lib/questData'
import { DAILY_RULES } from '@/lib/routineData'
import { APRIL_QUESTS } from '@/lib/aprilData'

const PILLAR_KEYS = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc'] as const
const PILLAR_LABELS = ['Pozycja', 'Ciało', 'Styl', 'Kapitał', 'Kariera', 'Tożsamość', 'Miłość']

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
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

function inRange(date: string, from: string | null, to: string | null): boolean {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
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

export interface DateRange {
  from: string | null  // YYYY-MM-DD
  to: string | null
}

// ── Eksport logów dziennych ──────────────────────────────────────
export async function exportLogsAsCSV(uid: string, range: DateRange = { from: null, to: null }) {
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'logs'),
    orderBy('date', 'asc')
  ))

  const headers = [
    'Data',
    'Łączne XP',
    'Tryb dnia',
    'Powód trybu minimum',
    'Ukończone elementy rutyny',
    'Questy dzienne (liczba)',
    'Side questy (liczba)',
    'Własne side questy (liczba)',
    'Zasada 1: Nie pisałam do byłego (0/1)',
    'Zasada 2: Zrobiłam coś dla przyszłości (0/1)',
    'Zasada 3: Zadbałam o wygląd (0/1)',
    'Łącznie zasad dotrzymanych',
    ...PILLAR_LABELS.map(p => `XP: ${p}`),
    'Aktywność fizyczna (0/1)',
    'Obecność społeczna (0/1)',
    'Ghost Protocol (0/1)',
    'Liczba check-inów nastroju',
    'Nastrój — energia (śr. 1–5)',
    'Nastrój — emocje (śr. 1–5)',
    'Nastrój — stany (calm/storm/fog/clarity)',
    'Kluczowy moment — tytuł',
    'Kluczowy moment — notatka',
    'Notatka',
  ]

  const rows: string[][] = [headers]

  snap.forEach((docSnap) => {
    const d = docSnap.data() as DailyLog & { pillarXP?: Record<string, number> }
    if (!inRange(d.date, range.from, range.to)) return

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
    const moodStates = moodCheckIns.map(m => m.state).join('; ')

    rows.push([
      d.date,
      String(d.totalXP ?? 0),
      d.dayMode ?? 'normal',
      d.minimumReason ?? '',
      String(d.completedRoutine?.length ?? 0),
      String(d.completedDailyQuests?.length ?? 0),
      String(d.completedSideQuests?.length ?? 0),
      String(d.customSideQuests?.length ?? 0),
      ...ruleFlags,
      String(keptRules.length),
      ...pillarXPValues,
      d.physicalActivity ? '1' : '0',
      d.socialPresence ? '1' : '0',
      d.ghostProtocolCompleted ? '1' : '0',
      String(moodCheckIns.length),
      avgEnergy,
      avgMood,
      moodStates,
      d.keyMoment?.title ?? '',
      d.keyMoment?.note ?? '',
      d.notes ?? '',
    ])
  })

  const suffix = range.from ? `${range.from}_${range.to ?? 'dziś'}` : new Date().toISOString().slice(0, 10)
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-logi-${suffix}.csv`)
}

// ── Eksport ukończonych questów ──────────────────────────────────
export async function exportQuestsAsCSV(uid: string, range: DateRange = { from: null, to: null }) {
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'logs'),
    orderBy('date', 'asc')
  ))

  const headers = ['Data', 'Tytuł questa', 'Filar', 'XP', 'Typ']
  const rows: string[][] = [headers]

  snap.forEach((docSnap) => {
    const d = docSnap.data() as DailyLog
    if (!inRange(d.date, range.from, range.to)) return
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

    for (const cq of d.customSideQuests ?? []) {
      rows.push([date, cq.title, cq.pillar, String(cq.xp), 'własny side quest'])
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

  const suffix = range.from ? `${range.from}_${range.to ?? 'dziś'}` : new Date().toISOString().slice(0, 10)
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-questy-${suffix}.csv`)
}

// ── Eksport przeglądów tygodniowych i miesięcznych ───────────────
export async function exportReviewsAsCSV(uid: string, range: DateRange = { from: null, to: null }) {
  const [weeklySnap, monthlySnap] = await Promise.all([
    getDocs(query(collection(db, 'users', uid, 'weeklyReviews'), orderBy('weekStart', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'monthlyReviews'), orderBy('month', 'asc'))),
  ])

  const pillarCols = PILLAR_LABELS.map(p => `Ocena: ${p}`)
  const weeklyHeaders = ['Typ', 'Okres', 'XP za przegląd', ...pillarCols, 'Highlights', 'Wyzwania', 'Focus na następny tydzień']
  const rows: string[][] = [weeklyHeaders]

  weeklySnap.forEach((docSnap) => {
    const r = docSnap.data() as WeeklyReview
    if (!inRange(r.weekStart, range.from, range.to)) return
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
    if (!inRange(r.month, range.from, range.to)) return
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

  const suffix = range.from ? `${range.from}_${range.to ?? 'dziś'}` : new Date().toISOString().slice(0, 10)
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-przeglady-${suffix}.csv`)
}

// ── Eksport statystyk globalnych ─────────────────────────────────
export async function exportStatsAsCSV(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'stats'))
  if (!snap.exists()) return

  const s = snap.data() as UserStats

  const headers = [
    'Łączne XP',
    'Aktualny streak (dni)',
    'Najdłuższy streak (dni)',
    'Data ostatniego streak',
    'Łącznie dni zalogowanych',
    'Łącznie rutyn ukończonych',
    'Łącznie questów dziennych',
    'Łącznie side questów',
    'Łącznie zasad dotrzymanych',
    ...PILLAR_LABELS.map(p => `XP filar: ${p}`),
    'Liczba odblokowanych osiągnięć',
    'Lista osiągnięć',
    'Liczba przeglądów tygodniowych',
    'Liczba przeglądów miesięcznych',
    'Łącznie Ghost Protocols',
    'Rekord XP w jednym dniu',
    'Dni z rzędu bez minimum',
    'Dni z rzędu z idealnym porankiem',
    'Miesięczne freeze streaka',
  ]

  const row = [
    String(s.totalXP ?? 0),
    String(s.currentStreak ?? 0),
    String(s.longestStreak ?? 0),
    s.lastStreakDate ?? '',
    String(s.totalDaysLogged ?? 0),
    String(s.totalRoutinesCompleted ?? 0),
    String(s.totalQuestsCompleted ?? 0),
    String(s.totalSideQuestsCompleted ?? 0),
    String(s.totalRulesKept ?? 0),
    ...PILLAR_KEYS.map(p => String(s.pillarXP?.[p] ?? 0)),
    String(s.unlockedAchievements?.length ?? 0),
    (s.unlockedAchievements ?? []).join('; '),
    String(s.reviewedWeeks?.length ?? 0),
    String(s.reviewedMonths?.length ?? 0),
    String(s.totalGhostProtocols ?? 0),
    String(s.highestDayXP ?? 0),
    String(s.consecutiveNormalDays ?? 0),
    String(s.consecutivePerfectMornings ?? 0),
    (s.streakFreezeUsedMonths ?? []).join('; '),
  ]

  const csv = [headers, row].map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-statystyki-${new Date().toISOString().slice(0, 10)}.csv`)
}

// ── Pobierz wszystko naraz ────────────────────────────────────────
export async function exportAllAsCSV(uid: string, range: DateRange = { from: null, to: null }) {
  await Promise.all([
    exportLogsAsCSV(uid, range),
    exportQuestsAsCSV(uid, range),
    exportReviewsAsCSV(uid, range),
    exportStatsAsCSV(uid),
  ])
}

// ── Eksport AI-friendly (Markdown) ───────────────────────────────
export async function exportAsMarkdown(uid: string, range: DateRange = { from: null, to: null }) {
  const [logsSnap, weeklySnap, monthlySnap, statsSnap] = await Promise.all([
    getDocs(query(collection(db, 'users', uid, 'logs'), orderBy('date', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'weeklyReviews'), orderBy('weekStart', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'monthlyReviews'), orderBy('month', 'asc'))),
    getDoc(doc(db, 'users', uid, 'data', 'stats')),
  ])

  const s = statsSnap.exists() ? statsSnap.data() as UserStats : null
  const today = new Date().toISOString().slice(0, 10)
  const suffix = range.from ? `${range.from}_${range.to ?? today}` : today

  const lines: string[] = []

  // ── NAGŁÓWEK ──────────────────────────────────────────────────
  lines.push(`# Projekt 30 — Dziennik transformacji`)
  lines.push(``)
  lines.push(`> **Projekt:** Natalia Jórska · 5 kwietnia 2026 → 5 kwietnia 2027`)
  lines.push(`> **Eksport wygenerowany:** ${today}`)
  if (range.from) lines.push(`> **Zakres dat:** ${range.from} → ${range.to ?? today}`)
  lines.push(``)
  lines.push(`Projekt 30 to roczny program osobistej transformacji podzielony na 7 filarów: **Pozycja wewnętrzna, Ciało i energia, Styl i aura, Kapitał społeczny, Kariera i finanse, Tożsamość premium, Miłość i standard**. Każdy dzień jest logowany: rutyna, zasady, questy, nastrój, notatki i kluczowe momenty.`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── STATYSTYKI GLOBALNE ────────────────────────────────────────
  if (s) {
    lines.push(`## Statystyki globalne`)
    lines.push(``)
    lines.push(`| Metryka | Wartość |`)
    lines.push(`|---------|---------|`)
    lines.push(`| Łączne XP | **${s.totalXP ?? 0}** |`)
    lines.push(`| Aktualny streak | ${s.currentStreak ?? 0} dni |`)
    lines.push(`| Najdłuższy streak | ${s.longestStreak ?? 0} dni |`)
    lines.push(`| Dni zalogowanych | ${s.totalDaysLogged ?? 0} |`)
    lines.push(`| Rutyny ukończone | ${s.totalRoutinesCompleted ?? 0} elementów |`)
    lines.push(`| Questy dzienne | ${s.totalQuestsCompleted ?? 0} |`)
    lines.push(`| Side questy | ${s.totalSideQuestsCompleted ?? 0} |`)
    lines.push(`| Zasady dotrzymane | ${s.totalRulesKept ?? 0} razy |`)
    lines.push(`| Ghost Protocol aktywowany | ${s.totalGhostProtocols ?? 0} razy |`)
    lines.push(`| Rekord XP w jednym dniu | ${s.highestDayXP ?? 0} XP |`)
    lines.push(`| Przeglądy tygodniowe | ${s.reviewedWeeks?.length ?? 0} |`)
    lines.push(`| Przeglądy miesięczne | ${s.reviewedMonths?.length ?? 0} |`)
    lines.push(``)
    lines.push(`### XP per filar`)
    lines.push(``)
    lines.push(`| Filar | XP |`)
    lines.push(`|-------|-----|`)
    const pillarNames: Record<string, string> = {
      pozycja: 'Pozycja wewnętrzna',
      cialo: 'Ciało i energia',
      styl: 'Styl i aura',
      kapital: 'Kapitał społeczny',
      kariera: 'Kariera i finanse',
      tozsamosc: 'Tożsamość premium',
      milosc: 'Miłość i standard',
    }
    for (const [key, name] of Object.entries(pillarNames)) {
      lines.push(`| ${name} | ${(s.pillarXP as Record<string, number>)?.[key] ?? 0} |`)
    }
    lines.push(``)

    if ((s.unlockedAchievements?.length ?? 0) > 0) {
      const { ACHIEVEMENTS } = await import('./achievements')
      lines.push(`### Odblokowane osiągnięcia (${s.unlockedAchievements.length})`)
      lines.push(``)
      for (const id of s.unlockedAchievements) {
        const ach = ACHIEVEMENTS.find(a => a.id === id)
        if (ach) lines.push(`- ${ach.icon} **${ach.title}** — ${ach.description}`)
      }
      lines.push(``)
    }

    lines.push(`---`)
    lines.push(``)
  }

  // ── PRZEGLĄDY MIESIĘCZNE ───────────────────────────────────────
  const monthlyDocs = monthlySnap.docs
    .map(d => d.data() as MonthlyReview)
    .filter(r => inRange(r.month, range.from, range.to))

  if (monthlyDocs.length > 0) {
    lines.push(`## Przeglądy miesięczne`)
    lines.push(``)
    for (const r of monthlyDocs) {
      lines.push(`### Miesiąc: ${r.month}`)
      lines.push(``)
      if (r.highlights) {
        lines.push(`**Highlights miesiąca:**`)
        lines.push(``)
        lines.push(r.highlights)
        lines.push(``)
      }
      if (r.challenges) {
        lines.push(`**Wyzwania:**`)
        lines.push(``)
        lines.push(r.challenges)
        lines.push(``)
      }
      const pillarRatings = Object.entries(r.pillarsRated ?? {})
        .map(([p, v]) => `${pillarName(p)}: ${v}/10`)
        .join(' · ')
      if (pillarRatings) lines.push(`**Oceny filarów:** ${pillarRatings}`)
      if (r.intentionNextMonth) {
        lines.push(``)
        lines.push(`**Intencja na następny miesiąc:**`)
        lines.push(``)
        lines.push(r.intentionNextMonth)
      }
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── PRZEGLĄDY TYGODNIOWE ──────────────────────────────────────
  const weeklyDocs = weeklySnap.docs
    .map(d => d.data() as WeeklyReview)
    .filter(r => inRange(r.weekStart, range.from, range.to))

  if (weeklyDocs.length > 0) {
    lines.push(`## Przeglądy tygodniowe`)
    lines.push(``)
    for (const r of weeklyDocs) {
      lines.push(`### Tydzień od: ${r.weekStart}`)
      lines.push(``)
      if (r.highlights) {
        lines.push(`**Co poszło dobrze:**`)
        lines.push(``)
        lines.push(r.highlights)
        lines.push(``)
      }
      if (r.challenges) {
        lines.push(`**Wyzwania:**`)
        lines.push(``)
        lines.push(r.challenges)
        lines.push(``)
      }
      const pillarRatings = Object.entries(r.pillarsRated ?? {})
        .map(([p, v]) => `${pillarName(p)}: ${v}/10`)
        .join(' · ')
      if (pillarRatings) lines.push(`**Oceny filarów:** ${pillarRatings}`)
      if (r.nextWeekFocus) {
        lines.push(``)
        lines.push(`**Focus na przyszły tydzień:** ${r.nextWeekFocus}`)
      }
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── DZIENNIK DZIENNY ──────────────────────────────────────────
  lines.push(`## Dziennik dzienny`)
  lines.push(``)

  const logDocs = logsSnap.docs
    .map(d => d.data() as DailyLog & { pillarXP?: Record<string, number> })
    .filter(d => inRange(d.date, range.from, range.to))

  for (const d of logDocs) {
    const hasContent = d.notes || d.keyMoment || (d.moodCheckIns?.length ?? 0) > 0

    lines.push(`### ${d.date}${d.dayMode === 'minimum' ? ' _(dzień minimum)_' : ''}`)
    lines.push(``)

    // Metryki dnia
    const metrics: string[] = [`XP: **${d.totalXP ?? 0}**`]
    if ((d.completedRoutine?.length ?? 0) > 0) metrics.push(`rutyna: ${d.completedRoutine.length} elem.`)
    if ((d.completedDailyQuests?.length ?? 0) > 0) metrics.push(`questy: ${d.completedDailyQuests.length}`)
    if ((d.completedSideQuests?.length ?? 0) > 0 || (d.customSideQuests?.length ?? 0) > 0) {
      const sq = (d.completedSideQuests?.length ?? 0) + (d.customSideQuests?.length ?? 0)
      metrics.push(`side questy: ${sq}`)
    }
    if ((d.keptRules?.length ?? 0) > 0) metrics.push(`zasady: ${d.keptRules.length}/3`)
    lines.push(metrics.join(' · '))
    lines.push(``)

    // Zasady
    if ((d.keptRules?.length ?? 0) > 0) {
      const { DAILY_RULES } = await import('./routineData')
      const kept = DAILY_RULES.filter(r => d.keptRules.includes(r.id)).map(r => r.text)
      if (kept.length > 0) lines.push(`_Zasady: ${kept.join(' · ')}_`)
      lines.push(``)
    }

    // Side questy — nazwy
    const allSQ: string[] = []
    for (const qId of d.completedSideQuests ?? []) {
      const q = SIDE_QUESTS.find(sq => sq.id === qId)
      if (q) allSQ.push(q.title)
    }
    for (const cq of d.customSideQuests ?? []) {
      allSQ.push(`${cq.title} (własny)`)
    }
    if (allSQ.length > 0) {
      lines.push(`**Side questy:** ${allSQ.join(', ')}`)
      lines.push(``)
    }

    // Nastrój
    if ((d.moodCheckIns?.length ?? 0) > 0) {
      const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '-'
      const energies = d.moodCheckIns!.map(m => m.energy)
      const moods = d.moodCheckIns!.map(m => m.mood)
      const stateSet = new Set(d.moodCheckIns!.map(m => m.state))
      const states = Array.from(stateSet).join(', ')
      lines.push(`**Nastrój:** energia ${avg(energies)}/5 · emocje ${avg(moods)}/5 · ${states}`)
      lines.push(``)
    }

    // Kluczowy moment
    if (d.keyMoment) {
      lines.push(`**Kluczowy moment:** ${d.keyMoment.title}`)
      if (d.keyMoment.note) {
        lines.push(``)
        lines.push(`> ${d.keyMoment.note}`)
      }
      lines.push(``)
    }

    // Notatka
    if (d.notes) {
      lines.push(`**Notatka:**`)
      lines.push(``)
      lines.push(d.notes)
      lines.push(``)
    }

    if (!hasContent && metrics.length <= 1) lines.push(`_(brak notatek)_`)
    lines.push(``)
  }

  const md = lines.join('\n')
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `projekt30-dziennik-${suffix}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function pillarName(key: string): string {
  const map: Record<string, string> = {
    pozycja: 'Pozycja', cialo: 'Ciało', styl: 'Styl',
    kapital: 'Kapitał', kariera: 'Kariera', tozsamosc: 'Tożsamość', milosc: 'Miłość',
  }
  return map[key] ?? key
}
