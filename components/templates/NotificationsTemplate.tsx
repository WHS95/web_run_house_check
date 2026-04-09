"use client";

import React, { useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";

interface Notice {
    id: string;
    title?: string | null;
    type?: "공지" | "일반" | "중요";
    content: string;
    is_active: boolean;
    created_at: string;
    author: { first_name: string } | null;
}

interface NotificationsTemplateProps {
    crewId: string;
    initialNotices: Notice[];
}

// 공지 아이템 컴포넌트 (memo 적용)
const NoticeItem = memo(function NoticeItem({
    notice,
    formatDate,
    onNoticeClick,
}: {
    notice: Notice;
    formatDate: (d: string) => string;
    onNoticeClick: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onNoticeClick(notice.id)}
            className="flex w-full text-left rounded-rh-lg
                bg-rh-bg-surface overflow-hidden
                transition-opacity active:opacity-70"
        >
            {/* 활성 공지 좌측 바 */}
            {notice.is_active && (
                <div
                    className="w-[3px] bg-rh-accent
                        rounded-l-rh-lg flex-shrink-0"
                />
            )}
            <div
                className={`flex-1 p-3.5 ${
                    notice.is_active ? "pl-3" : ""
                }`}
            >
                {notice.title && (
                    <p
                        className="text-[14px] font-semibold
                            text-white leading-snug mb-1"
                    >
                        {notice.title}
                    </p>
                )}
                <p
                    className={`text-sm leading-relaxed
                        line-clamp-1 break-all ${
                        notice.is_active
                            ? "text-white"
                            : "text-rh-text-secondary"
                    }`}
                >
                    {notice.content}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                    {notice.is_active && (
                        <span
                            className="rounded-full
                                bg-rh-accent/20 px-2 py-0.5
                                text-[10px] font-semibold
                                text-rh-accent"
                        >
                            현재 공지
                        </span>
                    )}
                    <span
                        className="text-xs
                            text-rh-text-tertiary"
                    >
                        {notice.author?.first_name ??
                            "관리자"}
                    </span>
                    <span
                        className="text-xs
                            text-rh-text-muted"
                    >
                        ·
                    </span>
                    <span
                        className="text-xs
                            text-rh-text-tertiary"
                    >
                        {formatDate(notice.created_at)}
                    </span>
                </div>
            </div>
        </button>
    );
});

const NotificationsTemplate: React.FC<
    NotificationsTemplateProps
> = ({ initialNotices }) => {
    const router = useRouter();

    const formatDate = useCallback((dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");
        const day = String(date.getDate()).padStart(
            2,
            "0"
        );
        return `${year}.${month}.${day}`;
    }, []);

    const handleNoticeClick = useCallback(
        (id: string) => {
            router.push(`/notifications/notice/${id}`);
        },
        [router]
    );

    return (
        <div
            className="flex flex-col min-h-screen
                bg-rh-bg-primary"
        >
            <PageHeader title="공지" backLink="/" />

            {/* 콘텐츠 영역 */}
            <div className="flex-1">
                <FadeIn>
                    {initialNotices.length === 0 ? (
                        <div
                            className="flex flex-col
                                items-center justify-center
                                py-20"
                        >
                            <div
                                className="flex h-12 w-12
                                    items-center justify-center
                                    rounded-full
                                    bg-rh-bg-muted/30"
                            >
                                <Megaphone
                                    className="h-6 w-6
                                        text-rh-text-tertiary"
                                />
                            </div>
                            <p
                                className="mt-3 text-sm
                                    text-rh-text-secondary"
                            >
                                등록된 공지가 없습니다
                            </p>
                        </div>
                    ) : (
                        <AnimatedList
                            className="px-4 py-3 space-y-3"
                        >
                            {initialNotices.map(
                                (notice) => (
                                    <AnimatedItem
                                        key={notice.id}
                                    >
                                        <NoticeItem
                                            notice={
                                                notice
                                            }
                                            formatDate={
                                                formatDate
                                            }
                                            onNoticeClick={
                                                handleNoticeClick
                                            }
                                        />
                                    </AnimatedItem>
                                )
                            )}
                        </AnimatedList>
                    )}
                </FadeIn>
            </div>
        </div>
    );
};

export default memo(NotificationsTemplate);
