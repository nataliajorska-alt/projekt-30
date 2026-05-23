'use client'
import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { SmallCaps, Diamond, Fleuron, GoldRule } from '@/components/ui'

type RecoveryBreakdown = {
  fromLogs: number; fromWeeklyReviews: number; fromMonthlyReviews: number
  fromAchievements: number; total: number; weeklyCount: number; monthlyCount: number; achievementsCount: number
  fromMoodCheckIns: number; fromHeartBlocks: number; fromPillarBalance: number
  fromGhostV2: number; fromHonestFailure: number
  moodCheckInsCount: number; heartBlocksCount: number; pillarBalanceCount: number
  ghostV2Count: number; honestFailureCount: number
  /** XP z Learning Vault, JUŻ wliczone w fromLogs — informacyjny rozkład. */
  fromExternal: number
  externalDaysCount: number
}

const PILLAR_NAMES: Record<string, string> = {
  pozycja: 'Pozycja', cialo: 'Ciało', styl: 'Styl',
  kapital: 'Kapitał', kariera: 'Kariera', tozsamosc: 'Tożsamość', milosc: 'Miłość',
}

export default function XPRecoverySection() {
  const { stats, recoverStats, applyRecoveredStats } = useGameData()
  const [breakdown, setBreakdown] = useState<RecoveryBreakdown | null>(null)
  const [recoveredStats, setRecoveredStats] = useState<import('@/types').UserStats | null>(null)
  const [scanning, setScanning] = useState(false)
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async () => {
    setScanning(true)
    setBreakdown(null); setRecoveredStats(null); setDone(false); setError(null)
    try {
      const r = await recoverStats()
      if (r) {
        setBreakdown(r.breakdown)
        setRecoveredStats(r.reconstructedStats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd skanowania')
      console.error('recoverStats error:', err)
    } finally {
      setScanning(false)
    }
  }

  const handleApply = async () => {
    if (!recoveredStats) return
    setApplying(true)
    setError(null)
    try {
      await applyRecoveredStats(recoveredStats)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd zapisu')
      console.error('applyRecoveredStats error:', err)
    } finally {
      setApplying(false)
    }
  }

  return (
    <section className="bg-ivory border border-gold-light/40 p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={14} strokeWidth={1.5} className="text-muted" />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          Odzyskiwanie danych
        </SmallCaps>
      </div>
      <h2 className="font-heading text-dark text-xl mt-1">Skan i odzysk XP</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-4 leading-relaxed">
        jeśli xp lub osiągnięcia zniknęły — użyj tego narzędzia.
        przeskanuje wszystkie wpisy, przeglądy i osiągnięcia od nowa.
      </p>

      <div className="bg-cream/40 border border-hairline px-4 py-3 mb-4 flex items-baseline justify-between">
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          Aktualne XP
        </SmallCaps>
        <span className="font-display text-gold text-2xl leading-none">{stats.totalXP}</span>
      </div>

      {breakdown !== null && !done && (
        <div className="bg-gold-pale/40 border border-gold-light/40 p-4 mb-4 space-y-1.5">
          <div className="flex items-baseline justify-between mb-2">
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Odzyskane łącznie
            </SmallCaps>
            <span className="font-display text-gold text-xl leading-none">
              {breakdown.total} XP
            </span>
          </div>
          <GoldRule variant="plain" tone="gold-deep" className="opacity-30 my-2" />
          {[
            ['Dzienne wpisy (rutyna, questy, zasady)', breakdown.fromLogs],
            [`Mood check-iny (${breakdown.moodCheckInsCount} × 5)`, breakdown.fromMoodCheckIns],
            [`Przeglądy tygodniowe (${breakdown.weeklyCount} × 150)`, breakdown.fromWeeklyReviews],
            [`Przeglądy miesięczne (${breakdown.monthlyCount} × 300)`, breakdown.fromMonthlyReviews],
            [`Heart blocks (${breakdown.heartBlocksCount} × 200)`, breakdown.fromHeartBlocks],
            [`Pillar balance bonus (${breakdown.pillarBalanceCount} × 30)`, breakdown.fromPillarBalance],
            [`Ghost Protocol V2 (${breakdown.ghostV2Count})`, breakdown.fromGhostV2],
            [`Honest Failure (${breakdown.honestFailureCount})`, breakdown.fromHonestFailure],
            [`Osiągnięcia (${breakdown.achievementsCount})`, breakdown.fromAchievements],
            // Z Learning Vault — informacyjnie, JUŻ wliczone w „Dzienne wpisy" wyżej.
            ...(breakdown.fromExternal > 0
              ? [[`Z Learning Vault (${breakdown.externalDaysCount} dni, wliczone wyżej)`, breakdown.fromExternal] as const]
              : []),
          ].map(([label, value]) => (
            <p key={label as string} className="flex items-baseline justify-between gap-2">
              <span className="font-serif-body italic text-muted text-[12.5px]">{label}</span>
              <span className="font-ui text-[11px] text-dark tabular-nums">{value}</span>
            </p>
          ))}
          {recoveredStats && (
            <div className="mt-3 pt-3 border-t border-gold-deep/20">
              <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-1.5">
                Rekonstrukcja pillarXP
              </SmallCaps>
              {Object.entries(recoveredStats.pillarXP).map(([p, xp]) => (
                <p key={p} className="flex items-baseline justify-between gap-2">
                  <span className="font-serif-body italic text-muted text-[12.5px]">
                    {PILLAR_NAMES[p] ?? p}
                  </span>
                  <span className="font-ui text-[11px] text-dark tabular-nums">{xp} XP</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="flex items-start gap-2 border border-forest/30 bg-forest/5 px-4 py-3 mb-4">
          <Fleuron size={10} className="text-forest mt-0.5 shrink-0" />
          <p className="font-serif-body italic text-forest text-[13px] leading-snug">
            dane zostały przywrócone.
          </p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50/50 p-3 mb-4">
          <SmallCaps tracking="luxury" size="xs" className="!text-red-700">
            Coś poszło nie tak
          </SmallCaps>
          <p className="font-serif-body italic text-red-800 text-[12.5px] mt-1 break-words">{error}</p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="border border-hairline text-dark hover:border-gold py-2.5 px-4 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {scanning ? (
            <Fleuron size={10} className="text-gold-deep animate-pulse" />
          ) : (
            <Diamond size={5} className="text-gold-deep" />
          )}
          <SmallCaps tone="dark" tracking="luxury" size="xs">
            {scanning ? 'skanowanie…' : 'skanuj dane'}
          </SmallCaps>
        </button>

        {breakdown !== null && !done && (
          <button
            onClick={handleApply}
            disabled={applying}
            className="bg-dark-deep text-ivory border border-gold py-2.5 px-4 hover:bg-forest transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              {applying ? 'przywracam…' : `przywróć ${breakdown.total} XP + ${breakdown.achievementsCount} osiągnięć`}
            </SmallCaps>
          </button>
        )}
      </div>
    </section>
  )
}
