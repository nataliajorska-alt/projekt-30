import { clsx } from 'clsx';

type Props = {
  size?: number;
  className?: string;
};

/** Trójdiamentowy ornament — sygnatura "Quiet Inheritance" */
export function Fleuron({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden
      className={clsx('inline-block shrink-0', className)}
    >
      {/* trzy diamenty w trójkącie + centralny */}
      <g fill="currentColor">
        <path d="M10 2 L11.6 4 L10 6 L8.4 4 Z" />
        <path d="M3 13 L4.6 15 L3 17 L1.4 15 Z" />
        <path d="M17 13 L18.6 15 L17 17 L15.4 15 Z" />
        <path d="M10 9.5 L10.9 10.5 L10 11.5 L9.1 10.5 Z" />
      </g>
    </svg>
  );
}
