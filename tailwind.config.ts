import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Colore Primario (Terracotta / Arancio Caldo Solare)
          primary: "#ea580c",      // orange-600
          hover: "#c2410c",        // orange-700
          light: "#fff7ed",        // orange-50
          dark: "#7c2d12",         // orange-900

          // Colore Accento (Giallo Caldo Pastéis / Solare)
          accent: "#f59e0b",       // amber-500
          accentHover: "#d97706",  // amber-600
          accentLight: "#fef3c7",  // amber-100

          // Sfondi e Superfici (Sfondo Warm Sand / Avorio)
          surface: "#ffffff",
          surfaceDark: "#1c1917",  // stone-900
          background: "#fffbf5",   // Warm Cream / Avorio luminoso
          backgroundDark: "#0c0a09", // stone-950
        },
      },
    },
  },
  plugins: [],
};
export default config;