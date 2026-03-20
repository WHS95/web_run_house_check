"use client";

import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    memo,
} from "react";
import { Send, Check, Bell, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import type { NotificationType } from
    "@/components/molecules/common/PopupNotification";

interface PushTarget {
    userId: string;
    userName: string;
    crewId: string;
    crewName: string;
    platform: string;
    updatedAt: string;
}

interface PushTestTabProps {
    showNotification: (
        message: string,
        type: NotificationType
    ) => void;
}

export default function PushTestTab({
    showNotification,
}: PushTestTabProps) {
    const [targets, setTargets] = useState<PushTarget[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set()
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [title, setTitle] = useState("🏃 RunHouse 테스트");
    const [body, setBody] = useState(
        "푸시 알림이 정상적으로 작동합니다!"
    );
    const [currentUserId, setCurrentUserId] = useState("");

    const loadTargets = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/push/test");
            if (!res.ok) {
                const err = await res.json();
                showNotification(
                    err.error || "목록 조회 실패",
                    "error"
                );
                return;
            }
            const data = await res.json();
            setCurrentUserId(data.currentUserId || "");
            setTargets(data.targets || []);
        } catch {
            showNotification("목록 조회 중 오류 발생", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadTargets();
    }, [loadTargets]);

    // 중복 user 제거 (같은 유저가 여러 크루에 토큰 등록 가능)
    const uniqueTargets = useMemo(() => {
        const map = new Map<string, PushTarget>();
        for (const t of targets) {
            if (!map.has(t.userId)) {
                map.set(t.userId, t);
            }
        }
        return Array.from(map.values());
    }, [targets]);

    const handleToggle = useCallback((userId: string) => {
        haptic.light();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        haptic.light();
        setSelectedIds((prev) => {
            if (prev.size === uniqueTargets.length) {
                return new Set();
            }
            return new Set(uniqueTargets.map((t) => t.userId));
        });
    }, [uniqueTargets]);

    const handleSend = useCallback(async () => {
        if (selectedIds.size === 0) {
            showNotification(
                "대상을 선택해주세요.",
                "error"
            );
            return;
        }
        if (!title.trim()) {
            showNotification("제목을 입력해주세요.", "error");
            return;
        }

        haptic.medium();
        setIsSending(true);
        try {
            const res = await fetch("/api/push/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userIds: Array.from(selectedIds),
                    title: title.trim(),
                    body: body.trim(),
                }),
            });
            const result = await res.json();
            if (!res.ok) {
                showNotification(
                    result.error || "발송 실패",
                    "error"
                );
                return;
            }
            showNotification(
                `${result.successCount}건 발송 성공`
                    + (result.failureCount > 0
                        ? `, ${result.failureCount}건 실패`
                        : ""),
                result.failureCount > 0 ? "error" : "success"
            );
        } catch {
            showNotification("발송 중 오류 발생", "error");
        } finally {
            setIsSending(false);
        }
    }, [selectedIds, title, body, showNotification]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="sm" color="white" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* 메시지 입력 영역 */}
            <div
                className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: "#2B3644" }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Bell size={14} style={{ color: "#669FF2" }} />
                    <span className="text-[13px] font-semibold text-white">
                        알림 내용
                    </span>
                </div>
                <Input
                    placeholder="제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-white bg-rh-bg-primary border-rh-border placeholder:text-rh-text-tertiary"
                />
                <Input
                    placeholder="본문 (선택)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="text-white bg-rh-bg-primary border-rh-border placeholder:text-rh-text-tertiary"
                />
            </div>

            {/* 대상 선택 헤더 */}
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white">
                    대상 선택
                    <span
                        className="ml-2 text-[12px] font-normal"
                        style={{ color: "#64748B" }}
                    >
                        {selectedIds.size}/{uniqueTargets.length}명
                    </span>
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => loadTargets()}
                        className="p-1.5 rounded-lg active:opacity-70 transition-opacity"
                    >
                        <RefreshCw
                            size={14}
                            style={{ color: "#64748B" }}
                        />
                    </button>
                    <button
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium active:opacity-80 transition-opacity"
                        style={{
                            backgroundColor:
                                selectedIds.size ===
                                uniqueTargets.length
                                    ? "rgba(102, 159, 242, 0.2)"
                                    : "#4C525E",
                            color:
                                selectedIds.size ===
                                uniqueTargets.length
                                    ? "#669FF2"
                                    : "#94A3B8",
                        }}
                    >
                        {selectedIds.size === uniqueTargets.length
                            ? "전체 해제"
                            : "전체 선택"}
                    </button>
                </div>
            </div>

            {/* 대상 목록 */}
            <div className="space-y-2">
                {uniqueTargets.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center py-12 rounded-xl"
                        style={{ backgroundColor: "#2B3644" }}
                    >
                        <Bell
                            className="w-10 h-10 mb-2"
                            style={{ color: "#475569" }}
                        />
                        <p
                            className="text-sm"
                            style={{ color: "#64748B" }}
                        >
                            푸시 토큰이 등록된 사용자가 없습니다
                        </p>
                    </div>
                ) : (
                    uniqueTargets.map((target) => (
                        <TargetRow
                            key={target.userId}
                            target={target}
                            isSelected={selectedIds.has(
                                target.userId
                            )}
                            isCurrentUser={
                                target.userId === currentUserId
                            }
                            onToggle={handleToggle}
                        />
                    ))
                )}
            </div>

            {/* 발송 버튼 */}
            <Button
                onClick={handleSend}
                disabled={
                    isSending || selectedIds.size === 0
                }
                className="w-full h-12 bg-rh-accent hover:bg-rh-accent-hover text-white font-semibold rounded-xl disabled:opacity-40 transition-opacity"
            >
                {isSending ? (
                    <div className="flex items-center gap-2">
                        <LoadingSpinner
                            size="sm"
                            color="white"
                        />
                        <span>발송 중...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Send size={16} />
                        <span>
                            {selectedIds.size}명에게 테스트 발송
                        </span>
                    </div>
                )}
            </Button>
        </div>
    );
}

// ─── 대상 행 ───

const TargetRow = memo(function TargetRow({
    target,
    isSelected,
    isCurrentUser,
    onToggle,
}: {
    target: PushTarget;
    isSelected: boolean;
    isCurrentUser: boolean;
    onToggle: (userId: string) => void;
}) {
    return (
        <button
            onClick={() => onToggle(target.userId)}
            className="flex items-center w-full gap-3 rounded-xl px-4 py-3 active:opacity-80 transition-opacity text-left"
            style={{ backgroundColor: "#2B3644" }}
        >
            {/* 체크박스 */}
            <div
                className="flex items-center justify-center shrink-0 rounded-md transition-colors"
                style={{
                    width: 22,
                    height: 22,
                    backgroundColor: isSelected
                        ? "#669FF2"
                        : "transparent",
                    border: isSelected
                        ? "none"
                        : "2px solid #475569",
                }}
            >
                {isSelected ? (
                    <Check
                        size={14}
                        strokeWidth={3}
                        color="white"
                    />
                ) : null}
            </div>

            {/* 아바타 */}
            <div
                className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: "#4C525E" }}
            >
                <span className="text-sm font-semibold text-white">
                    {target.userName.charAt(0)}
                </span>
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-medium text-white truncate">
                        {target.userName}
                    </p>
                    {isCurrentUser ? (
                        <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0"
                            style={{
                                backgroundColor:
                                    "rgba(102, 159, 242, 0.2)",
                                color: "#669FF2",
                            }}
                        >
                            나
                        </span>
                    ) : null}
                </div>
                <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: "#64748B" }}
                >
                    {target.crewName} · {target.platform}
                </p>
            </div>
        </button>
    );
});
