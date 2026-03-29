/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/client/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        factory: {
          bg: '#0f1117',
          panel: '#1a1f2e',
          border: '#2a3144',
          amber: '#f59e0b',
          red: '#ef4444',
          green: '#22c55e',
          blue: '#3b82f6',
          muted: '#6b7280',
          text: '#e2e8f0',
          subtext: '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
