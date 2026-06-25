/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080b12",
          900: "#0c1018",
          850: "#10151f",
          800: "#141a26",
          700: "#1d2433",
          600: "#2a3344",
        },
        brand: {
          DEFAULT: "#34d399",
          dim: "#10b981",
        },
        accent: "#818cf8",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
