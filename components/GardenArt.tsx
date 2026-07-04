'use client'

/**
 * Botaniczna ilustracja Ogrodu Transformacji — parametryczna roślina rosnąca
 * z levelStage 0..10 (Math.floor((level - 1) / 3)). Wyekstrahowana z
 * app/progress/page.tsx, żeby mogła żyć też w mini-widżecie na „Dziś".
 * viewBox: pełna scena to '0 0 160 160'; mini-widżet podaje ciaśniejszy kadr.
 */
export default function GardenArt({
  levelStage,
  viewBox = '0 0 160 160',
  className = 'w-full h-full',
}: {
  levelStage: number
  viewBox?: string
  className?: string
}) {
  const s = Math.min(levelStage, 10)
  const stemH = 20 + s * 9
  const stemY = 130 - stemH
  const showLeaves = s >= 2
  const showBud    = s >= 4
  const showPetals = s >= 6
  const showSecond = s >= 8
  const isEden     = s >= 10

  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      <ellipse cx="80" cy="135" rx="50" ry="6" fill="#2A1A0A" opacity="0.12" />
      {s >= 1 && (
        <>
          <path d={`M80,130 Q70,140 60,138`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
          <path d={`M80,130 Q90,142 100,139`} stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.35" />
        </>
      )}
      {s === 0 && <ellipse cx="80" cy="128" rx="8" ry="5" fill="#8B6914" opacity="0.6" />}
      {s >= 1 && (
        <path
          d={`M80,130 Q77,${stemY + stemH * 0.5} 80,${stemY}`}
          stroke="#3d6b2b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {showLeaves && (
        <>
          <path d={`M79,${stemY + stemH * 0.65} Q60,${stemY + stemH * 0.45} 65,${stemY + stemH * 0.3}`} fill="#4a8a35" opacity="0.75" />
          <path d={`M81,${stemY + stemH * 0.50} Q100,${stemY + stemH * 0.30} 95,${stemY + stemH * 0.15}`} fill="#4a8a35" opacity="0.65" />
        </>
      )}
      {s >= 5 && (
        <path d={`M79,${stemY + stemH * 0.80} Q58,${stemY + stemH * 0.70} 62,${stemY + stemH * 0.55}`} fill="#3d7a2a" opacity="0.55" />
      )}
      {showBud && !showPetals && <ellipse cx="80" cy={stemY} rx="6" ry="9" fill="#d4698c" opacity="0.8" />}
      {showPetals && (
        <g transform={`translate(80, ${stemY})`}>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <ellipse
              key={i}
              cx={Math.cos((deg * Math.PI) / 180) * 10}
              cy={Math.sin((deg * Math.PI) / 180) * 10}
              rx="5"
              ry="8"
              fill={s >= 9 ? '#D4AF6B' : '#e8a0b8'}
              opacity="0.85"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="5" fill={s >= 9 ? '#B8963E' : '#d4698c'} />
        </g>
      )}
      {showSecond && (
        <>
          <path d={`M80,${stemY + 5} Q65,${stemY - 20} 55,${stemY - 25}`} stroke="#3d6b2b" strokeWidth="2" fill="none" />
          <g transform={`translate(55, ${stemY - 25})`}>
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <ellipse
                key={i}
                cx={Math.cos((deg * Math.PI) / 180) * 7}
                cy={Math.sin((deg * Math.PI) / 180) * 7}
                rx="4"
                ry="6"
                fill="#c0a0d8"
                opacity="0.75"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="3.5" fill="#9b6bb5" />
          </g>
        </>
      )}
      {isEden && (
        <>
          {[[35, 30], [125, 25], [110, 70], [30, 75], [80, 15]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#D4AF6B" strokeWidth="1.5" opacity="0.7" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#D4AF6B" strokeWidth="1.5" opacity="0.7" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#D4AF6B" strokeWidth="1" opacity="0.5" />
              <line x1="3" y1="-3" x2="-3" y2="3" stroke="#D4AF6B" strokeWidth="1" opacity="0.5" />
            </g>
          ))}
        </>
      )}
    </svg>
  )
}
