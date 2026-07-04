import type { Metadata } from "next";
import "./globals.css";

// 구글 확인용 메타데이터가 포함된 설정입니다.
export const metadata: Metadata = {
  title: "BAEKHO TAEKWONDO · 백호태권도",
  description: "한국체육대학교 부설 백호태권도 학부모용 심사 결과 조회 시스템",
  verification: {
    google: "nha2v8rsFE9_5o5vPV0_TTnx13_ZuAFXxFhhDhPcKQs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
