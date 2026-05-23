'use client'
import {
  AchievementUnlockProvider,
  useAchievementUnlock,
} from '@/components/AchievementUnlockModal'
import { LevelUpProvider, useLevelUp } from '@/components/LevelUpModal'
import { ACHIEVEMENTS } from '@/lib/achievements'

function Buttons() {
  const { showAchievementUnlock } = useAchievementUnlock()
  const { showLevelUp } = useLevelUp()

  const firstAch = ACHIEVEMENTS[0]?.id
  const hiddenAch = ACHIEVEMENTS.find((a) => a.hidden)?.id

  return (
    <div className="flex flex-wrap gap-3">
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
