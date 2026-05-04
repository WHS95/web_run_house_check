import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewSettingsData } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";

const PhotoComposer = dynamic(
    () => import("./_components/PhotoComposer"),
    {
        ssr: false,
        loading: () => <ComposerSkeleton />,
    },
);

export default async function PhotoCompositePage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <PageHeader
                title='단체 사진 합성'
                backLink='/admin2/menu'
                iconColor='white'
                backgroundColor='bg-rh-bg-primary'
            />
            <Suspense fallback={<ComposerSkeleton />}>
                <PhotoComposeData crewId={crewId} />
            </Suspense>
        </>
    );
}

async function PhotoComposeData({ crewId }: { crewId: string }) {
    const { crew } = await getCrewSettingsData(crewId);
    return (
        <PhotoComposer
            crewName={crew?.name ?? ""}
            crewLogoUrl={crew?.profile_image_url ?? null}
        />
    );
}

function ComposerSkeleton() {
    return (
        <div className='flex-1 px-4 pt-6 space-y-4'>
            <div className='h-64 rounded-xl bg-rh-bg-surface' />
            <div className='h-12 rounded-lg bg-rh-bg-surface' />
            <div className='h-12 rounded-lg bg-rh-bg-surface' />
        </div>
    );
}
