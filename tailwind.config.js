/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      keyframes: {
        'card-in': {
          '0%': { opacity: 0, transform: 'translateY(24px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-30px, 40px) scale(0.95)' },
        },
        'float-mid': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-30px, -40px) scale(1.06)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { transform: 'translate(-46%, -54%) scale(1.08)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'card-in': 'card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float-slow': 'float-slow 18s ease-in-out infinite',
        'float-mid': 'float-mid 14s ease-in-out infinite -6s',
        'float-fast': 'float-fast 10s ease-in-out infinite -12s',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
