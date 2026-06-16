/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        kitchen: {
          warm: "#FF6B35",
          brown: "#3E2723",
          cream: "#FFF8E1",
          chili: "#E53935",
          ice: "#4FC3F7",
          veggie: "#66BB6A",
        },
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', "cursive"],
        body: ['"Noto Sans SC"', "sans-serif"],
      },
      animation: {
        "bounce-in": "bounceIn 0.4s ease-out",
        "float-up": "floatUp 1s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        bounceIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-30px)", opacity: "0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
