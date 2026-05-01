import Link from "next/link";
import {
    BarChart3,
    Users,
    Ticket,
    Pencil,
    ChevronRight,
    type LucideIcon,
} from "lucide-react";

interface CrewSubMenuProps {
    crewId: string;
}

interface MenuItem {
    href: string;
    label: string;
    description: string;
    Icon: LucideIcon;
}

export default function CrewSubMenu({ crewId }: CrewSubMenuProps) {
    const items: MenuItem[] = [
        {
            href: `/master/crews/${crewId}/activity`,
            label: "활동 점검",
            description: "일자별 출석 · 호스트 Top",
            Icon: BarChart3,
        },
        {
            href: `/master/crews/${crewId}/members`,
            label: "멤버 관리",
            description: "참여자 목록 · 권한",
            Icon: Users,
        },
        {
            href: `/master/crews/${crewId}/invites`,
            label: "초대코드",
            description: "초대코드 생성 · 관리",
            Icon: Ticket,
        },
        {
            href: `/master/crews/${crewId}/edit`,
            label: "수정",
            description: "크루 메타 · 위치 설정",
            Icon: Pencil,
        },
    ];

    return (
        <section aria-label="서브 메뉴">
            <h2 className="text-[14px] font-semibold text-white mb-3">
                관리 메뉴
            </h2>
            <ul className="space-y-2">
                {items.map(({ href, label, description, Icon }) => (
                    <li key={href}>
                        <Link
                            href={href}
                            className="flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3 active:opacity-70 transition-opacity"
                        >
                            <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-rh-bg-muted">
                                <Icon
                                    size={18}
                                    className="text-rh-accent"
                                />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-[14px] font-semibold text-white">
                                    {label}
                                </span>
                                <span className="block text-[11px] text-rh-text-tertiary mt-0.5">
                                    {description}
                                </span>
                            </span>
                            <ChevronRight
                                size={18}
                                className="shrink-0 text-rh-text-muted"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
