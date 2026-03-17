/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        navy: {
          950: '#070d1a',
          900: '#0d1629',
          800: '#131f3c',
          700: '#1a2a52',
          600: '#243769',
        },
        coral: {
          400: '#ff7c5c',
          500: '#ff5f3d',
          600: '#e84d2c',
        },
        jade: {
          400: '#34d49a',
          500: '#1bbf84',
        },
        amber: {
          400: '#ffb547',
          500: '#f59e0b',
        },
        slate: {
          750: '#2a3650',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow-coral': '0 0 20px rgba(255, 95, 61, 0.25)',
        'glow-jade': '0 0 20px rgba(27, 191, 132, 0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
