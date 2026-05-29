'use client'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import {
  LEVELS,
  getLevelFromXP,
  getGardenStage,
  getNextGardenStage,
  getPace,
} from '@/lib/gameLogic'
import { Check } from 'lucide-react'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const TOTAL_XP = 200_000

// ── Botanical SVG (preserved) ────────────────────────────────────

function GardenArt({ levelStage }: { levelStage: number }) {
  const s = Math.min(levelStage, 10)
  const stemH = 20 + s * 9
  const stemY = 130 - stemH
  const showLeaves = s >= 2
  const showBud    = s >= 4
  const showPetals = s >= 6
  const showSecond = s >= 8
  const isEden     = s >= 10

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden>
      <ellipse cx="80" cy="135" rx="50" ry="6" fill="#2A1A0A" opacity="0.12" />
      {s >= 1 && (
        <>
          <path d={`M80,130 Q70,140 60,138`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
          <path d={`M80,130 Q90,142 100,139`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
        </>
      )}
      {s === 0 && <ellipse cx="80" cy="128" rx="8" ry="5" fill="#8B6914" opacity="0.6" />}
      {s >= 1 && (
        <path
          d={`M80,130 Q77,${stemY + stemH * 0.5} 80,${stemY}`}
          stroke="#3d6b2b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {showLeaves && (
        <>
          <path d={`M79,${stemY + stemH * 0.65} Q60,${stemY + stemH * 0.45} 65,${stemY + stemH * 0.3}`} fill="#4a8a35" opacity="0.75" />
          <path d={`M81,${stemY + stemH * 0.50} Q100,${stemY + stemH * 0.30} 95,${stemY + stemH * 0.15}`} fill="#4a8a35" opacity="0.65" />
        </>
      )}
      {s >= 5 && (
        <path d={`M79,${stemY + stemH * 0.80} Q58,${stemY + stemH * 0.70} 62,${stemY + stemH * 0.55}`} fill="#3d7a2a" opacity="0.55" />
      )}
      {showBud && !showPetals && <ellipse cx="80" cy={stemY} rx="6" ry="9" fill="#d4698c" opacity="0.8" />}
      {showPetals && (
        <g transform={`translate(80, ${stemY})`}>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <ellipse
              key={i}
              cx={Math.cos((deg * Math.PI) / 180) * 10}
              cy={Math.sin((deg * Math.PI) / 180) * 10}
              rx="5"
              ry="8"
              fill={s >= 9 ? '#D4AF6B' : '#e8a0b8'}
              opacity="0.85"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="5" fill={s >= 9 ? '#B8963E' : '#d4698c'} />
        </g>
      )}
      {showSecond && (
        <>
          <path d={`M80,${stemY + 5} Q65,${stemY - 20} 55,${stemY - 25}`} stroke="#3d6b2b" strokeWidth="2" fill="none" />
          <g transform={`translate(55, ${stemY - 25})`}>
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <ellipse
                key={i}
                cx={Math.cos((deg * Math.PI) / 180) * 7}
                cy={Math.sin((deg * Math.PI) / 180) * 7}
                rx="4"
                ry="6"
                fill="#c0a0d8"
                opacity="0.75"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="3.5" fill="#9b6bb5" />
          </g>
        </>
      )}
      {isEden && (
        <>
          {[[35, 30], [125, 25], [110, 70], [30, 75], [80, 15]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#D4AF6B" strokeWidth="1.5" opacity="0.7" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#D4AF6B" strokeWidth="1.5" opacity="0.7" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#D4AF6B" strokeWidth="1" opacity="0.5" />
              <line x1="3" y1="-3" x2="-3" y2="3" stroke="#D4AF6B" strokeWidth="1" opacity="0.5" />
            </g>
          ))}
        </>
      )}
    </svg>
  )
}

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
  const paceCopy = pace.status === 'ahead'
    ? {
        label: 'Przed planem',
        detail: `+${Math.abs(pace.diffDays)} ${Math.abs(pace.diffDays) === 1 ? 'dzień' : 'dni'} przewagi`,
        color: '#1a5c2a',
      }
    : pace.status === 'behind'
      ? {
          label: 'Do nadrobienia',
          detail: `${Math.abs(pace.diffDays)} ${Math.abs(pace.diffDays) === 1 ? 'dzień' : 'dni'} opóźnienia`,
          color: '#9b2335',
        }
      : {
          label: 'Na track',
          detail: 'idziesz dokładnie w swoim tempie',
          color: '#B8963E',
        }

  if (loading) return (
    <div className="min-h-screen bg-ivory grain-parchment flex items-center justify-center">
      <Fleuron size={20} className="text-gold animate-pulse" />
    </div>
  )

  const expectedPct = Math.min(100, Math.round((pace.expectedXP / TOTAL_XP) * 100))

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-8">
        <SmallCaps tone="muted" tracking="editorial" size="xs">
          Twoja droga · Vol. I
        </SmallCaps>
        <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
          Ogród Transformacji
        </h1>
        <p className="font-serif-body italic text-muted text-[14px] mt-2">
          trzydzieści poziomów · jeden rok · jedna Ty
        </p>
        <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />
      </header>

      {/* ── HERO ── */}
      <div className="bg-ivory border border-gold-light/40 overflow-hidden mb-6">
        {/* Botanical scene */}
        <div className={clsx('relative bg-gradient-to-b px-6 pt-8 pb-6', stage.bg)}>
          {/* Decorative corner fleurons */}
          <Fleuron size={10} className="absolute top-3 left-4 text-gold-deep/40" />
          <Fleuron size={10} className="absolute top-3 right-4 text-gold-deep/40" />

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

          {/* Next stage */}
          {nextStage && (
            <div className="mt-5 pt-4 border-t border-gold-deep/20 flex items-center gap-3">
              <div className="text-3xl opacity-25 blur-[1.5px] shrink-0">{nextStage.emoji}</div>
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

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-gold-deep/20" />

          <div className="space-y-1">
            {LEVELS.map((lvl) => {
              const done = totalXP >= lvl.xpRequired
              const isCurrent = lvl.level === currentLvl.level

              return (
                <div
                  key={lvl.level}
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
                      tone={done ? 'muted' : 'muted'}
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

