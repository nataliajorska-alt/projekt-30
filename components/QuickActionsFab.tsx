'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Heart, Wind, Brain, Feather, Play } from 'lucide-react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { openFocus } from '@/lib/rewards'
import MoodCheckInModal from './MoodCheckInModal'
import SmokeButton from './SmokeButton'
import type { MoodState } from '@/types'
import { SmallCaps } from '@/components/ui'

// /mostek to pełny rytuał wyciszenia (oddech z zamkniętymi oczami) — pływający
// „+" z akcją „Papieros" jest tam nie na miejscu; /report to podgląd dokumentu.
const HIDDEN_ON = ['/settings', '/mostek', '/report']

export default function QuickActionsFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showMood, setShowMood] = useState(false)
  const [showSmoke, setShowSmoke] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const { saveMoodCheckIn } = useGameData()
  // „+" wisi nad prawą krawędzią treści — dokładnie tam, gdzie są wartości XP
  // i przyciski „Zrobione". Dlatego ustępuje, gdy nie jest potrzebny:
  //  • przy przewijaniu w dół (czytasz / odhaczasz listę) chowa się, przy
  //    ruchu w górę wraca — jak pływające przyciski w apkach mobilnych,
  //  • podczas pisania znika całkiem (klawiatura wypychała go na pole tekstu).
  const [scrolledAway, setScrolledAway] = useState(false)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        const y = window.scrollY
        const dy = y - lastY
        // Próg tłumi drgania palca i „odbicie" przewijania na iOS.
        if (Math.abs(dy) < 12) return
        lastY = y
        setScrolledAway(dy > 0 && y > 160)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === 'TEXTAREA' || el.isContentEditable ||
        (el.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'button', 'submit'].includes((el as HTMLInputElement).type)))
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setTyping(true) }
    const onOut = () => setTyping(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { setOpen(false); setScrolledAway(false) }, [pathname])

  if (HIDDEN_ON.includes(pathname)) return null

  const handleMood = () => { setOpen(false); setShowMood(true) }
  const handleMoodSave = async (data: { energy: number; mood: number; state: MoodState }) => {
    setShowMood(false)
    await saveMoodCheckIn(data)
  }
  const handleSmoke = () => { setOpen(false); setShowSmoke(true) }
  // Rozwinięte menu nigdy nie ucieka spod palca.
  const tucked = !open && (scrolledAway || typing)

  return (
    <>
      <div
        ref={fabRef}
        className={clsx(
          'fixed right-5 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-5 z-30 flex flex-col items-end gap-2 print:hidden',
          'transition-[transform,opacity] duration-200 ease-out',
          tucked ? 'translate-y-[160%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
        )}
        aria-hidden={tucked || undefined}
        // Wejście klawiaturą (Tab) wyciąga schowany przycisk z powrotem —
        // fokus nie może wylądować na czymś niewidocznym.
        onFocusCapture={() => setScrolledAway(false)}
      >
        {/* Action items */}
        <div className={clsx(
          'flex flex-col items-end gap-2 transition-all duration-200',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        )}>
          <FabAction label="Jedna rzecz" onClick={() => { setOpen(false); openFocus() }} icon={<Play size={14} strokeWidth={1.5} />} />
          <FabAction label="Mood" onClick={handleMood} icon={<Heart size={14} strokeWidth={1.5} />} />
          {pathname !== '/mysli' && (
            <FabAction label="Myśli" href="/mysli" icon={<Brain size={14} strokeWidth={1.5} />} />
          )}
          <FabAction label="Papieros" onClick={handleSmoke} icon={<Wind size={14} strokeWidth={1.5} />} />
          <FabAction label="Mostek" href="/mostek" icon={<Feather size={14} strokeWidth={1.5} />} />
        </div>

        {/* Main toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Zamknij szybkie akcje' : 'Szybkie akcje'}
          className={clsx(
            'w-12 h-12 bg-dark-deep text-ivory border border-gold flex items-center justify-center transition-all hover:bg-forest',
            open && 'rotate-45'
          )}
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>

      {showMood && (
        <MoodCheckInModal
          onSave={handleMoodSave}
          onDismiss={() => setShowMood(false)}
        />
      )}
      {showSmoke && <SmokeButton onClose={() => setShowSmoke(false)} />}
    </>
  )
}

interface FabActionProps {
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

function FabAction({ label, icon, href, onClick }: FabActionProps) {
  const inner = (
    <span className="flex items-center gap-3 bg-ivory border border-gold-light/60 hover:border-gold pl-4 pr-2 py-1.5 min-h-[44px] transition-colors">
      <SmallCaps tone="dark" tracking="luxury" size="xs">
        {label}
      </SmallCaps>
      <span className="w-7 h-7 border border-gold-light/60 text-gold-deep flex items-center justify-center">
        {icon}
      </span>
    </span>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return <button onClick={onClick}>{inner}</button>
}
