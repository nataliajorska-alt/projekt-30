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
        ivory: '#FAF8F4',
        cream: '#F0EBE3',
        parchment: '#E7DFD0',
        dark: '#1A2420',
        'dark-deep': '#0F1714',
        forest: '#2C3B35',
        'forest-light': '#3D5247',
        'forest-deep': '#1E2A25',
        gold: '#B8963E',
        'gold-light': '#D4AF6B',
        'gold-dark': '#8B6914',
        'gold-deep': '#8A6F2A',
        'gold-pale': '#F5EDD8',
        muted: '#6B5E52',
        'muted-light': '#9B8E84',
        hairline: '#C9BFB1',
        border: '#E2D9CE',
        wine: '#5C2A2A',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Italiana', 'Playfair Display', 'serif'],
        heading: ['Gloock', 'Playfair Display', 'serif'],
        'serif-body': ['"Crimson Pro"', 'Georgia', 'serif'],
        ui: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.22em',
        editorial: '0.32em',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #B8963E 0%, #D4AF6B 50%, #B8963E 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1A2420 0%, #2C3B35 100%)',
      },
      boxShadow: {
        'elegant': '0 2px 20px rgba(26, 36, 32, 0.08)',
        'elegant-lg': '0 8px 40px rgba(26, 36, 32, 0.12)',
        'gold': '0 2px 16px rgba(184, 150, 62, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
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
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 150, 62, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(184, 150, 62, 0)' },
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
