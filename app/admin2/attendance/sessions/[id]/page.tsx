import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAdminAuth } from '@/lib/admin2/auth';
import PageHeader from '@/components/organisms/common/PageHeader';
import { loadSessionDetailVM } from './_vm/loadSessionDetailVM';
import SessionCorrectionPanel from './_components/SessionCorrectionPanel';

export const metadata = { title: '세션 보정' };

export default async function Admin2SessionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { crewId } = await getAdminAuth();
    const { id } = await params;

    return (
        <>
            <PageHeader
                title="세션 보정"
                backLink="/admin2/attendance/sessions"
                iconColor="white"
                backgroundColor="bg-rh-bg-primary"
            />
            <Suspense fallback={<DetailSkeleton />}>
                <DetailServer sessionId={id} crewId={crewId} />
            </Suspense>
        </>
    );
}

async function DetailServer({
    sessionId,
    crewId,
}: {
    sessionId: string;
    crewId: string;
}) {
    const vm = await loadSessionDetailVM(sessionId, crewId);
    if (!vm) notFound();
    return <SessionCorrectionPanel vm={vm} />;
}

function DetailSkeleton() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-3">
            <div className="h-24 rounded-[12px] bg-rh-bg-surface" />
            <div className="h-12 rounded-[12px] bg-rh-bg-surface" />
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-16 rounded-[12px] bg-rh-bg-surface"
                    />
                ))}
            </div>
        </div>
    );
}
