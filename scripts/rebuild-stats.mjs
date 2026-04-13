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

  // Oblicz sumy
  let totalXP = 0
  let totalRoutinesCompleted = 0
  let totalQuestsCompleted = 0
  let totalSideQuestsCompleted = 0
  let totalRulesKept = 0
  const pillarXP = { pozycja: 0, cialo: 0, styl: 0, kapital: 0, kariera: 0, tozsamosc: 0, milosc: 0 }

  for (const log of logs) {
    totalXP += log.totalXP || 0
    totalRoutinesCompleted += (log.completedRoutine || []).length
    totalQuestsCompleted += (log.completedDailyQuests || []).length
    totalSideQuestsCompleted += (log.completedSideQuests || []).length
    totalRulesKept += (log.keptRules || []).length
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

  const stats = {
    totalXP,
    currentStreak,
    longestStreak,
    totalDaysLogged: logs.filter(l => l.totalXP > 0).length,
    totalRoutinesCompleted,
    totalQuestsCompleted,
    totalSideQuestsCompleted,
    totalRulesKept,
    pillarXP,
    unlockedAchievements: [],
    lastStreakDate: lastDate,
    reviewedWeeks: [],
    reviewedMonths: [],
    pillarBalanceWeeks: [],
  }

  console.log('\nOdbudowane statystyki:')
  console.log(`  XP łącznie: ${totalXP}`)
  console.log(`  Seria: ${currentStreak} (najlepsza: ${longestStreak})`)
  console.log(`  Dni z aktywnością: ${stats.totalDaysLogged}`)
  console.log(`  Rutyny: ${totalRoutinesCompleted}, Questy: ${totalQuestsCompleted}, Side questy: ${totalSideQuestsCompleted}`)

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
