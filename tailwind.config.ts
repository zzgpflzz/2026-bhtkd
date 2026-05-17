import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design Insights 톤: 화이트 + 차콜 + 라인 + 포인트 레드
        paper: "#FFFFFF",          // 페이지 / 카드 배경
        mist: "#FAFAFB",           // 살짝 낮은 회색 배경 (필요 시)
        ink: "#1A1A1A",            // 본문 텍스트
        "ink-soft": "#4B5563",     // 서브 텍스트
        muted: "#9CA3AF",          // 라벨, 보조
        line: "#E5E7EB",           // 1px 보더
        "line-soft": "#F3F4F6",    // 더 옅은 라인
        point: "#FF0044",          // 포인트 레드 (합격, 조회하기)
        "point-dark": "#E0003B",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightish: "-0.025em",
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
