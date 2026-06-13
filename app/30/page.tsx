'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
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
  RomanNumeral,
} from '@/components/ui'
import type { Pillar } from '@/types'

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

// Single-hue gold ramp — brightest = most energy, by XP rank.
const GOLD_RAMP = ['#e7d4b3', '#d8c393', '#c9b27f', '#bba36d', '#ad935b', '#9c844a', '#88723b']

export default function BirthdayPage() {
  const { stats, loading } = useGameData()
  const [lit, setLit] = useState(false)
  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => setLit(true), 120)
    return () => clearTimeout(t)
  }, [loading])

  const daysLeft = getDaysRemaining()
  const daysElapsed = getDaysElapsed()
  const phase = phaseOf(daysLeft, daysElapsed)
  const level = getLevelFromXP(stats.totalXP)
  const phaseCopy = PHASE_COPY[phase]
  const unlockedCount = stats.unlockedAchievements?.length ?? 0
  const heartBlocksCount = stats.completedHeartBlocks?.length ?? 0
  const levelPct = Math.round((level.level / LEVELS.length) * 100)

  // ── Pillars: gold ramp assigned by XP rank, rendered in canonical order ──
  const pillarXP = (id: string) => (stats.pillarXP?.[id as Pillar] ?? 0) as number
  const ranked = [...PILLARS]
    .map((p, i) => ({ i, xp: pillarXP(p.id) }))
    .sort((a, b) => b.xp - a.xp)
  const rankOf: Record<number, number> = {}
  ranked.forEach((o, r) => { rankOf[o.i] = r })
  const maxPillarXP = Math.max(1, ...PILLARS.map(p => pillarXP(p.id)))
  const top1 = PILLARS[ranked[0]?.i]
  const top2 = PILLARS[ranked[1]?.i]

  // ── Reckoning cells ──
  const reckoning: ReckoningCellProps[] = [
    { label: 'Day', primary: daysElapsed.toString().padStart(3, '0'), sub: `of ${toRoman(365)}`, bar: Math.min(100, (daysElapsed / 365) * 100) },
    { label: 'Total XP', primary: stats.totalXP.toLocaleString('pl-PL'), sub: 'recorded', wide: true },
    { label: 'Level', primary: toRoman(level.level), sub: level.name, bar: levelPct },
    { label: 'Longest streak', primary: stats.longestStreak.toString(), sub: stats.longestStreak === 1 ? 'day held' : 'days held' },
    { label: 'Devotions', primary: `${unlockedCount}`, sub: `of ${ACHIEVEMENTS.length}`, bar: Math.min(100, (unlockedCount / Math.max(1, ACHIEVEMENTS.length)) * 100) },
    { label: 'Heart blocks', primary: heartBlocksCount.toString(), sub: heartBlocksCount === 1 ? 'week closed' : 'weeks closed' },
  ]

  return (
    <RitualSurface tone="dark" frame="brackets" className="animate-fade-in">
      <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-24">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-ui uppercase tracking-editorial text-[10px] text-muted-light hover:text-ivory transition-colors mb-10"
        >
          <span className="text-gold-light">‹</span> Wróć
        </Link>

        {/* ============ COVER ============ */}
        <header className="text-center">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            {phaseCopy.eyebrow}
          </SmallCaps>

          {/* Monumental XXX with flanking wings */}
          <div className="mt-8 flex items-center justify-center gap-5 md:gap-8 max-w-[760px] mx-auto">
            <span
              className="relative flex-1 h-px hidden sm:block"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(201,178,127,.16) 35%, #c9b27f)' }}
            >
              <span className="absolute right-[-3px] top-1/2 -translate-y-1/2 text-gold-light text-[7px]">◆</span>
            </span>
            <span className="font-display text-ivory text-[clamp(4.5rem,15vw,9.4rem)] leading-[0.9] tracking-[0.09em] [text-indent:0.09em]">
              XXX
            </span>
            <span
              className="relative flex-1 h-px hidden sm:block"
              style={{ background: 'linear-gradient(270deg, transparent, rgba(201,178,127,.16) 35%, #c9b27f)' }}
            >
              <span className="absolute left-[-3px] top-1/2 -translate-y-1/2 text-gold-light text-[7px]">◆</span>
            </span>
          </div>

          <SmallCaps tone="muted-light" tracking="editorial" size="xs" className="mt-7 block">
            Natalia · The thirtieth year
          </SmallCaps>

          <div className="flex items-center justify-center gap-4 max-w-[560px] mx-auto my-8">
            <span className="flex-1 h-px bg-gold-light/15" />
            <span className="text-gold text-[10px] tracking-[0.2em]">∴</span>
            <span className="flex-1 h-px bg-gold-light/15" />
          </div>

          <p className="font-display text-gold-light text-[clamp(2rem,6vw,2.9rem)] leading-none tracking-[0.18em] [text-indent:0.18em]">
            V<span className="text-gold-deep mx-1">·</span>IV<span className="text-gold-deep mx-1">·</span>MMXXVII
          </p>
          <p className="font-serif-body italic text-muted-light/80 text-[clamp(1rem,2.5vw,1.2rem)] mt-4">
            five of april, two thousand twenty-seven
          </p>

          <div className="mt-12 inline-flex items-center gap-4 font-ui uppercase tracking-editorial text-[10px] text-gold-light whitespace-nowrap">
            <span className="text-gold text-[8px]">◆</span>
            {phase === 'before'
              ? `${daysLeft} days remain · day ${daysElapsed} of ${toRoman(365)}`
              : phase === 'arrived'
                ? 'the day · arrived'
                : 'recorded · returned to'}
            <span className="text-gold text-[8px]">◆</span>
          </div>
          <p className="font-serif-body italic text-muted-light/70 text-[15px] mt-4">
            {phaseCopy.refrain}
          </p>
        </header>

        {/* ============ I — THE RECKONING ============ */}
        <SectionHead num={1} title="The Reckoning · co zostało zapisane" />
        {loading ? (
          <p className="text-muted-light/60 text-center font-serif-body italic mt-10">…</p>
        ) : (
          <div className="relative mt-10 border border-gold-light/15 grid grid-cols-2 md:grid-cols-3 gap-px bg-gold-light/10">
            <span className="pointer-events-none absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-gold-light/70 z-10" />
            <span className="pointer-events-none absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-gold-light/70 z-10" />
            {reckoning.map(cell => (
              <ReckoningCell key={cell.label} {...cell} lit={lit} />
            ))}
          </div>
        )}

        {/* ============ II — THE PILLARS BOUND ============ */}
        <SectionHead num={2} title="The Pillars Bound · siedem materii" />
        <div className="mt-9">
          {PILLARS.map((p, i) => {
            const xp = pillarXP(p.id)
            const c = GOLD_RAMP[rankOf[i]]
            const w = (xp / maxPillarXP) * 100
            const lead = rankOf[i] === 0
            return (
              <div
                key={p.id}
                className="grid items-center gap-4 md:gap-6 py-4 border-t border-gold-light/10 first:border-t-0"
                style={{ gridTemplateColumns: '32px minmax(140px,1.1fr) minmax(0,2.4fr) 86px' }}
              >
                <span className="font-display italic text-center text-[17px]" style={{ color: lead ? '#ece3c5' : '#c9b27f' }}>
                  {toRoman(i + 1)}
                </span>
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rotate-45 flex-none"
                    style={{ backgroundColor: c, boxShadow: `0 0 12px -2px ${c}` }}
                  />
                  <span className="font-display font-medium text-ivory text-[17px] md:text-[20px] leading-none tracking-tight truncate">
                    {p.name}
                  </span>
                </span>
                <span className="relative h-2.5 bg-white/5 block">
                  <span
                    className="relative block h-full transition-[width] duration-[1100ms] ease-[cubic-bezier(.2,.7,.2,1)]"
                    style={{ width: lit ? `${w}%` : '0%', backgroundColor: c, boxShadow: `0 0 18px -4px ${c}` }}
                  >
                    <span
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-[18px]"
                      style={{ backgroundColor: c, boxShadow: `0 0 8px 0 ${c}` }}
                    />
                  </span>
                </span>
                <span className="text-right font-ui uppercase tracking-luxury text-[10px] text-muted-light">
                  <b
                    className="font-display italic font-medium text-[17px] mr-1"
                    style={{ color: lead ? '#c9b27f' : '#ece3c5' }}
                  >
                    {xp.toLocaleString('pl-PL')}
                  </b>
                  xp
                </span>
              </div>
            )
          })}
          {top1 && top2 && (
            <p className="mt-6 pt-5 border-t border-gold-light/10 font-serif-body italic text-muted-light/80 text-[15px] flex items-baseline gap-2.5">
              <span className="not-italic text-gold text-[8px]">◆</span>
              <span>
                najwięcej energii poszło do filarów{' '}
                <b className="font-display not-italic font-medium text-gold-light">{top1.name}</b> i{' '}
                <b className="font-display not-italic font-medium text-gold-light">{top2.name}</b> — one niosą ten rok.
              </span>
            </p>
          )}
        </div>

        {/* ============ III — THE ASCENT ============ */}
        <SectionHead num={3} title="The Ascent · od ziarnka do Natalii" />
        <div className="mt-10">
          {/* meter */}
          <div className="relative h-[3px] bg-gold-light/15">
            <div
              className="absolute left-0 top-0 h-full transition-[width] duration-[1300ms] ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{ width: lit ? `${levelPct}%` : '0%', background: 'linear-gradient(90deg, #8e7338, #c9b27f)' }}
            />
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-[11px] h-[11px] bg-ivory transition-[left] duration-[1300ms] ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{ left: lit ? `${levelPct}%` : '0%', boxShadow: '0 0 0 4px #161B18, 0 0 16px -2px #c9b27f' }}
            />
          </div>
          <div className="flex justify-between mt-3.5">
            <div className="flex flex-col gap-1">
              <span className="font-display italic text-muted-light/80 text-[15px]">{toRoman(LEVELS[0].level)}</span>
              <span className="font-ui uppercase tracking-luxury text-[8px] text-muted-light">{LEVELS[0].name}</span>
            </div>
            <div className="flex flex-col gap-1 items-center text-center">
              <span className="font-display italic text-ivory text-[17px]">{toRoman(level.level)} · {level.name}</span>
              <span className="font-ui uppercase tracking-luxury text-[8px] text-gold-light">jesteś tu · {level.level} z {LEVELS.length}</span>
            </div>
            <div className="flex flex-col gap-1 items-end text-right">
              <span className="font-display italic text-muted-light/80 text-[15px]">{toRoman(LEVELS[LEVELS.length - 1].level)}</span>
              <span className="font-ui uppercase tracking-luxury text-[8px] text-muted-light">{LEVELS[LEVELS.length - 1].name}</span>
            </div>
          </div>

          {/* ladder */}
          <div className="mt-11 flex flex-wrap justify-center gap-y-3.5">
            {LEVELS.map((l, i) => {
              const state = l.level < level.level ? 'done' : l.level === level.level ? 'now' : 'future'
              return (
                <span
                  key={l.level}
                  className={clsx(
                    'relative inline-flex items-baseline gap-1.5 whitespace-nowrap px-[22px]',
                    state === 'now' && 'py-1',
                    i > 0 && "before:content-['·'] before:absolute before:left-[-2px] before:top-1/2 before:-translate-y-1/2 before:text-gold-deep/50",
                  )}
                >
                  {state === 'now' ? (
                    <>
                      <span className="font-display text-dark bg-gold-light px-[7px] py-px text-[14px] font-medium leading-none">
                        {toRoman(l.level)}
                      </span>
                      <span className="font-serif-body italic text-ivory text-[15px] font-medium">{l.name}</span>
                      <span className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 rotate-45 w-[5px] h-[5px] bg-gold-light" />
                    </>
                  ) : (
                    <>
                      <span className={clsx('font-display text-[14px] tracking-wide', state === 'done' ? 'text-gold-light' : 'text-gold-light/30')}>
                        {toRoman(l.level)}
                      </span>
                      <span className={clsx('font-serif-body italic text-[15px]', state === 'done' ? 'text-muted-light' : 'text-gold-light/30')}>
                        {l.name}
                      </span>
                    </>
                  )}
                </span>
              )
            })}
          </div>
        </div>

        {/* ============ CLOSING ============ */}
        <section className="relative mt-24 border border-gold-light/15 px-6 py-14 md:px-10 md:py-16 text-center">
          <span className="pointer-events-none absolute top-3.5 left-3.5 w-[18px] h-[18px] border-t border-l border-gold-light/65" />
          <span className="pointer-events-none absolute top-3.5 right-3.5 w-[18px] h-[18px] border-t border-r border-gold-light/65" />
          <span className="pointer-events-none absolute bottom-3.5 left-3.5 w-[18px] h-[18px] border-b border-l border-gold-light/65" />
          <span className="pointer-events-none absolute bottom-3.5 right-3.5 w-[18px] h-[18px] border-b border-r border-gold-light/65" />

          <div className="text-gold text-[13px] tracking-[0.3em]">∴</div>
          <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div" className="mt-5">
            {phaseCopy.closingTitle}
          </SmallCaps>
          <div className="mt-7 max-w-[620px] mx-auto flex flex-col gap-[18px]">
            {FINAL_INSCRIPTION.map((line, i) => (
              <p
                key={i}
                className={clsx(
                  'font-serif-body italic text-[clamp(1.05rem,2.5vw,1.3rem)] leading-snug',
                  i === FINAL_INSCRIPTION.length - 1 ? 'text-gold-light' : 'text-muted-light',
                )}
              >
                {line}
              </p>
            ))}
          </div>
          <GoldRule variant="diamond" tone="gold" className="mt-10 max-w-[440px] mx-auto opacity-60" />
        </section>

        {/* ============ COLOPHON ============ */}
        <footer className="mt-10 text-center">
          <div className="inline-flex items-center gap-3.5 font-ui uppercase tracking-editorial text-[9px] text-muted-light">
            <span className="text-gold">∴</span>
            Ex Libris · Natalia · V · IV · MMXXVII
            <span className="text-gold">∴</span>
          </div>
          <p className="font-serif-body italic text-muted-light/60 text-[14px] mt-3.5">
            Quiet Inheritance · Vol. II — the year of becoming
          </p>
        </footer>
      </div>
    </RitualSurface>
  )
}

// ── Section head ─────────────────────────────────────────────────

function SectionHead({ num, title }: { num: number; title: string }) {
  return (
    <div className="mt-20 md:mt-24">
      <div className="flex items-baseline gap-4">
        <RomanNumeral value={num} className="font-display italic text-gold-light text-[22px] leading-none" />
        <SmallCaps tone="muted-light" tracking="editorial" size="xs">{title}</SmallCaps>
      </div>
      <div className="flex items-center gap-4 mt-5">
        <span className="flex-1 h-px bg-gold-light/15" />
        <span className="text-gold text-[7px]">◆</span>
        <span className="flex-1 h-px bg-gold-light/15" />
      </div>
    </div>
  )
}

// ── Reckoning cell ───────────────────────────────────────────────

interface ReckoningCellProps {
  label: string
  primary: string
  sub: string
  wide?: boolean
  bar?: number // 0–100; absent → ◆ mark foot
}

function ReckoningCell({ label, primary, sub, wide, bar, lit }: ReckoningCellProps & { lit?: boolean }) {
  return (
    <div className="bg-dark px-5 py-8 md:px-7 md:py-9 text-center flex flex-col items-center">
      <SmallCaps tone="muted-light" tracking="editorial" size="xs" className="whitespace-nowrap">
        {label}
      </SmallCaps>
      <p
        className={clsx(
          'font-display text-ivory leading-none tracking-tight mt-5 tabular-nums whitespace-nowrap',
          wide ? 'text-[clamp(1.8rem,4.5vw,2.9rem)]' : 'text-[clamp(2.2rem,5vw,3.9rem)]',
        )}
      >
        {primary}
      </p>
      <p className="font-serif-body italic text-muted-light/70 text-[14px] mt-3.5 whitespace-nowrap">{sub}</p>
      <div className="w-24 h-3 mt-6 flex items-center">
        {bar !== undefined ? (
          <div className="relative w-full h-px bg-gold-light/15">
            <div
              className="absolute left-0 top-0 h-full bg-gold transition-[width] duration-[1100ms] ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{ width: lit ? `${bar}%` : '0%' }}
            >
              <span className="absolute right-[-2px] top-1/2 translate-x-1/2 -translate-y-1/2 rotate-45 w-[5px] h-[5px] bg-gold-light" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 w-full justify-center">
            <span className="flex-1 h-px bg-gold-light/15" />
            <span className="text-gold-deep text-[6px] leading-none">◆</span>
            <span className="flex-1 h-px bg-gold-light/15" />
          </div>
        )}
      </div>
    </div>
  )
}
