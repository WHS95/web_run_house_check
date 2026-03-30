"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Lock, ChevronDown } from "lucide-react";

interface Member {
    id: string;
    first_name: string;
    email: string;
    crew_role: string;
    crew_grade_id?: number;
    grade_override?: boolean;
}

interface CrewGrade {
    id: number;
    name_override: string | null;
    grades?: { name: string };
    sort_order: number;
    can_host: boolean;
}

interface AdminGradeAssignmentProps {
    crewId: string;
}

const avatarColors = [
    "bg-rh-accent/20 text-rh-accent",
    "bg-rh-status-success/20 text-rh-status-success",
    "bg-rh-status-error/20 text-rh-status-error",
    "bg-rh-status-warning/20 text-rh-status-warning",
    "bg-rh-bg-muted/40 text-rh-text-secondary",
];

function getAvatarColor(index: number): string {
    return avatarColors[index % avatarColors.length];
}

function getGradeName(grade: CrewGrade): string {
    return grade.name_override || grade.grades?.name || "등급 없음";
}

function triggerHaptic() {
    if (
        typeof navigator !== "undefined" &&
        "vibrate" in navigator
    ) {
        navigator.vibrate(10);
    }
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            {/* 검색바 스켈레톤 */}
            <div className="bg-rh-bg-surface rounded-lg h-10 animate-pulse" />
            {/* 멤버 카드 스켈레톤 */}
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-rh-bg-surface rounded-xl p-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rh-bg-muted animate-pulse" />
                        <div className="space-y-1.5">
                            <div className="w-20 h-3.5 bg-rh-bg-muted rounded animate-pulse" />
                            <div className="w-12 h-3 bg-rh-bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="w-24 h-7 bg-rh-bg-muted rounded-lg animate-pulse" />
                </div>
            ))}
        </div>
    );
}

export default function AdminGradeAssignment({
    crewId,
}: AdminGradeAssignmentProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [grades, setGrades] = useState<CrewGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [assigningUserId, setAssigningUserId] = useState<
        string | null
    >(null);

    const fetchData = useCallback(async () => {
        try {
            const [membersRes, gradesRes] = await Promise.all([
                fetch(
                    `/api/admin/crew-members?crewId=${crewId}`
                ),
                fetch(`/api/admin/grades?crewId=${crewId}`),
            ]);

            if (membersRes.ok) {
                const membersData = await membersRes.json();
                setMembers(
                    Array.isArray(membersData)
                        ? membersData
                        : membersData.data ?? []
                );
            }

            if (gradesRes.ok) {
                const gradesData = await gradesRes.json();
                const gradesList: CrewGrade[] = Array.isArray(
                    gradesData
                )
                    ? gradesData
                    : gradesData.data ?? [];
                gradesList.sort(
                    (a, b) => a.sort_order - b.sort_order
                );
                setGrades(gradesList);
            }
        } catch (error) {
            console.error(
                "등급 할당 데이터 로딩 실패:",
                error
            );
        } finally {
            setLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGradeAssign = async (
        userId: string,
        gradeId: number
    ) => {
        triggerHaptic();
        setAssigningUserId(userId);

        try {
            const res = await fetch(
                "/api/admin/grades/assign",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId,
                        crewId,
                        gradeId,
                    }),
                }
            );

            if (!res.ok) {
                console.error("등급 할당 실패");
                return;
            }

            await fetchData();
        } catch (error) {
            console.error("등급 할당 오류:", error);
        } finally {
            setAssigningUserId(null);
        }
    };

    const handleResetOverride = async (userId: string) => {
        triggerHaptic();
        setAssigningUserId(userId);

        try {
            const res = await fetch(
                "/api/admin/grades/reset-override",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId,
                        crewId,
                    }),
                }
            );

            if (!res.ok) {
                console.error("자동 계산 복원 실패");
                return;
            }

            await fetchData();
        } catch (error) {
            console.error("자동 계산 복원 오류:", error);
        } finally {
            setAssigningUserId(null);
        }
    };

    const filteredMembers = members.filter((member) =>
        member.first_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    const getMemberGrade = (
        member: Member
    ): CrewGrade | undefined => {
        if (!member.crew_grade_id) return undefined;
        return grades.find(
            (g) => g.id === member.crew_grade_id
        );
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-3">
            {/* 검색바 */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rh-text-tertiary" />
                <input
                    type="text"
                    placeholder="멤버 검색..."
                    value={searchQuery}
                    onChange={(e) =>
                        setSearchQuery(e.target.value)
                    }
                    className="bg-rh-bg-surface rounded-lg px-3.5 py-2.5 pl-10 text-sm text-white w-full placeholder:text-rh-text-tertiary outline-none focus:ring-1 focus:ring-rh-accent/50 transition-all"
                />
            </div>

            {/* 멤버 수 */}
            <p className="text-rh-text-tertiary text-xs px-1">
                총 {filteredMembers.length}명
            </p>

            {/* 멤버 목록 */}
            <div className="space-y-2">
                {filteredMembers.map((member, index) => {
                    const memberGrade =
                        getMemberGrade(member);
                    const isAssigning =
                        assigningUserId === member.id;

                    return (
                        <div
                            key={member.id}
                            className="bg-rh-bg-surface rounded-xl p-3 flex items-center justify-between"
                        >
                            {/* 왼쪽: 아바타 + 이름 + 뱃지 */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* 아바타 */}
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${getAvatarColor(index)}`}
                                >
                                    {member.first_name.charAt(
                                        0
                                    )}
                                </div>

                                {/* 이름 + 뱃지 */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-white text-sm font-medium truncate">
                                            {
                                                member.first_name
                                            }
                                        </span>

                                        {/* 등급 뱃지 */}
                                        {memberGrade ? (
                                            <span className="bg-rh-accent/20 text-rh-accent rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                                                {getGradeName(
                                                    memberGrade
                                                )}
                                            </span>
                                        ) : (
                                            <span className="bg-rh-bg-muted rounded-full px-2 py-0.5 text-xs text-rh-text-secondary whitespace-nowrap">
                                                미지정
                                            </span>
                                        )}

                                        {/* 수동 오버라이드 뱃지 */}
                                        {member.grade_override && (
                                            <span className="bg-amber-500/10 rounded-full px-1.5 py-0.5 text-[9px] text-amber-400 font-semibold flex items-center gap-1 whitespace-nowrap">
                                                <Lock className="w-2.5 h-2.5" />
                                                수동
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 오른쪽: 드롭다운 + 복원 링크 */}
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                {/* 등급 드롭다운 */}
                                <div className="relative">
                                    <select
                                        value={
                                            member.crew_grade_id ??
                                            ""
                                        }
                                        onChange={(e) => {
                                            const gradeId =
                                                Number(
                                                    e.target
                                                        .value
                                                );
                                            if (gradeId) {
                                                handleGradeAssign(
                                                    member.id,
                                                    gradeId
                                                );
                                            }
                                        }}
                                        disabled={
                                            isAssigning
                                        }
                                        className="bg-rh-bg-primary border border-rh-border rounded-lg px-2.5 py-1.5 pr-7 text-xs text-rh-text-secondary appearance-none cursor-pointer outline-none focus:border-rh-accent/50 transition-colors disabled:opacity-50"
                                    >
                                        <option value="">
                                            등급 선택
                                        </option>
                                        {grades.map(
                                            (grade) => (
                                                <option
                                                    key={
                                                        grade.id
                                                    }
                                                    value={
                                                        grade.id
                                                    }
                                                >
                                                    {getGradeName(
                                                        grade
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rh-text-tertiary pointer-events-none" />
                                </div>

                                {/* 자동 계산 복원 링크 */}
                                {member.grade_override && (
                                    <button
                                        onClick={() =>
                                            handleResetOverride(
                                                member.id
                                            )
                                        }
                                        disabled={
                                            isAssigning
                                        }
                                        className="text-rh-accent text-[11px] font-medium hover:underline disabled:opacity-50 transition-opacity"
                                    >
                                        자동 계산 복원
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* 빈 상태 */}
                {filteredMembers.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-rh-text-tertiary text-sm">
                            {searchQuery
                                ? "검색 결과가 없습니다"
                                : "멤버가 없습니다"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
