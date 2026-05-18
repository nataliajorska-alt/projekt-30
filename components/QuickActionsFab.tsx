'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Heart, PenLine, Camera, Wind } from 'lucide-react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import MoodCheckInModal from './MoodCheckInModal'
import SmokeButton from './SmokeButton'
import type { MoodState } from '@/types'

const HIDDEN_ON = ['/settings']

export default function QuickActionsFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showMood, setShowMood] = useState(false)
  const [showSmoke, setShowSmoke] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const { saveMoodCheckIn } = useGameData()

  // Zamknij na klik poza menu i przy zmianie strony
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  if (HIDDEN_ON.includes(pathname)) return null

  const handleMood = () => { setOpen(false); setShowMood(true) }
  const handleMoodSave = async (data: { energy: number; mood: number; state: MoodState }) => {
    setShowMood(false)
    await saveMoodCheckIn(data)
  }
  const handleSmoke = () => { setOpen(false); setShowSmoke(true) }

  return (
    <>
      <div
        ref={fabRef}
        className="fixed right-5 bottom-24 md:bottom-5 z-30 flex flex-col items-end gap-2"
      >
        {/* Action bubbles */}
        <div className={clsx(
          'flex flex-col items-end gap-2 transition-all duration-200',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        )}>
          <FabAction
            label="Mood"
            onClick={handleMood}
            icon={<Heart size={16} strokeWidth={1.8} />}
          />
          <FabAction
            label="Papieros"
            onClick={handleSmoke}
            icon={<Wind size={16} strokeWidth={1.8} />}
          />
          <FabAction
            label="Wpis do skarbca"
            href="/vault?action=write"
            icon={<PenLine size={16} strokeWidth={1.8} />}
          />
          <FabAction
            label="Dodaj zdjęcie"
            href="/photos?action=upload"
            icon={<Camera size={16} strokeWidth={1.8} />}
          />
        </div>

        {/* Main toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Zamknij szybkie akcje' : 'Szybkie akcje'}
          className={clsx(
            'w-14 h-14 rounded-full bg-dark text-ivory flex items-center justify-center shadow-elegant transition-all hover:bg-forest',
            open && 'rotate-45'
          )}
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      </div>

      {showMood && (
        <MoodCheckInModal
          onSave={handleMoodSave}
          onDismiss={() => setShowMood(false)}
        />
      )}

      {showSmoke && (
        <SmokeButton onClose={() => setShowSmoke(false)} />
      )}
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
    <span className="flex items-center gap-2 bg-white rounded-full pl-4 pr-3 py-2 shadow-elegant border border-border/40 hover:border-gold/40 transition-colors">
      <span className="font-sans text-xs text-dark whitespace-nowrap">{label}</span>
      <span className="w-7 h-7 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center">
        {icon}
      </span>
    </span>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return <button onClick={onClick}>{inner}</button>
}
