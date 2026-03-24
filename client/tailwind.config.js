/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          700: "#c2410c",
          950: "#431407",
        },
      },
      boxShadow: {
        panel: "0 24px 60px -24px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
