"use client";

import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { Send, ChevronDown } from "lucide-react";
import AdminSegmentedControl from "@/app/admin2/components/ui/AdminSegmentedControl";
import AdminMemberChip from "@/app/admin2/components/ui/AdminMemberChip";
import AdminMemberPickerSheet from "@/app/admin2/components/ui/AdminMemberPickerSheet";
import AdminLabeledInput from "@/app/admin2/components/ui/AdminLabeledInput";
import AdminDivider from "@/app/admin2/components/ui/AdminDivider";
import PushHistoryItem from "@/app/admin2/components/ui/PushHistoryItem";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import { getAdminCrewUsersAction } from "@/app/admin2/actions";

interface Member {
    id: string;
    name: string;
}

interface PushHistoryRow {
    id: string;
    title: string;
    target_mode: "all" | "select";
    target_count: number;
    success_count: number;
    failure_count: number;
    created_at: string;
}

interface PushManagementProps {
    crewId: string;
}

function formatHistoryDate(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
function formatHistoryTarget(row: PushHistoryRow): string {
    const label = row.target_mode === "all" ? "전체 크루원" : "선택 크루원";
    return `${label} · ${row.target_count}명`;
}
function formatHistoryStatus(row: PushHistoryRow): string {
    return row.failure_count > 0 ? "일부 실패" : "발송 완료";
}

const PushManagement = memo(function PushManagement({
    crewId,
}: PushManagementProps) {
    const [mode, setMode] = useState<"all" | "select">("all");
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<PushHistoryRow[]>([]);

    // 크루원 로드
    useEffect(() => {
        let cancelled = false;
        getAdminCrewUsersAction({ crewId })
            .then((result) => {
                if (cancelled) return;
                if (result.success && Array.isArray(result.data)) {
                    const list: Member[] = result.data.map(
                        (u: any) => ({
                            id: u.id,
                            name: u.first_name,
                        }),
                    );
                    setMembers(list);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [crewId]);

    // 발송 내역 로드
    useEffect(() => {
        let cancelled = false;
        fetch(`/api/admin/push-history?crewId=${crewId}`)
            .then((res) => res.json())
            .then((json) => {
                if (cancelled) return;
                if (json?.success && Array.isArray(json.data)) {
                    setHistory(json.data);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [crewId]);

    const targetIds = useMemo(
        () =>
            mode === "all"
                ? members.map((m) => m.id)
                : Array.from(selectedIds),
        [mode, members, selectedIds],
    );

    const selectedMembers = useMemo(
        () => members.filter((m) => selectedIds.has(m.id)),
        [members, selectedIds],
    );

    const canSend =
        title.trim().length > 0 &&
        body.trim().length > 0 &&
        targetIds.length > 0 &&
        !isSending;

    const segmentOptions = useMemo(
        () => [
            { value: "all", label: "전체" },
            { value: "select", label: "선택", badge: selectedIds.size },
        ],
        [selectedIds.size],
    );

    const handleModeChange = useCallback((value: string) => {
        setMode(value as "all" | "select");
    }, []);

    const handleOpenPicker = useCallback(() => {
        setPickerOpen(true);
    }, []);

    const handleClosePicker = useCallback(() => {
        setPickerOpen(false);
    }, []);

    const handleConfirmPicker = useCallback((ids: Set<string>) => {
        setSelectedIds(ids);
    }, []);

    const handleRemoveMember = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    // ref로 최신 값 참조
    const titleRef = useRef(title);
    titleRef.current = title;
    const bodyRef = useRef(body);
    bodyRef.current = body;
    const targetIdsRef = useRef(targetIds);
    targetIdsRef.current = targetIds;
    const modeRef = useRef(mode);
    modeRef.current = mode;
    const crewIdRef = useRef(crewId);
    crewIdRef.current = crewId;

    const handleSend = useCallback(async () => {
        const currentTitle = titleRef.current.trim();
        const currentBody = bodyRef.current.trim();
        const currentIds = targetIdsRef.current;
        if (!currentTitle || !currentBody || currentIds.length === 0) return;

        setIsSending(true);
        try {
            const res = await fetch("/api/push/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: currentIds,
                    title: currentTitle,
                    body: currentBody,
                    crewId: crewIdRef.current,
                    targetMode: modeRef.current,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                if (result.history) {
                    setHistory((prev) =>
                        [result.history as PushHistoryRow, ...prev].slice(0, 5),
                    );
                }

                setTitle("");
                setBody("");
                alert(
                    `발송 완료 (성공: ${result.successCount}, 실패: ${result.failureCount})`,
                );
            } else {
                alert(result.error || "발송에 실패했습니다.");
            }
        } catch {
            alert("발송 중 오류가 발생했습니다.");
        } finally {
            setIsSending(false);
        }
    }, []);

    return (
        <div className="flex-1 flex flex-col gap-5 px-4 pt-5">
            {/* 발송 대상 */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-rh-text-secondary">
                    발송 대상
                </label>
                <AdminSegmentedControl
                    options={segmentOptions}
                    value={mode}
                    onChange={handleModeChange}
                />

                {mode === "select" && (
                    <div className="flex flex-col gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleOpenPicker}
                            className="flex items-center justify-between h-12 px-4 rounded-lg bg-rh-bg-surface border border-rh-border text-sm"
                        >
                            <span
                                className={
                                    selectedIds.size > 0
                                        ? "text-white"
                                        : "text-rh-text-muted"
                                }
                            >
                                {selectedIds.size > 0
                                    ? `크루원 선택 (${selectedIds.size}명)`
                                    : "크루원을 선택해주세요"}
                            </span>
                            <ChevronDown
                                size={18}
                                className="text-rh-text-tertiary"
                            />
                        </button>

                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedMembers.map((m) => (
                                    <AdminMemberChip
                                        key={m.id}
                                        name={m.name}
                                        onRemove={() =>
                                            handleRemoveMember(m.id)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 알림 제목 */}
            <AdminLabeledInput
                label="알림 제목"
                value={title}
                onChange={setTitle}
                placeholder="알림 제목을 입력하세요"
            />

            {/* 알림 내용 */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-rh-text-secondary">
                    알림 내용
                </label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="크루원에게 전달할 내용을 입력하세요"
                    rows={4}
                    className="w-full h-[120px] px-4 py-4 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white placeholder:text-rh-text-muted outline-none resize-none transition-colors focus:border-rh-accent"
                />
            </div>

            {/* 발송 버튼 */}
            <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
                <Send size={18} />
                {isSending ? "발송 중..." : "알림 발송"}
            </button>

            <AdminDivider />

            {/* 최근 발송 내역 */}
            <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold tracking-[2px] text-rh-text-tertiary">
                    최근 발송 내역
                </span>

                {history.length === 0 ? (
                    <div className="flex items-center justify-center h-20 rounded-xl bg-rh-bg-surface">
                        <span className="text-xs text-rh-text-tertiary">
                            발송 내역이 없습니다
                        </span>
                    </div>
                ) : (
                    <AnimatedList className="flex flex-col gap-3">
                        {history.map((item) => (
                            <AnimatedItem key={item.id}>
                                <PushHistoryItem
                                    title={item.title}
                                    date={formatHistoryDate(item.created_at)}
                                    target={formatHistoryTarget(item)}
                                    status={formatHistoryStatus(item)}
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                )}
            </div>

            {/* 멤버 선택 바텀시트 */}
            <AdminMemberPickerSheet
                open={pickerOpen}
                onClose={handleClosePicker}
                members={members}
                selectedIds={selectedIds}
                onConfirm={handleConfirmPicker}
            />
        </div>
    );
});

export default PushManagement;
