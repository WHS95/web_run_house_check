"use client";
import { memo, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { haptic } from "@/lib/haptic";

interface AdminListItemProps {
    title: string;
    subtitle?: string;
    href?: string;
    onClick?: () => void;
}

const AdminListItem = memo(function AdminListItem({
    title,
    subtitle,
    href,
    onClick,
}: AdminListItemProps) {
    const { navigate } = useNavigation();

    const handleClick = useCallback(() => {
        haptic.light();
        if (onClick) {
            onClick();
        } else if (href) {
            navigate(href);
        }
    }, [onClick, href, navigate]);

    return (
        <button
            className="w-full flex items-center justify-between rounded-xl bg-rh-bg-surface px-4 py-3"
            onClick={handleClick}
        >
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white text-left">
                    {title}
                </span>
                {subtitle && (
                    <span className="text-xs text-rh-text-secondary text-left">
                        {subtitle}
                    </span>
                )}
            </div>
            <ChevronRight
                size={18}
                className="text-rh-text-muted shrink-0"
            />
        </button>
    );
});

export default AdminListItem;
