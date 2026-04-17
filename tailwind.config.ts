import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Colores personalizados para el proyecto
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7ff',
          300: '#a4baff',
          400: '#8099ff',
          500: '#5d6dff',
          600: '#4649ff',
          700: '#2e2aff',
          800: '#1e1ab8',
          900: '#131589',
        },
        // Estados de licitación
        status: {
          active: '#10b981',
          closed: '#ef4444',
          pending: '#f59e0b',
          awarded: '#8b5cf6',
        },
        // Categorías TI
        category: {
          software: '#3b82f6',
          hardware: '#8b5cf6',
          networks: '#ec4899',
          security: '#ef4444',
          services: '#f59e0b',
          general: '#6b7280',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
