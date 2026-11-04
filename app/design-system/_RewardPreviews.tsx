'use client'
import { useState } from 'react'
import { SealView, type SealPhase } from '@/components/DailySeal'
import { NowCard } from '@/components/DashboardNow'
import { pickJoy, rollSeal } from '@/lib/rewards'
import { todayKey } from '@/lib/gameLogic'
import { openPreviewFocus } from './_ModalPreviewTriggers'

// Pieczęć dnia i karta „Teraz" na przykładowych danych. Prawdziwe komponenty
// czekają na log dnia (czyli na zalogowanie) — tu widać sam wygląd i przejścia.
const SEAL_PHASES: { phase: SealPhase; label: string }[] = [
  { phase: 'sealed', label: 'Lak' },
  { phase: 'open', label: 'Złamana' },
  { phase: 'reminder', label: 'Linijka' },
]

export default function RewardPreviews() {
  const [phase, setPhase] = useState<SealPhase>('sealed')
  const [golden, setGolden] = useState(false)
  const date = todayKey()
  const seal = rollSeal(date)
  const xp = golden ? 100 : seal.golden ? 40 : seal.xp
  const breakSeal = () => {
    setPhase('breaking')
    setTimeout(() => setPhase('open'), 560)
  }

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 mt-12">
      <div>
        <p className="font-ui uppercase tracking-luxury text-[9px] text-muted mb-3">Pieczęć dnia</p>
        <SealView phase={phase} xp={xp} golden={golden} joy={pickJoy(date)} onBreak={breakSeal} onClose={() => setPhase('reminder')} />
        <div className="flex flex-wrap gap-2">
          {SEAL_PHASES.map(p => (
            <button key={p.phase} onClick={() => setPhase(p.phase)}
              className="border border-hairline px-3 py-1.5 font-ui uppercase tracking-luxury text-[9px] text-muted hover:border-gold transition-colors">
              {p.label}
            </button>
          ))}
          <button onClick={() => setGolden(g => !g)}
            className="border border-hairline px-3 py-1.5 font-ui uppercase tracking-luxury text-[9px] text-muted hover:border-gold transition-colors">
            {golden ? 'Zwykła' : 'Złota'}
          </button>
        </div>
      </div>

      <div>
        <p className="font-ui uppercase tracking-luxury text-[9px] text-muted mb-3">Karta „Teraz”</p>
        <NowCard
          pct={42} label="dokończ poranny rytuał"
          next={{ title: 'Wypicie ciepłej wody', xp: 10 }}
          done={5} total={12} streakNote="seria 12 dni · podtrzymaj ją" lootToday={2}
          eveningWindow={false} onFocus={openPreviewFocus} onClosing={() => {}}
        />
        <NowCard
          pct={100} label="dzień domknięty — możesz odpocząć"
          next={null}
          done={12} total={12} streakNote="seria 13 dni" lootToday={5}
          eveningWindow onFocus={openPreviewFocus} onClosing={() => {}}
        />
      </div>
    </div>
  )
}
