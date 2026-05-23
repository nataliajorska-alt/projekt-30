import clsx from 'clsx'

interface SkeletonProps { className?: string }

function SkeletonLine({ className }: SkeletonProps) {
  return <div className={clsx('bg-hairline/60 animate-pulse', className)} />
}

// ── Karty ogólne ─────────────────────────────────────────────────

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('bg-ivory border border-gold-light/30 p-5', className)}>
      <SkeletonLine className="h-3 w-1/3 mb-3" />
      <SkeletonLine className="h-6 w-1/2 mb-2" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  )
}

// ── Dashboard hero ───────────────────────────────────────────────

export function SkeletonHero() {
  return (
    <div className="bg-ivory border border-gold-light/30 p-6 mb-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="bg-hairline/60 h-3 w-24 mb-2" />
          <div className="bg-hairline/60 h-7 w-40" />
        </div>
        <div className="bg-hairline/60 h-12 w-12" />
      </div>
      <div className="bg-hairline/60 h-px w-full mb-4" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-hairline/40 h-14" />
        ))}
      </div>
    </div>
  )
}

// ── Lista checkboxów (rutyna) ────────────────────────────────────

export function SkeletonChecklist({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-ivory border border-gold-light/30 p-5 mb-4 animate-pulse">
      <div className="bg-hairline/60 h-3 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-hairline/60 w-3 h-3 rotate-45 flex-shrink-0" />
            <div
              className="bg-hairline/60 h-3 flex-1"
              style={{ width: `${60 + (i * 13) % 30}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Siatka kart (osiągnięcia) ────────────────────────────────────

export function SkeletonAchievementGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-ivory border border-gold-light/30 p-4">
          <div className="bg-hairline/60 w-10 h-10 mb-3" />
          <div className="bg-hairline/60 h-3 w-3/4 mb-2" />
          <div className="bg-hairline/60 h-2.5 w-full mb-1" />
          <div className="bg-hairline/60 h-2.5 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ── Lista filarów ────────────────────────────────────────────────

export function SkeletonPillarList({ count = 7 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-ivory border border-gold-light/30 p-5 flex items-start gap-4">
          <div className="bg-hairline/60 w-11 h-11 flex-shrink-0" />
          <div className="flex-1">
            <div className="bg-hairline/60 h-4 w-1/3 mb-2" />
            <div className="bg-hairline/60 h-3 w-full mb-1" />
            <div className="bg-hairline/60 h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
