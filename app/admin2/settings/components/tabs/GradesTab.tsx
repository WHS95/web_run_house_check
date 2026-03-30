"use client";

import {
    memo,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    AdminTabBar,
    AdminBadge,
    AdminSearchBar,
    AdminSelect,
    AdminSmallButton,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import { haptic } from "@/lib/haptic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";

// ─── 타입 정의 ───
interface CrewGrade {
    id: number;
    crew_id: string;
    grade_id: number;
    name_override: string;
    min_attendance_count: number;
    min_hosting_count: number;
    promotion_period_type: string;
    sort_order: number;
    can_host: boolean;
    is_active: boolean;
}

interface Recommendation {
    user_id: string;
    user_name: string;
    current_grade_id: number;
    current_grade_name: string;
    recommended_grade_id: number;
    recommended_grade_name: string;
    attendance_count: number;
    hosting_count: number;
}

interface Member {
    id: string;
    first_name: string;
    email: string;
    crew_role: string;
    crew_grade_id?: number;
    grade_override?: boolean;
}

interface GradesTabProps {
    crewId: string;
}

const SUB_TABS = [
    { key: "settings", label: "등급 설정" },
    { key: "recommendations", label: "추진 확인" },
    { key: "assignment", label: "수동 지정" },
];

// ─── 메인 컴포넌트 ───
const GradesTab = memo(function GradesTab({
    crewId,
}: GradesTabProps) {
    const [subTab, setSubTab] = useState("settings");

    const handleSubTabChange = useCallback(
        (key: string) => {
            setSubTab(key);
        },
        []
    );

    return (
        <div className="space-y-4">
            <AdminTabBar
                tabs={SUB_TABS}
                activeTab={subTab}
                onTabChange={handleSubTabChange}
            />
            <FadeIn key={subTab}>
                {subTab === "settings" && (
                    <GradeSettings crewId={crewId} />
                )}
                {subTab === "recommendations" && (
                    <GradeRecommendations crewId={crewId} />
                )}
                {subTab === "assignment" && (
                    <GradeAssignment crewId={crewId} />
                )}
            </FadeIn>
        </div>
    );
});

// ─── 등급 설정 서브탭 ───
const GradeSettings = memo(function GradeSettings({
    crewId,
}: {
    crewId: string;
}) {
    const [grades, setGrades] = useState<CrewGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodType, setPeriodType] = useState("cumulative");
    const [showForm, setShowForm] = useState(false);
    const [editGrade, setEditGrade] =
        useState<CrewGrade | null>(null);
    const [form, setForm] = useState({
        name: "",
        minAttendance: "0",
        minHosting: "0",
        canHost: false,
    });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] =
        useState<CrewGrade | null>(null);

    const fetchGrades = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/admin/grades?crewId=${crewId}`
            );
            const result = await res.json();
            if (res.ok && result.success) {
                const data = result.data || [];
                setGrades(data);
                if (data.length > 0) {
                    setPeriodType(
                        data[0].promotion_period_type ||
                            "cumulative"
                    );
                }
            }
        } catch {
            // 무시
        } finally {
            setLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    // 등급 추가
    const handleAdd = useCallback(async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        haptic.medium();

        try {
            const res = await fetch("/api/admin/grades", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    crewId,
                    name_override: form.name.trim(),
                    min_attendance_count: parseInt(
                        form.minAttendance
                    ) || 0,
                    min_hosting_count: parseInt(
                        form.minHosting
                    ) || 0,
                    can_host: form.canHost,
                    promotion_period_type: periodType,
                    sort_order: grades.length + 1,
                }),
            });
            if (res.ok) {
                haptic.success();
                setShowForm(false);
                setForm({
                    name: "",
                    minAttendance: "0",
                    minHosting: "0",
                    canHost: false,
                });
                await fetchGrades();
            }
        } catch {
            haptic.error();
        } finally {
            setSaving(false);
        }
    }, [form, crewId, periodType, grades.length, fetchGrades]);

    // 등급 수정
    const handleEdit = useCallback(async () => {
        if (!editGrade || !form.name.trim()) return;
        setSaving(true);
        haptic.medium();

        try {
            const res = await fetch("/api/admin/grades", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    crewId,
                    gradeId: editGrade.id,
                    name_override: form.name.trim(),
                    min_attendance_count: parseInt(
                        form.minAttendance
                    ) || 0,
                    min_hosting_count: parseInt(
                        form.minHosting
                    ) || 0,
                    can_host: form.canHost,
                    promotion_period_type: periodType,
                }),
            });
            if (res.ok) {
                haptic.success();
                setEditGrade(null);
                setShowForm(false);
                setForm({
                    name: "",
                    minAttendance: "0",
                    minHosting: "0",
                    canHost: false,
                });
                await fetchGrades();
            }
        } catch {
            haptic.error();
        } finally {
            setSaving(false);
        }
    }, [editGrade, form, crewId, periodType, fetchGrades]);

    // 등급 삭제
    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        haptic.medium();

        try {
            const res = await fetch(
                `/api/admin/grades?crewId=${crewId}&gradeId=${deleteTarget.id}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                haptic.success();
                await fetchGrades();
            }
        } catch {
            haptic.error();
        } finally {
            setDeleteTarget(null);
        }
    }, [deleteTarget, crewId, fetchGrades]);

    // 편집 시작
    const startEdit = useCallback((g: CrewGrade) => {
        haptic.light();
        setEditGrade(g);
        setForm({
            name: g.name_override,
            minAttendance: String(g.min_attendance_count),
            minHosting: String(g.min_hosting_count),
            canHost: g.can_host,
        });
        setShowForm(true);
    }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
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
            {/* 승급 기준 기간 */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                    승급 기준 기간
                </span>
                <AdminSelect
                    value={periodType}
                    onChange={setPeriodType}
                    options={[
                        {
                            value: "cumulative",
                            label: "누적",
                        },
                        {
                            value: "monthly",
                            label: "월별",
                        },
                        {
                            value: "quarterly",
                            label: "분기별",
                        },
                    ]}
                />
            </div>

            {/* 등급 카드 목록 */}
            <AnimatedList className="space-y-3">
                {grades
                    .sort(
                        (a, b) =>
                            a.sort_order - b.sort_order
                    )
                    .map((grade) => (
                        <AnimatedItem key={grade.id}>
                            <GradeCard
                                grade={grade}
                                onEdit={startEdit}
                                onDelete={setDeleteTarget}
                            />
                        </AnimatedItem>
                    ))}
            </AnimatedList>

            {/* 등급 추가/수정 폼 */}
            {showForm ? (
                <div className="px-4 py-4 rounded-xl bg-rh-bg-surface border border-rh-accent space-y-3">
                    <h4 className="text-sm font-semibold text-white">
                        {editGrade
                            ? "등급 수정"
                            : "등급 추가"}
                    </h4>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                name: e.target.value,
                            }))
                        }
                        placeholder="등급 이름"
                        className="w-full h-11 px-4 rounded-lg bg-rh-bg-primary border border-rh-border text-sm text-white placeholder:text-rh-text-muted outline-none focus:border-rh-accent"
                    />
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-rh-text-secondary mb-1 block">
                                최소 참여
                            </label>
                            <input
                                type="number"
                                value={form.minAttendance}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        minAttendance:
                                            e.target.value,
                                    }))
                                }
                                className="w-full h-11 px-4 rounded-lg bg-rh-bg-primary border border-rh-border text-sm text-white outline-none focus:border-rh-accent"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-rh-text-secondary mb-1 block">
                                최소 개설
                            </label>
                            <input
                                type="number"
                                value={form.minHosting}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        minHosting:
                                            e.target.value,
                                    }))
                                }
                                className="w-full h-11 px-4 rounded-lg bg-rh-bg-primary border border-rh-border text-sm text-white outline-none focus:border-rh-accent"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.canHost}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    canHost:
                                        e.target.checked,
                                }))
                            }
                            className="w-4 h-4 rounded accent-rh-accent"
                        />
                        호스트 가능
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setEditGrade(null);
                                setForm({
                                    name: "",
                                    minAttendance: "0",
                                    minHosting: "0",
                                    canHost: false,
                                });
                            }}
                            className="flex-1 h-11 rounded-xl bg-rh-bg-muted text-sm font-medium text-white"
                        >
                            취소
                        </button>
                        <button
                            onClick={
                                editGrade
                                    ? handleEdit
                                    : handleAdd
                            }
                            disabled={saving}
                            className="flex-1 h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {saving
                                ? "저장 중..."
                                : editGrade
                                  ? "수정"
                                  : "추가"}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => {
                        haptic.light();
                        setShowForm(true);
                    }}
                    className="w-full h-12 rounded-xl bg-rh-accent text-sm font-semibold text-white"
                >
                    + 등급 추가
                </button>
            )}

            {/* 삭제 확인 */}
            <AdminAlertDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="등급을 삭제하시겠습니까?"
                description={
                    deleteTarget
                        ? `"${deleteTarget.name_override}" 등급이 삭제됩니다.`
                        : ""
                }
                confirmLabel="삭제"
                confirmVariant="danger"
            />
        </div>
    );
});

// 등급 카드
const GradeCard = memo(function GradeCard({
    grade,
    onEdit,
    onDelete,
}: {
    grade: CrewGrade;
    onEdit: (g: CrewGrade) => void;
    onDelete: (g: CrewGrade) => void;
}) {
    return (
        <div
            className="px-4 py-4 rounded-xl bg-rh-bg-surface space-y-2 active:scale-[0.98] transition-transform"
            onClick={() => onEdit(grade)}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rh-accent/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-rh-accent">
                        {grade.sort_order}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-bold text-white">
                        {grade.name_override}
                    </span>
                    {grade.can_host && (
                        <AdminBadge variant="outline">
                            호스트 가능
                        </AdminBadge>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(grade);
                    }}
                    className="text-xs text-rh-text-secondary"
                >
                    삭제
                </button>
            </div>
            <div className="flex gap-6 pl-11">
                <div>
                    <p className="text-[10px] text-rh-text-tertiary">
                        최소 참여
                    </p>
                    <p className="text-sm font-bold text-white">
                        {grade.min_attendance_count}회
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-rh-text-tertiary">
                        최소 개설
                    </p>
                    <p className="text-sm font-bold text-white">
                        {grade.min_hosting_count}회
                    </p>
                </div>
            </div>
        </div>
    );
});

// ─── 추진 확인 서브탭 ───
const GradeRecommendations = memo(
    function GradeRecommendations({
        crewId,
    }: {
        crewId: string;
    }) {
        const [recs, setRecs] = useState<Recommendation[]>(
            []
        );
        const [loading, setLoading] = useState(true);

        const fetchRecs = useCallback(async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/admin/grade-recommendations?crewId=${crewId}`
                );
                const result = await res.json();
                if (res.ok && result.success) {
                    setRecs(result.data || []);
                }
            } catch {
                // 무시
            } finally {
                setLoading(false);
            }
        }, [crewId]);

        useEffect(() => {
            fetchRecs();
        }, [fetchRecs]);

        // 개별 승인
        const handleApprove = useCallback(
            async (rec: Recommendation) => {
                haptic.medium();
                try {
                    const res = await fetch(
                        "/api/admin/grade-recommendations/approve",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                crewId,
                                userId: rec.user_id,
                                gradeId:
                                    rec.recommended_grade_id,
                            }),
                        }
                    );
                    if (res.ok) {
                        haptic.success();
                        setRecs((prev) =>
                            prev.filter(
                                (r) =>
                                    r.user_id !==
                                    rec.user_id
                            )
                        );
                    }
                } catch {
                    haptic.error();
                }
            },
            [crewId]
        );

        // 개별 거부
        const handleDeny = useCallback(
            async (rec: Recommendation) => {
                haptic.medium();
                try {
                    const res = await fetch(
                        "/api/admin/grade-recommendations/deny",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                crewId,
                                userId: rec.user_id,
                            }),
                        }
                    );
                    if (res.ok) {
                        haptic.success();
                        setRecs((prev) =>
                            prev.filter(
                                (r) =>
                                    r.user_id !==
                                    rec.user_id
                            )
                        );
                    }
                } catch {
                    haptic.error();
                }
            },
            [crewId]
        );

        // 전체 승인
        const handleApproveAll = useCallback(async () => {
            haptic.medium();
            try {
                const res = await fetch(
                    "/api/admin/grade-recommendations/approve-all",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({ crewId }),
                    }
                );
                if (res.ok) {
                    haptic.success();
                    setRecs([]);
                }
            } catch {
                haptic.error();
            }
        }, [crewId]);

        if (loading) {
            return (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-32 rounded-xl bg-rh-bg-surface"
                        />
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                            등급 변경 추천
                        </span>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rh-accent text-[10px] font-bold text-white">
                            {recs.length}
                        </span>
                    </div>
                    {recs.length > 0 && (
                        <button
                            onClick={handleApproveAll}
                            className="text-xs font-semibold text-rh-accent"
                        >
                            전체 승인
                        </button>
                    )}
                </div>

                {recs.length > 0 ? (
                    <AnimatedList className="space-y-3">
                        {recs.map((rec) => (
                            <AnimatedItem
                                key={rec.user_id}
                            >
                                <div className="px-4 py-4 rounded-xl bg-rh-bg-surface space-y-3">
                                    {/* 유저 정보 */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">
                                            {
                                                rec.user_name
                                            }
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <AdminBadge variant="muted">
                                                {
                                                    rec.current_grade_name
                                                }
                                            </AdminBadge>
                                            <span className="text-xs text-rh-text-muted">
                                                →
                                            </span>
                                            <AdminBadge variant="accent">
                                                {
                                                    rec.recommended_grade_name
                                                }
                                            </AdminBadge>
                                        </div>
                                    </div>

                                    {/* 통계 */}
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-[10px] text-rh-text-tertiary">
                                                참여 횟수
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {
                                                    rec.attendance_count
                                                }
                                                회
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-rh-text-tertiary">
                                                개설 횟수
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {
                                                    rec.hosting_count
                                                }
                                                회
                                            </p>
                                        </div>
                                    </div>

                                    {/* 버튼 */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleDeny(
                                                    rec
                                                )
                                            }
                                            className="flex-1 h-10 rounded-xl bg-rh-bg-muted text-sm font-medium text-white"
                                        >
                                            거부
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleApprove(
                                                    rec
                                                )
                                            }
                                            className="flex-1 h-10 rounded-xl bg-rh-accent text-sm font-semibold text-white"
                                        >
                                            승인
                                        </button>
                                    </div>
                                </div>
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-sm text-rh-text-secondary">
                            등급 변경 추천이 없습니다
                        </p>
                    </div>
                )}
            </div>
        );
    }
);

// ─── 수동 지정 서브탭 ───
const AVATAR_COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
];

function getColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = name.charCodeAt(i) + ((h << 5) - h);
    }
    return AVATAR_COLORS[
        Math.abs(h) % AVATAR_COLORS.length
    ];
}

const GradeAssignment = memo(function GradeAssignment({
    crewId,
}: {
    crewId: string;
}) {
    const [members, setMembers] = useState<Member[]>([]);
    const [grades, setGrades] = useState<CrewGrade[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // 데이터 로드
    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [membersRes, gradesRes] =
                    await Promise.all([
                        fetch(
                            `/api/admin/crew-members?crewId=${crewId}`
                        ),
                        fetch(
                            `/api/admin/grades?crewId=${crewId}`
                        ),
                    ]);
                const [mResult, gResult] = await Promise.all(
                    [membersRes.json(), gradesRes.json()]
                );
                if (mResult.success) {
                    setMembers(mResult.data || []);
                }
                if (gResult.success) {
                    setGrades(gResult.data || []);
                }
            } catch {
                // 무시
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [crewId]);

    // 등급 지정
    const handleAssign = useCallback(
        async (userId: string, gradeId: number) => {
            haptic.medium();
            try {
                const res = await fetch(
                    "/api/admin/grades/assign",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            crewId,
                            userId,
                            gradeId,
                        }),
                    }
                );
                if (res.ok) {
                    haptic.success();
                    setMembers((prev) =>
                        prev.map((m) =>
                            m.id === userId
                                ? {
                                      ...m,
                                      crew_grade_id:
                                          gradeId,
                                      grade_override: true,
                                  }
                                : m
                        )
                    );
                }
            } catch {
                haptic.error();
            }
        },
        [crewId]
    );

    // 자동 계산 복원
    const handleReset = useCallback(
        async (userId: string) => {
            haptic.medium();
            try {
                const res = await fetch(
                    "/api/admin/grades/reset-override",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            crewId,
                            userId,
                        }),
                    }
                );
                if (res.ok) {
                    haptic.success();
                    setMembers((prev) =>
                        prev.map((m) =>
                            m.id === userId
                                ? {
                                      ...m,
                                      grade_override: false,
                                  }
                                : m
                        )
                    );
                }
            } catch {
                haptic.error();
            }
        },
        [crewId]
    );

    const filtered = search
        ? members.filter((m) =>
              m.first_name
                  .toLowerCase()
                  .includes(search.toLowerCase())
          )
        : members;

    const getGradeName = (gradeId?: number) => {
        if (!gradeId) return "미지정";
        const g = grades.find((g) => g.id === gradeId);
        return g?.name_override || "미지정";
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-16 rounded-xl bg-rh-bg-surface"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AdminSearchBar
                value={search}
                onChange={setSearch}
                placeholder="검색어를 입력하세요"
            />

            <AnimatedList className="space-y-2">
                {filtered.map((m) => (
                    <AnimatedItem key={m.id}>
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-rh-bg-surface">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getColor(m.first_name)}`}
                                >
                                    {m.first_name.charAt(
                                        0
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">
                                            {
                                                m.first_name
                                            }
                                        </span>
                                        <AdminBadge
                                            variant={
                                                m.grade_override
                                                    ? "accent"
                                                    : "muted"
                                            }
                                        >
                                            {getGradeName(
                                                m.crew_grade_id
                                            )}
                                        </AdminBadge>
                                    </div>
                                    {m.grade_override && (
                                        <button
                                            onClick={() =>
                                                handleReset(
                                                    m.id
                                                )
                                            }
                                            className="text-[10px] text-rh-text-tertiary"
                                        >
                                            자동 계산 복원
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0">
                                <select
                                    value={
                                        m.crew_grade_id ||
                                        ""
                                    }
                                    onChange={(e) => {
                                        const val =
                                            e.target.value;
                                        if (val) {
                                            handleAssign(
                                                m.id,
                                                parseInt(
                                                    val
                                                )
                                            );
                                        }
                                    }}
                                    className="h-8 px-2 rounded-lg bg-rh-bg-primary border border-rh-border text-xs text-white appearance-none outline-none"
                                >
                                    <option value="">
                                        등급 선택
                                    </option>
                                    {grades.map((g) => (
                                        <option
                                            key={g.id}
                                            value={g.id}
                                        >
                                            {
                                                g.name_override
                                            }
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </AnimatedItem>
                ))}
            </AnimatedList>

            {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-rh-text-secondary">
                    {search
                        ? "검색 결과가 없습니다"
                        : "멤버가 없습니다"}
                </p>
            )}
        </div>
    );
});

export default GradesTab;
