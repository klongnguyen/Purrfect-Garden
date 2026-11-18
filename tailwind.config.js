/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cozy-cream': '#F4E8CF',
        'cozy-panel': '#E5D1AC',
        'cozy-border': '#6B4226',
        'cozy-wood-dark': '#3D2112',
        'cozy-wood-mid': '#8A522E',
        'cozy-sage': '#6AA355',
        'cozy-sage-dark': '#3F7334',
        'cozy-meadow': '#DCEDBD',
        'cozy-peach': '#D96D43',
        'cozy-amber': '#F0BE63',
        'cozy-wood': '#472817',
        'cozy-ink': '#24140B',
        'cozy-muted': '#6D513C'
      },
      fontFamily: {
        sans: ['"Cascadia Mono"', '"Consolas"', '"Courier New"', 'monospace'],
        mono: ['"Cascadia Mono"', '"Consolas"', '"Courier New"', 'monospace']
      },
      boxShadow: {
        cozy: '3px 3px 0px #2C170B',
        'pixel-sm': '2px 2px 0px #2C170B',
        'pixel-md': '4px 4px 0px #2C170B',
        'pixel-inset': 'inset 2px 2px 0px rgba(255, 248, 228, 0.7), inset -2px -2px 0px rgba(84, 46, 22, 0.25)'
      }
    }
  },
  plugins: []
};
