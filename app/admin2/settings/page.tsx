import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewSettingsData } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import SettingsManagement from "./components/SettingsManagement";

export default async function Admin2SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;
    const activeTab = params.tab || "location";

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="설정"
                    backLink="/admin2"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <Suspense fallback={<SettingsSkeleton />}>
                <SettingsDataServer
                    crewId={crewId}
                    activeTab={activeTab}
                />
            </Suspense>
        </>
    );
}

async function SettingsDataServer({
    crewId,
    activeTab,
}: {
    crewId: string;
    activeTab: string;
}) {
    const { crew, locations } = await getCrewSettingsData(crewId);
    return (
        <SettingsManagement
            crewId={crewId}
            initialLocations={locations}
            locationBasedAttendance={
                crew?.location_based_attendance || false
            }
            initialTab={activeTab}
        />
    );
}

function SettingsSkeleton() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-3">
            <div className="bg-rh-bg-surface rounded-lg p-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex-1 h-10 bg-rh-bg-muted rounded-lg"
                    />
                ))}
            </div>
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="h-14 bg-rh-bg-surface rounded-[12px]"
                    />
                ))}
            </div>
        </div>
    );
}
