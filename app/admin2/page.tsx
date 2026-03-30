import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getDashboardStats } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import DashboardContent from "./components/DashboardContent";

export default async function Admin2DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;
    const now = new Date();
    const year = params.year
        ? parseInt(params.year)
        : now.getFullYear();
    const month = params.month
        ? parseInt(params.month)
        : now.getMonth() + 1;

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="관리자 대시보드"
                backLink=""
                iconColor="white"
                backgroundColor="bg-rh-bg-surface"
            />
            <div className="flex-1 px-4 pt-4 pb-4 space-y-5">
                <Suspense
                    fallback={
                        <DashboardSkeleton
                            year={year}
                            month={month}
                        />
                    }
                >
                    <DashboardContentServer
                        crewId={crewId}
                        year={year}
                        month={month}
                    />
                </Suspense>
            </div>
        </div>
    );
}

async function DashboardContentServer({
    crewId,
    year,
    month,
}: {
    crewId: string;
    year: number;
    month: number;
}) {
    const stats = await getDashboardStats(crewId, year, month);
    return (
        <DashboardContent
            year={year}
            month={month}
            totalMembers={stats.totalMembers}
            monthlyParticipationCount={
                stats.monthlyParticipationCount
            }
            monthlyHostCount={stats.monthlyHostCount}
        />
    );
}

function DashboardSkeleton({
    year,
    month,
}: {
    year: number;
    month: number;
}) {
    return (
        <>
            <div className="flex items-center justify-center h-10">
                <span className="text-base font-semibold text-white">
                    {year}년 {month}월
                </span>
            </div>
            <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex-1 h-[90px] bg-rh-bg-surface rounded-xl"
                    />
                ))}
            </div>
        </>
    );
}
