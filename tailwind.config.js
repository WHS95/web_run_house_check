/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: "#579EE2", // 랭킹 카드 배경색
          purple: "#8A64BA", // 출석 카드 배경색
          dark: "#214A9F", // 상단 배경색
          teal: "#4FDECB", // 랭킹 텍스트 색상
        },
        background: {
          DEFAULT: "#F8F8F8",
          dark: "#111827", // 더 어두운 배경색으로 조정
        },
        gradient: {
          from: "#1E2B44",
          to: "#0C1528",
        },
        white: "#FFFFFF",
        black: "#000000",
      },
      fontFamily: {
        sans: ["Apple SD Gothic Neo", "sans-serif"],
        sfpro: ["SF Pro Text", "sans-serif"],
      },
      fontSize: {
        26: "26px",
        15: "15px",
        14: "14px",
      },
      borderRadius: {
        "card-top": "24px 24px 0px 0px",
        notice: "8px",
      },
      opacity: {
        14: "0.14",
        90: "0.9",
      },
      spacing: {
        1.5: "0.375rem",
      },
    },
  },
  plugins: [],
};
