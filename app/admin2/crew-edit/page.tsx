import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import {
    getCrewSettingsData,
    getDashboardStats,
} from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import CrewEditForm from "./components/CrewEditForm";

export default async function AdminCrewEditPage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="크루 정보 편집"
                    backLink="/admin2/menu"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <Suspense fallback={<CrewEditSkeleton />}>
                <CrewEditDataServer crewId={crewId} />
            </Suspense>
        </>
    );
}

async function CrewEditDataServer({
    crewId,
}: {
    crewId: string;
}) {
    const [{ crew }, stats] = await Promise.all([
        getCrewSettingsData(crewId),
        getDashboardStats(crewId),
    ]);

    return (
        <CrewEditForm
            crewId={crewId}
            initialData={{
                name: crew?.name || "",
                description: crew?.description || "",
                region: crew?.region || "",
                maxMembers: crew?.max_members || 50,
                createdAt: crew?.created_at || "",
                currentMembers: stats.totalMembers,
                logoUrl: crew?.logo_url || null,
            }}
        />
    );
}

function CrewEditSkeleton() {
    return (
        <div className="flex-1 px-4 pt-6 space-y-5">
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-rh-bg-surface" />
                <div className="w-24 h-4 bg-rh-bg-surface rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                    <div className="w-16 h-3 bg-rh-bg-muted rounded" />
                    <div className="h-12 bg-rh-bg-surface rounded-lg" />
                </div>
            ))}
        </div>
    );
}
