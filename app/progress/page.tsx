'use client'
import { useGameData } from '@/hooks/useGameData'
import {
  LEVELS,
  getLevelFromXP,
  getGardenStage,
  getNextGardenStage,
  getPace,
} from '@/lib/gameLogic'
import { Check } from 'lucide-react'
import clsx from 'clsx'

const TOTAL_XP = 200_000

// ────────────────────────────────────────────────────────────
// Subtle decorative garden SVG (grows with level 0-9 stage)
// ────────────────────────────────────────────────────────────
function GardenArt({ levelStage }: { levelStage: number }) {
  // levelStage: 0 (seed) to 10 (Eden)
  const s = Math.min(levelStage, 10)
  const stemH = 20 + s * 9   // stem height 0→110
  const stemY = 130 - stemH
  const showLeaves = s >= 2
  const showBud    = s >= 4
  const showPetals = s >= 6
  const showSecond = s >= 8
  const isEden     = s >= 10

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden>
      {/* Ground */}
      <ellipse cx="80" cy="135" rx="50" ry="6" fill="#2A1A0A" opacity="0.12" />

      {/* Roots */}
      {s >= 1 && (
        <>
          <path d={`M80,130 Q70,${140} 60,${138}`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
          <path d={`M80,130 Q90,${142} 100,${139}`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
        </>
      )}

      {/* Seed (always until sprout) */}
      {s === 0 && (
        <ellipse cx="80" cy="128" rx="8" ry="5" fill="#8B6914" opacity="0.6" />
      )}

      {/* Main stem */}
      {s >= 1 && (
        <path
          d={`M80,130 Q77,${stemY + stemH * 0.5} 80,${stemY}`}
          stroke="#3d6b2b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* Leaves */}
      {showLeaves && (
        <>
          <path d={`M79,${stemY + stemH * 0.65} Q60,${stemY + stemH * 0.45} 65,${stemY + stemH * 0.3}`}
            fill="#4a8a35" opacity="0.75" />
          <path d={`M81,${stemY + stemH * 0.50} Q100,${stemY + stemH * 0.30} 95,${stemY + stemH * 0.15}`}
            fill="#4a8a35" opacity="0.65" />
        </>
      )}

      {/* Extra leaves at higher stages */}
      {s >= 5 && (
        <>
          <path d={`M79,${stemY + stemH * 0.80} Q58,${stemY + stemH * 0.70} 62,${stemY + stemH * 0.55}`}
            fill="#3d7a2a" opacity="0.55" />
        </>
      )}

      {/* Bud */}
      {showBud && !showPetals && (
        <ellipse cx="80" cy={stemY} rx="6" ry="9" fill="#d4698c" opacity="0.8" />
      )}

      {/* Open flower — petals */}
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

      {/* Second flower */}
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

      {/* Eden sparkles */}
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

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const { stats, loading } = useGameData()
  const totalXP    = stats?.totalXP ?? 0
  const currentLvl = getLevelFromXP(totalXP)
  const stage      = getGardenStage(currentLvl.level)
  const nextStage  = getNextGardenStage(currentLvl.level)
  const overallPct = Math.min(100, Math.round((totalXP / TOTAL_XP) * 100))
  const levelStage = Math.floor((currentLvl.level - 1) / 3)   // 0-9 for SVG

  // XP do pierwszego levelu kolejnego stage'a
  const xpToNextStage = nextStage
    ? Math.max(0, (LEVELS.find(l => l.level === stage.maxLevel + 1)?.xpRequired ?? totalXP) - totalXP)
    : 0

  const pace = getPace(totalXP)
  const paceCopy = pace.status === 'ahead'
    ? { label: 'Przed planem', detail: `+${Math.abs(pace.diffDays)} ${Math.abs(pace.diffDays) === 1 ? 'dzień' : 'dni'} przewagi`, color: '#1a5c2a', bg: 'bg-emerald-50/60', emoji: '↑' }
    : pace.status === 'behind'
      ? { label: 'Do nadrobienia', detail: `${Math.abs(pace.diffDays)} ${Math.abs(pace.diffDays) === 1 ? 'dzień' : 'dni'} opóźnienia`, color: '#9b2335', bg: 'bg-rose-50/60', emoji: '↓' }
      : { label: 'Na track', detail: 'Idziesz dokładnie w swoim tempie', color: '#B8963E', bg: 'bg-gold-pale/60', emoji: '·' }

  if (loading) return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Twoja droga</p>
        <h1 className="font-serif text-dark text-2xl">Ogród Transformacji</h1>
        <p className="font-sans text-sm text-muted mt-0.5">
          30 poziomów · jeden rok · jedna Ty
        </p>
      </div>

      {/* ── Hero garden card ── */}
      <div className="bg-white rounded-2xl shadow-elegant overflow-hidden mb-6">

        {/* Botanical scene */}
        <div className={clsx('relative bg-gradient-to-b px-6 pt-8 pb-5', stage.bg)}>
          {/* Decorative corner ornaments */}
          <span className="absolute top-3 left-4 text-[10px] text-muted-light/50 select-none font-serif">✦</span>
          <span className="absolute top-3 right-4 text-[10px] text-muted-light/50 select-none font-serif">✦</span>

          <div className="flex items-center gap-6">
            {/* SVG garden art */}
            <div className="flex-shrink-0 w-32 h-32">
              <GardenArt levelStage={levelStage} />
            </div>

            {/* Current level info */}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[10px] uppercase tracking-widest mb-1"
                 style={{ color: stage.accentColor }}>
                Poziom {currentLvl.level} · {stage.stageName}
              </p>
              <h2 className="font-serif text-dark text-2xl mb-2 leading-tight">
                {currentLvl.name}
              </h2>
              <p className="font-sans text-xs text-muted leading-relaxed italic">
                {stage.desc}
              </p>
            </div>
          </div>

          {/* Next stage spoiler */}
          {nextStage && (
            <div className="mt-5 pt-4 border-t border-dark/5 flex items-center gap-3">
              <div className="text-3xl opacity-25 blur-[1.5px]">{nextStage.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[9px] uppercase tracking-widest text-muted-light mb-0.5">
                  Następnie
                </p>
                <p className="font-serif text-dark/60 text-sm truncate">
                  {nextStage.stageName}
                </p>
              </div>
              <span className="font-sans text-[11px] text-muted-light tabular-nums flex-shrink-0">
                +{xpToNextStage.toLocaleString('pl-PL')} XP
              </span>
            </div>
          )}

          {/* 30-stage dots axis */}
          <div className="mt-5 flex gap-1 justify-center" aria-label="oś 30 poziomów">
            {LEVELS.map(l => (
              <div
                key={l.level}
                title={`Poziom ${l.level} · ${l.name}`}
                className={clsx(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  l.level < currentLvl.level && 'bg-gold',
                  l.level === currentLvl.level && 'bg-gold animate-pulse w-2 h-2',
                  l.level > currentLvl.level && 'bg-ivory/60 border border-border/60'
                )}
              />
            ))}
          </div>
        </div>

        {/* Overall XP progress */}
        <div className="px-6 py-5 border-t border-border/40">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-sans text-xs text-muted uppercase tracking-wider">Droga do Natalii 30</span>
            <span className="font-serif text-gold text-2xl">{overallPct}<span className="text-base">%</span></span>
          </div>
          <div className="relative h-3 bg-cream rounded-full overflow-hidden">
            {/* Subtle texture stripe */}
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 9px)' }} />
            {/* Marker oczekiwanego tempa */}
            <div
              className="absolute top-0 bottom-0 w-px bg-dark/40"
              style={{ left: `${Math.min(100, Math.round((pace.expectedXP / TOTAL_XP) * 100))}%` }}
              title={`Oczekiwane do dziś: ${pace.expectedXP.toLocaleString('pl-PL')} XP`}
            />
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${overallPct}%`,
                background: 'linear-gradient(90deg, #B8963E 0%, #D4AF6B 50%, #C9A84C 100%)',
                boxShadow: '0 0 8px rgba(184,150,62,0.4)',
              }}
            />
          </div>

          {/* Pace banner — czy idziesz w terminie */}
          <div className={clsx('mt-3 rounded-xl px-3 py-2.5 flex items-center gap-3', paceCopy.bg)}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-serif text-base flex-shrink-0"
              style={{ background: paceCopy.color, color: '#FAF8F4' }}
            >
              {paceCopy.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[10px] uppercase tracking-widest" style={{ color: paceCopy.color }}>
                {paceCopy.label}
              </p>
              <p className="font-serif text-dark text-sm leading-tight">
                {paceCopy.detail}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-sans text-[9px] uppercase tracking-widest text-muted-light">do dziś</p>
              <p className="font-sans text-[11px] text-muted tabular-nums">
                {pace.expectedXP.toLocaleString('pl-PL')} XP
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-sans text-[11px] text-muted">
              {totalXP.toLocaleString('pl-PL')} XP zebrane
            </span>
            <span className="font-sans text-[11px] text-muted-light">
              cel: 200 000 XP
            </span>
          </div>
        </div>

        {/* XP remaining callout */}
        {currentLvl.level < 30 && (
          <div className="px-6 pb-5">
            <div className="bg-cream rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="font-sans text-xs text-muted">Pozostało do celu</span>
              <span className="font-serif text-dark text-base">
                {(TOTAL_XP - totalXP).toLocaleString('pl-PL')}
                <span className="font-sans text-xs text-muted-light ml-1">XP</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── All 30 levels journey ── */}
      <div>
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-4">
          Wszystkie 30 poziomów
        </p>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-border/60" />

          <div className="space-y-1">
            {LEVELS.map((lvl, idx) => {
              const done      = totalXP >= lvl.xpRequired
              const isCurrent = lvl.level === currentLvl.level
              const nextLvl   = LEVELS[idx + 1]
              const isLast    = !nextLvl

              return (
                <div
                  key={lvl.level}
                  className={clsx(
                    'relative flex items-center gap-3 pl-0 pr-3 py-2.5 rounded-xl transition-all',
                    isCurrent ? 'bg-gold-pale' : 'bg-transparent'
                  )}
                >
                  {/* Status dot */}
                  <div className="relative z-10 flex-shrink-0 ml-0">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isCurrent
                        ? 'bg-gold shadow-md'
                        : done
                          ? 'bg-forest/15 border border-forest/30'
                          : 'bg-ivory border border-border'
                    )}>
                      {isCurrent && (
                        <span className="font-serif text-white text-sm">✦</span>
                      )}
                      {done && !isCurrent && (
                        <Check size={14} className="text-forest" strokeWidth={2.5} />
                      )}
                      {!done && !isCurrent && (
                        <span className="font-sans text-[10px] text-muted-light font-medium">
                          {lvl.level}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Level name + XP */}
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className={clsx(
                        'font-serif truncate',
                        isCurrent
                          ? 'text-dark text-base font-medium'
                          : done
                            ? 'text-muted text-sm'
                            : 'text-muted-light text-sm'
                      )}>
                        {lvl.name}
                      </span>
                      {isCurrent && (
                        <span className="flex-shrink-0 font-sans text-[9px] bg-gold text-ivory px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          teraz
                        </span>
                      )}
                    </div>

                    <span className={clsx(
                      'flex-shrink-0 font-sans text-xs tabular-nums',
                      done ? 'text-muted' : 'text-muted-light'
                    )}>
                      {lvl.xpRequired === 0
                        ? 'Start'
                        : `${lvl.xpRequired.toLocaleString('pl-PL')} XP`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer quote */}
        <div className="mt-8 text-center border-t border-border/40 pt-6">
          <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-3">✦</p>
          <p className="font-serif text-sm text-muted leading-relaxed">
            Nie musisz być jutro inna niż dziś.<br />
            <span className="text-dark/70">Wystarczy, że jesteś tu — i działasz.</span>
          </p>
          <p className="font-sans text-[10px] text-muted-light mt-3 uppercase tracking-wider">
            Projekt 30 · 5 kwietnia 2026 → 5 kwietnia 2027
          </p>
        </div>
      </div>
    </div>
  )
}
