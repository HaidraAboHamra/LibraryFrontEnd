// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#6A36F1', // strong violet
          800: '#8452E6',
          700: '#A273DB',
          600: '#B38DE1',
          500: '#C5A8E8',
          300: '#D7C3EF',
          200: '#EADEF6',
          100: '#FBF9FD',
          dark: '#444466'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/line-clamp') 
  ]
}
