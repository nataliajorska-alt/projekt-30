'use client'
import { useState, useEffect, useRef } from 'react'

const TARGET = 3600 // 60 minutes

function storageKey() {
  return `desk-timer-${new Date().toISOString().slice(0, 10)}`
}

function formatMMSS(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

interface DeskTimerProps {
  done: boolean
  onComplete: () => void
}

/**
 * Compact inline timer pill (matches design `.routine .timer`):
 *   [ 60:00 ▶ START ]  /  [ 12:34 ⏸ PAUSE ]  /  [ ◆ ZROBIONE ]
 * Click the pill to toggle play/pause. A tiny × reset appears once started.
 */
export default function DeskTimer({ done, onComplete }: DeskTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const completedRef = useRef(false)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey())
      if (raw) {
        const { elapsed: e, running: r, ts } = JSON.parse(raw)
        const extra = r && ts ? Math.floor((Date.now() - ts) / 1000) : 0
        const total = Math.min(e + extra, TARGET)
        setElapsed(total)
        setRunning(r && total < TARGET)
        if (total >= TARGET) completedRef.current = true
      }
    } catch {}
    setMounted(true)
  }, [])

  // Tick
  useEffect(() => {
    if (!running || !mounted) return
    const start = Date.now()
    const base = elapsed
    const id = setInterval(() => {
      const next = Math.min(base + Math.floor((Date.now() - start) / 1000), TARGET)
      setElapsed(next)
      if (next >= TARGET) setRunning(false)
    }, 500)
    return () => clearInterval(id)
  }, [running, mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(storageKey(), JSON.stringify({
        elapsed, running, ts: running ? Date.now() : null,
      }))
    } catch {}
  }, [elapsed, running, mounted])

  // Auto-complete the routine item when target reached
  useEffect(() => {
    if (elapsed >= TARGET && !done && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [elapsed, done, onComplete])

  if (!mounted) return null

  const isComplete = elapsed >= TARGET || done
  const remaining = Math.max(0, TARGET - elapsed)
  const stateLabel = isComplete
    ? 'Zrobione'
    : running
      ? 'Pause'
      : elapsed > 0
        ? 'Resume'
        : 'Start'
  const stateGlyph = isComplete ? '◆' : running ? '⏸' : '▶'

  const toggle = () => {
    if (isComplete) return
    setRunning(r => !r)
  }

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRunning(false)
    setElapsed(0)
    completedRef.current = false
    try {
      localStorage.setItem(storageKey(), JSON.stringify({ elapsed: 0, running: false, ts: null }))
    } catch {}
  }

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-2 border border-hairline hover:border-gold px-2.5 py-1 transition-colors"
        aria-label={`Timer ${stateLabel}`}
      >
        {!isComplete && (
          <span className="font-display italic text-gold-deep text-[12px] leading-none tabular-nums">
            {formatMMSS(remaining)}
          </span>
        )}
        <span className="text-gold text-[8px] leading-none">{stateGlyph}</span>
        <span className="font-ui uppercase tracking-[0.26em] text-[9px] text-muted leading-none">
          {stateLabel}
        </span>
      </button>
      {elapsed > 0 && !isComplete && (
        <button
          onClick={reset}
          aria-label="Zresetuj timer"
          title="Reset"
          className="text-muted-light hover:text-dark font-ui text-[12px] leading-none px-1"
        >
          ×
        </button>
      )}
    </span>
  )
}
