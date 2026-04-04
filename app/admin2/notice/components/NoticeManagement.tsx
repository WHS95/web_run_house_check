"use client";

import { useState, useCallback, useMemo, useEffect, memo } from "react";
import Link from "next/link";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AdminSmallButton,
    AdminAlertDialog,
    NoticeCard,
} from "@/app/admin2/components/ui";

type NoticeType = "공지" | "일반" | "중요";
type BadgeVariant = "accent" | "outline" | "muted";

interface Notice {
    id: string;
    type: NoticeType;
    title: string;
    description: string;
    date: string;
}

const typeToBadgeVariant: Record<NoticeType, BadgeVariant> = {
    공지: "accent",
    일반: "muted",
    중요: "outline",
};

// TODO: Supabase 연동 시 실제 데이터로 교체
const mockNotices: Notice[] = [
    {
        id: "1",
        type: "공지",
        title: "3월 넷째주 러닝 장소 변경 안내",
        description:
            "이번 주 토요일 러닝은 한강공원 반포지구에서 여의도공원으로 변경되었습니다.",
        date: "2026.03.20",
    },
    {
        id: "2",
        type: "일반",
        title: "신규 크루원 환영합니다!",
        description:
            "이번 달 새로 합류한 크루원 3명을 소개합니다! 다함께 환영해주세요.",
        date: "2026.03.15",
    },
    {
        id: "3",
        type: "중요",
        title: "출석 체크 방식 변경 안내",
        description:
            "3월부터 GPS 기반 자동 출석 체크가 도입됩니다. 앱 위치 권한을 허용해주세요.",
        date: "2026.02.10",
    },
];

const NoticeManagement = memo(function NoticeManagement() {
    const [notices, setNotices] = useState<Notice[]>(mockNotices);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        noticeId: string;
    }>({ open: false, noticeId: "" });

    // sessionStorage에서 새 공지 수신
    useEffect(() => {
        const stored = sessionStorage.getItem("admin_new_notice");
        if (stored) {
            try {
                const newNotice = JSON.parse(stored) as Notice;
                setNotices((prev) => [newNotice, ...prev]);
            } catch {
                // 파싱 실패 시 무시
            }
            sessionStorage.removeItem("admin_new_notice");
        }
    }, []);

    const totalCount = useMemo(
        () => notices.length,
        [notices],
    );

    const handleDelete = useCallback(() => {
        setNotices((prev) =>
            prev.filter(
                (n) => n.id !== deleteDialog.noticeId,
            ),
        );
        setDeleteDialog({ open: false, noticeId: "" });
    }, [deleteDialog.noticeId]);

    return (
        <FadeIn>
            <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
                {/* 헤더: 전체 N건 + 새 공지 */}
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-rh-text-secondary">
                        전체{" "}
                        <span className="text-white font-medium">
                            {totalCount}건
                        </span>
                    </span>
                    <Link href="/admin2/notice/write">
                        <AdminSmallButton>
                            + 새 공지
                        </AdminSmallButton>
                    </Link>
                </div>

                {/* 공지 리스트 */}
                {notices.length > 0 ? (
                    <AnimatedList className="space-y-3">
                        {notices.map((notice) => (
                            <AnimatedItem key={notice.id}>
                                <NoticeCard
                                    badge={notice.type}
                                    badgeVariant={
                                        typeToBadgeVariant[
                                            notice.type
                                        ]
                                    }
                                    date={notice.date}
                                    title={notice.title}
                                    description={
                                        notice.description
                                    }
                                    onClick={() =>
                                        setDeleteDialog({
                                            open: true,
                                            noticeId:
                                                notice.id,
                                        })
                                    }
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-rh-text-secondary text-sm">
                            등록된 공지사항이 없습니다.
                        </p>
                    </div>
                )}
            </div>

            {/* 삭제 확인 다이얼로그 */}
            <AdminAlertDialog
                open={deleteDialog.open}
                onClose={() =>
                    setDeleteDialog({
                        open: false,
                        noticeId: "",
                    })
                }
                onConfirm={handleDelete}
                title="공지사항을 삭제하시겠습니까?"
                description="이 작업은 되돌릴 수 없습니다."
                cancelLabel="취소"
                confirmLabel="삭제"
                confirmVariant="danger"
            />
        </FadeIn>
    );
});

export default NoticeManagement;
