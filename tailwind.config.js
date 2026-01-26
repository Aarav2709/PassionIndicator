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
          soft: 'rgb(var(--primary) / 0.15)',
        },
        secondary: '#7986CB',
        neutral: {
          bg: '#121212',       // Deep Dark Background
          surface: '#1E1E1E',  // Card Surface
          text: '#FFFFFF',     // Primary Text
          muted: '#A0A0A0',    // Secondary Text
          border: '#333333',   // Dark Borders
        },
        subject: {
          math: '#FF7E36',
          science: '#FDB03C',
          history: '#FFE0B2',
          english: '#7986CB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      gridTemplateColumns: {
        'dashboard': '240px 1fr 300px', // Sidebar | Main | Context
      }
    },
  },
  plugins: [],
}
