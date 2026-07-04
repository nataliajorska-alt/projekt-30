import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Editorial design tokens (1:1 with handoff mockup) ──
        ivory: '#FAF8F4',
        cream: '#F4EFE3',         // design --paper  (was #F0EBE3)
        'cream-warm': '#EBE3CF',  // design --paper-warm
        parchment: '#E7DFD0',
        dark: '#1D231F',          // design --ink   (was #1A2420)
        'dark-deep': '#161B18',   // design --ink-deep (was #0F1714)
        forest: '#2C3B35',
        'forest-light': '#3D5247',
        'forest-deep': '#1E2A25',
        gold: '#B29355',          // design --gold   (was #B8963E — yellower)
        'gold-light': '#C9B27F',  // design --gold-soft (was #D4AF6B)
        'gold-dark': '#8B6914',
        'gold-deep': '#826933',   // a11y: ciemniejszy o tyle, by jako tekst dać AA 4.5:1 na ivory/cream (był #8E7338 = 4.25, fail dla zwykłego tekstu); wciąż czyta się jako złoto
        'gold-pale': '#F3E9C8',   // matches design level text color (was #F5EDD8)
        muted: '#796B4B',         // a11y: ciemniejszy taupe, by jako tekst dać AA 4.5:1 na ivory/cream (był #8A7A55 = 3.96, fail); ~98% użyć to tekst
        'muted-light': '#B7A787', // design --quiet   (was #9B8E84)
        hairline: '#D9CDA8',      // design --line   (was #C9BFB1 — gray)
        border: '#E5DCC1',        // design --line-soft (was #E2D9CE)
        wine: '#8A3A2C',          // design --rust   (was #5C2A2A — darker burgundy)
        rose: '#B56A6A',          // design --rose (Magnetism score color)
        sage: '#6B7D59',          // design --sage
      },
      fontFamily: {
        // ── Design system fonts (Bodoni Moda + Cormorant Garamond + Inter) ──
        // All three have full Polish glyph coverage — fixes ą/ę/ł/ó/ż rendering.
        serif: ['"Cormorant Garamond"', '"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', '"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bodoni Moda"', 'Didot', 'Italiana', 'Playfair Display', 'serif'],
        heading: ['"Bodoni Moda"', 'Gloock', 'Playfair Display', 'serif'],
        'serif-body': ['"Cormorant Garamond"', '"Crimson Pro"', 'Georgia', 'serif'],
        ui: ['Inter', '"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.22em',
        editorial: '0.32em',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'sparkle-float': 'sparkleFloat 1.8s ease-out forwards',
        'achievement-enter': 'achievementEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'icon-float': 'iconFloat 2.5s ease-in-out infinite',
        bloom: 'bloom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        draw: 'draw 1.2s ease-out forwards',
        'flip-in': 'flipIn 0.45s ease-out both',
        shuffle: 'shuffle 0.45s ease-in-out 2',
        'crack-left': 'crackLeft 0.55s ease-in forwards',
        'crack-right': 'crackRight 0.55s ease-in forwards',
        stamp: 'stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sparkleFloat: {
          '0%':   { opacity: '1', transform: 'translateY(0) scale(1)' },
          '60%':  { opacity: '0.7' },
          '100%': { opacity: '0', transform: 'translateY(-55px) scale(0.3)' },
        },
        achievementEnter: {
          '0%':   { opacity: '0', transform: 'scale(0.82) translateY(18px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        iconFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-7px)' },
        },
        // Rombowy checkbox „rozkwita" przy odhaczeniu — rotate(45deg) trzeba
        // powtórzyć w każdej klatce, bo animacja nadpisuje transform z klasy rotate-45.
        bloom: {
          '0%':   { transform: 'rotate(45deg) scale(0.4)' },
          '60%':  { transform: 'rotate(45deg) scale(1.25)' },
          '100%': { transform: 'rotate(45deg) scale(1)' },
        },
        // Kreślenie ścieżki SVG „stalówką" — wymaga pathLength={1} i strokeDasharray 1.
        draw: {
          '0%':   { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
        flipIn: {
          '0%':   { transform: 'perspective(700px) rotateY(88deg)', opacity: '0' },
          '100%': { transform: 'perspective(700px) rotateY(0deg)', opacity: '1' },
        },
        shuffle: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '30%':      { transform: 'translateX(-7px) rotate(-2.5deg)' },
          '70%':      { transform: 'translateX(7px) rotate(2.5deg)' },
        },
        // Pęknięcie pieczęci lakowej — połówki rozjeżdżają się i opadają.
        crackLeft: {
          '0%':   { transform: 'none', opacity: '1' },
          '100%': { transform: 'translate(-7px, 10px) rotate(-14deg)', opacity: '0' },
        },
        crackRight: {
          '0%':   { transform: 'none', opacity: '1' },
          '100%': { transform: 'translate(7px, 11px) rotate(13deg)', opacity: '0' },
        },
        // Przystawienie pieczęci — opada i osiada z lekkim dociskiem.
        stamp: {
          '0%':   { transform: 'scale(1.45)', opacity: '0' },
          '55%':  { transform: 'scale(0.94)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
