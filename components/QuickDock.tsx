'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Wind, Brain, Feather, Shield } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import MoodCheckInModal from './MoodCheckInModal'
import SmokeButton from './SmokeButton'
import GhostProtocolV2 from './GhostProtocolV2'
import type { MoodState } from '@/types'
import { takeShortcut } from '@/lib/shortcuts'

// Szybkie akcje na ekranie „Dziś" — pięć rzeczy, po które sięga się w biegu,
// zawsze w tym samym miejscu pod kartą dnia. Zastępują tu pływający „+":
// widać je bez rozwijania, mają podpisy i niczego nie zasłaniają.
// (Na pozostałych stronach „+" zostaje.)
export default function QuickDock() {
  const { stats, saveMoodCheckIn } = useGameData()
  const [open, setOpen] = useState<'mood' | 'smoke' | 'protocol' | null>(null)

  // Skrót z ikony aplikacji: /?akcja=nastroj | papieros | protokol
  useEffect(() => {
    const action = takeShortcut(['nastroj', 'papieros', 'protokol'])
    if (action) setOpen(action === 'nastroj' ? 'mood' : action === 'papieros' ? 'smoke' : 'protocol')
  }, [])

  const saveMood = async (data: { energy: number; mood: number; state: MoodState }) => {
    setOpen(null)
    await saveMoodCheckIn(data)
  }

  const item =
    'group flex flex-col items-center justify-center gap-1.5 min-h-[64px] border border-hairline bg-ivory hover:border-gold active:bg-cream transition-colors'
  const icon = 'text-gold-deep group-hover:text-dark transition-colors'
  const label = 'font-ui uppercase tracking-[0.08em] text-[9px] text-dark'
  const smoking = stats.smokingTrackingEnabled !== false

  return (
    <>
      <nav aria-label="Szybkie akcje" className={`grid gap-2 mb-5 ${smoking ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <button onClick={() => setOpen('mood')} className={item}>
          <Heart size={18} strokeWidth={1.5} className={icon} />
          <span className={label}>Nastrój</span>
        </button>
        {smoking && (
          <button onClick={() => setOpen('smoke')} className={item}>
            <Wind size={18} strokeWidth={1.5} className={icon} />
            <span className={label}>Papieros</span>
          </button>
        )}
        <Link href="/mysli" className={item}>
          <Brain size={18} strokeWidth={1.5} className={icon} />
          <span className={label}>Myśli</span>
        </Link>
        <Link href="/mostek" className={item}>
          <Feather size={18} strokeWidth={1.5} className={icon} />
          <span className={label}>Mostek</span>
        </Link>
        <button onClick={() => setOpen('protocol')} className={item}>
          <Shield size={18} strokeWidth={1.5} className={icon} />
          <span className={label}>Protokół</span>
        </button>
      </nav>

      {open === 'mood' && <MoodCheckInModal onSave={saveMood} onDismiss={() => setOpen(null)} />}
      {open === 'smoke' && <SmokeButton onClose={() => setOpen(null)} />}
      {open === 'protocol' && <GhostProtocolV2 autoLaunch="menu" onExit={() => setOpen(null)} />}
    </>
  )
}
