import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RecentSignupCrew } from "@/lib/domain/master/types";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

export default function RecentSignupItem({
    crew,
}: {
    crew: RecentSignupCrew;
}) {
    const createdAt = new Date(crew.created_at);
    const createdLabel = Number.isNaN(createdAt.getTime())
        ? "-"
        : dateFormatter.format(createdAt);

    return (
        <Link
            href={`/master/crews/${crew.id}`}
            className="flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3 active:opacity-70 transition-opacity"
        >
            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white truncate">
                    {crew.name}
                </p>
                <p className="text-[11px] text-rh-text-tertiary mt-0.5">
                    {crew.member_count}명 · 가입일{" "}
                    {createdLabel}
                </p>
            </div>
            <ChevronRight
                size={18}
                className="shrink-0 text-rh-text-muted"
            />
        </Link>
    );
}
