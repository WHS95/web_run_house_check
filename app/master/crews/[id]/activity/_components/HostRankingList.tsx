import type { CrewHostRanking } from "@/lib/domain/master/types";

interface HostRankingListProps {
    rankings: CrewHostRanking[];
}

const RANK_BADGE: Record<number, string> = {
    1: "bg-rh-accent text-white",
    2: "bg-rh-bg-muted text-white",
    3: "bg-rh-bg-muted text-white",
    4: "bg-rh-bg-inset text-rh-text-secondary",
    5: "bg-rh-bg-inset text-rh-text-secondary",
};

export default function HostRankingList({
    rankings,
}: HostRankingListProps) {
    if (rankings.length === 0) {
        return (
            <div className="rounded-xl bg-rh-bg-surface px-4 py-8 text-center">
                <p className="text-sm text-rh-text-tertiary">
                    호스팅 기록이 없습니다
                </p>
            </div>
        );
    }

    return (
        <ul className="space-y-2">
            {rankings.map((r, idx) => {
                const rank = idx + 1;
                const badgeClass =
                    RANK_BADGE[rank] ??
                    "bg-rh-bg-inset text-rh-text-secondary";
                return (
                    <li
                        key={r.user_id}
                        className="flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3"
                    >
                        <span
                            className={
                                "shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-semibold " +
                                badgeClass
                            }
                        >
                            {rank}
                        </span>
                        <span className="flex-1 min-w-0 text-[14px] font-medium text-white truncate">
                            {r.user_name ?? "익명"}
                        </span>
                        <span className="shrink-0 text-[13px] text-rh-text-secondary">
                            호스팅 {r.host_count}회
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
