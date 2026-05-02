'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronRight, Shield } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Switch } from '@/components/ui/switch';
import { getFCMToken } from '@/lib/firebase/client';
import PageHeader from '@/components/organisms/common/PageHeader';
import SectionLabel from '@/components/atoms/SectionLabel';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';

import { usePushNotification } from '@/hooks/usePushNotification';
import { withdrawUserAction, deactivatePushTokenAction } from '@/app/mypage/actions';

interface Activity {
    type: 'attendance' | 'create_meeting';
    date: string;
    location: string;
    exerciseType: string;
}

interface UserProfileForMyPage {
    firstName: string | null;
    crewId: string | null;
    birthYear: number | null;
    joinDate: string | null;
    rankName: string | null;
    email: string | null;
    phone: string | null;
    profileImageUrl?: string | null;
    isAdmin: boolean;
}

interface ActivityData {
    attendanceCount: number;
    meetingsCreatedCount: number;
    activities: Activity[];
}

interface MemberDetailTemplateProps {
    userProfile: UserProfileForMyPage | null;
    activityData: ActivityData;
    userId?: string;
}

const ErrorState = memo(() => (
    <div className="h-screen bg-rh-bg-primary flex flex-col">
        <div className="flex-shrink-0">
            <PageHeader title="내 정보" iconColor="white" borderColor="rh-border" backgroundColor="bg-rh-bg-surface" />
        </div>
        <div className="flex-1 flex items-center justify-center">
            <p className="text-rh-text-muted">사용자 정보를 불러올 수 없습니다.</p>
        </div>
    </div>
));
ErrorState.displayName = 'ErrorState';

const AdminButton = memo(() => (
    <Link
        href="/admin2"
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-rh-accent/15 text-rh-accent hover:bg-rh-accent/25 active:opacity-70 transition-colors"
        title="관리자 모드 접근"
    >
        <Shield size={12} strokeWidth={2.5} />
        <span className="text-[12px] font-semibold leading-none">관리자 모드</span>
    </Link>
));
AdminButton.displayName = 'AdminButton';

const MemberDetailTemplate = memo<MemberDetailTemplateProps>(({ userProfile, activityData, userId }) => {
    const router = useRouter();
    const {
        isSupported,
        permission,
        isNotificationEnabled,
        toggleNotification,
    } = usePushNotification({ crewId: userProfile?.crewId ?? null });

    // hydration 안전: 클라이언트 마운트 후에만 isSupported 사용
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const showNotificationToggle = mounted && isSupported;

    // 회원 탈퇴 모달 상태
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleLogout = useCallback(async () => {
        try {
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate([50, 100, 50]);
            }
            const fcmToken = await getFCMToken();
            if (fcmToken) {
                await deactivatePushTokenAction({ token: fcmToken }).catch(() => {});
            }
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert("로그아웃 중 오류가 발생했습니다.");
                return;
            }
            router.push("/auth/login");
        } catch {
            alert("로그아웃 처리 중 문제가 발생했습니다.");
        }
    }, [router]);

    const handleWithdraw = useCallback(async () => {
        if (isWithdrawing) return;
        setIsWithdrawing(true);
        try {
            const result = await withdrawUserAction();
            if (!result.success) {
                alert(result.message || "탈퇴 처리 중 오류가 발생했습니다.");
                setIsWithdrawing(false);
                return;
            }
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await supabase.auth.signOut();
            router.replace("/auth/login");
        } catch {
            alert("탈퇴 처리 중 문제가 발생했습니다.");
            setIsWithdrawing(false);
        }
    }, [router, isWithdrawing]);

    const displayName = useMemo(() => {
        if (!userProfile?.firstName) return '사용자';
        return userProfile.firstName;
    }, [userProfile?.firstName]);

    const adminButton = useMemo(() => {
        return userProfile?.isAdmin ? <AdminButton /> : null;
    }, [userProfile?.isAdmin]);

    const thisMonthCount = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return activityData.activities.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
    }, [activityData.activities]);

    if (!userProfile) {
        return <ErrorState />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* Header */}
            <PageHeader
                title="MY"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
                rightAction={adminButton}
            />

            {/* Content */}
            <div className="flex-1 px-4 pt-4 pb-4 space-y-5">
                {/* Profile */}
                <div className="flex items-center gap-4">
                    {userProfile.profileImageUrl ? (
                        <img
                            src={userProfile.profileImageUrl}
                            alt="프로필"
                            className="h-16 w-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rh-accent">
                            <span className="text-2xl font-bold text-white">
                                {userProfile.firstName?.charAt(0) ?? '?'}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <span className="text-xl font-semibold text-white">{displayName}</span>
                        <span className="text-[13px] text-rh-text-secondary">
                            RunHouse Crew · {userProfile.rankName ?? '멤버'}
                        </span>
                    </div>
                </div>

                {/* Stats - 3 cards */}
                <div className="flex gap-3">
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-rh-md bg-rh-bg-surface h-[84px]">
                        <span className="text-2xl font-bold text-rh-accent">{activityData.attendanceCount}</span>
                        <span className="text-xs font-medium text-rh-text-secondary">총 출석</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-rh-md bg-rh-bg-surface h-[84px]">
                        <span className="text-2xl font-bold text-rh-accent">{thisMonthCount}</span>
                        <span className="text-xs font-medium text-rh-text-secondary">이번 달</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-rh-md bg-rh-bg-surface h-[84px]">
                        <span className="text-2xl font-bold text-rh-accent">{activityData.meetingsCreatedCount}</span>
                        <span className="text-xs font-medium text-rh-text-secondary">개설 횟수</span>
                    </div>
                </div>

                {/* 설정 */}
                <SectionLabel>설정</SectionLabel>
                <div className="space-y-2">
                    {/* 푸시 알림 토글 */}
                    {showNotificationToggle && (
                        <div className="flex items-center justify-between rounded-rh-lg bg-rh-bg-surface h-[52px] px-4">
                            <span className="text-sm font-medium text-white">
                                푸시 알림 수신
                            </span>
                            <Switch
                                checked={isNotificationEnabled}
                                onCheckedChange={toggleNotification}
                                disabled={permission === "denied"}
                            />
                        </div>
                    )}

                    {/* 내정보 변경 */}
                    <Link
                        href="/mypage/edit"
                        className="flex items-center justify-between rounded-rh-lg bg-rh-bg-surface px-4 py-3"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-white">
                                내정보 변경
                            </span>
                            <span className="text-xs text-rh-text-tertiary">
                                이름, 연락처 등 개인정보 수정
                            </span>
                        </div>
                        <ChevronRight
                            size={18}
                            className="text-rh-text-muted"
                        />
                    </Link>
                </div>

                {/* 로그아웃 버튼 */}
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl transition-colors active:opacity-80"
                    style={{ backgroundColor: "#2B3644" }}
                >
                    <LogOut size={18} style={{ color: "#3E6496" }} />
                    <span
                        className="text-sm font-semibold"
                        style={{ color: "#3E6496" }}
                    >
                        로그아웃
                    </span>
                </button>

                {/* 회원 탈퇴 텍스트 링크 */}
                <div className="flex justify-center pt-1">
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="text-rh-text-tertiary text-xs underline"
                    >
                        회원 탈퇴
                    </button>
                </div>
            </div>

            {/* 탈퇴 확인 모달 */}
            <ConfirmDialog
                open={showWithdrawModal}
                onClose={() => {
                    if (isWithdrawing) return;
                    setShowWithdrawModal(false);
                }}
                onConfirm={handleWithdraw}
                title="정말 탈퇴하시겠습니까?"
                description={"계정과 개인정보(이름·이메일·연락처)가 영구 삭제되며 복구할 수 없습니다.\n\n출석 기록은 통계 보존을 위해 익명으로 남습니다."}
                cancelLabel="취소"
                confirmLabel={isWithdrawing ? "처리 중..." : "탈퇴하기"}
                confirmVariant="danger"
                confirmDisabled={isWithdrawing}
            />
        </div>
    );
});

MemberDetailTemplate.displayName = 'MemberDetailTemplate';

export default MemberDetailTemplate;
