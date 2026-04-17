'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { todayKey } from '@/lib/gameLogic'
import { Camera, ScrollText, X } from 'lucide-react'

// Thresholds in days
const PHOTO_NUDGE_DAYS = 7
const VAULT_NUDGE_DAYS = 14

function daysBetweenKeys(a: string, b: string): number {
  const toMs = (k: string) => new Date(k + 'T12:00:00').getTime()
  return Math.round((toMs(b) - toMs(a)) / 86400000)
}

interface NudgeCardProps {
  icon: React.ReactNode
  label: string
  title: string
  sub: string
  href: string
  onDismiss: () => void
}

function NudgeCard({ icon, label, title, sub, href, onDismiss }: NudgeCardProps) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-3 bg-white border border-cream rounded-2xl px-4 py-3 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-gold-pale flex items-center justify-center flex-shrink-0 text-gold">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[9px] text-muted uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-serif text-dark text-sm leading-snug">{title}</p>
        <p className="font-sans text-xs text-muted leading-snug mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => router.push(href)}
        className="font-sans text-xs text-gold bg-gold-pale px-3 py-1.5 rounded-xl hover:opacity-80 transition-opacity flex-shrink-0"
      >
        Przejdź
      </button>
      <button
        onClick={onDismiss}
        className="text-muted-light hover:text-muted transition-colors flex-shrink-0 ml-0.5"
        aria-label="Zamknij"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}

export default function DashboardNudges() {
  const { user } = useAuth()
  const [photoNudge, setPhotoNudge] = useState<{ daysSince: number } | null>(null)
  const [vaultNudge, setVaultNudge] = useState<{ daysSince: number } | null>(null)
  const [photoDismissed, setPhotoDismissed] = useState(false)
  const [vaultDismissed, setVaultDismissed] = useState(false)

  useEffect(() => {
    if (!user) return

    const today = todayKey()
    const sessionPhotoKey = `nudge_photo_${today}`
    const sessionVaultKey = `nudge_vault_${today}`

    // Check session dismissals
    if (sessionStorage.getItem(sessionPhotoKey)) setPhotoDismissed(true)
    if (sessionStorage.getItem(sessionVaultKey)) setVaultDismissed(true)

    // Query last photo
    ;(async () => {
      try {
        const photosRef = collection(db, 'users', user.uid, 'photos')
        const q = query(photosRef, orderBy('createdAt', 'desc'), limit(1))
        const snap = await getDocs(q)
        if (snap.empty) {
          // No photos ever — gentle nudge after project starts (always show)
          setPhotoNudge({ daysSince: 999 })
        } else {
          const dateKey: string = snap.docs[0].data().dateKey ?? today
          const diff = daysBetweenKeys(dateKey, today)
          if (diff >= PHOTO_NUDGE_DAYS) setPhotoNudge({ daysSince: diff })
        }
      } catch (e) {
        console.warn('nudge photo query error', e)
      }
    })()

    // Query last vault entry
    ;(async () => {
      try {
        const vaultRef = collection(db, 'users', user.uid, 'vault')
        const q = query(vaultRef, orderBy('createdAt', 'desc'), limit(1))
        const snap = await getDocs(q)
        if (snap.empty) {
          setVaultNudge({ daysSince: 999 })
        } else {
          const dateKey: string = snap.docs[0].data().dateKey ?? today
          const diff = daysBetweenKeys(dateKey, today)
          if (diff >= VAULT_NUDGE_DAYS) setVaultNudge({ daysSince: diff })
        }
      } catch (e) {
        console.warn('nudge vault query error', e)
      }
    })()
  }, [user?.uid])

  const dismissPhoto = () => {
    sessionStorage.setItem(`nudge_photo_${todayKey()}`, '1')
    setPhotoDismissed(true)
  }

  const dismissVault = () => {
    sessionStorage.setItem(`nudge_vault_${todayKey()}`, '1')
    setVaultDismissed(true)
  }

  const showPhoto = photoNudge && !photoDismissed
  const showVault = vaultNudge && !vaultDismissed

  if (!showPhoto && !showVault) return null

  return (
    <div className="space-y-2 mb-4">
      {showPhoto && (
        <NudgeCard
          icon={<Camera size={16} strokeWidth={1.5} />}
          label="Photo Timeline"
          title={
            photoNudge!.daysSince >= 999
              ? 'Nie masz jeszcze żadnego zdjęcia'
              : `Ostatnie zdjęcie: ${photoNudge!.daysSince} ${photoNudge!.daysSince === 1 ? 'dzień' : 'dni'} temu`
          }
          sub={
            photoNudge!.daysSince >= 999
              ? 'Dodaj pierwsze zdjęcie transformacji.'
              : 'Rok mija — udokumentuj go.'
          }
          href="/photos"
          onDismiss={dismissPhoto}
        />
      )}
      {showVault && (
        <NudgeCard
          icon={<ScrollText size={16} strokeWidth={1.5} />}
          label="Skarbiec"
          title={
            vaultNudge!.daysSince >= 999
              ? 'Nie napisałaś jeszcze do Skarbca'
              : `Skarbiec czeka ${vaultNudge!.daysSince} ${vaultNudge!.daysSince === 1 ? 'dzień' : 'dni'}`
          }
          sub={
            vaultNudge!.daysSince >= 999
              ? 'Napisz pierwszy list jako Natalia 30.'
              : 'Natalia 30 ma jeszcze coś do powiedzenia.'
          }
          href="/vault"
          onDismiss={dismissVault}
        />
      )}
    </div>
  )
}
