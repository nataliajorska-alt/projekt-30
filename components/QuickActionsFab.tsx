'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Heart, PenLine, Camera, Wind, Zap } from 'lucide-react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import MoodCheckInModal from './MoodCheckInModal'
import SmokeButton from './SmokeButton'
import GhostProtocolV2 from './GhostProtocolV2'
import type { MoodState } from '@/types'
import { SmallCaps } from '@/components/ui'

const HIDDEN_ON = ['/settings']

export default function QuickActionsFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showMood, setShowMood] = useState(false)
  const [showSmoke, setShowSmoke] = useState(false)
  const [showImpulse, setShowImpulse] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const { saveMoodCheckIn } = useGameData()

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
  const handleImpulse = () => { setOpen(false); setShowImpulse(true) }

  return (
    <>
      <div
        ref={fabRef}
        className="fixed right-5 bottom-24 md:bottom-5 z-30 flex flex-col items-end gap-2"
      >
        {/* Action items */}
        <div className={clsx(
          'flex flex-col items-end gap-2 transition-all duration-200',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        )}>
          <FabAction label="Mood" onClick={handleMood} icon={<Heart size={14} strokeWidth={1.5} />} />
          <FabAction label="Impuls" onClick={handleImpulse} icon={<Zap size={14} strokeWidth={1.5} />} />
          <FabAction label="Papieros" onClick={handleSmoke} icon={<Wind size={14} strokeWidth={1.5} />} />
          <FabAction label="Wpis do skarbca" href="/vault?action=write" icon={<PenLine size={14} strokeWidth={1.5} />} />
          <FabAction label="Dodaj zdjęcie" href="/photos?action=upload" icon={<Camera size={14} strokeWidth={1.5} />} />
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
      {showImpulse && <GhostProtocolV2 autoLaunch="impulse" onExit={() => setShowImpulse(false)} />}
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
    <span className="flex items-center gap-3 bg-ivory border border-gold-light/60 hover:border-gold pl-4 pr-2 py-1.5 transition-colors">
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
