import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getDashboardStats } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import SectionLabel from "@/components/atoms/SectionLabel";
import AdminStatCard from "./components/ui/AdminStatCard";
import DashboardContent from "./components/DashboardContent";

// 월 선택은 searchParams로 처리 (RSC 친화적)
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
                    fallback={<DashboardSkeleton year={year} month={month} />}
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

// 서버 컴포넌트: 데이터 fetch 후 클라이언트에 전달
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

// 스켈레톤 (정적, animate-pulse 사용 금지)
function DashboardSkeleton({
    year,
    month,
}: {
    year: number;
    month: number;
}) {
    return (
        <>
            {/* MonthNav 자리 */}
            <div className="flex items-center justify-center h-10">
                <span className="text-base font-semibold text-white">
                    {year}년 {month}월
                </span>
            </div>

            {/* StatCards 스켈레톤 */}
            <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={
                            "flex-1 h-[90px]"
                            + " bg-rh-bg-surface rounded-xl"
                        }
                    />
                ))}
            </div>

            {/* 관리 메뉴 스켈레톤 */}
            <div className="h-4 w-16 bg-rh-bg-surface rounded" />
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={
                            "h-[60px] bg-rh-bg-surface rounded-xl"
                        }
                    />
                ))}
            </div>
        </>
    );
}
