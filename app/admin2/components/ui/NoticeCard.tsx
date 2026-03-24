import { memo } from "react";
import AdminBadge from "./AdminBadge";

interface NoticeCardProps {
    badge: string;
    badgeVariant?: "accent" | "outline" | "muted";
    date: string;
    title: string;
    description: string;
    onClick?: () => void;
}

const NoticeCard = memo(function NoticeCard({
    badge,
    badgeVariant = "accent",
    date,
    title,
    description,
    onClick,
}: NoticeCardProps) {
    return (
        <button
            className="w-full flex flex-col gap-2.5 rounded-xl bg-rh-bg-surface p-4 text-left"
            onClick={onClick}
        >
            <div className="flex items-center justify-between w-full">
                <AdminBadge variant={badgeVariant}>
                    {badge}
                </AdminBadge>
                <span className="text-[11px] text-rh-text-tertiary">
                    {date}
                </span>
            </div>
            <span className="text-[15px] font-semibold text-white">
                {title}
            </span>
            <p className="text-[13px] text-rh-text-secondary leading-[1.4]">
                {description}
            </p>
        </button>
    );
});

export default NoticeCard;
