import clsx from 'clsx'

// Reużywalny komponent skeleton w estetyce ivory/cream (animate-pulse)

interface SkeletonProps {
  className?: string
}

function SkeletonLine({ className }: SkeletonProps) {
  return (
    <div className={clsx('bg-cream rounded-full animate-pulse', className)} />
  )
}

// ── Karty ogólne ────────────────────────────────────────────────

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-elegant p-5', className)}>
      <SkeletonLine className="h-4 w-1/3 mb-3" />
      <SkeletonLine className="h-7 w-1/2 mb-2" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  )
}

// ── Dashboard hero ───────────────────────────────────────────────

export function SkeletonHero() {
  return (
    <div className="bg-white rounded-2xl shadow-elegant p-6 mb-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="bg-cream h-3 w-24 rounded-full mb-2" />
          <div className="bg-cream h-8 w-40 rounded-full" />
        </div>
        <div className="bg-cream h-14 w-14 rounded-xl" />
      </div>
      <div className="bg-cream h-2 w-full rounded-full mb-4" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-cream rounded-xl h-14" />
        ))}
      </div>
    </div>
  )
}

// ── Lista checkboxów (rutyna) ────────────────────────────────────

export function SkeletonChecklist({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-elegant p-5 mb-4 animate-pulse">
      <div className="bg-cream h-4 w-32 rounded-full mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-cream w-5 h-5 rounded-md flex-shrink-0" />
            <div className="bg-cream h-3 rounded-full flex-1" style={{ width: `${60 + (i * 13) % 30}%` }} />
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
        <div key={i} className="bg-white rounded-2xl shadow-elegant p-4">
          <div className="bg-cream w-10 h-10 rounded-xl mb-3" />
          <div className="bg-cream h-3 w-3/4 rounded-full mb-2" />
          <div className="bg-cream h-2.5 w-full rounded-full mb-1" />
          <div className="bg-cream h-2.5 w-2/3 rounded-full" />
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
        <div key={i} className="bg-white rounded-2xl shadow-elegant p-5 flex items-start gap-4">
          <div className="bg-cream w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <div className="bg-cream h-4 w-1/3 rounded-full mb-2" />
            <div className="bg-cream h-3 w-full rounded-full mb-1" />
            <div className="bg-cream h-3 w-2/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
