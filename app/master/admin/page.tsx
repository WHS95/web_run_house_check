"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import PopupNotification, {
    NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import CrewManagement from "@/components/organisms/master/CrewManagement";
import InviteCodeManagement from "@/components/organisms/master/InviteCodeManagement";

interface Crew {
    id: string;
    name: string;
    description: string | null;
    profile_image_url: string | null;
    created_at: string;
    updated_at: string;
}

interface InviteCode {
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

const TABS = [
    { id: "crews", label: "크루" },
    { id: "members", label: "멤버" },
    { id: "invite-codes", label: "초대코드" },
];

export default function MasterAdminPage() {
    const [crews, setCrews] = useState<Crew[]>([]);
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
    const [members, setMembers] = useState<CrewMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("crews");

    // 멤버 탭 상태
    const [selectedCrewId, setSelectedCrewId] = useState<string>("all");
    const [memberSearch, setMemberSearch] = useState("");

    // 알림 상태
    const [notification, setNotification] = useState<{
        message: string;
        type: NotificationType;
    } | null>(null);

    // 알림 표시 함수
    const showNotification = (
        message: string,
        type: NotificationType
    ) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // 데이터 로드
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [crewsResponse, codesResponse] = await Promise.all([
                fetch("/api/master/crews"),
                fetch("/api/master/invite-codes"),
            ]);

            let loadedCrews: Crew[] = [];

            if (crewsResponse.ok) {
                const crewsResult = await crewsResponse.json();
                if (crewsResult.success) {
                    loadedCrews = crewsResult.data || [];
                    setCrews(loadedCrews);
                }
            }

            if (codesResponse.ok) {
                const codesResult = await codesResponse.json();
                if (codesResult.success) {
                    setInviteCodes(codesResult.data || []);
                }
            }

            // 모든 크루의 멤버 조회
            if (loadedCrews.length > 0) {
                const memberPromises = loadedCrews.map((crew) =>
                    fetch(
                        `/api/master/crew-members?crewId=${crew.id}`
                    )
                        .then((r) => r.json())
                        .then((result) => {
                            if (result.success && result.data) {
                                return result.data.map(
                                    (m: {
                                        id: string;
                                        first_name: string | null;
                                        email: string | null;
                                        crew_role: string;
                                    }) => ({
                                        id: m.id,
                                        first_name: m.first_name,
                                        email: m.email,
                                        crew_role: m.crew_role,
                                        crew_name: crew.name,
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
            }
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            showNotification(
                "데이터를 불러오는데 실패했습니다.",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // 탭 변경
    const handleTabChange = useCallback((tabId: string) => {
        haptic.light();
        setActiveTab(tabId);
    }, []);

    // 멤버 필터링
    const filteredMembers = members.filter((m) => {
        const matchesCrew =
            selectedCrewId === "all" ||
            m.crew_id === selectedCrewId;
        const matchesSearch =
            !memberSearch ||
            m.first_name
                ?.toLowerCase()
                .includes(memberSearch.toLowerCase()) ||
            m.email
                ?.toLowerCase()
                .includes(memberSearch.toLowerCase());
        return matchesCrew && matchesSearch;
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* 헤더 */}
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="마스터 관리"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>

            {/* 탭 바 */}
            <div className="px-4 pt-4">
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

            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoadingSpinner size="sm" color="white" />
                    </div>
                ) : (
                    <>
                        {/* 크루 탭 */}
                        {activeTab === "crews" && (
                            <CrewManagement
                                crews={crews}
                                onCrewCreated={loadData}
                                showNotification={
                                    showNotification
                                }
                            />
                        )}

                        {/* 멤버 탭 */}
                        {activeTab === "members" && (
                            <div className="space-y-4">
                                {/* 크루 선택 */}
                                <select
                                    value={selectedCrewId}
                                    onChange={(e) =>
                                        setSelectedCrewId(
                                            e.target.value
                                        )
                                    }
                                    className="w-full h-12 bg-rh-bg-surface border border-rh-border rounded-lg px-4 text-white text-sm"
                                >
                                    <option value="all">
                                        전체 크루
                                    </option>
                                    {crews.map((c) => (
                                        <option
                                            key={c.id}
                                            value={c.id}
                                        >
                                            {c.name}
                                        </option>
                                    ))}
                                </select>

                                {/* 검색 */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rh-text-tertiary" />
                                    <input
                                        type="text"
                                        placeholder="검색어를 입력하세요"
                                        value={memberSearch}
                                        onChange={(e) =>
                                            setMemberSearch(
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-12 bg-rh-bg-surface border border-rh-border rounded-lg pl-11 pr-4 text-white text-sm placeholder:text-rh-text-tertiary"
                                    />
                                </div>

                                {/* 헤더 */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-semibold text-white">
                                        멤버 목록
                                    </span>
                                    <span className="text-[13px] text-rh-text-tertiary">
                                        {filteredMembers.length}명
                                    </span>
                                </div>

                                {/* 멤버 리스트 */}
                                <div className="space-y-2">
                                    {filteredMembers.map(
                                        (member) => (
                                            <div
                                                key={`${member.crew_id}-${member.id}`}
                                                className="flex items-center justify-between rounded-lg bg-rh-bg-surface px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rh-bg-muted">
                                                        <span className="text-sm font-semibold text-white">
                                                            {member.first_name?.charAt(
                                                                0
                                                            ) ??
                                                                "?"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {member.first_name ??
                                                                "이름없음"}
                                                        </p>
                                                        <p className="text-xs text-rh-text-tertiary">
                                                            {
                                                                member.crew_name
                                                            }{" "}
                                                            ·{" "}
                                                            {member.crew_role ===
                                                            "CREW_MANAGER"
                                                                ? "운영진"
                                                                : "일반"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                                        member.crew_role ===
                                                        "CREW_MANAGER"
                                                            ? "bg-rh-accent/20 text-rh-accent"
                                                            : "bg-rh-bg-muted text-rh-text-secondary"
                                                    }`}
                                                >
                                                    {member.crew_role ===
                                                    "CREW_MANAGER"
                                                        ? "크루장"
                                                        : "일반"}
                                                </span>
                                            </div>
                                        )
                                    )}
                                    {filteredMembers.length ===
                                        0 && (
                                        <div className="flex items-center justify-center rounded-lg bg-rh-bg-surface py-10">
                                            <p className="text-sm text-rh-text-tertiary">
                                                멤버가 없습니다
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 초대코드 탭 */}
                        {activeTab === "invite-codes" && (
                            <InviteCodeManagement
                                crews={crews}
                                inviteCodes={inviteCodes}
                                onCodeCreated={loadData}
                                showNotification={
                                    showNotification
                                }
                            />
                        )}
                    </>
                )}
            </div>

            {/* 알림 */}
            {notification && (
                <PopupNotification
                    isVisible={!!notification}
                    message={notification.message}
                    type={notification.type}
                    duration={3000}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
}
