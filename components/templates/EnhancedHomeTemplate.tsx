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
        <div className="relative min-h-screen bg-basic-black overflow-hidden page-transition initial-load">
            {/* 🔒 헤더 - 상단 완전 고정 */}
            <div className="fixed top-0 left-0 right-0 z-50 pt-safe bg-basic-black">
                <Header title={"RUN HOUSE"} />
            </div>

            {/* 📱 중간 영역 - Hero + 공지사항 */}
            <div className="pt-[80px] pb-[220px] h-screen overflow-hidden">
                {/* Hero 배경 */}
                <div className="relative h-full">
                    {username && (
                        <Hero username={username} />
                    )}
                    
                    {/* 공지사항 - Hero 위에 오버레이 */}
                    {noticeText && (
                        <div className="absolute top-4 left-0 right-0 z-10 px-4">
                            <NoticeBar noticeText={noticeText} />
                        </div>
                    )}
                </div>
            </div>

            {/* 🔒 하단 카드 섹션 - 하단 완전 고정 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe px-safe bg-basic-black">
                {/* 카드 스택 컨테이너 */}
                <div className="relative h-[200px]">
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
    );
};

export default EnhancedHomeTemplate; 