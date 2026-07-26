/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta principal: verde como cor primária, branco/cinza/preto como
        // base neutra. Usamos escala completa (50-950) pra dar profundidade
        // sem depender de cores "puras" (evita visual antigo/genérico).
        brand: {
          50: "#f0fdf6",
          100: "#dbfbe8",
          200: "#b8f5d3",
          300: "#84e8b4",
          400: "#4bd18d",
          500: "#22b06b", // cor primária
          600: "#158a55",
          700: "#126e46",
          800: "#12583a",
          900: "#0f4831",
          950: "#06281c",
        },
        surface: {
          light: "#ffffff",
          subtle: "#f6f8f7",
          dark: "#0b0f0d",
          darkSubtle: "#121713",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Sora'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)",
        card: "0 2px 8px -2px rgb(0 0 0 / 0.06), 0 4px 16px -4px rgb(0 0 0 / 0.08)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
