import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewSettingsData } from "@/lib/admin2/queries";
import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import PlaceForm from "../components/PlaceForm";

export default async function EditPlacePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { crewId } = await getAdminAuth();
    const { id } = await params;

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="장소 수정"
                    backLink="/admin2/settings?tab=location"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <Suspense fallback={<PlaceFormSkeleton />}>
                <EditPlaceDataServer
                    crewId={crewId}
                    locationId={id}
                />
            </Suspense>
        </>
    );
}

async function EditPlaceDataServer({
    crewId,
    locationId,
}: {
    crewId: string;
    locationId: string;
}) {
    const supabase = await createClient();
    const [{ crew }, locationResult] = await Promise.all([
        getCrewSettingsData(crewId),
        supabase
            .schema("attendance")
            .from("crew_locations")
            .select("*")
            .eq("id", locationId)
            .eq("crew_id", crewId)
            .single(),
    ]);

    if (locationResult.error || !locationResult.data) {
        notFound();
    }

    return (
        <PlaceForm
            crewId={crewId}
            locationBasedAttendance={
                crew?.location_based_attendance || false
            }
            initialData={locationResult.data}
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
