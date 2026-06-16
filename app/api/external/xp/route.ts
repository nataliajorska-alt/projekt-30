/**
 * POST /api/external/xp
 *
 * Endpoint przyjmujący XP z zewnętrznych aplikacji (na razie tylko The Learning
 * Vault). Apka jednoosobowa — XP idzie zawsze do hardcoded ownera (env var
 * P30_OWNER_UID), nie do dowolnego usera. Auth przez shared secret w headerze.
 *
 * Headers:
 *   Authorization: Bearer <LEARNING_VAULT_API_KEY>
 *
 * Body:
 *   {
 *     xp: number,        // dodatnia liczba całkowita, max 200 per request
 *     source: string,    // do logów (np. "vault:finish-session", "vault:salon-view")
 *     pillar: Pillar,    // jeden z 7 filarów P30
 *     eventId?: string   // opcjonalny — idempotency (ten sam id nie naliczy XP 2x)
 *   }
 *
 * Hardening: stałe-czasowo porównanie klucza (timingSafeEqual), rate-limit
 * (60/min per instancja), dzienny limit XP z zewnątrz (2000), idempotency po eventId.
 *
 * Response:
 *   200 { ok: true, totalXP, pillarXP } | { ok: true, duplicate: true }
 *   401 { ok: false, error: "unauthorized" }
 *   429 { ok: false, error: "rate limited" | "daily external XP cap reached" }
 *   400 { ok: false, error: "..." }
 *   500 { ok: false, error: "..." }
 */

import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdmin } from '@/lib/firebase-admin'
import { createHash, timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

const ALLOWED_PILLARS = [
  'pozycja',
  'cialo',
  'styl',
  'kapital',
  'kariera',
  'tozsamosc',
  'milosc',
] as const

type Pillar = (typeof ALLOWED_PILLARS)[number]

const MAX_XP_PER_REQUEST = 200

// Dzienny limit XP z zewnątrz — zapora przed niekontrolowanym pompowaniem XP
// nawet z ważnym kluczem (Vault w normalnym użyciu nie zbliża się do tego).
const MAX_EXTERNAL_XP_PER_DAY = 2000

// Porównanie sekretu w stałym czasie (po SHA-256, więc długości zawsze równe) —
// zamiast `!==`, które przez czas odpowiedzi wycieka długość/prefiks klucza.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

// Rate-limit w pamięci (per instancja serverless). Słabe na serverless, ale
// tania bariera przed floodem od posiadacza klucza. Jeden caller (Vault).
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 60
const rateHits: number[] = []
function rateLimited(): boolean {
  const now = Date.now()
  while (rateHits.length && rateHits[0] < now - RATE_WINDOW_MS) rateHits.shift()
  if (rateHits.length >= RATE_MAX) return true
  rateHits.push(now)
  return false
}

// Klucz dnia MUSI pasować do klienta (lib/gameLogic.todayKey): strefa
// Europe/Warsaw + przesunięcie o DAY_START_HOUR=3 (dzień „zaczyna się" o 3:00).
// Serwer Vercela chodzi w UTC, więc bare new Date() zapisywał XP z Vaulta do
// złego dnia — liczymy datę warszawską przez Intl.
const DAY_START_HOUR = 3
function todayKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value)
  let y = get('year'), m = get('month'), d = get('day')
  if (get('hour') < DAY_START_HOUR) {
    const shifted = new Date(Date.UTC(y, m - 1, d))
    shifted.setUTCDate(shifted.getUTCDate() - 1)
    y = shifted.getUTCFullYear(); m = shifted.getUTCMonth() + 1; d = shifted.getUTCDate()
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export async function POST(req: Request) {
  // 1. Auth — shared secret
  const expectedKey = process.env.LEARNING_VAULT_API_KEY
  if (!expectedKey) {
    return NextResponse.json(
      { ok: false, error: 'server misconfigured: missing LEARNING_VAULT_API_KEY' },
      { status: 500 },
    )
  }
  const authHeader = req.headers.get('authorization') ?? ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!provided || !safeEqual(provided, expectedKey)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  // Rate-limit (po auth — chronimy przed floodem uwierzytelnionych żądań).
  if (rateLimited()) {
    return NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 })
  }

  // 2. Owner UID z env
  const ownerUid = process.env.P30_OWNER_UID
  if (!ownerUid) {
    return NextResponse.json(
      { ok: false, error: 'server misconfigured: missing P30_OWNER_UID' },
      { status: 500 },
    )
  }

  // 3. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }
  const { xp, source, pillar, eventId } = (body ?? {}) as Partial<{
    xp: unknown
    source: unknown
    pillar: unknown
    eventId: unknown
  }>

  // Walidacja xp
  if (typeof xp !== 'number' || !Number.isFinite(xp) || !Number.isInteger(xp) || xp <= 0) {
    return NextResponse.json(
      { ok: false, error: 'xp must be a positive integer' },
      { status: 400 },
    )
  }
  if (xp > MAX_XP_PER_REQUEST) {
    return NextResponse.json(
      { ok: false, error: `xp exceeds max per request (${MAX_XP_PER_REQUEST})` },
      { status: 400 },
    )
  }

  // Walidacja pillar
  if (typeof pillar !== 'string' || !(ALLOWED_PILLARS as readonly string[]).includes(pillar)) {
    return NextResponse.json(
      { ok: false, error: `pillar must be one of: ${ALLOWED_PILLARS.join(', ')}` },
      { status: 400 },
    )
  }
  const pillarSafe = pillar as Pillar

  // Walidacja source (info do logów, nieobowiązkowa walidacja zawartości)
  const sourceStr = typeof source === 'string' && source.length > 0 ? source.slice(0, 80) : 'external'

  // Idempotency: gdy Vault poda eventId, ten sam event nie naliczy XP dwa razy
  // (ochrona przed replayem). Bez eventId — zachowanie jak dotąd.
  const eventIdSafe = typeof eventId === 'string' && eventId.length > 0 ? eventId.slice(0, 128) : null

  // 4. Apply XP
  try {
    const { db } = getAdmin()
    const statsRef = db.collection('users').doc(ownerUid).collection('data').doc('stats')
    const todayRef = db.collection('users').doc(ownerUid).collection('logs').doc(todayKey())

    // Dzienny limit XP z zewnątrz (czytamy dzisiejszy log i sumujemy externalXP).
    const todaySnap = await todayRef.get()
    const ext = (todaySnap.data()?.externalXP ?? {}) as Record<string, unknown>
    const todayExternal = Object.values(ext).reduce<number>(
      (s, v) => s + (typeof v === 'number' ? v : 0), 0,
    )
    if (todayExternal + xp > MAX_EXTERNAL_XP_PER_DAY) {
      return NextResponse.json({ ok: false, error: 'daily external XP cap reached' }, { status: 429 })
    }

    // Idempotency — replay tego samego eventId nie nalicza ponownie. create()
    // failuje atomowo, jeśli dokument już istnieje (ten event był już policzony).
    if (eventIdSafe) {
      const eventRef = db.collection('users').doc(ownerUid).collection('externalEvents').doc(eventIdSafe)
      try {
        await eventRef.create({ xp, pillar: pillarSafe, source: sourceStr, at: FieldValue.serverTimestamp() })
      } catch {
        return NextResponse.json({ ok: true, duplicate: true, source: sourceStr })
      }
    }

    // Inkrementacja totalXP + pillarXP.{pillar} w stats; totalXP w today log.
    // Plus log.externalXP[pillar] — żeby recoverStats mogło odbudować
    // pillarXP z Vault XP (totalXP odbuduje się z sum log.totalXP, ale
    // pillarXP rebuilduje od zera tylko z quest completions, więc bez
    // externalXP Vault contribution by się gubił po recovery).
    // FieldValue.increment jest atomic — bezpieczne pod współbieżnymi requestami.
    await Promise.all([
      statsRef.set(
        {
          totalXP: FieldValue.increment(xp),
          pillarXP: { [pillarSafe]: FieldValue.increment(xp) },
        },
        { merge: true },
      ),
      todayRef.set(
        {
          totalXP: FieldValue.increment(xp),
          externalXP: { [pillarSafe]: FieldValue.increment(xp) },
        },
        { merge: true },
      ),
    ])

    // Read back fresh totals dla response
    const fresh = await statsRef.get()
    const data = (fresh.data() ?? {}) as { totalXP?: number; pillarXP?: Record<string, number> }
    return NextResponse.json({
      ok: true,
      totalXP: data.totalXP ?? 0,
      pillarXP: data.pillarXP?.[pillarSafe] ?? 0,
      source: sourceStr,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
