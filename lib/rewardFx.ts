'use client'
// Efekty nagród w przeglądarce: preferencje (per urządzenie), dźwięk
// syntezowany w Web Audio (bez plików) i wibracja (Android; iOS jej nie ma).

export interface RewardPrefs {
  /** Animacje nagród: +XP, rozpęd, znaleziska, konfetti. */
  fx: boolean
  sound: boolean
  haptics: boolean
}

const KEY = 'p30.rewards.prefs'
const DEFAULTS: RewardPrefs = { fx: true, sound: true, haptics: true }
const subs = new Set<(p: RewardPrefs) => void>()

export function getRewardPrefs(): RewardPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function setRewardPrefs(patch: Partial<RewardPrefs>): RewardPrefs {
  const next = { ...getRewardPrefs(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* prywatne okno */ }
  subs.forEach(s => s(next))
  return next
}

export function onRewardPrefs(cb: (p: RewardPrefs) => void): () => void {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

// ── Dźwięk ───────────────────────────────────────────────────────────

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = ctx ?? new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Miękki „dzwoneczek": sinus + oktawa wyżej, szybki atak, długie wybrzmienie. */
function tone(freq: number, at: number, dur = 0.45, gain = 0.07) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + at
  for (const [mult, g] of [[1, gain], [2, gain * 0.35]] as const) {
    const osc = c.createOscillator()
    const amp = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    amp.gain.setValueAtTime(0, t0)
    amp.gain.linearRampToValueAtTime(g, t0 + 0.012)
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(amp).connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  }
}

export function playChime(freq: number) {
  if (!getRewardPrefs().sound) return
  tone(freq, 0)
}

/** Arpeggio na znalezisko / kamień milowy — dłuższe dla rzadszych. */
export function playFanfare(steps = 3) {
  if (!getRewardPrefs().sound) return
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
  for (let i = 0; i < Math.min(steps, notes.length); i++) tone(notes[i], i * 0.09, 0.6, 0.06)
}

export function buzz(pattern: number | number[] = 12) {
  if (!getRewardPrefs().haptics) return
  try { navigator.vibrate?.(pattern) } catch { /* brak wsparcia */ }
}
