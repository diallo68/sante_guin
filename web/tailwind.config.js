/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Charte Mondocteur (issue des maquettes web/mobile) :
        // teal marque + navy encre pour les titres + mist pour les fonds clairs.
        primary: '#0d7a86',
        secondary: '#FF9900',
        success: '#00AA44',
        danger: '#FF3333',
        warning: '#FFB800',
        light: '#F5F5F5',
        dark: '#333333',
        ink: {
          50: '#eef4f6',
          100: '#d7e3e8',
          400: '#3d6b7d',
          700: '#123244',
          900: '#0b2a3a',
        },
        mist: {
          50: '#f6fafa',
          100: '#eef6f6',
        },
      },
    },
  },
  plugins: [],
};
