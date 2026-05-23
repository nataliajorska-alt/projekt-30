import { clsx } from 'clsx';
import { toRoman } from '@/lib/romanNumerals';

type Props = {
  value: number;
  className?: string;
  font?: 'display' | 'heading';
};

export function RomanNumeral({ value, className, font = 'display' }: Props) {
  return (
    <span className={clsx(font === 'display' ? 'font-display' : 'font-heading', className)}>
      {toRoman(value)}
    </span>
  );
}
