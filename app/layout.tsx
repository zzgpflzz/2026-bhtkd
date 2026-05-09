import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BAEKHO TAEKWONDO · 백호태권도",
  description:
    "한국체육대학교 부설 백호태권도 학부모용 심사 결과 조회 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
