import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewSettingsData } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import PlaceForm from "../components/PlaceForm";

export default async function NewPlacePage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="장소 추가"
                    backLink="/admin2/settings?tab=location"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <Suspense fallback={<PlaceFormSkeleton />}>
                <NewPlaceDataServer crewId={crewId} />
            </Suspense>
        </>
    );
}

async function NewPlaceDataServer({
    crewId,
}: {
    crewId: string;
}) {
    const { crew } = await getCrewSettingsData(crewId);
    return (
        <PlaceForm
            crewId={crewId}
            locationBasedAttendance={
                crew?.location_based_attendance || false
            }
        />
    );
}

function PlaceFormSkeleton() {
    return (
        <div className="px-4 py-4 space-y-4">
            <div className="h-[52px] rounded-xl bg-rh-bg-surface" />
            <div className="h-[420px] rounded-xl bg-rh-bg-surface" />
        </div>
    );
}
