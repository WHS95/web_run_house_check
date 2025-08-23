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
      "react-icons",
      "framer-motion",
    ],
    turbo: {
      rules: {
        "*.svg": ["@svgr/webpack"],
      },
    },
    // 런타임 최적화
    serverComponentsExternalPackages: ['@supabase/ssr'],
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
    ];
  },
};

module.exports = nextConfig;
