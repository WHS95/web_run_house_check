import { memo } from "react";
import AdminBadge from "./AdminBadge";

interface AttendanceRowProps {
    name: string;
    detail: string;
    status?: "present" | "late" | "absent";
    badgeText?: string;
    onClick?: () => void;
}

const statusDotColor: Record<string, string> = {
    present: "bg-rh-status-success",
    late: "bg-rh-status-warning",
    absent: "bg-rh-status-error",
};

const AttendanceRow = memo(function AttendanceRow({
    name,
    detail,
    status = "present",
    badgeText,
    onClick,
}: AttendanceRowProps) {
    return (
        <button
            className="w-full flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3"
            onClick={onClick}
        >
            <div
                className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor[status]}`}
            />
            <div className="flex-1 flex flex-col gap-0.5 text-left">
                <span className="text-sm font-semibold text-white">
                    {name}
                </span>
                <span className="text-xs text-rh-text-secondary">
                    {detail}
                </span>
            </div>
            {badgeText && (
                <AdminBadge variant="accent">{badgeText}</AdminBadge>
            )}
        </button>
    );
});

export default AttendanceRow;
