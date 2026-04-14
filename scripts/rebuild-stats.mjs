/**
 * Odbudowuje dokument stats z dziennych logów.
 * Uruchom: node scripts/rebuild-stats.mjs
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, setPersistence, inMemoryPersistence } from 'firebase/auth'
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore'
import readline from 'readline'

const firebaseConfig = {
  apiKey: 'AIzaSyAR9j-VlJAVnE9lY4ntWJmsRUHK8_eWwAk',
  authDomain: 'projekt-30-82b54.firebaseapp.com',
  projectId: 'projekt-30-82b54',
  storageBucket: 'projekt-30-82b54.firebasestorage.app',
  messagingSenderId: '593186668601',
  appId: '1:593186668601:web:83912b7427434b9de54de8',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(r => rl.question(q, r))

async function main() {
  const email = await ask('Email: ')
  const password = await ask('Hasło: ')

  await setPersistence(auth, inMemoryPersistence)
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  console.log(`\nZalogowano jako: ${user.email} (${user.uid})`)

  // Wczytaj wszystkie logi
  const logsSnap = await getDocs(collection(db, 'users', user.uid, 'logs'))
  const logs = logsSnap.docs.map(d => ({ date: d.id, ...d.data() }))
  logs.sort((a, b) => a.date.localeCompare(b.date))
  console.log(`Znaleziono ${logs.length} logów: ${logs.map(l => l.date).join(', ')}`)

  // Mapa questId → { pillar, xp }
  const QUEST_MAP = {
    // Daily quests pool
    dq_1: { pillar: 'pozycja', xp: 50 }, dq_2: { pillar: 'kariera', xp: 50 },
    dq_3: { pillar: 'cialo', xp: 50 },   dq_4: { pillar: 'tozsamosc', xp: 50 },
    dq_5: { pillar: 'kapital', xp: 50 }, dq_6: { pillar: 'pozycja', xp: 50 },
    dq_7: { pillar: 'kariera', xp: 50 }, dq_8: { pillar: 'styl', xp: 50 },
    dq_9: { pillar: 'milosc', xp: 50 },  dq_10: { pillar: 'pozycja', xp: 50 },
    // April quests
    apr_05_1: { pillar: 'pozycja', xp: 100 }, apr_05_2: { pillar: 'pozycja', xp: 60 }, apr_05_3: { pillar: 'pozycja', xp: 50 },
    apr_06_1: { pillar: 'kariera', xp: 80 },  apr_06_2: { pillar: 'kariera', xp: 80 },
    apr_07_1: { pillar: 'kariera', xp: 100 }, apr_07_2: { pillar: 'kariera', xp: 80 },
    apr_08_1: { pillar: 'styl', xp: 100 },    apr_08_2: { pillar: 'styl', xp: 80 },
    apr_09_1: { pillar: 'kapital', xp: 100 },
    apr_10_1: { pillar: 'tozsamosc', xp: 100 }, apr_10_2: { pillar: 'tozsamosc', xp: 60 },
    apr_11_1: { pillar: 'kapital', xp: 120 },
    apr_12_1: { pillar: 'pozycja', xp: 100 },
    apr_13_1: { pillar: 'cialo', xp: 80 },    apr_13_2: { pillar: 'cialo', xp: 60 },
    apr_14_1: { pillar: 'kariera', xp: 100 }, apr_14_2: { pillar: 'kariera', xp: 60 },
    apr_15_1: { pillar: 'tozsamosc', xp: 120 },
    apr_16_1: { pillar: 'kapital', xp: 100 },
    apr_17_1: { pillar: 'tozsamosc', xp: 100 },
    apr_18_1: { pillar: 'kapital', xp: 120 },
    apr_19_1: { pillar: 'pozycja', xp: 100 },
    apr_20_1: { pillar: 'kariera', xp: 100 },
    apr_21_1: { pillar: 'kariera', xp: 120 },
    apr_22_1: { pillar: 'tozsamosc', xp: 100 },
    apr_23_1: { pillar: 'kapital', xp: 100 },
    apr_24_1: { pillar: 'milosc', xp: 120 },
    apr_25_1: { pillar: 'kapital', xp: 120 },
    apr_26_1: { pillar: 'pozycja', xp: 100 },
    apr_27_1: { pillar: 'kariera', xp: 100 },
    apr_28_1: { pillar: 'styl', xp: 100 },
    apr_29_1: { pillar: 'tozsamosc', xp: 80 },
    apr_30_1: { pillar: 'pozycja', xp: 200 },
    // Side quests
    sq_poz_1: { pillar: 'pozycja', xp: 120 }, sq_poz_2: { pillar: 'pozycja', xp: 150 },
    sq_poz_3: { pillar: 'pozycja', xp: 130 }, sq_poz_4: { pillar: 'pozycja', xp: 120 },
    sq_poz_5: { pillar: 'pozycja', xp: 150 },
    sq_ciao_1: { pillar: 'cialo', xp: 120 },  sq_ciao_2: { pillar: 'cialo', xp: 100 },
    sq_ciao_3: { pillar: 'cialo', xp: 100 },  sq_ciao_4: { pillar: 'cialo', xp: 130 },
    sq_ciao_5: { pillar: 'cialo', xp: 80 },
    sq_styl_1: { pillar: 'styl', xp: 150 },   sq_styl_2: { pillar: 'styl', xp: 100 },
    sq_styl_3: { pillar: 'styl', xp: 80 },    sq_styl_4: { pillar: 'styl', xp: 120 },
    sq_styl_5: { pillar: 'styl', xp: 100 },
    sq_kap_1: { pillar: 'kapital', xp: 120 }, sq_kap_2: { pillar: 'kapital', xp: 150 },
    sq_kap_3: { pillar: 'kapital', xp: 130 }, sq_kap_4: { pillar: 'kapital', xp: 100 },
    sq_kap_5: { pillar: 'kapital', xp: 120 },
    sq_kar_1: { pillar: 'kariera', xp: 150 }, sq_kar_2: { pillar: 'kariera', xp: 100 },
    sq_kar_3: { pillar: 'kariera', xp: 130 }, sq_kar_4: { pillar: 'kariera', xp: 150 },
    sq_kar_5: { pillar: 'kariera', xp: 120 },
    sq_toz_1: { pillar: 'tozsamosc', xp: 120 }, sq_toz_2: { pillar: 'tozsamosc', xp: 150 },
    sq_toz_3: { pillar: 'tozsamosc', xp: 100 }, sq_toz_4: { pillar: 'tozsamosc', xp: 100 },
    sq_toz_5: { pillar: 'tozsamosc', xp: 100 },
    sq_mil_1: { pillar: 'milosc', xp: 130 },  sq_mil_2: { pillar: 'milosc', xp: 150 },
    sq_mil_3: { pillar: 'milosc', xp: 120 },  sq_mil_4: { pillar: 'milosc', xp: 120 },
    sq_mil_5: { pillar: 'milosc', xp: 150 },
    sq_life_1: { pillar: 'cialo', xp: 280 },    sq_life_2: { pillar: 'cialo', xp: 350 },
    sq_life_3: { pillar: 'cialo', xp: 500 },    sq_life_4: { pillar: 'cialo', xp: 400 },
    sq_life_5: { pillar: 'cialo', xp: 250 },    sq_life_6: { pillar: 'cialo', xp: 200 },
    sq_life_7: { pillar: 'cialo', xp: 220 },    sq_life_8: { pillar: 'cialo', xp: 300 },
    sq_life_9: { pillar: 'tozsamosc', xp: 150 }, sq_life_10: { pillar: 'tozsamosc', xp: 250 },
    sq_life_11: { pillar: 'tozsamosc', xp: 200 }, sq_life_12: { pillar: 'tozsamosc', xp: 120 },
    sq_life_13: { pillar: 'tozsamosc', xp: 130 }, sq_life_14: { pillar: 'tozsamosc', xp: 160 },
    sq_life_15: { pillar: 'tozsamosc', xp: 150 }, sq_life_16: { pillar: 'tozsamosc', xp: 180 },
    sq_life_17: { pillar: 'tozsamosc', xp: 100 }, sq_life_18: { pillar: 'tozsamosc', xp: 300 },
    sq_life_19: { pillar: 'tozsamosc', xp: 600 },
    sq_life_20: { pillar: 'kapital', xp: 350 },  sq_life_21: { pillar: 'cialo', xp: 500 },
    sq_life_22: { pillar: 'kapital', xp: 300 },
    sq_life_23: { pillar: 'tozsamosc', xp: 180 }, sq_life_24: { pillar: 'tozsamosc', xp: 250 },
    sq_life_25: { pillar: 'pozycja', xp: 500 },
    sq_life_26: { pillar: 'kapital', xp: 200 },  sq_life_27: { pillar: 'pozycja', xp: 200 },
  }

  // Oblicz sumy
  let totalXP = 0
  let totalRoutinesCompleted = 0
  let totalQuestsCompleted = 0
  let totalSideQuestsCompleted = 0
  let totalRulesKept = 0
  const pillarXP = { pozycja: 0, cialo: 0, styl: 0, kapital: 0, kariera: 0, tozsamosc: 0, milosc: 0 }
  const unknownQuests = []

  for (const log of logs) {
    totalXP += log.totalXP || 0
    totalRoutinesCompleted += (log.completedRoutine || []).length
    totalQuestsCompleted += (log.completedDailyQuests || []).length
    totalSideQuestsCompleted += (log.completedSideQuests || []).length
    totalRulesKept += (log.keptRules || []).length

    for (const qId of [...(log.completedDailyQuests || []), ...(log.completedSideQuests || [])]) {
      const q = QUEST_MAP[qId]
      if (q) {
        pillarXP[q.pillar] = (pillarXP[q.pillar] || 0) + q.xp
      } else {
        unknownQuests.push(qId)
      }
    }
  }

  if (unknownQuests.length > 0) {
    console.log(`\nUwaga: nieznane ID questów (pominięte w pillarXP): ${[...new Set(unknownQuests)].join(', ')}`)
  }

  // Oblicz serię z dat
  let currentStreak = 0
  let longestStreak = 0
  let streak = 0
  let lastDate = null
  const today = new Date().toISOString().slice(0, 10)

  for (const log of logs) {
    if (!log.totalXP || log.totalXP === 0) { streak = 0; lastDate = null; continue }
    if (!lastDate) { streak = 1 }
    else {
      const prev = new Date(lastDate)
      prev.setDate(prev.getDate() + 1)
      const expected = prev.toISOString().slice(0, 10)
      streak = log.date === expected ? streak + 1 : 1
    }
    lastDate = log.date
    longestStreak = Math.max(longestStreak, streak)
  }
  // Sprawdź czy seria jest aktywna (ostatni log to dziś lub wczoraj)
  if (lastDate) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)
    currentStreak = (lastDate === today || lastDate === yesterdayKey) ? streak : 0
  }

  const totalDaysLogged = logs.filter(l => l.totalXP > 0).length

  // Oblicz osiągnięcia i dolicz ich XP
  const ACHIEVEMENTS = [
    { id: 'first_day',    xpReward: 100,  condition: (s) => s.totalDaysLogged >= 1 },
    { id: 'week_1',       xpReward: 200,  condition: (s) => s.currentStreak >= 7 },
    { id: 'month_1',      xpReward: 500,  condition: (s) => s.totalDaysLogged >= 30 },
    { id: 'streak_30',    xpReward: 750,  condition: (s) => s.currentStreak >= 30 },
    { id: 'streak_100',   xpReward: 2000, condition: (s) => s.currentStreak >= 100 },
    { id: 'no_impulse_7', xpReward: 300,  condition: (s) => s.totalRulesKept >= 21 },
    { id: 'quests_10',    xpReward: 200,  condition: (s) => s.totalQuestsCompleted >= 10 },
    { id: 'quests_50',    xpReward: 800,  condition: (s) => s.totalQuestsCompleted >= 50 },
    { id: 'side_quest_5', xpReward: 300,  condition: (s) => s.totalSideQuestsCompleted >= 5 },
    { id: 'side_quest_20',xpReward: 800,  condition: (s) => s.totalSideQuestsCompleted >= 20 },
    { id: 'all_pillars',  xpReward: 500,  condition: (s) => Object.values(s.pillarXP).every(xp => xp > 0) },
    { id: 'routines_100', xpReward: 500,  condition: (s) => s.totalRoutinesCompleted >= 100 },
    // level-based: only after adding achievement XP, so skipped here (would need iterating)
  ]

  const baseStats = { totalXP, totalDaysLogged, currentStreak, longestStreak, totalRoutinesCompleted, totalQuestsCompleted, totalSideQuestsCompleted, totalRulesKept, pillarXP }
  const unlockedAchievements = []
  let achievementXP = 0
  for (const ach of ACHIEVEMENTS) {
    if (ach.condition(baseStats)) {
      unlockedAchievements.push(ach.id)
      achievementXP += ach.xpReward
    }
  }
  const finalXP = totalXP + achievementXP

  const stats = {
    totalXP: finalXP,
    currentStreak,
    longestStreak,
    totalDaysLogged,
    totalRoutinesCompleted,
    totalQuestsCompleted,
    totalSideQuestsCompleted,
    totalRulesKept,
    pillarXP,
    unlockedAchievements,
    lastStreakDate: lastDate,
    reviewedWeeks: [],
    reviewedMonths: [],
    pillarBalanceWeeks: [],
  }

  console.log('\nOdbudowane statystyki:')
  console.log(`  XP z aktywności: ${totalXP}`)
  console.log(`  XP z osiągnięć: +${achievementXP} (${unlockedAchievements.join(', ')})`)
  console.log(`  XP łącznie: ${finalXP}`)
  console.log(`  Seria: ${currentStreak} (najlepsza: ${longestStreak})`)
  console.log(`  Dni z aktywnością: ${totalDaysLogged}`)
  console.log(`  Rutyny: ${totalRoutinesCompleted}, Questy: ${totalQuestsCompleted}, Side questy: ${totalSideQuestsCompleted}`)
  console.log(`  XP per filar:`)
  for (const [pillar, xp] of Object.entries(pillarXP)) {
    if (xp > 0) console.log(`    ${pillar}: ${xp}`)
  }

  const confirm = await ask('\nZapisać do Firebase? (tak/nie): ')
  if (confirm.trim().toLowerCase() === 'tak') {
    await setDoc(doc(db, 'users', user.uid, 'data', 'stats'), stats)
    console.log('✓ Statystyki zapisane!')
  } else {
    console.log('Anulowano.')
  }

  rl.close()
  process.exit(0)
}

main().catch(err => { console.error(err); rl.close(); process.exit(1) })
