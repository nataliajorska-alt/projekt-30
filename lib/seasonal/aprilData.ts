import type { Pillar } from '@/types'
import type { QuestPostpone } from '@/hooks/useAprilQuests'

export interface AprilQuest {
  id: string
  date: string      // YYYY-MM-DD
  title: string
  description: string
  pillar: Pillar
  xp: number
}

export const APRIL_MOTTO = 'W kwietniu nie proszę świata o miejsce. Zaczynam stawać się kobietą, której miejsce się robi.'
export const APRIL_NAME = 'Przejęcie steru'

// Nazwa APRIL_QUESTS jest legacy — tablica zawiera questy wszystkich miesięcy projektu
// (filtrowane po polu `date`). Refaktor na MONTHLY_QUESTS planowany razem
// z useMonthlyQuests w późniejszej iteracji.
const APRIL_ONLY_QUESTS: AprilQuest[] = [
  // ── 5 kwietnia ──────────────────────────────────────────────
  { id: 'apr_05_1', date: '2026-04-05', title: 'Manifest Projektu 30', description: 'Napisz 1 stronę: kim jestem dziś, kim będę 5 kwietnia 2027, czego już nigdy nie chcę robić z bólu.', pillar: 'pozycja', xp: 100 },
  { id: 'apr_05_2', date: '2026-04-05', title: 'Posprzątaj telefon', description: 'Usuń rzeczy, które Cię triggerują. Schowaj zdjęcia i rozmowy, które Cię ciągną w dół.', pillar: 'pozycja', xp: 60 },
  { id: 'apr_05_3', date: '2026-04-05', title: 'Wybierz 3 zasady miesiąca', description: 'Zapisz je w notatkach. Mają być konkretne i dotrzymywalne.', pillar: 'pozycja', xp: 50 },

  // ── 6 kwietnia ──────────────────────────────────────────────
  { id: 'apr_06_1', date: '2026-04-06', title: 'Spisz wszystkie zobowiązania finansowe', description: 'Kredyt, długi, stałe koszty, subskrypcje, rachunki. Pełna mapa.', pillar: 'kariera', xp: 80 },
  { id: 'apr_06_2', date: '2026-04-06', title: 'Podziel wydatki na 4 grupy', description: 'Konieczne / ważne / do ograniczenia / do wycięcia. Ustal budżet Projektu 30 na kwiecień.', pillar: 'kariera', xp: 80 },

  // ── 7 kwietnia ──────────────────────────────────────────────
  { id: 'apr_07_1', date: '2026-04-07', title: 'Zaktualizuj CV i LinkedIn', description: 'Nagłówek, opis, rola, umiejętności. Profesjonalnie i aktualnie.', pillar: 'kariera', xp: 100 },
  { id: 'apr_07_2', date: '2026-04-07', title: 'Lista kierunków zawodowych', description: '10 firm, 5 typów ról, 3 branże. Zapisz też czego chcesz od nowej pracy: prestiż, wpływ, autonomia, pieniądze, kultura.', pillar: 'kariera', xp: 80 },

  // ── 8 kwietnia ──────────────────────────────────────────────
  { id: 'apr_08_1', date: '2026-04-08', title: 'Przegląd szafy', description: 'Podziel na: noszę i kocham / dobre, ale nie moje / sprzedaję lub oddaję / do naprawy. Zrób listę braków.', pillar: 'styl', xp: 100 },
  { id: 'apr_08_2', date: '2026-04-08', title: '3 gotowe stylizacje', description: 'Polished day / soft elegant / evening classy. Przygotowane, gotowe, bez stresu rano.', pillar: 'styl', xp: 80 },

  // ── 9 kwietnia ──────────────────────────────────────────────
  { id: 'apr_09_1', date: '2026-04-09', title: 'Mapa relacji', description: '3 kategorie: osoby przy których jesteś sobą / do odświeżenia / środowiska do których zmierzasz. Napisz do 2 osób z listy 1 lub 2.', pillar: 'kapital', xp: 100 },

  // ── 10 kwietnia ─────────────────────────────────────────────
  { id: 'apr_10_1', date: '2026-04-10', title: 'Nagraj siebie mówiącą', description: 'Nagraj 2–3 minuty mówienia o sobie. Posłuchaj i wypisz co chcesz poprawić: tempo, chaos, niepewność, zjadanie końcówek.', pillar: 'tozsamosc', xp: 100 },
  { id: 'apr_10_2', date: '2026-04-10', title: '30 min rozwoju kulturowego', description: 'Artykuł, wykład, film edukacyjny — coś o winie, sztuce, etykiecie, historii. Ułóż 3 elegantsze wersje codziennych zwrotów.', pillar: 'tozsamosc', xp: 60 },

  // ── 11 kwietnia ─────────────────────────────────────────────
  { id: 'apr_11_1', date: '2026-04-11', title: 'Jakościowe wyjście #1', description: 'Spacer w dobrej okolicy, kawa, wystawa, muzeum, lunch. Wyjdź ładnie ubrana. Bądź na swoim miejscu, nie udowadniaj niczego.', pillar: 'kapital', xp: 120 },

  // ── 12 kwietnia ─────────────────────────────────────────────
  { id: 'apr_12_1', date: '2026-04-12', title: 'Podsumowanie tygodnia 1', description: 'Co zrobiłam dobrze / gdzie oddałam energię / co poprawić. Zaplanuj tydzień 13–19 kwietnia.', pillar: 'pozycja', xp: 100 },

  // ── 13 kwietnia ─────────────────────────────────────────────
  { id: 'apr_13_1', date: '2026-04-13', title: 'Rozpisz rytm tygodnia', description: 'Sen, praca, ruch, pielęgnacja, czas dla siebie, życie towarzyskie. 3 nie-negocjowalne nawyki na kwiecień.', pillar: 'cialo', xp: 80 },
  { id: 'apr_13_2', date: '2026-04-13', title: 'Ruch 30–45 min', description: 'Cokolwiek, ale z intencją. Zapisz też co najbardziej zabiera Ci energię i 5 rzeczy, które ją podnoszą.', pillar: 'cialo', xp: 60 },

  // ── 14 kwietnia ─────────────────────────────────────────────
  { id: 'apr_14_1', date: '2026-04-14', title: 'Dopracuj CV pod 2 kierunki', description: 'Dwie wersje, dwa typy ról. Uporządkuj sekcję osiągnięć. Wypisz 5 historii zawodowych do opowiedzenia.', pillar: 'kariera', xp: 100 },
  { id: 'apr_14_2', date: '2026-04-14', title: 'Szkic wiadomości networkingowej', description: 'Po angielsku i po polsku. Sprawdź 5 ofert, nawet jeśli jeszcze nie aplikujesz.', pillar: 'kariera', xp: 60 },

  // ── 15 kwietnia ─────────────────────────────────────────────
  { id: 'apr_15_1', date: '2026-04-15', title: 'Kim jest Natalia 2.0', description: 'Napisz 1 akapit: kim jest Natalia 2.0. Napisz 1 akapit: czym już nie jest. 3 filary tożsamości (klasa, inteligencja, kultura…).', pillar: 'tozsamosc', xp: 120 },

  // ── 16 kwietnia ─────────────────────────────────────────────
  { id: 'apr_16_1', date: '2026-04-16', title: 'Networking — 2 kontakty', description: 'Odezwij się do 2 kolejnych osób. Umów 1 spotkanie. Zapisz jak chcesz się przedstawiać nowym ludziom w 3 zdaniach.', pillar: 'kapital', xp: 100 },

  // ── 17 kwietnia ─────────────────────────────────────────────
  { id: 'apr_17_1', date: '2026-04-17', title: 'Dzień pracy nad głosem i mową', description: 'Przez cały dzień: wolniej, pełniejsze zdania, spokojniejsza energia. Wieczorem oceń się 1–10. 30 min nauki języka.', pillar: 'tozsamosc', xp: 100 },

  // ── 18 kwietnia ─────────────────────────────────────────────
  { id: 'apr_18_1', date: '2026-04-18', title: 'Jakościowe wyjście #2', description: 'Wystawa, wydarzenie, miejsce z klasą. Wyjdź dopracowana. Ćwicz kontakt wzrokowy, uśmiech, spokojne bycie.', pillar: 'kapital', xp: 120 },

  // ── 19 kwietnia ─────────────────────────────────────────────
  { id: 'apr_19_1', date: '2026-04-19', title: 'Podsumowanie tygodnia 2', description: 'Co już zaczyna działać / gdzie nadal rządzi smutek / co Cię wzmacnia. Zaplanuj tydzień 20–26. Porządek w kosmetykach i biżuterii.', pillar: 'pozycja', xp: 100 },

  // ── 20 kwietnia ─────────────────────────────────────────────
  { id: 'apr_20_1', date: '2026-04-20', title: 'Drugi przegląd finansów', description: 'Sprawdź wydatki z pierwszej połowy miesiąca. Zrób plan redukcji chaosu: co tniesz / co zostaje / co przenosisz. Pierwszy cel finansowy na 3 miesiące.', pillar: 'kariera', xp: 100 },

  // ── 21 kwietnia ─────────────────────────────────────────────
  { id: 'apr_21_1', date: '2026-04-21', title: 'Pierwszy realny ruch zawodowy', description: 'Aplikuj na 1–2 role lub wyślij 1–2 wiadomości networkingowe. Lista 10 firm priorytetowych. Zapisz czego już nie chcesz w pracy.', pillar: 'kariera', xp: 120 },

  // ── 22 kwietnia ─────────────────────────────────────────────
  { id: 'apr_22_1', date: '2026-04-22', title: 'Kapitał kulturowy', description: '45–60 min na: sztuka, historia, wino, etykieta, kultura. 5 ciekawych rzeczy do rozmowy. Wybierz mikrotemat na maj.', pillar: 'tozsamosc', xp: 100 },

  // ── 23 kwietnia ─────────────────────────────────────────────
  { id: 'apr_23_1', date: '2026-04-23', title: 'Relacja 1:1', description: 'Spotkaj się lub zadzwoń do jednej osoby. Ćwicz: słuchanie, ciekawość, spokój. Po rozmowie zapisz jaką energię dałaś.', pillar: 'kapital', xp: 100 },

  // ── 24 kwietnia ─────────────────────────────────────────────
  { id: 'apr_24_1', date: '2026-04-24', title: 'Standard relacyjny', description: 'Dwie listy: czego już nigdy nie chcę w relacji / czego naprawdę chcę od partnera. Napisz: jak wygląda kobieta, która kocha, ale nie błaga?', pillar: 'milosc', xp: 120 },

  // ── 25 kwietnia ─────────────────────────────────────────────
  { id: 'apr_25_1', date: '2026-04-25', title: 'Jakościowe wyjście #3', description: 'Outfit wzmacniający przyszłą wersję siebie. Nie czekaj aż Cię ktoś zobaczy — sama bądź obecna. Spróbuj wejść w jedną lekką rozmowę.', pillar: 'kapital', xp: 120 },

  // ── 26 kwietnia ─────────────────────────────────────────────
  { id: 'apr_26_1', date: '2026-04-26', title: 'Reset i domknięcie emocji', description: '30 min bez telefonu. Podsumuj: co się zmienia / gdzie dalej boli / z czego jesteś dumna. Lista 5 rzeczy do domknięcia przed końcem miesiąca.', pillar: 'pozycja', xp: 100 },

  // ── 27 kwietnia ─────────────────────────────────────────────
  { id: 'apr_27_1', date: '2026-04-27', title: 'Ostatni przegląd kariery w kwietniu', description: 'Sprawdź co już zrobiłaś zawodowo. Zaktualizuj listę firm i ról. Zrób 1 kolejny ruch (aplikacja / wiadomość / research). Napisz plan zawodowy na maj.', pillar: 'kariera', xp: 100 },

  // ── 28 kwietnia ─────────────────────────────────────────────
  { id: 'apr_28_1', date: '2026-04-28', title: 'Wizerunek końcowy kwietnia', description: 'Dokończ przegląd szafy. Wystaw rzeczy na sprzedaż. 5 outfit formulas. Mały przegląd pielęgnacji.', pillar: 'styl', xp: 100 },

  // ── 29 kwietnia ─────────────────────────────────────────────
  { id: 'apr_29_1', date: '2026-04-29', title: 'Dom i przestrzeń', description: 'Ogarnij jeden ważny fragment: sypialnia / łazienka / biurko. Usuń rzeczy energetycznie obniżające jakość. Jedna mała rzecz podnosząca estetykę.', pillar: 'tozsamosc', xp: 80 },

  // ── 30 kwietnia ─────────────────────────────────────────────
  { id: 'apr_30_1', date: '2026-04-30', title: 'Wielkie podsumowanie miesiąca', description: 'Przegląd 6 obszarów: psychika / serce po rozstaniu / wizerunek / kariera i finanse / relacje / tożsamość. Napisz: 10 rzeczy zrobionych dobrze, 5 do poprawy, 3 priorytety maja.', pillar: 'pozycja', xp: 200 },
]

// Import po definicji APRIL_ONLY_QUESTS — mayData/juneData reużywają typu AprilQuest
import { MAY_QUESTS } from './mayData'
import { JUNE_QUESTS } from './juneData'
import { JULY_QUESTS } from './julyData'

export const APRIL_QUESTS: AprilQuest[] = [...APRIL_ONLY_QUESTS, ...MAY_QUESTS, ...JUNE_QUESTS, ...JULY_QUESTS]

export function getAprilQuestsForDate(dateKey: string): AprilQuest[] {
  return APRIL_QUESTS.filter(q => q.date === dateKey)
}

export function getOverdueAprilQuests(
  todayKey: string,
  completedIds: string[],
  skippedIds: string[],
  postponed: QuestPostpone[]
): AprilQuest[] {
  return APRIL_QUESTS.filter(q => {
    if (q.date >= todayKey) return false
    if (completedIds.includes(q.id)) return false
    if (skippedIds.includes(q.id)) return false
    // Jeśli quest przeniesiony na dziś lub później — nie jest overdue
    const p = postponed.find(pp => pp.questId === q.id)
    if (p && p.targetDate >= todayKey) return false
    return true
  })
}

export function getPostponedQuestsForDate(
  dateKey: string,
  postponed: QuestPostpone[]
): AprilQuest[] {
  const questIds = postponed
    .filter(p => p.targetDate === dateKey)
    .map(p => p.questId)
  return APRIL_QUESTS.filter(q => questIds.includes(q.id))
}
