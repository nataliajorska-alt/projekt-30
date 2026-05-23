'use client'
import type { useGameData } from '@/hooks/useGameData'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/types'
import RedirectEnergyWidget from '@/components/RedirectEnergyWidget'
import { SmallCaps, Diamond, Fleuron, RomanNumeral } from '@/components/ui'

interface PillarsTabProps {
  stats: ReturnType<typeof useGameData>['stats']
}

export default function PillarsTab({ stats }: PillarsTabProps) {
  const pillarData = PILLARS.map(p => ({
    ...p,
    xp: stats.pillarXP[p.id as Pillar] ?? 0,
  }))

  const totalXP = pillarData.reduce((acc, p) => acc + p.xp, 0) || 1
  const maxXP = Math.max(...pillarData.map(p => p.xp), 1)
  const sorted = [...pillarData].sort((a, b) => b.xp - a.xp)

  return (
    <div className="space-y-5">
      {/* Distribution */}
      <section className="bg-ivory border border-gold-light/40 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Diamond size={5} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Rozkład XP
          </SmallCaps>
        </div>
        <h2 className="font-heading text-dark text-lg mt-1 mb-5">Według filaru</h2>

        <div className="space-y-4">
          {sorted.map((p, idx) => {
            const pct = Math.round((p.xp / totalXP) * 100)
            const barPct = Math.round((p.xp / maxXP) * 100)
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <RomanNumeral
                      value={idx + 1}
                      className="text-gold-deep text-sm w-6 text-center shrink-0"
                    />
                    <span
                      className="font-heading text-[14px]"
                      style={{ color: p.color }}
                    >
                      {p.shortName}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <SmallCaps tone="muted" tracking="luxury" size="xs">
                      {pct}%
                    </SmallCaps>
                    <span className="font-ui text-[11px] text-muted-light w-20 text-right tabular-nums">
                      {p.xp.toLocaleString('pl-PL')} XP
                    </span>
                  </div>
                </div>
                <div className="relative h-px w-full bg-hairline">
                  <div
                    className="absolute left-0 top-0 h-px transition-all duration-700"
                    style={{
                      width: `${barPct}%`,
                      backgroundColor: p.color,
                      opacity: barPct === 0 ? 0.3 : 1,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {totalXP === 1 && (
          <p className="font-serif-body italic text-muted-light text-[13px] text-center mt-6">
            zacznij zdobywać xp, aby zobaczyć swój rozkład energii.
          </p>
        )}
      </section>

      {/* Pillar cards */}
      <div className="grid grid-cols-1 gap-3">
        {PILLARS.map((p, idx) => {
          const xp = stats.pillarXP[p.id as Pillar] ?? 0
          return (
            <div
              key={p.id}
              className="bg-ivory border border-gold-light/40 p-5 flex items-start gap-4"
            >
              <div
                className="w-12 h-12 border flex items-center justify-center flex-shrink-0"
                style={{ color: p.color, borderColor: `${p.color}55` }}
              >
                <RomanNumeral value={idx + 1} className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: p.color }}>
                    <Diamond size={5} />
                  </span>
                  <SmallCaps tracking="luxury" size="xs">
                    <span style={{ color: p.color }}>{p.shortName}</span>
                  </SmallCaps>
                </div>
                <h3 className="font-heading text-dark text-base leading-tight">{p.name}</h3>
                <p className="font-serif-body italic text-muted text-[13px] mt-1 leading-relaxed">
                  {p.description}
                </p>
                <div className="flex items-center gap-3 mt-2.5">
                  <SmallCaps tracking="luxury" size="xs">
                    <span style={{ color: p.color }}>
                      {xp.toLocaleString('pl-PL')} XP
                    </span>
                  </SmallCaps>
                  {xp === 0 && (
                    <SmallCaps tone="muted" tracking="luxury" size="xs" className="opacity-70">
                      nieaktywny
                    </SmallCaps>
                  )}
                </div>
                {p.id === 'milosc' && <RedirectEnergyWidget />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Balance note */}
      <div className="relative bg-cream border border-gold-light/30 p-6">
        <Fleuron size={11} className="text-gold absolute -top-2 left-6 bg-cream px-1" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          O balansie
        </SmallCaps>
        <p className="font-serif-body italic text-dark text-[14px] mt-3 leading-relaxed">
          transformacja działa najlepiej, gdy żaden filar nie jest całkowicie zaniedbany.
          nie musisz równo rozkładać energii każdego dnia — ale co tydzień sprawdź,
          czy nie ignorujesz żadnego obszaru przez zbyt długi czas.
        </p>
      </div>
    </div>
  )
}
