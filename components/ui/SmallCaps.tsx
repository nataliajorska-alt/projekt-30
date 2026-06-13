import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  tracking?: 'luxury' | 'editorial';
  tone?: 'muted' | 'muted-light' | 'dark' | 'gold' | 'gold-deep' | 'gold-light' | 'ivory' | 'parchment';
  size?: 'xs' | 'sm' | 'md';
  as?: 'span' | 'div' | 'p';
};

const trackingClass = {
  luxury: 'tracking-luxury',
  editorial: 'tracking-editorial',
};
const toneClass = {
  muted: 'text-muted',
  'muted-light': 'text-muted-light',
  dark: 'text-dark',
  gold: 'text-gold',
  'gold-deep': 'text-gold-deep',
  'gold-light': 'text-gold-light',
  ivory: 'text-ivory',
  parchment: 'text-parchment',
};
const sizeClass = {
  xs: 'text-[9px]',
  sm: 'text-[10px]',
  md: 'text-[11px]',
};

export function SmallCaps({
  children,
  className,
  tracking = 'luxury',
  tone = 'muted',
  size = 'sm',
  as: Tag = 'span',
}: Props) {
  return (
    <Tag
      className={clsx(
        'font-ui uppercase',
        sizeClass[size],
        trackingClass[tracking],
        toneClass[tone],
        className
      )}
    >
      {children}
    </Tag>
  );
}
