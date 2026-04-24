import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#070707",
        coal: "#101010",
        graphite: "#1B1B1B",
        ember: "#C78A2C",
        amberglow: "#F3B562",
        cream: "#F6EBDD"
      },
      boxShadow: {
        amber: "0 24px 60px rgba(199, 138, 44, 0.18)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(243, 181, 98, 0.25), transparent 35%), radial-gradient(circle at bottom right, rgba(199, 138, 44, 0.18), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;