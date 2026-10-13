/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#FF7A21',
        subject: {
          math: '#FF7E36',
          science: '#FDB03C',
          history: '#FFE0B2',
          english: '#7986CB',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'print': 'print 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise': 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        print: {
          '0%': { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(-16px)' },
          '100%': { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
