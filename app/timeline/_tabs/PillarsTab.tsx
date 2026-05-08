'use client'
import type { useGameData } from '@/hooks/useGameData'
import { PILLARS } from '@/lib/pillars'
import type { Pillar } from '@/types'
import RedirectEnergyWidget from '@/components/RedirectEnergyWidget'

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

  return (
    <div className="space-y-5">
      {/* Pillar distribution bar chart */}
      <div className="bg-white rounded-2xl shadow-elegant p-6">
        <h2 className="font-serif text-dark text-base mb-5">Rozkład XP według filaru</h2>
        <div className="space-y-4">
          {pillarData
            .sort((a, b) => b.xp - a.xp)
            .map(p => {
              const pct = Math.round((p.xp / totalXP) * 100)
              const barPct = Math.round((p.xp / maxXP) * 100)
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-sans text-sm text-dark font-medium">{p.shortName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-xs text-muted">{pct}%</span>
                      <span className="font-sans text-xs text-muted-light w-16 text-right">
                        {p.xp.toLocaleString('pl-PL')} XP
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
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
          <p className="font-sans text-xs text-muted-light text-center mt-6">
            Zacznij zdobywać XP, aby zobaczyć swój rozkład energii.
          </p>
        )}
      </div>

      {/* Pillar cards */}
      <div className="grid grid-cols-1 gap-4">
        {PILLARS.map(p => {
          const xp = stats.pillarXP[p.id as Pillar] ?? 0
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-elegant p-5 flex items-start gap-4"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: p.bgColor }}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-dark text-base mb-0.5">{p.name}</h3>
                <p className="font-sans text-xs text-muted leading-relaxed mb-2">{p.description}</p>
                <div className="flex items-center gap-2">
                  <span
                    className="font-sans text-xs font-medium"
                    style={{ color: p.color }}
                  >
                    {xp.toLocaleString('pl-PL')} XP
                  </span>
                  {xp === 0 && (
                    <span className="font-sans text-[10px] text-muted-light bg-cream px-2 py-0.5 rounded-full">
                      nieaktywny
                    </span>
                  )}
                </div>
                {p.id === 'milosc' && <RedirectEnergyWidget />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Balance note */}
      <div className="bg-cream rounded-2xl p-5">
        <p className="font-serif text-dark text-base mb-2">O balansie</p>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Transformacja działa najlepiej, gdy żaden filar nie jest całkowicie zaniedbany.
          Nie musisz równo rozkładać energii każdego dnia — ale co tydzień sprawdź, czy
          nie ignorujesz żadnego obszaru przez zbyt długi czas.
        </p>
      </div>
    </div>
  )
}
