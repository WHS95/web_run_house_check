"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react";
import { Bell, Check, RefreshCw, Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    AnimatedItem,
    AnimatedList,
} from "@/components/atoms/AnimatedList";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { haptic } from "@/lib/haptic";
import { sendTestPushAction } from "@/app/admin2/push/actions";

interface PushTarget {
    userId: string;
    userName: string;
    crewId: string;
    crewName: string;
    platform: string;
    updatedAt: string;
}

const DEFAULT_TITLE = "🏃 RunHouse 테스트";
const DEFAULT_BODY = "푸시 알림이 정상적으로 작동합니다!";

function PushTestClient() {
    const [targets, setTargets] = useState<PushTarget[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set()
    );
    const [isLoading, setIsLoading] = useState(true);
    const [, startSendTransition] = useTransition();
    const [isSending, setIsSending] = useState(false);
    const [title, setTitle] = useState(DEFAULT_TITLE);
    const [body, setBody] = useState(DEFAULT_BODY);
    const [currentUserId, setCurrentUserId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const isSendingRef = useRef(false);

    const resetMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    const loadTargets = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/push/test");
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err?.error || "목록 조회 실패");
                return;
            }
            const data = await res.json();
            setCurrentUserId(data.currentUserId || "");
            setTargets(data.targets || []);
        } catch {
            setError("목록 조회 중 오류 발생");
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    // 검색 필터
    const filteredTargets = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return uniqueTargets;
        return uniqueTargets.filter((t) => {
            const haystack = [t.userName, t.crewName, t.platform]
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [uniqueTargets, query]);

    const handleQueryChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
        },
        []
    );

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
        },
        []
    );

    const handleBodyChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setBody(e.target.value);
        },
        []
    );

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
            // 검색 적용 시 보이는 대상에 한해 토글
            const allVisibleIds = filteredTargets.map((t) => t.userId);
            const allSelected = allVisibleIds.every((id) =>
                prev.has(id)
            );
            if (allSelected) {
                const next = new Set(prev);
                allVisibleIds.forEach((id) => next.delete(id));
                return next;
            }
            const next = new Set(prev);
            allVisibleIds.forEach((id) => next.add(id));
            return next;
        });
    }, [filteredTargets]);

    const handleRefresh = useCallback(() => {
        resetMessages();
        loadTargets();
    }, [loadTargets, resetMessages]);

    const handleSend = useCallback(() => {
        if (isSendingRef.current) return;
        if (selectedIds.size === 0) {
            setError("대상을 선택해주세요.");
            setSuccess(null);
            return;
        }
        if (!title.trim()) {
            setError("제목을 입력해주세요.");
            setSuccess(null);
            return;
        }

        isSendingRef.current = true;
        haptic.medium();
        setIsSending(true);
        resetMessages();
        startSendTransition(async () => {
            try {
                const result = await sendTestPushAction({
                    userIds: Array.from(selectedIds),
                    title: title.trim(),
                    body: body.trim(),
                });
                if (!result.success || !result.data) {
                    setError(
                        result.message ||
                            result.error ||
                            "발송 실패"
                    );
                    return;
                }
                const successCount = result.data.successCount;
                const failureCount = result.data.failureCount;
                const summary =
                    `${successCount}건 발송 성공` +
                    (failureCount > 0
                        ? `, ${failureCount}건 실패`
                        : "");
                if (failureCount > 0) {
                    setError(summary);
                } else {
                    setSuccess(summary);
                }
            } catch {
                setError("발송 중 오류 발생");
            } finally {
                isSendingRef.current = false;
                setIsSending(false);
            }
        });
    }, [selectedIds, title, body, resetMessages]);

    const visibleSelectedCount = useMemo(() => {
        let n = 0;
        for (const t of filteredTargets) {
            if (selectedIds.has(t.userId)) n++;
        }
        return n;
    }, [filteredTargets, selectedIds]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="sm" color="white" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 메시지 입력 */}
            <div className="rounded-xl bg-rh-bg-surface p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Bell size={14} className="text-rh-accent" />
                    <span className="text-[13px] font-semibold text-white">
                        알림 내용
                    </span>
                </div>
                <Input
                    placeholder="제목"
                    value={title}
                    onChange={handleTitleChange}
                    className="bg-rh-bg-primary border-rh-border text-white placeholder:text-rh-text-tertiary"
                />
                <Input
                    placeholder="본문 (선택)"
                    value={body}
                    onChange={handleBodyChange}
                    className="bg-rh-bg-primary border-rh-border text-white placeholder:text-rh-text-tertiary"
                />
            </div>

            {/* 알림 */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-rh-status-error bg-rh-bg-surface px-4 py-3"
                >
                    <p className="text-[13px] text-rh-status-error">
                        {error}
                    </p>
                </div>
            )}
            {success && !error && (
                <div className="rounded-lg border border-rh-accent/40 bg-rh-bg-surface px-4 py-3">
                    <p className="text-[13px] text-rh-accent">
                        {success}
                    </p>
                </div>
            )}

            {/* 대상 헤더 */}
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white">
                    대상 선택
                    <span className="ml-2 text-[12px] font-normal text-rh-text-tertiary">
                        {selectedIds.size}/{uniqueTargets.length}명
                    </span>
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="p-1.5 rounded-lg active:opacity-70 transition-opacity"
                        aria-label="새로고침"
                    >
                        <RefreshCw
                            size={14}
                            className="text-rh-text-tertiary"
                        />
                    </button>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={filteredTargets.length === 0}
                        className={
                            "px-3 py-1.5 rounded-lg text-[12px] font-medium active:opacity-80 transition-opacity disabled:opacity-40 " +
                            (visibleSelectedCount ===
                            filteredTargets.length
                                ? "bg-rh-accent/20 text-rh-accent"
                                : "bg-rh-bg-muted text-rh-text-secondary")
                        }
                    >
                        {visibleSelectedCount === filteredTargets.length &&
                        filteredTargets.length > 0
                            ? "전체 해제"
                            : "전체 선택"}
                    </button>
                </div>
            </div>

            {/* 검색 */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rh-text-tertiary pointer-events-none"
                />
                <Input
                    placeholder="이름, 크루명, 플랫폼 검색"
                    value={query}
                    onChange={handleQueryChange}
                    className="pl-9 bg-rh-bg-surface border-rh-border text-white placeholder:text-rh-text-tertiary"
                />
            </div>

            {/* 대상 목록 */}
            {filteredTargets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-rh-bg-surface">
                    <Bell className="w-10 h-10 mb-2 text-rh-text-muted" />
                    <p className="text-sm text-rh-text-tertiary">
                        {uniqueTargets.length === 0
                            ? "푸시 토큰이 등록된 사용자가 없습니다"
                            : "검색 결과가 없습니다"}
                    </p>
                </div>
            ) : (
                <AnimatedList
                    className="space-y-2"
                    maxStaggerSec={0.6}
                >
                    {filteredTargets.map((target) => (
                        <AnimatedItem key={target.userId}>
                            <TargetRow
                                target={target}
                                isSelected={selectedIds.has(
                                    target.userId
                                )}
                                isCurrentUser={
                                    target.userId === currentUserId
                                }
                                onToggle={handleToggle}
                            />
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            )}

            {/* 발송 버튼 */}
            <Button
                type="button"
                onClick={handleSend}
                disabled={isSending || selectedIds.size === 0}
                className="w-full h-12 bg-rh-accent hover:bg-rh-accent-hover text-white font-semibold rounded-xl disabled:opacity-40 transition-opacity"
            >
                {isSending ? (
                    <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" color="white" />
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

export default memo(PushTestClient);

// ─── Target Row ───

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
    const handleClick = useCallback(() => {
        onToggle(target.userId);
    }, [onToggle, target.userId]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className="flex items-center w-full gap-3 rounded-xl px-4 py-3 active:opacity-80 transition-opacity text-left bg-rh-bg-surface"
        >
            {/* 체크박스 */}
            <div
                className={
                    "flex items-center justify-center shrink-0 rounded-md transition-colors w-[22px] h-[22px] " +
                    (isSelected
                        ? "bg-rh-accent border-0"
                        : "bg-transparent border-2 border-rh-text-muted")
                }
            >
                {isSelected ? (
                    <Check
                        size={14}
                        strokeWidth={3}
                        className="text-white"
                    />
                ) : null}
            </div>

            {/* 아바타 */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full shrink-0 bg-rh-bg-muted">
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
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 bg-rh-accent/20 text-rh-accent">
                            나
                        </span>
                    ) : null}
                </div>
                <p className="text-[11px] mt-0.5 truncate text-rh-text-tertiary">
                    {target.crewName} · {target.platform}
                </p>
            </div>
        </button>
    );
});
