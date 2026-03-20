"use client";

import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    memo,
} from "react";
import dynamic from "next/dynamic";
import {
    Search,
    ChevronRight,
    Users,
    Crown,
    Shield,
} from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import PopupNotification, {
    NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── [bundle-dynamic-imports] 비활성 탭 lazy load ───

const InviteCodesTab = dynamic(
    () => import("./InviteCodesTab"),
    { loading: () => <TabLoading /> }
);

const PushTestTab = dynamic(
    () => import("./PushTestTab"),
    { loading: () => <TabLoading /> }
);

function TabLoading() {
    return (
        <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="sm" color="white" />
        </div>
    );
}

// ─── 타입 정의 ───

export interface Crew {
    id: string;
    name: string;
    description: string | null;
    profile_image_url: string | null;
    created_at: string;
    updated_at: string;
    member_count?: number;
}

export interface InviteCode {
    id: number;
    crew_id: string;
    invite_code: string;
    description: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    crew_name?: string;
}

interface CrewMember {
    id: string;
    first_name: string | null;
    email: string | null;
    crew_role: string;
    crew_name: string;
    crew_id: string;
}

// ─── 상수 (모듈 레벨 호이스트) ───

const INITIAL_COLORS = [
    "#669FF2",
    "#8BB5F5",
    "#5580C0",
    "#3E6496",
    "#4B7DC8",
] as const;

const TABS = [
    { id: "crews", label: "크루" },
    { id: "members", label: "멤버" },
    { id: "invite-codes", label: "초대코드" },
    { id: "push-test", label: "푸시" },
] as const;

function getInitialColor(index: number): string {
    return INITIAL_COLORS[index % INITIAL_COLORS.length];
}

function getCrewInitials(name: string): string {
    const chars = name.replace(/\s+/g, "");
    return chars.length >= 2
        ? chars.slice(0, 2).toUpperCase()
        : chars.toUpperCase() || "?";
}

// ─── 메인 컴포넌트 ───

export default function MasterPage() {
    const [crews, setCrews] = useState<Crew[]>([]);
    const [inviteCodes, setInviteCodes] = useState<
        InviteCode[]
    >([]);
    const [members, setMembers] = useState<CrewMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("crews");

    // 크루 생성 상태
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCrewName, setNewCrewName] = useState("");
    const [newCrewDesc, setNewCrewDesc] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // 멤버 탭 상태
    const [selectedCrewId, setSelectedCrewId] =
        useState("all");
    const [memberSearch, setMemberSearch] = useState("");

    // 알림 상태
    const [notification, setNotification] = useState<{
        message: string;
        type: NotificationType;
    } | null>(null);

    // [rerender-functional-setstate] 안정적 콜백
    const showNotification = useCallback(
        (message: string, type: NotificationType) => {
            setNotification({ message, type });
            setTimeout(() => setNotification(null), 3000);
        },
        []
    );

    // ─── [async-parallel] 데이터 병렬 로드 ───

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            // [async-parallel] 독립 요청 병렬 실행
            const [crewsRes, codesRes] = await Promise.all([
                fetch("/api/master/crews"),
                fetch("/api/master/invite-codes"),
            ]);

            let loadedCrews: Crew[] = [];

            if (crewsRes.ok) {
                const result = await crewsRes.json();
                if (result.success) {
                    loadedCrews = result.data || [];
                }
            }

            if (codesRes.ok) {
                const result = await codesRes.json();
                if (result.success) {
                    setInviteCodes(result.data || []);
                }
            }

            // 멤버 병렬 로드 + [js-combine-iterations] 단일 루프로 멤버 + 카운트 처리
            if (loadedCrews.length > 0) {
                const memberPromises = loadedCrews.map(
                    (crew) =>
                        fetch(
                            `/api/master/crew-members?crewId=${crew.id}`
                        )
                            .then((r) => r.json())
                            .then((result) => {
                                if (
                                    result.success &&
                                    result.data
                                ) {
                                    return result.data.map(
                                        (m: {
                                            id: string;
                                            first_name:
                                                | string
                                                | null;
                                            email:
                                                | string
                                                | null;
                                            crew_role: string;
                                        }) => ({
                                            id: m.id,
                                            first_name:
                                                m.first_name,
                                            email: m.email,
                                            crew_role:
                                                m.crew_role,
                                            crew_name:
                                                crew.name,
                                            crew_id: crew.id,
                                        })
                                    );
                                }
                                return [];
                            })
                            .catch(() => [])
                );

                const allMembers = (
                    await Promise.all(memberPromises)
                ).flat();
                setMembers(allMembers);

                // [js-combine-iterations] 단일 루프로 멤버 수 계산
                const memberCounts: Record<string, number> =
                    {};
                for (const m of allMembers) {
                    memberCounts[m.crew_id] =
                        (memberCounts[m.crew_id] || 0) + 1;
                }
                loadedCrews = loadedCrews.map((c) => ({
                    ...c,
                    member_count: memberCounts[c.id] || 0,
                }));
            }

            setCrews(loadedCrews);
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            showNotification(
                "데이터를 불러오는데 실패했습니다.",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    // ─── 탭 변경 (안정적 콜백) ───

    const handleTabChange = useCallback((tabId: string) => {
        haptic.light();
        setActiveTab(tabId);
    }, []);

    // ─── 크루 생성 (안정적 콜백) ───

    const handleCreateCrew = useCallback(async () => {
        if (!newCrewName.trim()) {
            showNotification(
                "크루 이름을 입력해주세요.",
                "error"
            );
            return;
        }
        setIsCreating(true);
        haptic.medium();
        try {
            const res = await fetch("/api/master/crews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newCrewName.trim(),
                    description: newCrewDesc.trim() || null,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                showNotification(
                    result.message ||
                        "크루 생성에 실패했습니다.",
                    "error"
                );
                return;
            }
            showNotification(
                `크루 "${newCrewName}"가 생성되었습니다.`,
                "success"
            );
            setNewCrewName("");
            setNewCrewDesc("");
            setShowCreateForm(false);
            loadData();
        } catch {
            showNotification(
                "크루 생성 중 오류가 발생했습니다.",
                "error"
            );
        } finally {
            setIsCreating(false);
        }
    }, [newCrewName, newCrewDesc, showNotification, loadData]);

    // ─── [rerender-memo] useMemo로 필터 결과 캐싱 ───

    const filteredMembers = useMemo(() => {
        const searchLower = memberSearch.toLowerCase();
        return members.filter((m) => {
            const matchesCrew =
                selectedCrewId === "all" ||
                m.crew_id === selectedCrewId;
            if (!matchesCrew) return false;
            if (!memberSearch) return true;
            return (
                m.first_name
                    ?.toLowerCase()
                    .includes(searchLower) ||
                m.email
                    ?.toLowerCase()
                    .includes(searchLower)
            );
        });
    }, [members, selectedCrewId, memberSearch]);

    // ─── 멤버 권한 변경 (안정적 콜백) ───

    const handleRoleChange = useCallback(
        async (
            crewId: string,
            userId: string,
            currentRole: string
        ) => {
            const newRole =
                currentRole === "CREW_MANAGER"
                    ? "MEMBER"
                    : "CREW_MANAGER";
            haptic.medium();
            try {
                const res = await fetch(
                    "/api/master/crew-members",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            crewId,
                            userId,
                            newRole,
                        }),
                    }
                );
                const result = await res.json();
                if (res.ok && result.success) {
                    // [rerender-functional-setstate]
                    setMembers((prev) =>
                        prev.map((m) =>
                            m.id === userId &&
                            m.crew_id === crewId
                                ? {
                                      ...m,
                                      crew_role: newRole,
                                  }
                                : m
                        )
                    );
                    const roleText =
                        newRole === "CREW_MANAGER"
                            ? "운영진"
                            : "일반 멤버";
                    showNotification(
                        `${roleText}로 권한이 변경되었습니다.`,
                        "success"
                    );
                } else {
                    showNotification(
                        result.message ||
                            "권한 변경에 실패했습니다.",
                        "error"
                    );
                }
            } catch {
                showNotification(
                    "권한 변경 중 오류가 발생했습니다.",
                    "error"
                );
            }
        },
        [showNotification]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── 렌더링 ───

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* 헤더 */}
            <div className="sticky top-0 z-50 shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="마스터 관리"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>

            {/* 탭바 */}
            <div className="shrink-0 px-4 pt-4">
                <div className="flex rounded-lg bg-rh-bg-surface p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() =>
                                handleTabChange(tab.id)
                            }
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? "bg-rh-accent text-white"
                                    : "text-rh-text-secondary"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 콘텐츠 — [rendering-conditional-render] 삼항 연산자 사용 */}
            <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoadingSpinner
                            size="sm"
                            color="white"
                        />
                    </div>
                ) : activeTab === "crews" ? (
                    <CrewsTab
                        crews={crews}
                        showCreateForm={showCreateForm}
                        setShowCreateForm={setShowCreateForm}
                        newCrewName={newCrewName}
                        setNewCrewName={setNewCrewName}
                        newCrewDesc={newCrewDesc}
                        setNewCrewDesc={setNewCrewDesc}
                        isCreating={isCreating}
                        handleCreateCrew={handleCreateCrew}
                    />
                ) : activeTab === "members" ? (
                    <MembersTab
                        crews={crews}
                        members={filteredMembers}
                        selectedCrewId={selectedCrewId}
                        setSelectedCrewId={setSelectedCrewId}
                        memberSearch={memberSearch}
                        setMemberSearch={setMemberSearch}
                        handleRoleChange={handleRoleChange}
                    />
                ) : activeTab === "invite-codes" ? (
                    <InviteCodesTab
                        crews={crews}
                        inviteCodes={inviteCodes}
                        showNotification={showNotification}
                        onDataRefresh={loadData}
                    />
                ) : (
                    <PushTestTab
                        showNotification={showNotification}
                    />
                )}
            </div>

            {/* 알림 */}
            {notification ? (
                <PopupNotification
                    isVisible={true}
                    message={notification.message}
                    type={notification.type}
                    duration={3000}
                    onClose={() => setNotification(null)}
                />
            ) : null}
        </div>
    );
}

// ─── [rerender-memo] 크루 카드 메모이제이션 ───

const CrewCard = memo(function CrewCard({
    crew,
    index,
}: {
    crew: Crew;
    index: number;
}) {
    const initials = getCrewInitials(crew.name);
    const color = getInitialColor(index);
    const createdDate = new Date(
        crew.created_at
    ).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    return (
        <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: "#2B3644" }}
        >
            <div
                className="flex items-center justify-center shrink-0 rounded-lg"
                style={{
                    width: 44,
                    height: 44,
                    backgroundColor: color,
                }}
            >
                <span className="text-[16px] font-bold text-white">
                    {initials}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white truncate">
                    {crew.name}
                </p>
                <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "#64748B" }}
                >
                    {crew.member_count ?? 0}명 · 활성 ·
                    생성일 {createdDate}
                </p>
            </div>
            <ChevronRight
                className="shrink-0"
                size={18}
                style={{ color: "#475569" }}
            />
        </div>
    );
});

// ─── [rerender-memo] 크루 탭 메모이제이션 ───

const CrewsTab = memo(function CrewsTab({
    crews,
    showCreateForm,
    setShowCreateForm,
    newCrewName,
    setNewCrewName,
    newCrewDesc,
    setNewCrewDesc,
    isCreating,
    handleCreateCrew,
}: {
    crews: Crew[];
    showCreateForm: boolean;
    setShowCreateForm: (v: boolean) => void;
    newCrewName: string;
    setNewCrewName: (v: string) => void;
    newCrewDesc: string;
    setNewCrewDesc: (v: string) => void;
    isCreating: boolean;
    handleCreateCrew: () => void;
}) {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white">
                    전체 크루
                </span>
                <button
                    onClick={() => {
                        haptic.light();
                        setShowCreateForm(!showCreateForm);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-rh-accent text-white active:opacity-80 transition-opacity"
                >
                    + 생성
                </button>
            </div>

            {showCreateForm ? (
                <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: "#2B3644" }}
                >
                    <Input
                        placeholder="크루 이름 *"
                        value={newCrewName}
                        onChange={(e) =>
                            setNewCrewName(e.target.value)
                        }
                        className="text-white bg-rh-bg-primary border-rh-border placeholder:text-rh-text-tertiary"
                    />
                    <Input
                        placeholder="크루 설명 (선택)"
                        value={newCrewDesc}
                        onChange={(e) =>
                            setNewCrewDesc(e.target.value)
                        }
                        className="text-white bg-rh-bg-primary border-rh-border placeholder:text-rh-text-tertiary"
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleCreateCrew}
                            disabled={
                                isCreating ||
                                !newCrewName.trim()
                            }
                            className="flex-1 bg-rh-accent hover:bg-rh-accent-hover text-white disabled:opacity-50"
                        >
                            {isCreating
                                ? "생성 중..."
                                : "크루 생성"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setShowCreateForm(false)
                            }
                            className="text-rh-text-secondary"
                        >
                            취소
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="space-y-2">
                {crews.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center py-12 rounded-xl"
                        style={{ backgroundColor: "#2B3644" }}
                    >
                        <Users
                            className="w-10 h-10 mb-2"
                            style={{ color: "#475569" }}
                        />
                        <p
                            className="text-sm"
                            style={{ color: "#64748B" }}
                        >
                            생성된 크루가 없습니다
                        </p>
                    </div>
                ) : (
                    crews.map((crew, index) => (
                        <CrewCard
                            key={crew.id}
                            crew={crew}
                            index={index}
                        />
                    ))
                )}
            </div>
        </div>
    );
});

// ─── [rerender-memo] 멤버 탭 메모이제이션 ───

const MembersTab = memo(function MembersTab({
    crews,
    members,
    selectedCrewId,
    setSelectedCrewId,
    memberSearch,
    setMemberSearch,
    handleRoleChange,
}: {
    crews: Crew[];
    members: CrewMember[];
    selectedCrewId: string;
    setSelectedCrewId: (v: string) => void;
    memberSearch: string;
    setMemberSearch: (v: string) => void;
    handleRoleChange: (
        crewId: string,
        userId: string,
        currentRole: string
    ) => void;
}) {
    return (
        <div className="space-y-4">
            <select
                value={selectedCrewId}
                onChange={(e) =>
                    setSelectedCrewId(e.target.value)
                }
                className="w-full h-11 rounded-lg px-4 text-white text-sm border"
                style={{
                    backgroundColor: "#2B3644",
                    borderColor: "#374151",
                }}
            >
                <option value="all">전체 크루</option>
                {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>

            <div className="relative">
                <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "#64748B" }}
                />
                <input
                    type="text"
                    placeholder="이름 또는 이메일 검색"
                    value={memberSearch}
                    onChange={(e) =>
                        setMemberSearch(e.target.value)
                    }
                    className="w-full h-11 rounded-lg pl-11 pr-4 text-white text-sm border"
                    style={{
                        backgroundColor: "#2B3644",
                        borderColor: "#374151",
                    }}
                />
            </div>

            <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white">
                    멤버 목록
                </span>
                <span
                    className="text-[13px]"
                    style={{ color: "#64748B" }}
                >
                    {members.length}명
                </span>
            </div>

            <div className="space-y-2">
                {members.length === 0 ? (
                    <div
                        className="flex items-center justify-center rounded-xl py-10"
                        style={{ backgroundColor: "#2B3644" }}
                    >
                        <p
                            className="text-sm"
                            style={{ color: "#64748B" }}
                        >
                            멤버가 없습니다
                        </p>
                    </div>
                ) : (
                    members.map((member) => (
                        <MemberRow
                            key={`${member.crew_id}-${member.id}`}
                            member={member}
                            handleRoleChange={
                                handleRoleChange
                            }
                        />
                    ))
                )}
            </div>
        </div>
    );
});

// ─── [rerender-memo] 멤버 행 메모이제이션 ───

const MemberRow = memo(function MemberRow({
    member,
    handleRoleChange,
}: {
    member: CrewMember;
    handleRoleChange: (
        crewId: string,
        userId: string,
        currentRole: string
    ) => void;
}) {
    const isManager = member.crew_role === "CREW_MANAGER";

    return (
        <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ backgroundColor: "#2B3644" }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                    style={{ backgroundColor: "#4C525E" }}
                >
                    <span className="text-sm font-semibold text-white">
                        {member.first_name?.charAt(0) ?? "?"}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                        {member.first_name ?? "이름없음"}
                    </p>
                    <p
                        className="text-xs truncate"
                        style={{ color: "#64748B" }}
                    >
                        {member.crew_name} ·{" "}
                        {isManager ? "운영진" : "일반"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={
                        isManager
                            ? {
                                  backgroundColor:
                                      "rgba(102, 159, 242, 0.2)",
                                  color: "#669FF2",
                              }
                            : {
                                  backgroundColor: "#4C525E",
                                  color: "#94A3B8",
                              }
                    }
                >
                    {isManager ? "크루장" : "일반"}
                </span>
                <button
                    onClick={() =>
                        handleRoleChange(
                            member.crew_id,
                            member.id,
                            member.crew_role
                        )
                    }
                    className="p-1.5 rounded-lg active:opacity-70 transition-opacity"
                >
                    {isManager ? (
                        <Shield
                            size={16}
                            style={{ color: "#3E6496" }}
                        />
                    ) : (
                        <Crown
                            size={16}
                            style={{ color: "#669FF2" }}
                        />
                    )}
                </button>
            </div>
        </div>
    );
});
