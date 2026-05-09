import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Moonshot brand — deep space dark theme
        space: {
          950: '#03020a',
          900: '#07051a',
          800: '#0d0a2e',
          700: '#141042',
          600: '#1d1760',
        },
        moon: {
          50:  '#fefdf4',
          100: '#fdf9e0',
          200: '#faf0b0',
          300: '#f5e06a',
          400: '#eecb2c',
          500: '#d4a90f',
          600: '#b38608',
          700: '#8a6208',
          800: '#6e4d10',
          900: '#5c4012',
        },
        nova: {
          50:  '#f0f1ff',
          100: '#e3e4ff',
          200: '#ccceff',
          300: '#a8abff',
          400: '#7e81fd',
          500: '#5a56f5',
          600: '#4a3de8',
          700: '#3e30d0',
          800: '#3328a8',
          900: '#2c2487',
        },
        aurora: {
          50:  '#ecfdf9',
          100: '#d1faf0',
          200: '#a8f4e2',
          300: '#6eeace',
          400: '#34d7b6',
          500: '#0fbf9e',
          600: '#069a82',
          700: '#087b6a',
          800: '#0a6156',
          900: '#0b5047',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'space-gradient': 'radial-gradient(ellipse at top, #0d0a2e 0%, #03020a 70%)',
        'nova-glow': 'radial-gradient(ellipse at center, rgba(90,86,245,0.15) 0%, transparent 70%)',
        'moon-glow': 'radial-gradient(ellipse at center, rgba(238,203,44,0.15) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'streak-flame': 'streakFlame 1s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(238,203,44,0.3), 0 0 20px rgba(238,203,44,0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(238,203,44,0.6), 0 0 40px rgba(238,203,44,0.2)' },
        },
        streakFlame: {
          '0%': { transform: 'scaleY(1)', filter: 'brightness(1)' },
          '100%': { transform: 'scaleY(1.1)', filter: 'brightness(1.3)' },
        },
      },
      boxShadow: {
        'nova': '0 0 20px rgba(90,86,245,0.3)',
        'moon': '0 0 20px rgba(238,203,44,0.3)',
        'aurora': '0 0 20px rgba(15,191,158,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow-sm': '0 0 8px rgba(238,203,44,0.4)',
        'glow-lg': '0 0 30px rgba(90,86,245,0.5)',
      },
    },
  },
  plugins: [],
}
export default config
