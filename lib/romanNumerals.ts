const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  if (!Number.isFinite(n) || n < 1 || n > 3999) return String(n);
  let num = Math.floor(n);
  let out = '';
  for (const [val, sym] of ROMAN_MAP) {
    while (num >= val) {
      out += sym;
      num -= val;
    }
  }
  return out;
}
