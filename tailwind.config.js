module.exports = {
  /** @type {import('tailwindcss').Config} */
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '400px',
      },
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0078ff',
          dark: '#0057b8',
        },
        secondary: {
          light: '#f8f9fa',
          DEFAULT: '#e9ecef',
          dark: '#dee2e6',
        },
        'bg-main': '#0a0b1e',
        'bg-card': '#0d1030',
        'border-card': '#1e2a4a',
        'bg-card-hover': '#0f1535',
        'bg-icon': '#1a2a4a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
        numeric: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'float-bonus': 'floatBonus 3s ease-in-out infinite',
        'shimmer-bonus': 'shimmerBonus 2.5s linear infinite',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'icon-bounce': 'iconBounce 1.5s ease-in-out infinite',
        'text-shimmer': 'textShimmer 3s linear infinite',
      },
      keyframes: {
        floatBonus: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmerBonus: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        iconBounce: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-3px) rotate(-5deg)' },
          '75%': { transform: 'translateY(2px) rotate(3deg)' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
};
