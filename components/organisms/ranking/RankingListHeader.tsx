import React from "react";

interface RankingListHeaderProps {
    headers: string[];
}

/**
 * v2 라임 카토그래픽 — 리스트 컬럼 헤더 (예비 / 현재 메인 화면에서 미사용).
 */
const RankingListHeader: React.FC<RankingListHeaderProps> = ({
    headers,
}) => {
    return (
        <div className="flex sticky top-0 z-20 justify-between px-4 py-1.5 rh-eye bg-rh-bg-surface border-b border-rh-border">
            <span className="w-1/6 text-center">
                {headers[0] || "순위"}
            </span>
            <span className="w-2/6 text-center">
                {headers[2] || "이름"}
            </span>
            <span className="w-2/6 text-center">
                {headers[3] || "횟수"}
            </span>
        </div>
    );
};

export default RankingListHeader;
