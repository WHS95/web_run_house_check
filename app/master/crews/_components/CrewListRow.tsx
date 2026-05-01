import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
    CrewActivityStatus,
    CrewListItem,
} from "@/lib/domain/master/types";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const STATUS_LABEL: Record<CrewActivityStatus, string> = {
    active: "활성",
    idle: "정체",
    dormant: "휴면",
};

const STATUS_BADGE: Record<CrewActivityStatus, string> = {
    active: "bg-rh-status-success/20 text-rh-status-success",
    idle: "bg-rh-status-warning/20 text-rh-status-warning",
    dormant: "bg-rh-status-error/20 text-rh-status-error",
};

interface CrewListRowProps {
    crew: CrewListItem;
}

export default function CrewListRow({ crew }: CrewListRowProps) {
    const lastLabel = (() => {
        if (!crew.last_attendance_at) return "출석 없음";
        const d = new Date(crew.last_attendance_at);
        if (Number.isNaN(d.getTime())) return "-";
        return dateFormatter.format(d);
    })();

    return (
        <Link
            href={`/master/crews/${crew.id}`}
            className="flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3 active:opacity-70 transition-opacity"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-white truncate">
                        {crew.name}
                    </p>
                    <span
                        className={
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                            STATUS_BADGE[crew.activity_status]
                        }
                    >
                        {STATUS_LABEL[crew.activity_status]}
                    </span>
                </div>
                <p className="text-[11px] text-rh-text-tertiary mt-0.5 truncate">
                    {crew.member_count}명 · 30일 출석{" "}
                    {crew.attendance_30d}회 · {lastLabel}
                </p>
            </div>
            <ChevronRight
                size={18}
                className="shrink-0 text-rh-text-muted"
            />
        </Link>
    );
}
