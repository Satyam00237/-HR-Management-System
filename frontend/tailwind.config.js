/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        // Redesigned slate shades for primary/secondary background and glassmorphism card bodies
        slate: {
          950: '#0F172A', // Primary Background
          900: '#111827', // Secondary Background
          850: '#1E293B', // Card Border / Glass Edge
          800: '#1E293B', // Card Background
          700: '#334155', // Muted Border
          600: '#475569',
          500: '#64748B', // Muted Text
          400: '#94A3B8',
          300: '#CBD5E1', // Secondary Text
          200: '#E2E8F0',
          100: '#F8FAFC', // Primary Text
        },
        // Indigo maps to Cyan for primary accents
        indigo: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE', // Light Cyan
          450: '#06B6D4',
          500: '#06B6D4', // Cyan
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },
        // Violet maps to Blue for secondary accents
        violet: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Blue
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // Purple maps to Blue/Cyan mix for solid fallbacks
        purple: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        }
      }
    },
  },
  plugins: [],
}
