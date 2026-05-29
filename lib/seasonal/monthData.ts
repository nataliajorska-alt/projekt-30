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
