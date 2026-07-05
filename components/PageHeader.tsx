import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { GoldRule } from '@/components/ui'

/**
 * Wspólny nagłówek stron — „rozdziały księgi". Każda strona otwiera się
 * inskrypcją ROZDZIAŁ {chapter} · {eyebrow} · Vol. I, po niej tytuł
 * (font-display medium) i kursywowy podtytuł. Ujednolica dwie rozjechane
 * rodziny nagłówków (· vs ∴, medium vs nie) w jeden masztowy wzorzec.
 *
 * title/subtitle są ReactNode — strony zachowują swoje akcenty (em, licz-
 * niki, kolor mauve cyklu). action = slot po prawej (np. przycisk „Dodaj").
 * accent koloruje inskrypcję i separatory (domyślnie złoto; cykl podaje mauve).
 */
export default function PageHeader({
  chapter,
  eyebrow,
  title,
  subtitle,
  action,
  accent = '#B29355',
  rule = false,
  className,
}: {
  chapter?: string
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  accent?: string
  rule?: boolean
  className?: string
}) {
  // clsx tylko skleja klasy — „mb-8 mb-0" nie nadpisze się, bo Tailwind
  // emituje .mb-0 przed .mb-8 (równa specyficzność → wygrywa późniejsza).
  // Dlatego domyślne mb-8 dokładamy TYLKO, gdy strona nie podała własnego mb-.
  const hasMb = className ? /(^|\s)mb-/.test(className) : false
  return (
    <header className={clsx(!hasMb && 'mb-8', className)}>
      {/* Inskrypcja rozdziału */}
      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 font-ui uppercase tracking-editorial text-[10px] text-muted mb-3.5">
        {chapter && (
          <>
            <span className="font-medium" style={{ color: accent }}>Rozdział {chapter}</span>
            <span style={{ color: accent }} className="opacity-60">·</span>
          </>
        )}
        <span>{eyebrow}</span>
        <span style={{ color: accent }} className="opacity-60">·</span>
        <span className="text-muted-light">Vol. I</span>
      </div>

      <div className={clsx('flex gap-4', action ? 'items-end justify-between' : 'items-start')}>
        <h1 className="min-w-0 font-display font-medium text-dark leading-tight tracking-[-0.5px] text-[clamp(1.9rem,5vw,2.6rem)]">
          {title}
        </h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {subtitle && (
        <p className="mt-2 font-serif-body italic text-muted text-[14px]">
          {subtitle}
        </p>
      )}

      {rule && <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />}
    </header>
  )
}
