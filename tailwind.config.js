/** @type {import('tailwindcss').Config} */
import { heroui } from "@heroui/react";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Extra small-phone breakpoint (defaults keep sm 640 / md 768 / lg 1024).
      // Lets card grids go 2-up only once the phone is wide enough (~480px+).
      screens: {
        xs: "480px",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: "#1f5c59",
        secondary: "#E9C349",
      },
      borderColor: {
        primary: "#1f5c59",
        secondary: "#E9C349",
      },
      backgroundColor: {
        primary: "#1f5c59",
        secondary: "#E9C349",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "2xl": "1500px",
        },
      },
      // VVIP card treatment. Built on the brand gold (secondary #E9C349) so the
      // tier reads as premium-brand rather than a second, unrelated gold.
      keyframes: {
        // A sheen sweeping across the card. Long pause between passes (the
        // travel happens in the first ~30% of the cycle) so it catches the eye
        // without ever becoming a strobe in a grid of many VVIP cards.
        "vvip-sheen": {
          "0%": { transform: "translateX(-150%) skewX(-16deg)" },
          "30%, 100%": { transform: "translateX(350%) skewX(-16deg)" },
        },
        "vvip-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 1px rgba(233,195,73,0.5), 0 4px 16px -6px rgba(233,195,73,0.45)",
          },
          "50%": {
            boxShadow:
              "0 0 0 1px rgba(233,195,73,0.85), 0 10px 30px -6px rgba(233,195,73,0.7)",
          },
        },
      },
      animation: {
        "vvip-sheen": "vvip-sheen 6s ease-in-out infinite",
        "vvip-glow": "vvip-glow 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [heroui()],
};
export default config;
