'use client'
import Link from 'next/link'
import { useGameData } from '@/hooks/useGameData'
import {
  getDaysElapsed,
  getDaysRemaining,
  getLevelFromXP,
  LEVELS,
} from '@/lib/gameLogic'
import { PILLARS } from '@/lib/pillars'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { toRoman } from '@/lib/romanNumerals'
import {
  RitualSurface,
  SmallCaps,
  GoldRule,
  Fleuron,
  Diamond,
  RomanNumeral,
  CornerBrackets,
} from '@/components/ui'

type Phase = 'before' | 'arrived' | 'after'

function phaseOf(daysLeft: number, daysElapsed: number): Phase {
  if (daysLeft > 0) return 'before'
  if (daysElapsed >= 365) return 'after'
  return 'arrived'
}

const PHASE_COPY: Record<Phase, { eyebrow: string; refrain: string; closingTitle: string }> = {
  before: {
    eyebrow: 'You are walking toward this',
    refrain: 'still in motion — the year is being kept.',
    closingTitle: 'The Year, in Motion',
  },
  arrived: {
    eyebrow: 'The year is held',
    refrain: 'arrived — quietly, deliberately, on her own terms.',
    closingTitle: 'The Year, Held',
  },
  after: {
    eyebrow: 'The year was held',
    refrain: 'a year carried like a private library — kept, signed, returned to.',
    closingTitle: 'The Year, Returned',
  },
}

const FINAL_INSCRIPTION = [
  'this is what a year of becoming looks like —',
  'observed, indexed, and quietly kept.',
  'no announcement. no spectacle.',
  'the days were held the way letters are held —',
  'folded, dated, pressed between covers.',
  'this is your inheritance now. you wrote it yourself.',
]

export default function BirthdayPage() {
  const { stats, loading } = useGameData()
  const daysLeft = getDaysRemaining()
  const daysElapsed = getDaysElapsed()
  const phase = phaseOf(daysLeft, daysElapsed)
  const level = getLevelFromXP(stats.totalXP)
  const lastLevel = LEVELS[LEVELS.length - 1]
  const phaseCopy = PHASE_COPY[phase]
  const unlockedCount = stats.unlockedAchievements?.length ?? 0
  const heartBlocksCount = stats.completedHeartBlocks?.length ?? 0

  return (
    <RitualSurface tone="dark" frame="brackets" className="animate-fade-in">
      <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 pt-12 md:pt-20 pb-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-ui uppercase tracking-luxury text-[10px] text-parchment hover:text-gold-light transition-colors mb-12"
        >
          ‹ Wróć
        </Link>

        {/* OPENING */}
        <header className="text-center">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            {phaseCopy.eyebrow}
          </SmallCaps>

          {/* Monumental XXX */}
          <div className="mt-10 mb-6 relative">
            <p className="font-display text-ivory text-[clamp(4rem,12vw,9rem)] leading-[0.85]">
              XXX
            </p>
            {/* gold lines flanking */}
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-0 right-0 px-8 pointer-events-none">
              <div className="h-px bg-gold-light/20 mx-auto max-w-md" />
            </div>
          </div>

          <SmallCaps tone="gold" tracking="editorial" size="sm">
            Natalia · the thirtieth year
          </SmallCaps>

          <GoldRule variant="fleuron" tone="gold" className="mt-8 max-w-sm mx-auto" />

          <p className="font-display text-gold-light text-2xl md:text-3xl mt-7 leading-snug">
            V · IV · MMXXVII
          </p>
          <p className="font-serif-body italic text-parchment text-base mt-3">
            five of april, two thousand twenty-seven
          </p>
        </header>

        {/* Status line */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <Diamond size={6} className="text-gold" />
          <SmallCaps tone="parchment" tracking="luxury" size="sm">
            {phase === 'before'
              ? `${daysLeft} days remain · day ${daysElapsed} of ccclxv`
              : phase === 'arrived'
                ? 'the day · arrived'
                : 'recorded · returned to'}
          </SmallCaps>
          <Diamond size={6} className="text-gold" />
        </div>

        {phase === 'before' && (
          <p className="font-serif-body italic text-parchment/80 text-center text-[14px] mt-3">
            {phaseCopy.refrain}
          </p>
        )}

        {/* ============= THE RECKONING ============= */}
        <section className="mt-20">
          <div className="flex items-baseline gap-3 mb-6">
            <RomanNumeral value={1} className="text-gold text-base" />
            <SmallCaps tone="gold" tracking="editorial" size="sm">
              The Reckoning · co zostało zapisane
            </SmallCaps>
          </div>
          <GoldRule variant="diamond" tone="gold-deep" className="mb-10 opacity-50" />

          {loading ? (
            <p className="text-parchment/60 text-center font-serif-body italic">
              ...
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-gold-light/15 border border-gold-light/25">
              <ReckoningCell
                label="Day"
                primary={daysElapsed.toString().padStart(3, '0')}
                sub={`of ${toRoman(365)}`}
              />
              <ReckoningCell
                label="Total XP"
                primary={stats.totalXP.toLocaleString('pl-PL')}
                sub="recorded"
              />
              <ReckoningCell
                label="Level"
                primary={toRoman(level.level)}
                sub={level.name}
              />
              <ReckoningCell
                label="Longest Streak"
                primary={stats.longestStreak.toString()}
                sub={stats.longestStreak === 1 ? 'day held' : 'days held'}
              />
              <ReckoningCell
                label="Devotions"
                primary={`${unlockedCount}`}
                sub={`of ${ACHIEVEMENTS.length}`}
              />
              <ReckoningCell
                label="Heart Blocks"
                primary={heartBlocksCount.toString()}
                sub="weeks closed"
              />
            </div>
          )}
        </section>

        {/* ============= THE PILLARS BOUND ============= */}
        <section className="mt-20">
          <div className="flex items-baseline gap-3 mb-6">
            <RomanNumeral value={2} className="text-gold text-base" />
            <SmallCaps tone="gold" tracking="editorial" size="sm">
              The Pillars Bound · siedem materii
            </SmallCaps>
          </div>
          <GoldRule variant="diamond" tone="gold-deep" className="mb-10 opacity-50" />

          <div className="space-y-3">
            {PILLARS.map((p, i) => {
              const xp = (stats.pillarXP?.[p.id as keyof typeof stats.pillarXP] ?? 0) as number
              const total = Object.values(stats.pillarXP || {}).reduce(
                (a, b) => a + (b as number),
                0
              )
              const pct = total > 0 ? Math.round((xp / total) * 100) : 0
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 border border-gold-light/20 px-4 py-3"
                >
                  <RomanNumeral value={i + 1} className="text-gold text-sm w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-heading text-ivory text-base truncate">{p.name}</p>
                      <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                        {xp.toLocaleString('pl-PL')} XP
                      </SmallCaps>
                    </div>
                    <div className="mt-2 relative h-px w-full bg-forest">
                      <div
                        className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ============= LEVEL JOURNEY ============= */}
        <section className="mt-20">
          <div className="flex items-baseline gap-3 mb-6">
            <RomanNumeral value={3} className="text-gold text-base" />
            <SmallCaps tone="gold" tracking="editorial" size="sm">
              The Ascent · od ziarnka do natalii
            </SmallCaps>
          </div>
          <GoldRule variant="diamond" tone="gold-deep" className="mb-10 opacity-50" />

          <div className="flex flex-wrap gap-x-3 gap-y-2 items-baseline justify-center">
            {LEVELS.map((l) => {
              const reached = level.level >= l.level
              return (
                <div key={l.level} className="flex items-baseline gap-1.5 shrink-0">
                  <RomanNumeral
                    value={l.level}
                    className={`text-sm ${reached ? 'text-gold' : 'text-parchment/30'}`}
                  />
                  <span
                    className={`font-serif-body text-[13px] ${
                      reached ? 'text-ivory italic' : 'text-parchment/30'
                    }`}
                  >
                    {l.name}
                  </span>
                  {l.level !== lastLevel.level && (
                    <Diamond size={4} className="text-gold-deep/40 ml-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ============= FINAL INSCRIPTION ============= */}
        <section className="mt-24">
          <div className="relative bg-forest-deep grain-linen border border-gold-light/40 px-8 py-10 md:px-12 md:py-14">
            <CornerBrackets size={22} tone="gold" weight={1} />

            <div className="text-center">
              <Fleuron size={14} className="text-gold mb-6 inline-block" />
              <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div">
                {phaseCopy.closingTitle}
              </SmallCaps>
              <div className="mt-8 space-y-3">
                {FINAL_INSCRIPTION.map((line, i) => (
                  <p
                    key={i}
                    className="font-serif-body italic text-ivory text-[15px] md:text-[17px] leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
              <GoldRule variant="fleuron" tone="gold" className="mt-10 max-w-xs mx-auto" />
            </div>
          </div>
        </section>

        {/* ============= SIGNATURE ============= */}
        <footer className="mt-20">
          <div className="flex items-center justify-center gap-3">
            <Fleuron size={12} className="text-gold-deep" />
            <SmallCaps tone="parchment" tracking="editorial" size="xs">
              ex libris · natalia · v · iv · mmxxvii
            </SmallCaps>
            <Fleuron size={12} className="text-gold-deep" />
          </div>
          <p className="font-serif-body italic text-parchment/50 text-center text-[12px] mt-5">
            Quiet Inheritance · Vol. II — the year of becoming
          </p>
        </footer>
      </div>
    </RitualSurface>
  )
}

function ReckoningCell({
  label,
  primary,
  sub,
}: {
  label: string
  primary: string
  sub: string
}) {
  return (
    <div className="bg-dark px-4 py-6 md:px-6 md:py-7 text-center">
      <SmallCaps tone="gold-light" tracking="luxury" size="xs">
        {label}
      </SmallCaps>
      <p className="font-display text-ivory text-[clamp(2rem,5vw,3rem)] leading-none mt-3">
        {primary}
      </p>
      <p className="font-serif-body italic text-parchment text-[12px] mt-2">{sub}</p>
    </div>
  )
}
