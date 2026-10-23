/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B2545',
        navy: { DEFAULT: '#13315C', 600: '#1D4A7A', 400: '#2C5E92' },
        teal: { DEFAULT: '#0E7C7B', 700: '#0A6463', 500: '#13A09C' },
        aqua: { DEFAULT: '#5BC0BE', 300: '#97D7D4', 100: '#CDEDEB', 50: '#E8F6F5' },
        mist: { DEFAULT: '#F3F8F9', 200: '#E1EEF0', 300: '#D3E5E8' },
        line: '#C9DCE1',
        slate: { DEFAULT: '#4A6270', 400: '#6F8794' },
        signal: '#F2B134',
        coral: '#E07A5F',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,37,69,0.06), 0 8px 24px -12px rgba(11,37,69,0.18)',
        lift: '0 2px 4px rgba(11,37,69,0.06), 0 18px 40px -18px rgba(11,37,69,0.35)',
      },
      maxWidth: { content: '76rem' },
    },
  },
  plugins: [],
};
