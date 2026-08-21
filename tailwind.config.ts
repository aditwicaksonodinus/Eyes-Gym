import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        calm: {
          50: "hsl(var(--calm-50))",
          100: "hsl(var(--calm-100))",
          200: "hsl(var(--calm-200))",
          300: "hsl(var(--calm-300))",
          400: "hsl(var(--calm-400))",
          500: "hsl(var(--calm-500))",
          600: "hsl(var(--calm-600))",
          700: "hsl(var(--calm-700))",
          800: "hsl(var(--calm-800))",
          900: "hsl(var(--calm-900))",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      zIndex: {
        base: "var(--z-base, 0)",
        content: "var(--z-content, 10)",
        navbar: "var(--z-navbar, 40)",
        footer: "var(--z-footer, 40)",
        toggle: "var(--z-toggle, 50)",
        overlay: "var(--z-overlay, 50)",
        backdrop: "var(--z-backdrop, 55)",
        sidebar: "var(--z-sidebar, 60)",
        "fullscreen-page": "var(--z-fullscreen-page, 70)",
        orientation: "var(--z-orientation, 80)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
