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
          "var(--font-inter)",
          "'Asta Sans'",
          "Pretendard",
          "var(--font-do-hyeon)",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Apple SD Gothic Neo'",
          "'SF Pro Text'",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-archivo)",
          "var(--font-inter)",
          "'Asta Sans'",
          "var(--font-do-hyeon)",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "monospace",
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
        /* RunHouse v2 Design Tokens — Cartographic Dark
         * 알파 modifier(`bg-rh-accent/20` 등)가 표준 `rgb(... / α)` 출력으로
         * 컴파일되도록 rgb-triplet 패턴(`rgb(var(--rh-x-rgb) / <alpha-value>)`)
         * 사용. 구형 모바일 브라우저(<Safari 16.4 / <Chrome 111)에서 color-mix()
         * 미지원으로 인한 흰색 fallback 방지. 인라인 `var(--rh-accent)`(hex)
         * 사용은 그대로 유지된다(globals.css에 두 변수가 병존). */
        rh: {
          board: "rgb(var(--rh-bg-primary-rgb) / <alpha-value>)",
          bg: {
            primary: "rgb(var(--rh-bg-primary-rgb) / <alpha-value>)",
            inset: "rgb(var(--rh-bg-inset-rgb) / <alpha-value>)",
            surface: "rgb(var(--rh-bg-surface-rgb) / <alpha-value>)",
            elev: "rgb(var(--rh-bg-elev-rgb) / <alpha-value>)",
            muted: "rgb(var(--rh-bg-muted-rgb) / <alpha-value>)",
            accent: "rgb(var(--rh-accent-rgb) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--rh-accent-rgb) / <alpha-value>)",
            hover: "rgb(var(--rh-accent-hover-rgb) / <alpha-value>)",
            soft: "rgb(var(--rh-accent-soft-rgb) / <alpha-value>)",
            blue: "rgb(var(--rh-accent-blue-rgb) / <alpha-value>)",
          },
          /* border-rh-border 등 default(/N 없는) 사용은 기존 rgba(.08/.15/.04)
           * 톤을 유지. 알파 modifier가 필요한 경우 `border-rh-rule/N` 사용. */
          border: {
            DEFAULT: "var(--rh-border)",
            strong: "var(--rh-border-strong)",
            subtle: "var(--rh-border-subtle)",
          },
          rule: "rgb(var(--rh-rule-rgb) / <alpha-value>)",
          divider: "var(--rh-divider)",
          text: {
            primary: "rgb(var(--rh-text-primary-rgb) / <alpha-value>)",
            secondary: "rgb(var(--rh-text-primary-rgb) / 0.62)",
            tertiary: "rgb(var(--rh-text-primary-rgb) / 0.38)",
            muted: "rgb(var(--rh-text-primary-rgb) / 0.24)",
            faint: "rgb(var(--rh-text-primary-rgb) / 0.14)",
            inverted: "rgb(var(--rh-text-inverted-rgb) / <alpha-value>)",
          },
          status: {
            success: "rgb(var(--rh-status-success-rgb) / <alpha-value>)",
            warning: "rgb(var(--rh-status-warning-rgb) / <alpha-value>)",
            error: "rgb(var(--rh-status-error-rgb) / <alpha-value>)",
          },
        },
        /* Service Map 호환 alias (lime 직접 접근용) */
        lime: {
          DEFAULT: "rgb(var(--rh-accent-rgb) / <alpha-value>)",
          2: "rgb(var(--rh-accent-hover-rgb) / <alpha-value>)",
          3: "var(--rh-accent-soft)",
        },
      },
      fontSize: {
        "rh-hero": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        "rh-title1": ["1.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        "rh-title2": ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "rh-title3": ["1rem", { lineHeight: "1.3", fontWeight: "600" }],
        "rh-body": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "rh-caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }],
        "rh-label": ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }],
        "rh-small": ["0.625rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      borderRadius: {
        xl: "1.375rem",
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        "rh-xs": "4px",
        "rh-sm": "6px",
        "rh-md": "8px",
        "rh-lg": "12px",
        "rh-xl": "16px",
        "rh-full": "100px",
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
        "rh-xs": "2px",
        "rh-sm": "4px",
        "rh-md": "8px",
        "rh-lg": "12px",
        "rh-xl": "16px",
        "rh-2xl": "24px",
        "rh-3xl": "32px",
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
