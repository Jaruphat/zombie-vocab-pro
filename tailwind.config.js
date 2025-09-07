/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          primary: '#FF6B35',
          secondary: '#F7931E',
          accent: '#FFD23F',
          dark: '#2D3748',
          light: '#F7FAFC',
        }
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.5)' },
          'to': { boxShadow: '0 0 30px rgba(255, 107, 53, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}