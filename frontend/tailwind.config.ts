import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        myeongjo: [
          '"Nanum Myeongjo"',
          "serif"
         ],
      },
      colors: {
        'primary-gradient-start': '#5bd1cb', // Define start color
        'primary-gradient-end': '#f050f0',   // Define end color
        'primary': '#5b5bd1cb',              // Define solid color
      },
      backgroundImage: { //For the gradient
        'primary-gradient': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
