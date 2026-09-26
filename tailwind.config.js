/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/shared/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./src/stores/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        kamaq: {
          primary: "#0F4C81",
          "primary-light": "#1A6BB5",
          "primary-dark": "#0A3560",
          secondary: "#2A9D8F",
          "secondary-light": "#3DC4B5",
          success: "#2ECC71",
          warning: "#F4A261",
          error: "#E63946",
          background: "#F8F9FA",
          surface: "#FFFFFF",
          "text-primary": "#1A1A2E",
          "text-secondary": "#6C757D",
          "text-muted": "#ADB5BD",
          border: "#DEE2E6",
          dark: {
            background: "#1A1A2E",
            surface: "#16213E",
            border: "#2C3E50",
          },
          blue: "#3575EE",
          "blue-dark": "#2960CA",
          "icon-blue": "#3B82F6",
          "bg-deep": "#08121F",
          "bg-base": "#05080C",
          "input-bg": "#1C2738",
          "outline-border": "#313F51",
          "text-soft": "#899DB5",
          "text-detail": "#475D7A",
          "badge-bg": "#082C22",
          "badge-green": "#11A570",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      padding: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
