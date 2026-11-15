// Przykładowe odpowiedzi asystentki dla trybu sandbox (`npm run dev:sandbox`).
// Pozwalają obejrzeć cały przepływ — strumień, zapis planu, „teraz wg planu",
// wczytanie miesiąca — bez klucza API i bez wysyłania czegokolwiek do Anthropic.
// To NIE jest odpowiedź modelu i ekran oznacza ją jako demo.

import type { CoachKind } from '../coach'

const pad = (n: number) => String(n).padStart(2, '0')
const clock = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`

function sectionFor(min: number): string {
  if (min < 12 * 60) return 'Rano'
  if (min < 17 * 60) return 'Dzień'
  return 'Wieczór'
}

const CAL_RANGE = /^(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})\s*(.*)$/
const CAL_SINGLE = /^(\d{1,2})[:.](\d{2})\s+(.*)$/

/** Punkty z sekcji „Moje rzeczy z kalendarza" — do następnego nagłówka. */
function calendarEntries(prompt: string) {
  const after = prompt.split('## Moje rzeczy z kalendarza')[1] ?? ''
  const lines: string[] = []
  for (const line of after.split('\n').slice(1)) {
    if (line.startsWith('#')) break
    const item = line.replace(/^-\s*/, '').trim()
    if (item && !item.startsWith('Brak stałych punktów')) lines.push(item)
  }
  const fixed: { start: number; end: number; label: string }[] = []
  const loose: string[] = []
  for (const item of lines) {
    const r = CAL_RANGE.exec(item)
    const s = r ? null : CAL_SINGLE.exec(item)
    if (r) fixed.push({ start: +r[1] * 60 + +r[2], end: +r[3] * 60 + +r[4], label: r[5] || 'z kalendarza' })
    else if (s) fixed.push({ start: +s[1] * 60 + +s[2], end: +s[1] * 60 + +s[2] + 60, label: s[3] })
    else loose.push(item)
  }
  return { fixed: fixed.sort((a, b) => a.start - b.start), loose }
}

function demoDay(prompt: string): string {
  const isToday = prompt.includes('resztę dzisiejszego dnia')
  const now = /jest (\d{1,2}):(\d{2})/.exec(prompt)
  // „Dziś": zaczynamy od bieżącej połówki godziny, żeby było widać blok „teraz".
  let t = isToday && now ? Math.floor((Number(now[1]) * 60 + Number(now[2])) / 30) * 30 : 7 * 60
  if (t < 3 * 60) t += 24 * 60

  const quest = /^- \*\*(.+?)\*\* _\(filar/m.exec(prompt)?.[1] ?? 'najtrudniejsza rzecz dnia'
  const { fixed, loose } = calendarEntries(prompt)
  const pending = fixed.filter(f => f.end > t)

  const steps: [number, string][] = [
    [30, 'kotwica: szklanka wody i jedna rzecz z rutyny — bez decyzji, po prostu start'],
    [45, `**${quest}** — telefon w drugim pokoju, jedno okno. To jest blok, po którym dzień już się liczy`],
    [15, 'przerwa: wstań, woda, okno'],
    [30, 'posiłek przy stole, bez ekranu'],
    ...loose.map((c): [number, string] => [45, c]),
    [40, 'drugi blok pracy — domknij to, co zaczęte, nic nowego'],
    [20, 'przerwa na spacer wokół bloku, szklanka wody po powrocie'],
    [45, 'rutyna dnia: punkty z listy „w ciągu dnia", po kolei'],
    [30, 'przekąska i 10 minut ciszy'],
    [45, 'lekki blok: porządki, wiadomości, drobiazgi'],
    [30, 'kolacja'],
    [45, 'rutyna wieczorna i trzy zdania o dniu'],
    [30, 'wyciszenie: książka, telefon poza sypialnią'],
  ]

  const out: string[] = [
    isToday
      ? 'Zostało jeszcze sporo dnia — wystarczy, że następny blok będzie Twój.'
      : 'Jutro nie musi być idealne. Ma mieć dobry start i jedną rzecz, z której będziesz dumna.',
    '',
  ]
  let section = ''
  const push = (start: number, end: number, label: string) => {
    const s = sectionFor(start % (24 * 60))
    if (s !== section) { out.push(`## ${s}`); section = s }
    out.push(`- **${clock(start)}–${clock(end)}** — ${label}`)
  }
  const stop = 23 * 60 + 30
  for (const [len, label] of steps) {
    // Stały punkt z kalendarza wchodzi, zanim kolejny blok by na niego najechał.
    while (pending.length && t + len > pending[0].start) {
      const f = pending.shift()!
      if (f.start > t) push(t, f.start, 'bufor: woda, zbierz rzeczy, wyjdź spokojnie')
      push(Math.max(t, f.start), f.end, `**${f.label}** (z kalendarza)`)
      t = f.end
    }
    if (t + len > stop) break
    push(t, t + len, label)
    t += len
  }
  for (const f of pending) { push(f.start, f.end, `**${f.label}** (z kalendarza)`); t = Math.max(t, f.end) }
  out.push(`- **${clock(t)}** — sen`, '')
  out.push('## Wersja minimum', '- szklanka wody i jeden punkt rutyny', `- 25 minut nad: ${quest}`, '- telefon poza sypialnią przed snem')
  return out.join('\n')
}

const MONTH_POOL: [string, number, string, string][] = [
  ['kariera', 100, 'Blok głębokiej pracy', 'Jedno zadanie, 45 minut, telefon w drugim pokoju.'],
  ['cialo', 60, 'Ruch przed południem', 'Jeśli jest rano i nie pada — 30 minut spaceru, bez słuchawek.'],
  ['tozsamosc', 60, 'Slot Wnętrza', 'Dziesięć minut pisania odręcznie: co dziś było moje?'],
  ['kapital', 80, 'Kwadrans z finansami', 'Sprawdź konto, zapisz trzy ostatnie wydatki, nic więcej.'],
  ['milosc', 50, 'Jedna wiadomość', 'Napisz do osoby, o której pomyślałaś w tym tygodniu.'],
  ['styl', 50, 'Zestaw na jutro', 'Ubranie wybrane i odwieszone wieczorem.'],
  ['pozycja', 80, 'Głos na spotkaniu', 'Jedno zdanie wypowiedziane na głos, zanim skończy się pierwsze 10 minut.'],
]

function demoMonth(prompt: string): string {
  const dates = Array.from(prompt.matchAll(/^(\d{4}-\d{2}-\d{2}) \(/gm), m => m[1])
  const lines: string[] = []
  dates.forEach((date, i) => {
    const perDay = i % 4 === 3 ? 1 : 2
    for (let k = 0; k < perDay; k++) {
      const [pillar, xp, title, desc] = MONTH_POOL[(i * 2 + k) % MONTH_POOL.length]
      lines.push(`${date} | ${pillar} | ${xp} | ${title} | ${desc}`)
    }
  })
  return lines.join('\n')
}

export function demoAnswer(kind: CoachKind, prompt: string): string {
  return kind === 'month' ? demoMonth(prompt) : demoDay(prompt)
}
