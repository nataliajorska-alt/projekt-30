'use client'

/**
 * Rozeta Równowagi — ręczny radar SVG siedmiu filarów.
 * Pokazuje RÓWNOWAGĘ (kształt), nie rozkład (od tego jest legenda):
 * im bliżej regularnego siedmiokąta, tym równiej rozłożona energia.
 * Przerywany siedmiokąt to „ideał równego podziału" (1/7 na filar).
 * Promienie znormalizowane do największego udziału, więc kształt zawsze
 * wypełnia siatkę — czytelny też przy małym XP.
 */

const W = 280
const H = 264
const CX = W / 2
const CY = 136
const R = 92

export interface RosePillarDatum {
  id: string
  shortName: string
  color: string
  xp: number
}

function polygonPoints(radii: number[]): string {
  return radii
    .map((r, i) => {
      const a = (i / radii.length) * Math.PI * 2 - Math.PI / 2
      return `${(CX + Math.cos(a) * r).toFixed(2)},${(CY + Math.sin(a) * r).toFixed(2)}`
    })
    .join(' ')
}

export default function PillarRoseChart({ data }: { data: RosePillarDatum[] }) {
  const n = data.length
  const total = data.reduce((acc, d) => acc + d.xp, 0)
  const shares = data.map(d => (total > 0 ? d.xp / total : 0))
  // Największy udział jest zawsze ≥ 1/n, więc pierścień ideału mieści się w siatce.
  const maxShare = Math.max(...shares, 1e-9)
  const valueRadii = shares.map(s => (s / maxShare) * R)
  const idealR = total > 0 ? (1 / n / maxShare) * R : 0

  const axis = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return { cos: Math.cos(a), sin: Math.sin(a) }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[300px] mx-auto block overflow-visible"
      role="img"
      aria-label={
        total > 0
          ? `Rozeta równowagi: ${data.map(d => `${d.shortName} ${Math.round((d.xp / total) * 100)}%`).join(', ')}`
          : 'Rozeta równowagi — brak danych'
      }
    >
      {/* Siatka: 3 koncentryczne siedmiokąty + osie */}
      {[1 / 3, 2 / 3, 1].map((f, gi) => (
        <polygon
          key={gi}
          points={polygonPoints(Array(n).fill(R * f))}
          fill="none"
          stroke={gi === 2 ? '#D9CDA8' : '#E5DCC1'}
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const { cos, sin } = axis(i)
        return (
          <line
            key={d.id}
            x1={CX} y1={CY}
            x2={CX + cos * R} y2={CY + sin * R}
            stroke="#E5DCC1" strokeWidth={1} opacity={0.7}
          />
        )
      })}

      {total > 0 && (
        <>
          {/* Ideał równego podziału */}
          <polygon
            points={polygonPoints(Array(n).fill(idealR))}
            fill="none"
            stroke="#B29355"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.75}
          />
          {/* Kształt Twojej energii */}
          <polygon
            points={polygonPoints(valueRadii)}
            fill="#B29355"
            fillOpacity={0.1}
            stroke="#2C3B35"
            strokeWidth={1.5}
            strokeLinejoin="round"
            className="animate-fade-in"
          />
          {/* Wierzchołki wartości — romby w kolorze filaru */}
          {data.map((d, i) => {
            const { cos, sin } = axis(i)
            const x = CX + cos * valueRadii[i]
            const y = CY + sin * valueRadii[i]
            return (
              <rect
                key={d.id}
                x={-2.6} y={-2.6} width={5.2} height={5.2}
                transform={`translate(${x} ${y}) rotate(45)`}
                fill={d.color}
                stroke="#FAF8F4"
                strokeWidth={1}
              />
            )
          })}
        </>
      )}

      {/* Diamenty i etykiety osi */}
      {data.map((d, i) => {
        const { cos, sin } = axis(i)
        const dx = CX + cos * (R + 8)
        const dy = CY + sin * (R + 8)
        const lx = CX + cos * (R + 20)
        const ly = CY + sin * (R + 20)
        const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle'
        return (
          <g key={d.id}>
            <rect
              x={-2.2} y={-2.2} width={4.4} height={4.4}
              transform={`translate(${dx} ${dy}) rotate(45)`}
              fill={d.color}
            />
            <text
              x={lx} y={ly + (sin > 0.6 ? 6 : sin < -0.6 ? -2 : 3)}
              textAnchor={anchor}
              fontFamily="Inter, sans-serif"
              fontSize={9}
              letterSpacing="0.14em"
              fill={d.color}
              style={{ textTransform: 'uppercase' }}
            >
              {d.shortName}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
