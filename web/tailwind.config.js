/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066CC',
        secondary: '#FF9900',
        success: '#00AA44',
        danger: '#FF3333',
        warning: '#FFB800',
        light: '#F5F5F5',
        dark: '#333333',
      },
    },
  },
  plugins: [],
};
