import React from "react";
import { Crown } from "lucide-react";

interface RankingListItemProps {
    rank: number;
    name: string;
    score: number;
    isCurrentUser?: boolean;
}

const RankingListItem: React.FC<RankingListItemProps> = ({
    rank,
    name,
    score,
    isCurrentUser,
}) => {
    const isFirst = rank === 1;
    const highlight = isCurrentUser && !isFirst;

    return (
        <div
            className={`flex items-center px-4 rounded-rh-lg ${
                isFirst
                    ? "h-16 bg-gradient-to-r from-[#5B8FE0] to-[#7AB4F5]"
                    : highlight
                    ? "h-14 bg-rh-accent/10 border-l-2 border-rh-accent"
                    : "h-14 bg-rh-bg-surface border-b border-rh-border"
            }`}
        >
            {/* 순위 */}
            <div className="w-8 flex items-center justify-center">
                <span
                    className={`font-bold ${
                        isFirst
                            ? "text-xl text-white"
                            : rank <= 3
                            ? "text-base text-rh-text-secondary"
                            : "text-sm text-rh-text-secondary"
                    }`}
                >
                    {rank}
                </span>
            </div>

            {/* 이름 + 부가 정보 */}
            <div className="flex-1 ml-3">
                <div className="flex items-center gap-1.5">
                    <span
                        className={`text-sm font-${isFirst ? "semibold" : "medium"} text-white`}
                    >
                        {name}
                    </span>
                    {isCurrentUser && (
                        <span className="bg-rh-accent text-white text-[10px] rounded-full px-1.5 leading-4">
                            나
                        </span>
                    )}
                </div>
                <p
                    className={`text-xs ${
                        isFirst ? "text-white/75" : "text-rh-text-tertiary"
                    }`}
                >
                    출석 {score}회
                </p>
            </div>

            {/* 1위 왕관 */}
            {isFirst && (
                <Crown className="w-[22px] h-[22px] text-[#FBBF24]" />
            )}
        </div>
    );
};

export default React.memo(RankingListItem);
