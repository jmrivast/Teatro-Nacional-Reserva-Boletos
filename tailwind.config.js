module.exports = {
  darkMode: "class",
  content: [
    "./js/**/*.js",
    "./index.html",
    "./teatro_backend/templates/**/*.html",
    "./teatro_backend/api/templates/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#b12024",
          light: "#d62d31",
          dark: "#8c191c",
        },
        danger: "#f87171",
      },
    },
  },
};
