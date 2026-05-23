'use client'
import Link from 'next/link'
import {
  getDaysRemaining,
  getDaysElapsed,
  getProjectProgress,
  getLevelFromXP,
  getNextLevel,
  getLevelProgress,
  todayKey,
} from '@/lib/gameLogic'
import { useGameData } from '@/hooks/useGameData'
import { getDailySpark } from '@/lib/questData'
import { getCurrentMonthData } from '@/lib/seasonal/monthData'
import { useSparkSchedule } from '@/hooks/useSparkSchedule'
import { toRoman } from '@/lib/romanNumerals'
import { SmallCaps, GoldRule, Fleuron, Diamond, CornerBrackets } from '@/components/ui'

function pad3(n: number): string {
  return n < 1000 ? n.toString().padStart(3, '0') : n.toString()
}

export default function CountdownHero() {
  const { stats } = useGameData()
  const { sparks } = useSparkSchedule()
  const daysLeft = getDaysRemaining()
  const daysElapsed = getDaysElapsed()
  const projectProgress = getProjectProgress()
  const level = getLevelFromXP(stats.totalXP)
  const nextLevel = getNextLevel(stats.totalXP)
  const lvlProgress = getLevelProgress(stats.totalXP)
  const key = todayKey()
  const spark = sparks[key] || getDailySpark(key)
  const month = getCurrentMonthData()

  return (
    <div className="relative bg-dark-deep text-ivory mb-6 grain-linen overflow-hidden">
      {/* Double frame */}
      <div className="pointer-events-none absolute inset-3 border border-gold-light/40" />
      <div className="pointer-events-none absolute inset-[14px] border border-gold-light/15" />
      {/* Corner brackets — slightly inside the double frame */}
      <div className="pointer-events-none absolute inset-6">
        <CornerBrackets size={14} tone="gold" weight={1} />
      </div>

      <div className="relative p-8 md:p-10">
        {/* MONUMENTAL DAY NUMBER */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[clamp(2.25rem,7vw,3.75rem)] leading-[0.9] text-ivory">
                {pad3(daysElapsed)}
              </span>
              <span className="font-serif-body italic text-parchment text-base md:text-lg whitespace-nowrap">
                of {toRoman(365)}
              </span>
            </div>
          </div>
          <Link
            href="/30"
            className="text-right shrink-0 group/birthday hover:opacity-95 transition-opacity"
            title="Strona urodzin — V · IV · MMXXVII"
          >
            <div className="font-display text-3xl md:text-4xl text-gold-light group-hover/birthday:text-ivory transition-colors">
              {daysLeft}
              <span className="ml-2 font-serif-body italic text-parchment text-base">days</span>
            </div>
          </Link>
        </div>

        {/* Project progress — hairline with diamond head */}
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <SmallCaps tone="parchment" size="xs">
              Project progress
            </SmallCaps>
            <SmallCaps tone="gold-light" size="xs">
              {projectProgress}%
            </SmallCaps>
          </div>
          <div className="relative mt-2 h-px w-full bg-forest">
            <div
              className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
              style={{ width: `${projectProgress}%` }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: `calc(${projectProgress}% - 4px)`,
                top: '-3.5px',
                width: 8,
                height: 8,
                lineHeight: 0,
              }}
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 10 10"
                className="text-gold"
                style={{ display: 'block' }}
              >
                <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>

        <GoldRule variant="diamond" className="mt-8" tone="gold-deep" />

        {/* Level */}
        <div className="mt-6">
          <div className="flex justify-between items-baseline gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <SmallCaps tone="gold" size="md" tracking="luxury">
                Level {toRoman(level.level)}
              </SmallCaps>
              <span className="font-heading text-ivory text-base truncate">
                {level.name}
              </span>
            </div>
            {nextLevel && (
              <SmallCaps tone="parchment" size="xs" className="shrink-0">
                {lvlProgress}% → {nextLevel.name}
              </SmallCaps>
            )}
          </div>
          {/* Segmented bar — 12 marks */}
          <div className="mt-3 flex gap-[3px]">
            {Array.from({ length: 24 }).map((_, i) => {
              const filled = i < Math.round((lvlProgress / 100) * 24)
              return (
                <span
                  key={i}
                  className={`h-[3px] flex-1 transition-colors ${
                    filled ? 'bg-gold' : 'bg-forest'
                  }`}
                />
              )
            })}
          </div>
          <div className="mt-2 flex justify-between">
            <span className="font-ui text-[10px] text-parchment">
              {stats.totalXP.toLocaleString('pl-PL')} XP
            </span>
            {nextLevel && (
              <span className="font-ui text-[10px] text-parchment">
                {nextLevel.xpRequired.toLocaleString('pl-PL')} XP
              </span>
            )}
          </div>
        </div>

        {/* MARGINALIA — monthly motto + daily spark */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative border border-gold-light/25 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Fleuron size={10} className="text-gold" />
              <SmallCaps tone="gold-light" size="xs" tracking="luxury">
                Hasło · {month.name}
              </SmallCaps>
            </div>
            <p className="font-serif-body italic text-ivory text-[13px] leading-relaxed">
              &ldquo;{month.motto}&rdquo;
            </p>
          </div>
          <div className="relative border border-gold-light/15 px-4 py-3 bg-forest/30">
            <div className="flex items-center gap-2 mb-2">
              <Diamond size={6} className="text-gold-light" />
              <SmallCaps tone="gold-light" size="xs" tracking="luxury">
                Iskra dnia
              </SmallCaps>
            </div>
            <p className="font-serif-body italic text-parchment text-[13px] leading-relaxed">
              &ldquo;{spark}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
