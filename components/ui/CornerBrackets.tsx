import { clsx } from 'clsx';

type Props = {
  /** długość ramienia w px */
  size?: number;
  className?: string;
  tone?: 'gold' | 'gold-light' | 'gold-deep' | 'hairline';
  /** grubość linii */
  weight?: number;
};

const toneClass = {
  gold: 'text-gold',
  'gold-light': 'text-gold-light',
  'gold-deep': 'text-gold-deep',
  hairline: 'text-hairline',
};

/** Cztery rogowe nawiasy w stylu muzealnego pasportu. Renderuj jako absolute wewnątrz `relative` rodzica. */
export function CornerBrackets({ size = 16, className, tone = 'gold', weight = 1 }: Props) {
  const color = toneClass[tone];
  // każda rogowa nawias to dwie cienkie linie (pionowa + pozioma) wychodzące z rogu
  return (
    <div className={clsx('pointer-events-none absolute inset-0', color, className)} aria-hidden>
      {/* top-left */}
      <span style={{ width: size, height: weight }} className="absolute top-0 left-0 bg-current" />
      <span style={{ width: weight, height: size }} className="absolute top-0 left-0 bg-current" />
      {/* top-right */}
      <span style={{ width: size, height: weight }} className="absolute top-0 right-0 bg-current" />
      <span style={{ width: weight, height: size }} className="absolute top-0 right-0 bg-current" />
      {/* bottom-left */}
      <span style={{ width: size, height: weight }} className="absolute bottom-0 left-0 bg-current" />
      <span style={{ width: weight, height: size }} className="absolute bottom-0 left-0 bg-current" />
      {/* bottom-right */}
      <span style={{ width: size, height: weight }} className="absolute bottom-0 right-0 bg-current" />
      <span style={{ width: weight, height: size }} className="absolute bottom-0 right-0 bg-current" />
    </div>
  );
}
