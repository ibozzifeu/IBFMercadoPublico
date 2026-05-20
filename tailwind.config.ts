import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // ENFORCE SHARP GEOMETRY: Override standard Tailwind border-radius configurations
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    // FLAT BRUTALIST AESTHETIC: Override all shadows to ensure flat, solid surfaces
    boxShadow: {
      none: 'none',
      sm: 'none',
      DEFAULT: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
      '2xl': 'none',
      inner: 'none',
    },
    extend: {
      fontFamily: {
        // Enforce Inter as the primary sans-serif font
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // Add specific design system typography classes
        'ibf-h1': ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'ibf-h2': ['32px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'ibf-h3': ['24px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '700' }],
        'ibf-body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'ibf-body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'ibf-data-mono': ['14px', { lineHeight: '1.5', letterSpacing: '0.02em', fontWeight: '500' }],
        'ibf-label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
      },
      colors: {
        // Strict mapping of closed functional design tokens
        background: '#FFFFFF', // ibf-white-executive
        foreground: '#1A202C', // ibf-charcoal-core
        border: '#718096',     // ibf-titanium-slate
        input: '#718096',      // ibf-titanium-slate
        ring: '#0047AB',       // ibf-precision-cobalt
        
        primary: {
          DEFAULT: '#0047AB',  // ibf-precision-cobalt (Functional CTA)
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F7FAFC',  // ibf-white-snow
          foreground: '#0A1128', // ibf-midnight-boardroom
        },
        muted: {
          DEFAULT: '#F7FAFC',
          foreground: '#718096',
        },
        accent: {
          DEFAULT: '#F7FAFC',
          foreground: '#0A1128',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#F7FAFC',
          foreground: '#1A202C',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A202C',
        },
        success: {
          DEFAULT: '#1F7A5D',  // ibf-opex-emerald
          foreground: '#FFFFFF',
        },

        // Explicit Design Tokens for Direct Utility Classes
        ibf: {
          'white-executive': '#FFFFFF',
          'white-snow': '#F7FAFC',
          'charcoal-core': '#1A202C',
          'midnight-boardroom': '#0A1128',
          'titanium-slate': '#718096',
          'precision-cobalt': '#0047AB',
          'opex-emerald': '#1F7A5D',
        },

        // Mappings for Existing Project Color Variables (Aligned to Design System)
        brand: {
          50: '#F7FAFC',
          100: '#F7FAFC',
          200: '#718096',
          300: '#718096',
          400: '#0047AB',
          500: '#0047AB',
          600: '#0A1128',
          700: '#0A1128',
          800: '#0A1128',
          900: '#0A1128',
        },
        status: {
          active: '#1F7A5D',    // Maps to ibf-opex-emerald
          closed: '#EF4444',    // Flat Red
          pending: '#718096',   // Maps to ibf-titanium-slate
          awarded: '#0047AB',   // Maps to ibf-precision-cobalt
        },
        category: {
          software: '#0047AB',  // Maps to ibf-precision-cobalt
          hardware: '#1A202C',  // Maps to ibf-charcoal-core
          networks: '#0A1128',  // Maps to ibf-midnight-boardroom
          security: '#EF4444',  // Flat Red
          services: '#718096',  // Maps to ibf-titanium-slate
          general: '#F7FAFC',   // Maps to ibf-white-snow
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
