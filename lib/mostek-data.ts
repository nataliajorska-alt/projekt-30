// ─── Mostek — rozładowanie ładunku z układu nerwowego ─────────────
// Pule treści dla modułu /mostek. To NIE jest tryb decyzyjny ani tracker:
// brak logu, licznika, serii, XP, integracji z timeline. Mostek świadomie
// nic nie zapisuje — ucisk w mostku to resztka, nie informacja do analizy.
//
// Losowanie z unikaniem natychmiastowego powtórzenia. `lastShown` żyje w
// pamięci modułu (sesja JS), NIE w storage — bo nic nie trackujemy. Po
// odświeżeniu strony pamięć przepada i to jest w porządku.

// ─── Etap 0, wejście. Nazwanie, nie poradnik. ─────────────────────
export const MOSTEK_KOTWICE = [
  'To nie smutek. Smutek ma temat. To ładunek z ciała, który nie ma jeszcze gdzie pójść.',
  'Twoja głowa już zrobiła robotę. Ciało jeszcze nie przeczytało. Damy mu to przez ciało.',
  'Ten ucisk to resztka, która schodzi. Nie wiadomość, że coś jest nie tak.',
  'Nie musisz tego rozkminić. Musisz tylko dać temu oddech.',
  'Mowa spokojna, w mostku ciężar. To nie rozjazd do naprawienia, to ciało w swoim tempie.',
  'Nic nie jest zepsute. Dochodzisz do siebie, nie musisz nad tym panować.',
]

// ─── Etap 1, warianty oddechu. Niezmiennik: wydech > wdech, zawsze. ─
export interface MostekBreath {
  id: string
  label: string
  inhale: number
  exhale: number
  /** Tryb westchnienia fizjologicznego — dwa wdechy, potem długi wydech. */
  sigh?: boolean
  hint: string
}

export const MOSTEK_ODDECHY: MostekBreath[] = [
  { id: '4-8', label: '4 i 8', inhale: 4, exhale: 8, hint: 'Wdech nosem na 4. Wydech ustami na 8. Dłuższy wydech to sygnał bezpieczeństwa.' },
  { id: '4-6', label: '4 i 6', inhale: 4, exhale: 6, hint: 'Łagodniejsza proporcja na rozgrzewkę. Wdech 4, wydech 6.' },
  { id: '5-8', label: '5 i 8', inhale: 5, exhale: 8, hint: 'Trochę głębszy wdech, dalej długi wydech.' },
  { id: 'westchnienie', label: 'westchnienie', inhale: 4, exhale: 8, sigh: true, hint: 'Dwa wdechy nosem, drugi krótki dobierający, potem długi wydech ustami.' },
]

// ─── Etap 2, obserwacja. „Gdzie" i „jakie", nigdy „dlaczego". ──────
export const MOSTEK_OBSERWACJE = [
  'Gdzie dokładnie to siedzi? Pokaż palcem, choćby w myśli.',
  'Jak duże to jest? Wielkości pięści, dłoni, monety?',
  'Ma temperaturę? Cieplejsze, chłodniejsze niż reszta?',
  'Rusza się czy stoi w miejscu?',
  'Jaki ma kształt? Ostry, okrągły, rozlany?',
  'Ściska, ciągnie, czy po prostu jest ciężkie?',
  'Ma jeden punkt, czy zajmuje cały mostek?',
  'Zmienia się, kiedy mu się przyglądasz, czy nie?',
]

// ─── Etap 3, most do ruchu. Twoje rzeczy plus stała opcja. ────────
export const MOSTEK_RUCH = [
  'Szarfy. Pięć minut wystarczy, żeby ciało przejęło uwagę od głowy.',
  'Tango. Choćby sama, choćby kawałek.',
  'Reformer albo rozciąganie. Cokolwiek, co już znasz.',
  'Spacer. Najprostsze rozładowanie, jakie istnieje.',
  'Cokolwiek z ruchem. To nie żeby nie myśleć, to żeby spalić to, co trzyma Ci klatkę.',
]

// Stała, zawsze obecna obok losowanej propozycji.
export const MOSTEK_RUCH_STALA = 'Po prostu wstań i zrób jedną normalną rzecz. Koniec.'

// ─── Etap 4, zamknięcie. Bez pytań, bez oceny. ────────────────────
export const MOSTEK_ZAMKNIECIA = [
  'To wszystko. Nie sprawdzaj, czy zadziałało. Wstań i zrób jedną normalną rzecz.',
  'Pośpiech, żeby było normalnie, sam jest napięciem. Pozwól ciężarowi być chwilę.',
  'Nie robisz z tego sprawy do rozkminienia. Po prostu schodzi.',
  'Umieć to nieść przez chwilę bez paniki to jest cel. Nie „czuć się świetnie za 3 minuty".',
  'Ciało robi swoje w swoim tempie. Dałaś mu oddech i ruch. Reszta sama.',
]

// ─── Losowanie (pamięć sesji, nie storage) ────────────────────────
// _lastShown trzyma ostatnio pokazany element per pula, żeby ta sama treść
// nie wyskoczyła dwa razy z rzędu. To zwykła zmienna modułu — przepada przy
// reloadzie, bo Mostek niczego nie utrwala.
const _lastShown: Record<string, string> = {}

/** Losuje jeden element z puli, unikając natychmiastowego powtórzenia. */
export function pickMostek<T>(pool: T[], key: string, idOf: (x: T) => string): T {
  if (pool.length <= 1) return pool[0]
  const last = _lastShown[key]
  let pick = pool[Math.floor(Math.random() * pool.length)]
  for (let guard = 0; idOf(pick) === last && guard < 8; guard++) {
    pick = pool[Math.floor(Math.random() * pool.length)]
  }
  _lastShown[key] = idOf(pick)
  return pick
}

/** Losuje n różnych elementów (Fisher–Yates na kopii). */
export function pickMostekN<T>(pool: T[], n: number): T[] {
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(n, copy.length))
}
