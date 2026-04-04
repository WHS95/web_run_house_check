"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import AdminSearchBar from "@/app/admin2/components/ui/AdminSearchBar";
import AdminBadge from "@/app/admin2/components/ui/AdminBadge";
import AdminSmallButton from "@/app/admin2/components/ui/AdminSmallButton";
import AdminModal from "@/app/admin2/components/ui/AdminModal";
import AdminAlertDialog from "@/app/admin2/components/ui/AdminAlertDialog";
import AdminLabeledInput from "@/app/admin2/components/ui/AdminLabeledInput";
import {
    UserForAdmin,
    updateUserStatus,
    updateUserInfo,
} from "@/lib/supabase/admin";

interface UserManagementProps {
    initialUsers: UserForAdmin[];
    crewId: string;
    gradeMap?: Record<
        string,
        { name: string; sort_order: number }
    >;
}

/* ── 초성 검색 유틸 ── */
const CHOSUNG = [
    "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ",
    "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ",
    "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const getChosung = (str: string): string => {
    return Array.from(str)
        .map((ch) => {
            const code = ch.charCodeAt(0) - 0xac00;
            if (code < 0 || code > 11171) return ch;
            return CHOSUNG[Math.floor(code / 588)];
        })
        .join("");
};

const isChosungOnly = (str: string): boolean =>
    Array.from(str).every((ch) =>
        CHOSUNG.includes(ch),
    );

const matchesChosung = (
    text: string,
    query: string,
): boolean => {
    if (!isChosungOnly(query)) return false;
    const textChosung = getChosung(text);
    return textChosung.includes(query);
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return "정보 없음";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

/* ── 유저 카드 ── */
const UserCard = memo(function UserCard({
    user,
    active,
    gradeMap,
    onTap,
}: {
    user: UserForAdmin;
    active: boolean;
    gradeMap?: UserManagementProps["gradeMap"];
    onTap: (user: UserForAdmin) => void;
}) {
    const gradeName =
        gradeMap &&
        user.crew_grade_id &&
        gradeMap[String(user.crew_grade_id)]?.name;

    return (
        <button
            type="button"
            className="flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3 w-full text-left"
            onClick={() => onTap(user)}
        >
            {/* 아바타 */}
            <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                    active
                        ? "bg-rh-accent"
                        : "bg-rh-bg-muted"
                }`}
            >
                {(user.first_name || "?").charAt(0)}
            </div>

            {/* 이름 + 메타 */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white truncate">
                    {user.first_name || "이름 없음"}
                </span>
                <span className="text-[11px] text-rh-text-tertiary truncate">
                    가입:{" "}
                    {formatDate(
                        user.join_date || user.created_at,
                    )}{" "}
                    · 출석{" "}
                    {user.attendance_count ?? 0}회
                </span>
            </div>

            {/* 뱃지 */}
            <div className="shrink-0">
                {gradeName ? (
                    <AdminBadge variant="accent">
                        {gradeName}
                    </AdminBadge>
                ) : (
                    <AdminBadge
                        variant={active ? "outline" : "muted"}
                    >
                        {active ? "활성" : "비활성"}
                    </AdminBadge>
                )}
            </div>
        </button>
    );
});

/* ── 편집 모달 내부 폼 ── */
function EditForm({
    user,
    onSave,
    onClose,
}: {
    user: UserForAdmin;
    onSave: (data: {
        first_name: string;
        phone: string;
        birth_year: number;
    }) => Promise<void>;
    onClose: () => void;
}) {
    const [name, setName] = useState(
        user.first_name || "",
    );
    const [phone, setPhone] = useState(user.phone || "");
    const [birthYear, setBirthYear] = useState(
        String(
            user.birth_year || new Date().getFullYear() - 30,
        ),
    );
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await onSave({
                first_name: name,
                phone,
                birth_year: parseInt(birthYear),
            });
        } finally {
            setSaving(false);
        }
    }, [name, phone, birthYear, onSave]);

    return (
        <>
            <div className="flex flex-col gap-4">
                <AdminLabeledInput
                    label="이름"
                    value={name}
                    onChange={setName}
                    placeholder="이름을 입력하세요"
                />
                <AdminLabeledInput
                    label="연락처"
                    value={phone}
                    onChange={setPhone}
                    placeholder="010-0000-0000"
                    type="tel"
                />
                <AdminLabeledInput
                    label="출생연도"
                    value={birthYear}
                    onChange={setBirthYear}
                    placeholder="1990"
                    type="number"
                />
                <AdminLabeledInput
                    label="가입일"
                    value={new Date(
                        user.created_at,
                    ).toLocaleDateString("ko-KR")}
                    onChange={() => {}}
                    placeholder=""
                />
            </div>
            <div className="flex gap-2 pt-2">
                <button
                    className="flex-1 py-3 rounded-xl bg-rh-bg-muted text-white text-sm font-medium"
                    onClick={onClose}
                    disabled={saving}
                >
                    취소
                </button>
                <button
                    className="flex-1 py-3 rounded-xl bg-rh-accent text-white text-sm font-medium"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "저장 중..." : "저장"}
                </button>
            </div>
        </>
    );
}

/* ── 메인 컴포넌트 ── */
export default function UserManagement({
    initialUsers,
    crewId,
    gradeMap,
}: UserManagementProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("전체");
    const [users, setUsers] = useState(initialUsers);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editModalOpen, setEditModalOpen] =
        useState(false);
    const [selectedUser, setSelectedUser] =
        useState<UserForAdmin | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        userId: string;
        active: boolean;
    }>({ open: false, userId: "", active: false });

    const isUserActive = useCallback(
        (user: UserForAdmin) =>
            user.status === "ACTIVE" || user.status === null,
        [],
    );

    /* 검색 (초성 검색 포함) */
    const matchesSearch = useCallback(
        (user: UserForAdmin, term: string) => {
            if (!term) return true;
            const lower = term.toLowerCase();
            const name = user.first_name || "";
            const phone = user.phone || "";
            const email = user.email || "";

            if (
                name.toLowerCase().includes(lower) ||
                phone.includes(term) ||
                email.toLowerCase().includes(lower)
            ) {
                return true;
            }

            // 초성 검색
            if (matchesChosung(name, term)) {
                return true;
            }

            return false;
        },
        [],
    );

    const filteredUsers = useMemo(() => {
        const searched = users.filter((user) =>
            matchesSearch(user, searchTerm),
        );

        return searched.filter((user) => {
            const active = isUserActive(user);
            return (
                statusFilter === "전체" ||
                (statusFilter === "활성" && active) ||
                (statusFilter === "비활성" && !active)
            );
        });
    }, [
        users,
        searchTerm,
        statusFilter,
        matchesSearch,
        isUserActive,
    ]);

    const statusCounts = useMemo(() => {
        const searched = users.filter((user) =>
            matchesSearch(user, searchTerm),
        );
        return {
            전체: searched.length,
            활성: searched.filter((u) => isUserActive(u))
                .length,
            비활성: searched.filter(
                (u) => !isUserActive(u),
            ).length,
        };
    }, [users, searchTerm, matchesSearch, isUserActive]);

    const handleCardTap = useCallback(
        (user: UserForAdmin) => {
            setSelectedUser(user);
            setEditModalOpen(true);
        },
        [],
    );

    const handleToggleStatus = useCallback(async () => {
        const { userId, active } = confirmDialog;
        setConfirmDialog((prev) => ({
            ...prev,
            open: false,
        }));
        setIsUpdating(true);
        try {
            const newStatus = !active;
            const { error } = await updateUserStatus(
                userId,
                crewId,
                newStatus,
            );
            if (error) {
                alert("사용자 상태 변경에 실패했습니다.");
                return;
            }
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? {
                              ...u,
                              status: newStatus
                                  ? "ACTIVE"
                                  : "SUSPENDED",
                          }
                        : u,
                ),
            );
        } catch {
            alert(
                "사용자 상태 변경 중 오류가 발생했습니다.",
            );
        } finally {
            setIsUpdating(false);
        }
    }, [confirmDialog, crewId]);

    const handleSaveUserInfo = useCallback(
        async (userData: {
            first_name: string;
            phone: string;
            birth_year: number;
        }) => {
            if (!selectedUser) return;
            try {
                const { error } = await updateUserInfo(
                    selectedUser.id,
                    userData,
                );
                if (error) {
                    alert(
                        "사용자 정보 수정에 실패했습니다.",
                    );
                    return;
                }
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === selectedUser.id
                            ? { ...u, ...userData }
                            : u,
                    ),
                );
                setEditModalOpen(false);
                setSelectedUser(null);
            } catch {
                alert(
                    "사용자 정보 수정 중 오류가 발생했습니다.",
                );
            }
        },
        [selectedUser],
    );

    const displayCount =
        statusCounts[
            statusFilter as keyof typeof statusCounts
        ];

    return (
        <>
            {/* 검색 + 필터 (sticky) */}
            <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 bg-rh-bg-primary px-4 pt-4 pb-2 space-y-4">
                <AdminSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="검색어를 입력하세요"
                />

                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-rh-text-secondary">
                        전체{" "}
                        <span className="text-white font-medium">
                            {displayCount}명
                        </span>
                    </span>

                    {/* 필터 */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <AdminSmallButton>
                                필터
                            </AdminSmallButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="border-0 bg-rh-bg-surface"
                        >
                            {(
                                [
                                    "전체",
                                    "활성",
                                    "비활성",
                                ] as const
                            ).map((status) => (
                                <DropdownMenuItem
                                    key={status}
                                    onClick={() =>
                                        setStatusFilter(
                                            status,
                                        )
                                    }
                                    className={`text-white hover:bg-rh-bg-muted ${statusFilter === status ? "bg-rh-accent/20 font-medium" : ""}`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span>
                                            {status}
                                        </span>
                                        <span className="ml-2 text-rh-text-secondary">
                                            {
                                                statusCounts[
                                                    status
                                                ]
                                            }
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* 유저 리스트 */}
            <div className="px-4 pb-4">
                {filteredUsers.length > 0 ? (
                    <AnimatedList className="space-y-2">
                        {filteredUsers.map((user) => (
                            <AnimatedItem key={user.id}>
                                <UserCard
                                    user={user}
                                    active={isUserActive(
                                        user,
                                    )}
                                    gradeMap={gradeMap}
                                    onTap={handleCardTap}
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-rh-text-secondary text-sm">
                            검색 결과가 없습니다.
                        </p>
                    </div>
                )}
            </div>

            {/* 편집 모달 */}
            <AdminModal
                open={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setSelectedUser(null);
                }}
                title="사용자 정보 수정"
            >
                {selectedUser && (
                    <EditForm
                        user={selectedUser}
                        onSave={handleSaveUserInfo}
                        onClose={() => {
                            setEditModalOpen(false);
                            setSelectedUser(null);
                        }}
                    />
                )}
            </AdminModal>

            {/* 상태 변경 확인 다이얼로그 */}
            <AdminAlertDialog
                open={confirmDialog.open}
                onClose={() =>
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }
                onConfirm={handleToggleStatus}
                title={
                    confirmDialog.active
                        ? "비활성화하시겠습니까?"
                        : "활성화하시겠습니까?"
                }
                description={
                    confirmDialog.active
                        ? "해당 회원이 비활성 상태로 전환됩니다."
                        : "해당 회원이 활성 상태로 전환됩니다."
                }
                cancelLabel="취소"
                confirmLabel="확인"
            />
        </>
    );
}
