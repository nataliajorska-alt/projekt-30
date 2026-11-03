import type { AprilQuest } from './aprilData'

// STAŁE PROPOZYCJE — siatka bezpieczeństwa dla miesięcy bez rozpisanych questów.
// Po wrześniu 2026 (ostatni miesiąc rozpisany w kodzie) „Questy dnia" milczały.
// Te propozycje nie zastępują planu miesiąca — trzymają rytm, dopóki
// plan nie powstanie. Gdy miesiąc dostanie własny plik (np. novemberData.ts),
// stałe propozycje same znikają z tego miesiąca.
//
// Zasady (z lipca/sierpnia): 2 questy dziennie, zero „projektów", rytm 3/3
// aktywności w tygodniu (pn/śr/pt), niedziela = plan tygodnia na kartce.
// Stałe propozycje nie stają się „zaległe" — to rytm, nie zobowiązanie.

interface EvergreenTemplate {
  key: string
  title: string
  description: string
  pillar: AprilQuest['pillar']
  xp: number
}

const t = (key: string, title: string, description: string, pillar: AprilQuest['pillar'], xp: number): EvergreenTemplate =>
  ({ key, title, description, pillar, xp })

// Kotwica dnia — stała per dzień tygodnia (indeks jak Date.getUTCDay: 0 = niedziela).
const ANCHORS: EvergreenTemplate[] = [
  t('miekko', 'Ciało na miękko', 'Magnez, ciepło, rozciąganie albo świadomy odpoczynek. Odpoczynek też jest decyzją, nie porażką.', 'cialo', 50),
  t('ruch_1', 'Aktywność 1/3', 'Szarfy, pole, trening albo szybki spacer. Ruch nie musi być zasłużony.', 'cialo', 60),
  t('swiatlo', 'Poranne światło + stała pobudka', '10 minut na zewnątrz zaraz po wstaniu. Ciemniejsze miesiące potrzebują tego bardziej niż lato.', 'cialo', 60),
  t('ruch_2', 'Aktywność 2/3', 'Ruch w dowolnej formie, z konkretną godziną. Nie „jak znajdę czas".', 'cialo', 60),
  t('martwienie', 'Konstruktywne martwienie się, 15 min', 'Wczesnym wieczorem, minimum 2h przed snem: dwie kolumny — zmartwienie i następny krok. Kartkę zostaw obok łóżka. O 2:00 nic lepszego nie wymyślisz.', 'pozycja', 60),
  t('ruch_3', 'Aktywność 3/3 — pełny rytm', 'Trzecia aktywność tygodnia. Pełny rytm 3/3 to fundament, nie bonus.', 'cialo', 80),
  t('slot', 'Slot Wnętrza 60 min', 'Godzina na stałej porze, bez telefonu. List współczujący, Biblia, medytacja albo cisza — w środku, nie na pokaz.', 'pozycja', 80),
]

// Drugi quest dnia — rotuje, żeby kolejne dni się nie powtarzały.
const REACH: EvergreenTemplate[] = [
  t('kariera', 'Jeden konkretny krok w karierze', 'E-mail, aplikacja, rozmowa albo research. Konkret z godziną, nie intencja.', 'kariera', 80),
  t('kontakt', 'Kontakt z pełni', 'Jedna ciepła wiadomość albo spotkanie z kimś, kogo chcesz więcej w swoim życiu. Obecność, nie analiza.', 'kapital', 60),
  t('finanse', 'Finanse: 15 minut przeglądu', 'Wydatki z ostatnich dni i jedna decyzja: anulować, przesunąć albo odłożyć. Spokój po działaniu, nie przed.', 'kariera', 60),
  t('klatka', 'Jedna klatka dnia', 'Aparat analogowy albo telefon: jedno zdjęcie czegoś, co dziś było piękne. Potem do Photo Timeline.', 'tozsamosc', 50),
  t('petla', 'Domknij jedną pętlę', 'Coś, co wisi w głowie dłużej niż tydzień. Zrób to albo napisz jedno zdanie, że nie robisz — oba domykają.', 'pozycja', 80),
  t('styl', 'Styl ponad komfort', 'Ubierz się lepiej niż „wystarczy", także w domu. Poczuj różnicę.', 'styl', 50),
  t('nauka', '45 minut nauki', 'Jeden temat, jedna sesja, telefon w drugim pokoju.', 'tozsamosc', 60),
  t('umilacz', 'Życioumilacz', 'Kwiaty dla siebie, książka w kawiarni, ulubiona herbata. Pozwolenie, nie zadanie.', 'styl', 50),
  t('skarbiec', 'List do Skarbca', 'Kilka zdań do siebie z przyszłości albo na trudną chwilę. Napisane w dobry dzień, czytane w zły.', 'tozsamosc', 60),
]

const SUNDAY_PLAN = t('plan', 'Plan tygodnia na kartce', 'Trzy główne rzeczy, trzy aktywności, jeden Slot Wnętrza. Trudną robotę wstaw w najlepsze okno cyklu.', 'pozycja', 80)
const MONTH_CLOSE = t('domkniecie', 'Domknięcie miesiąca', '10 rzeczy zrobionych dobrze, 5 do poprawy, 3 priorytety na następny miesiąc. Potem ceremonia miesiąca w Przeglądzie.', 'pozycja', 150)

const ALL_TEMPLATES = new Map(
  [...ANCHORS, ...REACH, SUNDAY_PLAN, MONTH_CLOSE].map(tpl => [tpl.key, tpl]),
)

const ID_PREFIX = 'ev_'

function utcDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

function isLastDayOfMonth(dateKey: string): boolean {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate() === d
}

function toQuest(dateKey: string, tpl: EvergreenTemplate): AprilQuest {
  // Id niesie datę, więc quest da się odtworzyć po samym id (przeniesienia, eksport).
  return { id: `${ID_PREFIX}${dateKey}_${tpl.key}`, date: dateKey, title: tpl.title, description: tpl.description, pillar: tpl.pillar, xp: tpl.xp }
}

export function getEvergreenQuestsForDate(dateKey: string): AprilQuest[] {
  const day = utcDay(dateKey)
  // 1970-01-01 był czwartkiem → (day + 4) % 7 daje getUTCDay.
  const weekday = (day + 4) % 7
  const second = isLastDayOfMonth(dateKey)
    ? MONTH_CLOSE
    : weekday === 0
      ? SUNDAY_PLAN
      : REACH[day % REACH.length]
  return [toQuest(dateKey, ANCHORS[weekday]), toQuest(dateKey, second)]
}

export function isEvergreenQuestId(id: string): boolean {
  return id.startsWith(ID_PREFIX)
}

export function findEvergreenQuest(id: string): AprilQuest | undefined {
  const m = /^ev_(\d{4}-\d{2}-\d{2})_(.+)$/.exec(id)
  if (!m) return undefined
  const tpl = ALL_TEMPLATES.get(m[2])
  return tpl ? toQuest(m[1], tpl) : undefined
}
