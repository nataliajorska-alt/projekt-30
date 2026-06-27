import { clsx } from 'clsx';

type Props = {
  id: string;
  size?: number;
  className?: string;
};

/**
 * Rytownicze ikony liniowe dla questów "Przekieruj energię".
 * Jeden spójny motyw: cienka kreska, currentColor, viewBox 24 —
 * w tym samym języku co Diamond / Fleuron. Klucz: id questa.
 */
const GLYPHS: Record<string, JSX.Element> = {
  // Napisz do przyjaciółki — koperta
  rq_01: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
      <path d="M4 7 L12 12.5 L20 7" />
    </>
  ),
  // Zarezerwuj stolik — kieliszek
  rq_02: (
    <>
      <path d="M7 4 H17" />
      <path d="M7.5 4 C7.5 9 9.5 11 12 11 C14.5 11 16.5 9 16.5 4" />
      <path d="M12 11 V19" />
      <path d="M8.5 19 H15.5" />
    </>
  ),
  // Kup coś małego dla siebie — róża
  rq_03: (
    <>
      <path d="M12 11 V20" />
      <path d="M12 16 C13.5 15 15.5 15.5 16.5 17 C14.8 17.5 13 17 12 16 Z" />
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M10.5 7.5 a1.5 1.5 0 1 1 3 0" />
    </>
  ),
  // Idź tam gdzie się dobrze ubierasz — iskra
  rq_04: <path d="M12 3.5 L13.3 10.7 L20.5 12 L13.3 13.3 L12 20.5 L10.7 13.3 L3.5 12 L10.7 10.7 Z" />,
  // Napisz sobie komplement — lusterko
  rq_05: (
    <>
      <circle cx="12" cy="8.5" r="5" />
      <path d="M12 13.5 V20" />
      <path d="M9.5 20 H14.5" />
    </>
  ),
  // Zrób coś dla przyjemności — księżyc
  rq_06: <path d="M16.5 4 A8 8 0 1 0 16.5 20 A6.2 6.2 0 1 1 16.5 4 Z" />,
  // Zadzwoń do kogoś bliskiego — słuchawka
  rq_07: (
    <path d="M6.8 4.2 C6 4 5.2 4.4 4.9 5.2 C4 7.8 5.4 12 8.7 15.3 C12 18.6 16.2 20 18.8 19.1 C19.6 18.8 20 18 19.8 17.2 L19 14.3 C18.8 13.6 18.1 13.2 17.4 13.4 L15.3 13.9 C14 12.9 11.1 10 10.1 8.7 L10.6 6.6 C10.8 5.9 10.4 5.2 9.7 5 Z" />
  ),
  // Zaplanuj coś na siebie — klepsydra
  rq_08: (
    <>
      <path d="M7 4 H17" />
      <path d="M7 20 H17" />
      <path d="M7.5 4 C7.5 9 12 10.5 12 12 C12 13.5 7.5 15 7.5 20" />
      <path d="M16.5 4 C16.5 9 12 10.5 12 12 C12 13.5 16.5 15 16.5 20" />
    </>
  ),
  // Ubierz się tak jak lubisz — sukienka
  rq_09: (
    <>
      <path d="M9 4 L10.5 6.5 L8.5 9 L9.5 19 H14.5 L15.5 9 L13.5 6.5 L15 4" />
      <path d="M10.5 6.5 Q12 8 13.5 6.5" />
    </>
  ),
  // Wyjdź na spacer — listek
  rq_10: (
    <>
      <path d="M5 19 C5 12 10 5 19 5 C19 14 12 19 5 19 Z" />
      <path d="M7 17 C11 13 15 9 17 7" />
    </>
  ),
  // Zrób coś po raz pierwszy — kompas
  rq_11: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.5 L11 11 L9.5 14.5 L13 13 Z" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  // Wyślij komuś miłą wiadomość — serce
  rq_12: <path d="M12 19 C4.5 13.5 4.5 8 8 6.5 C10 5.6 11.4 6.8 12 8 C12.6 6.8 14 5.6 16 6.5 C19.5 8 19.5 13.5 12 19 Z" />,
  // Stwórz playlistę — nuty
  rq_13: (
    <>
      <path d="M9 16 V6 L18 4 V14" />
      <ellipse cx="7" cy="16" rx="2" ry="1.6" />
      <ellipse cx="16" cy="14" rx="2" ry="1.6" />
    </>
  ),
  // Zamów coś co lubisz — kokarda
  rq_14: (
    <>
      <path d="M12 12 C8.5 8.5 4.5 8.5 4.5 12 C4.5 15.5 8.5 15.5 12 12 Z" />
      <path d="M12 12 C15.5 8.5 19.5 8.5 19.5 12 C19.5 15.5 15.5 15.5 12 12 Z" />
      <path d="M11 13 L8.5 19" />
      <path d="M13 13 L15.5 19" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  // Napisz list do przyszłej siebie — pióro
  rq_15: (
    <>
      <path d="M5 19 C8 13 13 7 19 5 C18 11 14 16 8 17 Z" />
      <path d="M8 17 C10 13 13 10 16 8" />
      <path d="M5 19 L7.5 16.5" />
    </>
  ),
};

export function RedirectGlyph({ id, size = 20, className }: Props) {
  const glyph = GLYPHS[id];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={clsx('inline-block shrink-0', className)}
    >
      {glyph ?? <path d="M12 3 L21 12 L12 21 L3 12 Z" />}
    </svg>
  );
}
