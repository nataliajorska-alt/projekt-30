// Plan dnia od asystentki — czytanie bloków godzinowych z tekstu planu.
// Dzięki temu apka wie, co wg planu dzieje się TERAZ i co jest następne,
// zamiast pokazywać plan jako ścianę tekstu. Czyste funkcje, bez Reacta.

import { DAY_START_HOUR } from './gameLogic'
import { parseInline, inlineText, type MdBlock } from './miniMarkdown'

export interface PlanBlock {
  /** Minuty od północy dnia planu. Po północy rosną dalej (00:30 w nocy = 1470). */
  start: number
  end: number
  label: string
  /** Nagłówek sekcji planu nad tym blokiem (np. „Rano"), jeśli był. */
  section: string | null
}

const DAY = 24 * 60
const T = String.raw`(\d{1,2})[:.](\d{2})`
// 07:30–08:15 · 7.30 - 8.15 · 07:30 do 08:15
const RANGE = new RegExp(`^${T}\\s*(?:–|—|-|−|do)\\s*${T}(?![\\d.])`)
// Sama godzina na początku linii: „07:00 — pobudka". (?![\d.]) odsiewa daty typu 5.04.2027.
const SINGLE = new RegExp(`^${T}(?![\\d.:])`)
// Znaczniki przed godziną: punktor, numer, nagłówek, pogrubienie, pole wyboru.
const LEAD = /^\s*(?:#{1,6}\s+|[-*•]\s+|\d{1,3}[.)]\s+)?(?:\[[ xX]?\]\s*)?[*_`~\s]*/
const MINIMUM_START = /^\s*(?:#{1,6}\s+|\*\*\s*)?[^a-ząćęłńóśźż]*wersja minimum/i
const HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/

function toMinutes(h: string, m: string): number | null {
  const hh = Number(h), mm = Number(m)
  if (hh > 24 || mm > 59 || (hh === 24 && mm > 0)) return null
  return hh * 60 + mm
}

function cleanLabel(rest: string): string {
  const stripped = rest.replace(/^[\s*_`~]*[—–\-−:·|]*\s*/, '')
  return inlineText(parseInline(stripped)).replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Wyciąga bloki „od–do — co" z planu. Sekcja „Wersja minimum" kończy czytanie —
 * to zapasowa lista, nie dalszy ciąg dnia. Linie bez godziny są pomijane.
 */
export function parsePlanBlocks(text: string): PlanBlock[] {
  type Raw = { start: number; end: number | null; label: string; section: string | null }
  const raw: Raw[] = []
  let section: string | null = null
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const body = line.replace(LEAD, '')
    const r = RANGE.exec(body)
    if (r) {
      const start = toMinutes(r[1], r[2]), end = toMinutes(r[3], r[4])
      if (start === null || end === null) continue
      const label = cleanLabel(body.slice(r[0].length))
      if (label) raw.push({ start, end, label, section })
      continue
    }
    const s = SINGLE.exec(body)
    if (s) {
      const start = toMinutes(s[1], s[2])
      if (start === null) continue
      const label = cleanLabel(body.slice(s[0].length))
      if (label) raw.push({ start, end: null, label, section })
      continue
    }
    // Dopiero linia BEZ godziny może otwierać sekcję minimum — blok
    // „22:00–22:15 — wersja minimum rutyny" to nadal zwykły blok planu.
    if (MINIMUM_START.test(line)) break
    const h = HEADING.exec(line)
    if (h) section = cleanLabel(h[1]) || null
  }

  // Po północy: wczesna godzina po późnej to dalszy ciąg tego samego dnia.
  const nightLimit = (DAY_START_HOUR + 3) * 60
  let wrapped = false
  let latest = -1
  const timed = raw.map(b => {
    if (!wrapped && latest >= 0 && b.start < nightLimit && b.start + 120 < latest) wrapped = true
    const start = b.start + (wrapped && b.start < nightLimit ? DAY : 0)
    let end = b.end === null ? null : b.end + (wrapped && b.end < nightLimit ? DAY : 0)
    if (end !== null && end <= start) end += DAY
    latest = Math.max(latest, start)
    return { start, end, label: b.label, section: b.section }
  })

  timed.sort((a, b) => a.start - b.start)
  return timed.map((b, i) => {
    const nextStart = timed.slice(i + 1).find(n => n.start > b.start)?.start
    return { start: b.start, end: b.end ?? nextStart ?? b.start + 30, label: b.label, section: b.section }
  })
}

/** Zegar w minutach planu: przed 3:00 w nocy to wciąż „wczorajszy" dzień (+24 h). */
export function planClockMinutes(now: Date): number {
  const m = now.getHours() * 60 + now.getMinutes()
  return now.getHours() < DAY_START_HOUR ? m + DAY : m
}

export function formatClock(minutes: number): string {
  const m = ((minutes % DAY) + DAY) % DAY
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** „45 min", „1 h", „1 h 15 min". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

export interface PlanPosition {
  /** Blok trwający teraz (gdy kilka się nakłada — ten, który zaczął się najpóźniej). */
  current: PlanBlock | null
  next: PlanBlock | null
  /** Ile bloków już minęło. */
  passed: number
  /** Minuty do końca bieżącego bloku. */
  minutesLeft: number | null
}

export function locateInPlan(blocks: PlanBlock[], nowMin: number): PlanPosition {
  let current: PlanBlock | null = null
  let next: PlanBlock | null = null
  let passed = 0
  for (const b of blocks) {
    if (b.end <= nowMin) passed++
    else if (b.start <= nowMin) { if (!current || b.start >= current.start) current = b }
    else if (!next || b.start < next.start) next = b
  }
  return { current, next, passed, minutesLeft: current ? current.end - nowMin : null }
}

const isMinimumTitle = (b: MdBlock): boolean => {
  if (b.type === 'heading') return /wersja minimum/i.test(inlineText(b.inline))
  if (b.type === 'paragraph' && b.lines.length === 1) {
    const text = inlineText(b.lines[0])
    return /^wersja minimum/i.test(text.trim()) && text.length < 60
  }
  return false
}

/**
 * „Wersja minimum" z planu — trzy rzeczy, które ratują dzień, gdy się posypie.
 * Zwraca bloki pod tym nagłówkiem (do następnego nagłówka tej samej wagi).
 */
export function minimumSection(blocks: MdBlock[]): MdBlock[] {
  const i = blocks.findIndex(isMinimumTitle)
  if (i === -1) return []
  const title = blocks[i]
  const level = title.type === 'heading' ? title.level : 4
  const out: MdBlock[] = []
  for (let j = i + 1; j < blocks.length; j++) {
    const b = blocks[j]
    if (b.type === 'heading' && b.level <= level) break
    if (b.type === 'rule' && out.length > 0) break
    if (b.type !== 'rule') out.push(b)
  }
  return out
}
