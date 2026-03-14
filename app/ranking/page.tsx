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

export const dynamic = "force-dynamic";

export const metadata = {
    title: "랭킹 | RUNHOUSE",
    description: "RUNHOUSE 크루 랭킹 - 출석 및 개설 랭킹을 확인하세요",
};

interface RankingPageProps {
    searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
    const params = await searchParams;
    const now = new Date();
    const year = parseInt(params.year || "") || now.getFullYear();
    const month = parseInt(params.month || "") || now.getMonth() + 1;

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
