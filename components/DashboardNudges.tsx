'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from '@/hooks/useAuth'
import { todayKey } from '@/lib/gameLogic'
import type { MoodCheckIn } from '@/types'
import { Camera, ScrollText, Heart, X } from 'lucide-react'
import { SmallCaps, Diamond } from '@/components/ui'

const PHOTO_NUDGE_DAYS = 7
const VAULT_NUDGE_DAYS = 14
const CRISIS_MOOD_THRESHOLD = 2
const CRISIS_LOOKBACK_DAYS = 3

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
    <div className="flex items-center gap-3 bg-ivory border border-gold-light/40 px-4 py-3">
      <div className="w-9 h-9 border border-gold-light/60 flex items-center justify-center flex-shrink-0 text-gold-deep">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          {label}
        </SmallCaps>
        <p className="font-heading text-dark text-[14px] leading-snug mt-0.5">
          {title}
        </p>
        <p className="font-serif-body italic text-muted text-[12px] leading-snug mt-0.5">
          {sub}
        </p>
      </div>
      <button
        onClick={() => router.push(href)}
        className="border border-gold-light/60 px-3 py-1.5 hover:border-gold hover:bg-gold-pale/40 transition-colors flex-shrink-0"
      >
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Przejdź
        </SmallCaps>
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
  const [crisisNudge, setCrisisNudge] = useState<boolean>(false)
  const [photoDismissed, setPhotoDismissed] = useState(false)
  const [vaultDismissed, setVaultDismissed] = useState(false)
  const [crisisDismissed, setCrisisDismissed] = useState(false)

  useEffect(() => {
    if (!user) return

    const today = todayKey()
    const sessionPhotoKey = `nudge_photo_${today}`
    const sessionVaultKey = `nudge_vault_${today}`
    const sessionCrisisKey = `nudge_crisis_${today}`

    if (sessionStorage.getItem(sessionPhotoKey)) setPhotoDismissed(true)
    if (sessionStorage.getItem(sessionVaultKey)) setVaultDismissed(true)
    if (sessionStorage.getItem(sessionCrisisKey)) setCrisisDismissed(true)

    ;(async () => {
      try {
        const photosRef = collection(db, ...paths.photosCol(user.uid))
        const q = query(photosRef, orderBy('createdAt', 'desc'), limit(1))
        const snap = await getDocs(q)
        if (snap.empty) {
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

    ;(async () => {
      try {
        const vaultRef = collection(db, ...paths.vaultCol(user.uid))
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

    ;(async () => {
      try {
        const crisisQuery = query(
          collection(db, ...paths.vaultCol(user.uid)),
          where('letterType', '==', 'crisis'),
          limit(1),
        )
        const crisisSnap = await getDocs(crisisQuery)
        if (crisisSnap.empty) return

        const dateKeys: string[] = []
        const baseDate = new Date(today + 'T12:00:00')
        for (let i = 0; i < CRISIS_LOOKBACK_DAYS; i++) {
          const d = new Date(baseDate)
          d.setDate(d.getDate() - i)
          dateKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        }

        const logSnaps = await Promise.all(
          dateKeys.map(k => getDoc(doc(db, ...paths.logDoc(user.uid, k))))
        )
        const dailyAverages: number[] = []
        for (const snap of logSnaps) {
          if (!snap.exists()) continue
          const checkIns = (snap.data().moodCheckIns ?? []) as MoodCheckIn[]
          if (checkIns.length === 0) continue
          const avg = checkIns.reduce((a, c) => a + (c.mood ?? 3), 0) / checkIns.length
          dailyAverages.push(avg)
        }

        if (
          dailyAverages.length >= CRISIS_LOOKBACK_DAYS &&
          dailyAverages.every(a => a <= CRISIS_MOOD_THRESHOLD)
        ) {
          setCrisisNudge(true)
        }
      } catch (e) {
        console.warn('nudge crisis query error', e)
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
  const dismissCrisis = () => {
    sessionStorage.setItem(`nudge_crisis_${todayKey()}`, '1')
    setCrisisDismissed(true)
  }

  const showPhoto = photoNudge && !photoDismissed
  const showVault = vaultNudge && !vaultDismissed
  const showCrisis = crisisNudge && !crisisDismissed

  if (!showPhoto && !showVault && !showCrisis) return null

  return (
    <div className="space-y-2 mb-4">
      {showCrisis && (
        <NudgeCard
          icon={<Heart size={15} strokeWidth={1.5} />}
          label="Skarbiec · trudna chwila"
          title="Masz list napisany na taki dzień jak ten"
          sub="Otwórz go — Natalia 30 zostawiła Ci coś."
          href="/vault"
          onDismiss={dismissCrisis}
        />
      )}
      {showPhoto && (
        <NudgeCard
          icon={<Camera size={15} strokeWidth={1.5} />}
          label="Photo Timeline"
          title={
            photoNudge!.daysSince >= 999
              ? 'Nie masz jeszcze żadnego zdjęcia'
              : `Ostatnie zdjęcie · ${photoNudge!.daysSince} ${photoNudge!.daysSince === 1 ? 'dzień' : 'dni'} temu`
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
          icon={<ScrollText size={15} strokeWidth={1.5} />}
          label="Skarbiec"
          title={
            vaultNudge!.daysSince >= 999
              ? 'Nie napisałaś jeszcze do Skarbca'
              : `Skarbiec czeka · ${vaultNudge!.daysSince} ${vaultNudge!.daysSince === 1 ? 'dzień' : 'dni'}`
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
