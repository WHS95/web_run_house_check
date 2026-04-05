"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { SWRConfig } from "swr";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import AdminSearchBar from "@/app/admin2/components/ui/AdminSearchBar";
import AdminBadge from "@/app/admin2/components/ui/AdminBadge";
import AdminSmallButton from "@/app/admin2/components/ui/AdminSmallButton";
import SortFilterSheet, {
    type SortKey,
    type SortDir,
    type StatusFilter,
} from "./SortFilterSheet";
import { UserForAdmin } from "@/lib/supabase/admin";
import { useAdminUsers } from "@/lib/admin2/hooks/useAdminUsers";

interface UserManagementProps {
    initialUsers: UserForAdmin[];
    crewId: string;
    fallback: Record<string, unknown>;
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
                    {user.last_attendance_date
                        ? `최근 참여일: ${formatDate(user.last_attendance_date)}`
                        : "참여 기록 없음"}
                    {" · 출석 "}
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

/* ── 메인 컴포넌트 ── */
export default function UserManagement({
    initialUsers,
    fallback,
    gradeMap,
}: UserManagementProps) {
    return (
        <SWRConfig value={{ fallback }}>
            <UserManagementInner
                initialUsers={initialUsers}
                gradeMap={gradeMap}
            />
        </SWRConfig>
    );
}

function UserManagementInner({
    initialUsers,
    gradeMap,
}: {
    initialUsers: UserForAdmin[];
    gradeMap?: UserManagementProps["gradeMap"];
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("전체");
    const [sortKey, setSortKey] =
        useState<SortKey>("lastAttendance");
    const [sortDir, setSortDir] =
        useState<SortDir>("desc");
    const [sheetOpen, setSheetOpen] = useState(false);
    const { users: swrUsers } = useAdminUsers();
    const users = swrUsers.length > 0 ? swrUsers : initialUsers;

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
        const statused = searched.filter((user) => {
            const active = isUserActive(user);
            return (
                statusFilter === "전체" ||
                (statusFilter === "활성" && active) ||
                (statusFilter === "비활성" && !active)
            );
        });
        const m = sortDir === "asc" ? 1 : -1;
        return [...statused].sort((a, b) => {
            if (sortKey === "name") {
                return (
                    (a.first_name || "").localeCompare(
                        b.first_name || "",
                        "ko",
                    ) * m
                );
            }
            if (sortKey === "lastAttendance") {
                const av = a.last_attendance_date || "";
                const bv = b.last_attendance_date || "";
                return (
                    (av < bv ? -1 : av > bv ? 1 : 0) * m
                );
            }
            return (
                ((a.attendance_count ?? 0) -
                    (b.attendance_count ?? 0)) *
                m
            );
        });
    }, [
        users,
        searchTerm,
        statusFilter,
        sortKey,
        sortDir,
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
            router.push(`/admin2/user/${user.id}`);
        },
        [router],
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

                    <AdminSmallButton
                        onClick={() => setSheetOpen(true)}
                    >
                        필터
                    </AdminSmallButton>
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

            <SortFilterSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                sortKey={sortKey}
                sortDir={sortDir}
                statusFilter={statusFilter}
                onApply={(next) => {
                    setSortKey(next.sortKey);
                    setSortDir(next.sortDir);
                    setStatusFilter(next.statusFilter);
                    setSheetOpen(false);
                }}
            />
        </>
    );
}
