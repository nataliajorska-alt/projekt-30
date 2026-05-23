import { clsx } from 'clsx';
import { Diamond } from './Diamond';
import { Fleuron } from './Fleuron';

type Variant = 'plain' | 'diamond' | 'fleuron' | 'jewel' | 'constellation' | 'circlet';

type Props = {
  variant?: Variant;
  className?: string;
  /** kolor linii i ornamentu */
  tone?: 'gold' | 'gold-deep' | 'hairline';
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  gold: 'text-gold',
  'gold-deep': 'text-gold-deep',
  hairline: 'text-hairline',
};

export function GoldRule({ variant = 'diamond', className, tone = 'gold' }: Props) {
  const color = toneClass[tone];

  if (variant === 'plain') {
    return (
      <div className={clsx('flex items-center', className)}>
        <span className={clsx('h-px flex-1 bg-current', color)} />
      </div>
    );
  }

  const Center =
    variant === 'fleuron' ? (
      <Fleuron size={14} className={color} />
    ) : variant === 'jewel' ? (
      <Diamond size={10} className={color} />
    ) : variant === 'circlet' ? (
      <span className={clsx('w-2 h-2 rounded-full border border-current', color)} />
    ) : variant === 'constellation' ? (
      <span className={clsx('flex items-center gap-1', color)}>
        <Diamond size={4} />
        <Diamond size={5} />
        <Diamond size={4} />
      </span>
    ) : (
      <Diamond size={7} className={color} />
    );

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <span className={clsx('h-px flex-1 bg-current', color)} />
      {Center}
      <span className={clsx('h-px flex-1 bg-current', color)} />
    </div>
  );
}
