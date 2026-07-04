import type { GardenStageId } from '@/lib/gameLogic'

/**
 * Botaniczne ekslibrisy 12 etapów Ogrodu Transformacji — rytownicze winiety
 * SVG (cienka kreska, delikatny szraf) w miejsce emoji. Rysowane w viewBox
 * 0 0 64 64, wyłącznie currentColor: kolor nadaje wywołujący (accentColor
 * etapu), więc ta sama płyta działa jako pełny znak, zarys przyszłości
 * i druk w raporcie. `frame` dokłada ośmiokątną płytę ekslibrisu.
 */

// ── Wspólne drobiazgi ────────────────────────────────────────────

// Migdałowy listek rytowniczej kreski — baza w (0,0), czubek w (0,-6.2).
// Eksportowany: LevelVine (winorośl na /progress) rysuje ten sam liść,
// żeby cały język botaniczny wyglądał na jedną rękę rytownika.
export const LEAF_PATH = 'M0,0 C-2,-1.6 -2.3,-4.4 0,-6.2 C2.3,-4.4 2,-1.6 0,0 Z'

function Sparkle({ x, y, s = 4 }: { x: number; y: number; s?: number }) {
  const d = s * 0.62
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={-s} y1="0" x2={s} y2="0" strokeWidth="0.9" />
      <line x1="0" y1={-s} x2="0" y2={s} strokeWidth="0.9" />
      <line x1={-d} y1={-d} x2={d} y2={d} strokeWidth="0.6" opacity="0.6" />
      <line x1={d} y1={-d} x2={-d} y2={d} strokeWidth="0.6" opacity="0.6" />
    </g>
  )
}

// Lancetowaty listek z nerwem — baza w (0,0), czubek w (0,-len).
function Leaf({ x, y, angle, len = 10, w = 3.4 }: {
  x: number; y: number; angle: number; len?: number; w?: number
}) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle})`}>
      <path
        d={`M0,0 C${-w},${-len * 0.35} ${-w * 0.75},${-len * 0.8} 0,${-len} C${w * 0.75},${-len * 0.8} ${w},${-len * 0.35} 0,0 Z`}
        fill="currentColor" fillOpacity="0.07" strokeWidth="0.9"
      />
      <line x1="0" y1="-1.5" x2="0" y2={-len + 1.8} strokeWidth="0.5" opacity="0.5" />
    </g>
  )
}

// Pięciopłatkowy kwiat frontalny (dzika róża) — środek w (x,y).
function Blossom({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {[0, 72, 144, 216, 288].map(deg => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path
            d="M0,-3.2 C-3.8,-5.4 -4.6,-11 0,-13.2 C4.6,-11 3.8,-5.4 0,-3.2 Z"
            fill="currentColor" fillOpacity="0.07" strokeWidth="0.9"
          />
          <line x1="0" y1="-4.6" x2="0" y2="-11.6" strokeWidth="0.45" opacity="0.4" />
        </g>
      ))}
      <circle r="2.6" fill="none" strokeWidth="0.8" />
      <circle r="0.7" fill="currentColor" stroke="none" />
    </g>
  )
}

// ── 12 winiet ────────────────────────────────────────────────────

const SOIL_HATCH = [16, 24, 40, 48]

// Wieniec laurowy (natalia-30): liście parami na okręgu r=19.5 wokół
// (32,33.5), góra otwarta na gwiazdę, dół na skrzyżowane łodyżki.
const LAUREL_LEAVES = ([1, -1] as const).flatMap(side =>
  Array.from({ length: 8 }, (_, i) => {
    const deg = 12 + i * 19.5
    const th = (deg * Math.PI) / 180
    return {
      key: `${side}-${i}`,
      x: +(32 + side * Math.sin(th) * 19.5).toFixed(1),
      y: +(33.5 + Math.cos(th) * 19.5).toFixed(1),
      rot: +(side * (90 - deg) + side * 22).toFixed(1),
    }
  })
)

const VIGNETTES: Record<GardenStageId, React.ReactNode> = {
  // I. Ziarnko pod ziemią — słońce już czeka.
  seed: (
    <g>
      <circle cx="32" cy="15" r="4.6" strokeWidth="1" />
      {[-50, -25, 0, 25, 50].map(deg => {
        const a = ((deg - 90) * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={32 + Math.cos(a) * 6.6} y1={15 + Math.sin(a) * 6.6}
            x2={32 + Math.cos(a) * 9.4} y2={15 + Math.sin(a) * 9.4}
            strokeWidth="0.7" opacity="0.65"
          />
        )
      })}
      <line x1="10" y1="40" x2="54" y2="40" strokeWidth="0.9" />
      <path d="M18,40 q2,-3 4,0" strokeWidth="0.6" opacity="0.55" />
      <path d="M42,40 q2,-3 4,0" strokeWidth="0.6" opacity="0.55" />
      {SOIL_HATCH.map(x => (
        <line key={x} x1={x} y1="43.5" x2={x + 4.5} y2="48" strokeWidth="0.5" opacity="0.35" />
      ))}
      <ellipse cx="32" cy="49" rx="4.4" ry="6.4" transform="rotate(18 32 49)" strokeWidth="1.2" fill="currentColor" fillOpacity="0.07" />
      <path d="M31.4,43.6 Q34.2,48.6 31.6,54.2" strokeWidth="0.6" opacity="0.55" fill="none" />
      <path d="M33.6,55 Q34.4,57.6 32.6,59" strokeWidth="0.8" opacity="0.7" fill="none" />
    </g>
  ),

  // II. Kiełek — dwa liścienie przebiły grunt.
  sprout: (
    <g>
      <line x1="10" y1="44" x2="54" y2="44" strokeWidth="0.9" />
      <path d="M32,44 q-3.5,4.5 -7.5,5.5" strokeWidth="0.7" opacity="0.5" fill="none" />
      <path d="M32,44 q3.5,5 6.5,6.5" strokeWidth="0.7" opacity="0.5" fill="none" />
      <path d="M32,44 q0.5,5.5 -0.5,8" strokeWidth="0.7" opacity="0.5" fill="none" />
      <path d="M23,42.6 a3.2,2.2 0 0 1 5.4,-1.4" strokeWidth="0.7" opacity="0.5" fill="none" />
      <path d="M32,44 C31,38.5 33.2,33.5 32,27.5" strokeWidth="1.3" fill="none" />
      <path d="M32,27.5 C27,26.6 22.2,23 21,17.6 C26.4,18.8 30.8,22.6 32,27.5 Z" fill="currentColor" fillOpacity="0.07" strokeWidth="1" />
      <line x1="30.6" y1="26.2" x2="23.4" y2="19.6" strokeWidth="0.5" opacity="0.5" />
      <path d="M32,27.5 C37,26.6 41.8,23 43,17.6 C37.6,18.8 33.2,22.6 32,27.5 Z" fill="currentColor" fillOpacity="0.07" strokeWidth="1" />
      <line x1="33.4" y1="26.2" x2="40.6" y2="19.6" strokeWidth="0.5" opacity="0.5" />
    </g>
  ),

  // III. Łodyga — liście naprzemienne łapią słońce.
  stem: (
    <g>
      <line x1="14" y1="48" x2="50" y2="48" strokeWidth="0.8" />
      <path d="M32,48 C30.2,40 33.8,28 32,13.5" strokeWidth="1.3" fill="none" />
      <Leaf x={31.2} y={41} angle={62} len={12} w={3.8} />
      <Leaf x={32.6} y={34.5} angle={-60} len={11} w={3.5} />
      <Leaf x={31.4} y={28} angle={64} len={9.5} w={3} />
      <Leaf x={32.4} y={22} angle={-62} len={8.5} w={2.8} />
      <path d="M32,13.5 q-3,-1.6 -3.6,-4.6" strokeWidth="0.8" opacity="0.7" fill="none" />
      <path d="M32,13.5 q3,-1.6 3.6,-4.6" strokeWidth="0.8" opacity="0.7" fill="none" />
    </g>
  ),

  // IV. Roślina — kępa mocno ukorzeniona i osobna.
  plant: (
    <g>
      <line x1="10" y1="46" x2="54" y2="46" strokeWidth="0.9" />
      <path d="M32,46 q-5,4.5 -10.5,5.5 M27,49 q-1,3.5 -3.5,5.5" strokeWidth="0.7" opacity="0.55" fill="none" />
      <path d="M32,46 q4.5,5 9.5,6 M36,49.5 q0.5,4 -1,6.5" strokeWidth="0.7" opacity="0.55" fill="none" />
      <path d="M32,46 q0.5,6 -1,9.5" strokeWidth="0.7" opacity="0.55" fill="none" />
      <path d="M32,46 C31,37 33,28.5 32,20.5" strokeWidth="1.15" fill="none" />
      <path d="M32,46 C26.5,40.5 22.5,33 20.5,25" strokeWidth="1.05" fill="none" />
      <path d="M32,46 C37.5,40.5 41.5,34 43.5,27" strokeWidth="1.05" fill="none" />
      <Leaf x={31.4} y={37} angle={62} len={10} w={3.2} />
      <Leaf x={32.6} y={29.5} angle={-60} len={9} w={2.9} />
      <Leaf x={24.5} y={33.5} angle={95} len={9} w={2.9} />
      <Leaf x={39.5} y={34.5} angle={-95} len={9} w={2.9} />
      <path d="M32,20.5 q-2.8,-1.5 -3.4,-4.4 M32,20.5 q2.8,-1.5 3.4,-4.4" strokeWidth="0.75" opacity="0.7" fill="none" />
      <path d="M20.5,25 q-2.6,-0.8 -4.2,-3 M43.5,27 q2.6,-0.8 4.2,-3" strokeWidth="0.75" opacity="0.7" fill="none" />
    </g>
  ),

  // V. Pąk — zamknięty, tuż przed.
  bud: (
    <g>
      <path d="M32,54 C30,45 33.5,36 32,27" strokeWidth="1.3" fill="none" />
      <path d="M32,26.5 C26.6,22.4 26.8,13.6 32,9.6 C37.2,13.6 37.4,22.4 32,26.5 Z" fill="currentColor" fillOpacity="0.08" strokeWidth="1.2" />
      <path d="M32,25.2 C30,20.4 30.4,14.8 32,11" strokeWidth="0.6" opacity="0.5" fill="none" />
      <path d="M32,25.2 C34,20.4 33.6,14.8 32,11.4" strokeWidth="0.6" opacity="0.5" fill="none" />
      <path d="M32,27 C28.8,25.8 27.2,22.6 26.8,19.4" strokeWidth="0.85" opacity="0.8" fill="none" />
      <path d="M32,27 C35.2,25.8 36.8,22.6 37.2,19.4" strokeWidth="0.85" opacity="0.8" fill="none" />
      <path d="M32,27 q-4.6,1.6 -6.6,4.6" strokeWidth="0.85" opacity="0.7" fill="none" />
      <path d="M32,27 q4.6,1.6 6.6,4.6" strokeWidth="0.85" opacity="0.7" fill="none" />
      <Leaf x={31.3} y={44} angle={64} len={11} w={3.5} />
      <Leaf x={32.7} y={37} angle={-62} len={9.5} w={3} />
    </g>
  ),

  // VI. Pierwszy kwiat — otworzył się i było warto.
  'first-bloom': (
    <g>
      <path d="M32,54 C31,48.5 32.4,43.5 32,38.6" strokeWidth="1.2" fill="none" />
      <Leaf x={32.4} y={47.5} angle={-64} len={10} w={3.2} />
      <Leaf x={31.6} y={51} angle={68} len={8.5} w={2.8} />
      <Blossom x={32} y={25.5} scale={1.55} />
    </g>
  ),

  // VII. Pełnia — dwa rzędy płatków na całą płytę.
  'full-bloom': (
    <g transform="translate(32,31.5)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path
            d="M0,-5 C-5.4,-7.8 -6.4,-16.4 0,-20 C6.4,-16.4 5.4,-7.8 0,-5 Z"
            fill="currentColor" fillOpacity="0.06" strokeWidth="1"
          />
          <line x1="0" y1="-6.8" x2="0" y2="-17.6" strokeWidth="0.45" opacity="0.35" />
        </g>
      ))}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => (
        <path
          key={deg}
          transform={`rotate(${deg})`}
          d="M0,-3.8 C-3,-5.6 -3.6,-10.4 0,-12.4 C3.6,-10.4 3,-5.6 0,-3.8 Z"
          fill="currentColor" fillOpacity="0.09" strokeWidth="0.85"
        />
      ))}
      <circle r="3" fill="none" strokeWidth="0.85" />
      {[30, 100, 170, 240, 310].map(deg => {
        const a = (deg * Math.PI) / 180
        return <circle key={deg} cx={Math.cos(a) * 1.7} cy={Math.sin(a) * 1.7} r="0.55" fill="currentColor" stroke="none" />
      })}
      <path d="M0,20.5 q-4,2.6 -8,2.6 M0,20.5 q4,2.6 8,2.6" strokeWidth="0.8" opacity="0.6" fill="none" />
    </g>
  ),

  // VIII. Róża — sztych z profilu, kolce i wszystko. Zwinięcie płatków
  // celowo asymetryczne (spirala, nie koncentryczne łuki) — symetryczny
  // środek + łuk nad nim czytał się jak twarz z aureolą.
  rose: (
    <g>
      <path
        d="M24,21 C23.5,26.5 27.5,30 32,30 C36.5,30 40.5,26.5 40,21 C39.6,15.8 36,13 32,13 C28,13 24.4,15.8 24,21 Z"
        strokeWidth="1.2" fill="currentColor" fillOpacity="0.06"
      />
      <path d="M25.8,17.2 C29,13.6 35.4,13.8 38.2,17.8" strokeWidth="0.85" opacity="0.8" fill="none" />
      <path d="M38.2,17.8 C39.6,21.2 38,25.2 34,26.4" strokeWidth="0.8" opacity="0.75" fill="none" />
      <path d="M26.2,18 C25.2,21.8 27,25.6 30.6,26.8" strokeWidth="0.8" opacity="0.75" fill="none" />
      <path d="M28.8,19.4 C30.6,16.8 34.6,17.2 35.6,20 C36.2,22.4 33.8,24.2 31.6,23.4 C30,22.8 29.4,21.2 30.2,20" strokeWidth="0.75" opacity="0.85" fill="none" />
      <path d="M24,21 C21.6,23 20.6,26.2 21.6,29.2 C23.4,27.8 24.6,25.4 25,23.4" strokeWidth="0.9" opacity="0.8" fill="none" />
      <path d="M40,21 C42.4,23 43.4,26.2 42.4,29.2 C40.6,27.8 39.4,25.4 39,23.4" strokeWidth="0.9" opacity="0.8" fill="none" />
      <path d="M32,30 C28.4,32.6 26.4,35.6 25.8,38.6" strokeWidth="0.75" opacity="0.7" fill="none" />
      <path d="M32,30 C35.6,32.6 37.6,35.6 38.2,38.6" strokeWidth="0.75" opacity="0.7" fill="none" />
      <path d="M32,30 q-0.4,3.4 -0.6,5.2" strokeWidth="0.75" opacity="0.7" fill="none" />
      <path d="M32,30 C31,38 33.2,45 32,54" strokeWidth="1.3" fill="none" />
      <path d="M31.6,39.5 L28.6,38.4 L31.1,41.2 Z" fill="currentColor" fillOpacity="0.35" strokeWidth="0.7" />
      <path d="M32.5,46 L35.5,45 L33,47.8 Z" fill="currentColor" fillOpacity="0.35" strokeWidth="0.7" />
      <Leaf x={31.6} y={50.5} angle={70} len={9.5} w={3} />
    </g>
  ),

  // IX. Bukiet — trzy kwiaty i kokarda: piękno własnej roboty.
  bouquet: (
    <g>
      <path d="M24,19.5 C27,29 30.4,37 33.8,51.5" strokeWidth="1.05" fill="none" />
      <path d="M40,17.5 C37,28 33.6,37 30.2,51.5" strokeWidth="1.05" fill="none" />
      <path d="M32,15.5 C32,27 32,38 32,51.5" strokeWidth="1.05" fill="none" />
      <Blossom x={23} y={14.5} scale={0.72} />
      <path d="M32,15.5 C28.8,13 28.9,7.6 32,5.2 C35.1,7.6 35.2,13 32,15.5 Z" fill="currentColor" fillOpacity="0.08" strokeWidth="0.95" />
      {/* gałązka listna zamiast dzwonka — dzwonek czytał się jak balonik */}
      <path d="M40,17.5 C41.4,14.6 42.4,11.6 42.6,8.6" strokeWidth="0.85" opacity="0.85" fill="none" />
      <Leaf x={41.2} y={14.6} angle={118} len={5.5} w={2} />
      <Leaf x={42} y={11.6} angle={62} len={5.5} w={2} />
      <Leaf x={42.5} y={9.6} angle={130} len={5} w={1.9} />
      <circle cx="42.7" cy="7.2" r="1" fill="currentColor" fillOpacity="0.25" strokeWidth="0.7" />
      <path d="M27.5,24 q-3.4,-1 -5.4,-3.4" strokeWidth="0.6" opacity="0.55" fill="none" />
      <circle cx="21.6" cy="20.2" r="0.8" fill="currentColor" stroke="none" opacity="0.55" />
      <path d="M36.8,26 q3.4,-0.6 5.6,-2.6" strokeWidth="0.6" opacity="0.55" fill="none" />
      <circle cx="42.9" cy="23" r="0.8" fill="currentColor" stroke="none" opacity="0.55" />
      <path d="M32,43.5 C26.4,39.8 22.2,41.6 24.4,45.6 C26.2,48.9 30.4,46.6 32,43.5 Z" fill="currentColor" fillOpacity="0.07" strokeWidth="0.95" />
      <path d="M32,43.5 C37.6,39.8 41.8,41.6 39.6,45.6 C37.8,48.9 33.6,46.6 32,43.5 Z" fill="currentColor" fillOpacity="0.07" strokeWidth="0.95" />
      <circle cx="32" cy="43.7" r="1.7" fill="currentColor" fillOpacity="0.15" strokeWidth="0.9" />
      <path d="M31.4,45.3 C29.6,49.5 28.6,53 26.2,56.2 M26.2,56.2 l2.8,-1.2" strokeWidth="0.85" opacity="0.8" fill="none" />
      <path d="M32.6,45.3 C34.4,49.5 35.6,53.6 38.2,56.6 M38.2,56.6 l-2.9,-1" strokeWidth="0.85" opacity="0.8" fill="none" />
    </g>
  ),

  // X. Drzewo — zakorzenione, widoczne z daleka.
  tree: (
    <g>
      <line x1="12" y1="52" x2="52" y2="52" strokeWidth="0.9" />
      <path d="M18,52 q2,-2.6 4,0 M42,52 q2,-2.6 4,0" strokeWidth="0.55" opacity="0.5" fill="none" />
      <path d="M28.6,52 C29.6,44.5 27.8,38 27.2,32.5" strokeWidth="1.2" fill="none" />
      <path d="M35.4,52 C34.4,44.5 36.2,38 36.8,32.5" strokeWidth="1.2" fill="none" />
      <path d="M28.6,52 q-4,1.2 -7,3.2 M35.4,52 q4,1.2 7,3.2" strokeWidth="0.75" opacity="0.65" fill="none" />
      <path d="M31,40 q0.4,4 0,7 M33.2,38 q-0.3,3.4 0,6" strokeWidth="0.45" opacity="0.4" fill="none" />
      <path
        d="M27.2,32.5 C18.4,32.8 13.2,26.4 17.6,19.8 C15.4,12.4 24.4,7 32,9.6 C39.6,4.4 50.2,10.4 47.4,18.4 C52.4,24.4 46.6,32.8 36.8,32.5 C33.6,34.2 30.4,34.2 27.2,32.5 Z"
        fill="currentColor" fillOpacity="0.06" strokeWidth="1.2"
      />
      {/* kłęby korony przy krawędzi + owoce rozrzucone asymetrycznie —
          dwa symetryczne detale na jednej wysokości robiły twarz */}
      <path d="M19.4,26 q3,-1.6 4.4,-4.4 M43.6,14.6 q-3.2,0.2 -5.6,2.4" strokeWidth="0.5" opacity="0.4" fill="none" />
      <circle cx="22.6" cy="15.8" r="1" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="36.4" cy="11.8" r="1" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="43" cy="24.8" r="1" fill="currentColor" stroke="none" opacity="0.5" />
    </g>
  ),

  // XI. Ogród Eden — brama w pnączach, po drugiej stronie się skrzy.
  eden: (
    <g>
      <path d="M18,54 V26 C18,12.5 46,12.5 46,26 V54" strokeWidth="1.15" fill="none" />
      <path d="M21.2,54 V26.8 C21.2,15.4 42.8,15.4 42.8,26.8 V54" strokeWidth="0.55" opacity="0.55" fill="none" />
      <path d="M18,33 l3.2,3.4 M21.2,33 L18,36.4" strokeWidth="0.5" opacity="0.5" fill="none" />
      <path d="M42.8,42 l3.2,3.4 M46,42 l-3.2,3.4" strokeWidth="0.5" opacity="0.5" fill="none" />
      <path d="M16.6,38 C14.4,31 15.2,22.8 20.8,17.4" strokeWidth="0.8" opacity="0.8" fill="none" />
      <path d="M25,12.2 C31,9.4 38.4,10.2 43.6,14.6" strokeWidth="0.8" opacity="0.8" fill="none" />
      <Leaf x={16.2} y={31} angle={118} len={6} w={2.2} />
      <Leaf x={17.6} y={23.5} angle={140} len={6} w={2.2} />
      <Leaf x={28} y={11} angle={-155} len={6} w={2.2} />
      <Leaf x={36} y={10.4} angle={155} len={6} w={2.2} />
      <Blossom x={22.4} y={16.8} scale={0.42} />
      <Blossom x={44} y={16.2} scale={0.42} />
      <Blossom x={47.2} y={35} scale={0.42} />
      <path d="M26,54 L28.8,45 M38,54 L35.2,45" strokeWidth="0.6" opacity="0.5" fill="none" />
      <Sparkle x={32} y={35} s={4.6} />
      <Sparkle x={26.5} y={43.5} s={2.4} />
      <Sparkle x={37.5} y={29} s={2.4} />
    </g>
  ),

  // XII. Natalia 30 — monogram w laurach. To jesteś Ty.
  'natalia-30': (
    <g>
      {LAUREL_LEAVES.map(l => (
        <g key={l.key} transform={`translate(${l.x},${l.y}) rotate(${l.rot})`}>
          <path d={LEAF_PATH} fill="currentColor" fillOpacity="0.08" strokeWidth="0.8" />
        </g>
      ))}
      <path d="M32,53 C28.6,54.6 25.4,54.8 23.2,54 M32,53 C35.4,54.6 38.6,54.8 40.8,54" strokeWidth="0.9" opacity="0.8" fill="none" />
      <text
        x="32" y="34.5"
        textAnchor="middle" dominantBaseline="central"
        fontFamily='"Bodoni Moda", Didot, "Playfair Display", serif'
        fontSize="17.5" fill="currentColor" stroke="none"
      >
        N
      </text>
      <text
        x="32" y="45"
        textAnchor="middle" dominantBaseline="central"
        fontFamily='"Bodoni Moda", Didot, "Playfair Display", serif'
        fontSize="5.4" letterSpacing="1.6" fill="currentColor" stroke="none" opacity="0.75"
      >
        XXX
      </text>
      <Sparkle x={32} y={9.5} s={3.6} />
    </g>
  ),
}

// ── Płyta ekslibrisu (ośmiokątna, podwójna linia) ────────────────

function Plate() {
  return (
    <g>
      <path d="M14,2.5 H50 L61.5,14 V50 L50,61.5 H14 L2.5,50 V14 Z" strokeWidth="1.1" fill="none" />
      <path d="M15,5.5 H49 L58.5,15 V49 L49,58.5 H15 L5.5,49 V15 Z" strokeWidth="0.55" opacity="0.55" fill="none" />
      {[[8.2, 8.2], [55.8, 8.2], [55.8, 55.8], [8.2, 55.8]].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x},${y - 1.6} L${x + 1.6},${y} L${x},${y + 1.6} L${x - 1.6},${y} Z`}
          fill="currentColor" fillOpacity="0.5" stroke="none"
        />
      ))}
    </g>
  )
}

export default function StageExLibris({
  id,
  size = 48,
  frame = true,
  className,
}: {
  id: GardenStageId
  size?: number
  frame?: boolean
  className?: string
}) {
  const vignette = VIGNETTES[id]
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {frame && <Plate />}
      {vignette}
    </svg>
  )
}
