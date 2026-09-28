/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--theme-background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--theme-text-rgb) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--theme-accent-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--theme-on-accent-rgb) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--theme-surface-elevated-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--theme-text-rgb) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--theme-card-rgb) / <alpha-value>)',
          hover: 'rgb(var(--theme-surface-hover-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--theme-text-rgb) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--theme-surface-hover-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--theme-text-muted-rgb) / <alpha-value>)',
        },
        border: 'rgb(var(--theme-border-rgb) / <alpha-value>)',
        'border-strong': 'rgb(var(--theme-border-strong-rgb) / <alpha-value>)',
        input: 'rgb(var(--theme-input-background-rgb) / <alpha-value>)',
        ring: 'rgb(var(--theme-focus-ring-rgb) / <alpha-value>)',
        destructive: {
          DEFAULT: 'rgb(var(--theme-error-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--theme-on-error-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--theme-accent-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--theme-on-accent-rgb) / <alpha-value>)',
        },
        'primary-dark': 'rgb(var(--theme-accent-pressed-rgb) / <alpha-value>)',
        highlight: 'rgb(var(--theme-accent-hover-rgb) / <alpha-value>)',
        link: 'rgb(var(--theme-link-rgb) / <alpha-value>)',
        'link-hover': 'rgb(var(--theme-link-hover-rgb) / <alpha-value>)',
        placeholder: 'rgb(var(--theme-placeholder-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
  },
  plugins: [],
};
