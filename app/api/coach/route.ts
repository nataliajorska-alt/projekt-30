/**
 * /api/coach — asystentka wbudowana w apkę (Claude API).
 *
 * GET  → { enabled, demo, missing[] } — czy asystentka jest włączona na tym serwerze.
 * POST → strumień NDJSON (lib/coach.ts: CoachEvent) z odpowiedzią na brief.
 *
 * Każde zapytanie kosztuje (płatne API Anthropic), więc trasa jest zamknięta:
 *   • token Firebase w nagłówku Authorization, zweryfikowany przez firebase-admin,
 *   • tylko konto właścicielki (P30_OWNER_UID) — jak w /api/external/xp,
 *   • dzienny limit zapytań zapisany w Firestore (DAILY_REQUEST_CAP),
 *   • prompt dłuższy niż MAX_PROMPT_CHARS jest odrzucany wprost, nie ucinany.
 *
 * Wymagane zmienne środowiskowe (Vercel → Settings → Environment Variables):
 *   ANTHROPIC_API_KEY
 *   FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY
 *   P30_OWNER_UID
 *
 * Model: claude-opus-5-5, myślenie adaptacyjne (zawsze włączone w tym modelu),
 * wysiłek „medium". Włączony jest serwerowy fallback (`fallbacks: "default"`):
 * gdy klasyfikator bezpieczeństwa odrzuci zapytanie, API samo ponawia je na
 * modelu zalecanym przez Anthropic, w tym samym strumieniu.
 */

import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdmin } from '@/lib/firebase-admin'
import { warsawDayKey } from '@/lib/warsawDay'
import {
  checkCoachRequest, encodeCoachEvent, COACH_ERROR_TEXT, DAILY_REQUEST_CAP,
  type CoachEvent, type CoachErrorCode, type CoachKind,
} from '@/lib/coach'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Rozpisanie całego miesiąca trwa 1–2 minuty. 300 s to górna granica planu Hobby
// przy Fluid compute (domyślnym dla projektów Vercela założonych po 23.04.2025).
export const maxDuration = 300

const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === '1'

const MODEL = 'claude-opus-5-5'
// Limit obejmuje myślenie i odpowiedź razem. To sufit, nie koszt.
const MAX_TOKENS: Record<CoachKind, number> = { day: 16000, month: 32000 }

const SYSTEM: Record<CoachKind, string> = {
  day: [
    'Jesteś asystentką wbudowaną w „Projekt 30” — prywatną aplikację jednej osoby, która prowadzi roczny projekt zmiany zakończony w dniu jej 30. urodzin (5 kwietnia 2027). Piszesz do niej po polsku, bezpośrednio, w drugiej osobie i w rodzaju żeńskim.',
    '',
    'W wiadomości dostajesz brief złożony przez aplikację: jej rutynę, questy, zasady dnia, kontekst ciała i energii oraz to, co sama dopisała z kalendarza. Brief mówi, czego oczekuje i jakim tonem — trzymaj się go.',
    '',
    'Twoja odpowiedź trafia prosto na ekran telefonu i zostaje w aplikacji jako plan dnia, dlatego:',
    '- Zacznij od razu od planu: jedno–dwa zdania wstępu, o które prosi brief, a potem bloki. Bez powitań, bez omawiania briefu i bez pytań na końcu — to pojedyncza odpowiedź, nie rozmowa. Jeśli czegoś brakuje, przyjmij rozsądne założenie i zaznacz je jednym zdaniem.',
    '- Każdy blok czasu zapisz jako osobny punkt listy w dokładnie tym kształcie: `- **GG:MM–GG:MM** — co robię`. Aplikacja czyta te godziny, żeby pokazywać, co trwa teraz i co jest następne, więc nie łącz kilku bloków w jednym punkcie i nie zapisuj godzin słownie.',
    '- Grupuj bloki pod krótkimi nagłówkami `##` (na przykład Rano, Dzień, Wieczór). Zachętę do trudniejszego bloku dopisz w tym samym punkcie, po myślniku.',
    '- Zakończ sekcją `## Wersja minimum` z trzema punktami — aplikacja pokazuje ją osobno, gdy dzień się posypie.',
    '- Używaj tylko nagłówków, list i pogrubień. Bez tabel i bez bloków kodu: na telefonie się nie mieszczą.',
    '- Plan ma być do ogarnięcia jednym spojrzeniem: konkret zamiast objaśnień.',
  ].join('\n'),
  month: [
    'Jesteś asystentką wbudowaną w „Projekt 30” — prywatną aplikację jednej osoby, która prowadzi roczny projekt zmiany zakończony w dniu jej 30. urodzin (5 kwietnia 2027).',
    '',
    'Twojej odpowiedzi nie czyta człowiek: aplikacja wczytuje ją parserem, linia po linii, jako questy na kolejne dni miesiąca. Dlatego odpowiedz wyłącznie liniami w formacie:',
    'RRRR-MM-DD | filar | xp | tytuł | opis',
    '',
    '- Jedna linia to jeden quest. Bez nagłówków, wstępu, podsumowania, punktorów i bloków kodu — każda inna linia zostanie odrzucona jako błąd.',
    '- `filar` to dokładnie jedno z id podanych w wiadomości, a `xp` to sama liczba.',
    '- W tytule i opisie nie używaj znaku `|`, bo rozdziela pola. Tytuł do około 60 znaków; opis to jedno–dwa zdania, konkretne i wykonalne.',
    '- Rozpisz każdy dzień z listy w wiadomości, w kolejności dat, trzymając się zasad gęstości i tonu podanych w wiadomości.',
    '- Tytuły i opisy pisz po polsku, do niej, w drugiej osobie i w rodzaju żeńskim.',
  ].join('\n'),
}

function missingConfig(): string[] {
  const missing: string[] = []
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY')
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) missing.push('FIREBASE_ADMIN_PROJECT_ID')
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) missing.push('FIREBASE_ADMIN_CLIENT_EMAIL')
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) missing.push('FIREBASE_ADMIN_PRIVATE_KEY')
  if (!process.env.P30_OWNER_UID) missing.push('P30_OWNER_UID')
  return missing
}

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }
  if (SANDBOX) return NextResponse.json({ enabled: true, demo: true, missing: [] }, { headers })
  const missing = missingConfig()
  return NextResponse.json({ enabled: missing.length === 0, demo: false, missing }, { headers })
}

const fail = (code: CoachErrorCode, status: number, detail?: string) =>
  NextResponse.json(
    { type: 'error', code, message: COACH_ERROR_TEXT[code], ...(detail ? { detail } : {}) } satisfies CoachEvent,
    { status, headers: { 'Cache-Control': 'no-store' } },
  )

const STREAM_HEADERS = {
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-store, no-transform',
  'X-Accel-Buffering': 'no',
}

/** Błąd SDK → kod dla apki. Klasy od najbardziej szczegółowej; nigdy po treści komunikatu. */
function describeError(err: unknown): { code: CoachErrorCode; detail?: string } {
  if (err instanceof Anthropic.APIUserAbortError) return { code: 'interrupted' }
  if (err instanceof Anthropic.AuthenticationError) return { code: 'api_key' }
  if (err instanceof Anthropic.PermissionDeniedError) return { code: 'api_key', detail: err.apiMessage ?? undefined }
  if (err instanceof Anthropic.RateLimitError) return { code: 'rate_limit' }
  if (err instanceof Anthropic.OverloadedError) return { code: 'overloaded' }
  if (err instanceof Anthropic.APIConnectionError) return { code: 'connection' }
  if (err instanceof Anthropic.APIError) {
    const detail = err.apiMessage ?? undefined
    if (err.type === 'billing_error') return { code: 'billing', detail }
    if (err.type === 'overloaded_error') return { code: 'overloaded' }
    if (err.type === 'rate_limit_error') return { code: 'rate_limit' }
    // 400 to zwykle saldo, wyłączony model albo zmiana API — treść od Anthropic mówi która.
    if (err instanceof Anthropic.BadRequestError) return { code: 'billing', detail }
    return { code: 'unknown', detail: detail ?? `HTTP ${err.status ?? '—'}` }
  }
  return { code: 'unknown' }
}

function ndjsonStream(run: (send: (e: CoachEvent) => void, signal: AbortSignal) => Promise<void>): Response {
  const encoder = new TextEncoder()
  const abort = new AbortController()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true
      const send = (e: CoachEvent) => {
        if (!open) return
        try { controller.enqueue(encoder.encode(encodeCoachEvent(e))) } catch { open = false }
      }
      try {
        await run(send, abort.signal)
      } catch (err) {
        const { code, detail } = describeError(err)
        send({ type: 'error', code, message: COACH_ERROR_TEXT[code], ...(detail ? { detail } : {}) })
      } finally {
        open = false
        try { controller.close() } catch { /* klient już się rozłączył */ }
      }
    },
    cancel() { abort.abort() },
  })
  return new Response(body, { headers: STREAM_HEADERS })
}

async function demoStream(kind: CoachKind, prompt: string): Promise<Response> {
  const { demoAnswer } = await import('@/lib/sandbox/coachDemo')
  const text = demoAnswer(kind, prompt)
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
  return ndjsonStream(async (send, signal) => {
    await wait(900) // „myśli…"
    for (let i = 0; i < text.length && !signal.aborted; i += 14) {
      send({ type: 'text', text: text.slice(i, i + 14) })
      await wait(12)
    }
    if (!signal.aborted) send({ type: 'done', truncated: false, model: 'demo', demo: true })
  })
}

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return fail('bad_request', 400) }
  const parsed = checkCoachRequest(body)
  if (!parsed.ok) return fail(parsed.code, parsed.code === 'too_long' ? 413 : 400)
  const { kind, prompt } = parsed

  if (SANDBOX) return demoStream(kind, prompt)

  if (missingConfig().length > 0) return fail('not_configured', 503)
  const ownerUid = process.env.P30_OWNER_UID!

  // 1. Kto pyta — token Firebase zalogowanej użytkowniczki.
  const token = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '')?.[1]
  if (!token) return fail('unauthorized', 401)
  const { app, db } = getAdmin()
  let uid: string
  try {
    uid = (await getAuth(app).verifyIdToken(token)).uid
  } catch {
    return fail('unauthorized', 401)
  }
  if (uid !== ownerUid) return fail('forbidden', 403)

  // 2. Dzienny limit — atomowo, żeby dwa równoległe zapytania nie przeszły oba na ostatnim miejscu.
  const usageRef = db.collection('users').doc(uid).collection('coachUsage').doc(warsawDayKey())
  try {
    const allowed = await db.runTransaction(async tx => {
      const used = Number((await tx.get(usageRef)).get('requests') ?? 0)
      if (used >= DAILY_REQUEST_CAP) return false
      tx.set(usageRef, { requests: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      return true
    })
    if (!allowed) return fail('daily_cap', 429)
  } catch (e) {
    console.error('[coach] nie udało się sprawdzić limitu dziennego:', e)
    return fail('unknown', 500)
  }

  // 3. Zapytanie do Claude, tekst przekazywany dalej w miarę powstawania.
  const client = new Anthropic()
  return ndjsonStream(async (send, signal) => {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS[kind],
      output_config: { effort: 'medium' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM[kind],
      messages: [{ role: 'user', content: prompt }],
    })
    const stop = () => stream.abort()
    signal.addEventListener('abort', stop)
    req.signal.addEventListener('abort', stop)

    // Przy fallbacku tekst sprzed przełączenia zostaje ważny (API kontynuuje od niego),
    // więc każdy fragment można od razu przekazać dalej.
    stream.on('text', delta => send({ type: 'text', text: delta }))
    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal') {
      // Odmówił cały łańcuch (model i fallback). Częściowy tekst nie jest odpowiedzią.
      send({
        type: 'error', code: 'refusal', message: COACH_ERROR_TEXT.refusal,
        ...(message.stop_details?.explanation ? { detail: message.stop_details.explanation } : {}),
      })
    } else {
      send({ type: 'done', truncated: message.stop_reason === 'max_tokens', model: message.model })
    }

    // Zużycie — do wglądu w Ustawieniach. Przy fallbacku liczy się każda próba z osobna.
    const attempts = message.usage.iterations?.length ? message.usage.iterations : [message.usage]
    const tokens = attempts.reduce(
      (sum, u) => ({ input: sum.input + (u.input_tokens ?? 0), output: sum.output + (u.output_tokens ?? 0) }),
      { input: 0, output: 0 },
    )
    await usageRef.set(
      { inputTokens: FieldValue.increment(tokens.input), outputTokens: FieldValue.increment(tokens.output) },
      { merge: true },
    ).catch(e => console.error('[coach] zapis zużycia nie wyszedł:', e))
  })
}
