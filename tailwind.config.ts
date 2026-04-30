import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primary-hover)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        textBase: 'var(--color-text)',
        textMuted: 'var(--color-text-muted)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
        btn: 'var(--radius-btn)',
      },
      fontFamily: {
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};

export default config;
