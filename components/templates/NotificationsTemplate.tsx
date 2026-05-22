"use client";

import React, {
    useCallback,
    useMemo,
    useState,
    useEffect,
    memo,
} from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";

type NoticeType = "공지" | "일반" | "중요";

interface Notice {
    id: string;
    title?: string | null;
    type?: NoticeType;
    content: string;
    is_active: boolean;
    created_at: string;
    author: { first_name: string } | null;
}

interface NotificationsTemplateProps {
    crewId: string;
    initialNotices: Notice[];
}

type FilterKey = "ALL" | "NOTICE" | "GENERAL";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "전체" },
    { key: "NOTICE", label: "공지" },
    { key: "GENERAL", label: "일반" },
];

// 절대 날짜 포맷 (SSR / mounted 이전용)
function formatAbsolute(dateStr: string): string {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
}

// 상대 시간 포맷 (mounted 이후 클라이언트에서만 사용)
function formatRelative(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    ).getTime();
    const startOfDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ).getTime();
    const diffDays = Math.floor(
        (startOfToday - startOfDate) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatAbsolute(dateStr);
}

// 필터 칩
const FilterChip = memo(function FilterChip({
    label,
    on,
    onClick,
}: {
    label: string;
    on: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rh-chip"
            data-on={on ? "true" : "false"}
        >
            {label}
        </button>
    );
});

// 알림(공지) 아이템
const NoticeItem = memo(function NoticeItem({
    notice,
    timeLabel,
    onClick,
}: {
    notice: Notice;
    timeLabel: string;
    onClick: (id: string) => void;
}) {
    const unread = notice.is_active;
    const iconBoxClass = unread
        ? "bg-rh-accent text-rh-text-inverted"
        : "bg-rh-bg-surface text-rh-text-muted";
    const iconText = unread ? "N" : "·";

    const titleText =
        notice.title && notice.title.trim().length > 0
            ? notice.title
            : notice.type === "공지"
              ? "공지"
              : "알림";

    return (
        <button
            type="button"
            onClick={() => onClick(notice.id)}
            className="flex w-full items-center gap-3 py-3 text-left active:opacity-80"
        >
            {/* 좌측 아이콘 박스 (sq sm) */}
            <div
                className={`flex justify-center items-center w-9 h-9 rounded-rh-md shrink-0 text-[13px] font-semibold ${iconBoxClass}`}
            >
                {iconText}
            </div>

            {/* 본문 */}
            <div className="flex-1 min-w-0">
                <div
                    className={`text-rh-body leading-tight truncate ${
                        unread
                            ? "font-semibold text-rh-text-primary"
                            : "font-medium text-rh-text-secondary"
                    }`}
                >
                    {titleText}
                </div>
                <div className="text-rh-caption text-rh-text-tertiary mt-0.5 truncate">
                    {notice.content}
                </div>
            </div>

            {/* 우측 시간 */}
            <div className="text-[11px] text-rh-text-muted shrink-0 pl-2">
                {timeLabel}
            </div>
        </button>
    );
});

const NotificationsTemplate: React.FC<
    NotificationsTemplateProps
> = ({ initialNotices }) => {
    const router = useRouter();
    const [filter, setFilter] =
        useState<FilterKey>("ALL");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleClick = useCallback(
        (id: string) => {
            router.push(`/notifications/notice/${id}`);
        },
        [router]
    );

    // 필터 적용
    const filtered = useMemo(() => {
        if (filter === "ALL") return initialNotices;
        if (filter === "NOTICE") {
            return initialNotices.filter(
                (n) =>
                    n.type === "공지" ||
                    n.type === "중요"
            );
        }
        // GENERAL
        return initialNotices.filter(
            (n) => n.type === "일반" || n.type == null
        );
    }, [initialNotices, filter]);

    const timeFor = useCallback(
        (dateStr: string) =>
            mounted
                ? formatRelative(dateStr)
                : formatAbsolute(dateStr),
        [mounted]
    );

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="공지사항"
                backLink="/"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
            />

            <div className="overflow-y-auto flex-1 px-4 pt-3 pb-4 flex flex-col gap-3">
                {/* 필터 칩 row */}
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <FilterChip
                            key={f.key}
                            label={f.label}
                            on={filter === f.key}
                            onClick={() => setFilter(f.key)}
                        />
                    ))}
                </div>

                {/* 리스트 */}
                <FadeIn>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rh-bg-surface">
                                <Megaphone className="h-6 w-6 text-rh-text-tertiary" />
                            </div>
                            <p className="mt-3 text-rh-caption text-rh-text-secondary">
                                표시할 공지가 없습니다
                            </p>
                        </div>
                    ) : (
                        <AnimatedList className="flex flex-col divide-y divide-rh-border/60">
                            {filtered.map((notice) => (
                                <AnimatedItem
                                    key={notice.id}
                                >
                                    <NoticeItem
                                        notice={notice}
                                        timeLabel={timeFor(
                                            notice.created_at
                                        )}
                                        onClick={
                                            handleClick
                                        }
                                    />
                                </AnimatedItem>
                            ))}
                        </AnimatedList>
                    )}
                </FadeIn>
            </div>
        </div>
    );
};

export default memo(NotificationsTemplate);
