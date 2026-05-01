import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import { 대시보드VM_조립 } from "./_vm/dashboard";
import KpiCard from "./_components/KpiCard";
import IdleCrewItem from "./_components/IdleCrewItem";
import RecentSignupItem from "./_components/RecentSignupItem";
import QuickActions from "./_components/QuickActions";

export const dynamic = "force-dynamic";

export default async function MasterDashboardPage() {
    const vm = await 대시보드VM_조립();

    return (
        <div className="flex flex-col">
            <PageHeader title="마스터" iconColor="white" />
            <FadeIn className="px-4 pt-4 pb-6 space-y-6">
                {/* KPI 그리드 */}
                <section aria-label="서비스 KPI">
                    <h2 className="text-[14px] font-semibold text-white mb-3">
                        서비스 KPI
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <KpiCard
                            label="전체 크루"
                            value={vm.kpi.total_crews}
                        />
                        <KpiCard
                            label="전체 유저"
                            value={vm.kpi.total_users}
                        />
                        <KpiCard
                            label="30일 출석"
                            value={vm.kpi.attendance_30d}
                        />
                        <KpiCard
                            label="활성 크루"
                            value={vm.kpi.active_crews}
                            highlight
                        />
                    </div>
                </section>

                {/* 빠른 액션 */}
                <section aria-label="빠른 액션">
                    <QuickActions />
                </section>

                {/* 최근 가입 크루 */}
                <section aria-label="최근 가입 크루">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-semibold text-white">
                            최근 가입 크루
                        </h2>
                        <a
                            href="/master/crews"
                            className="text-[12px] text-rh-accent"
                        >
                            전체 보기
                        </a>
                    </div>
                    {vm.recent_signups.length === 0 ? (
                        <EmptyHint text="최근 가입 크루가 없습니다" />
                    ) : (
                        <AnimatedList className="space-y-2">
                            {vm.recent_signups.map((c) => (
                                <AnimatedItem key={c.id}>
                                    <RecentSignupItem
                                        crew={c}
                                    />
                                </AnimatedItem>
                            ))}
                        </AnimatedList>
                    )}
                </section>

                {/* 정체 / 휴면 크루 */}
                <section aria-label="정체·휴면 크루">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-semibold text-white">
                            정체 / 휴면 크루
                        </h2>
                        <span className="text-[12px] text-rh-text-tertiary">
                            14일+ 출석 없음
                        </span>
                    </div>
                    {vm.idle_crews.length === 0 ? (
                        <EmptyHint text="모든 크루가 활성 상태입니다" />
                    ) : (
                        <AnimatedList className="space-y-2">
                            {vm.idle_crews.map((c) => (
                                <AnimatedItem key={c.id}>
                                    <IdleCrewItem
                                        crew={c}
                                    />
                                </AnimatedItem>
                            ))}
                        </AnimatedList>
                    )}
                </section>
            </FadeIn>
        </div>
    );
}

function EmptyHint({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center py-8 rounded-xl bg-rh-bg-surface">
            <p className="text-sm text-rh-text-tertiary">
                {text}
            </p>
        </div>
    );
}
