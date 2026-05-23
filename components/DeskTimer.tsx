'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { SmallCaps, Diamond } from '@/components/ui'

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
    <div className="ml-9 -mt-0.5 mb-2">
      <div className="flex items-center gap-3">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 32 32" className="w-7 h-7 -rotate-90">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#C9BFB1" strokeWidth="1.2" />
            <circle
              cx="16" cy="16" r="13"
              fill="none"
              stroke={isComplete ? '#2C3B35' : '#B8963E'}
              strokeWidth="1.2"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {running && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold animate-pulse">
                <Diamond size={4} filled />
              </span>
            </span>
          )}
          {isComplete && (
            <span className="absolute inset-0 flex items-center justify-center text-forest">
              <Diamond size={5} filled />
            </span>
          )}
        </div>

        {/* Time display */}
        <div className="flex-1 min-w-0">
          {isComplete ? (
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              <span className="text-forest">Godzina zrobiona ◆</span>
            </SmallCaps>
          ) : (
            <p className="font-display text-dark text-sm tabular-nums leading-none">
              {elMM}:{elSS}
              <span className="font-serif-body italic text-muted-light text-[11px] ml-2">
                zostało {remMM}:{remSS}
              </span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {!isComplete && (
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 border border-gold-light/60 hover:border-gold px-2.5 py-1 text-gold-deep transition-colors"
            >
              {running ? <Pause size={9} strokeWidth={2} /> : <Play size={9} strokeWidth={2} />}
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                {running ? 'pauza' : 'start'}
              </SmallCaps>
            </button>
          )}
          {elapsed > 0 && !isComplete && (
            <button
              onClick={reset}
              className="w-6 h-6 border border-hairline flex items-center justify-center text-muted hover:border-gold-light hover:text-gold-deep transition-colors"
              aria-label="Reset"
            >
              <RotateCcw size={9} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Progress hairline */}
      <div className="mt-2 relative h-px w-full bg-hairline">
        <div
          className={clsx(
            'absolute left-0 top-0 h-px transition-all duration-500',
            isComplete ? 'bg-forest' : 'bg-gold'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
