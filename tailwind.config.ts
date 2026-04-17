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
        green: {
          DEFAULT: '#0F6E56',
          light:   '#1D9E75',
          pale:    '#E1F5EE',
          dark:    '#085041',
        },
        amber: {
          DEFAULT: '#BA7517',
          pale:    '#FAEEDA',
        },
      },
      fontFamily: {
        sans:  ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card:   '0 2px 16px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
