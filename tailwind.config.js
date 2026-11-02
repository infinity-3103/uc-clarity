/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        devanagari: ['"Noto Sans Devanagari"', 'sans-serif'],
        kannada: ['"Noto Sans Kannada"', 'sans-serif'],
      },
      colors: {
        uc: {
          dark: '#111827',
          purple: '#6B46C1',
          gold: '#F59E0B',
          gray: '#F3F4F6',
          border: '#E5E7EB',
        }
      }
    },
  },
  plugins: [],
}
