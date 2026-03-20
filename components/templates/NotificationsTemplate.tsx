"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    CircleCheckBig,
    Award,
    Megaphone,
    Bell,
} from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";


interface Notice {
    id: string;
    content: string;
    is_active: boolean;
    created_at: string;
    author: { first_name: string } | null;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationsTemplateProps {
    crewId: string;
    initialNotices: Notice[];
    initialNotifications: Notification[];
    initialUnreadCount: number;
}

const NotificationsTemplate: React.FC<NotificationsTemplateProps> = ({
    crewId,
    initialNotices,
    initialNotifications,
    initialUnreadCount,
}) => {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"notice" | "alert">(
        "notice"
    );
    const [notices] = useState<Notice[]>(initialNotices);
    const [notifications, setNotifications] = useState<Notification[]>(
        initialNotifications
    );
    const [unreadCount, setUnreadCount] =
        useState<number>(initialUnreadCount);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 알림 탭 진입 시 읽음 처리
    useEffect(() => {
        if (activeTab !== "alert" || unreadCount === 0) return;

        const unreadIds = notifications
            .filter((n) => !n.is_read)
            .map((n) => n.id);
        if (unreadIds.length === 0) return;

        fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                markAllRead: true,
                crewId,
            }),
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setNotifications((prev) =>
                        prev.map((n) => ({ ...n, is_read: true }))
                    );
                    setUnreadCount(0);
                }
            })
            .catch(() => {});
    }, [activeTab, crewId, unreadCount, notifications]);

    const formatDate = useCallback((dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    }, []);

    const getRelativeTime = useCallback((dateStr: string) => {
        if (!mounted) return formatDate(dateStr);
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return "방금 전";
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 7) return `${diffDay}일 전`;
        return formatDate(dateStr);
    }, [formatDate, mounted]);

    const getTimeGroup = useCallback(
        (dateStr: string): "today" | "week" | "older" => {
            if (!mounted) return "older";
            const now = new Date();
            const date = new Date(dateStr);
            const diffMs = now.getTime() - date.getTime();
            const diffDay = Math.floor(diffMs / 86400000);

            if (
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
            ) {
                return "today";
            }
            if (diffDay < 7) return "week";
            return "older";
        },
        [mounted]
    );

    const getNotificationIcon = useCallback(
        (type: string) => {
            switch (type) {
                case "attendance":
                    return {
                        Icon: CircleCheckBig,
                        bgColor: "bg-rh-accent/20",
                        iconColor: "text-rh-accent",
                    };
                case "grade":
                    return {
                        Icon: Award,
                        bgColor: "bg-rh-status-success/20",
                        iconColor: "text-rh-status-success",
                    };
                case "announcement":
                    return {
                        Icon: Megaphone,
                        bgColor: "bg-rh-status-warning/20",
                        iconColor: "text-rh-status-warning",
                    };
                default:
                    return {
                        Icon: Bell,
                        bgColor: "bg-rh-accent/20",
                        iconColor: "text-rh-accent",
                    };
            }
        },
        []
    );

    // 알림을 시간 그룹별로 분류
    const groupedNotifications = notifications.reduce(
        (acc, notif) => {
            const group = getTimeGroup(notif.created_at);
            acc[group].push(notif);
            return acc;
        },
        {
            today: [] as Notification[],
            week: [] as Notification[],
            older: [] as Notification[],
        }
    );

    const groupLabels = {
        today: "오늘",
        week: "이번 주",
        older: "이전",
    };

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader title="알림" backLink="/" />

            {/* 탭바 */}
            <div className="px-4 py-2">
                <div className="flex bg-rh-bg-surface rounded-rh-md p-1 gap-1">
                    <button
                        onClick={() => setActiveTab("notice")}
                        className={`flex-1 py-2 text-[13px] font-semibold rounded-rh-sm transition-colors ${
                            activeTab === "notice"
                                ? "bg-rh-accent text-white"
                                : "text-rh-text-tertiary"
                        }`}
                    >
                        공지
                    </button>
                    <button
                        onClick={() => setActiveTab("alert")}
                        className={`flex-1 py-2 text-[13px] font-semibold rounded-rh-sm transition-colors relative ${
                            activeTab === "alert"
                                ? "bg-rh-accent text-white"
                                : "text-rh-text-tertiary"
                        }`}
                    >
                        알림
                        {unreadCount > 0 &&
                            activeTab !== "alert" && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rh-accent rounded-full" />
                            )}
                    </button>
                </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto scroll-area-bottom">
                {activeTab === "notice" ? (
                    <NoticeTab
                        notices={notices}
                        formatDate={formatDate}
                    />
                ) : (
                    <AlertTab
                        groupedNotifications={groupedNotifications}
                        groupLabels={groupLabels}
                        getNotificationIcon={getNotificationIcon}
                        getRelativeTime={getRelativeTime}
                    />
                )}
            </div>
        </div>
    );
};

// ── 공지 탭 ──
function NoticeTab({
    notices,
    formatDate,
}: {
    notices: Notice[];
    formatDate: (d: string) => string;
}) {
    if (notices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rh-bg-muted/30">
                    <Megaphone className="h-6 w-6 text-rh-text-tertiary" />
                </div>
                <p className="mt-3 text-sm text-rh-text-secondary">
                    등록된 공지가 없습니다
                </p>
            </div>
        );
    }

    return (
        <div className="px-4 py-3 space-y-3">
            {notices.map((notice) => (
                <div
                    key={notice.id}
                    className={`flex rounded-rh-lg bg-rh-bg-surface overflow-hidden ${
                        notice.is_active ? "" : ""
                    }`}
                >
                    {/* 활성 공지 좌측 바 */}
                    {notice.is_active && (
                        <div className="w-[3px] bg-rh-accent rounded-l-rh-lg flex-shrink-0" />
                    )}
                    <div
                        className={`flex-1 p-3.5 ${
                            notice.is_active ? "pl-3" : ""
                        }`}
                    >
                        <p
                            className={`text-sm leading-relaxed ${
                                notice.is_active
                                    ? "text-white"
                                    : "text-rh-text-secondary"
                            }`}
                        >
                            {notice.content}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                            {notice.is_active && (
                                <span className="rounded-full bg-rh-accent/20 px-2 py-0.5 text-[10px] font-semibold text-rh-accent">
                                    현재 공지
                                </span>
                            )}
                            <span className="text-xs text-rh-text-tertiary">
                                {notice.author?.first_name ??
                                    "관리자"}
                            </span>
                            <span className="text-xs text-rh-text-muted">
                                ·
                            </span>
                            <span className="text-xs text-rh-text-tertiary">
                                {formatDate(notice.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── 알림 탭 ──
function AlertTab({
    groupedNotifications,
    groupLabels,
    getNotificationIcon,
    getRelativeTime,
}: {
    groupedNotifications: Record<string, Notification[]>;
    groupLabels: Record<string, string>;
    getNotificationIcon: (type: string) => {
        Icon: React.ComponentType<{ className?: string }>;
        bgColor: string;
        iconColor: string;
    };
    getRelativeTime: (d: string) => string;
}) {
    const hasAny = Object.values(groupedNotifications).some(
        (g) => g.length > 0
    );

    if (!hasAny) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rh-bg-muted/30">
                    <Bell className="h-6 w-6 text-rh-text-tertiary" />
                </div>
                <p className="mt-3 text-sm text-rh-text-secondary">
                    알림이 없습니다
                </p>
            </div>
        );
    }

    return (
        <div className="py-1">
            {(
                Object.entries(groupedNotifications) as [
                    string,
                    Notification[],
                ][]
            ).map(([groupKey, items]) => {
                if (items.length === 0) return null;
                return (
                    <div key={groupKey}>
                        <div className="px-4 py-2">
                            <span className="text-xs font-semibold text-rh-text-secondary">
                                {
                                    groupLabels[
                                        groupKey as keyof typeof groupLabels
                                    ]
                                }
                            </span>
                        </div>
                        {items.map((notif, idx) => {
                            const {
                                Icon,
                                bgColor,
                                iconColor,
                            } = getNotificationIcon(notif.type);
                            return (
                                <React.Fragment key={notif.id}>
                                    <div className="flex items-start gap-3 px-4 py-3.5">
                                        <div
                                            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${iconColor}`}
                                            />
                                            {!notif.is_read && (
                                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rh-accent rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-medium ${
                                                    notif.is_read
                                                        ? "text-rh-text-secondary"
                                                        : "text-white"
                                                }`}
                                            >
                                                {notif.title}
                                            </p>
                                            {notif.body && (
                                                <p
                                                    className={`text-[13px] leading-snug mt-1 ${
                                                        notif.is_read
                                                            ? "text-rh-text-tertiary"
                                                            : "text-rh-text-secondary"
                                                    }`}
                                                >
                                                    {notif.body}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-rh-text-tertiary mt-1">
                                                {getRelativeTime(
                                                    notif.created_at
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {idx <
                                        items.length - 1 && (
                                        <div className="h-px bg-rh-border/50 mx-4" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default NotificationsTemplate;
