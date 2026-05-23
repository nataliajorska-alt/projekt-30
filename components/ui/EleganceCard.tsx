import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { CornerBrackets } from './CornerBrackets';

type Variant = 'ivory' | 'cream' | 'parchment' | 'forest' | 'forest-deep' | 'dark';
type Props = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  /** gold border 1px */
  bordered?: boolean;
  /** rogowe nawiasy zamiast ramki — bardziej "muzealne" */
  brackets?: boolean;
  /** dodaje subtelny grain (do ritual variant) */
  grain?: boolean;
  /** padding inside */
  padding?: 'sm' | 'md' | 'lg' | 'none';
};

const variantClass: Record<Variant, string> = {
  ivory: 'bg-ivory text-dark',
  cream: 'bg-cream text-dark',
  parchment: 'bg-parchment text-dark',
  forest: 'bg-forest text-ivory',
  'forest-deep': 'bg-forest-deep text-ivory',
  dark: 'bg-dark-deep text-ivory',
};

const padClass = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 md:p-10',
};

export function EleganceCard({
  children,
  className,
  variant = 'ivory',
  bordered = true,
  brackets = false,
  grain = false,
  padding = 'md',
}: Props) {
  const isDark = variant === 'forest' || variant === 'forest-deep' || variant === 'dark';
  return (
    <div
      className={clsx(
        'relative',
        variantClass[variant],
        padClass[padding],
        bordered && !brackets && 'border border-gold-light/40',
        grain && (isDark ? 'grain-linen' : 'grain-parchment'),
        className
      )}
    >
      {brackets && (
        <CornerBrackets size={18} tone={isDark ? 'gold-light' : 'gold'} weight={1} />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
