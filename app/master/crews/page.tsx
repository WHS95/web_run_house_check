import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import * as 마스터워크플로우 from "@/lib/domain/master/workflows";
import { 크루목록VM_조립 } from "./_vm/list";
import CrewListClient from "./_components/CrewListClient";
import HomeAction from "../_components/HomeAction";

export const dynamic = "force-dynamic";

export default async function MasterCrewsPage() {
    const items = await 크루목록VM_조립();
    const summary = 마스터워크플로우.활동상태_집계(items);

    return (
        <div className="flex flex-col">
            <PageHeader
                title="크루 관리"
                rightAction={
                    <div className="flex items-center gap-1">
                        <a
                            href="/master/crews/new"
                            className="text-[14px] font-medium text-rh-accent px-2"
                        >
                            + 등록
                        </a>
                        <HomeAction />
                    </div>
                }
            />
            <FadeIn className="px-4 pt-4 pb-6 space-y-4">
                <SummaryStrip
                    summary={summary}
                    total={items.length}
                />
                <CrewListClient items={items} />
            </FadeIn>
        </div>
    );
}

interface SummaryStripProps {
    summary: { active: number; idle: number; dormant: number };
    total: number;
}

function SummaryStrip({ summary, total }: SummaryStripProps) {
    const chips: ReadonlyArray<{ label: string; value: number; tone: string }> = [
        {
            label: "전체",
            value: total,
            tone: "bg-rh-bg-surface text-rh-text-secondary",
        },
        {
            label: "활성",
            value: summary.active,
            tone: "bg-rh-status-success/20 text-rh-status-success",
        },
        {
            label: "정체",
            value: summary.idle,
            tone: "bg-rh-status-warning/20 text-rh-status-warning",
        },
        {
            label: "휴면",
            value: summary.dormant,
            tone: "bg-rh-status-error/20 text-rh-status-error",
        },
    ];

    return (
        <div className="flex items-center gap-2 overflow-x-auto">
            {chips.map((c) => (
                <span
                    key={c.label}
                    className={
                        "shrink-0 rounded-full px-3 py-1 text-[12px] font-medium " +
                        c.tone
                    }
                >
                    {c.label} {c.value}
                </span>
            ))}
        </div>
    );
}
