import { clsx } from 'clsx';

type Props = {
  size?: number;
  className?: string;
  filled?: boolean;
};

export function Diamond({ size = 8, className, filled = true }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      aria-hidden
      className={clsx('inline-block shrink-0', className)}
    >
      {filled ? (
        <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
      ) : (
        <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      )}
    </svg>
  );
}
