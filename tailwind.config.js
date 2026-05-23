/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#9fe870',
        'on-primary': '#0e0f0c',
        'primary-active': '#cdffad',
        'primary-neutral': '#c5edab',
        'primary-pale': '#e2f6d5',
        ink: '#0e0f0c',
        'ink-deep': '#163300',
        body: '#454745',
        mute: '#868685',
        canvas: '#ffffff',
        'canvas-soft': '#e8ebe6',
        positive: '#2ead4b',
        'positive-deep': '#054d28',
        warning: '#ffd11a',
        'warning-deep': '#b86700',
        'warning-content': '#4a3b1c',
        negative: '#d03238',
        'negative-deep': '#a72027',
        'negative-bg': '#320707',
      },
      borderRadius: {
        xl: '24px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
