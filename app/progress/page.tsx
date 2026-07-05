'use client'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import {
  LEVELS,
  GARDEN_STAGES,
  getLevelFromXP,
  getGardenStage,
  getNextGardenStage,
  getPace,
} from '@/lib/gameLogic'
import { Check } from 'lucide-react'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'
import GardenArt from '@/components/GardenArt'
import StageExLibris from '@/components/StageExLibris'
import LevelVine from '@/components/LevelVine'
import PageHeader from '@/components/PageHeader'
import { SkeletonHeader, SkeletonCard } from '@/components/SkeletonCard'

// Lista poziomów pogrupowana etapami Ogrodu — stała struktura, liczona raz.
const STAGE_GROUPS = GARDEN_STAGES.map((gs, i) => {
  const firstLevel = i === 0 ? 1 : GARDEN_STAGES[i - 1].maxLevel + 1
  return {
    stage: gs,
    index: i,
    firstLevel,
    levels: LEVELS.filter(l => l.level >= firstLevel && l.level <= gs.maxLevel),
  }
})
const TOTAL_ROWS = GARDEN_STAGES.length + LEVELS.length

const TOTAL_XP = 200_000

// ── Page ─────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { stats, loading } = useGameData()
  const totalXP    = stats?.totalXP ?? 0
  const currentLvl = getLevelFromXP(totalXP)
  const stage      = getGardenStage(currentLvl.level)
  const nextStage  = getNextGardenStage(currentLvl.level)
  const overallPct = Math.min(100, Math.round((totalXP / TOTAL_XP) * 100))
  const levelStage = Math.floor((currentLvl.level - 1) / 3)

  const xpToNextStage = nextStage
    ? Math.max(0, (LEVELS.find(l => l.level === stage.maxLevel + 1)?.xpRequired ?? totalXP) - totalXP)
    : 0

  const pace = getPace(totalXP)

  // Winorośl dojrzewa dokładnie do wiersza obecnego poziomu: pozycję
  // mierzymy z realnego layoutu (marginesy nagłówków i border bieżącego
  // wiersza psuły model „równych jednostek"). Start = przybliżenie
  // closed-form, pomiar koryguje po mount i przy każdej zmianie rozmiaru.
  const listRef = useRef<HTMLDivElement>(null)
  const currentRowRef = useRef<HTMLDivElement>(null)
  const stageIdx = GARDEN_STAGES.findIndex(gs => currentLvl.level <= gs.maxLevel)
  const vineApprox = (stageIdx + 1 + currentLvl.level - 0.5) / TOTAL_ROWS
  const [vineMeasured, setVineMeasured] = useState<number | null>(null)
  const vineFill = vineMeasured ?? vineApprox

  useEffect(() => {
    const measure = () => {
      const list = listRef.current
      const row = currentRowRef.current
      if (!list || !row) return
      const lr = list.getBoundingClientRect()
      const rr = row.getBoundingClientRect()
      // SVG winorośli siedzi na top-4 z height calc(100% - 2rem)
      const vineH = lr.height - 32
      if (vineH <= 0) return
      const ratio = (rr.top + rr.height / 2 - (lr.top + 16)) / vineH
      setVineMeasured(Math.max(0, Math.min(1, ratio)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (listRef.current) ro.observe(listRef.current)
    return () => ro.disconnect()
  }, [currentLvl.level, loading])

  const paceCopy = pace.status === 'ahead'
    ? {
        label: 'Przed planem',
        detail: `+${Math.abs(pace.diffDays)} ${Math.abs(pace.diffDays) === 1 ? 'dzień' : 'dni'} przewagi`,
        color: '#1a5c2a',
      }
    : pace.status === 'behind'
      ? {
          label: 'Wolniejsze tempo',
          detail: `${Math.abs(pace.diffDays)} ${Math.abs(pace.diffDays) === 1 ? 'dzień' : 'dni'} spokojniej · wróć do rytmu jednym małym ruchem`,
          color: '#9b2335',
        }
      : {
          label: 'Na track',
          detail: 'idziesz dokładnie w swoim tempie',
          color: '#B8963E',
        }

  if (loading) return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12">
      <SkeletonHeader />
      <SkeletonCard className="mb-6 h-72" />
      <SkeletonCard className="h-96" />
    </div>
  )

  const expectedPct = Math.min(100, Math.round((pace.expectedXP / TOTAL_XP) * 100))

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <PageHeader
        chapter="II"
        eyebrow="Twoja droga"
        title="Ogród Transformacji"
        subtitle="trzydzieści poziomów · jeden rok · jedna Ty"
        rule
      />

      {/* ── HERO ── */}
      <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-6">
        {/* Botanical scene */}
        <div className={clsx('relative bg-gradient-to-b px-6 pt-8 pb-6', stage.bg)}>
          {/* Znak rozdziału: fleuron + ekslibris bieżącego etapu */}
          <Fleuron size={10} className="absolute top-3 left-4 text-gold-deep/40" />
          <div className="absolute top-3 right-3 opacity-70" style={{ color: stage.accentColor }}>
            <StageExLibris id={stage.id} size={34} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-32 h-32">
              <GardenArt levelStage={levelStage} />
            </div>

            <div className="flex-1 min-w-0">
              <SmallCaps tracking="luxury" size="xs" as="div">
                <span style={{ color: stage.accentColor }}>
                  Poziom {toRoman(currentLvl.level)} · {stage.stageName}
                </span>
              </SmallCaps>
              <h2 className="font-display text-dark text-3xl mt-1 mb-2 leading-tight">
                {currentLvl.name}
              </h2>
              <p className="font-serif-body italic text-muted text-[13px] leading-relaxed">
                {stage.desc}
              </p>
            </div>
          </div>

          {/* Next stage — ekslibris zamiast rozmytego emoji: przyszłość
              widać wyraźnie, tylko jeszcze nie w pełnym kolorze */}
          {nextStage && (
            <div className="mt-5 pt-4 border-t border-gold-deep/20 flex items-center gap-3">
              <div className="shrink-0 opacity-70" style={{ color: nextStage.accentColor }}>
                <StageExLibris id={nextStage.id} size={44} />
              </div>
              <div className="flex-1 min-w-0">
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  Następnie
                </SmallCaps>
                <p className="font-heading text-dark/70 text-[14px] truncate mt-0.5">
                  {nextStage.stageName}
                </p>
              </div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0">
                + {xpToNextStage.toLocaleString('pl-PL')} XP
              </SmallCaps>
            </div>
          )}

          {/* 30-level diamond axis */}
          <div className="mt-5 flex gap-[3px] justify-center" aria-label="oś 30 poziomów">
            {LEVELS.map(l => {
              const done = l.level < currentLvl.level
              const cur = l.level === currentLvl.level
              return (
                <span
                  key={l.level}
                  title={`Poziom ${l.level} · ${l.name}`}
                  className={clsx(
                    'transition-all',
                    cur ? 'text-gold animate-pulse' : done ? 'text-gold' : 'text-muted-light/40'
                  )}
                >
                  <Diamond size={cur ? 7 : 5} filled={done || cur} />
                </span>
              )
            })}
          </div>
        </div>

        {/* Overall progress */}
        <div className="px-6 py-5 border-t border-gold-light/30">
          <div className="flex justify-between items-baseline mb-3">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Droga do Natalii 30
            </SmallCaps>
            <span className="font-display text-gold text-3xl leading-none">
              {overallPct}<span className="text-base text-muted-light">%</span>
            </span>
          </div>

          {/* Hairline progress with diamond head + pace marker */}
          <div className="relative h-px w-full bg-hairline mt-4 mb-6">
            <div
              className="absolute left-0 top-0 h-px bg-gold transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
            {/* Expected pace marker */}
            <div
              className="absolute -top-1 w-px h-3 bg-dark/30"
              style={{ left: `${expectedPct}%` }}
              title={`Oczekiwane do dziś: ${pace.expectedXP.toLocaleString('pl-PL')} XP`}
            />
            {overallPct > 0 && overallPct < 100 && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `calc(${overallPct}% - 4px)`,
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
            )}
          </div>

          <div className="flex justify-between mb-4">
            <SmallCaps tone="muted" size="xs">
              {totalXP.toLocaleString('pl-PL')} XP zebrane
            </SmallCaps>
            <SmallCaps tone="muted" size="xs">
              cel · 200 000 XP
            </SmallCaps>
          </div>

          {/* Pace banner */}
          <div
            className="border px-4 py-3 flex items-center gap-4"
            style={{
              borderColor: `${paceCopy.color}55`,
              backgroundColor: `${paceCopy.color}0A`,
            }}
          >
            <span style={{ color: paceCopy.color }} className="shrink-0">
              <Diamond size={7} filled />
            </span>
            <div className="flex-1 min-w-0">
              <SmallCaps tracking="luxury" size="xs" as="div">
                <span style={{ color: paceCopy.color }}>{paceCopy.label}</span>
              </SmallCaps>
              <p className="font-serif-body italic text-dark text-[13px] mt-0.5 leading-snug">
                {paceCopy.detail}
              </p>
            </div>
            <div className="text-right shrink-0">
              <SmallCaps tone="muted" size="xs">
                do dziś
              </SmallCaps>
              <p className="font-display text-dark text-base mt-0.5 leading-none whitespace-nowrap">
                {pace.expectedXP.toLocaleString('pl-PL')}
                <span className="font-serif-body italic text-muted-light text-xs ml-1.5">XP</span>
              </p>
            </div>
          </div>
        </div>

        {/* XP remaining callout */}
        {currentLvl.level < 30 && (
          <div className="px-6 pb-5">
            <div className="bg-cream/50 border border-hairline px-4 py-3 flex items-center justify-between">
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                Pozostało do celu
              </SmallCaps>
              <p className="font-display text-dark text-xl leading-none">
                {(TOTAL_XP - totalXP).toLocaleString('pl-PL')}
                <span className="text-muted-light text-sm font-serif-body italic ml-1.5">XP</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── All 30 levels ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Diamond size={6} className="text-gold" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
            Wszystkie trzydzieści poziomów
          </SmallCaps>
        </div>

        <div ref={listRef} className="relative">
          {/* Winorośl poziomów — dojrzewa dokładnie dotąd, dokąd doszłaś */}
          <LevelVine fillRatio={vineFill} />

          <div className="space-y-1">
            {STAGE_GROUPS.map(({ stage: gs, index: gsIdx, firstLevel, levels: stageLevels }) => {
              const stagePast = currentLvl.level > gs.maxLevel
              const stageCurrent = currentLvl.level >= firstLevel && currentLvl.level <= gs.maxLevel
              const stageColor = stagePast ? '#2C3B35' : stageCurrent ? gs.accentColor : '#B7A787'

              return (
                <div key={gs.id} className="space-y-1">
                  {/* Nagłówek etapu — botaniczny ekslibris na osi winorośli */}
                  <div className={clsx('relative flex items-center gap-3 pr-3 py-2', gsIdx > 0 && 'mt-2')}>
                    <div
                      className="relative z-10 flex-shrink-0 w-10 h-10 flex items-center justify-center bg-ivory"
                      style={{ color: stageColor }}
                    >
                      <StageExLibris
                        id={gs.id}
                        size={40}
                        className={clsx(!stagePast && !stageCurrent && 'opacity-60')}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                      <SmallCaps tracking="luxury" size="xs" as="div">
                        <span style={{ color: stageColor }}>
                          Etap {toRoman(gsIdx + 1)} · {gs.stageName}
                        </span>
                      </SmallCaps>
                      <SmallCaps tone="muted" tracking="luxury" size="xs" className="shrink-0 opacity-70">
                        {stageLevels.length === 1
                          ? `poziom ${toRoman(firstLevel)}`
                          : `poziomy ${toRoman(firstLevel)}–${toRoman(gs.maxLevel)}`}
                      </SmallCaps>
                    </div>
                  </div>

                  {stageLevels.map(lvl => {
                    const done = totalXP >= lvl.xpRequired
                    const isCurrent = lvl.level === currentLvl.level

                    return (
                      <div
                        key={lvl.level}
                        ref={isCurrent ? currentRowRef : undefined}
                        className={clsx(
                          'relative flex items-center gap-3 pl-0 pr-3 py-2 transition-all',
                          isCurrent ? 'bg-gold-pale/40 border border-gold-light/30' : ''
                        )}
                      >
                        {/* Status node */}
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={clsx(
                              'w-10 h-10 flex items-center justify-center transition-all border',
                              isCurrent
                                ? 'bg-gold border-gold'
                                : done
                                  ? 'bg-cream border-forest/40'
                                  : 'bg-ivory border-hairline'
                            )}
                          >
                            {isCurrent && (
                              <Diamond size={9} className="text-ivory" filled />
                            )}
                            {done && !isCurrent && (
                              <Check size={13} className="text-forest" strokeWidth={2} />
                            )}
                            {!done && !isCurrent && (
                              <span className="font-display text-muted-light text-[13px] leading-none">
                                {lvl.level}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Level name + XP */}
                        <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span
                              className={clsx(
                                'truncate',
                                isCurrent
                                  ? 'font-heading text-dark text-base'
                                  : done
                                    ? 'font-serif-body text-muted text-[14px]'
                                    : 'font-serif-body italic text-muted-light text-[14px]'
                              )}
                            >
                              {lvl.name}
                            </span>
                            {isCurrent && (
                              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="shrink-0">
                                teraz
                              </SmallCaps>
                            )}
                          </div>

                          <SmallCaps
                            tone="muted"
                            tracking="luxury"
                            size="xs"
                            className={clsx('shrink-0 tabular-nums', !done && 'opacity-60')}
                          >
                            {lvl.xpRequired === 0
                              ? 'Start'
                              : `${lvl.xpRequired.toLocaleString('pl-PL')} XP`}
                          </SmallCaps>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer inscription */}
        <footer className="mt-10 text-center">
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-sm mx-auto opacity-40 mb-5" />
          <p className="font-serif-body italic text-muted text-[14px] leading-relaxed">
            nie musisz być jutro inna niż dziś.
            <br />
            <span className="text-dark/70">wystarczy, że jesteś tu — i działasz.</span>
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Fleuron size={9} className="text-gold-deep" />
            <SmallCaps tone="parchment" tracking="editorial" size="xs" className="!text-muted">
              Projekt 30 · V · IV · MMXXVI → V · IV · MMXXVII
            </SmallCaps>
            <Fleuron size={9} className="text-gold-deep" />
          </div>
        </footer>
      </section>
    </div>
  )
}
