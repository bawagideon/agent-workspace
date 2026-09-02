import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        foreground: '#f1f5f9',
        card: '#11131a',
        'card-border': '#1e2330',
        primary: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        accent: '#38bdf8',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
    },
  },
  plugins: [],
};

export default config;
