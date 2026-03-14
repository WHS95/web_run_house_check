"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, Megaphone } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface Notice {
    id: string;
    content: string;
    is_active: boolean;
    created_at: string;
    author: { first_name: string } | null;
}

interface NoticeListSheetProps {
    isOpen: boolean;
    onClose: () => void;
    crewId: string;
}

export default function NoticeListSheet({
    isOpen,
    onClose,
    crewId,
}: NoticeListSheetProps) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    const fetchNotices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/notices?crewId=${crewId}`
            );
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setNotices(json.data);
            }
        } catch {
            // 조회 실패 시 빈 목록 유지
        } finally {
            setLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        if (isOpen) {
            fetchNotices();
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen, fetchNotices]);

    const handleDragEnd = (
        _: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        if (info.offset.y > 100 || info.velocity.y > 300) {
            onClose();
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 오버레이 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-rh-bg-primary/60"
                        onClick={onClose}
                    />

                    {/* 바텀시트 */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                        }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-[20px] bg-rh-bg-surface"
                    >
                        {/* 드래그 핸들 */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full bg-rh-bg-muted" />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 pb-3 pt-1">
                            <h2 className="text-[17px] font-semibold text-white">
                                공지사항
                            </h2>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-rh-bg-muted/50"
                            >
                                <X className="h-4 w-4 text-rh-text-secondary" />
                            </button>
                        </div>

                        {/* 구분선 */}
                        <div className="border-b border-rh-border" />

                        {/* 공지 목록 */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-rh-accent border-t-transparent" />
                                </div>
                            ) : notices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rh-bg-muted/30">
                                        <Megaphone className="h-6 w-6 text-rh-text-tertiary" />
                                    </div>
                                    <p className="mt-3 text-rh-body text-rh-text-secondary">
                                        등록된 공지가 없습니다
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {notices.map((notice) => (
                                        <div
                                            key={notice.id}
                                            className="relative flex gap-3 rounded-rh-lg bg-rh-bg-primary/50 p-4"
                                        >
                                            {/* 활성 공지 인디케이터 */}
                                            {notice.is_active && (
                                                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-rh-accent" />
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`text-rh-body leading-relaxed ${
                                                        notice.is_active
                                                            ? "text-white"
                                                            : "text-rh-text-secondary"
                                                    }`}
                                                >
                                                    {notice.content}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    {notice.is_active && (
                                                        <span className="rounded-full bg-rh-accent/15 px-2 py-0.5 text-[11px] font-medium text-rh-accent">
                                                            현재 공지
                                                        </span>
                                                    )}
                                                    <span className="text-rh-caption text-rh-text-tertiary">
                                                        {notice.author
                                                            ?.first_name ??
                                                            "관리자"}
                                                    </span>
                                                    <span className="text-rh-caption text-rh-text-muted">
                                                        ·
                                                    </span>
                                                    <span className="text-rh-caption text-rh-text-tertiary">
                                                        {formatDate(
                                                            notice.created_at
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
