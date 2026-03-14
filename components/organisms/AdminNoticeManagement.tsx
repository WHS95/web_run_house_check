"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Trash2, Megaphone } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface Notice {
    id: string;
    content: string;
    is_active: boolean;
    created_at: string;
    author?: { first_name: string } | null;
}

interface AdminNoticeManagementProps {
    crewId: string;
}

export default function AdminNoticeManagement({
    crewId,
}: AdminNoticeManagementProps) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [newContent, setNewContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const fetchNotices = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/admin/notices?crewId=${crewId}`
            );
            const data = await res.json();
            if (data.success) {
                setNotices(data.data || []);
            }
        } catch {
            // 조회 실패 무시
        } finally {
            setIsLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    const handleSubmit = async () => {
        if (!newContent.trim() || isSending) return;

        setIsSending(true);
        haptic.medium();

        try {
            const res = await fetch("/api/admin/notices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    crewId,
                    content: newContent.trim(),
                }),
            });

            if (res.ok) {
                setNewContent("");
                await fetchNotices();
                haptic.success();
            }
        } catch {
            haptic.error();
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (noticeId: string) => {
        haptic.light();

        try {
            const res = await fetch("/api/admin/notices", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noticeId }),
            });

            if (res.ok) {
                await fetchNotices();
            }
        } catch {
            // 삭제 실패
        }
    };

    const activeNotice = notices.find((n) => n.is_active);

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-rh-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 현재 활성 공지 */}
            <div className="rounded-rh-lg bg-rh-bg-surface p-4 border border-rh-border">
                <div className="flex items-center gap-2 mb-3">
                    <Megaphone className="h-4 w-4 text-rh-accent" />
                    <h3 className="text-rh-body font-semibold text-white">
                        현재 공지
                    </h3>
                </div>

                {activeNotice ? (
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <p className="text-rh-body text-white">
                                {activeNotice.content}
                            </p>
                            <p className="mt-1 text-rh-caption text-rh-text-tertiary">
                                {activeNotice.author?.first_name}{" "}
                                ·{" "}
                                {new Date(
                                    activeNotice.created_at
                                ).toLocaleDateString("ko-KR")}
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                handleDelete(activeNotice.id)
                            }
                            className="p-2 rounded-rh-md text-rh-text-muted hover:text-rh-status-error"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <p className="text-rh-body text-rh-text-tertiary">
                        등록된 공지가 없습니다.
                    </p>
                )}
            </div>

            {/* 새 공지 작성 */}
            <div className="rounded-rh-lg bg-rh-bg-surface p-4 border border-rh-border">
                <h3 className="text-rh-body font-semibold text-white mb-3">
                    새 공지 작성
                </h3>
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="공지 내용을 입력하세요..."
                    className="w-full h-24 rounded-rh-md bg-rh-bg-primary border border-rh-border p-3 text-rh-body text-white placeholder:text-rh-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-rh-accent"
                    maxLength={200}
                />
                <div className="flex items-center justify-between mt-3">
                    <span className="text-rh-caption text-rh-text-tertiary">
                        {newContent.length}/200
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!newContent.trim() || isSending}
                        className="flex items-center gap-2 rounded-rh-md bg-rh-accent px-4 py-2 text-rh-body font-semibold text-white disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        {isSending ? "등록 중..." : "등록"}
                    </button>
                </div>
                <p className="mt-2 text-rh-caption text-rh-text-tertiary">
                    새 공지를 등록하면 이전 공지는 자동으로
                    내려갑니다.
                </p>
            </div>

            {/* 지난 공지 목록 */}
            {notices.filter((n) => !n.is_active).length > 0 && (
                <div className="rounded-rh-lg bg-rh-bg-surface p-4 border border-rh-border">
                    <h3 className="text-rh-body font-semibold text-white mb-3">
                        지난 공지
                    </h3>
                    <div className="space-y-3">
                        {notices
                            .filter((n) => !n.is_active)
                            .map((notice) => (
                                <div
                                    key={notice.id}
                                    className="py-2 border-b border-rh-border last:border-b-0"
                                >
                                    <p className="text-rh-body text-rh-text-secondary">
                                        {notice.content}
                                    </p>
                                    <p className="mt-1 text-rh-caption text-rh-text-tertiary">
                                        {notice.author
                                            ?.first_name}{" "}
                                        ·{" "}
                                        {new Date(
                                            notice.created_at
                                        ).toLocaleDateString(
                                            "ko-KR"
                                        )}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
