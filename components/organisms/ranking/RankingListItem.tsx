import React from "react";

interface RankingListItemProps {
    rank: number;
    name: string;
    score: number;
    isCurrentUser?: boolean;
    scoreLabel?: string;
}

/**
 * v2 라임 카토그래픽 — 일반(4위~) 랭킹 row.
 * - 1위(라임 podium)는 별도 컴포넌트(TopPodium)에서 처리하므로 여기서는 다루지 않음.
 * - 본인 row는 라임 tint 배경 + YOU chip.
 * - 수치는 rh-mono로 모노스페이스 정렬.
 */
const RankingListItem: React.FC<RankingListItemProps> = ({
    rank,
    name,
    score,
    isCurrentUser,
    scoreLabel = "출석",
}) => {
    const baseClass = isCurrentUser
        ? "bg-rh-accent/10 border border-rh-accent/40"
        : "bg-rh-bg-surface border border-transparent";

    return (
        <div
            className={`flex items-center gap-3 px-4 h-14 rounded-rh-lg ${baseClass}`}
        >
            {/* 순위 */}
            <div className="flex justify-center items-center w-8 shrink-0">
                <span
                    className={`text-base font-semibold rh-mono ${
                        isCurrentUser
                            ? "text-rh-accent"
                            : "text-rh-text-secondary"
                    }`}
                >
                    {rank}
                </span>
            </div>

            {/* 아바타 */}
            <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-semibold ${
                    isCurrentUser
                        ? "bg-rh-accent text-rh-text-inverted"
                        : "bg-rh-bg-inset text-rh-text-tertiary"
                }`}
                aria-hidden
            >
                {(name || "?").slice(0, 1)}
            </div>

            {/* 이름 + YOU chip */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="text-rh-body font-medium text-rh-text-primary truncate">
                    {name}
                </span>
                {isCurrentUser && (
                    <span
                        className="rh-chip shrink-0"
                        data-on="true"
                        style={{ padding: "2px 7px", fontSize: 10 }}
                    >
                        YOU
                    </span>
                )}
            </div>

            {/* 수치 */}
            <div className="shrink-0 text-right">
                <span
                    className={`rh-mono text-[15px] font-semibold ${
                        isCurrentUser
                            ? "text-rh-accent"
                            : "text-rh-text-primary"
                    }`}
                >
                    {score}
                </span>
                <span className="ml-1 text-[11px] text-rh-text-tertiary">
                    {scoreLabel}
                </span>
            </div>
        </div>
    );
};

export default React.memo(RankingListItem);
