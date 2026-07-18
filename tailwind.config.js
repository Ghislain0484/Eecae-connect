/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // EECAE brand palette: bordeaux, beige, white, gold
        bordeaux: {
          50: '#fbf3f4',
          100: '#f7e6e8',
          200: '#efd0d4',
          300: '#e2abb2',
          400: '#cf7a85',
          500: '#b94a5a',
          600: '#9f2f43',
          700: '#7a1e30',
          800: '#5e1624',
          900: '#4a101d',
          950: '#2e0810',
        },
        gold: {
          50: '#fdfbf3',
          100: '#faf5e0',
          200: '#f4eab8',
          300: '#ecd982',
          400: '#e3c251',
          500: '#d4a82f',
          600: '#bd8a23',
          700: '#9b6620',
          800: '#7e4f21',
          900: '#6a4220',
          950: '#3d2310',
        },
        beige: {
          50: '#fdfbf7',
          100: '#f8f3e8',
          200: '#f0e6cf',
          300: '#e5d3ad',
          400: '#d9bd87',
          500: '#cea868',
        },
        ink: {
          50: '#f6f6f7',
          100: '#e2e3e6',
          200: '#c4c6cc',
          300: '#9da1ab',
          400: '#71778a',
          500: '#565d72',
          600: '#454b5e',
          700: '#3a3f4e',
          800: '#2d313d',
          900: '#20232c',
          950: '#14161c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-lg': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
        glow: '0 0 0 1px rgb(212 168 47 / 0.2), 0 8px 24px -8px rgb(122 30 48 / 0.25)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
