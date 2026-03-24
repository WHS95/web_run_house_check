import { memo } from "react";
import AdminBadge from "./AdminBadge";

interface PushHistoryItemProps {
    title: string;
    date: string;
    target: string;
    status: string;
}

const PushHistoryItem = memo(function PushHistoryItem({
    title,
    date,
    target,
    status,
}: PushHistoryItemProps) {
    return (
        <div className="flex flex-col gap-1.5 rounded-xl bg-rh-bg-surface px-4 py-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                    {title}
                </span>
                <span className="text-[11px] text-rh-text-tertiary">
                    {date}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-rh-text-secondary">
                    {target}
                </span>
                <AdminBadge variant="outline">{status}</AdminBadge>
            </div>
        </div>
    );
});

export default PushHistoryItem;
