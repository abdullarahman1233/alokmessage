import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette
        midnight: {
          50:  '#e8eaf6',
          100: '#c5c9e9',
          200: '#9fa5da',
          300: '#7981cb',
          400: '#5c66bf',
          500: '#3f51b5',
          600: '#394aae',
          700: '#3040a5',
          800: '#27379d',
          900: '#0a0e2e',
          950: '#05071a',
        },
        electric: {
          DEFAULT: '#00d4ff',
          dim:     '#0099bb',
          glow:    '#00eeff33',
        },
        aurora: {
          blue:   '#4fc3f7',
          violet: '#9c27b0',
          teal:   '#00bcd4',
          rose:   '#f06292',
        },
        glass: {
          white:  'rgba(255,255,255,0.07)',
          border: 'rgba(255,255,255,0.12)',
          hover:  'rgba(255,255,255,0.10)',
          dark:   'rgba(0,0,0,0.35)',
        },
        status: {
          online:  '#22c55e',
          away:    '#f59e0b',
          offline: '#6b7280',
          danger:  '#ef4444',
        }
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'mesh-1': 'radial-gradient(at 40% 20%, #0a0e2e 0px, transparent 50%), radial-gradient(at 80% 0%,   #1a237e 0px, transparent 50%), radial-gradient(at 0%   50%, #000428 0px, transparent 50%), radial-gradient(at 80% 50%, #004e92 0px, transparent 50%), radial-gradient(at 0%   100%, #05071a 0px, transparent 50%)',
        'mesh-chat': 'radial-gradient(ellipse at top left, rgba(0,212,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(156,39,176,0.06) 0%, transparent 50%)',
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        'btn-primary': 'linear-gradient(135deg, #00d4ff 0%, #0077be 100%)',
        'btn-danger':  'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        'verified':    'linear-gradient(135deg, #00d4ff 0%, #4fc3f7 100%)',
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-lg':   '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'electric':   '0 0 20px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.15)',
        'electric-sm':'0 0 10px rgba(0,212,255,0.3)',
        'message-out':'0 2px 12px rgba(0,212,255,0.2)',
        'message-in': '0 2px 12px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
        glass2: '40px',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'slide-up':     'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right':'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':      'fadeIn 0.5s ease',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'scan':         'scan 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.4)' },
          '50%':      { boxShadow: '0 0 40px rgba(0,212,255,0.8)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
export default config
