import React from "react";
import { ChevronRight } from "lucide-react";

interface MenuListItemProps {
    title: string;
    subtitle: string;
    onClick?: () => void;
}

const MenuListItem: React.FC<MenuListItemProps> = ({
    title,
    subtitle,
    onClick,
}) => (
    <button
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-rh-md bg-rh-bg-surface px-4 py-3 text-left active:scale-[0.98] transition-transform"
    >
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-white">{title}</span>
            <span className="text-xs text-rh-text-tertiary">{subtitle}</span>
        </div>
        <ChevronRight className="h-[18px] w-[18px] shrink-0 text-rh-text-muted" />
    </button>
);

export default MenuListItem;
