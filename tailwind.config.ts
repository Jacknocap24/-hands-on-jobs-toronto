import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        muted: '#666666',
        border: '#eeeeee',
        brand: '#0ea5e9',
      }
    },
  },
  plugins: [],
};

export default config;


