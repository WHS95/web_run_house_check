"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    MoreVertical,
    ArrowUpDown,
    Edit,
    ChevronDown,
    ChevronRight,
    Filter,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserEditModal from "@/components/molecules/UserEditModal";
import {
    UserForAdmin,
    updateUserStatus,
    updateUserInfo,
} from "@/lib/supabase/admin";
import { useAdminContext } from "@/app/admin/AdminContextProvider";

interface AdminUserManagementProps {
    initialUsers: UserForAdmin[];
    gradeMap?: Record<string, { name: string; sort_order: number }>;
}

// 오늘 기준 몇일 전인지 계산하는 함수
const getDaysAgo = (dateString: string | null): string => {
    if (!dateString) return "출석 기록 없음";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "1일 전";
    if (diffDays > 1) return `${diffDays}일 전`;
    if (diffDays === -1) return "1일 후";
    return `${Math.abs(diffDays)}일 후`;
};

export default function AdminUserManagement({
    initialUsers,
    gradeMap,
}: AdminUserManagementProps) {
    const { crewId } = useAdminContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("전체");
    const [sortBy, setSortBy] = useState("lastAttendance");
    const [sortOrder, setSortOrder] = useState("desc");
    const [users, setUsers] = useState(initialUsers);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserForAdmin | null>(null);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    // 정렬 함수
    const sortUsers = (users: UserForAdmin[]) => {
        return [...users].sort((a, b) => {
            switch (sortBy) {
                case "lastAttendance":
                    const aDate = a.last_attendance_date
                        ? new Date(a.last_attendance_date).getTime()
                        : 0;
                    const bDate = b.last_attendance_date
                        ? new Date(b.last_attendance_date).getTime()
                        : 0;
                    return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
                case "joinDate":
                    const aJoinDate = a.join_date
                        ? new Date(a.join_date).getTime()
                        : new Date(a.created_at).getTime();
                    const bJoinDate = b.join_date
                        ? new Date(b.join_date).getTime()
                        : new Date(b.created_at).getTime();
                    return sortOrder === "desc"
                        ? bJoinDate - aJoinDate
                        : aJoinDate - bJoinDate;
                case "name":
                    const aName = a.first_name || "이름 없음";
                    const bName = b.first_name || "이름 없음";
                    return sortOrder === "asc"
                        ? aName.localeCompare(bName)
                        : bName.localeCompare(aName);
                default:
                    return 0;
            }
        });
    };

    // 검색어만 적용된 사용자 목록 (카운트 계산용)
    const searchFilteredUsers = users.filter((user) => {
        const userName = user.first_name || "";
        const userPhone = user.phone || "";
        const userEmail = user.email || "";

        return (
            userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userPhone.includes(searchTerm) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // 각 상태별 카운트 계산
    const getStatusCounts = () => {
        const total = searchFilteredUsers.length;
        const active = searchFilteredUsers.filter(
            (user) => user.status === "ACTIVE" || user.status === null
        ).length;
        const inactive = searchFilteredUsers.filter(
            (user) => user.status === "SUSPENDED"
        ).length;

        return {
            전체: total,
            활성: active,
            비활성: inactive,
        };
    };

    const statusCounts = getStatusCounts();

    // 최종 필터링 및 정렬된 사용자 목록
    const filteredUsers = sortUsers(
        searchFilteredUsers.filter((user) => {
            const isActive =
                user.status === "ACTIVE" || user.status === null;
            const matchesStatus =
                statusFilter === "전체" ||
                (statusFilter === "활성" && isActive) ||
                (statusFilter === "비활성" && !isActive);

            return matchesStatus;
        })
    );

    const handleToggleUserStatus = async (userId: string) => {
        setIsUpdating(userId);

        try {
            const currentUser = users.find((u) => u.id === userId);
            if (!currentUser) return;

            const isCurrentlyActive =
                currentUser.status === "ACTIVE" ||
                currentUser.status === null;
            const newStatus = !isCurrentlyActive;
            const { error } = await updateUserStatus(
                userId,
                crewId,
                newStatus
            );

            if (error) {
                alert("사용자 상태 변경에 실패했습니다.");
                return;
            }

            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId
                        ? {
                              ...user,
                              status: newStatus ? "ACTIVE" : "SUSPENDED",
                          }
                        : user
                )
            );
        } catch (error) {
            alert("사용자 상태 변경 중 오류가 발생했습니다.");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleEditUser = (user: UserForAdmin) => {
        setSelectedUser(user);
        setEditModalOpen(true);
    };

    const handleSaveUserInfo = async (userData: {
        first_name: string;
        phone: string;
        birth_year: number;
    }) => {
        if (!selectedUser) return;

        try {
            const { error } = await updateUserInfo(selectedUser.id, userData);

            if (error) {
                alert("사용자 정보 수정에 실패했습니다.");
                return;
            }

            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === selectedUser.id
                        ? { ...user, ...userData }
                        : user
                )
            );

            setEditModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            alert("사용자 정보 수정 중 오류가 발생했습니다.");
        }
    };

    const handleSort = (newSortBy: string) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
            setSortBy(newSortBy);
            setSortOrder("desc");
        }
    };

    const toggleUserExpansion = (userId: string) => {
        setExpandedUsers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "정보 없음";

        const date = new Date(dateString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
            2,
            "0"
        )}.${String(date.getDate()).padStart(2, "0")}`;
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case "lastAttendance":
                return `참석 ${sortOrder === "desc" ? "↓" : "↑"}`;
            case "joinDate":
                return `가입 ${sortOrder === "desc" ? "↓" : "↑"}`;
            case "name":
                return `이름 ${sortOrder === "desc" ? "↓" : "↑"}`;
            default:
                return "정렬";
        }
    };

    const getUserDisplayName = (user: UserForAdmin) => {
        return user.first_name || "이름 없음";
    };

    const getUserContactInfo = (user: UserForAdmin) => {
        return user.phone || user.email || "연락처 없음";
    };

    const getUserInitial = (user: UserForAdmin) => {
        const name = user.first_name || "";
        return name.charAt(0) || "?";
    };

    const isUserActive = (user: UserForAdmin) => {
        return user.status === "ACTIVE" || user.status === null;
    };

    return (
        <div className="flex flex-col h-screen bg-rh-bg-primary">
            {/* 검색 및 필터 - 고정 */}
            <div className="sticky top-[10px] z-10 bg-rh-bg-primary px-4 pt-4 pb-2 space-y-3">
                {/* 검색바 */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 w-4 h-4 text-rh-text-secondary transform -translate-y-1/2" />
                    <Input
                        placeholder="검색어를 입력하세요"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-12 text-white bg-rh-bg-surface border border-rh-border rounded-rh-md placeholder:text-rh-text-secondary"
                    />
                </div>

                {/* 전체 N명 + 필터 버튼 */}
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-rh-text-secondary">
                        전체{" "}
                        <span className="text-white">
                            {statusCounts[
                                statusFilter as keyof typeof statusCounts
                            ]}
                            명
                        </span>
                    </span>

                    <div className="flex items-center gap-2">
                        {/* 정렬 드롭다운 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-rh-bg-surface border border-rh-border rounded-rh-md">
                                    <ArrowUpDown className="w-3 h-3" />
                                    {getSortLabel()}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="border-0 bg-rh-bg-surface"
                            >
                                <DropdownMenuItem
                                    onClick={() =>
                                        handleSort("lastAttendance")
                                    }
                                    className="text-white hover:bg-rh-bg-muted"
                                >
                                    참석
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleSort("joinDate")}
                                    className="text-white hover:bg-rh-bg-muted"
                                >
                                    가입
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleSort("name")}
                                    className="text-white hover:bg-rh-bg-muted"
                                >
                                    이름
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 필터 드롭다운 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-rh-accent rounded-rh-md">
                                    <Filter className="w-3 h-3" />
                                    필터
                                    {statusFilter !== "전체" && (
                                        <span className="ml-1 opacity-80">
                                            ({statusFilter})
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="border-0 bg-rh-bg-surface"
                            >
                                {["전체", "활성", "비활성"].map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onClick={() =>
                                            setStatusFilter(status)
                                        }
                                        className={`text-white hover:bg-rh-bg-muted ${
                                            statusFilter === status
                                                ? "bg-rh-accent font-medium"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span>{status}</span>
                                            <span className="ml-2 text-rh-text-secondary">
                                                {
                                                    statusCounts[
                                                        status as keyof typeof statusCounts
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
            </div>

            {/* 메인 컨텐츠 */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
                {/* 사용자 목록 */}
                <div className="space-y-2">
                    {filteredUsers.map((user) => {
                        const isExpanded = expandedUsers.has(user.id);
                        const active = isUserActive(user);

                        return (
                            <div
                                key={user.id}
                                className="bg-rh-bg-surface rounded-rh-md px-4 py-3"
                            >
                                {/* 메인 사용자 정보 */}
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() =>
                                        toggleUserExpansion(user.id)
                                    }
                                >
                                    {/* 아바타 */}
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                                            active
                                                ? "bg-rh-accent"
                                                : "bg-rh-bg-muted"
                                        }`}
                                    >
                                        {getUserInitial(user)}
                                    </div>

                                    {/* 이름 + 등급 뱃지 + 부가 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-semibold text-white truncate">
                                                {getUserDisplayName(user)}
                                            </h3>
                                            {gradeMap && user.crew_grade_id && gradeMap[String(user.crew_grade_id)] && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-rh-accent/20 text-rh-accent flex-shrink-0">
                                                    {gradeMap[String(user.crew_grade_id)].name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-rh-text-secondary truncate">
                                            가입:{" "}
                                            {formatDate(
                                                user.join_date ||
                                                    user.created_at
                                            )}{" "}
                                            · 최근:{" "}
                                            {getDaysAgo(
                                                user.last_attendance_date
                                            )}
                                        </p>
                                    </div>

                                    {/* 상태 뱃지 + 액션 */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge
                                            className={`text-xs px-2 py-0.5 ${
                                                active
                                                    ? "bg-rh-accent/20 text-rh-accent hover:bg-rh-accent/20"
                                                    : "bg-rh-bg-muted text-rh-text-secondary hover:bg-rh-bg-muted"
                                            }`}
                                        >
                                            {active ? "활성" : "비활성"}
                                        </Badge>

                                        <ChevronRight
                                            className={`w-4 h-4 text-rh-text-secondary transition-transform duration-200 ${
                                                isExpanded
                                                    ? "rotate-90"
                                                    : "rotate-0"
                                            }`}
                                        />

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="p-1"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    disabled={
                                                        isUpdating === user.id
                                                    }
                                                >
                                                    <MoreVertical className="w-4 h-4 text-rh-text-secondary" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="border-0 bg-rh-bg-surface"
                                            >
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleEditUser(user)
                                                    }
                                                    className="text-white hover:bg-rh-bg-muted"
                                                >
                                                    <Edit className="mr-2 w-4 h-4" />
                                                    정보 수정
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleToggleUserStatus(
                                                            user.id
                                                        )
                                                    }
                                                    disabled={
                                                        isUpdating === user.id
                                                    }
                                                    className="text-white hover:bg-rh-bg-muted"
                                                >
                                                    {isUpdating === user.id
                                                        ? "처리 중..."
                                                        : active
                                                        ? "비활성화"
                                                        : "활성화"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* 펼쳐진 상세 정보 */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        isExpanded
                                            ? "max-h-96 opacity-100"
                                            : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <div className="pt-3 mt-3 border-t border-rh-border">
                                        <div className="grid grid-cols-1 gap-3 text-sm text-rh-text-secondary sm:grid-cols-2">
                                            <div className="flex justify-between">
                                                <span className="text-white">
                                                    연락처
                                                </span>
                                                <span className="text-right break-all">
                                                    {getUserContactInfo(user)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white">
                                                    가입일
                                                </span>
                                                <span className="text-right">
                                                    {formatDate(
                                                        user.join_date ||
                                                            user.created_at
                                                    )}
                                                </span>
                                            </div>
                                            {user.birth_year && (
                                                <div className="flex justify-between">
                                                    <span className="text-white">
                                                        출생연도
                                                    </span>
                                                    <span className="text-right">
                                                        {user.birth_year}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-white">
                                                    최근 참석일
                                                </span>
                                                <span className="text-right">
                                                    {user.last_attendance_date
                                                        ? formatDate(
                                                              user.last_attendance_date
                                                          )
                                                        : "출석 기록 없음"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredUsers.length === 0 && (
                    <div className="py-8 text-center">
                        <p className="text-rh-text-secondary">
                            검색 결과가 없습니다.
                        </p>
                    </div>
                )}
            </div>

            {/* 사용자 정보 수정 모달 */}
            {selectedUser && (
                <UserEditModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedUser(null);
                    }}
                    user={selectedUser}
                    onSave={handleSaveUserInfo}
                />
            )}
        </div>
    );
}
