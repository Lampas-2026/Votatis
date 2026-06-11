import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Votatis — 흩어진 증거를 사라지지 않게",
  description:
    "선거 현장의 제보를 출처와 함께 모으고, 사람이 검증한 결과만 공개 아카이브로 남깁니다. 검증 상태가 함께 표시되는 시민 주도 오픈소스 플랫폼.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
