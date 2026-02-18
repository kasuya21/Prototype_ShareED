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
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#ddd0ff',
          300: '#c4a8ff',
          400: '#a876ff',
          500: '#845CC0',  // Main color
          600: '#7a4db8',
          700: '#6b3fa3',
          800: '#5a3586',
          900: '#4a2d6d',
        },
      },
    },
  },
  plugins: [],
}
