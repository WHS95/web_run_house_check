"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    User as UserIcon,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/organisms/common/PageHeader";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import Toast from "@/components/molecules/Toast";
import { usePushNotification } from "@/hooks/usePushNotification";
import { getFCMToken } from "@/lib/firebase/client";
import {
    withdrawUserAction,
    deactivatePushTokenAction,
} from "@/app/mypage/actions";

interface MyPageSettingsTemplateProps {
    crewId: string | null;
}

interface SettingRowProps {
    icon: React.ReactNode;
    label: string;
    description?: string;
    action?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
    disabled?: boolean;
}

// av sm sq: 32x32 둥근 사각형 아이콘 박스 (surface 배경)
const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    label,
    description,
    action,
    onClick,
    href,
    danger = false,
    disabled = false,
}) => {
    const labelColor = danger
        ? "text-rh-status-error"
        : "text-rh-text-primary";
    const iconWrapClasses = danger
        ? "bg-rh-bg-surface text-rh-status-error"
        : "bg-rh-bg-surface text-rh-text-secondary";

    const inner = (
        <>
            <div
                className={`flex justify-center items-center w-8 h-8 rounded-rh-md shrink-0 ${iconWrapClasses}`}
                aria-hidden
            >
                {icon}
            </div>
            <div className='flex-1 min-w-0'>
                <div
                    className={`text-rh-body font-semibold leading-tight ${labelColor}`}
                >
                    {label}
                </div>
                {description && (
                    <div className='text-rh-caption text-rh-text-tertiary mt-0.5'>
                        {description}
                    </div>
                )}
            </div>
            {action ? <div className='shrink-0'>{action}</div> : null}
        </>
    );

    const baseClasses = `flex items-center gap-3 py-2.5 ${
        disabled ? "opacity-50" : ""
    }`;

    if (href) {
        return (
            <Link href={href} className={`${baseClasses} active:opacity-80`}>
                {inner}
            </Link>
        );
    }
    if (onClick) {
        return (
            <button
                type='button'
                onClick={onClick}
                disabled={disabled}
                className={`${baseClasses} text-left active:opacity-80 transition-opacity w-full`}
            >
                {inner}
            </button>
        );
    }
    return <div className={baseClasses}>{inner}</div>;
};

const MyPageSettingsTemplate = memo<MyPageSettingsTemplateProps>(
    ({ crewId }) => {
        const router = useRouter();

        const {
            isSupported,
            permission,
            isNotificationEnabled,
            toggleNotification,
            toast,
            dismissToast,
        } = usePushNotification({ crewId });

        // hydration-safe: 클라이언트에서만 푸시 지원 여부 확정
        const [mounted, setMounted] = useState(false);
        useEffect(() => {
            setMounted(true);
        }, []);
        const showNotificationToggle = mounted && isSupported;

        const [showWithdrawModal, setShowWithdrawModal] = useState(false);
        const [isWithdrawing, setIsWithdrawing] = useState(false);

        const handleLogout = useCallback(async () => {
            try {
                if (
                    typeof window !== "undefined" &&
                    window.navigator.vibrate
                ) {
                    window.navigator.vibrate([50, 100, 50]);
                }
                const fcmToken = await getFCMToken();
                if (fcmToken) {
                    await deactivatePushTokenAction({
                        token: fcmToken,
                    }).catch(() => {});
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
                    alert(
                        result.message || "탈퇴 처리 중 오류가 발생했습니다."
                    );
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

        return (
            <div className='flex flex-col min-h-screen bg-rh-bg-primary'>
                <PageHeader
                    title='설정'
                    backLink='/mypage'
                    iconColor='white'
                    borderColor='rh-border'
                    backgroundColor='bg-rh-bg-primary'
                />

                <div className='flex-1 flex flex-col px-4 pt-3 pb-4 gap-3'>
                    {/* 계정 섹션 */}
                    <div className='rh-eye'>계정</div>
                    <div className='flex flex-col divide-y divide-rh-border/60'>
                        {showNotificationToggle && (
                            <SettingRow
                                icon={<Bell size={16} strokeWidth={1.6} />}
                                label='푸시 알림'
                                action={
                                    <Switch
                                        checked={isNotificationEnabled}
                                        onCheckedChange={toggleNotification}
                                        disabled={permission === "denied"}
                                    />
                                }
                            />
                        )}

                        <SettingRow
                            icon={<UserIcon size={16} strokeWidth={1.6} />}
                            label='내정보 변경'
                            description='이름, 연락처 등 개인정보 수정'
                            href='/mypage/edit'
                            action={
                                <ChevronRight
                                    size={16}
                                    className='text-rh-text-muted'
                                />
                            }
                        />

                        <SettingRow
                            icon={<LogOut size={16} strokeWidth={1.6} />}
                            label='로그아웃'
                            onClick={handleLogout}
                            danger
                        />
                    </div>

                    {/* spacer: danger CTA를 하단으로 밀어내기 */}
                    <div className='flex-1' />

                    {/* danger CTA: 투명 배경 + 에러 색 테두리 */}
                    <Button
                        type='button'
                        variant='destructive'
                        className='w-full'
                        onClick={() => setShowWithdrawModal(true)}
                    >
                        회원 탈퇴
                    </Button>
                </div>

                <ConfirmDialog
                    open={showWithdrawModal}
                    onClose={() => {
                        if (isWithdrawing) return;
                        setShowWithdrawModal(false);
                    }}
                    onConfirm={handleWithdraw}
                    title='정말 탈퇴하시겠습니까?'
                    description={
                        "계정과 개인정보(이름·이메일·연락처)가 영구 삭제되며 복구할 수 없습니다.\n\n출석 기록은 통계 보존을 위해 익명으로 남습니다."
                    }
                    cancelLabel='취소'
                    confirmLabel={isWithdrawing ? "처리 중..." : "탈퇴하기"}
                    confirmVariant='danger'
                    confirmDisabled={isWithdrawing}
                />

                <Toast
                    open={!!toast}
                    message={toast?.message ?? null}
                    tone={toast?.tone}
                    onClose={dismissToast}
                />
            </div>
        );
    }
);

MyPageSettingsTemplate.displayName = "MyPageSettingsTemplate";

export default MyPageSettingsTemplate;
