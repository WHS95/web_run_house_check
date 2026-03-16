"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    MoreVertical,
    ArrowUpDown,
    Edit,
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

interface UserManagementProps {
    initialUsers: UserForAdmin[];
    crewId: string;
    gradeMap?: Record<string, { name: string; sort_order: number }>;
}

const getDaysAgo = (dateString: string | null): string => {
    if (!dateString) return "출석 기록 없음";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
        (today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "오늘";
    if (diffDays > 0) return `${diffDays}일 전`;
    return `${Math.abs(diffDays)}일 후`;
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return "정보 없음";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function UserManagement({
    initialUsers,
    crewId,
    gradeMap,
}: UserManagementProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("전체");
    const [sortBy, setSortBy] = useState("lastAttendance");
    const [sortOrder, setSortOrder] = useState("desc");
    const [users, setUsers] = useState(initialUsers);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserForAdmin | null>(
        null
    );
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(
        new Set()
    );

    const isUserActive = (user: UserForAdmin) =>
        user.status === "ACTIVE" || user.status === null;

    const sortUsers = (list: UserForAdmin[]) =>
        [...list].sort((a, b) => {
            switch (sortBy) {
                case "lastAttendance": {
                    const aD = a.last_attendance_date
                        ? new Date(a.last_attendance_date).getTime()
                        : 0;
                    const bD = b.last_attendance_date
                        ? new Date(b.last_attendance_date).getTime()
                        : 0;
                    return sortOrder === "desc" ? bD - aD : aD - bD;
                }
                case "joinDate": {
                    const aJ = new Date(
                        a.join_date || a.created_at
                    ).getTime();
                    const bJ = new Date(
                        b.join_date || b.created_at
                    ).getTime();
                    return sortOrder === "desc" ? bJ - aJ : aJ - bJ;
                }
                case "name": {
                    const aN = a.first_name || "이름 없음";
                    const bN = b.first_name || "이름 없음";
                    return sortOrder === "asc"
                        ? aN.localeCompare(bN)
                        : bN.localeCompare(aN);
                }
                default:
                    return 0;
            }
        });

    const searchFilteredUsers = users.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            (user.first_name || "").toLowerCase().includes(term) ||
            (user.phone || "").includes(searchTerm) ||
            (user.email || "").toLowerCase().includes(term)
        );
    });

    const statusCounts = {
        전체: searchFilteredUsers.length,
        활성: searchFilteredUsers.filter((u) => isUserActive(u)).length,
        비활성: searchFilteredUsers.filter((u) => !isUserActive(u)).length,
    };

    const filteredUsers = sortUsers(
        searchFilteredUsers.filter((user) => {
            const active = isUserActive(user);
            return (
                statusFilter === "전체" ||
                (statusFilter === "활성" && active) ||
                (statusFilter === "비활성" && !active)
            );
        })
    );

    const handleToggleUserStatus = async (userId: string) => {
        setIsUpdating(userId);
        try {
            const currentUser = users.find((u) => u.id === userId);
            if (!currentUser) return;
            const newStatus = !isUserActive(currentUser);
            const { error } = await updateUserStatus(
                userId,
                crewId,
                newStatus
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
                              status: newStatus ? "ACTIVE" : "SUSPENDED",
                          }
                        : u
                )
            );
        } catch {
            alert("사용자 상태 변경 중 오류가 발생했습니다.");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleSaveUserInfo = async (userData: {
        first_name: string;
        phone: string;
        birth_year: number;
    }) => {
        if (!selectedUser) return;
        try {
            const { error } = await updateUserInfo(
                selectedUser.id,
                userData
            );
            if (error) {
                alert("사용자 정보 수정에 실패했습니다.");
                return;
            }
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === selectedUser.id ? { ...u, ...userData } : u
                )
            );
            setEditModalOpen(false);
            setSelectedUser(null);
        } catch {
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

    const toggleExpansion = (userId: string) => {
        setExpandedUsers((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const getSortLabel = () => {
        const dir = sortOrder === "desc" ? "↓" : "↑";
        switch (sortBy) {
            case "lastAttendance":
                return `참석 ${dir}`;
            case "joinDate":
                return `가입 ${dir}`;
            case "name":
                return `이름 ${dir}`;
            default:
                return "정렬";
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-rh-bg-primary">
            {/* 검색 및 필터 */}
            <div className="sticky top-0 z-10 bg-rh-bg-primary px-4 pt-4 pb-2 space-y-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 w-4 h-4 text-rh-text-secondary transform -translate-y-1/2" />
                    <Input
                        placeholder="검색어를 입력하세요"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-12 text-white bg-rh-bg-surface border border-rh-border rounded-rh-md placeholder:text-rh-text-secondary"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-rh-text-secondary">
                        전체{" "}
                        <span className="text-white">
                            {
                                statusCounts[
                                    statusFilter as keyof typeof statusCounts
                                ]
                            }
                            명
                        </span>
                    </span>

                    <div className="flex items-center gap-2">
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
                                {[
                                    { key: "lastAttendance", label: "참석" },
                                    { key: "joinDate", label: "가입" },
                                    { key: "name", label: "이름" },
                                ].map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.key}
                                        onClick={() => handleSort(opt.key)}
                                        className="text-white hover:bg-rh-bg-muted"
                                    >
                                        {opt.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

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
                                {(
                                    ["전체", "활성", "비활성"] as const
                                ).map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onClick={() =>
                                            setStatusFilter(status)
                                        }
                                        className={`text-white hover:bg-rh-bg-muted ${statusFilter === status ? "bg-rh-accent font-medium" : ""}`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span>{status}</span>
                                            <span className="ml-2 text-rh-text-secondary">
                                                {statusCounts[status]}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* 사용자 목록 */}
            <div className="overflow-y-auto flex-1 px-4 py-3 scroll-area-bottom">
                <div className="space-y-2">
                    {filteredUsers.map((user) => {
                        const isExpanded = expandedUsers.has(user.id);
                        const active = isUserActive(user);

                        return (
                            <div
                                key={user.id}
                                className="bg-rh-bg-surface rounded-rh-md px-4 py-3"
                            >
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => toggleExpansion(user.id)}
                                >
                                    {/* 아바타 */}
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${active ? "bg-rh-accent" : "bg-rh-bg-muted"}`}
                                    >
                                        {(
                                            user.first_name || "?"
                                        ).charAt(0)}
                                    </div>

                                    {/* 이름 + 등급 + 부가정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-semibold text-white truncate">
                                                {user.first_name ||
                                                    "이름 없음"}
                                            </h3>
                                            {gradeMap &&
                                                user.crew_grade_id &&
                                                gradeMap[
                                                    String(
                                                        user.crew_grade_id
                                                    )
                                                ] && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-rh-accent/20 text-rh-accent flex-shrink-0">
                                                        {
                                                            gradeMap[
                                                                String(
                                                                    user.crew_grade_id
                                                                )
                                                            ].name
                                                        }
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
                                            className={`text-xs px-2 py-0.5 ${active ? "bg-rh-accent/20 text-rh-accent hover:bg-rh-accent/20" : "bg-rh-bg-muted text-rh-text-secondary hover:bg-rh-bg-muted"}`}
                                        >
                                            {active ? "활성" : "비활성"}
                                        </Badge>
                                        <ChevronRight
                                            className={`w-4 h-4 text-rh-text-secondary transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="p-1"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    disabled={
                                                        isUpdating ===
                                                        user.id
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
                                                    onClick={() => {
                                                        setSelectedUser(
                                                            user
                                                        );
                                                        setEditModalOpen(
                                                            true
                                                        );
                                                    }}
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
                                                        isUpdating ===
                                                        user.id
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

                                {/* 상세 정보 */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                                >
                                    <div className="pt-3 mt-3 border-t border-rh-border">
                                        <div className="grid grid-cols-1 gap-3 text-sm text-rh-text-secondary sm:grid-cols-2">
                                            <div className="flex justify-between">
                                                <span className="text-white">
                                                    연락처
                                                </span>
                                                <span className="text-right break-all">
                                                    {user.phone ||
                                                        user.email ||
                                                        "연락처 없음"}
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
