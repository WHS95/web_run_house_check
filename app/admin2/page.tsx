import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getDashboardStats } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import SectionLabel from "@/components/atoms/SectionLabel";
import MenuListItem from "@/components/molecules/MenuListItem";
import DashboardMonthNav from "./components/DashboardMonthNav";
import DashboardStatCards from "./components/DashboardStatCards";

const menuItems = [
    {
        title: "회원 관리",
        subtitle: "48명 · 활성 45명",
        href: "/admin2/user",
    },
    {
        title: "출석 관리",
        subtitle: "이번 달 출석 기록",
        href: "/admin2/attendance",
    },
    {
        title: "통계 분석",
        subtitle: "요일별 · 장소별 참여율",
        href: "/admin2/analyze",
    },
    {
        title: "설정",
        subtitle: "장소 · 운영진 · 초대코드",
        href: "/admin2/settings",
    },
];

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
            <div className="sticky top-0 z-50 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="관리자 대시보드"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 px-4 pt-4 pb-4 space-y-5">
                <DashboardMonthNav year={year} month={month} />

                <Suspense fallback={<StatCardsSkeleton />}>
                    <DashboardStatCardsServer
                        crewId={crewId}
                        year={year}
                        month={month}
                    />
                </Suspense>

                {/* 관리 메뉴 — .pen Screen/AdminDashboard */}
                <SectionLabel>관리 메뉴</SectionLabel>
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <MenuListItem
                            key={item.href}
                            title={item.title}
                            subtitle={item.subtitle}
                            href={item.href}
                        />
                    ))}
                </div>
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

