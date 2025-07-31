/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      dropShadow: {
        glow: "0 0 8px rgba(140, 124, 104, 0.5)", // soft earthy glow
      },
      colors: {
        elegant: {
          emerald: "#2D6A4F",
          mint: "#B7E8C4",
          blue: "#BFD7ED",
          blush: "#F9E3E3",
          cream: "#F8F5F2",
          gold: "#F9C784",
        },
      },
      fontFamily: {
        // 'serif': ['"Cormorant Garamond"', 'serif'],
      },
      boxShadow: {
        elegant: "0 8px 32px 0 rgba(45, 106, 79, 0.10)",
      },
    },
  },
  variants: {
    extend: {
      display: ["print"],
    },
  },
  plugins: [],
};
