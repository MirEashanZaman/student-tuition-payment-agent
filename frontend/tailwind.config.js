module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          primary: '#1E3A8A',
          accent: '#0D9488',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          main: '#0F172A',
          secondary: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          warning: '#F59E0B',
          blocked: '#DC2626',
          info: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        fintechTheme: {
          "primary": "#1E3A8A",
          "primary-content": "#FFFFFF",
          "secondary": "#0D9488",
          "secondary-content": "#FFFFFF",
          "accent": "#0D9488",
          "accent-content": "#FFFFFF",
          "neutral": "#0F172A",
          "neutral-content": "#FFFFFF",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          "base-content": "#0F172A",
          "info": "#2563EB",
          "info-content": "#FFFFFF",
          "success": "#16A34A",
          "success-content": "#FFFFFF",
          "warning": "#F59E0B",
          "warning-content": "#FFFFFF",
          "error": "#DC2626",
          "error-content": "#FFFFFF",
        },
      },
    ],
    defaultTheme: "fintechTheme",
    darkTheme: false,
  },
};
