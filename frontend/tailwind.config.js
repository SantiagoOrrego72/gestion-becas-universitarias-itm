/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          '0%':   { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
