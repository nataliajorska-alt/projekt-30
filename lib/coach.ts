// Asystentka — wspólne typy i stałe dla trasy /api/coach i dla klienta.
// Czysty moduł: bez SDK, bez Reacta, bez Firestore — testowalny node'em.

export type CoachKind = 'day' | 'month'
export const COACH_KINDS: readonly CoachKind[] = ['day', 'month']

/**
 * Najdłuższy prompt, jaki przyjmujemy. Dłuższy odrzucamy wprost, z komunikatem —
 * nigdy nie ucinamy po cichu, bo wtedy asystentka planowałaby z połowy danych.
 * Brief dnia ma ~4 tys. znaków, prompt miesiąca z danymi ~8 tys.
 */
export const MAX_PROMPT_CHARS = 60_000

/** Dzienny limit zapytań — bezpiecznik kosztów, nie ograniczenie w zwykłym użyciu. */
export const DAILY_REQUEST_CAP = 40

export type CoachErrorCode =
  | 'not_configured'
  | 'unauthorized'
  | 'forbidden'
  | 'bad_request'
  | 'too_long'
  | 'daily_cap'
  | 'refusal'
  | 'rate_limit'
  | 'overloaded'
  | 'billing'
  | 'api_key'
  | 'connection'
  | 'interrupted'
  | 'offline'
  | 'unknown'

/** Tekst dla człowieka — jedno źródło dla serwera i klienta. */
export const COACH_ERROR_TEXT: Record<CoachErrorCode, string> = {
  not_configured: 'Asystentka nie jest jeszcze włączona na serwerze.',
  unauthorized: 'Sesja wygasła — zaloguj się ponownie i spróbuj jeszcze raz.',
  forbidden: 'To konto nie ma dostępu do asystentki.',
  bad_request: 'Zapytanie nie przeszło — odśwież stronę i spróbuj ponownie.',
  too_long: 'Brief jest za długi, żeby go wysłać w całości. Skróć notatki z kalendarza.',
  daily_cap: 'Dzienny limit zapytań do asystentki wyczerpany. Wróci jutro o 3:00.',
  refusal: 'Asystentka odmówiła odpowiedzi na ten brief. Zmień notatki i spróbuj ponownie.',
  rate_limit: 'Za dużo zapytań naraz — odczekaj minutę i spróbuj ponownie.',
  overloaded: 'Serwery Claude są chwilowo przeciążone. Spróbuj za moment.',
  billing: 'Konto Anthropic nie ma środków albo zapytanie zostało odrzucone — sprawdź saldo w konsoli Anthropic.',
  api_key: 'Klucz Anthropic na serwerze jest nieprawidłowy albo wygasł.',
  connection: 'Nie udało się połączyć z Claude. Sprawdź internet i spróbuj ponownie.',
  interrupted: 'Odpowiedź urwała się w połowie.',
  offline: 'Asystentka potrzebuje internetu — bez zasięgu nie odpowie.',
  unknown: 'Coś poszło nie tak po stronie asystentki.',
}

/** Zdarzenia strumienia: jedna linia JSON = jedno zdarzenie (NDJSON). */
export type CoachEvent =
  | { type: 'text'; text: string }
  /** `truncated` — model doszedł do limitu długości, odpowiedź może być niepełna. */
  | { type: 'done'; truncated: boolean; model: string; demo?: boolean }
  | { type: 'error'; code: CoachErrorCode; message: string; detail?: string }

export const encodeCoachEvent = (e: CoachEvent): string => JSON.stringify(e) + '\n'

const ERROR_CODES = new Set<string>(Object.keys(COACH_ERROR_TEXT))

function toEvent(raw: unknown): CoachEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.type === 'text' && typeof o.text === 'string') return { type: 'text', text: o.text }
  if (o.type === 'done') {
    return {
      type: 'done',
      truncated: o.truncated === true,
      model: typeof o.model === 'string' ? o.model : '',
      ...(o.demo === true ? { demo: true } : {}),
    }
  }
  if (o.type === 'error') {
    const code = (typeof o.code === 'string' && ERROR_CODES.has(o.code) ? o.code : 'unknown') as CoachErrorCode
    return {
      type: 'error',
      code,
      message: typeof o.message === 'string' && o.message ? o.message : COACH_ERROR_TEXT[code],
      ...(typeof o.detail === 'string' && o.detail ? { detail: o.detail } : {}),
    }
  }
  return null
}

/**
 * Wyjmuje z bufora pełne linie-zdarzenia. Niedokończoną ostatnią linię oddaje
 * w `rest` — sieć tnie strumień w dowolnym miejscu, także w środku znaku JSON.
 * Linie, których nie da się odczytać, pomijamy (nie wywracają całej odpowiedzi).
 */
export function drainCoachEvents(buffer: string): { events: CoachEvent[]; rest: string } {
  const events: CoachEvent[] = []
  let start = 0
  for (;;) {
    const nl = buffer.indexOf('\n', start)
    if (nl === -1) break
    const line = buffer.slice(start, nl).trim()
    start = nl + 1
    if (!line) continue
    try {
      const ev = toEvent(JSON.parse(line))
      if (ev) events.push(ev)
    } catch { /* uszkodzona linia — pomijamy */ }
  }
  return { events, rest: buffer.slice(start) }
}

/** Walidacja ciała zapytania — ta sama po obu stronach. */
export function checkCoachRequest(body: unknown):
  | { ok: true; kind: CoachKind; prompt: string }
  | { ok: false; code: 'bad_request' | 'too_long' } {
  if (!body || typeof body !== 'object') return { ok: false, code: 'bad_request' }
  const { kind, prompt } = body as Record<string, unknown>
  if (typeof kind !== 'string' || !(COACH_KINDS as readonly string[]).includes(kind)) return { ok: false, code: 'bad_request' }
  if (typeof prompt !== 'string' || !prompt.trim()) return { ok: false, code: 'bad_request' }
  if (prompt.length > MAX_PROMPT_CHARS) return { ok: false, code: 'too_long' }
  return { ok: true, kind: kind as CoachKind, prompt }
}
