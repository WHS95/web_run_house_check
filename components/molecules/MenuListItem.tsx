import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MenuListItemProps {
    title: string;
    subtitle: string;
    onClick?: () => void;
    href?: string;
}

const MenuListItem: React.FC<MenuListItemProps> = ({
    title,
    subtitle,
    onClick,
    href,
}) => {
    const className =
        "flex w-full items-center justify-between rounded-rh-md bg-rh-bg-surface px-4 py-3 text-left active:scale-[0.98] transition-transform";

    const content = (
        <>
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white">
                    {title}
                </span>
                <span className="text-xs text-rh-text-tertiary">
                    {subtitle}
                </span>
            </div>
            <ChevronRight className="h-[18px] w-[18px] shrink-0 text-rh-text-muted" />
        </>
    );

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    );
};

export default MenuListItem;
