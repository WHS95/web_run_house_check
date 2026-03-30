"use client";

import { useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { AdminTabBar } from "@/app/admin2/components/ui";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { CrewLocationProvider } from "@/contexts/CrewLocationContext";
import { CrewMemberProvider } from "@/contexts/CrewMemberContext";
import FadeIn from "@/components/atoms/FadeIn";

const LocationTab = dynamic(
    () => import("./tabs/LocationTab"),
    { ssr: true }
);
const MembersTab = dynamic(
    () => import("./tabs/MembersTab"),
    { ssr: true }
);
const InviteCodesTab = dynamic(
    () => import("./tabs/InviteCodesTab"),
    { ssr: true }
);
const GradesTab = dynamic(
    () => import("./tabs/GradesTab"),
    { ssr: true }
);

type TabKey = "location" | "members" | "invites" | "grades";

const TABS = [
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

const SettingsManagement = memo(function SettingsManagement({
    crewId,
    initialLocations,
    locationBasedAttendance,
    initialTab,
}: SettingsManagementProps) {
    const [activeTab, setActiveTab] = useState<TabKey>(
        (initialTab as TabKey) || "location"
    );

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key as TabKey);
    }, []);

    return (
        <CrewLocationProvider initialLocations={initialLocations}>
            <CrewMemberProvider initialMembers={[]}>
                {/* 탭 바 */}
                <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 px-4 pt-4 pb-2 bg-rh-bg-primary">
                    <AdminTabBar
                        tabs={TABS}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />
                </div>

                {/* 탭 콘텐츠 */}
                <div className="px-4 py-4">
                    <FadeIn key={activeTab}>
                        {activeTab === "location" && (
                            <LocationTab
                                crewId={crewId}
                                locationBasedAttendance={
                                    locationBasedAttendance
                                }
                            />
                        )}
                        {activeTab === "members" && (
                            <MembersTab crewId={crewId} />
                        )}
                        {activeTab === "invites" && (
                            <InviteCodesTab crewId={crewId} />
                        )}
                        {activeTab === "grades" && (
                            <GradesTab crewId={crewId} />
                        )}
                    </FadeIn>
                </div>
            </CrewMemberProvider>
        </CrewLocationProvider>
    );
});

export default SettingsManagement;
