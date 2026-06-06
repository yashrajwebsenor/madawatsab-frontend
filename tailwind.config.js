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
    },
  },
  plugins: [heroui()],
};
export default config;
