/**
 * Pełny backup danych użytkownika z Firestore do lokalnego JSON-a.
 * Uruchom: npm run backup
 *
 * Output: ./backups/projekt30-YYYY-MM-DD.json
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, setPersistence, inMemoryPersistence } from 'firebase/auth'
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import readline from 'node:readline'

const firebaseConfig = {
  apiKey: 'AIzaSyAR9j-VlJAVnE9lY4ntWJmsRUHK8_eWwAk',
  authDomain: 'projekt-30-82b54.firebaseapp.com',
  projectId: 'projekt-30-82b54',
  storageBucket: 'projekt-30-82b54.firebasestorage.app',
  messagingSenderId: '593186668601',
  appId: '1:593186668601:web:83912b7427434b9de54de8',
}

// Subcollections do zrzutu (każdy dokument całościowo).
const SUBCOLLECTIONS = [
  'logs',
  'vault',
  'photos',
  'reviews',
  'monthlyReviews',
  'cycle',
  'heartBlocks',
]

// Pojedyncze dokumenty pod 'data' i 'config' (znane klucze).
const DATA_DOCS = [
  'stats',
  'appSettings',
  'cycleSettings',
  'ghostLog',
  'ghostLogV2',
  'honestFailureLog',
  'sparkSchedule',
  'aprilQuestLog',
  'annualReflection',
]
const CONFIG_DOCS = ['routines']

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Tryb nieinteraktywny (CI): jeśli BACKUP_EMAIL i BACKUP_PASSWORD są w env,
// użyj ich i pomiń pytania. Inaczej — pytaj interaktywnie (uruchomienie lokalne).
const envEmail = process.env.BACKUP_EMAIL
const envPassword = process.env.BACKUP_PASSWORD
const nonInteractive = Boolean(envEmail && envPassword)

const rl = nonInteractive
  ? null
  : readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(r => rl.question(q, r))

async function main() {
  const email = nonInteractive ? envEmail : await ask('Email: ')
  const password = nonInteractive ? envPassword : await ask('Hasło: ')

  await setPersistence(auth, inMemoryPersistence)
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  console.log(`\nZalogowano jako: ${user.email} (${user.uid})\n`)

  const dump = { exportedAt: new Date().toISOString(), uid: user.uid, email: user.email }

  for (const col of SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', user.uid, col))
    dump[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    console.log(`  ${col}: ${snap.size} dok.`)
  }

  dump.data = {}
  for (const docName of DATA_DOCS) {
    const snap = await getDoc(doc(db, 'users', user.uid, 'data', docName))
    if (snap.exists()) dump.data[docName] = snap.data()
  }
  console.log(`  data/: ${Object.keys(dump.data).length} dok.`)

  dump.config = {}
  for (const docName of CONFIG_DOCS) {
    const snap = await getDoc(doc(db, 'users', user.uid, 'config', docName))
    if (snap.exists()) dump.config[docName] = snap.data()
  }
  console.log(`  config/: ${Object.keys(dump.config).length} dok.`)

  if (!existsSync('./backups')) mkdirSync('./backups')
  const date = new Date().toISOString().split('T')[0]
  const path = `./backups/projekt30-${date}.json`
  writeFileSync(path, JSON.stringify(dump, null, 2))

  const sizeKB = (JSON.stringify(dump).length / 1024).toFixed(1)
  console.log(`\n✓ Backup zapisany: ${path} (${sizeKB} kB)`)

  rl?.close()
  process.exit(0)
}

main().catch(err => {
  console.error('\n✗ Backup nieudany:', err.message)
  rl?.close()
  process.exit(1)
})
