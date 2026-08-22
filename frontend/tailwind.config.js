/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0908",
        panel: "#141210",
        panelBorder: "#211d19",
        accent: "#e8935f",
        accentSoft: "#f5c396",
        textPrimary: "#f5f1ea",
        textMuted: "#8b8579",
        textFaint: "#726b60",
      },
      fontFamily: {
        display: ["Georgia", "Lora", "serif"],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
