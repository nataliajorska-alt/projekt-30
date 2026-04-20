'use client'
import { useGameData } from '@/hooks/useGameData'
import { PILLARS } from '@/lib/pillars'
import { SkeletonPillarList, SkeletonCard } from '@/components/SkeletonCard'
import { Pillar } from '@/types'
import RedirectEnergyWidget from '@/components/RedirectEnergyWidget'

export default function PillarsPage() {
  const { stats, loading } = useGameData()

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="mb-6">
        <div className="bg-cream h-3 w-16 rounded-full mb-2 animate-pulse" />
        <div className="bg-cream h-7 w-32 rounded-full mb-2 animate-pulse" />
        <div className="bg-cream h-3 w-48 rounded-full animate-pulse" />
      </div>
      <SkeletonCard className="mb-6 h-48" />
      <SkeletonPillarList count={7} />
    </div>
  )

  const pillarData = PILLARS.map(p => ({
    ...p,
    xp: stats.pillarXP[p.id as Pillar] ?? 0,
  }))

  const totalXP = pillarData.reduce((acc, p) => acc + p.xp, 0) || 1
  const maxXP = Math.max(...pillarData.map(p => p.xp), 1)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6">
        <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Balans</p>
        <h1 className="font-serif text-dark text-2xl mb-1">7 Filarów</h1>
        <p className="font-sans text-sm text-muted">
          Gdzie kierujesz energię? Dbaj o równowagę.
        </p>
      </div>

      {/* Radar / bar chart visual */}
      <div className="bg-white rounded-2xl shadow-elegant p-6 mb-6">
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
      <div className="mt-6 bg-cream rounded-2xl p-5">
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
