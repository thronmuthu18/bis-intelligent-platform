/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Design Tokens ────────────────────────────────────────────────────
      colors: {
        // Brand / Accent
        accent: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1a56db', // Primary accent — restrained professional blue
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e3163',
          900: '#172554',
        },
        // Surface / Background
        surface: {
          page:   '#F8F8F5', // Warm milky white — primary background
          card:   '#FFFFFF', // Clean white — card surfaces
          muted:  '#F3F4F6', // Subtle neutral — secondary surfaces
          border: '#E5E7EB', // Neutral border
          divider: '#D1D5DB',
        },
        // Typography
        text: {
          primary:   '#202124', // Dark charcoal — primary text
          secondary: '#4B5563', // Medium grey — secondary text
          muted:     '#9CA3AF', // Light grey — placeholders/captions
          inverse:   '#FFFFFF', // White — on dark backgrounds
          accent:    '#1a56db', // Accent blue — links
        },
        // Status colors — compliant, need-action, warning, error
        status: {
          success:  '#166534',
          successBg: '#dcfce7',
          warning:  '#92400e',
          warningBg: '#fef3c7',
          error:    '#991b1b',
          errorBg:  '#fee2e2',
          info:     '#1e40af',
          infoBg:   '#dbeafe',
        },
      },

      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace',
        ],
      },

      fontSize: {
        'display-lg': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display':    ['2rem',   { lineHeight: '1.25', fontWeight: '700' }],
        'heading-1':  ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-2':  ['1.25rem',{ lineHeight: '1.35', fontWeight: '600' }],
        'heading-3':  ['1.125rem',{ lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':    ['1rem',   { lineHeight: '1.6' }],
        'body':       ['0.875rem',{ lineHeight: '1.5' }],
        'body-sm':    ['0.8125rem',{ lineHeight: '1.5' }],
        'caption':    ['0.75rem',{ lineHeight: '1.4' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },

      borderRadius: {
        'sm':  '0.25rem',
        'md':  '0.375rem',
        'lg':  '0.5rem',
        'xl':  '0.75rem',
        '2xl': '1rem',
      },

      boxShadow: {
        'card':   '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'modal':    '0 20px 60px rgba(0, 0, 0, 0.15)',
        'inset-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
      },

      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
