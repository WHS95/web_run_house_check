import "./styles/globals.css";
import { ReactNode } from "react";
// import { StagewiseToolbar } from "@stagewise/toolbar-next";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "런하우스",
  description: "러닝크루의 모든것 ",
  manifest: "/manifest.json",
  metadataBase: new URL("https://web-run-house-check.vercel.app"),
  openGraph: {
    title: "런하우스",
    description: "러닝크루의 모든것 ",
    type: "website",
    locale: "ko_KR",
    url: "https://web-run-house-check.vercel.app",
    siteName: "런하우스",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "런하우스 - 러닝크루 관리 플랫폼",
        type: "image/png",
      },
      {
        url: "/logo.png",
        width: 400,
        height: 400,
        alt: "런하우스 로고",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "런하우스",
    description: "러닝크루의 모든것 ",
    images: ["/android-chrome-512x512.png"],
    creator: "@runhouse",
  },
  // 카카오톡용 추가 메타데이터
  other: {
    "kakao:title": "런하우스",
    "kakao:description": "러닝크루의 모든것 ",
    "kakao:image": "/android-chrome-512x512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "런하우스",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3f82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <head>
        <meta name='application-name' content='런하우스' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta
          name='apple-mobile-web-app-status-bar-style'
          content='black-translucent'
        />
        <meta name='apple-mobile-web-app-title' content='런하우스' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-config' content='/browserconfig.xml' />
        <meta name='msapplication-TileColor' content='#3f82f6' />
        <meta name='msapplication-tap-highlight' content='no' />
        <meta name='touch-action' content='pan-x pan-y' />
        <meta name='HandheldFriendly' content='true' />
        <meta name='MobileOptimized' content='width' />

        {/* Open Graph / Facebook / 카카오톡 공유용 메타 태그 */}
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content='런하우스' />
        <meta property='og:locale' content='ko_KR' />
        <meta property='og:image:type' content='image/png' />
        <meta property='og:image:width' content='512' />
        <meta property='og:image:height' content='512' />

        {/* Twitter Card 메타 태그 */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@runhouse' />
        <meta name='twitter:creator' content='@runhouse' />

        {/* 카카오톡 특화 메타 태그 */}
        <meta property='kakao:title' content='런하우스' />
        <meta property='kakao:description' content='러닝크루의 모든것' />
        <meta property='kakao:image' content='/android-chrome-512x512.png' />

        {/* 네이버 블로그/카페 공유용 */}
        <meta property='naver:title' content='런하우스' />
        <meta property='naver:description' content='러닝크루의 모든것' />
        <meta property='naver:image' content='/android-chrome-512x512.png' />

        {/* 구조화된 데이터 (JSON-LD) */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "런하우스",
              description: "러닝크루의 모든것 ",
              url: "https://web-run-house-check.vercel.app/",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web Browser",
              image: "/android-chrome-512x512.png",
              author: {
                "@type": "Organization",
                name: "런하우스",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KRW",
              },
            }),
          }}
        />

        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/favicon-16x16.png'
        />
        <link rel='manifest' href='/manifest.json' />
        <link rel='shortcut icon' href='/favicon.ico' />
      </head>
      <body>
        {/* <StagewiseToolbar
          config={{
            plugins: [], // 필요한 경우 여기에 사용자 정의 플러그인을 추가할 수 있습니다.
          }}
        /> */}
        <div className='h-screen overflow-hidden'>{children}</div>
      </body>
    </html>
  );
}
