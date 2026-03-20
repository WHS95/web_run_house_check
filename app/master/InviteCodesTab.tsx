"use client";

import React, { useState, useCallback, memo } from "react";
import {
    Copy,
    Eye,
    EyeOff,
    Edit,
    Save,
    X,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { haptic } from "@/lib/haptic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Crew, InviteCode } from "./page";
import type { NotificationType } from "@/components/molecules/common/PopupNotification";

interface InviteCodesTabProps {
    crews: Crew[];
    inviteCodes: InviteCode[];
    showNotification: (
        message: string,
        type: NotificationType
    ) => void;
    onDataRefresh: () => void;
}

export default function InviteCodesTab({
    crews,
    inviteCodes,
    showNotification,
    onDataRefresh,
}: InviteCodesTabProps) {
    const [showCodeForm, setShowCodeForm] = useState(false);
    const [newCrewId, setNewCrewId] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const [editingCode, setEditingCode] = useState<
        number | null
    >(null);
    const [editForm, setEditForm] = useState({
        invite_code: "",
        description: "",
        is_active: true,
    });
    // [rerender-functional-setstate] Set 상태 관리
    const [visibleCodes, setVisibleCodes] = useState<
        Set<number>
    >(() => new Set());

    // ─── 생성 ───

    const handleCreate = useCallback(async () => {
        if (!newCrewId) {
            showNotification(
                "크루를 선택해주세요.",
                "error"
            );
            return;
        }
        setIsCreating(true);
        haptic.medium();
        try {
            const res = await fetch(
                "/api/master/invite-codes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        crew_id: newCrewId,
                        description: newDesc.trim() || null,
                    }),
                }
            );
            const result = await res.json();
            if (res.ok && result.success) {
                showNotification(
                    "초대 코드가 생성되었습니다.",
                    "success"
                );
                setNewCrewId("");
                setNewDesc("");
                setShowCodeForm(false);
                onDataRefresh();
            } else {
                showNotification(
                    result.message ||
                        "초대 코드 생성에 실패했습니다.",
                    "error"
                );
            }
        } catch {
            showNotification(
                "초대 코드 생성 중 오류가 발생했습니다.",
                "error"
            );
        } finally {
            setIsCreating(false);
        }
    }, [newCrewId, newDesc, showNotification, onDataRefresh]);

    // ─── 수정 ───

    const handleUpdate = useCallback(
        async (codeId: number) => {
            try {
                const res = await fetch(
                    `/api/master/invite-codes/${codeId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            invite_code:
                                editForm.invite_code.trim(),
                            description:
                                editForm.description.trim() ||
                                null,
                            is_active: editForm.is_active,
                        }),
                    }
                );
                const result = await res.json();
                if (res.ok && result.success) {
                    showNotification(
                        "초대 코드가 수정되었습니다.",
                        "success"
                    );
                    setEditingCode(null);
                    onDataRefresh();
                } else {
                    showNotification(
                        result.message ||
                            "초대 코드 수정에 실패했습니다.",
                        "error"
                    );
                }
            } catch {
                showNotification(
                    "초대 코드 수정 중 오류가 발생했습니다.",
                    "error"
                );
            }
        },
        [editForm, showNotification, onDataRefresh]
    );

    // ─── 유틸 ───

    const copyToClipboard = useCallback(
        async (code: string) => {
            try {
                await navigator.clipboard.writeText(code);
                showNotification(
                    "클립보드에 복사되었습니다.",
                    "success"
                );
                haptic.light();
            } catch {
                showNotification(
                    "복사에 실패했습니다.",
                    "error"
                );
            }
        },
        [showNotification]
    );

    const toggleVisibility = useCallback((codeId: number) => {
        // [rerender-functional-setstate]
        setVisibleCodes((prev) => {
            const next = new Set(prev);
            if (next.has(codeId)) next.delete(codeId);
            else next.add(codeId);
            return next;
        });
    }, []);

    const startEditing = useCallback((code: InviteCode) => {
        setEditingCode(code.id);
        setEditForm({
            invite_code: code.invite_code,
            description: code.description || "",
            is_active: code.is_active,
        });
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingCode(null);
        setEditForm({
            invite_code: "",
            description: "",
            is_active: true,
        });
    }, []);

    return (
        <div className="space-y-5">
            {/* 라벨 + 생성 버튼 */}
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white">
                    초대 코드
                </span>
                <button
                    onClick={() => {
                        haptic.light();
                        setShowCodeForm((v) => !v);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-rh-accent text-white active:opacity-80 transition-opacity"
                >
                    + 생성
                </button>
            </div>

            {/* 생성 폼 */}
            {showCodeForm ? (
                <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: "#2B3644" }}
                >
                    <select
                        value={newCrewId}
                        onChange={(e) =>
                            setNewCrewId(e.target.value)
                        }
                        className="w-full h-11 rounded-lg px-4 text-white text-sm border"
                        style={{
                            backgroundColor: "#1D2530",
                            borderColor: "#374151",
                        }}
                    >
                        <option value="">
                            크루를 선택하세요
                        </option>
                        {crews.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <Input
                        placeholder="코드 설명 (선택)"
                        value={newDesc}
                        onChange={(e) =>
                            setNewDesc(e.target.value)
                        }
                        className="text-white bg-rh-bg-primary border-rh-border placeholder:text-rh-text-tertiary"
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleCreate}
                            disabled={
                                isCreating || !newCrewId
                            }
                            className="flex-1 bg-rh-accent hover:bg-rh-accent-hover text-white disabled:opacity-50"
                        >
                            {isCreating
                                ? "생성 중..."
                                : "초대 코드 생성"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setShowCodeForm(false)
                            }
                            className="text-rh-text-secondary"
                        >
                            취소
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* 코드 리스트 */}
            <div className="space-y-2">
                {inviteCodes.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center py-12 rounded-xl"
                        style={{ backgroundColor: "#2B3644" }}
                    >
                        <p
                            className="text-sm"
                            style={{ color: "#64748B" }}
                        >
                            생성된 초대 코드가 없습니다
                        </p>
                    </div>
                ) : (
                    inviteCodes.map((code) => (
                        <InviteCodeCard
                            key={code.id}
                            code={code}
                            isEditing={
                                editingCode === code.id
                            }
                            editForm={editForm}
                            setEditForm={setEditForm}
                            isVisible={visibleCodes.has(
                                code.id
                            )}
                            onToggleVisibility={
                                toggleVisibility
                            }
                            onStartEditing={startEditing}
                            onCancelEditing={cancelEditing}
                            onUpdate={handleUpdate}
                            onCopy={copyToClipboard}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// ─── [rerender-memo] 초대코드 카드 메모이제이션 ───

const InviteCodeCard = memo(function InviteCodeCard({
    code,
    isEditing,
    editForm,
    setEditForm,
    isVisible,
    onToggleVisibility,
    onStartEditing,
    onCancelEditing,
    onUpdate,
    onCopy,
}: {
    code: InviteCode;
    isEditing: boolean;
    editForm: {
        invite_code: string;
        description: string;
        is_active: boolean;
    };
    setEditForm: (v: {
        invite_code: string;
        description: string;
        is_active: boolean;
    }) => void;
    isVisible: boolean;
    onToggleVisibility: (id: number) => void;
    onStartEditing: (code: InviteCode) => void;
    onCancelEditing: () => void;
    onUpdate: (id: number) => void;
    onCopy: (code: string) => void;
}) {
    return (
        <div
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "#2B3644" }}
        >
            {/* 헤더 */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-white">
                        {code.crew_name ||
                            `크루 ID: ${code.crew_id.slice(0, 8)}...`}
                    </p>
                    <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "#64748B" }}
                    >
                        생성일:{" "}
                        {new Date(
                            code.created_at
                        ).toLocaleDateString("ko-KR")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={
                            code.is_active
                                ? {
                                      backgroundColor:
                                          "rgba(139, 181, 245, 0.2)",
                                      color: "#8BB5F5",
                                  }
                                : {
                                      backgroundColor:
                                          "rgba(62, 100, 150, 0.2)",
                                      color: "#3E6496",
                                  }
                        }
                    >
                        {code.is_active ? "활성" : "비활성"}
                    </span>
                    <button
                        onClick={() => onStartEditing(code)}
                        className="p-1 rounded active:opacity-70"
                    >
                        <Edit
                            size={14}
                            style={{ color: "#94A3B8" }}
                        />
                    </button>
                </div>
            </div>

            {/* 편집 모드 vs 일반 */}
            {isEditing ? (
                <div
                    className="space-y-3 p-3 rounded-lg border"
                    style={{
                        backgroundColor: "#1D2530",
                        borderColor: "#374151",
                    }}
                >
                    <div>
                        <label
                            className="block text-xs font-medium mb-1"
                            style={{ color: "#94A3B8" }}
                        >
                            초대 코드
                        </label>
                        <Input
                            value={editForm.invite_code}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    invite_code:
                                        e.target.value,
                                })
                            }
                            className="text-white bg-rh-bg-surface border-rh-border font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label
                            className="block text-xs font-medium mb-1"
                            style={{ color: "#94A3B8" }}
                        >
                            설명
                        </label>
                        <Input
                            value={editForm.description}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    description:
                                        e.target.value,
                                })
                            }
                            className="text-white bg-rh-bg-surface border-rh-border text-sm"
                        />
                    </div>
                    <button
                        onClick={() =>
                            setEditForm({
                                ...editForm,
                                is_active:
                                    !editForm.is_active,
                            })
                        }
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#94A3B8" }}
                    >
                        {editForm.is_active ? (
                            <ToggleRight
                                size={20}
                                style={{ color: "#8BB5F5" }}
                            />
                        ) : (
                            <ToggleLeft
                                size={20}
                                style={{ color: "#64748B" }}
                            />
                        )}
                        {editForm.is_active
                            ? "활성"
                            : "비활성"}
                    </button>
                    <div className="flex gap-2">
                        <Button
                            onClick={() =>
                                onUpdate(code.id)
                            }
                            disabled={
                                !editForm.invite_code.trim()
                            }
                            className="flex-1 bg-rh-accent text-white disabled:opacity-50"
                        >
                            <Save
                                size={14}
                                className="mr-1"
                            />
                            저장
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onCancelEditing}
                            className="text-rh-text-secondary"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {code.description ? (
                        <p
                            className="text-xs"
                            style={{ color: "#94A3B8" }}
                        >
                            {code.description}
                        </p>
                    ) : null}
                    <div
                        className="flex items-center gap-2 p-3 rounded-lg"
                        style={{
                            backgroundColor: "#1D2530",
                        }}
                    >
                        <code
                            className="flex-1 text-base font-mono"
                            style={{ color: "#669FF2" }}
                        >
                            {isVisible
                                ? code.invite_code
                                : "*".repeat(
                                      code.invite_code
                                          .length
                                  )}
                        </code>
                        <button
                            onClick={() =>
                                onToggleVisibility(code.id)
                            }
                            className="p-1.5 active:opacity-70"
                        >
                            {isVisible ? (
                                <EyeOff
                                    size={16}
                                    style={{
                                        color: "#94A3B8",
                                    }}
                                />
                            ) : (
                                <Eye
                                    size={16}
                                    style={{
                                        color: "#94A3B8",
                                    }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() =>
                                onCopy(code.invite_code)
                            }
                            className="p-1.5 active:opacity-70"
                        >
                            <Copy
                                size={16}
                                style={{ color: "#94A3B8" }}
                            />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
});
