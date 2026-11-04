'use client'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { getRewardPrefs, setRewardPrefs, onRewardPrefs, playFanfare, buzz, type RewardPrefs } from '@/lib/rewardFx'
import { SmallCaps } from '@/components/ui'

// Nagrody: per urządzenie (localStorage) — na telefonie dźwięk może być
// włączony, na laptopie w pracy wyłączony.
const ROWS: { key: keyof RewardPrefs; label: string; desc: string }[] = [
  { key: 'fx', label: 'Animacje nagród', desc: '+XP przy odhaczeniu, licznik rozpędu, konfetti' },
  { key: 'sound', label: 'Dźwięk', desc: 'dzwoneczek, który idzie w górę razem z rozpędem' },
  { key: 'haptics', label: 'Wibracje', desc: 'krótkie stuknięcie przy odhaczeniu (Android)' },
]

export default function RewardsSection() {
  const [prefs, setPrefs] = useState<RewardPrefs>({ fx: true, sound: true, haptics: true })
  useEffect(() => {
    setPrefs(getRewardPrefs())
    return onRewardPrefs(setPrefs)
  }, [])

  const toggle = (key: keyof RewardPrefs) => {
    const next = setRewardPrefs({ [key]: !prefs[key] })
    if (key === 'sound' && next.sound) playFanfare(3)
    if (key === 'haptics' && next.haptics) buzz([15, 40, 15])
  }

  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">Nagrody</SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mb-1">Feedback przy odhaczaniu</h2>
      <p className="font-serif-body italic text-muted text-[13px] mb-5 leading-relaxed">
        ustawienia tego urządzenia. przy włączonym „ogranicz ruch” w systemie animacje i tak się wyciszają.
      </p>
      <div className="divide-y divide-border/60">
        {ROWS.map(r => (
          <div key={r.key} className="flex items-center gap-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-display text-dark text-[15px]">{r.label}</p>
              <p className="font-serif-body italic text-muted text-[12.5px]">{r.desc}</p>
            </div>
            <button
              onClick={() => toggle(r.key)}
              role="switch"
              aria-checked={prefs[r.key]}
              aria-label={r.label}
              className={clsx('flex-shrink-0 w-9 h-5 transition-colors relative border', prefs[r.key] ? 'bg-gold border-gold' : 'bg-cream/50 border-hairline')}
            >
              <span className={clsx('absolute top-0.5 w-3.5 h-3.5 transition-transform', prefs[r.key] ? 'bg-ivory left-[18px]' : 'bg-muted-light left-0.5')} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
