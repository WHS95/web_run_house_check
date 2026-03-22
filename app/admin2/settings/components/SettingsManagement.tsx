"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminCrewMembersManagement from "@/components/organisms/AdminCrewMembersManagement";
import AdminInviteCodesManagement from "@/components/organisms/AdminInviteCodesManagement";
import CrewLocationManagement from "@/components/admin/locations/CrewLocationManagement";
import NaverMapLoader from "@/components/map/NaverMapLoader";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { CrewLocationProvider } from "@/contexts/CrewLocationContext";
import { CrewMemberProvider } from "@/contexts/CrewMemberContext";
import { haptic } from "@/lib/haptic";

type TabKey = "location" | "members" | "invites" | "grades";

const tabs: { key: TabKey; label: string }[] = [
    { key: "location", label: "장소" },
    { key: "members", label: "운영진" },
    { key: "invites", label: "초대코드" },
    { key: "grades", label: "등급" },
];

interface SettingsManagementProps {
    crewId: string;
    initialLocations: CrewLocation[];
    locationBasedAttendance: boolean;
    initialTab: string;
}

export default function SettingsManagement({
    crewId,
    initialLocations,
    locationBasedAttendance,
    initialTab,
}: SettingsManagementProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>(
        (initialTab as TabKey) || "location"
    );

    const handleTabChange = useCallback(
        (tab: TabKey) => {
            haptic.light();
            setActiveTab(tab);
            // 등급 탭은 별도 페이지로 이동
            if (tab === "grades") {
                router.push("/admin2/settings/grade");
                return;
            }
        },
        [router]
    );

    return (
        <CrewLocationProvider initialLocations={initialLocations}>
          <CrewMemberProvider initialMembers={[]}>
            <>
                {/* 탭 네비게이션 */}
                <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 px-4 pt-4 pb-2 bg-rh-bg-primary">
                    <div className="bg-rh-bg-surface rounded-lg p-1 flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all text-center ${
                                    activeTab === tab.key
                                        ? "bg-rh-accent text-white"
                                        : "text-rh-text-secondary hover:text-white"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="px-4 py-4">
                    {activeTab === "location" && (
                        <NaverMapLoader>
                            <CrewLocationManagement
                                crewId={crewId}
                                locationBasedAttendance={
                                    locationBasedAttendance
                                }
                            />
                        </NaverMapLoader>
                    )}

                    {activeTab === "members" && (
                        <AdminCrewMembersManagement crewId={crewId} />
                    )}

                    {activeTab === "invites" && (
                        <AdminInviteCodesManagement crewId={crewId} />
                    )}
                </div>
            </>
          </CrewMemberProvider>
        </CrewLocationProvider>
    );
}
