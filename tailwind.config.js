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
        // Clean minimal palette
        background: '#000000', // Pure black
        foreground: '#FFFFFF', // Pure white
        primary: {
          DEFAULT: '#FFFFFF', // Clean white
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#1A1A1A', // Dark gray
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#0A0A0A', // Very dark card
          hover: '#111111', // Subtle hover
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#404040', // Medium gray
          foreground: '#888888',
        },
        border: '#1A1A1A', // Subtle dark border
        input: '#111111', // Dark input
        ring: '#FFFFFF', // White focus ring
        destructive: {
          DEFAULT: '#EF4444', // Clean red
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000',
        },
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
