'use client'
import { useId } from 'react'
import { LEAF_PATH } from '@/components/StageExLibris'

/**
 * Winorośl poziomów — pnącze rosnące wzdłuż osi listy na /progress.
 * Pattern 64px (fala + listki + wąs + pąk) powtarzany pionowo; dojrzała
 * część (do obecnego poziomu, `fillRatio` 0..1) w gold-deep, dalsza droga
 * w kolorze hairline. Rodzic musi być position:relative; oś pnącza leży
 * na x=20px (środek nodów w-10), sam SVG na left-12px szerokości 16.
 */
export default function LevelVine({ fillRatio }: { fillRatio: number }) {
  const uid = useId().replace(/:/g, '')
  const pct = Math.max(0, Math.min(100, fillRatio * 100))
  return (
    <svg
      className="absolute left-[12px] top-4 w-4"
      aria-hidden
      style={{ height: 'calc(100% - 2rem)' }}
    >
      <defs>
        {/* Jeden segment geometrii, dwa kolory przez <use> — kolor spływa
            z atrybutów na <use> (stroke/color), więc geometria ma jedno
            źródło zamiast dwóch kopii w obu patternach. */}
        <g id={`vine-seg-${uid}`}>
          <path d="M8,0 C12,10 4,22 8,32 C12,42 4,54 8,64" fill="none" strokeWidth="1.1" />
          <path d={LEAF_PATH} transform="translate(10,14) rotate(42)" fill="currentColor" fillOpacity="0.14" strokeWidth="0.7" />
          <path d={LEAF_PATH} transform="translate(6,46) rotate(-42)" fill="currentColor" fillOpacity="0.14" strokeWidth="0.7" />
          <path d="M7,30 q4.4,0.6 4.8,3.6 q0.3,2.2 -1.7,2.4 q-1.5,0.1 -1.4,-1.6" fill="none" strokeWidth="0.6" opacity="0.7" />
          <circle cx="6.6" cy="57.5" r="1.1" fill="currentColor" stroke="none" opacity="0.6" />
        </g>
        <pattern id={`vine-g-${uid}`} width="16" height="64" patternUnits="userSpaceOnUse">
          <use href={`#vine-seg-${uid}`} stroke="#826933" color="#826933" />
        </pattern>
        <pattern id={`vine-f-${uid}`} width="16" height="64" patternUnits="userSpaceOnUse">
          <use href={`#vine-seg-${uid}`} stroke="#D9CDA8" color="#D9CDA8" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="16" height={`${pct}%`} fill={`url(#vine-g-${uid})`} stroke="none" />
      <rect x="0" y={`${pct}%`} width="16" height={`${100 - pct}%`} fill={`url(#vine-f-${uid})`} stroke="none" />
    </svg>
  )
}
