'use client'
import clsx from 'clsx'

/**
 * Pieczęć lakowa — nieregularny kleks SVG z wytłoczonym pierścieniem
 * i monogramem. Używana w Skarbcu (kolor kategorii listu) i w Sercu (ROSE).
 *
 * `breaking` renderuje lak w dwóch połówkach (poszarpane pęknięcie przez
 * CSS clip-path), które animacje crack-left/right rozsuwają i opuszczają.
 * Globalny prefers-reduced-motion spłaszcza animację do ostatniej klatki —
 * wywołujący musi wtedy pominąć swój setTimeout i otworzyć treść od razu.
 */

const BLOB =
  'M24 4.6 C30.8 3.9 38.3 8.4 40.5 15.1 C42.7 21.9 41.8 29.7 36.8 34.8 ' +
  'C32.2 39.5 24.9 42.3 18.4 40.5 C11.9 38.7 6.5 33.1 5.7 26.3 ' +
  'C4.9 19.6 7.9 12.4 13.4 8.4 C16.7 6 20.1 5 24 4.6 Z'

// Poszarpana linia pęknięcia (lewa/prawa połówka z 1% zakładką).
const CLIP_LEFT = 'polygon(-10% -10%, 55% -10%, 46% 28%, 56% 54%, 47% 77%, 52% 110%, -10% 110%)'
const CLIP_RIGHT = 'polygon(54% -10%, 110% -10%, 110% 110%, 51% 110%, 46% 77%, 55% 54%, 45% 28%)'

function SealBody({ color, monogram }: { color: string; monogram?: string }) {
  return (
    <>
      <path d={BLOB} fill={color} />
      <path d={BLOB} fill="none" stroke="rgba(22,27,24,0.28)" strokeWidth={1} />
      {/* Odblask wosku */}
      <ellipse cx="19" cy="15.5" rx="10" ry="6.5" fill="#FFFFFF" opacity={0.16} />
      {/* Wytłoczony pierścień (stipple) */}
      <circle cx="24" cy="23.5" r="13.5" fill="none" stroke="rgba(22,27,24,0.3)" strokeWidth={0.9} strokeDasharray="1.4 2.1" />
      {monogram && (
        <text
          x="24" y="24.5"
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'Cormorant Garamond', 'EB Garamond', Georgia, serif"
          fontStyle="italic" fontWeight={600} fontSize="15.5"
          fill="#FAF8F4" opacity={0.94}
        >
          {monogram}
        </text>
      )}
    </>
  )
}

export default function WaxSeal({
  color,
  monogram,
  size = 46,
  breaking = false,
  className,
}: {
  color: string
  monogram?: string
  size?: number
  breaking?: boolean
  className?: string
}) {
  const halfStyle = { transformBox: 'fill-box', transformOrigin: '50% 50%' } as const
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={clsx('shrink-0 overflow-visible', className)}
      aria-hidden
    >
      {breaking ? (
        <>
          <g className="animate-crack-left" style={{ ...halfStyle, clipPath: CLIP_LEFT }}>
            <SealBody color={color} monogram={monogram} />
          </g>
          <g className="animate-crack-right" style={{ ...halfStyle, clipPath: CLIP_RIGHT }}>
            <SealBody color={color} monogram={monogram} />
          </g>
        </>
      ) : (
        <SealBody color={color} monogram={monogram} />
      )}
    </svg>
  )
}
