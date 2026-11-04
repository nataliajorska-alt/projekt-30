'use client'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import WaxSeal from './WaxSeal'
import { useGameData } from '@/hooks/useGameData'
import { todayKey } from '@/lib/gameLogic'
import { rollSeal, sealRewardId, pickJoy, emit } from '@/lib/rewards'
import { playFanfare, buzz } from '@/lib/rewardFx'

// Pieczęć dnia — pierwsze otwarcie apki w danym dniu: lak do złamania, pod nim
// losowe XP (raz na 20 dni złota pieczęć: +100) i mała przyjemność na dziś.
// Powód, żeby zajrzeć rano, zanim cokolwiek trzeba odhaczyć. Raz dziennie
// (rewardsClaimed), więc drugie urządzenie nie pokaże jej ponownie. Po złamaniu
// przyjemność zostaje jako jedna linijka do końca dnia, aż się ją schowa.

const WAX = '#8A3A2C'
const BREAK_MS = 560

export type SealPhase = 'sealed' | 'breaking' | 'open' | 'reminder'

export default function DailySeal() {
  const { todayLog, loading, claimReward } = useGameData()
  const [phase, setPhase] = useState<'sealed' | 'breaking' | 'open' | 'gone'>('sealed')
  const date = todayKey()
  const rid = sealRewardId(date)
  const closedKey = `p30.seal.closed.${date}`
  // Schowana linijka — per urządzenie. null, póki nie przeczytamy localStorage.
  const [closed, setClosed] = useState<boolean | null>(null)
  useEffect(() => {
    try { setClosed(localStorage.getItem(closedKey) === '1') } catch { setClosed(false) }
  }, [closedKey])

  if (loading || !todayLog || phase === 'gone') return null
  const claimed = (todayLog.rewardsClaimed ?? []).includes(rid)
  // Złamana wcześniej (albo na innym urządzeniu) — już bez laku, najwyżej linijka.
  if (phase === 'sealed' && claimed && closed !== false) return null

  const { xp, golden } = rollSeal(date)

  const breakSeal = () => {
    if (phase !== 'sealed') return
    setPhase('breaking')
    buzz(15)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => {
      setPhase('open')
      playFanfare(golden ? 5 : 3)
      if (golden) emit('celebrate', { title: 'Złota pieczęć', sub: `+${xp} XP — taki dzień zdarza się rzadko`, big: true })
    }, reduced ? 0 : BREAK_MS)
    void claimReward(rid, xp)
  }

  const close = () => {
    setPhase('gone')
    try { localStorage.setItem(closedKey, '1') } catch { /* prywatne okno */ }
  }

  return (
    <SealView
      phase={phase === 'sealed' && claimed ? 'reminder' : phase}
      xp={xp}
      golden={golden}
      joy={pickJoy(date)}
      onBreak={breakSeal}
      onClose={close}
    />
  )
}

/** Sam wygląd pieczęci — DailySeal prowadzi stan, /design-system pokazuje przykład. */
export function SealView({ phase, xp, golden, joy, onBreak, onClose }: {
  phase: SealPhase
  xp: number
  golden: boolean
  joy: string
  onBreak: () => void
  onClose: () => void
}) {
  if (phase === 'sealed' || phase === 'breaking') {
    return (
      <button
        onClick={onBreak}
        className="group w-full flex items-center gap-4 border border-gold-light/50 bg-ivory hover:border-gold px-4 py-3.5 mb-4 text-left transition-colors"
        aria-label="Złam pieczęć dnia"
      >
        <WaxSeal color={WAX} monogram="N" size={50} breaking={phase === 'breaking'} className="group-hover:scale-105 transition-transform" />
        <span className="flex-1 min-w-0">
          <span className="block font-ui uppercase tracking-luxury text-[9.5px] text-gold-deep">Pieczęć dnia</span>
          <span className="block font-display text-dark text-[18px] leading-tight mt-0.5">Złam, żeby zobaczyć, co dziś czeka</span>
        </span>
        <span className="font-ui uppercase tracking-luxury text-[9px] text-muted group-hover:text-dark shrink-0">dotknij ◆</span>
      </button>
    )
  }

  if (phase === 'reminder') {
    return (
      <div className="flex items-center gap-3 border border-gold-light/40 bg-ivory pl-4 pr-2 py-2 mb-4">
        <span className="font-ui uppercase tracking-luxury text-[9px] text-gold-deep shrink-0">Na dziś</span>
        <span className="flex-1 min-w-0 font-serif-body italic text-[14px] text-dark leading-snug">{joy}</span>
        <button onClick={onClose} aria-label="Schowaj przyjemność dnia" className="shrink-0 p-2 text-muted-light hover:text-dark">
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className={clsx(
      'loot-in relative border px-5 py-4 mb-4',
      golden ? 'bg-dark text-ivory border-gold' : 'bg-ivory text-dark border-gold-light/60',
    )}>
      <button onClick={onClose} aria-label="Zamknij"
        className={clsx('absolute top-2.5 right-2.5 p-1.5', golden ? 'text-ivory/60 hover:text-ivory' : 'text-muted-light hover:text-dark')}>
        <X size={14} />
      </button>
      <div className="flex items-baseline gap-3">
        <span className={clsx('font-ui uppercase tracking-luxury text-[9.5px]', golden ? 'text-gold-light' : 'text-gold-deep')}>
          {golden ? '✦ Złota pieczęć' : 'Pieczęć złamana'}
        </span>
        <span className={clsx('font-display italic text-[24px] leading-none', golden ? 'text-gold' : 'text-gold-deep')}>+{xp} XP</span>
      </div>
      <p className={clsx('font-ui uppercase tracking-luxury text-[9px] mt-3', golden ? 'text-ivory/60' : 'text-muted')}>
        Mała przyjemność na dziś
      </p>
      <p className="font-display text-[19px] leading-snug mt-1 pr-6">{joy}</p>
    </div>
  )
}
