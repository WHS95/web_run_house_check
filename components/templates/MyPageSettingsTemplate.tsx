"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    User as UserIcon,
    LogOut,
    UserX,
    ChevronRight,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/organisms/common/PageHeader";
import SectionLabel from "@/components/atoms/SectionLabel";
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

const ROW_HEIGHT = "h-[52px]";
const ICON_SIZE = 18;

interface SettingRowProps {
    icon: React.ReactNode;
    label: string;
    description?: string;
    action: React.ReactNode;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
    disabled?: boolean;
}

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
    const labelColor = danger ? "text-rh-status-error" : "text-white";
    const iconColor = danger
        ? "text-rh-status-error"
        : "text-rh-text-secondary";

    const inner = (
        <>
            <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center ${iconColor}`}
                aria-hidden
            >
                {icon}
            </span>
            <div className='flex-1 min-w-0'>
                <span className={`block text-sm font-medium ${labelColor}`}>
                    {label}
                </span>
                {description && (
                    <span className='block text-xs text-rh-text-tertiary'>
                        {description}
                    </span>
                )}
            </div>
            <span className='shrink-0'>{action}</span>
        </>
    );

    const className = `flex items-center gap-3 px-4 ${
        description ? "py-3" : ROW_HEIGHT
    } ${disabled ? "opacity-50" : ""}`;

    if (href) {
        return (
            <Link href={href} className={className}>
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
                className={`${className} text-left active:opacity-80 transition-opacity w-full`}
            >
                {inner}
            </button>
        );
    }
    return <div className={className}>{inner}</div>;
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

        // hydration-safe
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

                <div className='flex-1 px-4 pt-4 pb-4 space-y-5'>
                    {/* 첫 번째 카드 — 일반 (라벨 없음) */}
                    <div className='overflow-hidden rounded-rh-md bg-rh-bg-surface divide-y divide-rh-border-subtle'>
                        {showNotificationToggle && (
                            <SettingRow
                                icon={<Bell size={ICON_SIZE} />}
                                label='푸시 알림 수신'
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
                            icon={<UserIcon size={ICON_SIZE} />}
                            label='내정보 변경'
                            description='이름, 연락처 등 개인정보 수정'
                            href='/mypage/edit'
                            action={
                                <ChevronRight
                                    size={18}
                                    className='text-rh-text-muted'
                                />
                            }
                        />
                    </div>

                    {/* 계정 섹션 */}
                    <div>
                        <SectionLabel>계정</SectionLabel>
                        <div className='overflow-hidden rounded-rh-md bg-rh-bg-surface divide-y divide-rh-border-subtle'>
                            <SettingRow
                                icon={<LogOut size={ICON_SIZE} />}
                                label='로그아웃'
                                onClick={handleLogout}
                                action={
                                    <ChevronRight
                                        size={18}
                                        className='text-rh-text-muted'
                                    />
                                }
                            />
                            <SettingRow
                                icon={<UserX size={ICON_SIZE} />}
                                label='회원 탈퇴'
                                onClick={() => setShowWithdrawModal(true)}
                                danger
                                action={
                                    <ChevronRight
                                        size={18}
                                        className='text-rh-text-muted'
                                    />
                                }
                            />
                        </div>
                    </div>
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
