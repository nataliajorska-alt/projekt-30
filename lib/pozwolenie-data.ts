// lib/pozwolenie-data.ts
// Pula kart „Pozwolenie na dziś". Przyjemności i pozwolenia, NIE gesty regulacji.
// Świadomie odgrodzone od SOOTHING_SUGGESTIONS (pula r3): tam ukojenie, tu radość.
// Źródło: finalna lista 20 życioumilaczy lata 2026 (zycioumilacze-lato-2026), Natalii,
// wzięta 1:1, bez wycinania. Jedyna bliska kolizja z r3 to bare „spacer" (tu zawsze
// w wersji opisanej: boso, po nieznanej dzielnicy, targ), zerknij i utnij literalne bliźniaki.
// Rotacja: _lastShown w pamięci sesji (1:1 jak mostek-data.ts), nigdy w storage.
// Zero licznika, zero serii, zero XP. Prezent, nie quest.

export const POZWOLENIA = [
  // Codzienne, powolne
  'Poranek bez budzika, obudź się naturalnie. Luksus, na który masz teraz czas.',
  'Powolna poranna kawa w oknie albo na balkonie, bez telefonu. Pierwszy łyk należy do Ciebie, nie do świata.',
  'Świeże kwiaty kupowane sobie co tydzień. Nie na okazję. Bo Ci się należą.',
  'Książka w parku. Dla czystej przyjemności, nie rozwojowa.',
  'Hiszpański w słońcu, z kawą. Duolingo jako przyjemność, nie obowiązek.',
  'Upiec albo zrobić coś od zera raz w tygodniu: ciasto, chleb, domowe lody. Kuchnia jako przyjemność.',
  // Ciało, ruch, natura
  'Poranny spacer, najlepiej boso po trawie. Grunt dosłownie pod stopami.',
  'Masaż. Godzina, w której nic nie musisz.',
  'Taniec sama w kuchni do jednej piosenki. Nikt nie patrzy, ciało prowadzi.',
  'Kajak albo łódka po jeziorze, spokojnie. Woda niesie, Ty nie musisz.',
  'Ciepły letni deszcz, świadomie zmoknąć. Dziecięca przyjemność za darmo.',
  'Coś z łagodną adrenaliną: wspinaczka, via ferrata, kolejny trapez. Twój wzorzec premium.',
  // Miasto i kultura
  'Śniadanie w pięknej kawiarni, sama, z książką. Stolik tylko Twój.',
  'Targ śniadaniowy, spacer i jedzenie na stojąco. Miasto budzi się z Tobą.',
  'Spacer po nieznanej dzielnicy, jak turystka we własnym mieście.',
  'Jedno miejsce w Warszawie, w którym nigdy nie byłaś: muzeum, ogród, kamienica.',
  'Antykwariat albo vintage, jedna piękna rzecz z historią. Jakość, nie nowość.',
  'Wystawa, galeria albo koncert na żywo. Karm oko i ucho, nie tylko głowę.',
  'Krótki wyjazd za miasto albo dalej. Dla siebie, nie jako ucieczka.',
  // Przez całe lato
  'Aparat analogowy, lato na jednej klatce, wywołane na koniec. Lato wywołane jak skarb.',
]

// ─── Rotacja (pamięć sesji, nie storage) ──────────────────────────
// _lastShown trzyma ostatnio pokazany życioumilacz, żeby ten sam nie wyskoczył
// dwa razy pod rząd. Zwykła zmienna modułu — przepada przy reloadzie, bo
// Pozwolenie świadomie niczego nie utrwala.
const _lastShown: { v?: string } = {}

/** Losuje jeden życioumilacz, unikając natychmiastowego powtórzenia. */
export function pickPozwolenie(pool: string[] = POZWOLENIA): string {
  if (pool.length <= 1) return pool[0]
  let pick = pool[Math.floor(Math.random() * pool.length)]
  for (let g = 0; pick === _lastShown.v && g < 8; g++) {
    pick = pool[Math.floor(Math.random() * pool.length)]
  }
  _lastShown.v = pick
  return pick
}
