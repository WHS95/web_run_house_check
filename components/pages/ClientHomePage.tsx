"use client";

import React, { memo, useState, useEffect } from "react";
import EnhancedHomeTemplate from "@/components/templates/EnhancedHomeTemplate";
import PopupNotification, {
    NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";
import type { ActiveMeetBannerVM } from "@/lib/domain/attendance/policies";

interface HomePageData {
    userName: string;
    crewId: string | null;
    crewName: string | null;
    noticeText: string | null;
}

interface AttendanceDay {
    date: string;
    count: number;
}

interface ActiveNotice {
    id: string;
    title: string;
}

interface MyRanking {
    attendanceRank: number | null;
    hostingRank: number | null;
}

interface ClientHomePageProps {
    initialData: HomePageData;
    myAttendanceDays?: AttendanceDay[];
    activeNotice?: ActiveNotice | null;
    myRanking?: MyRanking | null;
    activeMeet?: ActiveMeetBannerVM | null;
    isDeactivated?: boolean;
    deactivationMessage?: string;
}

const ClientHomePage = memo<ClientHomePageProps>(({
    initialData,
    myAttendanceDays = [],
    activeNotice = null,
    myRanking = null,
    activeMeet = null,
    isDeactivated = false,
    deactivationMessage = "",
}) => {
    // 알림 상태
    const [notification, setNotification] = useState<{
        message: string;
        type: NotificationType;
    } | null>(null);

    // URL 파라미터로 전달된 에러 메시지 처리
    useEffect(() => {
        const urlParams = new URLSearchParams(
            window.location.search
        );
        const error = urlParams.get("error");
        const message = urlParams.get("message");

        if (error === "access_denied" && message) {
            setNotification({
                message: decodeURIComponent(message),
                type: "error",
            });
            haptic.error();

            const newUrl = new URL(
                window.location.href
            );
            newUrl.searchParams.delete("error");
            newUrl.searchParams.delete("message");
            window.history.replaceState(
                {},
                "",
                newUrl.pathname
            );
        } else if (
            error === "permission_check_failed"
        ) {
            setNotification({
                message:
                    "권한 확인 중 오류가 발생했습니다.",
                type: "error",
            });
            haptic.error();

            const newUrl = new URL(
                window.location.href
            );
            newUrl.searchParams.delete("error");
            window.history.replaceState(
                {},
                "",
                newUrl.pathname
            );
        }
    }, []);

    return (
        <>
            <EnhancedHomeTemplate
                username={initialData.userName}
                crewId={initialData.crewId}
                crewName={initialData.crewName}
                rankName="Beginner"
                noticeText={initialData.noticeText}
                myAttendanceDays={myAttendanceDays}
                activeNotice={activeNotice}
                myRanking={myRanking}
                activeMeet={activeMeet}
            />

            {/* 비활성화 차단 모달 */}
            {isDeactivated && (
                <div
                    className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60"
                    style={{ touchAction: "none" }}
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                    onTouchMove={(e) =>
                        e.preventDefault()
                    }
                >
                    <div className="mx-6 w-full max-w-sm rounded-2xl bg-rh-bg-surface p-6 text-center shadow-xl">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rh-status-error/20">
                            <svg
                                className="h-7 w-7 text-rh-status-error"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                            </svg>
                        </div>
                        <h2 className="mb-2 text-lg font-bold text-rh-text-primary">
                            계정 비활성화
                        </h2>
                        <p className="text-sm leading-relaxed text-rh-text-secondary">
                            {deactivationMessage ||
                                "비활성화 된 상태입니다. 운영진에게 문의바랍니다."}
                        </p>
                    </div>
                </div>
            )}

            {/* 알림 */}
            {notification && (
                <PopupNotification
                    isVisible={!!notification}
                    message={notification.message}
                    type={notification.type}
                    duration={4000}
                    onClose={() =>
                        setNotification(null)
                    }
                />
            )}
        </>
    );
});

ClientHomePage.displayName = "ClientHomePage";

export default ClientHomePage;
