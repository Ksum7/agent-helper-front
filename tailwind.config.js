/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#ffffff',
          subtle: '#f7f7f8',
          muted: '#ececf1',
        },
        sidebar: {
          DEFAULT: '#171717',
          hover: '#262626',
          active: '#2d2d2d',
        },
        border: {
          DEFAULT: '#e5e7eb',
          subtle: '#f0f0f0',
        },
        text: {
          DEFAULT: '#1f2328',
          muted: '#6b7280',
          subtle: '#9ca3af',
        },
        accent: {
          DEFAULT: '#10a37f',
          hover: '#0d8a6c',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
