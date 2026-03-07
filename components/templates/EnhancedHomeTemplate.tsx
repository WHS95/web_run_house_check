'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../organisms/Header';
import Hero from '../organisms/Hero';
import NoticeBar from '../molecules/NoticeBar';
import PushPermissionBanner from '../molecules/PushPermissionBanner';
import RankingCard from '../molecules/RankingCard';
import AttendanceCard from '../molecules/AttendanceCard';
import { usePushNotification } from '@/hooks/usePushNotification';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';
import { CloudUpload } from 'lucide-react';

interface RankingData {
    selectedYear: number;
    selectedMonth: number;
    attendanceRanking: Array<{
        user_id: string;
        rank: number;
        name: string;
        value: number;
        is_current_user: boolean;
    }>;
    crewName: string;
}

interface EnhancedHomeTemplateProps {
    username: string | null;
    crewId: string | null;
    rankName: string | null;
    crewName: string | null;
    noticeText: string | null;
}

const EnhancedHomeTemplate: React.FC<EnhancedHomeTemplateProps> = ({
    username,
    crewId,
    rankName,
    crewName,
    noticeText,
}) => {
    const router = useRouter();
    const { shouldShowBanner, requestPermission, dismissBanner } =
        usePushNotification({ crewId });
    const { queueCount, isOnline, isFlushing } = useOfflineAttendance();
    const [rankingData, setRankingData] = useState<RankingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 랭킹 데이터 가져오기
    useEffect(() => {
        const fetchRankingData = async () => {
            try {
                // 한국 시간(Asia/Seoul)으로 현재 날짜 생성
                const currentDate = new Date(
                    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
                );
                const response = await fetch(`/api/ranking?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`);
                if (response.ok) {
                    const data = await response.json();
                    setRankingData(data);
                }
            } catch (error) {
                console.error('랭킹 데이터 로드 오류:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRankingData();
    }, []);

    // 랭킹 페이지로 이동 - 최적화
    const handleSwipeToRanking = useCallback(() => {
        // haptic 피드백을 비동기로 처리하여 UI 블로킹 방지
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        router.push('/ranking');
    }, [router]);

    // 내 랭킹 정보 찾기
    const getMyRankingInfo = () => {
        if (!rankingData?.attendanceRanking) return null;
        return rankingData.attendanceRanking.find(item => item.is_current_user);
    };

    // 날짜 포매팅 함수
    const formatMonthYear = (year: number, month: number) => {
        return `${year}년 ${month.toString().padStart(2, '0')}월`;
    };

    return (
        <div className="main-content">
            {/* 🔒 헤더 - Header 컴포넌트에서 fixed 처리됨 */}
            <Header title={"RUN HOUSE"} />

            {/* 📢 공지사항 - 헤더 바로 아래 고정 */}
            {noticeText && (
                <div className="fixed top-20 left-0 right-0 z-40 px-4 pt-safe">
                    <NoticeBar noticeText={noticeText} />
                </div>
            )}

            {/* 🔔 알림 유도 배너 */}
            <PushPermissionBanner
                show={shouldShowBanner}
                onAllow={requestPermission}
                onDismiss={dismissBanner}
            />

            {/* 오프라인 출석 대기 배너 */}
            {queueCount > 0 && (
                <div className="fixed top-32 left-0 right-0 z-30 px-4">
                    <div className="flex items-center gap-3 rounded-rh-lg bg-rh-bg-surface p-3 border border-rh-border">
                        <CloudUpload className="h-5 w-5 text-rh-accent" />
                        <div>
                            <p className="text-rh-body text-white">
                                오프라인 출석 {queueCount}건 대기 중
                            </p>
                            <p className="text-rh-caption text-rh-text-tertiary">
                                {isOnline
                                    ? isFlushing
                                        ? "전송 중..."
                                        : "곧 자동 전송됩니다"
                                    : "네트워크 연결 시 자동 전송"}
                            </p>
                        </div>
                    </div>
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
                                <div className="flex items-center justify-center min-h-[60vh]">
                                    <div className="w-full max-w-2xl mx-auto text-center px-6 py-10">
                                        {/* 랭킹 정보 */}
                                        {isLoading ? (
                                            <div className='flex flex-col items-center mt-12 space-y-4'>
                                                <div className='flex space-x-2'>
                                                  <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
                                                  <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
                                                  <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
                                                </div>
                                              </div>
                                        ) : rankingData ? (
                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold text-white mb-4">
                                                    {formatMonthYear(rankingData.selectedYear, rankingData.selectedMonth)}
                                                </h3>
                                                {(() => {
                                                    const myRanking = getMyRankingInfo();
                                                    return myRanking ? (

                                                    
                                                        <div>
                                                            <p className="text-white font-extrabold text-3xl mb-2">
                                                                {myRanking.name} 
                                                            </p>
                                                            <p className="text-rh-accent font-extrabold text-3xl mb-2">
                                                              나의 랭킹 {myRanking.rank}위
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-white font-bold text-3xl mb-2">
                                                                이번 달은 기록이 없어요
                                                            </p>
                                                            <p className="text-white font-bold text-3xl mb-2">
                                                                얼른 출석해보세요! 
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                                <button
                                                    onClick={handleSwipeToRanking}
                                                    className="mt-6 px-6 py-3 bg-rh-accent hover:bg-rh-accent-hover/80 text-white rounded-xl text-base font-semibold transition-colors"
                                                >
                                                    전체 랭킹 보기
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-rh-text-secondary text-lg">
                                                    랭킹 정보를 불러올 수 없어요
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedHomeTemplate; 