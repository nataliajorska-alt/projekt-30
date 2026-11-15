'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { auth, IS_SANDBOX } from '@/lib/firebase'
import {
  drainCoachEvents, COACH_ERROR_TEXT,
  type CoachErrorCode, type CoachEvent, type CoachKind,
} from '@/lib/coach'

// ── Czy asystentka jest włączona na serwerze ────────────────────────────

export interface CoachAvailability {
  enabled: boolean
  demo: boolean
  missing: string[]
}

// Jedno zapytanie na sesję — kilka komponentów pyta naraz, odpowiedź się nie zmienia.
let availability: Promise<CoachAvailability | null> | null = null

function loadAvailability(): Promise<CoachAvailability | null> {
  availability ??= fetch('/api/coach', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then((j): CoachAvailability => ({
      enabled: j?.enabled === true,
      demo: j?.demo === true,
      missing: Array.isArray(j?.missing) ? j.missing.filter((m: unknown): m is string => typeof m === 'string') : [],
    }))
    .catch(() => {
      availability = null // bez sieci — zapytamy ponownie przy następnym montowaniu
      return null
    })
  return availability
}

/** `null` — jeszcze nie wiadomo (wczytuje się albo nie ma sieci). */
export function useCoachAvailability(): CoachAvailability | null {
  const [state, setState] = useState<CoachAvailability | null>(null)
  useEffect(() => {
    let alive = true
    loadAvailability().then(a => { if (alive) setState(a) })
    return () => { alive = false }
  }, [])
  return state
}

// ── Jedno zapytanie ze strumieniem odpowiedzi ───────────────────────────

/** waiting — wysłane, asystentka myśli; streaming — przychodzi tekst. */
export type CoachPhase = 'idle' | 'waiting' | 'streaming' | 'done' | 'error'

export interface CoachResult {
  text: string
  truncated: boolean
  model: string
  demo: boolean
}

export interface CoachFailure {
  code: CoachErrorCode
  message: string
  detail?: string
}

export function useCoachRequest() {
  const [phase, setPhase] = useState<CoachPhase>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState<CoachFailure | null>(null)
  const [result, setResult] = useState<CoachResult | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)
  const frameRef = useRef<number | null>(null)

  const cancelFrame = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }

  useEffect(() => () => { ctrlRef.current?.abort(); cancelFrame() }, [])

  /** Przerywa trwające zapytanie i czyści stan. Nic nie zapisuje. */
  const reset = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
    cancelFrame()
    setPhase('idle'); setText(''); setError(null); setResult(null); setStartedAt(null)
  }, [])

  const ask = useCallback(async (kind: CoachKind, prompt: string): Promise<CoachResult | null> => {
    ctrlRef.current?.abort()
    cancelFrame()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    setPhase('waiting'); setText(''); setError(null); setResult(null); setStartedAt(Date.now())

    const fail = (code: CoachErrorCode, message?: string, detail?: string): null => {
      cancelFrame()
      if (ctrl.signal.aborted) return null
      setError({ code, message: message || COACH_ERROR_TEXT[code], ...(detail ? { detail } : {}) })
      setText('') // urwana albo odrzucona odpowiedź nie jest planem — nie pokazujemy połowy
      setPhase('error')
      return null
    }

    if (!IS_SANDBOX && typeof navigator !== 'undefined' && navigator.onLine === false) return fail('offline')

    let full = ''
    let streaming = false
    // Tekst na ekran najwyżej raz na klatkę — strumień potrafi przysłać dziesiątki kawałków na sekundę.
    const schedule = () => {
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => { frameRef.current = null; setText(full) })
    }
    const consume = (events: CoachEvent[]): CoachEvent | null => {
      let last: CoachEvent | null = null
      for (const e of events) {
        if (e.type === 'text') {
          full += e.text
          if (!streaming) { streaming = true; setPhase('streaming') }
          schedule()
        } else {
          last = e
        }
      }
      return last
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (!IS_SANDBOX) {
        const token = await auth.currentUser?.getIdToken().catch(() => null)
        if (!token) return fail('unauthorized')
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers,
        body: JSON.stringify({ kind, prompt }),
        signal: ctrl.signal,
        cache: 'no-store',
      })

      if (!res.ok || !res.body) {
        const raw = await res.text().catch(() => '')
        const ev = drainCoachEvents(raw.trim() + '\n').events[0]
        if (ev?.type === 'error') return fail(ev.code, ev.message, ev.detail)
        return fail(res.status === 401 ? 'unauthorized' : 'unknown', undefined, `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let final: CoachEvent | null = null
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const out = drainCoachEvents(buffer + decoder.decode(value, { stream: true }))
        buffer = out.rest
        final = consume(out.events) ?? final
      }
      final = consume(drainCoachEvents(buffer + decoder.decode() + '\n').events) ?? final

      if (final?.type === 'error') return fail(final.code, final.message, final.detail)
      // Strumień zamknięty bez „done" — np. serwer przekroczył limit czasu.
      if (final?.type !== 'done') return fail('interrupted')
      if (!full.trim()) return fail('unknown', 'Asystentka nie zwróciła żadnej treści.')

      cancelFrame()
      const r: CoachResult = { text: full, truncated: final.truncated, model: final.model, demo: final.demo === true }
      setText(full)
      setResult(r)
      setPhase('done')
      return r
    } catch {
      if (ctrl.signal.aborted) return null // przerwane przez nas: reset, nowe zapytanie albo zamknięcie ekranu
      return fail(full ? 'interrupted' : 'connection')
    }
  }, [])

  return { phase, text, error, result, startedAt, ask, reset }
}

/** Sekundy od `since`, odświeżane co sekundę — do „układa plan · 14 s". */
export function useElapsed(since: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (since === null) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [since])
  return since === null ? 0 : Math.max(0, Math.round((now - since) / 1000))
}

/** Bieżący czas, odświeżany co `ms` — do „teraz wg planu". */
export function useClock(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    const wake = () => { if (document.visibilityState === 'visible') setNow(new Date()) }
    document.addEventListener('visibilitychange', wake)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', wake) }
  }, [ms])
  return now
}
