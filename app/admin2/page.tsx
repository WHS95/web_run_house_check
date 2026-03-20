import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getDashboardStats } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import DashboardMonthNav from "./components/DashboardMonthNav";
import DashboardStatCards from "./components/DashboardStatCards";

// 월 선택은 searchParams로 처리 (RSC 친화적)
export default async function Admin2DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;
    const now = new Date();
    const year = params.year ? parseInt(params.year) : now.getFullYear();
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

    return (
        <>
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="관리자 대시보드"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 scroll-area-bottom space-y-5">
                <DashboardMonthNav year={year} month={month} />

                <Suspense fallback={<StatCardsSkeleton />}>
                    <DashboardStatCardsServer
                        crewId={crewId}
                        year={year}
                        month={month}
                    />
                </Suspense>

            </div>
        </>
    );
}

// 서버 컴포넌트: 데이터 fetch 후 props 전달
async function DashboardStatCardsServer({
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
        <DashboardStatCards
            totalMembers={stats.totalMembers}
            monthlyParticipationCount={stats.monthlyParticipationCount}
            monthlyHostCount={stats.monthlyHostCount}
        />
    );
}

function StatCardsSkeleton() {
    return (
        <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="flex-1 h-[90px] bg-rh-bg-surface rounded-[12px]"
                />
            ))}
        </div>
    );
}

