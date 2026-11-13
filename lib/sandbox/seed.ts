// SANDBOX — przykładowe dane dla `npm run dev:sandbox`.
// Zmyślone, ale w kształcie prawdziwych: ~220 dni logów od startu projektu,
// questy, nastroje, papierosy, cykl, przeglądy, listy w Skarbcu. Losowanie ma
// stałe ziarno, więc po każdym odświeżeniu strony stan jest taki sam (a wszystko,
// co klikniesz, znika z odświeżeniem — pamięć jest tylko w karcie przeglądarki).
// Do bundla trafia wyłącznie w trybie sandbox (patrz lib/firebase.ts).

import { doc, setDoc, type Firestore } from 'firebase/firestore'
import * as paths from '../paths'
import {
  PROJECT_START, XP_VALUES, dateKey, todayKey, getISOWeekKey,
} from '../gameLogic'
import {
  MORNING_ROUTINE, EVENING_ROUTINE, DAILY_HABITS, MORNING_MINIMUM, EVENING_MINIMUM,
  getTodayWeeklyHabits,
} from '../routineData'
import { createQuestBook } from '../seasonal/aprilData'
import type { MonthPlan } from '../seasonal/monthPlans'
import { SIDE_QUESTS } from '../questData'
import { ACHIEVEMENTS } from '../achievements'
import { ceilingFor, smokeCeilingXP, SMOKE_TRACKING_START } from '../smokeStats'
import { seededRandom } from '../rewards'
import type {
  DailyLog, UserStats, Pillar, MoodState, CigaretteContext, CigaretteEntry, MinimumDayReason,
} from '@/types'

export const SANDBOX_UID = 'sandbox'

const PILLARS: Pillar[] = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc']
const MOODS: MoodState[] = ['calm', 'storm', 'fog', 'clarity']
const CONTEXTS: CigaretteContext[] = ['kawa', 'posilek', 'stres', 'nuda', 'wieczor_z_kims', 'samochod', 'inne']
const REASONS: MinimumDayReason[] = ['choroba', 'okres', 'zly_nastroj', 'przemeczenie']
const KEY_MOMENTS = [
  'Pierwsza rozmowa, w której nie przeprosiłam za to, że jestem',
  'Powiedziałam „nie" bez tłumaczenia się',
  'Pierwszy dzień w nowej pracy',
  'Wieczór tylko dla siebie — bez telefonu',
  'Odłożyłam 10% wypłaty, zanim cokolwiek wydałam',
  'Pobiegłam 5 km bez zatrzymywania',
]

const rnd = (seed: string) => seededRandom(`sandbox|${seed}`)
const pick = <T,>(arr: T[], seed: string): T => arr[Math.floor(rnd(seed) * arr.length)]

function shift(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + days))
}
function toDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Plan listopada z „apki" (/plan) — miesiąc bez pliku w lib/seasonal.
function novemberPlan(today: string): MonthPlan {
  const month = today.slice(0, 7)
  let n = 0
  const q = (day: number, title: string, description: string, pillar: Pillar, xp: number) => ({
    id: `mp_${month}-${String(day).padStart(2, '0')}_demo${n++}`,
    date: `${month}-${String(day).padStart(2, '0')}`,
    title, description, pillar, xp,
  })
  const todayDay = Number(today.slice(8))
  return {
    monthKey: month,
    name: 'KORZENIE',
    motto: 'Nie muszę rosnąć szybciej. Wystarczy, że rosnę głębiej.',
    question: 'Co w tym miesiącu ma dostać ode mnie spokój zamiast pośpiechu?',
    quests: [
      q(Math.max(1, todayDay - 2), 'Trzy rzeczy, które już umiem', 'Zapisz trzy umiejętności, których rok temu nie miałaś.', 'tozsamosc', 60),
      q(Math.max(1, todayDay - 1), 'Spacer bez słuchawek', '20 minut, sama ze sobą. Bez podcastu, bez telefonu w ręce.', 'cialo', 50),
      q(todayDay, 'Jeden mail, który odkładasz', 'Napisz i wyślij. Nie musi być idealny — ma być wysłany.', 'kariera', 70),
      q(todayDay, 'Przegląd subskrypcji', 'Otwórz wyciąg i anuluj jedną rzecz, z której nie korzystasz.', 'kapital', 60),
      q(Math.min(28, todayDay + 1), 'Kolacja przy stole', 'Nakryj dla siebie tak, jak nakryłabyś dla gościa.', 'styl', 50),
      q(Math.min(28, todayDay + 3), 'List do Skarbca', 'Napisz do siebie z kwietnia 2027 — pięć zdań wystarczy.', 'pozycja', 80),
    ],
    updatedAt: new Date().toISOString(),
  }
}

export function seedSandbox(db: Firestore) {
  const uid = SANDBOX_UID
  const today = todayKey()
  const plan = novemberPlan(today)
  const book = createQuestBook([plan])
  const write = (path: string[], data: object) => {
    setDoc(doc(db, path[0], ...path.slice(1)), data).catch(e => console.warn('[sandbox] seed', path.join('/'), e))
  }

  const startKey = dateKey(PROJECT_START)
  const completedQuests: string[] = []
  const pillarXP = Object.fromEntries(PILLARS.map(p => [p, 0])) as Record<Pillar, number>
  const logs: Record<string, DailyLog> = {}
  let totals = { xp: 0, routines: 0, quests: 0, side: 0, rules: 0, moods: 0, smokeXP: 0, highest: 0 }

  for (let key = startKey; key < today; key = shift(key, 1)) {
    const daysToToday = Math.round((toDate(today).getTime() - toDate(key).getTime()) / 86400000)
    // Ostatnie 12 dni bez przerw (żywa seria), wcześniej ~12% dni pustych.
    if (daysToToday > 12 && rnd(`skip|${key}`) < 0.12) continue

    const date = toDate(key)
    const isMinimum = daysToToday > 3 && rnd(`min|${key}`) < 0.07
    const mult = isMinimum ? 2 : 1
    // Lekki trend w górę: z czasem rutyna wchodzi w krew.
    const dayIdx = Math.round((date.getTime() - PROJECT_START.getTime()) / 86400000)
    const form = 0.62 + Math.min(0.22, dayIdx / 900) + (rnd(`form|${key}`) - 0.5) * 0.3

    const morning = isMinimum ? MORNING_MINIMUM : MORNING_ROUTINE
    const evening = isMinimum ? EVENING_MINIMUM : EVENING_ROUTINE
    const daily = isMinimum ? [] : [...DAILY_HABITS, ...getTodayWeeklyHabits(date)]
    const completedRoutine = [
      ...morning.filter(i => rnd(`m|${key}|${i.id}`) < form + 0.12),
      ...daily.filter(i => rnd(`d|${key}|${i.id}`) < form - 0.1),
      ...evening.filter(i => rnd(`e|${key}|${i.id}`) < form),
    ]
    let xp = completedRoutine.reduce((s, i) => s + i.xp * mult, 0)

    const completedDailyQuests: string[] = []
    for (const quest of book.questsForDate(key)) {
      if (rnd(`q|${key}|${quest.id}`) < form - 0.02) {
        completedDailyQuests.push(quest.id)
        completedQuests.push(quest.id)
        xp += quest.xp * mult
        pillarXP[quest.pillar] += quest.xp * mult
      }
    }

    const completedSideQuests: string[] = []
    if (!isMinimum && rnd(`side|${key}`) < 0.11) {
      const sq = pick(SIDE_QUESTS, `sidepick|${key}`)
      completedSideQuests.push(sq.id)
      xp += sq.xp
      pillarXP[sq.pillar] += sq.xp
    }

    const keptRules = ['r1', 'r2', 'r3'].filter(r => rnd(`rule|${key}|${r}`) < form - 0.05)
    xp += keptRules.length * XP_VALUES.rulekept * mult

    const moodCheckIns = [8, 20]
      .filter(h => rnd(`moodon|${key}|${h}`) < 0.72)
      .map(h => {
        const base = isMinimum ? 2 : 3 + (rnd(`moodbase|${key}`) - 0.4) * 2.2
        const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)))
        return {
          energy: clamp(base + (rnd(`en|${key}|${h}`) - 0.5) * 2 - (h === 20 ? 0.4 : 0)),
          mood: clamp(base + (rnd(`mo|${key}|${h}`) - 0.5) * 2 + (h === 20 ? 0.3 : 0)),
          state: pick(MOODS, `state|${key}|${h}`),
          timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 30).getTime(),
        }
      })

    const log: DailyLog = {
      date: key,
      completedRoutine: completedRoutine.map(i => i.id),
      completedDailyQuests,
      completedSideQuests,
      keptRules,
      totalXP: xp,
      dayMode: isMinimum ? 'minimum' : 'normal',
      ...(isMinimum ? { minimumReason: pick(REASONS, `reason|${key}`) } : {}),
      ...(moodCheckIns.length ? { moodCheckIns } : {}),
      ...(rnd(`act|${key}`) < 0.42 ? { physicalActivity: true } : {}),
      ...(rnd(`soc|${key}`) < 0.3 ? { socialPresence: true } : {}),
      ...(rnd(`km|${key}`) < 0.035 ? { keyMoment: { title: pick(KEY_MOMENTS, `kmt|${key}`), savedAt: date.getTime() } } : {}),
    }

    // Papierosy: od 18.05 obserwacja ~14/dzień, od lipca schodzenie pod sufit.
    if (key >= SMOKE_TRACKING_START) {
      const ceiling = ceilingFor(key)?.ceiling ?? 14
      const count = Math.max(0, Math.round(ceiling - 1.2 + (rnd(`cig|${key}`) - 0.45) * 5))
      const cigarettes: CigaretteEntry[] = Array.from({ length: count }, (_, i) => {
        const hour = Math.min(23, 7 + Math.floor((i / Math.max(1, count)) * 15 + rnd(`cigh|${key}|${i}`) * 2))
        const ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, Math.floor(rnd(`cigm|${key}|${i}`) * 59)).getTime()
        return {
          timestamp: ts + i,
          hour,
          weekday: (date.getDay() + 6) % 7,
          ...(rnd(`cigc|${key}|${i}`) < 0.8 ? { context: pick(CONTEXTS, `cigctx|${key}|${i}`) } : {}),
        }
      })
      if (cigarettes.length) log.cigarettes = cigarettes
      if (key >= '2026-10-01' && rnd(`decl|${key}`) < 0.75) {
        log.smokeLastOfDayAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 22, 40).getTime()
        const sx = smokeCeilingXP(key, count)
        if (sx > 0) { log.smokeCeilingXP = sx; totals.smokeXP += sx; pillarXP.cialo += sx }
      }
    }

    logs[key] = log
    totals = {
      ...totals,
      xp: totals.xp + xp,
      routines: totals.routines + completedRoutine.length,
      quests: totals.quests + completedDailyQuests.length,
      side: totals.side + completedSideQuests.length,
      rules: totals.rules + keptRules.length,
      moods: totals.moods + moodCheckIns.length,
      highest: Math.max(totals.highest, xp),
    }
  }

  // Dziś: poranek w połowie, pieczęć jeszcze niezłamana.
  const todayDone = ['m2', 'm3', 'm8']
  logs[today] = {
    date: today, completedRoutine: todayDone, completedDailyQuests: [], completedSideQuests: [],
    keptRules: [], totalXP: todayDone.length * 10, dayMode: 'normal',
  }
  totals.xp += todayDone.length * 10
  totals.routines += todayDone.length

  for (const [key, log] of Object.entries(logs)) write(paths.logDoc(uid, key), log)

  // ── Seria i statystyki ────────────────────────────────────────────
  const keys = Object.keys(logs).sort()
  let longest = 0, run = 0, prev: string | null = null
  for (const k of keys) {
    run = prev && shift(prev, 1) === k ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = k
  }

  const mondays: string[] = []
  for (let key = startKey; key < shift(today, -7); key = shift(key, 1)) {
    if (toDate(key).getDay() === 1 && rnd(`wr|${key}`) < 0.8) mondays.push(key)
  }
  const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'].filter(m => m < today.slice(0, 7))
  const quarters = ['Q1', 'Q2']

  const base: UserStats = {
    totalXP: totals.xp + totals.moods * XP_VALUES.moodCheckIn + totals.smokeXP
      + mondays.length * XP_VALUES.weeklyReview + months.length * XP_VALUES.monthlyReview
      + quarters.length * XP_VALUES.quarterlyReview,
    currentStreak: run,
    longestStreak: longest,
    totalDaysLogged: keys.length,
    totalRoutinesCompleted: totals.routines,
    totalQuestsCompleted: totals.quests,
    totalSideQuestsCompleted: totals.side,
    totalRulesKept: totals.rules,
    pillarXP,
    unlockedAchievements: [],
    lastStreakDate: today,
    streakFreezeUsedMonths: ['2026-06', '2026-09'],
    reviewedWeeks: mondays,
    reviewedMonths: months,
    reviewedQuarters: quarters,
    completedHeartBlocks: [],
    pillarBalanceWeeks: [],
    currentWeekPillars: { weekKey: getISOWeekKey(toDate(today)), pillars: ['pozycja', 'cialo', 'kariera', 'tozsamosc'] },
    totalGhostProtocols: 14,
    consecutiveGhostDays: 0,
    lastGhostDate: shift(today, -9),
    highestDayXP: totals.highest,
    consecutiveNormalDays: 4,
    lastNormalDay: today,
    consecutivePerfectMornings: 2,
    lastPerfectMorningDate: shift(today, -1),
    lastReturnCeremonyDate: null,
    smokingTrackingEnabled: true,
    cigarettesBaseline: 14,
    cigarettesPhase: 3,
    cigarettesPhaseStartDate: '2026-10-01',
    smokeEmergencyDays: [],
  }
  // Odznaki zgodne ze statystykami — inaczej pierwsze odhaczenie odpaliłoby
  // lawinę „nowe osiągnięcie!".
  const unlocked = ACHIEVEMENTS.filter(a => a.condition(base))
  const stats: UserStats = {
    ...base,
    unlockedAchievements: unlocked.map(a => a.id),
    totalXP: base.totalXP + unlocked.reduce((s, a) => s + (a.xpReward ?? 0), 0),
  }
  write(paths.dataDoc(uid, 'stats'), stats)

  // ── Questy, plan, cykl ────────────────────────────────────────────
  write(paths.dataDoc(uid, 'aprilQuestLog'), { completed: completedQuests, skips: [], postponed: [] })
  write(paths.monthPlanDoc(uid, plan.monthKey), plan)
  write(paths.dataDoc(uid, 'cycleSettings'), { cycleLength: 28, periodLength: 5 })
  for (let i = 0; i < 9; i++) {
    const startDate = shift(today, -(9 + i * 28))
    if (startDate < startKey) break
    write(paths.cycleDoc(uid, `cycle_${startDate}`), { id: `cycle_${startDate}`, startDate, savedAt: `${startDate}T08:00:00.000Z` })
  }

  // ── Przeglądy ─────────────────────────────────────────────────────
  const rating = (seed: string) => Object.fromEntries(PILLARS.map(p => [p, 2 + Math.floor(rnd(`${seed}|${p}`) * 4)]))
  for (const weekStart of mondays) {
    write(paths.reviewDoc(uid, weekStart), {
      weekStart,
      highlights: 'Trzy poranki z rzędu bez telefonu. Wysłałam ofertę, którą odkładałam.',
      challenges: 'Środa — zmęczenie i wieczór przed ekranem.',
      nextWeekFocus: 'Sen przed 23:00 i jeden side quest dla ciała.',
      pillarsRated: rating(`w|${weekStart}`),
      xpEarned: XP_VALUES.weeklyReview,
      savedAt: `${shift(weekStart, 7)}T19:00:00.000Z`,
    })
  }
  for (const month of months) {
    write(paths.monthlyReviewDoc(uid, month), {
      month,
      highlights: 'Rutyna poranna przestała być walką. Pierwszy miesiąc z budżetem.',
      challenges: 'Wieczory — dalej uciekam w telefon, gdy jestem zmęczona.',
      intentionNextMonth: 'Mniej planów, więcej domkniętych rzeczy.',
      pillarsRated: rating(`m|${month}`),
      xpEarned: XP_VALUES.monthlyReview,
      savedAt: `${month}-28T19:00:00.000Z`,
    })
  }
  for (const quarter of quarters) {
    write(paths.quarterlyReviewDoc(uid, quarter), {
      quarter,
      lessons: 'Systemy działają lepiej niż postanowienia.',
      openFronts: 'Kapitał — poduszka wciąż niepełna.',
      bridgeToNext: 'Zostawiam trzy nawyki, dokładam jeden.',
      whatChanged: 'Przestałam pytać o pozwolenie.',
      xpEarned: XP_VALUES.quarterlyReview,
      savedAt: '2026-10-02T19:00:00.000Z',
    })
  }

  // ── Skarbiec ──────────────────────────────────────────────────────
  const letters = [
    { id: 'demo_l1', letterType: 'future', unlockType: 'quarterly', title: 'Do Natalii z lipca', content: 'Jeśli to czytasz, to znaczy, że nie odpuściłaś przez pierwsze trzy miesiące. Jestem z Ciebie dumna.', dateKey: '2026-04-12', dayOfProject: 8 },
    { id: 'demo_l2', letterType: 'crisis', unlockType: 'immediate', title: 'Na trudną chwilę', content: 'To minie. Zawsze mijało. Zrób herbatę, umyj twarz, połóż się — jutro zdecydujesz.', dateKey: '2026-05-03', dayOfProject: 29 },
    { id: 'demo_l3', letterType: 'gratitude', unlockType: 'date', title: 'Wdzięczność — sierpień', content: 'Za mamę, za ciszę rano, za to, że kolano przestało boleć.', dateKey: '2026-08-14', dayOfProject: 132, unlockDate: '2026-09-13' },
    { id: 'demo_l4', letterType: 'date', unlockType: 'date', title: 'Na 30. urodziny', content: 'Otwórz 5 kwietnia. Do zobaczenia po drugiej stronie.', dateKey: '2026-09-20', dayOfProject: 169, unlockDate: '2027-04-05' },
  ]
  for (const l of letters) {
    write(paths.vaultDoc(uid, l.id), { ...l, createdAt: `${l.dateKey}T20:00:00.000Z`, charCount: l.content.length, moodAtWriting: 'calm' })
  }

  // ── Ghost Protocol ────────────────────────────────────────────────
  const ghostEntries = Array.from({ length: 14 }, (_, i) => {
    const key = shift(today, -(9 + i * 6))
    const d = toDate(key)
    const hour = 20 + Math.floor(rnd(`gh|${i}`) * 3)
    return {
      version: 2 as const,
      timestamp: new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 15).getTime(),
      hour,
      weekday: (d.getDay() + 6) % 7,
      dayMode: 'normal' as const,
      category: pick(['chce_sprawdzic', 'tesknota_hustawka', 'strach_przyszlosc', 'flashback'], `ghc|${i}`),
      subcategory: 'demo',
      intensity: 2 + Math.floor(rnd(`ghi|${i}`) * 4),
      hadContact: false,
      xpEarned: 40,
    }
  })
  write(paths.dataDoc(uid, 'ghostLogV2'), { entries: ghostEntries })
  write(paths.dataDoc(uid, 'honestFailureLog'), { entries: [] })
  write(paths.dataDoc(uid, 'appSettings'), { everCompletedSideQuests: [], hiddenSideQuests: [], customQuestIdeas: [] })
}
