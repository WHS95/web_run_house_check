import React, { Suspense } from "react";
import nextDynamic from "next/dynamic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { redirect } from "next/navigation";
import { fetchRankingData } from "./actions";

const UltraFastRankingTemplate = nextDynamic(
    () => import("@/components/templates/UltraFastRankingTemplate"),
    {
        loading: () => (
            <div className="flex justify-center items-center min-h-screen bg-rh-bg-primary">
                <LoadingSpinner size="sm" color="white" />
            </div>
        ),
        ssr: true,
    }
);

export const revalidate = 60;

export const metadata = {
    title: "랭킹 | RUNHOUSE",
    description: "RUNHOUSE 크루 랭킹 - 출석 및 개설 랭킹을 확인하세요",
};

interface RankingPageProps {
    searchParams: Promise<{ year?: string; month?: string; demo?: string }>;
}

/**
 * 테스트용 목 랭킹 데이터 생성
 * ?demo=50 으로 50명의 목 데이터를 생성
 */
function generateDemoData(count: number, year: number, month: number) {
    const koreanNames = [
        "김민수", "이서연", "박지훈", "최유진", "정하늘",
        "강도윤", "조수빈", "윤재현", "임소율", "한지우",
        "송민재", "오예린", "배성호", "신다은", "류태양",
        "권수아", "홍준혁", "문채원", "양세진", "노하린",
        "전동현", "장서윤", "황지민", "안유나", "서정우",
        "고은채", "남기현", "유수현", "손예준", "백지호",
        "곽민서", "차은비", "하승우", "라영지", "변도훈",
        "추하영", "봉재민", "석유리", "방시현", "피수진",
        "우진호", "마은서", "길태현", "옥지연", "탁승민",
        "염하은", "반준서", "어수연", "노예진", "도현우",
        "채민경", "범석현", "감하늘", "진소연", "필준호",
        "운채영", "공도현", "계수빈", "설재윤", "빈하린",
    ];
    const attendance = Array.from({ length: count }, (_, i) => ({
        user_id: `demo-user-${i}`,
        rank: i + 1,
        name: koreanNames[i % koreanNames.length] + (i >= koreanNames.length ? `${Math.floor(i / koreanNames.length) + 1}` : ""),
        profile_image_url: null,
        value: Math.max(1, 30 - Math.floor(i * 0.5) - Math.floor(Math.random() * 2)),
        is_current_user: i === 7,
    }));
    const hosting = Array.from({ length: Math.min(count, 20) }, (_, i) => ({
        user_id: `demo-user-${i}`,
        rank: i + 1,
        name: koreanNames[i % koreanNames.length],
        profile_image_url: null,
        value: Math.max(1, 10 - Math.floor(i * 0.4)),
        is_current_user: i === 3,
    }));
    return {
        selectedYear: year,
        selectedMonth: month,
        attendanceRanking: attendance,
        hostingRanking: hosting,
        crewName: "데모 크루",
    };
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
    const params = await searchParams;
    const now = new Date();
    const year = parseInt(params.year || "") || now.getFullYear();
    const month = parseInt(params.month || "") || now.getMonth() + 1;
    const demoCount = parseInt(params.demo || "");

    // 데모 모드: ?demo=50 으로 접속 시 목 데이터 사용
    if (demoCount > 0) {
        const demoData = generateDemoData(demoCount, year, month);
        return (
            <Suspense
                fallback={
                    <div className="flex justify-center items-center min-h-screen bg-rh-bg-primary">
                        <LoadingSpinner size="sm" color="white" />
                    </div>
                }
            >
                <UltraFastRankingTemplate initialData={demoData} />
            </Suspense>
        );
    }

    const result = await fetchRankingData(year, month);

    // 리다이렉트 처리
    if (result.redirect) {
        redirect(result.redirect);
    }

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen bg-rh-bg-primary">
                    <LoadingSpinner size="sm" color="white" />
                </div>
            }
        >
            <UltraFastRankingTemplate initialData={result.data} />
        </Suspense>
    );
}
