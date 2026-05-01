import KpiCard from "../../../_components/KpiCard";
import type { CrewDetailViewModel } from "../_vm/detail";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

interface CrewKpiGridProps {
    kpi: CrewDetailViewModel["kpi"];
}

export default function CrewKpiGrid({ kpi }: CrewKpiGridProps) {
    const lastLabel = (() => {
        if (!kpi.last_attendance_at) return "출석 기록 없음";
        const d = new Date(kpi.last_attendance_at);
        if (Number.isNaN(d.getTime())) return "-";
        return dateTimeFormatter.format(d);
    })();

    return (
        <section aria-label="크루 KPI">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-semibold text-white">
                    최근 30일 KPI
                </h2>
                <span className="text-[11px] text-rh-text-tertiary">
                    마지막 출석 {lastLabel}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <KpiCard label="멤버 수" value={kpi.member_count} />
                <KpiCard
                    label="30일 출석"
                    value={kpi.attendance_30d}
                    highlight
                />
                <KpiCard
                    label="30일 호스트"
                    value={kpi.host_count_30d}
                />
                <KpiCard
                    label="30일 활성 멤버"
                    value={kpi.active_member_count_30d}
                />
            </div>
        </section>
    );
}
