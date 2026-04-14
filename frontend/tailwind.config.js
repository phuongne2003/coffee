/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: '#1a0f0a',
          50: '#f5ede0',
          100: '#e8d5b7',
          200: '#d4b896',
          300: '#b8956a',
          400: '#8b6340',
          500: '#5c3d20',
          600: '#3d2410',
          700: '#2b1608',
          800: '#1a0f0a',
          900: '#0d0705',
        },
        cream: {
          DEFAULT: '#f5ede0',
          50: '#fdf9f5',
          100: '#f9f0e4',
          200: '#f5ede0',
          300: '#ead9c4',
          400: '#d9c0a3',
          500: '#c4a07c',
        },
        terracotta: {
          DEFAULT: '#c4622d',
          50: '#fdf2ec',
          100: '#f9dfd0',
          200: '#f0b898',
          300: '#e48f61',
          400: '#d4703c',
          500: '#c4622d',
          600: '#a44f22',
          700: '#833c18',
          800: '#622c10',
          900: '#411d09',
        },
        gold: {
          DEFAULT: '#d4a853',
          50: '#fdf8ec',
          100: '#f8eccf',
          200: '#f0d49e',
          300: '#e4ba6a',
          400: '#d4a853',
          500: '#bf8e35',
          600: '#9a7028',
          700: '#75521c',
          800: '#503712',
          900: '#2b1d09',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-8px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
