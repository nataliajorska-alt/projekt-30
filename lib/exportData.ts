import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyLog, WeeklyReview, MonthlyReview, UserStats } from '@/types'
import { SIDE_QUESTS, getDailyQuests } from '@/lib/questData'
import { DAILY_RULES } from '@/lib/routineData'
import { APRIL_QUESTS } from '@/lib/seasonal/aprilData'

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
  const [
    logsSnap, weeklySnap, monthlySnap, statsSnap,
    ghostV2Snap, honestFailureSnap, vaultSnap, photosSnap,
    cycleSnap, aprilQuestSnap,
  ] = await Promise.all([
    getDocs(query(collection(db, 'users', uid, 'logs'), orderBy('date', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'weeklyReviews'), orderBy('weekStart', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'monthlyReviews'), orderBy('month', 'asc'))),
    getDoc(doc(db, 'users', uid, 'data', 'stats')),
    getDoc(doc(db, 'users', uid, 'data', 'ghostLogV2')),
    getDoc(doc(db, 'users', uid, 'data', 'honestFailureLog')),
    getDocs(query(collection(db, 'users', uid, 'vault'), orderBy('createdAt', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'photos'), orderBy('dateKey', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'cycle'), orderBy('startDate', 'asc'))),
    getDoc(doc(db, 'users', uid, 'data', 'aprilQuestLog')),
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
  const today = new Date().toISOString().slice(0, 10)
  const suffix = range.from ? `${range.from}_${range.to ?? today}` : today

  const ghostEntries: any[] = ghostV2Snap.exists() ? (ghostV2Snap.data().entries ?? []) : []
  const honestFailures: any[] = honestFailureSnap.exists() ? (honestFailureSnap.data().entries ?? []) : []
  const aprilLog = aprilQuestSnap.exists() ? aprilQuestSnap.data() : { completed: [] }
  const aprilCompleted: string[] = aprilLog.completed ?? []

  const tsInRange = (timestamp: number) =>
    inRange(new Date(timestamp).toISOString().slice(0, 10), range.from, range.to)

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

  // ── QUESTY MIESIĘCZNE (kwiecień) ─────────────────────────────
  const aprilInRange = APRIL_QUESTS.filter(q => aprilCompleted.includes(q.id) && inRange(q.date, range.from, range.to))
  if (aprilInRange.length > 0) {
    lines.push(`## Questy miesięczne — Kwiecień 2026 "Przejęcie steru"`)
    lines.push(``)
    lines.push(`_Motto: W kwietniu nie proszę świata o miejsce. Zaczynam stawać się kobietą, której miejsce się robi._`)
    lines.push(``)
    for (const q of aprilInRange) {
      lines.push(`- **${q.date}** · ${q.title} · ${pillarName(q.pillar)} · +${q.xp} XP`)
      if (q.description) lines.push(`  > ${q.description}`)
    }
    lines.push(``)
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
        const date = dt.toISOString().slice(0, 10)
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
        const date = new Date(e.timestamp).toISOString().slice(0, 10)
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
          if (aprilQ) return `${aprilQ.title} [kwiecień]`
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
      const dayGhost = ghostEntries.filter(e => new Date(e.timestamp).toISOString().slice(0, 10) === d.date)
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
