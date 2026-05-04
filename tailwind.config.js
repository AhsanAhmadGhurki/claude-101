/** @type {import('tailwindcss').Config} */
const withOpacity = (variable) => ({ opacityValue }) =>
  opacityValue !== undefined
    ? `rgb(var(${variable}) / ${opacityValue})`
    : `rgb(var(${variable}))`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: withOpacity("--bg"),
          elevated: withOpacity("--bg-elevated"),
        },
        surface: {
          DEFAULT: withOpacity("--surface"),
          2: withOpacity("--surface-2"),
          hover: withOpacity("--surface-hover"),
        },
        line: {
          DEFAULT: withOpacity("--line"),
          strong: withOpacity("--line-strong"),
        },
        fg: {
          DEFAULT: withOpacity("--fg"),
          muted: withOpacity("--fg-muted"),
          subtle: withOpacity("--fg-subtle"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          hover: withOpacity("--accent-hover"),
          fg: withOpacity("--accent-fg"),
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
