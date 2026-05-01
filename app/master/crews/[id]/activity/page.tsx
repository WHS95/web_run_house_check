import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import { 크루상세VM_조립 } from "../_vm/detail";
import { 크루활동VM_조립 } from "./_vm/activity";
import DailyAttendanceChart from "./_components/DailyAttendanceChart";
import HostRankingList from "./_components/HostRankingList";
import RecentAttendanceItem from "./_components/RecentAttendanceItem";

export const dynamic = "force-dynamic";

interface CrewActivityPageProps {
    params: { id: string };
}

function SectionTitle({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-white">
                {title}
            </h2>
            {subtitle && (
                <span className="text-[11px] text-rh-text-tertiary">
                    {subtitle}
                </span>
            )}
        </div>
    );
}

function EmptyHint({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center py-8 rounded-xl bg-rh-bg-surface">
            <p className="text-sm text-rh-text-tertiary">{text}</p>
        </div>
    );
}

export default async function CrewActivityPage({
    params,
}: CrewActivityPageProps) {
    const detail = await 크루상세VM_조립(params.id);
    if (!detail) notFound();

    const activity = await 크루활동VM_조립(params.id, 30);

    return (
        <div className="flex flex-col">
            <PageHeader
                title={`활동: ${detail.crew.name}`}
                backLink={`/master/crews/${params.id}`}
            />
            <FadeIn className="px-4 pt-4 pb-6 space-y-5">
                <section aria-label="일자별 출석">
                    <SectionTitle
                        title="일자별 출석"
                        subtitle="최근 30일"
                    />
                    <DailyAttendanceChart
                        days={activity.daily}
                        totalDays={30}
                    />
                </section>

                <section aria-label="호스트 Top 5">
                    <SectionTitle
                        title="호스트 Top 5"
                        subtitle="최근 30일"
                    />
                    <HostRankingList rankings={activity.host_top} />
                </section>

                <section aria-label="최근 출석">
                    <SectionTitle
                        title="최근 출석"
                        subtitle={`총 ${activity.recent.length}건`}
                    />
                    {activity.recent.length === 0 ? (
                        <EmptyHint text="출석 기록이 없습니다" />
                    ) : (
                        <AnimatedList className="space-y-2">
                            {activity.recent.map((r) => (
                                <AnimatedItem key={r.id}>
                                    <RecentAttendanceItem record={r} />
                                </AnimatedItem>
                            ))}
                        </AnimatedList>
                    )}
                </section>
            </FadeIn>
        </div>
    );
}
