import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        apple: {
          gray: {
            50: '#fafafa',
            100: '#f5f5f7',
            200: '#e8e8ed',
            300: '#d2d2d7',
            400: '#86868b',
            500: '#6e6e73',
            600: '#515154',
            700: '#1d1d1f',
            800: '#161618',
            900: '#0d0d0f',
          },
          blue: '#007aff',
          green: '#34c759',
          red: '#ff3b30',
          orange: '#ff9500',
          purple: '#af52de',
        },
        // Paleta Fintech Dark Professional
        fintech: {
          dark: {
            bg: '#0a0e1a',        // Azul muito escuro (background principal)
            surface: '#111827',    // Azul escuro (cards e superfícies)
            elevated: '#1f2937',   // Azul médio (elementos elevados)
            border: '#374151',     // Azul acinzentado (bordas)
            accent: '#3b82f6',     // Azul vibrante (acentos)
            success: '#10b981',    // Verde fintech (sucesso/positivo)
            warning: '#f59e0b',    // Âmbar (avisos)
            danger: '#ef4444',     // Vermelho (perigo/negativo)
            gold: '#fbbf24',       // Dourado (premium)
          },
          text: {
            primary: '#ffffff',    // Branco puro (texto principal)
            secondary: '#e5e7eb',  // Branco suave (texto secundário)
            muted: '#9ca3af',      // Cinza claro (texto auxiliar)
            accent: '#60a5fa',     // Azul claro (links/acentos)
          }
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'apple-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        'fintech-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'fintech-dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'fintech-dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        'fintech-glow': '0 0 20px rgba(59, 130, 246, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' },
          '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
