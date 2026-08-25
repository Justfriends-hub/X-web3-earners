/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#1C1917",
        surface: "#262321",
        "surface-alt": "#2C1E16",
        border: "rgba(255,255,255,0.08)",
        "text-primary": "#FFFFFF",
        "text-muted": "#A89A8C",
        brand: "#EA580C",
        "brand-light": "#F97316",
        gold: "#FBBF24",
        info: "#2563EB",
        success: "#22C55E",
        special: "#7C3AED",
        destructive: "#DC2626",
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
        button: "14px",
      },
    },
  },
  plugins: [],
};
