
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
    },
  },
  plugins: [],
}

