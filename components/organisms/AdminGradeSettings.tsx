"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronDown,
    ChevronUp,
    X,
    Award,
} from "lucide-react";
import { haptic } from "@/lib/haptic";
import PopupNotification, {
    NotificationType,
} from "@/components/molecules/common/PopupNotification";
import ConfirmModal from "@/components/molecules/ConfirmModal";

interface CrewGrade {
    id: number;
    crew_id: string;
    grade_id: number;
    name_override: string | null;
    description_override: string | null;
    min_attendance_count: number;
    min_hosting_count: number;
    promotion_period_type: string;
    sort_order: number;
    can_host: boolean;
    is_active: boolean;
    grades?: { name: string };
}

interface AdminGradeSettingsProps {
    crewId: string;
}

interface GradeFormData {
    name_override: string;
    min_attendance_count: number;
    min_hosting_count: number;
    can_host: boolean;
    sort_order: number;
}

const PERIOD_TYPES = [
    { value: "cumulative", label: "누적" },
    { value: "monthly", label: "월별" },
    { value: "quarterly", label: "분기" },
];

const defaultFormData: GradeFormData = {
    name_override: "",
    min_attendance_count: 0,
    min_hosting_count: 0,
    can_host: false,
    sort_order: 1,
};

export default function AdminGradeSettings({
    crewId,
}: AdminGradeSettingsProps) {
    const [grades, setGrades] = useState<CrewGrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [periodType, setPeriodType] = useState("cumulative");

    // 추가 폼 상태
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [addFormData, setAddFormData] = useState<GradeFormData>(defaultFormData);

    // 수정 상태
    const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<GradeFormData>(defaultFormData);

    // 더보기 메뉴 상태
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // 알림 상태
    const [notification, setNotification] = useState({
        isVisible: false,
        message: "",
        type: "success" as NotificationType,
    });

    // 확인 모달 상태
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        onConfirm: () => {},
    });

    // 알림 표시
    const showNotification = useCallback(
        (message: string, type: NotificationType) => {
            setNotification({ isVisible: true, message, type });
        },
        []
    );

    // 알림 닫기
    const closeNotification = useCallback(() => {
        setNotification((prev) => ({ ...prev, isVisible: false }));
    }, []);

    // 확인 모달 닫기
    const closeConfirmModal = useCallback(() => {
        setConfirmModal({ isOpen: false, onConfirm: () => {} });
    }, []);

    // 등급 목록 조회
    const fetchGrades = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/admin/grades?crewId=${crewId}`
            );
            const result = await response.json();
            if (response.ok && result.success) {
                setGrades(result.data);
            }
        } catch {
            haptic.error();
        } finally {
            setIsLoading(false);
        }
    }, [crewId]);

    // 초기 로드
    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    // 등급 추가
    const handleAddGrade = useCallback(async () => {
        if (actionLoading || !addFormData.name_override.trim()) return;

        try {
            setActionLoading(true);
            haptic.medium();

            const response = await fetch("/api/admin/grades", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    crewId,
                    name_override: addFormData.name_override.trim(),
                    min_attendance_count: addFormData.min_attendance_count,
                    min_hosting_count: addFormData.min_hosting_count,
                    can_host: addFormData.can_host,
                    sort_order: addFormData.sort_order,
                    promotion_period_type: periodType,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                haptic.success();
                setIsAddFormOpen(false);
                setAddFormData(defaultFormData);
                await fetchGrades();
                showNotification("등급이 추가되었습니다.", "success");
            } else {
                haptic.error();
                showNotification(
                    result.error || "등급 추가에 실패했습니다.",
                    "error"
                );
            }
        } catch {
            haptic.error();
            showNotification("등급 추가 중 오류가 발생했습니다.", "error");
        } finally {
            setActionLoading(false);
        }
    }, [
        crewId,
        addFormData,
        periodType,
        actionLoading,
        fetchGrades,
        showNotification,
    ]);

    // 등급 수정
    const handleEditGrade = useCallback(
        async (gradeId: number) => {
            if (actionLoading || !editFormData.name_override.trim()) return;

            try {
                setActionLoading(true);
                haptic.medium();

                const response = await fetch("/api/admin/grades", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        crewId,
                        gradeId,
                        name_override: editFormData.name_override.trim(),
                        min_attendance_count: editFormData.min_attendance_count,
                        min_hosting_count: editFormData.min_hosting_count,
                        can_host: editFormData.can_host,
                        sort_order: editFormData.sort_order,
                        promotion_period_type: periodType,
                    }),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    haptic.success();
                    setEditingGradeId(null);
                    setEditFormData(defaultFormData);
                    await fetchGrades();
                    showNotification("등급이 수정되었습니다.", "success");
                } else {
                    haptic.error();
                    showNotification(
                        result.error || "등급 수정에 실패했습니다.",
                        "error"
                    );
                }
            } catch {
                haptic.error();
                showNotification(
                    "등급 수정 중 오류가 발생했습니다.",
                    "error"
                );
            } finally {
                setActionLoading(false);
            }
        },
        [
            crewId,
            editFormData,
            periodType,
            actionLoading,
            fetchGrades,
            showNotification,
        ]
    );

    // 등급 삭제
    const handleDeleteGrade = useCallback(
        (gradeId: number) => {
            if (actionLoading) return;

            haptic.light();
            setConfirmModal({
                isOpen: true,
                onConfirm: async () => {
                    try {
                        setActionLoading(true);
                        haptic.medium();

                        const response = await fetch(
                            `/api/admin/grades?crewId=${crewId}&gradeId=${gradeId}`,
                            { method: "DELETE" }
                        );

                        const result = await response.json();

                        if (response.ok && result.success) {
                            haptic.success();
                            setOpenMenuId(null);
                            await fetchGrades();
                            showNotification(
                                "등급이 삭제되었습니다.",
                                "success"
                            );
                        } else {
                            haptic.error();
                            showNotification(
                                result.error || "등급 삭제에 실패했습니다.",
                                "error"
                            );
                        }
                    } catch {
                        haptic.error();
                        showNotification(
                            "등급 삭제 중 오류가 발생했습니다.",
                            "error"
                        );
                    } finally {
                        setActionLoading(false);
                    }
                },
            });
        },
        [crewId, actionLoading, fetchGrades, showNotification]
    );

    // 수정 모드 시작
    const startEditing = useCallback((grade: CrewGrade) => {
        haptic.light();
        setEditingGradeId(grade.id);
        setEditFormData({
            name_override: grade.name_override || grade.grades?.name || "",
            min_attendance_count: grade.min_attendance_count,
            min_hosting_count: grade.min_hosting_count,
            can_host: grade.can_host,
            sort_order: grade.sort_order,
        });
        setOpenMenuId(null);
    }, []);

    // 수정 취소
    const cancelEditing = useCallback(() => {
        setEditingGradeId(null);
        setEditFormData(defaultFormData);
    }, []);

    // 더보기 메뉴 토글
    const toggleMenu = useCallback(
        (gradeId: number) => {
            haptic.light();
            setOpenMenuId(openMenuId === gradeId ? null : gradeId);
        },
        [openMenuId]
    );

    // 정렬된 등급 목록
    const sortedGrades = [...grades].sort(
        (a, b) => a.sort_order - b.sort_order
    );

    // 폼 렌더링 함수
    const renderForm = (
        formData: GradeFormData,
        setFormData: (data: GradeFormData) => void,
        onSave: () => void,
        onCancel: () => void,
        saveLabel: string
    ) => (
        <div className="space-y-3">
            {/* 등급명 */}
            <div>
                <label className="block mb-1.5 text-xs font-medium text-rh-text-secondary">
                    등급명
                </label>
                <input
                    type="text"
                    placeholder="등급 이름 입력"
                    value={formData.name_override}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            name_override: e.target.value,
                        })
                    }
                    className="w-full bg-rh-bg-primary border border-rh-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rh-accent"
                />
            </div>

            {/* 최소 참여/개설 횟수 */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block mb-1.5 text-xs font-medium text-rh-text-secondary">
                        최소 참여 횟수
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={formData.min_attendance_count}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                min_attendance_count:
                                    parseInt(e.target.value) || 0,
                            })
                        }
                        className="w-full bg-rh-bg-primary border border-rh-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rh-accent"
                    />
                </div>
                <div>
                    <label className="block mb-1.5 text-xs font-medium text-rh-text-secondary">
                        최소 개설 횟수
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={formData.min_hosting_count}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                min_hosting_count:
                                    parseInt(e.target.value) || 0,
                            })
                        }
                        className="w-full bg-rh-bg-primary border border-rh-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rh-accent"
                    />
                </div>
            </div>

            {/* 정렬 순서 */}
            <div>
                <label className="block mb-1.5 text-xs font-medium text-rh-text-secondary">
                    정렬 순서
                </label>
                <input
                    type="number"
                    min={1}
                    value={formData.sort_order}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            sort_order: parseInt(e.target.value) || 1,
                        })
                    }
                    className="w-full bg-rh-bg-primary border border-rh-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rh-accent"
                />
            </div>

            {/* 호스트 가능 토글 */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-rh-text-secondary">
                    호스트 권한
                </label>
                <button
                    type="button"
                    onClick={() => {
                        haptic.light();
                        setFormData({
                            ...formData,
                            can_host: !formData.can_host,
                        });
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                        formData.can_host
                            ? "bg-rh-accent"
                            : "bg-rh-bg-muted"
                    }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.can_host
                                ? "translate-x-5"
                                : "translate-x-0"
                        }`}
                    />
                </button>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={onSave}
                    disabled={
                        actionLoading || !formData.name_override.trim()
                    }
                    className="flex-1 bg-rh-accent text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                    {actionLoading ? "처리 중..." : saveLabel}
                </button>
                <button
                    onClick={onCancel}
                    disabled={actionLoading}
                    className="flex-1 bg-rh-bg-surface border border-rh-border text-white rounded-xl py-2.5 text-sm active:scale-[0.98] transition-transform"
                >
                    취소
                </button>
            </div>
        </div>
    );

    // 로딩 스켈레톤
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-rh-bg-surface rounded-xl p-4 h-24"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 기간 유형 선택 */}
            <div className="flex gap-2">
                {PERIOD_TYPES.map((pt) => (
                    <button
                        key={pt.value}
                        onClick={() => {
                            haptic.light();
                            setPeriodType(pt.value);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            periodType === pt.value
                                ? "bg-rh-accent text-white"
                                : "bg-rh-bg-surface text-rh-text-secondary border border-rh-border"
                        }`}
                    >
                        {pt.label}
                    </button>
                ))}
            </div>

            {/* 등급 카드 목록 */}
            {sortedGrades.length === 0 && !isAddFormOpen && (
                <div className="py-12 text-center">
                    <Award className="mx-auto mb-3 w-12 h-12 text-rh-text-tertiary" />
                    <p className="text-rh-text-secondary text-sm">
                        등록된 등급이 없습니다
                    </p>
                    <p className="text-rh-text-tertiary text-xs mt-1">
                        아래 버튼을 눌러 등급을 추가해보세요
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {sortedGrades.map((grade) => (
                    <div key={grade.id}>
                        {editingGradeId === grade.id ? (
                            /* 수정 폼 */
                            <div className="bg-rh-bg-surface rounded-xl p-4 border border-rh-accent">
                                {renderForm(
                                    editFormData,
                                    setEditFormData,
                                    () => handleEditGrade(grade.id),
                                    cancelEditing,
                                    "수정"
                                )}
                            </div>
                        ) : (
                            /* 등급 카드 */
                            <div className="bg-rh-bg-surface rounded-xl p-4 relative">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        {/* 순서 뱃지 */}
                                        <div className="flex-shrink-0 w-8 h-8 bg-rh-accent/20 text-rh-accent rounded-lg flex items-center justify-center text-sm font-bold">
                                            {grade.sort_order}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* 등급명 + 호스트 뱃지 */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-white font-semibold text-sm">
                                                    {grade.name_override ||
                                                        grade.grades?.name ||
                                                        "미지정"}
                                                </span>
                                                {grade.can_host ? (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-rh-status-success/10 text-rh-status-success">
                                                        호스트 가능
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-rh-status-error/10 text-rh-status-error">
                                                        호스트 불가
                                                    </span>
                                                )}
                                            </div>

                                            {/* 참여/개설 횟수 */}
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-rh-text-tertiary text-xs">
                                                    최소 참여{" "}
                                                    <span className="text-rh-text-secondary font-medium">
                                                        {grade.min_attendance_count}
                                                        회
                                                    </span>
                                                </span>
                                                <span className="text-rh-text-tertiary text-xs">
                                                    최소 개설{" "}
                                                    <span className="text-rh-text-secondary font-medium">
                                                        {grade.min_hosting_count}
                                                        회
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 더보기 버튼 */}
                                    <button
                                        onClick={() => toggleMenu(grade.id)}
                                        className="p-1.5 rounded-lg text-rh-text-tertiary hover:text-white hover:bg-rh-bg-muted transition-colors"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* 더보기 메뉴 드롭다운 */}
                                {openMenuId === grade.id && (
                                    <div className="absolute right-4 top-12 z-10 bg-rh-bg-primary border border-rh-border rounded-xl shadow-lg overflow-hidden">
                                        <button
                                            onClick={() => startEditing(grade)}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-rh-bg-surface transition-colors"
                                        >
                                            <Edit className="w-3.5 h-3.5 text-rh-accent" />
                                            수정
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenMenuId(null);
                                                handleDeleteGrade(grade.id);
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-rh-status-error hover:bg-rh-bg-surface transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 등급 추가 폼 */}
            {isAddFormOpen && (
                <div className="bg-rh-bg-surface rounded-xl p-4 border border-rh-accent">
                    {renderForm(
                        addFormData,
                        setAddFormData,
                        handleAddGrade,
                        () => {
                            setIsAddFormOpen(false);
                            setAddFormData(defaultFormData);
                        },
                        "추가"
                    )}
                </div>
            )}

            {/* 등급 추가 버튼 */}
            {!isAddFormOpen && (
                <button
                    onClick={() => {
                        haptic.light();
                        setIsAddFormOpen(true);
                        setAddFormData({
                            ...defaultFormData,
                            sort_order: sortedGrades.length + 1,
                        });
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-rh-bg-surface border border-dashed border-rh-border text-rh-text-secondary rounded-xl py-3 text-sm font-medium hover:border-rh-accent hover:text-rh-accent transition-colors active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    등급 추가
                </button>
            )}

            {/* 알림 팝업 */}
            <PopupNotification
                isVisible={notification.isVisible}
                message={notification.message}
                type={notification.type}
                duration={2000}
                onClose={closeNotification}
            />

            {/* 삭제 확인 모달 */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title="등급 삭제"
                content="이 등급을 삭제하시겠습니까? 삭제된 등급은 복구할 수 없습니다."
                confirmText="삭제"
                cancelText="취소"
                variant="destructive"
            />
        </div>
    );
}
