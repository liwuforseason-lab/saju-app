import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ADSENSE_CLIENT, SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "운세 한 스푼 — 내 사주팔자·오행·2026 운세 무료 풀이",
    template: "%s · 운세 한 스푼",
  },
  description:
    "태어난 순간의 여덟 글자(사주팔자)를 만세력으로 풀어 오행 균형, 일간 성향, 2026 병오년 운세와 오늘의 운세까지. 무료로 30초 만에 확인하세요.",
  keywords: [
    "사주",
    "사주팔자",
    "만세력",
    "오행",
    "무료 사주",
    "2026 운세",
    "오늘의 운세",
    "궁합",
  ],
  applicationName: "운세 한 스푼",
  openGraph: {
    title: "운세 한 스푼 — 내 사주팔자 풀이",
    description: "만세력으로 읽는 나의 여덟 글자 · 오행 균형 · 2026 병오년 운세",
    type: "website",
    locale: "ko_KR",
    siteName: "운세 한 스푼",
    images: [
      {
        url: "/assets/hero-mascot.jpg",
        width: 640,
        height: 640,
        alt: "복주머니를 든 호랑이 도깨비 사주 캐릭터",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "운세 한 스푼 — 내 사주팔자 풀이",
    description: "만세력으로 읽는 나의 여덟 글자 · 오행 균형 · 2026 병오년 운세",
    images: ["/assets/hero-mascot.jpg"],
  },
  robots: { index: true, follow: true },
  ...(ADSENSE_CLIENT
    ? { other: { "google-adsense-account": ADSENSE_CLIENT } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8F2E7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@400;500;600;700&family=Gowun+Dodum&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23141A2E'/%3E%3Cpath d='M32 12l4.6 13.4L50 30l-13.4 4.6L32 48l-4.6-13.4L14 30l13.4-4.6z' fill='%23E4C97E'/%3E%3C/svg%3E"
        />
      </head>
      <body>
        {ADSENSE_CLIENT ? (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
