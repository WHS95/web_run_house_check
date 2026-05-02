import { ReactNode } from "react";

export const metadata = {
    title: "런하우스 — 러닝 크루 운영을 데이터화",
    description:
        "단톡방 출석체크 그만. 위치 기반 출석부터 통계 시각화까지, 크루 운영진과 멤버 모두를 위한 러닝 크루 앱.",
    openGraph: {
        title: "런하우스 — 러닝 크루 운영을 데이터화",
        description: "단톡방 출석체크 그만. 위치 기반 출석부터 통계 시각화까지.",
        type: "website",
        locale: "ko_KR",
    },
};

/**
 * 소개 페이지 전용 레이아웃.
 *
 * `.intro-root` 클래스가 globals.css의 `:has()` 셀렉터에 의해
 * 데스크탑 폰 프레임(.mobile-viewport)을 풀-너비로 풀어줍니다.
 */
export default function IntroLayout({ children }: { children: ReactNode }) {
    return <div className="intro-root min-h-screen bg-rh-bg-primary">{children}</div>;
}
