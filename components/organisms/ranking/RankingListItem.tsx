import React from "react";
import { Crown } from "lucide-react";

interface RankingListItemProps {
    rank: number;
    name: string;
    score: number;
}

const RankingListItem: React.FC<RankingListItemProps> = ({
    rank,
    name,
    score,
}) => {
    const isFirst = rank === 1;

    const getRankDisplay = () => {
        switch (rank) {
            case 1:
                return "1";
            case 2:
                return "2";
            case 3:
                return "3";
            default:
                return rank.toString();
        }
    };

    return (
        <div
            className={`flex items-center px-4 rounded-rh-lg ${
                isFirst
                    ? "h-16 bg-gradient-to-r from-[#5B8FE0] to-[#7AB4F5]"
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
                    {getRankDisplay()}
                </span>
            </div>

            {/* 이름 + 부가 정보 */}
            <div className="flex-1 ml-3">
                <span
                    className={`text-sm font-${isFirst ? "semibold" : "medium"} text-white`}
                >
                    {name}
                </span>
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

export default RankingListItem;
