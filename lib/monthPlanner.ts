// Planer miesiąca: prognoza cyklu na dni miesiąca, szkic questów według zasad
// z lipca/sierpnia, prompt dla Claude i parser wklejonego planu.
//
// Zasady szkicu (z nagłówków julyData/augustData):
//  • trudna robota w folikularnej/owulacyjnej (3 questy, w tym JEDEN „projekt"),
//    lutealna 2 questy (domykanie, nie zaczynanie), okres 2 miękkie;
//  • maksymalnie jeden „projekt" dziennie — jeśli dzień rośnie, tnij;
//  • rytm 3/3 aktywności (pn/śr/pt), w okresie ruch łagodny;
//  • niedziela = Slot Wnętrza + plan tygodnia; czwartek = pytanie miesiąca;
//  • 1. dzień brain dump, 15. półmetek, przedostatni szkic następnego, ostatni domknięcie.

import { computePhaseRanges, type CyclePhase, type CycleSettings } from './cycle-data'
import { PILLARS } from './pillars'
import type { AprilQuest } from './seasonal/aprilData'
import type { Pillar } from '@/types'

export type PhaseId = CyclePhase['id']

export interface DayPhase {
  phase: PhaseId
  cycleDay: number
  /** true, gdy dzień leży poza bieżącym zalogowanym cyklem (czysta prognoza). */
  projected: boolean
}

const PL_WEEKDAYS = ['nd', 'pn', 'wt', 'śr', 'czw', 'pt', 'sob']
const PL_MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
export const PHASE_LABEL: Record<PhaseId, string> = {
  menstruacja: 'okres',
  folikularna: 'folikularna',
  owulacyjna: 'owulacja',
  lutealna: 'lutealna',
}

function utcDays(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

export function monthDays(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number)
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: n }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, '0')}`)
}

export function weekdayOf(dateKey: string): number {
  return (utcDays(dateKey) + 4) % 7 // 1970-01-01 = czwartek
}

export function weekdayLabel(dateKey: string): string {
  return PL_WEEKDAYS[weekdayOf(dateKey)]
}

export function nextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/**
 * Prognoza fazy cyklu na dowolny dzień: od ostatniego zalogowanego startu
 * odkładamy kolejne cykle co cycleLength. Przed pierwszym startem — brak danych.
 */
export function projectPhase(
  lastStart: string | null,
  settings: CycleSettings,
): (dateKey: string) => DayPhase | null {
  if (!lastStart) return () => null
  const ranges = computePhaseRanges(settings)
  const start = utcDays(lastStart)
  return (dateKey: string) => {
    const since = utcDays(dateKey) - start
    if (since < 0) return null
    const cycleDay = (since % settings.cycleLength) + 1
    const phase = (Object.keys(ranges) as PhaseId[]).find(id => cycleDay >= ranges[id][0] && cycleDay <= ranges[id][1]) ?? 'lutealna'
    return { phase, cycleDay, projected: since >= settings.cycleLength }
  }
}

// ── Biblioteka questów szkicu ────────────────────────────────────────

interface Tpl { title: string; description: string; pillar: Pillar; xp: number }
const tpl = (title: string, description: string, pillar: Pillar, xp: number): Tpl => ({ title, description, pillar, xp })

// „Projekt" dnia — tylko w folikularnej/owulacyjnej, max jeden dziennie.
const PROJECT_FOLLICULAR: Tpl[] = [
  tpl('Najtrudniejsza rzecz miesiąca — teraz', 'To, czego unikasz najdłużej. Najlepsze okno energii w Twoich danych jest właśnie teraz — nie czekaj na lepszy dzień, bo go nie będzie.', 'kariera', 100),
  tpl('Blok głębokiej pracy 90 min', 'Jedno zadanie, telefon w drugim pokoju, timer. Kariera i finanse dostają pełną uwagę, nie resztki dnia.', 'kariera', 100),
  tpl('Trudna rozmowa albo decyzja', 'Zapisz przewidywanie i procent wiary. Po rozmowie jedno zdanie: co się faktycznie stało. To zdanie jest ważniejsze niż cała rozmowa.', 'pozycja', 100),
  tpl('Aplikacja, oferta albo pitch', 'Wyślij dziś, nie „jak będzie idealne". Gotowe jest lepsze niż doskonałe.', 'kariera', 100),
  tpl('Domknij pętlę z listy', 'Weź jedną pętlę z brain dumpu i zamknij ją: zrób albo napisz jedno zdanie, że nie robisz. Oba domykają.', 'pozycja', 100),
]
const PROJECT_OVULATORY: Tpl[] = [
  tpl('Widoczność: jeden odważny ruch', 'Post, prośba, wystąpienie, wiadomość do kogoś „poza zasięgiem". Magnetyzm jest teraz najwyższy — użyj go.', 'kapital', 100),
  tpl('Nowy kontakt zawodowy', 'Jedna nowa osoba: kawa, call albo konkretna wiadomość z pytaniem. Własny obieg buduje się z pojedynczych ruchów.', 'kapital', 100),
  tpl('Spotkanie z pełni', 'Wieczór albo wyjście, na które masz ochotę, nie obowiązek. Obecność, nie analiza.', 'kapital', 80),
]
// Lutealna: kończ, nie zaczynaj.
const LUTEAL: Tpl[] = [
  tpl('Domknij, nie zaczynaj', 'Jedna rzecz rozgrzebana — dokończ ją albo świadomie odłóż z datą. Nowe inicjatywy poczekają na folikularną.', 'pozycja', 60),
  tpl('Rutyna wieczorna na pełno', 'Wcześniej ekran off, ciepły prysznic, kartka obok łóżka. W tej fazie wieczór jest kotwicą.', 'cialo', 60),
  tpl('Konstruktywne martwienie się, 15 min', 'Wczesnym wieczorem, minimum 2h przed snem: zmartwienie i następny krok. Kartkę zostaw obok łóżka. O 2:00 nic lepszego nie wymyślisz.', 'pozycja', 60),
  tpl('Blok Serca', 'Jeśli w tym tygodniu nie był domknięty — otwórz go teraz. Wrażliwość rośnie, daj jej miejsce zamiast walczyć.', 'milosc', 80),
  tpl('Porządek jednej przestrzeni', 'Biurko, szafka albo torebka. 20 minut, jedna rzecz podnosząca estetykę.', 'styl', 50),
  tpl('List współczujący, 15 min', 'Co jest trudne, że to zwyczajnie ludzkie, jeden życzliwy następny krok. Nie „jestem wspaniała" — „to jest trudne i wolno mi to czuć".', 'pozycja', 60),
]
const MENSTRUAL: Tpl[] = [
  tpl('Ciało na miękko', 'Magnez, ciepło, rozciąganie albo świadomy odpoczynek. Odpoczynek też jest decyzją, nie porażką.', 'cialo', 50),
  tpl('Wcześniej do łóżka', 'Godzinę wcześniej niż zwykle, z książką zamiast telefonu.', 'cialo', 50),
  tpl('Odpuść jedną rzecz bez winy', 'Wybierz jedno „powinnam" i świadomie je skreśl na dziś. Tryb minimum to strategia, nie porażka.', 'pozycja', 50),
  tpl('Lektura zamiast scrolla', '20 minut czytania w miejscu, które lubisz.', 'tozsamosc', 50),
]
// Wypełniacze — lekkie, rotują przez miesiąc.
const FILLERS: Tpl[] = [
  tpl('Kontakt z pełni', 'Jedna ciepła wiadomość albo telefon do kogoś, kogo chcesz więcej w swoim życiu.', 'kapital', 60),
  tpl('Finanse: 15 minut przeglądu', 'Wydatki z ostatnich dni i jedna decyzja: anulować, przesunąć albo odłożyć. Spokój po działaniu, nie przed.', 'kariera', 60),
  tpl('Jedna klatka dnia', 'Aparat analogowy albo telefon: jedno zdjęcie czegoś, co dziś było piękne. Potem do Photo Timeline.', 'tozsamosc', 50),
  tpl('Poranne światło + stała pobudka', '10 minut na zewnątrz zaraz po wstaniu. Kontrola bodźców — jedna z niewielu rzeczy, które na sen realnie działają.', 'cialo', 60),
  tpl('45 minut nauki', 'Jeden temat, jedna sesja, telefon w drugim pokoju.', 'tozsamosc', 60),
  tpl('Styl ponad komfort', 'Ubierz się lepiej niż „wystarczy", także w domu. Poczuj różnicę.', 'styl', 50),
  tpl('Życioumilacz', 'Kwiaty dla siebie, książka w kawiarni, ulubiona herbata. Pozwolenie, nie zadanie.', 'styl', 50),
  tpl('List do Skarbca', 'Kilka zdań do siebie z przyszłości albo na trudną chwilę. Napisane w dobry dzień, czytane w zły.', 'tozsamosc', 60),
]

export interface DraftInput {
  monthKey: string
  phaseFor: (dateKey: string) => DayPhase | null
  question?: string
  nextMonthName?: string
}

/** Szkic całego miesiąca. Deterministyczny — ten sam wejściowy stan daje ten sam szkic. */
export function draftMonth({ monthKey, phaseFor, question, nextMonthName }: DraftInput): AprilQuest[] {
  const days = monthDays(monthKey)
  const out: AprilQuest[] = []
  const counters = new Map<Tpl[], number>()
  const take = (pool: Tpl[], avoid: Set<string>): Tpl => {
    let i = counters.get(pool) ?? 0
    for (let k = 0; k < pool.length; k++) {
      const t = pool[(i + k) % pool.length]
      if (!avoid.has(t.title)) { counters.set(pool, i + k + 1); return t }
    }
    counters.set(pool, i + 1)
    return pool[i % pool.length]
  }
  let weekN = 0
  const sundays = days.filter(d => weekdayOf(d) === 0).length

  days.forEach((date, idx) => {
    const dom = idx + 1
    const wd = weekdayOf(date)
    const ph = phaseFor(date)?.phase ?? null
    const day: Tpl[] = []
    const isLast = dom === days.length
    const isPenultimate = dom === days.length - 1

    // Stałe punkty miesiąca
    if (dom === 1) {
      day.push(tpl('Brain dump miesiąca + dwie kolumny', 'Kartka, 15 min: wszystko, co wisi. Dwie kolumny: pętle z unikania (zamykasz w tym miesiącu) i procesy (nie zamykasz — i to jest decyzja, nie porażka). Każdej pętli przypisz konkretny dzień.', 'pozycja', 80))
    }
    if (dom === 15) {
      day.push(tpl('Półmetek: co działa, co tnę', '10 minut: co z planu naprawdę działa, a co tylko wisi. Skreśl albo przenieś jedną rzecz — plan ma służyć Tobie, nie odwrotnie.', 'pozycja', 80))
    }
    if (isPenultimate) {
      day.push(tpl(`Rozpisz ${nextMonthName ? `„${nextMonthName}"` : 'następny miesiąc'}`, 'Plan miesiąca w apce: szkic z cyklu, potem przytnij i dopisz swoje stałe punkty. Miesiąc zaczyna się dobrze, gdy zaczyna się z planem.', 'pozycja', 80))
    }
    if (isLast) {
      day.push(tpl('Domknięcie miesiąca', '10 rzeczy zrobionych dobrze, 5 do poprawy, 3 priorytety na następny miesiąc. Potem ceremonia miesiąca w Przeglądzie.', 'pozycja', 150))
    }
    if (wd === 0) {
      weekN++
      day.push(tpl(`Slot Wnętrza 60 min (${weekN}/${sundays})`, 'Godzina na stałej porze, bez telefonu. Biblia, medytacja, list współczujący albo cisza — w środku, nie na pokaz.', 'pozycja', 100))
      if (!isLast && !isPenultimate) day.push(tpl('Plan tygodnia na kartce', 'Trzy główne rzeczy, trzy aktywności. Trudną robotę wstaw w najlepsze okno cyklu.', 'pozycja', 60))
    }
    if (wd === 4 && question) {
      day.push(tpl('Pytanie miesiąca — 10 minut z kartką', `„${question}" Odpowiedz konkretnie, jednym dniem z tego tygodnia.`, 'tozsamosc', 60))
    }
    if (wd === 1 || wd === 3 || wd === 5) {
      // Po dniu tygodnia, nie licznikiem — miesiąc zaczynający się w środę też ma pn = 1/3.
      const activityN = wd === 1 ? 1 : wd === 3 ? 2 : 3
      day.push(ph === 'menstruacja'
        ? tpl(`Ruch łagodny (${activityN}/3)`, 'Spacer, joga albo rozciąganie. W okresie ruch ma koić, nie dowodzić.', 'cialo', 60)
        : tpl(`Aktywność ${activityN}/3`, 'Szarfy, pole, trening albo szybki spacer — z konkretną godziną. Ruch nie musi być zasłużony.', 'cialo', 60))
    }

    // Gęstość wg fazy; bez danych o cyklu — 2 dziennie.
    const target = ph === 'folikularna' || ph === 'owulacyjna' ? 3 : 2
    const avoid = new Set(day.map(t => t.title))
    const hasFixedHeavy = dom === 1 || isLast || isPenultimate || wd === 0
    if (day.length < target && !hasFixedHeavy && (ph === 'folikularna' || ph === 'owulacyjna')) {
      const t = take(ph === 'folikularna' ? PROJECT_FOLLICULAR : PROJECT_OVULATORY, avoid)
      day.push(t); avoid.add(t.title)
    }
    while (day.length < target) {
      // Lutealna trwa ~12 dni — co drugi dzień lekki wypełniacz, żeby pula się nie zapętlała.
      const pool = ph === 'lutealna' ? (dom % 2 === 0 ? LUTEAL : FILLERS) : ph === 'menstruacja' ? MENSTRUAL : FILLERS
      const t = take(pool, avoid)
      day.push(t); avoid.add(t.title)
    }

    day.forEach((t, i) => out.push({ id: `mp_${date}_${i + 1}`, date, ...t }))
  })
  return out
}

// ── Prompt dla Claude i parser wklejonego planu ─────────────────────

export interface PromptInput {
  monthKey: string
  name: string
  motto: string
  question?: string
  phaseFor: (dateKey: string) => DayPhase | null
}

export function buildClaudePrompt({ monthKey, name, motto, question, phaseFor }: PromptInput): string {
  const [y, m] = monthKey.split('-').map(Number)
  const lines = monthDays(monthKey).map(d => {
    const ph = phaseFor(d)
    const phase = ph ? ` · ${PHASE_LABEL[ph.phase]}, dzień cyklu ${ph.cycleDay}${ph.projected ? ' (prognoza)' : ''}` : ''
    return `${d} (${weekdayLabel(d)})${phase}`
  })
  const pillars = PILLARS.map(p => `${p.id} = ${p.name}`).join('; ')
  return [
    `Rozpisz mi questy na miesiąc ${PL_MONTHS_GEN[m - 1]} ${y} w Projekcie 30 (droga do moich 30. urodzin, 5.04.2027).`,
    ``,
    `Hasło miesiąca: ${name}`,
    `Motto: ${motto}`,
    question ? `Pytanie miesiąca: ${question}` : '',
    ``,
    `Mój kontekst na ten miesiąc (uzupełnij przed wysłaniem): praca / terapia / wyjazdy / ludzie / pętle do zamknięcia / czego chcę od tego miesiąca.`,
    ``,
    `Zasady:`,
    `- folikularna i owulacja: 3 questy dziennie, w tym maksymalnie JEDEN „projekt" (trudna rzecz); lutealna: 2, domykanie zamiast zaczynania; okres: 1–2 miękkie`,
    `- rytm 3 aktywności w tygodniu; niedziela: Slot Wnętrza + plan tygodnia; ostatni dzień: domknięcie miesiąca`,
    `- konkretnie, z formatem „jeśli jest wtorek rano, to…", nie intencje; ton ciepły, bez presji`,
    `- XP: 50–60 lekkie, 80 średnie, 100 projekt, 150 domknięcie`,
    ``,
    `Dni i fazy cyklu:`,
    ...lines,
    ``,
    `Filary (użyj id): ${pillars}`,
    ``,
    `Odpowiedz WYŁĄCZNIE liniami w formacie (jedna linia = jeden quest, bez nagłówków):`,
    `RRRR-MM-DD | filar | xp | tytuł | opis`,
  ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n')
}

const PILLAR_ALIASES: Record<string, Pillar> = Object.fromEntries(
  PILLARS.flatMap(p => [
    [p.id, p.id],
    [p.shortName.toLowerCase(), p.id],
    [p.name.toLowerCase(), p.id],
  ]),
) as Record<string, Pillar>

export interface ParseResult {
  quests: AprilQuest[]
  errors: { line: number; text: string; reason: string }[]
}

/**
 * Parser planu wklejonego z Claude: `RRRR-MM-DD | filar | xp | tytuł | opis`.
 * Toleruje punktory markdown, backticki, sam numer dnia zamiast daty i brak opisu.
 */
export function parsePlanText(text: string, monthKey: string): ParseResult {
  const quests: AprilQuest[] = []
  const errors: ParseResult['errors'] = []
  const perDay = new Map<string, number>()
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').replace(/`/g, '').trim()
    if (!line || !line.includes('|')) return
    const cells = line.split('|').map(c => c.trim())
    if (cells[0] === '') cells.shift() // tabela markdown: | a | b |
    if (cells[cells.length - 1] === '') cells.pop()
    if (/^-+$/.test(cells[0] ?? '') || /^rrrr|^data$/i.test(cells[0] ?? '')) return // separator/nagłówek tabeli
    const [d, p, x, title, ...rest] = cells
    let date = d ?? ''
    if (/^\d{1,2}$/.test(date)) date = `${monthKey}-${date.padStart(2, '0')}`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push({ line: i + 1, text: raw, reason: 'brak daty' }); return }
    if (!date.startsWith(monthKey)) { errors.push({ line: i + 1, text: raw, reason: 'data spoza miesiąca' }); return }
    const pillar = PILLAR_ALIASES[(p ?? '').toLowerCase()]
    if (!pillar) { errors.push({ line: i + 1, text: raw, reason: `nieznany filar „${p}"` }); return }
    const xp = parseInt((x ?? '').replace(/\D/g, ''), 10)
    if (!title) { errors.push({ line: i + 1, text: raw, reason: 'brak tytułu' }); return }
    const n = (perDay.get(date) ?? 0) + 1
    perDay.set(date, n)
    quests.push({
      id: `mp_${date}_${n}`,
      date,
      title,
      description: rest.join(' | '),
      pillar,
      xp: Number.isFinite(xp) && xp > 0 ? xp : 60,
    })
  })
  return { quests, errors }
}
