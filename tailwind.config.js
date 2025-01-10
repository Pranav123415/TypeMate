/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#1f1f1f',
          600: '#2a2a2a',
          500: '#3a3a3a',
          400: '#858585',
          300: '#a3a3a3',
          200: '#d4d4d4',
          100: '#f5f5f5',
        },
      },
    },
  },
  plugins: [],
};