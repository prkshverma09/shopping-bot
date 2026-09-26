/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b0c',
        paper: '#fafaf8',
        buy: '#16a34a',
        refuse: '#dc2626',
        counter: '#d97706',
        ask: '#2563eb',
      },
      fontSize: {
        'display': ['2.75rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
