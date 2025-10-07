/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      colors: {
        // Light theme colors
        light: {
          bg: '#ffffff',
          'bg-secondary': '#f8fafc',
          text: '#1f2937',
          'text-secondary': '#6b7280',
          border: '#e5e7eb',
          accent: '#3b82f6',
        },
        // Dark theme colors
        dark: {
          bg: '#1f2937',
          'bg-secondary': '#374151',
          text: '#f9fafb',
          'text-secondary': '#d1d5db',
          border: '#4b5563',
          accent: '#60a5fa',
        },
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        96: '24rem',
      },
    },
  },
  plugins: [],
};
