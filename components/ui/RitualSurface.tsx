import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { CornerBrackets } from './CornerBrackets';

type Props = {
  children: ReactNode;
  className?: string;
  /** głębokość — 'deep' to czarna noc, 'forest' to leśny zmierzch */
  tone?: 'forest' | 'forest-deep' | 'dark';
  /** ramka — 'brackets' albo 'double' (podwójna gold) */
  frame?: 'brackets' | 'double' | 'single' | 'none';
};

const toneClass = {
  forest: 'bg-forest text-ivory',
  'forest-deep': 'bg-forest-deep text-ivory',
  dark: 'bg-dark-deep text-ivory',
};

/** Pełnoekranowy "ritual" background — dark mode pages. Renderuj jako root layout dla /review, /serce. */
export function RitualSurface({
  children,
  className,
  tone = 'forest-deep',
  frame = 'double',
}: Props) {
  return (
    <div className={clsx('relative min-h-screen w-full grain-linen', toneClass[tone], className)}>
      {frame === 'double' && (
        <>
          <div className="pointer-events-none absolute inset-7 border border-gold-light/40" />
          <div className="pointer-events-none absolute inset-[34px] border border-gold-light/20" />
        </>
      )}
      {frame === 'single' && (
        <div className="pointer-events-none absolute inset-7 border border-gold-light/40" />
      )}
      {frame === 'brackets' && (
        <div className="pointer-events-none absolute inset-7">
          <CornerBrackets size={22} tone="gold" weight={1} />
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
