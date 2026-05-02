import type { CrewActivityRecent } from "@/lib/domain/master/types";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
});

interface RecentAttendanceItemProps {
    record: CrewActivityRecent;
}

export default function RecentAttendanceItem({
    record,
}: RecentAttendanceItemProps) {
    const ts = new Date(record.attendance_timestamp);
    const tsLabel = Number.isNaN(ts.getTime())
        ? "-"
        : dateTimeFormatter.format(ts);

    const exercise = record.exercise_type_name?.trim() || null;
    const location = record.location?.trim() || null;
    const subtitleParts = [exercise, location].filter(
        (v): v is string => Boolean(v)
    );

    return (
        <div className="flex items-start gap-3 rounded-xl bg-rh-bg-surface px-4 py-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-white truncate">
                        {record.user_name ?? "익명"}
                    </p>
                    {record.is_host && (
                        <span className="shrink-0 rounded-full bg-rh-accent/20 text-rh-accent px-2 py-0.5 text-[10px] font-medium">
                            호스트
                        </span>
                    )}
                </div>
                {subtitleParts.length > 0 && (
                    <p className="text-[12px] text-rh-text-tertiary mt-0.5 truncate">
                        {subtitleParts.join(" · ")}
                    </p>
                )}
            </div>
            <span className="shrink-0 text-[12px] text-rh-text-secondary">
                {tsLabel}
            </span>
        </div>
    );
}
