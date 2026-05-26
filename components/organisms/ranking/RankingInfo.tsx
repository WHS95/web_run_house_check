import React from "react";

interface RankingInfoProps {
    date: string;
    totalMembers: number;
    currentRank: number;
}

/**
 * v2 라임 카토그래픽 — 나의 랭킹 요약 (예비 / 현재 메인 화면에서 미사용).
 * 시간 의존(`new Date()`) hydration 회피용으로 SSR/Client 동일 결과를 위해
 * 입력 dateStr을 단순 파싱한다.
 */
const RankingInfo: React.FC<RankingInfoProps> = ({
    date,
    totalMembers,
    currentRank,
}) => {
    const d = new Date(date);
    const formattedDate = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;

    return (
        <div className="flex flex-col items-center justify-center mb-0.5">
            <p className="rh-eye">{formattedDate}</p>
            <p className="rh-display text-[1.5rem] text-rh-text-primary">
                나의 랭킹 <span className="text-rh-accent">{currentRank}</span>위
            </p>
            <p className="text-[0.75rem] text-rh-text-tertiary">
                전체 인원 {totalMembers}명
            </p>
        </div>
    );
};

export default RankingInfo;
