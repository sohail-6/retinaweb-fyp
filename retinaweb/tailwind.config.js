/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#06B6D4",
        dark: "#1E293B",
        light: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Segoe UI", "sans-serif"],
      },
      animation: {
        "slow-pulse": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}