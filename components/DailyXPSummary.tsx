'use client'
import { useGameData } from '@/hooks/useGameData'
import { getLevelFromXP, getNextLevel, getLevelProgress, XP_VALUES } from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'

export default function DailyXPSummary() {
  const { todayLog, stats } = useGameData()
  // XP za check-in nastroju leci tylko do stats.totalXP, nie do log.totalXP
  // (tak samo jak heart block, Ghost V2 i CBT — recoverStats odbudowuje je osobno,
  // więc pisanie ich do logu podwajałoby XP przy każdym rebuildzie).
  // Skutek uboczny: modal obiecywał „+5 XP", a kafelek „Dziś" się nie ruszał.
  // Doliczamy je tu, przy wyświetlaniu — ledger zostaje nietknięty.
  const moodXP = (todayLog?.moodCheckIns?.length ?? 0) * XP_VALUES.moodCheckIn
  const todayXP = (todayLog?.totalXP ?? 0) + moodXP
  const vaultXP = todayLog?.externalXP
    ? Object.values(todayLog.externalXP).reduce<number>((a, b) => a + (b ?? 0), 0)
    : 0
  const total = stats.totalXP

  const level = getLevelFromXP(total)
  const next = getNextLevel(total)
  const lvlProgress = getLevelProgress(total)
  const xpToNext = next ? Math.max(0, next.xpRequired - total) : 0

  return (
    <div className="border-t border-b border-hairline px-1 py-4 sm:py-5 flex flex-col">
      {/* Top — title + total. my-auto = vertical centering inside flex-col
         (matches design `.xp-card .top { margin: auto 0; }`). */}
      <div className="flex justify-between items-baseline my-auto min-h-[38px] py-1.5">
        <h3 className="font-display text-dark text-2xl sm:text-[26px] leading-none tracking-tight">
          XP{' '}
          <span className="font-serif-body italic text-muted text-[13px] ml-2.5 font-normal align-baseline">
            łącznie
          </span>
        </h3>
        <span className="font-display text-dark text-[22px] sm:text-[26px] leading-none tracking-tight tabular-nums">
          {total.toLocaleString('pl-PL')}
        </span>
      </div>

      {/* Bottom — two stats stitched by a thin rule */}
      <div className="mt-auto pt-3 border-t border-border/60 flex justify-between items-end">
        <div>
          <div className="font-ui uppercase tracking-luxury text-[9px] text-muted mb-1">
            Dziś
          </div>
          <div className="font-display italic font-medium text-gold-deep text-[20px] leading-none tabular-nums">
            +{todayXP.toLocaleString('pl-PL')}
          </div>
          {vaultXP > 0 && (
            <div
              className="mt-1 inline-flex items-center gap-1.5"
              title={`z The Learning Vault: +${vaultXP} XP`}
            >
              <span className="text-gold text-[8px] leading-none">◆</span>
              <span className="font-serif-body italic text-gold-deep text-[11px] tabular-nums">
                vault · +{vaultXP}
              </span>
            </div>
          )}
          {moodXP > 0 && (
            <div
              className="mt-1 inline-flex items-center gap-1.5"
              title={`za check-iny nastroju: +${moodXP} XP`}
            >
              <span className="text-gold text-[8px] leading-none">◆</span>
              <span className="font-serif-body italic text-gold-deep text-[11px] tabular-nums">
                nastrój · +{moodXP}
              </span>
            </div>
          )}
        </div>

        <div className="text-right">
          {next ? (
            <>
              <div className="font-ui uppercase tracking-luxury text-[9px] text-muted mb-1">
                Do level {toRoman(level.level + 1)}
              </div>
              <div className="font-display italic font-medium text-gold-deep text-[20px] leading-none tabular-nums">
                {xpToNext.toLocaleString('pl-PL')}
              </div>
              <div className="font-serif-body italic text-muted-light text-[11px] mt-1">
                {lvlProgress}% → {next.name}
              </div>
            </>
          ) : (
            <div className="font-serif-body italic text-gold-deep text-[14px]">
              ostatni poziom — Natalia 30
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
