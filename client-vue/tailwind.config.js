/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#2e4bb2',
        'brand-light-blue': '#3d5bc4',
        'brand-gray': '#f4f7f6',
        'brand-dark': '#1e293b'
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
