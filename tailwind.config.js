/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Apple SD Gothic Neo'",
          "'SF Pro Text'",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        /* shadcn/ui 호환 */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* 레거시 별칭 (iOS 토큰 매핑) */
        "basic-blue": "#669ff2",
        "basic-gray": "#3A3A3C",
        "basic-black": "#000000",
        "basic-black-gray": "#1C1C1E",
        /* iOS Design Tokens */
        ios: {
          "system-bg": "#000000",
          "grouped-bg": "#000000",
          elevated: {
            DEFAULT: "#1C1C1E",
            2: "#2C2C2E",
            3: "#3A3A3C",
          },
          accent: {
            DEFAULT: "#669ff2",
            strong: "#3D7FE8",
            light: "#99BFF7",
            muted: "#6B84A8",
            dim: "#4B5F7A",
            subtle: "#3D4655",
          },
          label: {
            DEFAULT: "#FFFFFF",
            secondary: "rgba(235, 235, 245, 0.6)",
            tertiary: "rgba(235, 235, 245, 0.3)",
          },
          separator: "rgba(84, 84, 88, 0.65)",
          overlay: "rgba(0, 0, 0, 0.4)",
        },
      },
      fontSize: {
        "ios-large-title": [
          "2.125rem",
          {
            lineHeight: "1.2",
            fontWeight: "700",
          },
        ],
        "ios-title-1": [
          "1.75rem",
          {
            lineHeight: "1.2",
            fontWeight: "700",
          },
        ],
        "ios-title-2": [
          "1.375rem",
          {
            lineHeight: "1.3",
            fontWeight: "700",
          },
        ],
        "ios-title-3": [
          "1.25rem",
          {
            lineHeight: "1.3",
            fontWeight: "600",
          },
        ],
        "ios-headline": [
          "1.0625rem",
          {
            lineHeight: "1.4",
            fontWeight: "600",
          },
        ],
        "ios-body": [
          "1.0625rem",
          {
            lineHeight: "1.4",
            fontWeight: "400",
          },
        ],
        "ios-callout": [
          "1rem",
          {
            lineHeight: "1.4",
            fontWeight: "400",
          },
        ],
        "ios-subhead": [
          "0.9375rem",
          {
            lineHeight: "1.4",
            fontWeight: "400",
          },
        ],
        "ios-footnote": [
          "0.8125rem",
          {
            lineHeight: "1.4",
            fontWeight: "400",
          },
        ],
        "ios-caption": [
          "0.75rem",
          {
            lineHeight: "1.4",
            fontWeight: "400",
          },
        ],
      },
      borderRadius: {
        xl: "1.375rem",
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: { height: "0" },
        },
        "bounce-subtle": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-4px)",
          },
        },
        "slide-up": {
          from: {
            transform: "translateY(100%)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "slide-down": {
          from: {
            transform: "translateY(-100%)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: {
            transform: "scale(0.9)",
            opacity: "0",
          },
          to: {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        /* iOS 스타일 애니메이션 */
        "ios-sheet-up": {
          from: {
            transform: "translateY(100%)",
          },
          to: {
            transform: "translateY(0)",
          },
        },
        "ios-sheet-down": {
          from: {
            transform: "translateY(0)",
          },
          to: {
            transform: "translateY(100%)",
          },
        },
        "ios-alert-in": {
          from: {
            transform: "scale(1.15)",
            opacity: "0",
          },
          to: {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "ios-alert-out": {
          from: {
            transform: "scale(1)",
            opacity: "1",
          },
          to: {
            transform: "scale(0.9)",
            opacity: "0",
          },
        },
        "ios-push-in": {
          from: {
            transform: "translateX(100%)",
          },
          to: {
            transform: "translateX(0)",
          },
        },
        "ios-push-out": {
          from: {
            transform: "translateX(0)",
          },
          to: {
            transform: "translateX(-30%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "ios-sheet-up": "ios-sheet-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        "ios-sheet-down": "ios-sheet-down 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        "ios-alert-in": "ios-alert-in 0.2s ease-out",
        "ios-alert-out": "ios-alert-out 0.15s ease-in",
        "ios-push-in": "ios-push-in 0.3s ease-out",
        "ios-push-out": "ios-push-out 0.3s ease-out",
      },
      spacing: {
        "safe-area-pb": "env(safe-area-inset-bottom)",
        "safe-area-pt": "env(safe-area-inset-top)",
        "safe-area-pl": "env(safe-area-inset-left)",
        "safe-area-pr": "env(safe-area-inset-right)",
        "ios-xs": "0.25rem",
        "ios-sm": "0.5rem",
        "ios-md": "1rem",
        "ios-lg": "1.25rem",
        "ios-xl": "2rem",
        "ios-2xl": "2.75rem",
        "ios-touch": "2.75rem",
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },
      minHeight: {
        "screen-safe": "calc(100vh - env(safe-area-inset-bottom))",
        dvh: "100dvh",
      },
      maxHeight: {
        "screen-safe": "calc(100vh - env(safe-area-inset-bottom))",
        dvh: "100dvh",
      },
      scale: {
        96: "0.96",
        102: "1.02",
      },
      backdropBlur: {
        xs: "2px",
        ios: "20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
