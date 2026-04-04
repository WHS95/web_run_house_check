"use client";

import { useState, useCallback, useRef, memo } from "react";
import { Send } from "lucide-react";
import AdminSelect from "@/app/admin2/components/ui/AdminSelect";
import AdminLabeledInput from "@/app/admin2/components/ui/AdminLabeledInput";
import AdminDivider from "@/app/admin2/components/ui/AdminDivider";
import PushHistoryItem from "@/app/admin2/components/ui/PushHistoryItem";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

interface PushHistory {
    id: string;
    title: string;
    date: string;
    target: string;
    status: string;
}

interface PushManagementProps {
    crewId: string;
}

const TARGET_OPTIONS = [
    { value: "all", label: "전체 크루원" },
];

const PushManagement = memo(function PushManagement({
    crewId,
}: PushManagementProps) {
    const [target, setTarget] = useState("all");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<PushHistory[]>([]);

    const canSend = title.trim() && body.trim() && !isSending;

    // ref로 최신 값 참조 — handleSend 재생성 방지
    const titleRef = useRef(title);
    titleRef.current = title;
    const bodyRef = useRef(body);
    bodyRef.current = body;

    const handleSend = useCallback(async () => {
        const currentTitle = titleRef.current.trim();
        const currentBody = bodyRef.current.trim();
        if (!currentTitle || !currentBody) return;

        setIsSending(true);
        try {
            // 먼저 대상 토큰 조회
            const targetRes = await fetch("/api/push/test");
            const targetData = await targetRes.json();

            if (!targetRes.ok || !targetData.targets?.length) {
                alert("활성화된 푸시 토큰이 없습니다.");
                return;
            }

            const userIds = targetData.targets.map(
                (t: { userId: string }) => t.userId
            );

            // 푸시 발송
            const res = await fetch("/api/push/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userIds,
                    title: currentTitle,
                    body: currentBody,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                // 발송 내역 추가
                const now = new Date();
                const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
                setHistory((prev) => [
                    {
                        id: crypto.randomUUID(),
                        title: currentTitle,
                        date: dateStr,
                        target: `전체 크루원 · ${result.targetCount}명`,
                        status: `발송 완료`,
                    },
                    ...prev,
                ]);

                // 폼 초기화
                setTitle("");
                setBody("");
                alert(
                    `발송 완료 (성공: ${result.successCount}, 실패: ${result.failureCount})`
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
            <AdminSelect
                label="발송 대상"
                value={target}
                onChange={setTarget}
                options={TARGET_OPTIONS}
                placeholder="선택해주세요"
            />

            {/* 알림 제목 */}
            <AdminLabeledInput
                label="알림 제목"
                value={title}
                onChange={setTitle}
                placeholder="알림 제목을 입력하세요"
            />

            {/* 알림 내용 */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium"
                    style={{ color: "#94A3B8" }}>
                    알림 내용
                </label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="크루원에게 전달할 내용을 입력하세요"
                    rows={4}
                    className="w-full h-[120px] px-4 py-4 rounded-lg border text-sm text-white placeholder:text-rh-text-muted outline-none resize-none transition-colors focus:border-rh-accent"
                    style={{
                        backgroundColor: "#2B3644",
                        borderColor: "#374151",
                    }}
                />
            </div>

            {/* 발송 버튼 */}
            <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{
                    backgroundColor: "#669FF2",
                }}
            >
                <Send size={18} />
                {isSending ? "발송 중..." : "알림 발송"}
            </button>

            {/* 구분선 */}
            <AdminDivider />

            {/* 최근 발송 내역 */}
            <div className="flex flex-col gap-3">
                <span
                    className="text-[11px] font-semibold tracking-[2px]"
                    style={{ color: "#64748B" }}
                >
                    최근 발송 내역
                </span>

                {history.length === 0 ? (
                    <div
                        className="flex items-center justify-center h-20 rounded-xl"
                        style={{ backgroundColor: "#2B3644" }}
                    >
                        <span className="text-xs"
                            style={{ color: "#64748B" }}>
                            발송 내역이 없습니다
                        </span>
                    </div>
                ) : (
                    <AnimatedList className="flex flex-col gap-3">
                        {history.map((item) => (
                            <AnimatedItem key={item.id}>
                                <PushHistoryItem
                                    title={item.title}
                                    date={item.date}
                                    target={item.target}
                                    status={item.status}
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                )}
            </div>
        </div>
    );
});

export default PushManagement;
