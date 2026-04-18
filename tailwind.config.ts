import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gh: {
          canvas: {
            default: '#0d1117',
            subtle:  '#161b22',
            inset:   '#010409',
          },
          border: {
            default: '#30363d',
            muted:   '#21262d',
          },
          fg: {
            default: '#e6edf3',
            muted:   '#8b949e',
            subtle:  '#6e7681',
          },
          accent: {
            fg:       '#58a6ff',
            emphasis: '#1f6feb',
          },
          done: {
            fg:       '#a371f7',
            emphasis: '#8957e5',
          },
          success: {
            fg:       '#3fb950',
            emphasis: '#238636',
          },
          attention: { fg: '#d29922' },
          danger:    { fg: '#f85149' },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SFMono-Regular"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'gh': '6px',
      },
    },
  },
  plugins: [],
}

export default config
