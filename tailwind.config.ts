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
      },
    },
  },
  plugins: [],
}
export default config
