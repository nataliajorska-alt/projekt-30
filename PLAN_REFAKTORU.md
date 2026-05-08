# Plan refaktoru Projekt 30

Stan na: 2026-05-02
Cel: ulepszyć nawigację, wyeksponować ulubione widoki (drzewko + wzorce), naprawić techniczne długi, bez ruszania funkcji które działają.

Priorytety:
- **Tier 1**: 1 weekend, największy efekt wizualny i UX
- **Tier 2**: kolejny tydzień, sprzątanie i bezpieczeństwo
- **Tier 3**: gdy będzie nuda, polish i edge cases

---

## TIER 1 — Refactor nawigacji + dashboard z drzewkiem i wzorcami

### Krok 1.1 — Przebuduj nawigację: 2 nowe grupy (Wzrost, Rytm)

**Plik:** `components/Navigation.tsx`

Obecnie jest grupa "Postęp" (5 dzieci) i "Archiwum" (3 dzieci). Robisz tak:

Zamiast:
```
Postęp: Historia, Osiągnięcia, Przegląd, Serce, Cykl
Archiwum: Skarbiec, Zdjęcia, Raport
```

Wpisujesz:
```typescript
const NAV: NavItem[] = [
  { kind: 'single', href: '/', icon: Home, label: 'Dziś' },
  { kind: 'single', href: '/quests', icon: Sword, label: 'Questy' },
  {
    kind: 'group',
    icon: Sprout,           // import { Sprout } from 'lucide-react'
    label: 'Wzrost',
    children: [
      { href: '/progress',     icon: TreePine,     label: 'Drzewko' },
      { href: '/timeline',     icon: CalendarDays, label: 'Wzorce' },
      { href: '/pillars',      icon: Columns3,     label: 'Filary' },
      { href: '/achievements', icon: Trophy,       label: 'Osiągnięcia' },
    ],
  },
  {
    kind: 'group',
    icon: Moon,
    label: 'Rytm',
    children: [
      { href: '/cycle',  icon: Moon,     label: 'Cykl' },
      { href: '/serce',  icon: Heart,    label: 'Serce' },
      { href: '/review', icon: BookOpen, label: 'Przegląd' },
    ],
  },
  {
    kind: 'group',
    icon: Archive,
    label: 'Archiwum',
    children: [
      { href: '/vault',  icon: Lock,   label: 'Skarbiec' },
      { href: '/photos', icon: Camera, label: 'Zdjęcia' },
      { href: '/report', icon: Scroll, label: 'Raport' },
    ],
  },
  { kind: 'single', href: '/settings', icon: Settings, label: 'Ustawienia' },
]
```

**Co robi:** `/progress` i `/pillars` przestają być sierotami (wcześniej wisiały luzem), wpadają do "Wzrost". `/serce` i `/review` zmieniają miejsce z analityki do "Rytm" gdzie pasują (rytuały, refleksja).

**Co nie zmienia:** route'y zostają te same, więc istniejące linki dalej działają. Nazwa "Historia" zmienia się na "Wzorce" w sidebarze, ale URL `/timeline` zostaje.

Sprawdź też że importy z `lucide-react` zawierają `Sprout`, `TreePine`, `Columns3`.

---

### Krok 1.2 — Mini-drzewko na dashboardzie

**Cel:** widzieć stage ogrodu codziennie po wejściu do aplikacji, nie tylko w `/progress`.

**Plik:** stwórz nowy komponent `components/MiniGardenWidget.tsx`

```typescript
'use client'
import Link from 'next/link'
import { useGameData } from '@/hooks/useGameData'
import { getLevelFromXP, getStageEmoji, getStageName } from '@/lib/gameLogic'
// dostosuj importy do tego co naprawdę masz w gameLogic

export default function MiniGardenWidget() {
  const { stats } = useGameData()
  const level = getLevelFromXP(stats.totalXP)
  const emoji = getStageEmoji(level)        // np. 🌱 🌿 🌳
  const name = getStageName(level)          // np. "Kiełek", "Drzewo"
  // policz progress do następnego stage'a
  const xpInCurrent = stats.totalXP // odejmij próg poprzedniego stage'a
  const xpNeeded = 1000 // próg następnego stage'a minus poprzedniego
  const pct = Math.min(100, (xpInCurrent / xpNeeded) * 100)

  return (
    <Link href="/progress" className="block bg-dark/40 rounded-xl p-4 hover:bg-dark/60 transition">
      <div className="flex items-center gap-4">
        <div className="text-5xl">{emoji}</div>
        <div className="flex-1">
          <div className="text-ivory text-sm opacity-70">Poziom {level}</div>
          <div className="text-ivory font-serif">{name}</div>
          <div className="mt-2 h-2 bg-ivory/10 rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  )
}
```

Zerknij do `app/progress/page.tsx` jak tam jest liczony stage i nazwa, skopiuj tę samą logikę do hooka albo helpera w `lib/gameLogic.ts`. Jeśli stage'e są tablicą obiektów, zrób funkcję `getCurrentStage(xp)` żeby uniknąć duplikacji.

**Plik:** `app/page.tsx`

W sekcji ze skeletonami i renderem, zaraz pod `<CountdownHero />` wstaw:

```tsx
<MiniGardenWidget />
```

Albo jeszcze lepiej, w grid 2 kolumny z mini-heatmapem (krok 1.3):

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <MiniGardenWidget />
  <MiniHeatmap30 />
</div>
```

---

### Krok 1.3 — Mini-heatmap 30 dni na dashboardzie

**Cel:** podgląd ostatnich 30 dni wzorców rutyny/nastroju bez wchodzenia do `/timeline`.

**Plik:** stwórz `components/MiniHeatmap30.tsx`

```typescript
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getDailyLogsRange } from '@/lib/firestore' // dostosuj do swojej struktury
import { useAuth } from '@/hooks/useAuth'

export default function MiniHeatmap30() {
  const { user } = useAuth()
  const [days, setDays] = useState<{ key: string; intensity: number }[]>([])

  useEffect(() => {
    if (!user) return
    const end = new Date()
    const start = new Date(); start.setDate(end.getDate() - 29)
    getDailyLogsRange(user.uid, start, end).then((logs) => {
      // intensity 0..1 zależnie od ilości ukończonych questów + rutyny
      const arr = [...] // 30 dni
      setDays(arr)
    })
  }, [user])

  return (
    <Link href="/timeline" className="block bg-dark/40 rounded-xl p-4 hover:bg-dark/60 transition">
      <div className="text-ivory text-sm opacity-70 mb-2">Ostatnie 30 dni</div>
      <div className="grid grid-cols-15 gap-1">
        {days.map(d => (
          <div
            key={d.key}
            title={d.key}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: `rgba(196, 165, 91, ${d.intensity})` }}
          />
        ))}
      </div>
    </Link>
  )
}
```

Skopiuj logikę liczenia intensywności z istniejącego `YearHeatmap.tsx`, tam już musisz mieć formułę "jak kolorowy ma być dzień".

---

### Krok 1.4 — Drzewko z next-stage spoiler

**Cel:** w `/progress` widzieć obok aktualnego stage'a rozmytą wersję następnego, żeby było wiadomo co Cię czeka.

**Plik:** `app/progress/page.tsx`

W miejscu gdzie renderujesz aktualne drzewko, dodaj kontener flex z dwoma elementami:

```tsx
<div className="flex items-end justify-center gap-8">
  <div className="text-center">
    <div className="text-9xl">{currentEmoji}</div>
    <div className="font-serif text-ivory mt-2">{currentName}</div>
    <div className="text-xs opacity-70">poziom {currentLevel}</div>
  </div>
  <div className="text-center opacity-20 blur-sm">
    <div className="text-7xl">{nextEmoji}</div>
    <div className="font-serif text-ivory mt-2">{nextName}</div>
    <div className="text-xs">+{xpToNext} XP</div>
  </div>
</div>
```

**Bonus:** pod tym dodaj oś 30 stage'ów jako tiny dots:

```tsx
<div className="flex gap-1 mt-8 justify-center">
  {Array.from({ length: 30 }).map((_, i) => (
    <div key={i} className={clsx(
      'w-2 h-2 rounded-full',
      i < currentLevel ? 'bg-gold' : i === currentLevel ? 'bg-gold animate-pulse' : 'bg-ivory/20'
    )} />
  ))}
</div>
```

---

## TIER 2 — Sprzątanie tech debt i bezpieczeństwo

### Krok 2.1 — Testy na lib/gameLogic.ts

**Plik:** stwórz `lib/__tests__/gameLogic.test.ts`

Vitest już masz w `package.json`. Wystarczy:

```typescript
import { describe, it, expect } from 'vitest'
import { getLevelFromXP, getDaysElapsed, todayKey, tomorrowDate } from '../gameLogic'

describe('getLevelFromXP', () => {
  it('zwraca level 1 dla 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1)
  })
  it('nie wypada poza level 30', () => {
    expect(getLevelFromXP(9999999)).toBe(30)
  })
  it('progi są monotonicznie rosnące', () => {
    let prev = getLevelFromXP(0)
    for (let xp = 100; xp < 200000; xp += 100) {
      const lvl = getLevelFromXP(xp)
      expect(lvl).toBeGreaterThanOrEqual(prev)
      prev = lvl
    }
  })
})

describe('todayKey', () => {
  it('format YYYY-MM-DD', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('getDaysElapsed', () => {
  it('zwraca 0 dla dziś', () => {
    expect(getDaysElapsed(todayKey())).toBe(0)
  })
})
```

Uruchamiasz `npm test`. To Cię ratuje przed przypadkową regresją w sercu gry.

---

### Krok 2.2 — Backupy Firestore raz w tygodniu

Najprostsza wersja: skrypt `scripts/backup.ts` który eksportuje wszystkie kolekcje user'a do JSON i zapisuje lokalnie.

```typescript
// scripts/backup.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { writeFileSync } from 'fs'
import 'dotenv/config'

const app = initializeApp({ /* config z .env */ })
const db = getFirestore(app)

async function backup() {
  const userId = process.env.BACKUP_USER_ID!
  const collections = ['dailyLogs', 'userStats', 'achievements', 'vault', 'photos']
  const data: Record<string, any[]> = {}
  for (const col of collections) {
    const snap = await getDocs(collection(db, `users/${userId}/${col}`))
    data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
  const date = new Date().toISOString().split('T')[0]
  writeFileSync(`./backups/projekt30-${date}.json`, JSON.stringify(data, null, 2))
  console.log(`✓ Backup zapisany: backups/projekt30-${date}.json`)
}

backup()
```

W `package.json` dodaj:
```json
"backup": "tsx scripts/backup.ts"
```

W kalendarzu telefonu reminder w niedzielę 20:00: "npm run backup". Tańsze niż Cloud Functions.

---

### Krok 2.3 — Wywal GhostProtocol V1

**Plik:** `components/GhostProtocol.tsx` — usuwasz cały plik.

Sprawdź gdzie jest importowany:
```bash
grep -r "GhostProtocol[^V]" --include="*.tsx" --include="*.ts"
```

Wszystkie miejsca przepinasz na `GhostProtocolV2`. Jeśli V2 ma inny interface, dostosuj wywołania.

Po refactorze możesz przemianować `GhostProtocolV2.tsx` z powrotem na `GhostProtocol.tsx` żeby nie miało wstydu w nazwie.

---

### Krok 2.4 — Dane sezonowe z głównego /lib do podfolderu

**Pliki:** `lib/aprilData.ts`, `lib/mayData.ts` (i inne miesiące jeśli są)

Stwórz `lib/seasonal/` i przenieś tam wszystkie miesięczne pliki. Na górze `lib/seasonal/index.ts`:

```typescript
// Sezonowe dane: pomysły na questy, prompty refleksji, motywy miesiąca.
// Wybór aktywnego miesiąca przez getCurrentMonthData().

import { aprilData } from './aprilData'
import { mayData } from './mayData'

export function getCurrentMonthData() {
  const month = new Date().getMonth() + 1
  switch (month) {
    case 4: return aprilData
    case 5: return mayData
    // dodaj kolejne
    default: return null
  }
}
```

---

### Krok 2.5 — Skarbiec z kwartalnymi unlockami

**Plik:** `app/vault/page.tsx`

Obecnie wszystko zablokowane do końca roku. Zmień logikę:

```typescript
const PROJECT_START = new Date('2026-04-05')
const QUARTERLY_UNLOCKS = [
  { date: new Date('2026-07-05'), letterIndex: 0, label: 'Q1' },
  { date: new Date('2026-10-05'), letterIndex: 1, label: 'Q2' },
  { date: new Date('2027-01-05'), letterIndex: 2, label: 'Q3' },
  { date: new Date('2027-04-05'), letterIndex: -1, label: 'Finał' }, // wszystko reszty
]

function isLetterUnlocked(letter: Letter, allLetters: Letter[]): boolean {
  const now = new Date()
  // Listy są sortowane chronologicznie po dacie napisania
  const idx = allLetters.findIndex(l => l.id === letter.id)
  for (const u of QUARTERLY_UNLOCKS) {
    if (now >= u.date) {
      if (u.letterIndex === -1) return true
      if (idx <= u.letterIndex) return true
    }
  }
  return false
}
```

Ekran pokazuje "Otwiera się 5 lipca 2026", "Otwiera się 5 października 2026" itd.

---

## TIER 3 — Polish, edge cases

### Krok 3.1 — Pattern of the week

Jeden widget na dashboardzie który raz w tygodniu pokazuje insight. Najprostsza wersja na start: hardcoded reguły (np. "Twój najlepszy dzień tygodnia to: X" liczone z ostatnich 28 dni). Zaawansowana: prosty bayesian, ale to przerost formy.

**Plik:** `components/PatternOfTheWeek.tsx`

```typescript
function computeBestDayOfWeek(logs: DailyLog[]) {
  const sums = [0,0,0,0,0,0,0]
  const counts = [0,0,0,0,0,0,0]
  logs.forEach(l => {
    const d = new Date(l.date).getDay()
    sums[d] += l.totalXP ?? 0
    counts[d]++
  })
  const avgs = sums.map((s, i) => counts[i] ? s/counts[i] : 0)
  const best = avgs.indexOf(Math.max(...avgs))
  return ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'][best]
}
```

Render: "Twój najlepszy dzień tygodnia to **wtorek** (śr. 84 XP)". Klikalne, prowadzi do `/timeline`.

---

### Krok 3.2 — FAB szybkich akcji

**Plik:** stwórz `components/QuickActionsFab.tsx`

Floating button w prawym dolnym rogu, po kliknięciu rozwija 3 akcje:
- Mood check-in
- Wpis do skarbca
- Dodaj zdjęcie

Ja bym tu użyła `lucide-react` Plus jako głównej ikony, otwiera się w łuk z 3 dymkami nad nim.

Renderujesz w `app/layout.tsx` pod providerami żeby było widoczne wszędzie poza Settings.

---

### Krok 3.3 — Settings z tabami

**Plik:** `app/settings/page.tsx`

Obecnie 7 sekcji jedna pod drugą. Zmień na taby:

```typescript
const TABS = [
  { id: 'account',     label: 'Konto' },
  { id: 'personal',    label: 'Personalizacja' }, // routine, sparks
  { id: 'notify',      label: 'Powiadomienia' },
  { id: 'export',      label: 'Eksport' },
  { id: 'safety',      label: 'Bezpieczeństwo' }, // contacts, XP recovery
]
```

State `activeTab`, render warunkowy. Każdy tab to osobny komponent (`<AccountTab />`, `<NotifyTab />` itd.).

---

### Krok 3.4 — next/image w galerii zdjęć

**Plik:** `app/photos/page.tsx`

Zamień:
```tsx
<img src={photo.url} alt={photo.caption} />
```

na:
```tsx
import Image from 'next/image'

<Image
  src={photo.url}
  alt={photo.caption ?? ''}
  width={400}
  height={400}
  loading="lazy"
  className="rounded-lg object-cover"
/>
```

Plus w `next.config.js` (jeśli nie masz, stwórz):

```javascript
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
}
```

---

### Krok 3.5 — Error Boundary

**Plik:** stwórz `components/ErrorBoundary.tsx`

```typescript
'use client'
import { Component, ReactNode } from 'react'

export default class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: any) { console.error('Boundary caught:', error) }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 bg-rose/10 rounded text-rose">
          Coś się popsuło w tej sekcji. Odśwież stronę.
        </div>
      )
    }
    return this.props.children
  }
}
```

Owijasz nim sekcje dashboardu indywidualnie:

```tsx
<ErrorBoundary><RoutineChecklist /></ErrorBoundary>
<ErrorBoundary><DailyQuests /></ErrorBoundary>
<ErrorBoundary><CyclePhaseWidget /></ErrorBoundary>
```

---

## Kolejność wykonania (rekomendowana)

1. Krok 1.1 (nawigacja) — 30 min
2. Krok 1.2 (mini-drzewko) — 1.5h
3. Krok 1.3 (mini-heatmap) — 1.5h
4. Krok 1.4 (next-stage spoiler) — 1h
5. → po tym puść aplikację, ciesz się 2 dni, sprawdź czy wszystko działa
6. Krok 2.3 (wywal GhostProtocol V1) — 30 min
7. Krok 2.4 (sezonowe dane) — 20 min
8. Krok 2.1 (testy) — 1.5h
9. Krok 2.2 (backupy) — 1h
10. Krok 2.5 (kwartalne unlocki) — 1h
11. → tu projekt jest w bardzo dobrym stanie, możesz się zatrzymać
12. Tier 3 cokolwiek Cię ciągnie

---

## Czego NIE ruszać

- Drzewka w `/progress` (poza dodaniem next-stage spoiler i osi)
- Tabów w `/timeline` (Kalendarz, Nawyki, Filary, Nastrój, Protokół)
- Filozofii gry (XP, levele, streaki, ghost protocol, return ceremony)
- 7 filarów jako konceptu

---

## Checklist dla siebie

- [ ] 1.1 Nawigacja (2 nowe grupy: Wzrost, Rytm)
- [ ] 1.2 MiniGardenWidget na dashboardzie
- [ ] 1.3 MiniHeatmap30 na dashboardzie
- [ ] 1.4 Next-stage spoiler w /progress
- [ ] 2.1 Testy gameLogic.ts
- [ ] 2.2 Skrypt backup
- [ ] 2.3 Usunięcie GhostProtocol V1
- [ ] 2.4 Dane sezonowe do podfolderu
- [ ] 2.5 Kwartalne unlocki Skarbca
- [ ] 3.1 Pattern of the week
- [ ] 3.2 FAB szybkich akcji
- [ ] 3.3 Settings z tabami
- [ ] 3.4 next/image w galerii
- [ ] 3.5 Error Boundary
