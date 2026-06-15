/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: '#1a1a2e',
          secondary: '#16213e',
          panel: '#0f1624',
        },
        gold: {
          DEFAULT: '#d4a574',
          light: '#e8c9a0',
          dark: '#b8864e',
        },
        rose: {
          DEFAULT: '#b76e79',
        },
        ivory: {
          DEFAULT: '#f5f0e8',
          muted: '#a09888',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Noto Sans SC', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
