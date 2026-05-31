'use client'
import { Lock } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { ACHIEVEMENTS } from '@/lib/achievements'
import type { Achievement, UserStats } from '@/types'
import { toRoman } from '@/lib/romanNumerals'
import { SkeletonCard } from '@/components/SkeletonCard'

// ── Taksonomia (glify kategorii + tier z xpReward) ───────────────
// W danych nie ma category/tier — wyprowadzamy je tu, zgodnie z mockiem.
type Cat = { label: string; glyph: string }
function categoryOf(id: string): Cat {
  if (id === 'level_30') return { label: 'Finał', glyph: '♛' }
  if (id === 'first_day') return { label: 'Początek', glyph: '✦' }
  if (id.startsWith('level_')) return { label: 'Poziom', glyph: '✧' }
  if (id.includes('side_quest') || id.startsWith('quest')) return { label: 'Quest', glyph: '❖' }
  if (id.startsWith('xp_') || id.startsWith('day_xp_')) return { label: 'XP', glyph: '◆' }
  if (id.includes('review')) return { label: 'Refleksja', glyph: '◑' }
  if (id.startsWith('rules_') || id.startsWith('ghost') || id === 'no_impulse_7') return { label: 'Granica', glyph: '✜' }
  if (id.startsWith('perfect_morning') || id === 'routines_100' || id === 'all_pillars') return { label: 'Rytm', glyph: '✶' }
  return { label: 'Passa', glyph: '✦' } // streaki, tygodnie, miesiące, dni, no_minimum
}
function tierOf(xp: number): string {
  if (xp <= 200) return 'Brąz'
  if (xp <= 500) return 'Srebro'
  if (xp <= 1200) return 'Złoto'
  return 'Legenda'
}
const plNum = (n: number) => n.toLocaleString('pl-PL')

// ── Pieczęć (złoty medalion z glifem) ────────────────────────────
function Seal({ glyph, size = 58, locked = false }: { glyph: string; size?: number; locked?: boolean }) {
  const dim = { width: size, height: size }
  const fs = Math.round(size * 0.4)
  if (locked) {
    return (
      <div className="relative shrink-0 rounded-full border border-dashed border-hairline flex items-center justify-center" style={dim}>
        <span className="text-muted-light leading-none" style={{ fontSize: fs }}>{glyph}</span>
      </div>
    )
  }
  return (
    <div
      className="relative shrink-0 rounded-full border border-gold-light flex items-center justify-center"
      style={{ ...dim, background: 'radial-gradient(circle at 50% 36%, #fbf7ec, #ece3cd)' }}
    >
      <span aria-hidden className="absolute rounded-full border border-gold/30" style={{ inset: Math.round(size * 0.086) }} />
      <span className="text-gold-deep leading-none not-italic" style={{ fontSize: fs }}>{glyph}</span>
    </div>
  )
}

function Corners() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l border-gold-light/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold-light/70" />
    </>
  )
}

function SectionLabel({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div className="flex items-center gap-3.5 font-ui uppercase tracking-editorial text-[10px] text-muted mb-5">
      <span>{children}</span>
      <span className="flex-1 h-px bg-hairline" />
      <span className="text-gold-deep">{toRoman(count)}</span>
    </div>
  )
}

// ── Karta osiągnięcia (zdobyte / ukryte) ─────────────────────────
function AchCard({ a, hidden }: { a: Achievement; hidden: boolean }) {
  const cat = categoryOf(a.id)
  const catLine = hidden ? `Ukryte · ${cat.label}` : `${cat.label} · ${tierOf(a.xpReward)}`
  return (
    <article className="relative bg-ivory border border-hairline p-6 flex gap-5 items-start hover:border-gold-light transition-colors">
      <Corners />
      <Seal glyph={cat.glyph} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3.5">
          <span className="inline-flex items-center gap-2 font-ui uppercase tracking-editorial text-[9px] text-gold-deep">
            <span className="text-gold text-[6px]">{hidden ? '✦' : '◆'}</span> {catLine}
          </span>
          <span className="font-display font-medium text-[18px] text-gold-deep tracking-[-0.2px] whitespace-nowrap">
            <span className="font-serif-body italic font-normal text-[14px] text-muted-light mr-px">+</span>{a.xpReward}
            <small className="font-ui font-normal text-[8px] tracking-[0.22em] text-muted-light uppercase ml-1">XP</small>
          </span>
        </div>
        <h3 className="font-display font-medium text-[24px] text-dark leading-[1.05] tracking-[-0.4px] mt-2.5">{a.title}</h3>
        <p className="font-serif-body italic text-[15px] text-muted leading-[1.4] mt-1.5">{a.description}</p>
      </div>
    </article>
  )
}

// ── Karta „w trakcie" (pełna szerokość, pasek postępu) ───────────
function ProgressCard({ a, stats }: { a: Achievement; stats: UserStats }) {
  const cat = categoryOf(a.id)
  const prog = a.progress?.(stats)
  const pct = prog && prog.target > 0 ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 0
  return (
    <article className="relative md:col-span-2 bg-ivory border border-hairline p-6 flex flex-col">
      <Corners />
      <div className="flex gap-5 items-start w-full">
        <Seal glyph={cat.glyph} locked />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3.5">
            <span className="inline-flex items-center gap-2 font-ui uppercase tracking-editorial text-[9px] text-muted">
              <span className="text-gold-light text-[6px]">◆</span> {cat.label} · {tierOf(a.xpReward)}
            </span>
            <span className="font-display font-medium text-[18px] text-gold-deep tracking-[-0.2px] whitespace-nowrap">
              <span className="font-serif-body italic font-normal text-[14px] text-muted-light mr-px">+</span>{a.xpReward}
              <small className="font-ui font-normal text-[8px] tracking-[0.22em] text-muted-light uppercase ml-1">XP</small>
            </span>
          </div>
          <h3 className="font-display font-medium text-[24px] text-dark leading-[1.05] tracking-[-0.4px] mt-2.5 flex items-center gap-2">
            <Lock size={14} strokeWidth={1.6} className="text-muted-light shrink-0" />
            {a.title}
          </h3>
          <p className="font-serif-body italic text-[15px] text-muted leading-[1.4] mt-1.5">{a.description}</p>
        </div>
      </div>
      {prog && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="font-ui uppercase tracking-luxury text-[10px] text-muted whitespace-nowrap">
              {plNum(prog.current)} / {plNum(prog.target)} {prog.label}
            </span>
            <span className="font-display font-medium text-[16px] text-gold-deep">{pct}%</span>
          </div>
          <div className="relative h-px bg-border">
            <span className="absolute left-0 top-0 h-px bg-gold" style={{ width: `${pct}%` }} />
            <i className="absolute top-1/2 w-[7px] h-[7px] bg-gold rotate-45 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct}%` }} />
          </div>
        </div>
      )}
    </article>
  )
}

export default function AchievementsPage() {
  const { stats, loading } = useGameData()

  if (loading) return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12">
      <div className="mb-6">
        <div className="bg-cream h-3 w-16 mb-2 animate-pulse" />
        <div className="bg-cream h-9 w-56 mb-2 animate-pulse" />
        <div className="bg-cream h-3 w-64 animate-pulse" />
      </div>
      <SkeletonCard className="mb-6 h-20" />
      <SkeletonCard className="mb-6 h-28" />
      <SkeletonCard className="h-40" />
    </div>
  )

  const unlocked = stats.unlockedAchievements ?? []
  const isUnlocked = (a: Achievement) => unlocked.includes(a.id)

  const earned = ACHIEVEMENTS.filter(a => !a.hidden && isUnlocked(a))
  const hiddenEarned = ACHIEVEMENTS.filter(a => a.hidden && isUnlocked(a))
  const inProgress = ACHIEVEMENTS.filter(a => !a.hidden && !isUnlocked(a))
  const mystery = ACHIEVEMENTS.filter(a => a.hidden && !isUnlocked(a))

  const total = ACHIEVEMENTS.length
  const unlockedCount = unlocked.length
  const pct = Math.round((unlockedCount / total) * 100)

  // Micro-cel: najbliższe odblokowania spośród widocznych zablokowanych
  const microGoal = inProgress
    .map(a => {
      const p = a.progress?.(stats)
      if (!p || p.target <= 0) return null
      return { a, ratio: p.current / p.target, remaining: Math.max(0, p.target - p.current), label: p.label }
    })
    .filter((x): x is { a: Achievement; ratio: number; remaining: number; label: string } => !!x && x.ratio < 1)
    .sort((x, y) => y.ratio - x.ratio)[0]

  // Gablota pieczęci: zdobyte glify + ewentualne „?" na braki
  const caseGlyphs = [...earned, ...hiddenEarned].slice(0, 10).map(a => categoryOf(a.id).glyph)

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 font-ui uppercase tracking-editorial text-[10px] text-muted mb-3.5">
          Kolekcja <span className="text-gold">∴</span> Vol. I
        </div>
        <h1 className="font-display font-medium leading-[1] tracking-[-1.4px] text-[clamp(2.5rem,6vw,3.75rem)]">
          <em className="italic font-normal text-gold-deep">Osiągnięcia</em>
        </h1>
        <p className="mt-4 font-serif-body italic text-[18px] text-muted">
          {toRoman(unlockedCount)} z {toRoman(total)} zdobytych{mystery.length > 0 ? ' · kilka ukrytych wciąż czeka.' : '.'}
        </p>
      </header>

      <div className="flex items-center gap-3.5 my-7">
        <span className="flex-1 h-px bg-hairline" />
        <span className="text-gold text-[13px] leading-none">∴</span>
        <span className="flex-1 h-px bg-hairline" />
      </div>

      {/* Micro-goal banner */}
      {microGoal && (
        <section className="relative bg-dark text-parchment grid grid-cols-[38px_1fr_auto] gap-5 items-center px-7 py-4 mb-9 overflow-hidden">
          <span aria-hidden className="absolute right-3 top-3 w-2 h-2 border-t border-r border-gold-light/70" />
          <div className="w-[38px] h-[38px] rounded-full border border-gold-light/50 flex items-center justify-center text-gold-light text-[15px] relative">
            <span aria-hidden className="absolute inset-1 rounded-full border border-gold-light/30" />✦
          </div>
          <div className="min-w-0">
            <div className="font-ui uppercase tracking-editorial text-[9px] text-gold-light mb-1">Micro-cel na horyzoncie</div>
            <div className="font-serif-body italic text-[18px] text-gold-pale leading-tight">
              zostało <span className="font-display not-italic font-medium text-gold-light text-[21px] px-0.5">{plNum(microGoal.remaining)}</span> {microGoal.label} do{' '}
              <b className="font-display italic font-medium text-ivory">{microGoal.a.title}</b>
            </div>
          </div>
          <div className="font-display font-medium text-[18px] text-gold-light whitespace-nowrap">
            +{microGoal.a.xpReward}<small className="font-ui font-normal text-[9px] tracking-[0.24em] ml-1">XP</small>
          </div>
        </section>
      )}

      {/* Collection progress (wariant B) */}
      <section className="relative bg-ivory border border-hairline px-7 py-5 mb-11">
        <Corners />
        <div className="flex items-baseline justify-between mb-3.5">
          <div className="inline-flex items-center gap-2.5 font-ui uppercase tracking-editorial text-[10px] text-gold-deep">
            <span className="text-gold text-[8px]">◆</span> Postęp kolekcji
          </div>
          <div className="font-display font-medium text-[26px] text-dark tracking-[-0.6px] leading-none">
            {pct}%<small className="font-serif-body italic font-normal text-[14px] text-muted ml-2.5">{unlockedCount} / {total} zdobytych</small>
          </div>
        </div>
        <div className="relative h-px bg-border mb-4">
          <span className="absolute left-0 top-0 h-px bg-gold" style={{ width: `${pct}%` }} />
          <i className="absolute top-1/2 w-[6px] h-[6px] bg-gold rotate-45 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct}%` }} />
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {caseGlyphs.map((g, i) => <Seal key={i} glyph={g} size={40} />)}
          {mystery.length > 0 && <Seal glyph="?" size={40} locked />}
          {mystery.length > 1 && <Seal glyph="?" size={40} locked />}
        </div>
      </section>

      {/* Odblokowane */}
      {earned.length > 0 && (
        <section className="mb-12">
          <SectionLabel count={earned.length}>Odblokowane</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earned.map(a => <AchCard key={a.id} a={a} hidden={false} />)}
          </div>
        </section>
      )}

      {/* Ukryte — odkryte działając */}
      {hiddenEarned.length > 0 && (
        <section className="mb-12">
          <SectionLabel count={hiddenEarned.length}>Ukryte · odkryte działając</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hiddenEarned.map(a => <AchCard key={a.id} a={a} hidden />)}
          </div>
        </section>
      )}

      {/* W trakcie */}
      {inProgress.length > 0 && (
        <section className="mb-12">
          <SectionLabel count={inProgress.length}>W trakcie zdobywania</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgress.map(a => <ProgressCard key={a.id} a={a} stats={stats} />)}
          </div>
        </section>
      )}

      {/* Nieodkryte */}
      {mystery.length > 0 && (
        <section>
          <SectionLabel count={mystery.length}>Nieodkryte</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mystery.map(a => (
              <div key={a.id} className="border border-dashed border-hairline px-5 py-6 flex flex-col items-center text-center gap-3.5">
                <Seal glyph="?" size={48} locked />
                <div className="font-ui uppercase tracking-editorial text-[9px] text-muted-light">Ukryte</div>
                <div className="font-display font-medium text-[26px] text-muted-light tracking-[2px] leading-none">???</div>
                <div className="font-serif-body italic text-[13px] text-muted-light leading-[1.35]">odkryj je działając.</div>
                <div className="font-ui uppercase tracking-luxury text-[10px] text-muted-light">? XP</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
