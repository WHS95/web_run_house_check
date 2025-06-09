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
        <div className="relative min-h-screen bg-basic-black page-transition initial-load">
            {/* 🔒 헤더 - 상단 완전 고정 */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-basic-black border-b border-gray-800/20">
                <div className="pt-safe">
                    <Header title={"RUN HOUSE"} />
                </div>
            </div>

            {/* 📱 중간 영역 - Hero + 공지사항 */}
            <div className="relative h-screen">
                {/* Hero 배경 - 가운데 정렬 */}
                <div className="h-full flex items-center justify-center">
                    {username && (
                        <Hero username={username} crewName={crewName} />
                    )}
                </div>
                
                {/* 공지사항 - 상단 고정 오버레이 */}
                {noticeText && (
                    <div className="absolute top-24 left-0 right-0 z-40 px-4">
                        <NoticeBar noticeText={noticeText} />
                    </div>
                )}
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