import Link from "next/link";
import { PlusCircle, Ticket, Bell } from "lucide-react";

const ACTIONS = [
    {
        href: "/master/crews/new",
        label: "크루 등록",
        Icon: PlusCircle,
    },
    {
        href: "/master/invites",
        label: "초대코드",
        Icon: Ticket,
    },
    {
        href: "/master/push",
        label: "푸시",
        Icon: Bell,
    },
] as const;

export default function QuickActions() {
    return (
        <div>
            <h2 className="text-[14px] font-semibold text-white mb-3">
                빠른 액션
            </h2>
            <div className="grid grid-cols-3 gap-3">
                {ACTIONS.map(({ href, label, Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl bg-rh-bg-surface py-4 active:opacity-70 transition-opacity"
                    >
                        <Icon
                            size={22}
                            className="text-rh-accent"
                        />
                        <span className="text-[12px] font-medium text-white">
                            {label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
