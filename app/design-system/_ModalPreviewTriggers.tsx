'use client'
import {
  AchievementUnlockProvider,
  useAchievementUnlock,
} from '@/components/AchievementUnlockModal'
import { LevelUpProvider, useLevelUp } from '@/components/LevelUpModal'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { emit, rollLoot } from '@/lib/rewards'
import { todayKey } from '@/lib/gameLogic'
import type { FocusItem } from '@/lib/todayPlan'

// Podgląd nagród (RewardLayer jest w layoucie, więc działa też tutaj, bez logowania —
// XP się nie zapisuje, widać tylko feedback). Znalezisko: szukamy id, które dziś
// „wyrzuca", bo losowanie jest deterministyczne.
let previewSeq = 0
const previewReward = () => emit('reward', { source: 'routine', id: `preview_${++previewSeq}`, xp: 10, preview: true })
const previewLoot = (rarity?: 'rzadkie' | 'legendarne') => {
  const date = todayKey()
  for (let i = 0; i < 20000; i++) {
    const id = `preview_loot_${previewSeq++}`
    const l = rollLoot(date, id, [])
    if (l && (!rarity || l.rarity === rarity)) { emit('reward', { source: 'quest', id, xp: 50, preview: true }); return }
  }
}

const PREVIEW_FOCUS_QUEUE: FocusItem[] = [
  { key: 'r:m4', kind: 'routine', id: 'm4', title: 'Wypicie ciepłej wody', xp: 10, slot: 'morning' },
  { key: 'q:demo', kind: 'quest', id: 'demo', title: 'Blok głębokiej pracy 90 min', description: 'Jedno zadanie, telefon w drugim pokoju, timer. Kariera i finanse dostają pełną uwagę, nie resztki dnia.', xp: 100, slot: 'quest', pillar: 'kariera' },
  { key: 'r:d1', kind: 'routine', id: 'd1', title: 'Godzina przy biurku', xp: 10, slot: 'daily' },
]
export const openPreviewFocus = () => emit('focus', { preview: PREVIEW_FOCUS_QUEUE })

function Buttons() {
  const { showAchievementUnlock } = useAchievementUnlock()
  const { showLevelUp } = useLevelUp()

  const firstAch = ACHIEVEMENTS[0]?.id
  const hiddenAch = ACHIEVEMENTS.find((a) => a.hidden)?.id

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={previewReward}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors">
        +XP / rozpęd
      </button>
      <button onClick={() => previewLoot()}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors">
        Znalezisko
      </button>
      <button onClick={() => previewLoot('rzadkie')}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors">
        Rzadkie
      </button>
      <button onClick={() => previewLoot('legendarne')}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors">
        Legendarne
      </button>
      <button onClick={openPreviewFocus}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors">
        Jedna rzecz
      </button>
      <button onClick={() => emit('celebrate', { title: 'Dzień domknięty', sub: 'Wszystko z listy zrobione. Odpocznij z czystym sumieniem.', big: true })}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors">
        Świętowanie
      </button>
      <button onClick={() => {
        emit('celebrate', { title: 'Wszystko na teraz zrobione', sub: '3 rzeczy · +120 XP', big: true })
        emit('celebrate', { title: 'Połowa dnia za Tobą', sub: 'Jeszcze jedna rzecz z rozpędu?' })
      }}
        className="border border-hairline px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-muted hover:border-gold transition-colors">
        Dwa świętowania naraz
      </button>
      <button
        onClick={() => firstAch && showAchievementUnlock([firstAch])}
        className="border border-gold px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold hover:text-ivory transition-colors"
      >
        Achievement Modal
      </button>
      {hiddenAch && (
        <button
          onClick={() => showAchievementUnlock([hiddenAch])}
          className="border border-gold-deep px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-gold-deep hover:text-ivory transition-colors"
        >
          Hidden Achievement
        </button>
      )}
      <button
        onClick={() => showLevelUp(7)}
        className="border border-forest px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-forest hover:text-ivory transition-colors"
      >
        Level Up (VII)
      </button>
      <button
        onClick={() => showLevelUp(15)}
        className="border border-forest px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-dark hover:bg-forest hover:text-ivory transition-colors"
      >
        Level Up (XV)
      </button>
      <button
        onClick={() => {
          if (firstAch && ACHIEVEMENTS[1]?.id) {
            showAchievementUnlock([firstAch, ACHIEVEMENTS[1].id])
          }
        }}
        className="border border-hairline px-5 py-2.5 font-ui uppercase tracking-luxury text-[10px] text-muted hover:border-gold transition-colors"
      >
        Queue (2 achievements)
      </button>
    </div>
  )
}

export default function ModalPreviewTriggers() {
  return (
    <AchievementUnlockProvider>
      <LevelUpProvider>
        <Buttons />
      </LevelUpProvider>
    </AchievementUnlockProvider>
  )
}
