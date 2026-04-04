"use client";

import {
    memo,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    AdminBadge,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import { Copy, Shuffle } from "lucide-react";
import { haptic } from "@/lib/haptic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

interface InviteCode {
    id: number;
    crew_id: string;
    invite_code: string;
    description: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    use_count?: number;
}

interface InviteCodesTabProps {
    crewId: string;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function generateRandomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
        result += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }
    return result;
}

const InviteCodesTab = memo(function InviteCodesTab({
    crewId,
}: InviteCodesTabProps) {
    const [codes, setCodes] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [saving, setSaving] = useState(false);
    const [regenerateTarget, setRegenerateTarget] =
        useState<InviteCode | null>(null);

    // 초대코드 조회
    const fetchCodes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/admin/invite-codes?crewId=${crewId}`
            );
            const result = await res.json();
            if (res.ok && result.success) {
                // API가 단일 객체 또는 배열 반환
                const data = result.data;
                setCodes(
                    Array.isArray(data)
                        ? data
                        : data
                          ? [data]
                          : []
                );
            }
        } catch {
            // 에러 무시
        } finally {
            setLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        fetchCodes();
    }, [fetchCodes]);

    // 코드 복사
    const handleCopy = useCallback(
        async (code: string) => {
            try {
                await navigator.clipboard.writeText(code);
                haptic.success();
            } catch {
                haptic.error();
            }
        },
        []
    );

    // 새 코드 생성
    const handleCreate = useCallback(async () => {
        if (!newCode.trim() || newCode.length !== 7) return;
        setSaving(true);
        haptic.medium();

        try {
            const res = await fetch(
                "/api/admin/invite-codes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        crewId,
                        inviteCode: newCode.trim(),
                    }),
                }
            );
            if (res.ok) {
                haptic.success();
                setShowForm(false);
                setNewCode("");
                await fetchCodes();
            }
        } catch {
            haptic.error();
        } finally {
            setSaving(false);
        }
    }, [newCode, crewId, fetchCodes]);

    // 코드 재생성
    const handleRegenerate = useCallback(async () => {
        if (!regenerateTarget) return;
        haptic.medium();

        try {
            const res = await fetch(
                `/api/admin/invite-codes?codeId=${regenerateTarget.id}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                // 삭제 후 새 코드 자동 생성
                const newCodeStr = generateRandomCode();
                const createRes = await fetch(
                    "/api/admin/invite-codes",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            crewId,
                            inviteCode: newCodeStr,
                        }),
                    }
                );
                if (createRes.ok) {
                    haptic.success();
                    await fetchCodes();
                }
            }
        } catch {
            haptic.error();
        } finally {
            setRegenerateTarget(null);
        }
    }, [regenerateTarget, crewId, fetchCodes]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-24 rounded-xl bg-rh-bg-surface"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">
                    초대코드 목록
                </h3>
                <span className="text-xs text-rh-text-secondary">
                    {codes.length}개
                </span>
            </div>

            {/* 코드 목록 */}
            {codes.length > 0 ? (
                <AnimatedList className="space-y-3">
                    {codes.map((code) => (
                        <AnimatedItem key={code.id}>
                            <div className="px-4 py-4 space-y-3 rounded-xl bg-rh-bg-surface">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-mono text-base font-bold text-white">
                                            {
                                                code.invite_code
                                            }
                                        </span>
                                        <AdminBadge variant="accent">
                                            활성
                                        </AdminBadge>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <button
                                            onClick={() =>
                                                handleCopy(
                                                    code.invite_code
                                                )
                                            }
                                            className="p-1.5 text-rh-text-secondary"
                                        >
                                            <Copy
                                                size={16}
                                            />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setRegenerateTarget(
                                                    code
                                                )
                                            }
                                            className="p-1.5 text-rh-text-secondary"
                                        >
                                            <Shuffle
                                                size={16}
                                            />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-xs text-rh-text-secondary">
                                    {code.use_count !==
                                        undefined && (
                                        <span>
                                            사용 횟수:{" "}
                                            {code.use_count}
                                            회
                                        </span>
                                    )}
                                    <span>
                                        생성일:{" "}
                                        {formatDate(
                                            code.created_at
                                        )}
                                    </span>
                                </div>
                            </div>
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            ) : (
                <div className="py-12 text-center">
                    <p className="text-sm text-rh-text-secondary">
                        등록된 초대코드가 없습니다
                    </p>
                </div>
            )}

            {/* 새 코드 생성 폼 */}
            {showForm && (
                <div className="px-4 py-4 space-y-3 rounded-xl border bg-rh-bg-surface border-rh-accent">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCode}
                            onChange={(e) => {
                                const v = e.target.value
                                    .toUpperCase()
                                    .replace(
                                        /[^A-Z0-9]/g,
                                        ""
                                    );
                                if (v.length <= 7)
                                    setNewCode(v);
                            }}
                            placeholder="7자리 영문+숫자"
                            maxLength={7}
                            className="flex-1 px-4 h-11 font-mono text-sm text-white rounded-lg border outline-none bg-rh-bg-primary border-rh-border placeholder:text-rh-text-muted focus:border-rh-accent"
                        />
                        <button
                            onClick={() => {
                                setNewCode(
                                    generateRandomCode()
                                );
                                haptic.light();
                            }}
                            className="px-3 h-11 rounded-lg bg-rh-bg-muted text-rh-text-secondary"
                        >
                            <Shuffle size={18} />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setNewCode("");
                            }}
                            className="flex-1 h-11 text-sm font-medium text-white rounded-xl bg-rh-bg-muted"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={
                                saving ||
                                newCode.length !== 7
                            }
                            className="flex-1 h-11 text-sm font-semibold text-white rounded-xl bg-rh-accent disabled:opacity-50"
                        >
                            {saving
                                ? "생성 중..."
                                : "생성"}
                        </button>
                    </div>
                </div>
            )}



            {/* 재생성 확인 */}
            <AdminAlertDialog
                open={!!regenerateTarget}
                onClose={() => setRegenerateTarget(null)}
                onConfirm={handleRegenerate}
                title="초대코드 재생성"
                description="기존 초대코드가 무효화되고 새로운 코드가 생성됩니다."
                confirmLabel="재생성"
                confirmVariant="danger"
            />
        </div>
    );
});

export default InviteCodesTab;
