import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDF8E8',
          100: '#F9EDCC',
          200: '#F3D99A',
          300: '#EDCA6E',
          400: '#E0B840',
          500: '#C9A227',
          600: '#A8871F',
          700: '#876C18',
          800: '#665112',
          900: '#45360C',
        },
        hackberry: '#475569',
        foggy: '#64748B',
        hof: '#1E293B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'pill': '999px',
      },
    },
  },
  plugins: [],
};

export default config;
