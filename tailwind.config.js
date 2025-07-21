/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
         extend: {
    dropShadow: {
      glow: '0 0 8px rgba(140, 124, 104, 0.5)', // soft earthy glow
    },
  },
      colors: {
        elegant: {
          emerald: "#2D6A4F",    // Deep muted emerald
          mint: "#B7E8C4",       // Soft mint
          blue: "#BFD7ED",       // Powder blue
          blush: "#F9E3E3",      // Blush pink
          cream: "#F8F5F2",      // Creamy white
          gold: "#F9C784",       // Gold accent
        },
      },
      fontFamily: {
        // Optionally, add a more elegant font (make sure to import in your _app.js or _document.js)
        // 'serif': ['"Cormorant Garamond"', 'serif'],
      },
      boxShadow: {
        'elegant': '0 8px 32px 0 rgba(45, 106, 79, 0.10)', // Soft green shadow
      }
    },
  },
  plugins: [],
}
