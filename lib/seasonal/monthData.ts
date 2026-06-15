// Miesięczne motto i nazwa. Klucz w formacie YYYY-MM.
// Dopisuj kolejne miesiące w miarę rozwoju Projektu 30.

export interface MonthData {
  name: string
  motto: string
}

export const MONTHLY_DATA: Record<string, MonthData> = {
  '2026-04': {
    name: 'Przejęcie steru',
    motto: 'W kwietniu nie proszę świata o miejsce. Zaczynam stawać się kobietą, której miejsce się robi.',
  },
  '2026-05': {
    name: 'Ukojenie',
    motto: 'Nie uciekam od bólu, ale już nie pozwalam mu prowadzić mojego życia.',
  },
  '2026-06': {
    name: 'Zakorzenienie',
    motto: 'Ufam sobie. Najpierw odzyskuję siebie, potem zwiększam zasięg.',
  },
  // ── Drafty do edycji — dopisz/zmień własnymi słowami ────────────────
  // Łuk: odzyskanie siebie → rozszerzanie zasięgu → kulminacja na 30. urodzinach
  // (5.04.2027). Zmień swobodnie; wcześniej od lipca leciał generyczny fallback.
  '2026-07': {
    name: 'Zasięg',
    motto: 'Jestem zakorzeniona, więc mogę być widoczna. Wchodzę w świat na swoich warunkach.',
  },
  '2026-08': {
    name: 'Witalność',
    motto: 'Dbam o ciało i energię jak o kapitał. Lato należy do mnie.',
  },
  '2026-09': {
    name: 'Ostrość',
    motto: 'Wracam do struktury. Kariera i finanse dostają moją pełną uwagę.',
  },
  '2026-10': {
    name: 'Głębia',
    motto: 'Nie gonię. Pogłębiam to, kim już jestem — w środku, nie na pokaz.',
  },
  '2026-11': {
    name: 'Hart',
    motto: 'Ciemniejszy miesiąc nie obniża moich standardów. Dyscyplina jest moją elegancją.',
  },
  '2026-12': {
    name: 'Domknięcie',
    motto: 'Zamykam rok z wdzięcznością. Widzę, jak daleko zaszłam — i nie oglądam się za tym, co zostawiłam.',
  },
  '2027-01': {
    name: 'Próg',
    motto: 'Nowy rok zastaje mnie inną kobietą. Wchodzę na poziom, który kiedyś tylko sobie wyobrażałam.',
  },
  '2027-02': {
    name: 'Magnetyzm',
    motto: 'Moja wartość nie podlega negocjacji. Przyciągam to, co odpowiada mojemu standardowi.',
  },
  '2027-03': {
    name: 'Kulminacja',
    motto: 'Wszystkie warstwy się scalają. Zostaje ostatni krok do tej, którą się stałam.',
  },
  '2027-04': {
    name: 'Natalia 30',
    motto: 'Dotarłam. To nie meta — to kobieta, którą jestem od teraz.',
  },
}

const FALLBACK: MonthData = {
  name: 'Nowy rozdział',
  motto: 'Każdy miesiąc to kolejna warstwa tej, którą się staję.',
}

export function getCurrentMonthData(): MonthData {
  const now = new Date()
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return MONTHLY_DATA[key] ?? FALLBACK
}
