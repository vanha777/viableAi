module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './mobileComponents/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        green: '#14F195',
        grey: '#0C0E12',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui')],
  daisyui: {
    themes: [
      "light",
      {
        metaloot: {
          "primary": "#FF6B6B",
          "secondary": "#4ECDC4",
          "accent": "#45B7D1",
          "neutral": "#1a1a1a",
          "base-100": "#0F1115",
          "base-200": "#16181D",
          "base-300": "#202227",
        },
      },
    ],
  },
} 