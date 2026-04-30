/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leica: {
          black: '#121212',
          red: '#e3000f',
          darkgray: '#1e1e1e',
          gray: '#2c2c2c',
          lightgray: '#a0a0a0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
