"use client";

import { useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { AdminTabBar } from "@/app/admin2/components/ui";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { CrewLocationProvider } from "@/contexts/CrewLocationContext";
import { CrewMemberProvider } from "@/contexts/CrewMemberContext";
import FadeIn from "@/components/atoms/FadeIn";
import type {
    ActiveHoursSlot,
    TimeWindowMode,
} from "@/lib/domain/crew-settings/types";
import type { ChurnRulesInput } from "@/lib/domain/crew-settings/validators";

const LocationTab = dynamic(() => import("./tabs/LocationTab"), { ssr: true });
const MembersTab = dynamic(() => import("./tabs/MembersTab"), { ssr: true });
const InviteCodesTab = dynamic(() => import("./tabs/InviteCodesTab"), {
    ssr: true,
});
const TimeWindowTab = dynamic(() => import("./tabs/TimeWindowTab"), {
    ssr: true,
});
const ChurnRulesTab = dynamic(() => import("./tabs/ChurnRulesTab"), {
    ssr: true,
});

type TabKey =
    | "location"
    | "members"
    | "invites"
    | "time-window"
    | "churn-rules";

const TABS = [
    { key: "location", label: "장소" },
    { key: "time-window", label: "시간윈도우" },
    { key: "churn-rules", label: "이탈룰" },
    { key: "members", label: "운영진" },
    { key: "invites", label: "초대코드" },
];

interface SettingsManagementProps {
    crewId: string;
    initialLocations: CrewLocation[];
    locationBasedAttendance: boolean;
    initialAccuracyRange: number;
    allowUnregisteredLocation: boolean;
    initialTimeWindowMode: TimeWindowMode;
    initialActiveHours: ActiveHoursSlot[] | null;
    initialChurnRules: ChurnRulesInput;
    initialTab: string;
}

const SettingsManagement = memo(function SettingsManagement({
    crewId,
    initialLocations,
    locationBasedAttendance,
    initialAccuracyRange,
    allowUnregisteredLocation,
    initialTimeWindowMode,
    initialActiveHours,
    initialChurnRules,
    initialTab,
}: SettingsManagementProps) {
    const [activeTab, setActiveTab] = useState<TabKey>(
        (initialTab as TabKey) || "location",
    );

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key as TabKey);
    }, []);

    return (
        <CrewLocationProvider initialLocations={initialLocations}>
            <CrewMemberProvider initialMembers={[]}>
                {/* 탭 바 */}
                <div className='sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 px-4 pt-4 pb-2 bg-rh-bg-primary'>
                    <AdminTabBar
                        tabs={TABS}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />
                </div>

                {/* 탭 콘텐츠 */}
                <div className='px-4 py-4'>
                    <FadeIn key={activeTab}>
                        {activeTab === "location" && (
                            <LocationTab
                                crewId={crewId}
                                locationBasedAttendance={locationBasedAttendance}
                                initialAccuracyRange={initialAccuracyRange}
                                allowUnregisteredLocation={allowUnregisteredLocation}
                            />
                        )}
                        {activeTab === "time-window" && (
                            <TimeWindowTab
                                crewId={crewId}
                                initialMode={initialTimeWindowMode}
                                initialActiveHours={initialActiveHours}
                            />
                        )}
                        {activeTab === "churn-rules" && (
                            <ChurnRulesTab
                                crewId={crewId}
                                initial={initialChurnRules}
                            />
                        )}
                        {activeTab === "members" && <MembersTab crewId={crewId} />}
                        {activeTab === "invites" && <InviteCodesTab crewId={crewId} />}
                    </FadeIn>
                </div>
            </CrewMemberProvider>
        </CrewLocationProvider>
    );
});

export default SettingsManagement;
