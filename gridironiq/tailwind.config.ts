import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        giq: {
          ink: "#050709",
          ink2: "#0a0d14",
          ink3: "#0f131e",
          surface: "#131928",
          border: "rgba(255,255,255,0.06)",
          gold: "#d4a843",
          gold2: "#f0c060",
          goldDim: "rgba(212,168,67,0.10)",
          cyanDim: "rgba(41,184,224,0.08)",
          red: "#e05252",
          green: "#3ecf7a",
          cyan: "#29b8e0",
          text: "#dde4ef",
          text2: "#7d8fa8",
          text3: "#3d4f66",
        },
      },
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Rajdhani'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
