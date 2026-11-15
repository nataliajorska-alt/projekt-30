import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  disableNetwork,
  type Firestore,
} from 'firebase/firestore'

// Tryb SANDBOX (`npm run dev:sandbox`): apka chodzi na zmyślonym projekcie
// Firebase, bez sieci i bez logowania, na przykładowych danych z lib/sandbox/seed.
// Do oglądania i testowania zmian bez dotykania prawdziwego konta. Zmienna jest
// wstawiana przy budowaniu, więc w produkcji cała gałąź znika z bundla.
export const IS_SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === '1'

const firebaseConfig = IS_SANDBOX
  ? {
      // Celowo NIE czytamy .env — sandbox nie może trafić w prawdziwy projekt.
      apiKey: 'sandbox-api-key',
      authDomain: 'sandbox.invalid',
      projectId: 'demo-projekt30-sandbox',
      storageBucket: 'sandbox.invalid',
      messagingSenderId: '0',
      appId: '1:0:web:sandbox',
    }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

// Walidacja — wykryj brakujące zmienne środowiskowe zamiast cicho failować
const missingVars = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missingVars.length > 0) {
  console.error(
    `[Firebase] Brakuje zmiennych środowiskowych: ${missingVars.join(', ')}. ` +
    'Sprawdź .env.local lub konfigurację Vercel.'
  )
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// ── Firestore ──────────────────────────────────────────────────────────
// • ignoreUndefinedProperties — pole o wartości `undefined` jest pomijane przy
//   zapisie zamiast wywracać cały setDoc („Unsupported field value: undefined").
//   Ta klasa błędu wracała kilka razy (notatka kluczowego momentu, powrót
//   z trybu minimum, reset rutyny, pomysł na quest bez opisu).
// • persistentLocalCache — dane leżą też w IndexedDB na urządzeniu. Apka otwarta
//   bez zasięgu pokazuje ostatni znany stan zamiast pustego dnia, a odhaczenia
//   zrobione offline przeżywają zamknięcie apki i dosyłają się po powrocie sieci.
//   Gdy IndexedDB jest niedostępne (tryb prywatny), SDK samo wraca do pamięci.
// initializeFirestore wolno zawołać raz — przy HMR moduł ładuje się ponownie,
// więc drugi raz bierzemy już istniejącą instancję.
function createDb(): Firestore {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: typeof window === 'undefined' || IS_SANDBOX
        ? memoryLocalCache()
        : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {
    return getFirestore(app)
  }
}

export const auth = getAuth(app)
export const db = createDb()

// Warunek wpisany wprost (nie przez IS_SANDBOX): next.config.js zawsze wstawia
// tę zmienną, więc w produkcji webpack widzi `'0' === '1'`, uznaje gałąź za
// martwą i w ogóle nie dołącza lib/sandbox/seed do bundla.
if (process.env.NEXT_PUBLIC_SANDBOX === '1') {
  if (typeof window !== 'undefined') {
    // Bez sieci: nasłuchy od razu dostają stan z pamięci, nic nie wychodzi na zewnątrz.
    void disableNetwork(db)
    // Dane demo — zapisywane lokalnie, zanim komponenty zaczną czytać.
    const { seedSandbox } = require('./sandbox/seed') as typeof import('./sandbox/seed')
    seedSandbox(db)
  }
}

export default app
