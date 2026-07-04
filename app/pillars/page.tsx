'use client'
import { useGameData } from '@/hooks/useGameData'
import { PILLARS } from '@/lib/pillars'
import { SkeletonPillarList, SkeletonCard } from '@/components/SkeletonCard'
import { Pillar } from '@/types'
import RedirectEnergyWidget from '@/components/RedirectEnergyWidget'
import PillarRoseChart from '@/components/PillarRoseChart'
import { SmallCaps, RomanNumeral } from '@/components/ui'

// Paleta wykresowa (z mocka Filary) — jaśniejsza i bardziej zróżnicowana niż
// surowe pillar.color (te są w większości ciemne → donut robił się czarny).
// Używana TYLKO na tej stronie (donut, legenda, karty), spójnie.
const CHART_COLOR: Record<string, string> = {
  pozycja:   '#4A665D', // Wnętrze — teal-green
  cialo:     '#4F5F42', // Ciało — sage deep
  styl:      '#8E7338', // Styl — gold deep
  kapital:   '#B56A6A', // Relacje — rose
  kariera:   '#4D6173', // Kariera — steel
  tozsamosc: '#574767', // Tożsamość — violet deep
  milosc:    '#8A3A2C', // Miłość — rust
}

// Narożne ornamenty (góra-lewo / dół-prawo) — sygnatura systemu
function Corners() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l border-gold-light/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold-light/70" />
    </>
  )
}

export default function PillarsPage() {
  const { stats, loading } = useGameData()

  if (loading) return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12">
      <div className="mb-6">
        <div className="bg-cream h-3 w-16 mb-2 animate-pulse" />
        <div className="bg-cream h-7 w-40 mb-2 animate-pulse" />
        <div className="bg-cream h-3 w-48 animate-pulse" />
      </div>
      <SkeletonCard className="mb-6 h-64" />
      <SkeletonPillarList count={7} />
    </div>
  )

  const pillarData = PILLARS.map((p, idx) => ({
    ...p,
    idx,
    color: CHART_COLOR[p.id] ?? p.color,
    xp: stats.pillarXP[p.id as Pillar] ?? 0,
  }))

  const totalXP = pillarData.reduce((acc, p) => acc + p.xp, 0)
  const sortedByXP = [...pillarData].sort((a, b) => b.xp - a.xp)

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-3 font-ui uppercase tracking-editorial text-[10px] text-muted mb-3.5">
          Balans <span className="text-gold">∴</span> Vol. I
        </div>
        <h1 className="font-display font-medium text-dark leading-tight tracking-[-0.5px] text-[clamp(1.75rem,5vw,2.5rem)]">
          Siedem <em className="italic font-normal text-gold-deep">Filarów</em>
        </h1>
        <p className="mt-2 font-serif-body italic text-[14px] text-muted">
          gdzie kierujesz energię? dbaj o równowagę.
        </p>
      </header>

      <div className="flex items-center gap-3.5 my-7">
        <span className="flex-1 h-px bg-hairline" />
        <span className="text-gold text-[13px] leading-none">∴</span>
        <span className="flex-1 h-px bg-hairline" />
      </div>

      {/* ── Distribution panel (pierścień + legenda) ───────────── */}
      <section className="relative bg-ivory border border-hairline p-7 md:px-10 md:py-8 mb-10">
        <Corners />
        <div className="flex items-center gap-2.5 font-ui uppercase tracking-editorial text-[10px] text-gold-deep mb-6">
          <span className="text-gold text-[8px]">◆</span> Równowaga filarów
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-14 items-center">
          {/* Rozeta Równowagi — kształt zamiast rozkładu (rozkład niesie legenda) */}
          <div className="w-[280px] max-w-full mx-auto">
            <PillarRoseChart
              data={pillarData.map(p => ({
                id: p.id,
                shortName: p.shortName,
                color: p.color,
                xp: p.xp,
              }))}
            />
            <div className="text-center mt-3">
              <div className="font-display font-medium text-[26px] text-dark tracking-[-1px] leading-none">
                {totalXP.toLocaleString('pl-PL')}
              </div>
              <div className="font-ui uppercase tracking-editorial text-[9px] text-muted mt-1.5">XP łącznie</div>
              {totalXP > 0 && (
                <p className="font-serif-body italic text-muted-light text-[11.5px] mt-2.5">
                  przerywana linia = idealnie równy podział
                </p>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 w-full">
            {sortedByXP.map(p => {
              const pct = totalXP > 0 ? Math.round((p.xp / totalXP) * 100) : 0
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[10px_auto_1fr_auto_auto] items-baseline gap-3 py-2.5 border-b border-border"
                >
                  <span className="w-[9px] h-[9px] rotate-45 self-center shrink-0" style={{ background: p.color }} />
                  <span className="font-display font-medium text-[16px] tracking-[-0.3px]" style={{ color: p.color }}>
                    {p.shortName}
                  </span>
                  <span className="border-b border-dotted border-hairline -translate-y-[5px] min-w-[16px]" />
                  <span className="font-ui text-[11px] text-muted text-right min-w-[30px] tabular-nums">{pct}%</span>
                  <span className="font-display font-medium text-[14px] text-right min-w-[60px]" style={{ color: p.color }}>
                    {p.xp.toLocaleString('pl-PL')}
                    <small className="font-ui font-normal text-[8px] tracking-[0.2em] text-muted-light uppercase ml-0.5">xp</small>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {totalXP === 0 && (
          <p className="font-serif-body italic text-muted-light text-[13px] text-center mt-6">
            zacznij zdobywać xp, aby zobaczyć swój rozkład energii.
          </p>
        )}
      </section>

      {/* ── Section label ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 font-ui uppercase tracking-editorial text-[10px] text-muted mb-5">
        Filary <span className="flex-1 h-px bg-hairline" />
      </div>

      {/* ── Pillar grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        {pillarData.map(p => {
          const featured = p.id === 'milosc'

          const header = (
            <div className="flex gap-5">
              <div
                className="shrink-0 w-[60px] h-[60px] border flex items-center justify-center font-display italic text-[21px]"
                style={{ color: p.color, borderColor: p.color }}
              >
                <RomanNumeral value={p.idx + 1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 font-ui uppercase tracking-editorial text-[9.5px] mb-2" style={{ color: p.color }}>
                  <span className="text-[7px]">◆</span> {p.shortName}
                </div>
                <h2 className="font-display font-medium text-[20px] text-dark leading-[1.08] tracking-[-0.4px]">
                  {p.name}
                </h2>
                <p className="font-serif-body italic text-[14px] text-muted leading-[1.4] mt-2">
                  {p.description}
                </p>
                <div className="mt-4 pt-3.5 border-t border-border flex items-baseline justify-between gap-3">
                  <div className="font-display font-medium text-[16px] tracking-[-0.2px]" style={{ color: p.color }}>
                    {p.xp.toLocaleString('pl-PL')}
                    <small className="font-ui font-normal text-[9px] tracking-luxury text-muted-light uppercase ml-1.5">xp</small>
                  </div>
                  {p.xp === 0 && (
                    <SmallCaps tone="muted" tracking="luxury" size="xs" className="opacity-70">nieaktywny</SmallCaps>
                  )}
                </div>
              </div>
            </div>
          )

          if (featured) {
            return (
              <article
                key={p.id}
                className="relative md:col-span-2 border border-hairline p-6 md:p-7 flex flex-col"
                style={{ background: 'linear-gradient(180deg, rgba(139,58,58,0.05), rgba(139,58,58,0) 40%), #FAF8F4' }}
              >
                <Corners />
                {header}
                <RedirectEnergyWidget />
              </article>
            )
          }

          return (
            <article key={p.id} className="relative border border-hairline bg-ivory p-6 md:p-7">
              <Corners />
              {header}
            </article>
          )
        })}
      </div>

      {/* ── O balansie ─────────────────────────────────────────── */}
      <section className="relative mt-11 bg-cream-warm border border-hairline px-8 py-8 md:px-11">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />
        <div className="font-ui uppercase tracking-editorial text-[10px] text-gold-deep mb-4">O balansie</div>
        <p className="font-serif-body italic text-[16px] text-muted leading-[1.6] max-w-[72ch]">
          transformacja działa najlepiej, gdy <em className="text-gold-deep">żaden filar nie jest całkowicie zaniedbany</em>. nie musisz równo rozkładać energii każdego dnia — ale co tydzień sprawdź, czy nie ignorujesz żadnego obszaru przez zbyt długi czas.
        </p>
      </section>
    </div>
  )
}
