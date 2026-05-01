"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Ticket,
    Bell,
} from "lucide-react";

const TABS = [
    {
        href: "/master",
        label: "대시보드",
        Icon: LayoutDashboard,
        match: (p: string) => p === "/master",
    },
    {
        href: "/master/crews",
        label: "크루",
        Icon: Users,
        match: (p: string) => p.startsWith("/master/crews"),
    },
    {
        href: "/master/invites",
        label: "초대코드",
        Icon: Ticket,
        match: (p: string) => p.startsWith("/master/invites"),
    },
    {
        href: "/master/push",
        label: "푸시",
        Icon: Bell,
        match: (p: string) => p.startsWith("/master/push"),
    },
] as const;

export default function MasterNav() {
    const pathname = usePathname() || "/master";

    return (
        <nav
            aria-label="마스터 네비게이션"
            className="shrink-0 h-[68px] bg-rh-bg-surface border-t border-rh-border"
            style={{
                paddingBottom:
                    "env(safe-area-inset-bottom, 0px)",
            }}
        >
            <ul className="flex items-stretch h-full">
                {TABS.map(({ href, label, Icon, match }) => {
                    const isActive = match(pathname);
                    return (
                        <li
                            key={href}
                            className="flex-1"
                        >
                            <Link
                                href={href}
                                aria-current={
                                    isActive
                                        ? "page"
                                        : undefined
                                }
                                className={
                                    "flex flex-col items-center justify-center gap-1 h-full active:opacity-70 transition-opacity " +
                                    (isActive
                                        ? "text-rh-accent"
                                        : "text-rh-text-secondary")
                                }
                            >
                                <Icon size={22} />
                                <span className="text-[11px] font-medium">
                                    {label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
