import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import type { DailyLog, WeeklyReview, MonthlyReview, UserStats } from '@/types'
import { SIDE_QUESTS, getDailyQuests } from '@/lib/questData'
import { DAILY_RULES } from '@/lib/routineData'
import { APRIL_QUESTS } from '@/lib/seasonal/aprilData'
import { MONTHLY_DATA } from '@/lib/seasonal/monthData'
import { CIGARETTE_CONTEXTS } from '@/lib/smoke-data'
import { dateKey } from '@/lib/gameLogic'

const PILLAR_KEYS = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc'] as const
const PILLAR_LABELS = ['Pozycja', 'Ciało', 'Styl', 'Kapitał', 'Kariera', 'Tożsamość', 'Miłość']

const PL_MONTHS: Record<string, string> = {
  '01': 'Styczeń', '02': 'Luty', '03': 'Marzec', '04': 'Kwiecień', '05': 'Maj', '06': 'Czerwiec',
  '07': 'Lipiec', '08': 'Sierpień', '09': 'Wrzesień', '10': 'Październik', '11': 'Listopad', '12': 'Grudzień',
}
const WEEKDAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const CIG_CTX_LABEL: Record<string, string> = Object.fromEntries(CIGARETTE_CONTEXTS.map(c => [c.id, c.label]))
function cigCtxLabel(id?: string): string { return (id && CIG_CTX_LABEL[id]) || 'Inne' }
// "2026-06" → "Czerwiec 2026 „Zakorzenienie""
function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  const name = MONTHLY_DATA[monthKey]?.name
  return `${PL_MONTHS[m] ?? m} ${y}${name ? ` „${name}"` : ''}`
}

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
    collection(db, ...paths.logsCol(uid)),
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
    'Zasada 1: Nie wróciłam do starych wzorców (0/1)',
    'Zasada 2: Zrobiłam coś dla przyszłości (0/1)',
    'Zasada 3: Zrobiłam jedną rzecz dla spokoju (0/1)',
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
    'Papierosy (liczba)',
    'Papierosy — konteksty',
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

    const cigs = d.cigarettes ?? []
    let cigCtx = ''
    if (cigs.length > 0) {
      const m = new Map<string, number>()
      for (const c of cigs) m.set(c.context ?? 'inne', (m.get(c.context ?? 'inne') ?? 0) + 1)
      cigCtx = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join('; ')
    }

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
      String(cigs.length),
      cigCtx,
      d.notes ?? '',
    ])
  })

  const suffix = range.from ? `${range.from}_${range.to ?? 'dziś'}` : dateKey(new Date())
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-logi-${suffix}.csv`)
}

// ── Eksport ukończonych questów ──────────────────────────────────
export async function exportQuestsAsCSV(uid: string, range: DateRange = { from: null, to: null }) {
  const snap = await getDocs(query(
    collection(db, ...paths.logsCol(uid)),
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

  const suffix = range.from ? `${range.from}_${range.to ?? 'dziś'}` : dateKey(new Date())
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-questy-${suffix}.csv`)
}

// ── Eksport przeglądów tygodniowych i miesięcznych ───────────────
export async function exportReviewsAsCSV(uid: string, range: DateRange = { from: null, to: null }) {
  const [weeklySnap, monthlySnap] = await Promise.all([
    getDocs(query(collection(db, ...paths.weeklyReviewsCol(uid)), orderBy('weekStart', 'asc'))),
    getDocs(query(collection(db, ...paths.monthlyReviewsCol(uid)), orderBy('month', 'asc'))),
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

  const suffix = range.from ? `${range.from}_${range.to ?? 'dziś'}` : dateKey(new Date())
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadCSV(csv, `projekt30-przeglady-${suffix}.csv`)
}

// ── Eksport statystyk globalnych ─────────────────────────────────
export async function exportStatsAsCSV(uid: string) {
  const snap = await getDoc(doc(db, ...paths.dataDoc(uid, 'stats')))
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
  downloadCSV(csv, `projekt30-statystyki-${dateKey(new Date())}.csv`)
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
  const [
    logsSnap, weeklySnap, monthlySnap, statsSnap,
    ghostV2Snap, honestFailureSnap, vaultSnap, photosSnap,
    cycleSnap, aprilQuestSnap,
  ] = await Promise.all([
    getDocs(query(collection(db, ...paths.logsCol(uid)), orderBy('date', 'asc'))),
    getDocs(query(collection(db, ...paths.weeklyReviewsCol(uid)), orderBy('weekStart', 'asc'))),
    getDocs(query(collection(db, ...paths.monthlyReviewsCol(uid)), orderBy('month', 'asc'))),
    getDoc(doc(db, ...paths.dataDoc(uid, 'stats'))),
    getDoc(doc(db, ...paths.dataDoc(uid, 'ghostLogV2'))),
    getDoc(doc(db, ...paths.dataDoc(uid, 'honestFailureLog'))),
    getDocs(query(collection(db, ...paths.vaultCol(uid)), orderBy('createdAt', 'asc'))),
    getDocs(query(collection(db, ...paths.photosCol(uid)), orderBy('dateKey', 'asc'))),
    getDocs(query(collection(db, ...paths.cycleCol(uid)), orderBy('startDate', 'asc'))),
    getDoc(doc(db, ...paths.dataDoc(uid, 'aprilQuestLog'))),
  ])
  // ── NOWE: imports danych statycznych ──────────────────────────
  const { ACHIEVEMENTS } = await import('./achievements')
  const { DAILY_RULES, MORNING_ROUTINE, EVENING_ROUTINE, DAILY_HABITS, MORNING_MINIMUM, EVENING_MINIMUM } = await import('./routineData')
  const { APRIL_QUESTS } = await import('./seasonal/aprilData')
  const { GHOST_CATEGORIES, INTENSITY_LABELS } = await import('./ghost-data')

  // Lookup map elementów rutyny
  const ALL_ROUTINE = [...MORNING_ROUTINE, ...EVENING_ROUTINE, ...DAILY_HABITS, ...MORNING_MINIMUM, ...EVENING_MINIMUM]
  const routineMap = new Map(ALL_ROUTINE.map(r => [r.id, r.text]))

  const s = statsSnap.exists() ? statsSnap.data() as UserStats : null
  const today = dateKey(new Date())
  const suffix = range.from ? `${range.from}_${range.to ?? today}` : today

  const ghostEntries: any[] = ghostV2Snap.exists() ? (ghostV2Snap.data().entries ?? []) : []
  const honestFailures: any[] = honestFailureSnap.exists() ? (honestFailureSnap.data().entries ?? []) : []
  const aprilLog = aprilQuestSnap.exists() ? aprilQuestSnap.data() : { completed: [] }
  const aprilCompleted: string[] = aprilLog.completed ?? []

  const tsInRange = (timestamp: number) =>
    inRange(dateKey(new Date(timestamp)), range.from, range.to)

  const lines: string[] = []

  // ── NAGŁÓWEK ─────────────────────────────────────────────────
  lines.push(`# Projekt 30 — Dziennik transformacji`)
  lines.push(``)
  lines.push(`> **Projekt:** Natalia Jórska · 5 kwietnia 2026 → 5 kwietnia 2027`)
  lines.push(`> **Eksport wygenerowany:** ${today}`)
  if (range.from) lines.push(`> **Zakres dat w tym pliku:** ${range.from} → ${range.to ?? today}`)
  lines.push(``)
  lines.push(`Projekt 30 to roczny program osobistej transformacji oparty na 7 filarach: **Pozycja wewnętrzna, Ciało i energia, Styl i aura, Kapitał społeczny, Kariera i finanse, Tożsamość premium, Miłość i standard**. Każdy dzień jest logowany: rutyna, zasady, questy, nastrój, notatki i kluczowe momenty.`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── STATYSTYKI GLOBALNE ───────────────────────────────────────
  if (s) {
    lines.push(`## Statystyki globalne (całość projektu)`)
    lines.push(``)
    lines.push(`| Metryka | Wartość |`)
    lines.push(`|---------|---------|`)
    lines.push(`| Łączne XP | **${s.totalXP ?? 0}** |`)
    lines.push(`| Aktualny streak | ${s.currentStreak ?? 0} dni z rzędu |`)
    lines.push(`| Najdłuższy streak | ${s.longestStreak ?? 0} dni |`)
    lines.push(`| Łącznie dni zalogowanych | ${s.totalDaysLogged ?? 0} |`)
    lines.push(`| Elementy rutyny | ${s.totalRoutinesCompleted ?? 0} |`)
    lines.push(`| Questy dzienne | ${s.totalQuestsCompleted ?? 0} |`)
    lines.push(`| Side questy | ${s.totalSideQuestsCompleted ?? 0} |`)
    lines.push(`| Zasady dotrzymane | ${s.totalRulesKept ?? 0} razy |`)
    lines.push(`| Ghost Protocol aktywowany | ${s.totalGhostProtocols ?? 0} razy |`)
    lines.push(`| Rekord XP w jednym dniu | ${s.highestDayXP ?? 0} XP |`)
    lines.push(`| Idealne poranki z rzędu (rekord) | ${s.consecutivePerfectMornings ?? 0} |`)
    lines.push(`| Dni normalnych z rzędu (rekord) | ${s.consecutiveNormalDays ?? 0} |`)
    lines.push(`| Przeglądy tygodniowe | ${s.reviewedWeeks?.length ?? 0} |`)
    lines.push(`| Przeglądy miesięczne | ${s.reviewedMonths?.length ?? 0} |`)
    lines.push(``)
    lines.push(`### XP per filar`)
    lines.push(``)
    lines.push(`| Filar | XP |`)
    lines.push(`|-------|-----|`)
    const pillarFullNames: Record<string, string> = {
      pozycja: 'Pozycja wewnętrzna', cialo: 'Ciało i energia', styl: 'Styl i aura',
      kapital: 'Kapitał społeczny', kariera: 'Kariera i finanse',
      tozsamosc: 'Tożsamość premium', milosc: 'Miłość i standard',
    }
    for (const [key, name] of Object.entries(pillarFullNames)) {
      lines.push(`| ${name} | ${(s.pillarXP as Record<string, number>)?.[key] ?? 0} |`)
    }
    lines.push(``)

    if ((s.unlockedAchievements?.length ?? 0) > 0) {
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

  // ── PAPIEROSY — dane obserwacyjne ────────────────────────────
  const cigDayLogs = logsSnap.docs
    .map(d => d.data() as DailyLog)
    .filter(d => inRange(d.date, range.from, range.to))
  const cigEntries: { date: string; c: NonNullable<DailyLog['cigarettes']>[number] }[] = []
  const cigPerDay: { date: string; n: number }[] = []
  for (const d of cigDayLogs) {
    const cs = d.cigarettes ?? []
    if (cs.length > 0) cigPerDay.push({ date: d.date, n: cs.length })
    for (const c of cs) cigEntries.push({ date: d.date, c })
  }

  const hasPhaseInfo = !!s && (s.cigarettesPhase != null || s.cigarettesBaseline != null || s.smokingTrackingEnabled != null)
  if (cigEntries.length > 0 || hasPhaseInfo) {
    lines.push(`## Papierosy — dane obserwacyjne`)
    lines.push(``)
    lines.push(`_Filozofia planu: papieros to dane, nie porażka. Brak licznika „dni bez", brak ocen — czysta obserwacja pod baseline._`)
    lines.push(``)

    if (hasPhaseInfo && s) {
      const phaseBits: string[] = []
      if (s.cigarettesPhase != null) phaseBits.push(`faza ${s.cigarettesPhase}`)
      if (s.cigarettesPhaseStartDate) phaseBits.push(`start fazy: ${s.cigarettesPhaseStartDate}`)
      if (s.cigarettesBaseline != null) phaseBits.push(`baseline: ${s.cigarettesBaseline}/dzień`)
      if (s.smokingTrackingEnabled != null) phaseBits.push(`tracking: ${s.smokingTrackingEnabled ? 'włączony' : 'wyłączony'}`)
      if (phaseBits.length > 0) { lines.push(`**Stan planu:** ${phaseBits.join(' · ')}`); lines.push(``) }
    }

    if (cigEntries.length > 0) {
      const total = cigEntries.length
      const daysLogged = cigPerDay.length
      const avg = daysLogged ? (total / daysLogged).toFixed(1) : '0'
      const maxDay = cigPerDay.reduce((m, x) => (x.n > m.n ? x : m), cigPerDay[0])
      const minDay = cigPerDay.reduce((m, x) => (x.n < m.n ? x : m), cigPerDay[0])
      lines.push(`**Podsumowanie:** ${total} papierosów · ${daysLogged} dni z logiem · śr. ${avg}/dzień · max ${maxDay.n} (${maxDay.date}) · min ${minDay.n} (${minDay.date})`)
      lines.push(``)

      const byCtx = new Map<string, number>()
      for (const e of cigEntries) byCtx.set(e.c.context ?? 'inne', (byCtx.get(e.c.context ?? 'inne') ?? 0) + 1)
      lines.push(`**Wg kontekstu:**`)
      lines.push(``)
      for (const [k, n] of Array.from(byCtx.entries()).sort((a, b) => b[1] - a[1])) {
        lines.push(`- ${cigCtxLabel(k)}: ${n} (${Math.round((n / total) * 100)}%)`)
      }
      lines.push(``)

      const byWd = new Array(7).fill(0)
      for (const e of cigEntries) if (typeof e.c.weekday === 'number') byWd[e.c.weekday]++
      lines.push(`**Wg dnia tygodnia:** ${WEEKDAYS_PL.map((w, i) => `${w} ${byWd[i]}`).join(' · ')}`)
      lines.push(``)

      const buckets: Record<string, number> = { 'noc 0–6': 0, 'rano 6–12': 0, 'popoł. 12–18': 0, 'wieczór 18–24': 0 }
      for (const e of cigEntries) {
        const h = e.c.hour ?? 0
        if (h < 6) buckets['noc 0–6']++
        else if (h < 12) buckets['rano 6–12']++
        else if (h < 18) buckets['popoł. 12–18']++
        else buckets['wieczór 18–24']++
      }
      lines.push(`**Wg pory dnia:** ${Object.entries(buckets).map(([k, n]) => `${k}: ${n}`).join(' · ')}`)
      lines.push(``)

      lines.push(`**Dzienne liczby:**`)
      lines.push(``)
      for (const x of cigPerDay) lines.push(`- ${x.date}: ${x.n}`)
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── QUESTY MIESIĘCZNE ─────────────────────────────────────────
  const monthlyInRange = APRIL_QUESTS.filter(q => aprilCompleted.includes(q.id) && inRange(q.date, range.from, range.to))
  if (monthlyInRange.length > 0) {
    const byMonth = new Map<string, typeof monthlyInRange>()
    for (const q of monthlyInRange) {
      const k = q.date.slice(0, 7)
      if (!byMonth.has(k)) byMonth.set(k, [])
      byMonth.get(k)!.push(q)
    }
    lines.push(`## Questy miesięczne`)
    lines.push(``)
    for (const k of Array.from(byMonth.keys()).sort()) {
      lines.push(`### ${monthLabel(k)}`)
      const motto = MONTHLY_DATA[k]?.motto
      if (motto) { lines.push(``); lines.push(`_Motto: ${motto}_`) }
      lines.push(``)
      for (const q of byMonth.get(k)!) {
        lines.push(`- **${q.date}** · ${q.title} · ${pillarName(q.pillar)} · +${q.xp} XP`)
        if (q.description) lines.push(`  > ${q.description}`)
      }
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── VAULT ─────────────────────────────────────────────────────
  interface VaultEntry { id: string; title: string; content: string; dateKey: string; dayOfProject: number }
  const vaultEntries = vaultSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as VaultEntry))
    .filter(e => inRange(e.dateKey, range.from, range.to))

  if (vaultEntries.length > 0) {
    lines.push(`## Vault — prywatne notatki (${vaultEntries.length})`)
    lines.push(``)
    for (const e of vaultEntries) {
      lines.push(`### ${e.dateKey} · Dzień ${e.dayOfProject} · ${e.title}`)
      lines.push(``)
      lines.push(e.content)
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── GHOST PROTOCOL ────────────────────────────────────────────
  const ghostInRange = ghostEntries.filter(e => tsInRange(e.timestamp))
  const failuresInRange = honestFailures.filter(e => tsInRange(e.timestamp))

  if (ghostInRange.length > 0 || failuresInRange.length > 0) {
    lines.push(`## Ghost Protocol — historia impulsów`)
    lines.push(``)
    lines.push(`_Ghost Protocol = system zarządzania impulsem kontaktu z byłym. Każda aktywacja to wybór siebie zamiast wysłania wiadomości._`)
    lines.push(``)

    if (ghostInRange.length > 0) {
      lines.push(`### Aktywacje protokołu (${ghostInRange.length})`)
      lines.push(``)
      for (const e of ghostInRange) {
        const dt = new Date(e.timestamp)
        const date = dateKey(dt)
        const time = dt.toTimeString().slice(0, 5)
        const cat = GHOST_CATEGORIES.find(c => c.id === e.category)
        const intLabel = INTENSITY_LABELS[e.intensity]?.name ?? `${e.intensity}/5`
        const contact = e.hadContact ? '⚠️ doszło do kontaktu' : '✓ wytrzymała'
        lines.push(`**${date} ${time}** · ${cat?.label ?? e.category} · "${e.subcategory}" · ${intLabel} · ${contact}`)
        if (e.outcome) {
          const o: Record<string, string> = { better: 'lepiej po', same: 'tak samo po', worse: 'gorzej po' }
          lines.push(`_Wynik: ${o[e.outcome] ?? e.outcome}_`)
        }
        lines.push(``)
      }
    }

    if (failuresInRange.length > 0) {
      lines.push(`### Uczciwe porażki (${failuresInRange.length})`)
      lines.push(``)
      for (const e of failuresInRange) {
        const date = dateKey(new Date(e.timestamp))
        const cat = GHOST_CATEGORIES.find(c => c.id === e.category)
        lines.push(`**${date}** · ${cat?.label ?? e.category} · "${e.subcategory}"`)
        if (e.whatWouldHaveStoppedYou) lines.push(`- Co by zatrzymało: ${e.whatWouldHaveStoppedYou}`)
        if (e.howYouFeelNow) lines.push(`- Jak się czuję: ${e.howYouFeelNow}`)
        if (e.planForNextTime) lines.push(`- Plan na następny raz: ${e.planForNextTime}`)
        lines.push(``)
      }
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── CYKL ──────────────────────────────────────────────────────
  interface CycleLog { startDate: string }
  const cycleInRange = cycleSnap.docs
    .map(d => d.data() as CycleLog)
    .filter(c => inRange(c.startDate, range.from, range.to))

  if (cycleInRange.length > 0) {
    lines.push(`## Dane cyklu (starty)`)
    lines.push(``)
    cycleInRange.forEach(c => lines.push(`- ${c.startDate}`))
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  // ── ZDJĘCIA (metadane) ────────────────────────────────────────
  interface PhotoMeta { id: string; dateKey: string; dayOfProject: number; caption?: string }
  const photosInRange = photosSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as PhotoMeta))
    .filter(p => inRange(p.dateKey, range.from, range.to))

  if (photosInRange.length > 0) {
    lines.push(`## Zdjęcia — ${photosInRange.length} w wybranym okresie`)
    lines.push(``)
    for (const p of photosInRange) lines.push(`- **${p.dateKey}** · Dzień ${p.dayOfProject}${p.caption ? ` · "${p.caption}"` : ''}`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  // ── PRZEGLĄDY MIESIĘCZNE ──────────────────────────────────────
  const monthlyDocs = monthlySnap.docs
    .map(d => d.data() as MonthlyReview)
    .filter(r => inRange(r.month, range.from, range.to))

  if (monthlyDocs.length > 0) {
    lines.push(`## Przeglądy miesięczne`)
    lines.push(``)
    for (const r of monthlyDocs) {
      lines.push(`### Miesiąc: ${r.month}`)
      lines.push(``)
      if (r.highlights) { lines.push(`**Highlights:**`); lines.push(``); lines.push(r.highlights); lines.push(``) }
      if (r.challenges) { lines.push(`**Wyzwania:**`); lines.push(``); lines.push(r.challenges); lines.push(``) }
      const pr = Object.entries(r.pillarsRated ?? {}).map(([p, v]) => `${pillarName(p)}: ${v}/10`).join(' · ')
      if (pr) lines.push(`**Oceny filarów:** ${pr}`)
      if (r.intentionNextMonth) { lines.push(``); lines.push(`**Intencja na następny miesiąc:**`); lines.push(``); lines.push(r.intentionNextMonth) }
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
      if (r.highlights) { lines.push(`**Co poszło dobrze:**`); lines.push(``); lines.push(r.highlights); lines.push(``) }
      if (r.challenges) { lines.push(`**Wyzwania:**`); lines.push(``); lines.push(r.challenges); lines.push(``) }
      const pr = Object.entries(r.pillarsRated ?? {}).map(([p, v]) => `${pillarName(p)}: ${v}/10`).join(' · ')
      if (pr) lines.push(`**Oceny filarów:** ${pr}`)
      if (r.nextWeekFocus) { lines.push(``); lines.push(`**Focus na przyszły tydzień:** ${r.nextWeekFocus}`) }
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── DZIENNIK DZIENNY ──────────────────────────────────────────
  const logDocs = logsSnap.docs
    .map(d => d.data() as DailyLog & { pillarXP?: Record<string, number> })
    .filter(d => inRange(d.date, range.from, range.to))

  if (logDocs.length > 0) {
    lines.push(`## Dziennik dzienny (${logDocs.length} dni)`)
    lines.push(``)

    for (const d of logDocs) {
      const modeLabel = d.dayMode === 'minimum' ? ' — TRYB MINIMUM' : ''
      lines.push(`### ${d.date}${modeLabel}`)
      lines.push(``)

      // Metryki nagłówkowe
      const meta = [
        `XP: **${d.totalXP ?? 0}**`,
        `Rutyna: ${d.completedRoutine?.length ?? 0} elem.`,
        `Zasady: ${d.keptRules?.length ?? 0}/3`,
        `Aktywność fizyczna: ${d.physicalActivity ? 'tak' : 'nie'}`,
        `Obecność społeczna: ${d.socialPresence ? 'tak' : 'nie'}`,
        `Ghost Protocol: ${d.ghostProtocolCompleted ? 'tak' : 'nie'}`,
      ]
      lines.push(meta.join(' · '))
      lines.push(``)

      // XP per filar tego dnia
      if (d.pillarXP) {
        const pp = Object.entries(d.pillarXP).filter(([, v]) => v > 0).map(([k, v]) => `${pillarName(k)}: ${v}`)
        if (pp.length > 0) { lines.push(`_XP per filar: ${pp.join(' · ')}_`); lines.push(``) }
      }

      // XP z zewnętrznych aplikacji (Learning Vault)
      if (d.externalXP) {
        const ext = Object.entries(d.externalXP).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => `${pillarName(k)}: ${v}`)
        if (ext.length > 0) { lines.push(`_XP z Learning Vault: ${ext.join(' · ')}_`); lines.push(``) }
      }

      // Rutyna — pełne nazwy
      const routineNames = (d.completedRoutine ?? []).map((id: string) => routineMap.get(id) ?? id).filter(Boolean)
      if (routineNames.length > 0) { lines.push(`**Rutyna:** ${routineNames.join(', ')}`); lines.push(``) }

      // Zasady
      if ((d.keptRules?.length ?? 0) > 0) {
        const kept = DAILY_RULES.filter(r => d.keptRules.includes(r.id)).map(r => r.text)
        if (kept.length > 0) { lines.push(`**Zasady:** ${kept.join(' · ')}`); lines.push(``) }
      }

      // Questy dzienne — tytuły
      if ((d.completedDailyQuests?.length ?? 0) > 0) {
        const titles = d.completedDailyQuests!.map((qId: string) => {
          const aprilQ = APRIL_QUESTS.find(q => q.id === qId)
          if (aprilQ) return `${aprilQ.title} [${(PL_MONTHS[aprilQ.date.slice(5, 7)] ?? '').toLowerCase()}]`
          return findQuestTitle(qId, d.date)
        })
        lines.push(`**Questy dzienne:** ${titles.join(', ')}`)
        lines.push(``)
      }

      // Side questy — tytuły + filar + XP
      const allSQ: string[] = []
      for (const qId of d.completedSideQuests ?? []) {
        const q = SIDE_QUESTS.find(sq => sq.id === qId)
        if (q) allSQ.push(`${q.title} [${pillarName(q.pillar)}, +${q.xp} XP]`)
        else allSQ.push(qId)
      }
      for (const cq of d.customSideQuests ?? []) {
        allSQ.push(`${cq.title} [własny, ${pillarName(cq.pillar)}, +${cq.xp} XP]`)
      }
      if (allSQ.length > 0) { lines.push(`**Side questy:** ${allSQ.join(' · ')}`); lines.push(``) }

      // Nastrój — szczegóły
      if ((d.moodCheckIns?.length ?? 0) > 0) {
        const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
        const energies = d.moodCheckIns!.map(m => m.energy)
        const moods = d.moodCheckIns!.map(m => m.mood)
        const stateMap: Record<string, string> = { calm: 'spokój', storm: 'burza', fog: 'mgła', clarity: 'klarowność' }
        const stateSet = new Set(d.moodCheckIns!.map(m => m.state))
        const stateLabels = Array.from(stateSet).map(s => stateMap[s] ?? s).join(', ')
        lines.push(`**Nastrój:** energia śr. ${avg(energies)}/5 · emocje śr. ${avg(moods)}/5 · ${stateLabels} (${d.moodCheckIns!.length} check-in${d.moodCheckIns!.length > 1 ? 'y' : ''})`)
        lines.push(``)
      }

      // Papierosy tego dnia
      if ((d.cigarettes?.length ?? 0) > 0) {
        const cs = d.cigarettes!
        const m = new Map<string, number>()
        for (const c of cs) m.set(c.context ?? 'inne', (m.get(c.context ?? 'inne') ?? 0) + 1)
        const ctxStr = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${cigCtxLabel(k)} ×${n}`).join(', ')
        const hours = cs.map(c => c.hour).sort((a, b) => a - b).join(', ')
        lines.push(`**Papierosy:** ${cs.length} · ${ctxStr}`)
        if (hours) lines.push(`_Godziny: ${hours}_`)
        lines.push(``)
      }

      // Kluczowy moment
      if (d.keyMoment) {
        lines.push(`**Kluczowy moment:** ${d.keyMoment.title}`)
        if (d.keyMoment.note) { lines.push(``); lines.push(`> ${d.keyMoment.note}`) }
        lines.push(``)
      }

      // Notatka dzienna
      if (d.notes?.trim()) {
        lines.push(`**Notatka:**`)
        lines.push(``)
        lines.push(d.notes.trim())
        lines.push(``)
      }

      // Ghost Protocol tego konkretnego dnia
      const dayGhost = ghostEntries.filter(e => dateKey(new Date(e.timestamp)) === d.date)
      if (dayGhost.length > 0) {
        lines.push(`**Ghost Protocol tego dnia (${dayGhost.length}x):**`)
        for (const e of dayGhost) {
          const time = new Date(e.timestamp).toTimeString().slice(0, 5)
          const cat = GHOST_CATEGORIES.find(c => c.id === e.category)
          const intLabel = INTENSITY_LABELS[e.intensity]?.name ?? `${e.intensity}/5`
          lines.push(`- ${time} · ${cat?.label ?? e.category}: "${e.subcategory}" · ${intLabel} · ${e.hadContact ? '⚠️ kontakt' : '✓ wytrzymała'}`)
        }
        lines.push(``)
      }

      lines.push(``)
    }
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
