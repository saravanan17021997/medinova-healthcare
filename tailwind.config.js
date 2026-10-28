/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Navy and teal identity. teal-500 is the brand accent (#0F8B8D) for icons, glows and
        // gradients; teal (DEFAULT) and teal-700 are deeper so text and white-on-teal buttons
        // keep at least 4.5:1 contrast.
        ink: '#102B4E',
        navy: { DEFAULT: '#163A66', 600: '#1F4C80', 400: '#2C5E92' },
        teal: { DEFAULT: '#0C7C7E', 700: '#0A6B6D', 800: '#085A5C', 500: '#0F8B8D', 400: '#2AA6A6' },
        aqua: { DEFAULT: '#63D1CE', 300: '#9ADFDC', 100: '#CFF0EE', 50: '#E9F8F7' },
        mist: { DEFAULT: '#F2FAFA', 200: '#E2F0F1', 300: '#D2E6E8' },
        line: '#C8DCE0',
        slate: { DEFAULT: '#42566D', 400: '#667B8F' },
        signal: '#F2B134',
        coral: '#E07A5F',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,43,78,0.05), 0 10px 28px -16px rgba(16,43,78,0.22)',
        lift: '0 2px 4px rgba(16,43,78,0.05), 0 20px 44px -20px rgba(16,43,78,0.36)',
        glass: '0 1px 1px rgba(16,43,78,0.04), 0 16px 40px -18px rgba(16,43,78,0.30)',
        glow: '0 10px 28px -10px rgba(15,139,141,0.55)',
      },
      maxWidth: { content: '76rem' },
    },
  },
  plugins: [],
};
