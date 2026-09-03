import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.runhouse.app",
    appName: "런하우스",
    // Next.js App Router(RSC/Server Actions)는 정적 export가 불가능하므로
    // 번들된 웹 자산 대신 배포된 서버를 직접 로드한다.
    // webDir은 Capacitor가 존재를 요구하기 때문에 폴백 스텁을 가리킨다.
    webDir: "capacitor-shell",
    // 웹뷰 로드 전 흰 화면 깜빡임 방지 (앱 배경 = rh-bg-primary)
    backgroundColor: "#1D2530",
    server: {
        url: "https://web-run-house-check.vercel.app",
        cleartext: false,
        // 카카오 OAuth / Supabase 인증 리다이렉트가 웹뷰 밖으로
        // 튕겨나가지 않도록 허용 호스트를 명시한다.
        allowNavigation: [
            "web-run-house-check.vercel.app",
            "*.kakao.com",
            "*.kakaocdn.net",
            "*.supabase.co",
            "*.naver.com",
            "*.pstatic.net",
        ],
    },
    ios: {
        contentInset: "never",
        backgroundColor: "#1D2530",
        allowsLinkPreview: false,
    },
};

export default config;
