'use client'
import { useEffect, useState } from 'react'
import { WifiOff, Check } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'

// Cichy pasek stanu połączenia. Apka działa bez zasięgu (dane i zapisy leżą
// w pamięci urządzenia — lib/firebase.ts, lib/db.ts), więc jedyne, czego trzeba,
// to spokojne potwierdzenie: „widzę, że nie ma sieci, nic nie ginie".
// Bez czerwieni i bez blokowania ekranu — to informacja, nie alarm.
export default function ConnectionStatus() {
  const { statsReady, loading } = useGameData()
  const [online, setOnline] = useState(true)
  const [justBack, setJustBack] = useState(false)

  useEffect(() => {
    setOnline(navigator.onLine)
    let timer: ReturnType<typeof setTimeout> | undefined
    const goOffline = () => { setOnline(false); setJustBack(false) }
    const goOnline = () => {
      setOnline(true)
      setJustBack(true)
      timer = setTimeout(() => setJustBack(false), 3500)
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (online && !justBack) return null

  // Bez sieci i bez danych w pamięci (pierwsze uruchomienie na tym urządzeniu):
  // nie ma czego pokazać ani do czego dopisywać — mówimy to wprost.
  const noLocalData = !online && !loading && !statsReady

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 md:left-[280px] z-[90] flex justify-center px-3 pt-[max(env(safe-area-inset-top),8px)] pointer-events-none print:hidden"
    >
      <div className="banner-in-flat flex items-center gap-2.5 bg-dark text-parchment border border-gold/40 px-3.5 py-2 shadow-lg max-w-[min(92vw,460px)]">
        {online
          ? <Check size={13} strokeWidth={1.75} className="text-gold shrink-0" />
          : <WifiOff size={13} strokeWidth={1.5} className="text-gold-light shrink-0" />}
        <span className="font-serif-body italic text-[13px] leading-snug">
          {online
            ? 'Znów online — wszystko wysłane.'
            : noLocalData
              ? 'Bez zasięgu, a to urządzenie nie ma jeszcze Twoich danych. Połącz się, żeby je pobrać.'
              : 'Bez zasięgu — odhaczaj normalnie. Zapisuję na urządzeniu i wyślę, gdy wróci sieć.'}
        </span>
      </div>
    </div>
  )
}
