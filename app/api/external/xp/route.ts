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
 *     pillar: Pillar     // jeden z 7 filarów P30
 *   }
 *
 * Response:
 *   200 { ok: true, totalXP, pillarXP }
 *   401 { ok: false, error: "unauthorized" }
 *   400 { ok: false, error: "..." }
 *   500 { ok: false, error: "..." }
 */

import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdmin } from '@/lib/firebase-admin'

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

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  if (!provided || provided !== expectedKey) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
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
  const { xp, source, pillar } = (body ?? {}) as Partial<{
    xp: unknown
    source: unknown
    pillar: unknown
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

  // 4. Apply XP
  try {
    const { db } = getAdmin()
    const statsRef = db.collection('users').doc(ownerUid).collection('data').doc('stats')
    const todayRef = db.collection('users').doc(ownerUid).collection('logs').doc(todayKey())

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
