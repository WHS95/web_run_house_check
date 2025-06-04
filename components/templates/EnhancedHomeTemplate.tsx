'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../organisms/Header';
import Hero from '../organisms/Hero';
import NoticeBar from '../molecules/NoticeBar';
import RankingCard from '../molecules/RankingCard';
import AttendanceCard from '../molecules/AttendanceCard';
import PullToRefresh from '../molecules/PullToRefresh';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { haptic } from '@/lib/haptic';

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

    // 새로고침 함수
    const handleRefresh = async () => {
        // 1초 정도 딜레이를 주어 새로고침 효과를 보여줌
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 페이지 새로고침
        window.location.reload();
    };

    // 랭킹 페이지로 이동
    const handleSwipeToRanking = () => {
        haptic.medium();
        router.push('/ranking');
    };

    // 풀 투 리프레시 기능
    const {
        containerRef,
        isRefreshing,
        pullDistance,
        isTriggered,
        refreshIndicatorStyle,
    } = usePullToRefresh({
        onRefresh: handleRefresh,
        threshold: 100,
        disabled: false,
    });

    // 스와이프 제스처 기능
    const swipeRef = useSwipeGesture({
        onSwipeLeft: handleSwipeToRanking,
        onSwipeRight: () => {
            // 오른쪽 스와이프 - 추후 다른 페이지 추가 시 사용
            haptic.light();
        },
        threshold: 80,
        hapticFeedback: true,
    });

    // ref를 모두 동일한 element에 연결하는 콜백
    const setRefs = useCallback((element: HTMLDivElement | null) => {
        // containerRef에 할당 (타입 체크 추가)
        if (containerRef && 'current' in containerRef) {
            (containerRef as any).current = element;
        }
        // swipeRef에 할당 (타입 체크 추가) 
        if (swipeRef && 'current' in swipeRef) {
            (swipeRef as any).current = element;
        }
    }, [containerRef, swipeRef]);

    return (
        <div 
            ref={setRefs}
            className="relative min-h-screen bg-basic-black overflow-hidden native-scroll"
        >
            {/* 풀 투 리프레시 인디케이터 */}
            <PullToRefresh
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
                isTriggered={isTriggered}
                style={refreshIndicatorStyle}
            />

            {/* Hero 섹션이 화면 전체를 채움 */}
            <div className="absolute inset-0 z-0">
                {username && (
                    <Hero username={username} />
                )}
            </div>

            {/* 헤더 - 안전 영역 고려 */}
            <div className="relative z-50 pt-safe">
                <Header title={"RUN HOUSE"} />
            </div>

            {/* 공지사항 */}
            {noticeText && (
                <div className="absolute top-[120px] left-0 right-0 z-40 px-4">
                    <div className="mx-auto">
                        <NoticeBar noticeText={noticeText} />
                    </div>
                </div>
            )}

            {/* 카드 섹션 - 화면 하단에 고정, 안전 영역 고려 */}
            <div className="absolute left-0 right-0 bottom-0 z-10 pb-safe">
                <div className="mx-auto">
                    {/* 카드 스택 컨테이너 */}
                    <div className="relative h-[400px] bg-transparent">
                        {/* 파란색 랭킹 카드 - 하단에 위치 */}
                        <div className="absolute bottom-0 left-0 right-0 z-40">
                            <div className="native-card">
                                <RankingCard />
                            </div>
                        </div>

                        {/* 보라색 출석 체크 카드 - 상단에 위치하며 파란색 카드 위로 겹침 */}
                        <div className="absolute bottom-[90px] left-0 right-0 z-20">
                            <div className="native-card">
                                <AttendanceCard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default EnhancedHomeTemplate; 