'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

const TARGET = 3600

function todayKey() {
  return `desk-timer-${new Date().toISOString().slice(0, 10)}`
}

interface DeskTimerProps {
  done: boolean
  onComplete: () => void
}

export default function DeskTimer({ done, onComplete }: DeskTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey())
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

  // Tick — base captured at the moment running flips to true
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
      localStorage.setItem(todayKey(), JSON.stringify({
        elapsed,
        running,
        ts: running ? Date.now() : null,
      }))
    } catch {}
  }, [elapsed, running, mounted])

  // Auto-complete
  useEffect(() => {
    if (elapsed >= TARGET && !done && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [elapsed, done, onComplete])

  const toggle = () => {
    if (elapsed >= TARGET) return
    setRunning(r => !r)
  }

  const reset = () => {
    setRunning(false)
    setElapsed(0)
    completedRef.current = false
    try {
      localStorage.setItem(todayKey(), JSON.stringify({ elapsed: 0, running: false, ts: null }))
    } catch {}
  }

  if (!mounted) return null

  const isComplete = elapsed >= TARGET
  const pct = Math.min((elapsed / TARGET) * 100, 100)
  const elMM = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const elSS = (elapsed % 60).toString().padStart(2, '0')
  const remMM = Math.floor((TARGET - elapsed) / 60).toString().padStart(2, '0')
  const remSS = ((TARGET - elapsed) % 60).toString().padStart(2, '0')

  return (
    <div className="ml-11 -mt-0.5 mb-2">
      <div className="flex items-center gap-3">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
            <circle cx="16" cy="16" r="12" fill="none" stroke="#f5f0e8" strokeWidth="3" />
            <circle
              cx="16" cy="16" r="12"
              fill="none"
              stroke={isComplete ? '#6b9e7a' : '#c9a84c'}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 12}`}
              strokeDashoffset={`${2 * Math.PI * 12 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {running && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            </span>
          )}
        </div>

        {/* Time display */}
        <div className="flex-1 min-w-0">
          {isComplete ? (
            <p className="font-sans text-xs text-forest font-medium">Godzina zrobiona ✦</p>
          ) : (
            <p className="font-mono text-xs text-dark tabular-nums">
              {elMM}:{elSS}
              <span className="font-sans text-muted-light text-[10px] ml-1.5">
                (zostało {remMM}:{remSS})
              </span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {!isComplete && (
            <button
              onClick={toggle}
              className="h-6 px-2.5 rounded-full flex items-center gap-1 bg-gold/10 hover:bg-gold/20 text-gold transition-colors text-[10px] font-sans"
            >
              {running
                ? <><Pause size={9} strokeWidth={2} />pauza</>
                : <><Play size={9} strokeWidth={2} />start</>
              }
            </button>
          )}
          {elapsed > 0 && !isComplete && (
            <button
              onClick={reset}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-cream hover:bg-cream/80 text-muted-light transition-colors"
            >
              <RotateCcw size={9} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-1.5 h-0.5 bg-cream rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-forest' : 'bg-gold'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
