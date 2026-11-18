/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cozy-cream': '#FAF6EE',
        'cozy-panel': '#F3EDE0',
        'cozy-border': '#DFD3C3',
        'cozy-sage': '#7BAE7F',
        'cozy-sage-dark': '#5A8F5E',
        'cozy-meadow': '#E9F5DB',
        'cozy-peach': '#E07A5F',
        'cozy-amber': '#F2CC8F',
        'cozy-wood': '#5C4033',
        'cozy-ink': '#2D2A26',
        'cozy-muted': '#6E655F'
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Nunito"', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Mono"', '"Consolas"', 'monospace']
      },
      boxShadow: {
        cozy: '0 4px 16px rgba(92, 64, 51, 0.08)',
        'pixel-sm': '2px 2px 0px #DFD3C3',
        'pixel-md': '3px 3px 0px #DFD3C3'
      }
    }
  },
  plugins: []
};

