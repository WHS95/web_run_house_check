"use client";

import {
    memo,
    useCallback,
    useState,
    useTransition,
} from "react";
import {
    Copy,
    Eye,
    EyeOff,
    Edit,
    Save,
    X,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import { haptic } from "@/lib/haptic";
import {
    createMasterInviteCodeAction,
    updateMasterInviteCodeAction,
    deactivateMasterInviteCodeAction,
} from "@/app/master/invite-codes/actions";
import type { InviteCodeRow } from "@/lib/domain/invite/types";

interface CrewInvitesClientProps {
    crewId: string;
    crewName: string;
    initialCodes: InviteCodeRow[];
}

interface EditFormState {
    invite_code: string;
    description: string;
    is_active: boolean;
}

const EMPTY_EDIT_FORM: EditFormState = {
    invite_code: "",
    description: "",
    is_active: true,
};

function CrewInvitesClient({
    crewId,
    crewName,
    initialCodes,
}: CrewInvitesClientProps) {
    const [codes, setCodes] = useState<InviteCodeRow[]>(initialCodes);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newDesc, setNewDesc] = useState("");
    const [editingCode, setEditingCode] = useState<number | null>(null);
    const [editForm, setEditForm] =
        useState<EditFormState>(EMPTY_EDIT_FORM);
    const [visibleCodes, setVisibleCodes] = useState<Set<number>>(
        () => new Set()
    );
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isCreating, startCreateTransition] = useTransition();
    const [, startMutateTransition] = useTransition();

    const resetMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    // ─── 생성 ───

    const handleNewDescChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setNewDesc(e.target.value);
        },
        []
    );

    const handleToggleCreateForm = useCallback(() => {
        haptic.light();
        setShowCreateForm((prev) => !prev);
        resetMessages();
    }, [resetMessages]);

    const handleCreate = useCallback(() => {
        haptic.medium();
        resetMessages();
        startCreateTransition(async () => {
            try {
                const result = await createMasterInviteCodeAction({
                    crewId,
                    description: newDesc.trim() || null,
                });
                if (result.success && result.data) {
                    // 새 코드를 prepend (정렬 기준 created_at desc)
                    const created: InviteCodeRow = {
                        id: result.data.id,
                        crew_id: result.data.crew_id,
                        invite_code: result.data.invite_code,
                        description: result.data.description,
                        is_active: result.data.is_active,
                        used_count: result.data.used_count ?? null,
                        max_uses: result.data.max_uses ?? null,
                        expires_at: result.data.expires_at ?? null,
                        created_at: result.data.created_at,
                        updated_at: result.data.updated_at ?? null,
                        created_by: result.data.created_by ?? null,
                    };
                    setCodes((prev) => [created, ...prev]);
                    setNewDesc("");
                    setShowCreateForm(false);
                    setSuccess(
                        result.message ??
                            "초대 코드가 생성되었습니다."
                    );
                } else {
                    setError(
                        result.message ??
                            "초대 코드 생성에 실패했습니다."
                    );
                }
            } catch {
                setError("초대 코드 생성 중 오류가 발생했습니다.");
            }
        });
    }, [crewId, newDesc, resetMessages]);

    // ─── 수정 ───

    const handleStartEditing = useCallback((code: InviteCodeRow) => {
        setEditingCode(code.id);
        setEditForm({
            invite_code: code.invite_code,
            description: code.description ?? "",
            is_active: code.is_active ?? true,
        });
    }, []);

    const handleCancelEditing = useCallback(() => {
        setEditingCode(null);
        setEditForm(EMPTY_EDIT_FORM);
    }, []);

    const handleUpdate = useCallback(
        (codeId: number) => {
            resetMessages();
            startMutateTransition(async () => {
                try {
                    const result = await updateMasterInviteCodeAction({
                        codeId,
                        inviteCode: editForm.invite_code.trim(),
                        description:
                            editForm.description.trim() || null,
                        isActive: editForm.is_active,
                    });
                    if (result.success && result.data) {
                        const updated = result.data;
                        setCodes((prev) =>
                            prev.map((c) =>
                                c.id === codeId
                                    ? { ...c, ...updated }
                                    : c
                            )
                        );
                        setEditingCode(null);
                        setEditForm(EMPTY_EDIT_FORM);
                        setSuccess(
                            result.message ??
                                "초대 코드가 수정되었습니다."
                        );
                    } else {
                        setError(
                            result.message ??
                                "초대 코드 수정에 실패했습니다."
                        );
                    }
                } catch {
                    setError(
                        "초대 코드 수정 중 오류가 발생했습니다."
                    );
                }
            });
        },
        [editForm, resetMessages]
    );

    // ─── 활성 토글 (수정 모드 외 빠른 토글) ───

    const handleToggleActive = useCallback(
        (codeId: number, currentActive: boolean) => {
            haptic.light();
            resetMessages();
            startMutateTransition(async () => {
                try {
                    const result = await updateMasterInviteCodeAction({
                        codeId,
                        isActive: !currentActive,
                    });
                    if (result.success && result.data) {
                        const updated = result.data;
                        setCodes((prev) =>
                            prev.map((c) =>
                                c.id === codeId
                                    ? { ...c, ...updated }
                                    : c
                            )
                        );
                        setSuccess(
                            !currentActive
                                ? "활성화되었습니다."
                                : "비활성화되었습니다."
                        );
                    } else {
                        setError(
                            result.message ??
                                "상태 변경에 실패했습니다."
                        );
                    }
                } catch {
                    setError("상태 변경 중 오류가 발생했습니다.");
                }
            });
        },
        [resetMessages]
    );

    // ─── 비활성화(soft delete) ───

    const handleDeactivate = useCallback(
        (codeId: number) => {
            haptic.medium();
            resetMessages();
            startMutateTransition(async () => {
                try {
                    const result =
                        await deactivateMasterInviteCodeAction({
                            codeId,
                        });
                    if (result.success && result.data) {
                        const updated = result.data;
                        setCodes((prev) =>
                            prev.map((c) =>
                                c.id === codeId
                                    ? { ...c, ...updated }
                                    : c
                            )
                        );
                        setSuccess(
                            result.message ??
                                "초대 코드가 비활성화되었습니다."
                        );
                    } else {
                        setError(
                            result.message ??
                                "비활성화에 실패했습니다."
                        );
                    }
                } catch {
                    setError(
                        "초대 코드 비활성화 중 오류가 발생했습니다."
                    );
                }
            });
        },
        [resetMessages]
    );

    // ─── 유틸 ───

    const handleCopy = useCallback(async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            haptic.light();
            setError(null);
            setSuccess("클립보드에 복사되었습니다.");
        } catch {
            setSuccess(null);
            setError("복사에 실패했습니다.");
        }
    }, []);

    const handleToggleVisibility = useCallback((codeId: number) => {
        setVisibleCodes((prev) => {
            const next = new Set(prev);
            if (next.has(codeId)) next.delete(codeId);
            else next.add(codeId);
            return next;
        });
    }, []);

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate">
                        {crewName}
                    </p>
                    <p className="text-[11px] text-rh-text-tertiary mt-0.5">
                        총 {codes.length}개 코드
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleToggleCreateForm}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-rh-accent text-white active:opacity-80 transition-opacity"
                >
                    {showCreateForm ? "취소" : "+ 새 코드 발급"}
                </button>
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

            {/* 발급 폼 */}
            {showCreateForm && (
                <div className="rounded-xl bg-rh-bg-surface p-4 space-y-3">
                    <Input
                        placeholder="코드 설명 (선택)"
                        value={newDesc}
                        onChange={handleNewDescChange}
                        className="bg-rh-bg-primary border-rh-border text-white placeholder:text-rh-text-tertiary"
                        disabled={isCreating}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="flex-1 bg-rh-accent hover:bg-rh-accent-hover text-white disabled:opacity-50"
                        >
                            {isCreating ? "발급 중..." : "발급"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleToggleCreateForm}
                            className="text-rh-text-secondary"
                            disabled={isCreating}
                        >
                            취소
                        </Button>
                    </div>
                </div>
            )}

            {/* 리스트 */}
            {codes.length === 0 ? (
                <div className="flex items-center justify-center py-12 rounded-xl bg-rh-bg-surface">
                    <p className="text-sm text-rh-text-tertiary">
                        발급된 초대 코드가 없습니다
                    </p>
                </div>
            ) : (
                <AnimatedList
                    className="space-y-2"
                    maxStaggerSec={0.6}
                >
                    {codes.map((code) => (
                        <AnimatedItem key={code.id}>
                            <InviteCodeCard
                                code={code}
                                isEditing={editingCode === code.id}
                                editForm={editForm}
                                setEditForm={setEditForm}
                                isVisible={visibleCodes.has(code.id)}
                                onToggleVisibility={
                                    handleToggleVisibility
                                }
                                onStartEditing={handleStartEditing}
                                onCancelEditing={handleCancelEditing}
                                onUpdate={handleUpdate}
                                onCopy={handleCopy}
                                onToggleActive={handleToggleActive}
                                onDeactivate={handleDeactivate}
                            />
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            )}
        </div>
    );
}

export default memo(CrewInvitesClient);

// ─── Card ───

interface InviteCodeCardProps {
    code: InviteCodeRow;
    isEditing: boolean;
    editForm: EditFormState;
    setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
    isVisible: boolean;
    onToggleVisibility: (id: number) => void;
    onStartEditing: (code: InviteCodeRow) => void;
    onCancelEditing: () => void;
    onUpdate: (id: number) => void;
    onCopy: (code: string) => void;
    onToggleActive: (id: number, currentActive: boolean) => void;
    onDeactivate: (id: number) => void;
}

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
    onToggleActive,
    onDeactivate,
}: InviteCodeCardProps) {
    const isActive = code.is_active ?? false;

    const handleEdit = useCallback(
        () => onStartEditing(code),
        [code, onStartEditing]
    );
    const handleVisibility = useCallback(
        () => onToggleVisibility(code.id),
        [code.id, onToggleVisibility]
    );
    const handleCopyClick = useCallback(
        () => onCopy(code.invite_code),
        [code.invite_code, onCopy]
    );
    const handleSave = useCallback(
        () => onUpdate(code.id),
        [code.id, onUpdate]
    );
    const handleActiveToggle = useCallback(
        () => onToggleActive(code.id, isActive),
        [code.id, isActive, onToggleActive]
    );
    const handleDeactivateClick = useCallback(
        () => onDeactivate(code.id),
        [code.id, onDeactivate]
    );

    const handleEditCodeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditForm((prev) => ({
                ...prev,
                invite_code: e.target.value,
            }));
        },
        [setEditForm]
    );

    const handleEditDescChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setEditForm((prev) => ({
                ...prev,
                description: e.target.value,
            }));
        },
        [setEditForm]
    );

    const handleEditActiveToggle = useCallback(() => {
        setEditForm((prev) => ({
            ...prev,
            is_active: !prev.is_active,
        }));
    }, [setEditForm]);

    return (
        <div
            className={`rounded-xl p-4 space-y-3 bg-rh-bg-surface ${
                isActive ? "" : "opacity-50"
            }`}
        >
            {/* 헤더 */}
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-rh-text-tertiary">
                        생성일{" "}
                        {new Date(code.created_at).toLocaleDateString(
                            "ko-KR"
                        )}
                    </p>
                    {code.description && !isEditing && (
                        <p className="text-[12px] text-rh-text-secondary mt-1 truncate">
                            {code.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className={
                            isActive
                                ? "rounded-full px-2.5 py-1 text-[11px] font-medium bg-rh-accent/20 text-rh-accent"
                                : "rounded-full px-2.5 py-1 text-[11px] font-medium bg-rh-bg-muted text-rh-text-secondary"
                        }
                    >
                        {isActive ? "활성" : "비활성"}
                    </span>
                    {!isEditing && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="p-1 rounded active:opacity-70"
                            aria-label="수정"
                        >
                            <Edit
                                size={14}
                                className="text-rh-text-secondary"
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* 본문 */}
            {isEditing ? (
                <div className="space-y-3 p-3 rounded-lg border border-rh-border bg-rh-bg-primary">
                    <div className="space-y-1">
                        <label className="block text-[12px] font-medium text-rh-text-secondary">
                            초대 코드
                        </label>
                        <Input
                            value={editForm.invite_code}
                            onChange={handleEditCodeChange}
                            className="bg-rh-bg-surface border-rh-border text-white font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[12px] font-medium text-rh-text-secondary">
                            설명
                        </label>
                        <Input
                            value={editForm.description}
                            onChange={handleEditDescChange}
                            className="bg-rh-bg-surface border-rh-border text-white text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleEditActiveToggle}
                        className="flex items-center gap-2 text-sm text-rh-text-secondary"
                    >
                        {editForm.is_active ? (
                            <ToggleRight
                                size={20}
                                className="text-rh-accent"
                            />
                        ) : (
                            <ToggleLeft
                                size={20}
                                className="text-rh-text-tertiary"
                            />
                        )}
                        {editForm.is_active ? "활성" : "비활성"}
                    </button>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={!editForm.invite_code.trim()}
                            className="flex-1 bg-rh-accent text-white disabled:opacity-50"
                        >
                            <Save size={14} className="mr-1" />
                            저장
                        </Button>
                        <Button
                            type="button"
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
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-rh-bg-primary">
                        <code className="flex-1 text-base font-mono tracking-widest text-rh-accent">
                            {isVisible
                                ? code.invite_code
                                : "*".repeat(code.invite_code.length)}
                        </code>
                        <button
                            type="button"
                            onClick={handleVisibility}
                            className="p-1.5 active:opacity-70"
                            aria-label={
                                isVisible ? "코드 숨기기" : "코드 보기"
                            }
                        >
                            {isVisible ? (
                                <EyeOff
                                    size={16}
                                    className="text-rh-text-secondary"
                                />
                            ) : (
                                <Eye
                                    size={16}
                                    className="text-rh-text-secondary"
                                />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyClick}
                            className="p-1.5 active:opacity-70"
                            aria-label="코드 복사"
                        >
                            <Copy
                                size={16}
                                className="text-rh-text-secondary"
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={handleActiveToggle}
                            className="flex items-center gap-2 text-[12px] text-rh-text-secondary active:opacity-70"
                            aria-label={
                                isActive
                                    ? "비활성화로 전환"
                                    : "활성화로 전환"
                            }
                        >
                            {isActive ? (
                                <ToggleRight
                                    size={20}
                                    className="text-rh-accent"
                                />
                            ) : (
                                <ToggleLeft
                                    size={20}
                                    className="text-rh-text-tertiary"
                                />
                            )}
                            {isActive ? "활성" : "비활성"}
                        </button>
                        {isActive && (
                            <button
                                type="button"
                                onClick={handleDeactivateClick}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] text-rh-status-error bg-rh-bg-primary active:opacity-70"
                                aria-label="초대 코드 비활성화"
                            >
                                <Trash2 size={14} />
                                비활성화
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
});
