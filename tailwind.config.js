/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          soft: 'rgb(var(--primary) / 0.12)',
          muted: 'rgb(var(--primary) / 0.25)',
        },
        neutral: {
          bg: '#0A0A0A',
          surface: '#141414',
          card: '#1A1A1A',
          elevated: '#222222',
          text: '#FFFFFF',
          muted: '#888888',
          border: '#2A2A2A',
        },
        subject: {
          math: '#FF7E36',
          science: '#FDB03C',
          history: '#FFE0B2',
          english: '#7986CB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'timer-hero': ['7rem', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '800' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 107, 71, 0.15)',
        'glow-lg': '0 0 40px rgba(255, 107, 71, 0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        'sidebar': '260px',
      },
    },
  },
  plugins: [],
}
