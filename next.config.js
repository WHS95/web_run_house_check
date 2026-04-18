/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // API 라우트가 동적으로 작동하도록 설정
  output: "standalone",

  // 성능 최적화 설정
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-avatar",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "framer-motion",
      "react-hook-form",
      "@hookform/resolvers",
      "zod",
    ],
    turbo: {
      rules: {
        "*.svg": ["@svgr/webpack"],
      },
    },
    // 런타임 최적화
    serverComponentsExternalPackages: ['@supabase/ssr'],
    // Sentry instrumentation.ts 활성화 (Next 14 요구)
    instrumentationHook: true,
  },

  // 번들 분석 및 최적화
  webpack: (config, { dev, isServer }) => {
    // 프로덕션 빌드에서 번들 크기 최적화
    if (!dev && !isServer) {
      // Tree shaking 최적화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 청크 분할 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // 압축 및 캐싱 최적화
  compress: true,
  poweredByHeader: false,

  // PostHog 역프록시: 광고 차단 회피용 (/ingest → us.i.posthog.com)
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  images: {
    domains: [],
    // 이미지 최적화 설정
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1년 캐싱
  },

  // PWA 설정
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 정적 자산 캐싱 최적화
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      // 폰트 및 CSS 캐싱
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 이미지 자산 장기 캐싱
      {
        source: "/:path*.(png|jpg|jpeg|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // JS/CSS 번들 캐싱
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(nextConfig, {
  // Sentry 프로젝트 식별자 (wizard 실행 시 자동 채워짐)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵 업로드용 토큰 — CI / Vercel 환경변수에 설정할 것
  // (미설정 시 빌드는 통과하되 소스맵 업로드만 스킵)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // CI 외 로그 억제
  silent: !process.env.CI,

  // 서드파티 번들까지 포함해 스택 트레이스 가독성 향상
  widenClientFileUpload: true,

  // 광고 차단기 회피용 자체 도메인 터널
  tunnelRoute: "/monitoring",

  // 인증 정보 누락 시 소스맵 업로드 자체를 스킵해 빌드 실패 방지
  sourcemaps: {
    disable:
      !process.env.SENTRY_AUTH_TOKEN ||
      !process.env.SENTRY_ORG ||
      !process.env.SENTRY_PROJECT,
  },
});
