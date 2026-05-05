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
            <PageHeader
                title="설정"
                backLink="/admin2"
                iconColor="white"
                backgroundColor="bg-rh-bg-primary"
            />
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
    const crewRow = crew as
        | (typeof crew & {
              time_window_mode?: string | null;
              active_hours?: unknown;
              churn_baseline_weeks?: number | null;
              churn_min_baseline_rate?: number | string | null;
              churn_observation_weeks?: number | null;
              onboarding_window_weeks?: number | null;
              onboarding_min_count?: number | null;
          })
        | null;
    return (
        <SettingsManagement
            crewId={crewId}
            initialLocations={locations}
            locationBasedAttendance={
                crew?.location_based_attendance || false
            }
            initialAccuracyRange={
                crew?.accuracy_range ?? 200
            }
            allowUnregisteredLocation={
                crew?.allow_unregistered_location
                || false
            }
            initialTimeWindowMode={
                (crewRow?.time_window_mode as
                    | 'cluster_first'
                    | 'active_hours'
                    | 'anytime'
                    | null) ?? 'cluster_first'
            }
            initialActiveHours={
                Array.isArray(crewRow?.active_hours)
                    ? (crewRow?.active_hours as never)
                    : null
            }
            initialChurnRules={{
                churn_baseline_weeks:
                    crewRow?.churn_baseline_weeks ?? 4,
                churn_min_baseline_rate: Number(
                    crewRow?.churn_min_baseline_rate ?? 0.5,
                ),
                churn_observation_weeks:
                    crewRow?.churn_observation_weeks ?? 2,
                onboarding_window_weeks:
                    crewRow?.onboarding_window_weeks ?? 4,
                onboarding_min_count:
                    crewRow?.onboarding_min_count ?? 2,
            }}
            initialTab={activeTab}
        />
    );
}

function SettingsSkeleton() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-3">
            <div className="bg-rh-bg-surface rounded-lg p-1 flex gap-1">
                {[1, 2, 3].map((i) => (
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
