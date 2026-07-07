/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#f2faf5',
          100: '#e1f5e8',
          200: '#c5ebd3',
          300: '#98d8b1',
          400: '#64be86',
          500: '#3fa364',
          600: '#2e854e',
          700: '#266a40',
          800: '#215435',
          900: '#1b452d',
          950: '#0e2618',
        },
        security: {
          50: '#f6f6f6',
          100: '#e9e9e9',
          200: '#d2d2d2',
          300: '#aeaeae',
          400: '#808080',
          500: '#666666',
          600: '#4d4d4d',
          700: '#333333',
          800: '#1f1f1f',
          900: '#121212',
          950: '#0a0a0a',
        }
      }
    },
  },
  plugins: [],
}
