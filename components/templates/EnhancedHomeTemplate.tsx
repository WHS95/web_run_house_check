'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../organisms/Header';
import Hero from '../organisms/Hero';
import NoticeBar from '../molecules/NoticeBar';
import RankingCard from '../molecules/RankingCard';
import AttendanceCard from '../molecules/AttendanceCard';

interface EnhancedHomeTemplateProps {
    username: string | null;
    rankName: string | null;
    crewName: string | null;
    noticeText: string | null;
}

const EnhancedHomeTemplate: React.FC<EnhancedHomeTemplateProps> = ({
    username,
    rankName,
    crewName,
    noticeText,
}) => {
    console.log("EnhancedHomeTemplate noticeText:", noticeText);
    const router = useRouter();

    // 랭킹 페이지로 이동 - 최적화
    const handleSwipeToRanking = useCallback(() => {
        // haptic 피드백을 비동기로 처리하여 UI 블로킹 방지
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        router.push('/ranking');
    }, [router]);

    return (
        <div >
            {/* 🔒 헤더 - Header 컴포넌트에서 fixed 처리됨 */}
            <Header title={"RUN HOUSE"} />

            {/* 📢 공지사항 - 헤더 바로 아래 고정 */}
            {noticeText && (
                <div className="fixed top-20 left-0 right-0 z-40 px-4 pt-safe">
                    <NoticeBar noticeText={noticeText} />
                </div>
            )}

            {/* 📱 Hero 영역 - 공지사항 아래에 위치 */}
            <div className="relative min-h-screen">
                {/* Hero 배경 - 가운데 정렬 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {username && (
                        <div className="relative w-full">
                            {/* Hero 전체 화면 높이로 설정 */}
                            <div className="relative w-full flex items-center justify-center">
                                <div className="max-w-md mx-auto text-center px-4">
                                    <p className="text-2xl font-light leading-[1.3] text-left text-white">
                                        안녕하세요 👋🏻
                                        <br />
                                        {crewName && (
                                            <span className="text-2xl font-bold text-[#95bdf4]">
                                                {crewName}
                                            </span>
                                        )}
                                        <br />
                                        <span className="text-2xl font-bold text-white">
                                            {username} 님,
                                        </span>
                                        <br />
                                        오늘도 즐거운
                                        <br />
                                        러닝 하세요!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 🔒 하단 카드 섹션 - 하단 완전 고정 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-basic-gray">
                <div className="pb-safe">
                    {/* 카드 스택 컨테이너 */}
                    <div className="relative h-[160px]">
                        {/* 출석 체크 카드 - 상단에 위치 */}
                        <div className="absolute bottom-[80px] left-0 right-0 z-20">
                            <div className="native-card hw-accelerated">
                                <AttendanceCard />
                            </div>
                        </div>

                        {/* 랭킹 카드 - 가장 하단에 위치 */}
                        <div className="absolute bottom-0 left-0 right-0 z-40">
                            <div className="native-card hw-accelerated">
                                <RankingCard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedHomeTemplate; 