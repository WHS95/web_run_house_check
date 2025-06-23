import "./styles/globals.css";
import { ReactNode } from "react";
// import StagewiseWrapper from "@/components/StagewiseWrapper";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import { Analytics } from "@vercel/analytics/react";
import ConditionalBottomNav from "@/components/ConditionalBottomNav";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "런하우스",
  description: "러닝크루의 모든것",
  manifest: "/manifest.json",
  metadataBase: new URL("https://web-run-house-check.vercel.app"),

  // 핵심 메타데이터만 유지
  openGraph: {
    title: "런하우스",
    description: "러닝크루의 모든것",
    type: "website",
    locale: "ko_KR",
    siteName: "런하우스",
    images: ["/android-chrome-512x512.png"],
  },

  icons: {
    icon: [{ url: "/favicon-32x32.png", sizes: "32x32" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  // PWA 설정
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "런하우스",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d2530",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <head>
        {/* 필수 PWA 메타태그만 유지 */}
        <meta name='application-name' content='런하우스' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta
          name='apple-mobile-web-app-status-bar-style'
          content='black-translucent'
        />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />

        {/* 성능 최적화 메타태그 */}
        <meta name='X-DNS-Prefetch-Control' content='on' />
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.googleapis.com'
          crossOrigin=''
        />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin=''
        />

        {/* Black Han Sans 폰트 추가 */}
        <link
          href='https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap'
          rel='stylesheet'
        />

        {/* 필수 링크만 유지 */}
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />
        <link rel='manifest' href='/manifest.json' />

        {/* 간소화된 구조화 데이터 */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "런하우스",
              description: "러닝크루의 모든것",
              url: "https://web-run-house-check.vercel.app/",
            }),
          }}
        />
      </head>
      <body className='bg-basic-black'>
        {process.env.NODE_ENV === "development" && (
          <StagewiseToolbar
            config={{
              plugins: [], // Add your custom plugins here
            }}
          />
        )}
        <div className='pb-20 min-h-screen bg-basic-black'>{children}</div>
        <ConditionalBottomNav />
        <Analytics />
      </body>
    </html>
  );
}
