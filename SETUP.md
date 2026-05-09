# Projekt 30 — Instrukcja uruchomienia

## Krok 1 — Zainstaluj Node.js

Idź na: **https://nodejs.org** → pobierz wersję **LTS** → zainstaluj normalnie jak każdy program na Macu.

Po instalacji otwórz Terminal (Cmd+Space → "Terminal") i sprawdź:
```
node --version
npm --version
```
Powinnaś zobaczyć numery wersji.

---

## Krok 2 — Zainstaluj zależności aplikacji

W Terminalu przejdź do folderu projektu:
```
cd "/Users/nataliajorska/Documents/Prywatne/projekt-30"
npm install
```
Poczekaj chwilę — pobierze potrzebne pakiety.

---

## Krok 3 — Stwórz projekt Firebase (chmura)

1. Idź na: **https://console.firebase.google.com**
2. Kliknij **"Dodaj projekt"** → nazwij go np. `projekt-30`
3. Wyłącz Google Analytics (nie potrzebujesz) → **Utwórz projekt**

### Aktywuj bazę danych:
4. W lewym menu: **Build → Firestore Database** → **Utwórz bazę danych**
5. Wybierz lokalizację: `europe-west1` → **Dalej** → tryb **"Produkcja"** → **Utwórz**

### Aktywuj autentykację:
6. W lewym menu: **Build → Authentication** → **Rozpocznij**
7. Zakładka **Sign-in method** → **E-mail/hasło** → **Włącz** → **Zapisz**

### Pobierz klucze:
8. Koło zębate (⚙️) → **Ustawienia projektu**
9. Przewiń do dołu → **"Twoje aplikacje"** → kliknij ikonę `</>` (Web)
10. Nadaj nazwę (np. `projekt-30-web`) → **Zarejestruj aplikację**
11. Zobaczysz obiekt `firebaseConfig` — skopiuj z niego wartości

### Ustaw reguły Firestore (ważne!):
Reguły żyją w repo w pliku `firestore.rules`. Masz dwie opcje:

**Opcja A — wklej ręcznie (szybciej za pierwszym razem):**
12. Firestore → **Reguły** → wklej zawartość pliku `firestore.rules` z repo
13. **Opublikuj**

**Opcja B — deploy z CLI (zalecane długoterminowo, reguły żyją obok kodu):**
```
npm install -g firebase-tools
firebase login
firebase use --add        # wybierz projekt z konsoli, alias: default
firebase deploy --only firestore:rules
```
Po pierwszej konfiguracji wystarcza `firebase deploy --only firestore:rules` po każdej zmianie reguł.

**Lokalny emulator (opcjonalnie):**
```
firebase emulators:start
```
Konfiguracja jest w `firebase.json` (Auth: 9099, Firestore: 8080, UI: 4000).

---

## Krok 4 — Skonfiguruj zmienne środowiskowe

W folderze `projekt-30` stwórz plik `.env.local` (skopiuj `.env.local.example`):
```
cp .env.local.example .env.local
```

Otwórz `.env.local` i uzupełnij wartościami z Firebase:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## Krok 5 — Uruchom lokalnie

```
npm run dev
```

Otwórz w przeglądarce: **http://localhost:3000**

Zarejestruj konto (przycisk "Nie mam jeszcze konta") i gotowe!

---

## Krok 6 — Deploy na Vercel (żeby działało z telefonu)

1. Idź na: **https://vercel.com** → zaloguj się przez GitHub
2. Kliknij **"New Project"** → **"Import Git Repository"**
3. Jeśli nie masz projektu na GitHub — najpierw: https://github.com → nowe repozytorium → wrzuć tam pliki z folderu `projekt-30`
4. W Vercel po imporcie: **Environment Variables** → dodaj wszystkie `NEXT_PUBLIC_FIREBASE_*` wartości
5. Kliknij **Deploy** → za ~2 minuty masz link typu `projekt-30-xyz.vercel.app`
6. Na telefonie: otwórz ten link w Safari (iOS) → **Udostępnij** → **Dodaj do ekranu głównego** — masz ikonę jak prawdziwa aplikacja!

---

## Struktura aplikacji

| Strona | Opis |
|--------|------|
| `/` | Dashboard — dzisiejszy dzień, rutyna, questy, zasady |
| `/quests` | Biblioteka side questów z filtrowaniem |
| `/pillars` | Balans 7 filarów i rozkład XP |
| `/achievements` | Kolekcja osiągnięć |
| `/review` | Tygodniowy przegląd z oceną filarów |

## System XP

| Akcja | XP |
|-------|----|
| Element rutyny | +10 |
| Quest dnia | +50 |
| Side quest | +120 |
| Zasada dotrzymana | +20 |
| Tygodniowy przegląd | +150 |

**30 poziomów** — od "Ziarnko" do "Natalia 30".

---

Powodzenia. To Twój rok. 👑
